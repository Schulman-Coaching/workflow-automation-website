import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AIService } from '@/ai/ai.service';
import { QUEUE_NAMES } from '../worker.module';
import { EmailTriageJobData } from '../worker.service';

interface RedisConnection {
  host: string;
  port: number;
}

@Injectable()
export class EmailTriageProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailTriageProcessor.name);
  private worker: Worker<EmailTriageJobData>;

  constructor(
    @Inject('REDIS_CONNECTION') private readonly redisConnection: RedisConnection,
    private prisma: PrismaService,
    private aiService: AIService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<EmailTriageJobData>(
      QUEUE_NAMES.EMAIL_TRIAGE,
      async (job) => this.process(job),
      {
        connection: this.redisConnection,
        concurrency: 3, // Limit concurrency for AI processing
        limiter: {
          max: 5,
          duration: 1000, // Max 5 triage operations per second
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Email triage job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Email triage job ${job?.id} failed: ${error.message}`);
    });

    this.logger.log('Email triage processor started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.logger.log('Email triage processor stopped');
  }

  private async process(job: Job<EmailTriageJobData>) {
    const { emailId, organizationId } = job.data;
    this.logger.log(`Processing triage for email ${emailId}`);

    try {
      // Check if already processed
      const email = await this.prisma.email.findFirst({
        where: { id: emailId, organizationId },
        select: { id: true, aiProcessedAt: true, subject: true },
      });

      if (!email) {
        this.logger.warn(`Email ${emailId} not found`);
        return { skipped: true, reason: 'not_found' };
      }

      if (email.aiProcessedAt) {
        this.logger.debug(`Email ${emailId} already triaged`);
        return { skipped: true, reason: 'already_processed' };
      }

      // Check AI availability
      const aiHealth = await this.aiService.checkHealth();
      if (!aiHealth.available) {
        this.logger.warn('AI service unavailable, skipping triage');
        throw new Error('AI service unavailable');
      }

      // Perform triage
      const result = await this.aiService.triageEmail(emailId, organizationId);

      this.logger.log(
        `Email ${emailId} triaged: category=${result.category}, priority=${result.priority}`,
      );

      // Track usage
      await this.incrementUsage(organizationId, 'aiRequestsCount');

      return {
        success: true,
        category: result.category,
        priority: result.priority,
      };
    } catch (error) {
      this.logger.error(`Failed to triage email ${emailId}`, error);
      throw error;
    }
  }

  private async incrementUsage(organizationId: string, field: 'aiRequestsCount') {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await this.prisma.usageRecord.upsert({
      where: {
        id: `${organizationId}-${periodStart.toISOString().slice(0, 7)}`,
      },
      create: {
        id: `${organizationId}-${periodStart.toISOString().slice(0, 7)}`,
        organizationId,
        periodStart,
        periodEnd,
        [field]: 1,
      },
      update: {
        [field]: { increment: 1 },
      },
    });
  }
}
