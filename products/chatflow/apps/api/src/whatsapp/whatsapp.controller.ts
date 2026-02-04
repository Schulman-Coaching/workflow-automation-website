import { Controller, Post, Body, Get, Query, Headers, Req, UnauthorizedException, Logger } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private whatsappService: WhatsAppService,
    private configService: ConfigService,
  ) {}

  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = this.configService.get<string>('whatsapp.verifyToken');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified successfully');
      return challenge;
    }

    this.logger.warn('WhatsApp webhook verification failed');
    throw new UnauthorizedException('Invalid verification token');
  }

  @Post('webhook')
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
    @Req() request: Request,
  ) {
    // In production, we should verify the signature
    const isProduction = this.configService.get('app.env') === 'production';
    
    if (isProduction || signature) {
      const rawBody = (request as any).rawBody?.toString();
      if (!rawBody || !signature || !this.whatsappService.verifySignature(rawBody, signature)) {
        this.logger.warn('WhatsApp webhook signature verification failed');
        throw new UnauthorizedException('Invalid signature');
      }
    }

    await this.whatsappService.processWebhookPayload(payload);
    return { success: true };
  }
}
