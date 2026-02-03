import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EmailService } from '@/email/email.service';
import { QUEUE_NAMES } from '../worker.module';
import { EmailHistoryJobData, WorkerService } from '../worker.service';

interface RedisConnection {
  host: string;
  port: number;
}

@Injectable()
export class EmailHistoryProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailHistoryProcessor.name);
  private worker: Worker<EmailHistoryJobData>;

  constructor(
    @Inject('REDIS_CONNECTION') private readonly redisConnection: RedisConnection,
    private prisma: PrismaService,
    private emailService: EmailService,
    private workerService: WorkerService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<EmailHistoryJobData>(
      QUEUE_NAMES.EMAIL_HISTORY,
      async (job) => this.process(job),
      {
        connection: this.redisConnection,
        concurrency: 2,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`History ingestion job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`History ingestion job ${job?.id} failed: ${error.message}`);
    });

    this.logger.log('Email history processor started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.logger.log('Email history processor stopped');
  }

  private async process(job: Job<EmailHistoryJobData>) {
    const { accountId, organizationId, lookbackDays } = job.data;
    this.logger.log(`Processing history ingestion for account ${accountId} (days: ${lookbackDays})`);

    try {
      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: { trainingStatus: 'ingesting' },
      });

      const result = await this.emailService.syncEmails(accountId, organizationId, lookbackDays);

      this.logger.log(`Ingested ${result.synced} historical emails for account ${accountId}`);

      const account = await this.prisma.emailAccount.findUnique({
        where: { id: accountId },
        select: { userId: true },
      });

      if (account) {
        await this.prisma.emailAccount.update({
          where: { id: accountId },
          data: { trainingStatus: 'analyzing' },
        });

        await this.workerService.scheduleStyleAnalysis({
          userId: account.userId,
          organizationId,
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to ingest history for account ${accountId}`, error);
      await this.prisma.emailAccount.update({
        where: { id: accountId },
        data: { trainingStatus: 'failed' },
      });
      throw error;
    }
  }
}
