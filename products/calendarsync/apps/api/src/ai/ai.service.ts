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

  async generateBookingDescription(
    userName: string,
    meetingTitle: string,
    profile: StyleProfile,
  ): Promise<string> {
    const prompt = `userName: "${userName}", meetingTitle: "${meetingTitle}". 
    Draft a short (1-2 sentences), highly inviting booking page description for this meeting. 
    It should sound like the user is speaking directly to a valued client or partner. 
    Avoid generic robotic filler.`;
    const fullPrompt = this.injectStyle(prompt, profile);

    // Call Ollama for generation (placeholder for actual implementation)
    return "This is an AI generated booking description matching your unique conversational style.";
  }
}
