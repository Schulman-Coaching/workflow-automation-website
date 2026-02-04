import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { OllamaService } from './ollama.service';
import { UserVoiceService } from '@flowstack/ai';
import { ConfigService } from '@nestjs/config';

export interface TriageResult {
  category: 'urgent' | 'action_required' | 'fyi' | 'newsletter' | 'spam';
  priority: number;
  summary: string;
  suggestedAction: string;
}

export interface DraftOptions {
  tone: 'professional' | 'casual' | 'formal';
  intent: 'accept' | 'decline' | 'follow_up' | 'info_request' | 'thank_you' | 'custom';
  context?: string;
}

@Injectable()
export class AIService extends UserVoiceService {
  private readonly logger = new Logger(AIService.name);

  private readonly TRIAGE_SYSTEM_PROMPT = `You are an email triage assistant for a busy professional.
Analyze emails and categorize them by importance and required action.

Categories:
- urgent: Requires immediate response (within hours)
- action_required: Needs response but not immediately (within 1-2 days)
- fyi: Informational, no response needed
- newsletter: Marketing/promotional content
- spam: Unwanted or suspicious content

Also assign a priority score from 1-5 (5 being highest priority).

Consider these factors:
- Sender relationship (known contacts rank higher)
- Keywords indicating urgency ("urgent", "deadline", "ASAP")
- Questions or action requests
- Time-sensitive content

Respond ONLY with valid JSON, no other text:
{"category": "urgent|action_required|fyi|newsletter|spam", "priority": 1-5, "summary": "one sentence", "suggestedAction": "brief action"}`;

  private readonly DRAFT_SYSTEM_PROMPT = `You are a professional email writing assistant.
Generate email responses that match the specified tone and intent.

Guidelines:
- Keep responses concise but complete
- Match the formality level requested
- Be helpful and professional
- Include specific details from the original email when relevant
- End with a clear call-to-action when appropriate

Write ONLY the email body text. Do not include subject line, greeting, or signature unless specifically appropriate.`;

  constructor(
    private prisma: PrismaService,
    private ollamaService: OllamaService,
    private config: ConfigService,
  ) {
    super(config.get<string>('ai.ollama.baseUrl', 'http://localhost:11434'));
  }

  async triageEmail(emailId: string, organizationId: string): Promise<TriageResult> {
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, organizationId },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    const prompt = `Analyze this email:

From: ${email.fromName || ''} <${email.fromAddress}>
Subject: ${email.subject || '(no subject)'}
Preview: ${email.snippet || email.bodyText?.substring(0, 500) || ''}

Respond with JSON only.`;

    const response = await this.ollamaService.generate(prompt, this.TRIAGE_SYSTEM_PROMPT, {
      useCache: true,
      cacheTtl: 86400, // 24 hours
    });

