import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AIService } from '@/ai/ai.service';
import { QUEUE_NAMES } from '../worker.module';
import { StyleAnalysisJobData } from '../worker.service';

interface RedisConnection {
  host: string;
  port: number;
}

@Injectable()
export class StyleAnalysisProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StyleAnalysisProcessor.name);
  private worker: Worker<StyleAnalysisJobData>;

  constructor(
    @Inject('REDIS_CONNECTION') private readonly redisConnection: RedisConnection,
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<StyleAnalysisJobData>(
      QUEUE_NAMES.STYLE_ANALYSIS,
      async (job) => this.process(job),
      {
        connection: this.redisConnection,
        concurrency: 1,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Style analysis job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Style analysis job ${job?.id} failed: ${error.message}`);
    });

    this.logger.log('Style analysis processor started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.logger.log('Style analysis processor stopped');
  }

  private async process(job: Job<StyleAnalysisJobData>) {
    const { userId, organizationId } = job.data;
    this.logger.log(`Processing style analysis for user ${userId}`);

    try {
      const result = await this.aiService.analyzeUserStyle(userId, organizationId);

      await this.prisma.emailAccount.updateMany({
        where: { userId, organizationId },
        data: { trainingStatus: 'completed' },
      });

      this.logger.log(`Style analysis complete for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to analyze style for user ${userId}`, error);
      await this.prisma.emailAccount.updateMany({
        where: { userId, organizationId },
        data: { trainingStatus: 'failed' },
      });
      throw error;
    }
  }
}
