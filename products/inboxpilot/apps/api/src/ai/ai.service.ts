import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { OllamaService } from './ollama.service';

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
export class AIService {
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
  ) {}

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

  async generateDraft(
    emailId: string,
    organizationId: string,
    userId: string,
    options: DraftOptions,
  ): Promise<{ draftId: string; content: string }> {
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, organizationId },
      include: { emailAccount: true },
    });

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

    const prompt = `Original Email:
From: ${email.fromName || ''} <${email.fromAddress}>
Subject: ${email.subject || '(no subject)'}
Body:
${email.bodyText || email.snippet || ''}

---

Write a reply with:
- Tone: ${options.tone}
- Intent: ${intentInstructions[options.intent]}
${options.context ? `- Additional context: ${options.context}` : ''}

Write only the email body.`;

    const response = await this.ollamaService.generate(prompt, this.DRAFT_SYSTEM_PROMPT, {
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