    try {
      const result = JSON.parse(response.content) as TriageResult;

      // Update email with AI results
      await this.prisma.email.update({
        where: { id: emailId },
        data: {
          aiCategory: result.category,
          aiPriority: result.priority,
          aiSummary: result.summary,
          aiSuggestedAction: result.suggestedAction,
          aiProcessedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to parse triage response', error);
      throw new Error('Failed to process email triage');
    }
  }

  async triageEmails(emailIds: string[], organizationId: string): Promise<TriageResult[]> {
    const results: TriageResult[] = [];

    for (const emailId of emailIds) {
      try {
        const result = await this.triageEmail(emailId, organizationId);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to triage email ${emailId}`, error);
      }
    }

    return results;
  }

  async analyzeUserStyle(userId: string, organizationId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      include: { organization: true }
    });

    const sentEmails = await this.prisma.email.findMany({
      where: {
        emailAccount: { userId },
        organizationId,
        fromAddress: { contains: user?.email },
      },
      orderBy: { receivedAt: 'desc' },
      take: 50,
      select: {
        bodyText: true,
        subject: true,
      },
    });

    if (sentEmails.length === 0) {
      return { status: 'no_history' };
    }

    const trainingData = sentEmails.map(e => ({
      content: `Subject: ${e.subject}\nBody: ${e.bodyText}`,
    }));

    // CUSTOMIZATION FOR YOSSI NEWMAN / MBA SUPPLY
    // We can pull these from the User settings or hardcode a "Master Logic"
    const context = {
      bio: `${user?.name}, Founder of ${user?.organization?.name}`,
      industry: (user?.settings as any)?.industry || 'General Business',
    };

    const styleProfile = await this.analyzeStyle(trainingData, context);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        styleProfile: styleProfile as any,
      },
    });

    return styleProfile;
  }

  async generateDraft(
    emailId: string,
    organizationId: string,
    userId: string,
    options: DraftOptions,
  ): Promise<{ draftId: string; content: string }> {
    const [email, user] = await Promise.all([
      this.prisma.email.findFirst({
        where: { id: emailId, organizationId },
        include: { emailAccount: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { styleProfile: true },
      }),
    ]);

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    const intentInstructions: Record<string, string> = {
      accept: 'Write a positive response accepting the request/invitation',
      decline: 'Write a polite decline with brief reasoning',
      follow_up: 'Write a follow-up asking for status or more information',
      info_request: 'Write a response requesting specific information',
      thank_you: 'Write a thank you response',
      custom: options.context || 'Write an appropriate response',
    };

    let styleContext = '';
    if (user?.styleProfile && Object.keys(user.styleProfile as any).length > 0) {
      const sp = user.styleProfile as any;
      styleContext = `
Use the following style profile to match the user's voice:
- Common Greetings: ${sp.greetings?.join(', ') || 'N/A'}
- Common Sign-offs: ${sp.signOffs?.join(', ') || 'N/A'}
- Preferred Tone: ${sp.tone || 'N/A'}
- Formality Level: ${sp.formality || 'N/A'}
- Typical Phrases: ${sp.commonPhrases?.join(', ') || 'N/A'}
- Style Summary: ${sp.styleSummary || 'N/A'}
`;
    }

    const prompt = `Original Email:
From: ${email.fromName || ''} <${email.fromAddress}>
Subject: ${email.subject || '(no subject)'}
Body:
${email.bodyText || email.snippet || ''}

---

Write a reply with:
- Intent: ${intentInstructions[options.intent]}
${options.context ? `- Additional context: ${options.context}` : ''}

Write only the email body.`;

    const fullPrompt = user?.styleProfile 
      ? this.injectStyle(prompt, user.styleProfile as any)
      : prompt;

    const response = await this.ollamaService.generate(fullPrompt, this.DRAFT_SYSTEM_PROMPT, {
      useCache: false, // Don't cache drafts
    });

    // Save draft
    const draft = await this.prisma.emailDraft.create({
      data: {
        organizationId,
        userId,
        emailAccountId: email.emailAccountId,
        replyToEmailId: email.id,
        subject: `Re: ${email.subject || ''}`,
        bodyText: response.content,
        toAddresses: [{ email: email.fromAddress, name: email.fromName }],
        aiGenerated: true,
        aiPromptUsed: options.intent,
      },
    });

    return {
      draftId: draft.id,
      content: response.content,
    };
  }

  async summarizeEmail(emailId: string, organizationId: string): Promise<string> {
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, organizationId },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    const prompt = `Summarize this email in 2-3 sentences:

From: ${email.fromName || ''} <${email.fromAddress}>
Subject: ${email.subject || '(no subject)'}
Body:
${email.bodyText || email.bodyHtml?.replace(/<[^>]*>/g, '') || email.snippet || ''}`;

    const systemPrompt = 'You are a concise summarizer. Provide brief, accurate summaries that capture the key points. Respond with only the summary, no preamble.';

    const response = await this.ollamaService.generate(prompt, systemPrompt, {
      useCache: true,
      cacheTtl: 3600, // 1 hour
    });

    return response.content;
  }

  async checkHealth(): Promise<{ available: boolean; model: string }> {
    const available = await this.ollamaService.isAvailable();
    return {
      available,
      model: available ? 'ollama' : 'unavailable',
    };
  }
}
