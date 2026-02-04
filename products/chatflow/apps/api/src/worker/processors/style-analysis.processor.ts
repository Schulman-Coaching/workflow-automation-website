import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AIService } from '../../ai/ai.service';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface StyleAnalysisJobData {
  userId: string;
  organizationId: string;
  accountId: string;
}

@Processor('style-analysis')
@Injectable()
export class StyleAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(StyleAnalysisProcessor.name);

  constructor(
    private aiService: AIService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<StyleAnalysisJobData>): Promise<any> {
    const { userId, organizationId, accountId } = job.data;
    this.logger.log(`Starting WhatsApp style analysis for user ${userId}`);

    try {
      await this.prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: { trainingStatus: 'analyzing' },
      });

      await this.aiService.analyzeWhatsAppStyle(userId, organizationId);

      await this.prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: { trainingStatus: 'completed' },
      });

      this.logger.log(`Completed WhatsApp style analysis for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed WhatsApp style analysis for user ${userId}`, error.stack);
      
      await this.prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: { trainingStatus: 'failed' },
      });
      
      throw error;
    }
  }
}
