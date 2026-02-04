import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  verifySignature(payload: string, signature: string): boolean {
    const secret = this.configService.get<string>('whatsapp.webhookSecret');
    if (!secret) {
      this.logger.warn('WhatsApp webhook secret not configured');
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  }

  async sendMessage(phoneNumberId: string, to: string, message: string) {
    const accessToken = this.configService.get<string>('whatsapp.accessToken');
    const apiUrl = this.configService.get<string>('whatsapp.apiUrl', 'https://graph.facebook.com/v18.0');

    try {
      const response = await axios.post(
        `${apiUrl}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error sending WhatsApp message: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async processWebhookPayload(payload: any) {
    if (payload.object !== 'whatsapp_business_account') {
      return;
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        if (!value.messages) continue;

        for (const message of value.messages) {
          if (message.type !== 'text') continue;

          const from = message.from;
          const body = message.text.body;
          const timestamp = new Date(parseInt(message.timestamp) * 1000);
          const whatsappAccountId = entry.id; // Business Account ID

          // Find the internal account by phone number or business ID
          // For now, we'll try to find it by business ID or mapping
          // In a real scenario, you'd have a mapping of phoneNumberId to organization
          const account = await this.prisma.whatsappAccount.findFirst({
            where: {
              OR: [
                { id: whatsappAccountId }, // If we store business ID as account ID
                { syncState: { path: ['phoneNumberId'], equals: value.metadata.phone_number_id } }
              ]
            }
          });

          if (account) {
            await this.prisma.whatsappMessage.create({
              data: {
                from,
                body,
                whatsappAccountId: account.id,
                timestamp,
              },
            });
            
            this.logger.log(`Received message from ${from}: ${body}`);

            // Trigger AI auto-reply
            try {
              const user = await this.prisma.user.findFirst({
                where: { organizationId: account.organizationId }
              });

              if (user && user.styleProfile) {
                const reply = await this.aiService.generateWhatsAppReply(
                  body,
                  user.styleProfile as any
                );

                // For now, we'll just log it or save as draft
                // To actually send: 
                // await this.sendMessage(value.metadata.phone_number_id, from, reply);
                
                this.logger.log(`Generated AI reply for ${from}: ${reply}`);
              }
            } catch (aiError) {
              this.logger.error(`Failed to generate AI reply: ${aiError.message}`);
            }
          }
        }
      }
    }
  }
}
