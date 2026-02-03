import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AIService, DraftOptions } from './ai.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '@/auth/decorators/current-user.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('triage')
  async triageEmails(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { emailIds: string[] },
  ) {
    const results = await this.aiService.triageEmails(
      body.emailIds,
      user.organizationId,
    );
    return { success: true, data: results };
  }

  @Post('draft')
  async generateDraft(
    @CurrentUser() user: CurrentUserData,
    @Body()
    body: {
      emailId: string;
      tone: DraftOptions['tone'];
      intent: DraftOptions['intent'];
      context?: string;
    },
  ) {
    const result = await this.aiService.generateDraft(
      body.emailId,
      user.organizationId,
      user.id,
      {
        tone: body.tone,
        intent: body.intent,
        context: body.context,
      },
    );
    return { success: true, data: result };
  }

  @Post('summarize')
  async summarizeEmail(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { emailId: string },
  ) {
    const summary = await this.aiService.summarizeEmail(
      body.emailId,
      user.organizationId,
    );
    return { success: true, data: { summary } };
  }

  @Get('health')
  async checkHealth() {
    const health = await this.aiService.checkHealth();
    return { success: true, data: health };
  }
}
