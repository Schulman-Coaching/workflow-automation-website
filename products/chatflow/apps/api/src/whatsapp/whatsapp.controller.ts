import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { AIService } from '../ai/ai.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private aiService: AIService,
    private prisma: PrismaService,
  ) {}

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    // In a real app, verify the signature from Meta
    const { from, body, whatsappAccountId } = payload;
    
    // Save message
    const message = await this.prisma.whatsappMessage.create({
      data: {
        from,
        body,
        whatsappAccountId,
        timestamp: new Date(),
      }
    });

    // Auto-reply logic could go here
    return { success: true };
  }

  @Post('accounts/:id/train')
  async triggerTraining(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('organizationId') organizationId: string,
  ) {
    // In a real app, get these from the request context (JWT)
    await this.aiService.analyzeWhatsAppStyle(userId, organizationId);
    return { success: true, message: 'WhatsApp style analysis completed' };
  }
}
