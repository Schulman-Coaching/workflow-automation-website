import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { AIModule } from '../ai/ai.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [AIModule, PrismaModule],
  controllers: [WhatsAppController],
})
export class WhatsAppModule {}
