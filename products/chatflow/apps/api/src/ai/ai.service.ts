import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserVoiceService, TrainingDataPoint } from '@flowstack/ai';
import { StyleProfile } from '@flowstack/common';

@Injectable()
export class AIService extends UserVoiceService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    super(config.get<string>('ai.ollamaUrl', 'http://localhost:11434'));
  }

  async analyzeWhatsAppStyle(userId: string, organizationId: string): Promise<StyleProfile> {
    const messages = await this.prisma.whatsAppMessage.findMany({
      where: {
        whatsAppAccount: {
          organizationId,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const trainingData: TrainingDataPoint[] = messages.map(m => ({
      content: m.body,
    }));

    const profile = await this.analyzeStyle(trainingData);

    await this.prisma.user.update({
      where: { id: userId },
      data: { styleProfile: profile as any },
    });

    return profile;
  }

  async generateWhatsAppReply(
    incomingMessage: string,
    profile: StyleProfile,
  ): Promise<string> {
    const prompt = `The user received this WhatsApp message: "${incomingMessage}". Draft a reply in their voice.`;
    const fullPrompt = this.injectStyle(prompt, profile);

    // Call Ollama for generation (similar to analysis)
    // For now, returning a placeholder or calling a local method
    return "This is an AI generated reply in your voice.";
  }
}
