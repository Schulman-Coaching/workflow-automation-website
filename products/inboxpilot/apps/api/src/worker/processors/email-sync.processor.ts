import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EmailService } from '@/email/email.service';
import { QUEUE_NAMES } from '../worker.module';
import { EmailSyncJobData, WorkerService } from '../worker.service';

interface RedisConnection {
  host: string;
  port: number;
}

@Injectable()
export class EmailSyncProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailSyncProcessor.name);
  private worker: Worker<EmailSyncJobData>;

  constructor(
    @Inject('REDIS_CONNECTION') private readonly redisConnection: RedisConnection,
    private prisma: PrismaService,
    private emailService: EmailService,
    private workerService: WorkerService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<EmailSyncJobData>(
      QUEUE_NAMES.EMAIL_SYNC,
      async (job) => this.process(job),
      {
        connection: this.redisConnection,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000, // Max 10 jobs per second
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Email sync job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Email sync job ${job?.id} failed: ${error.message}`);
    });

    this.logger.log('Email sync processor started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.logger.log('Email sync processor stopped');
  }

  private async process(job: Job<EmailSyncJobData>): Promise<{ synced: number; triaged: number }> {
    const { accountId, organizationId, fullSync } = job.data;
    this.logger.log(`Processing email sync for account ${accountId} (fullSync: ${fullSync})`);

    try {
      // Get account details
      const account = await this.prisma.emailAccount.findFirst({
        where: { id: accountId, organizationId, isActive: true },
      });

      if (!account) {
        this.logger.warn(`Account ${accountId} not found or inactive`);
        return { synced: 0, triaged: 0 };
      }

      // Sync emails using existing email service
      const result = await this.emailService.syncEmails(accountId, organizationId);

      // Get newly synced emails that haven't been triaged
      const untriagedEmails = await this.prisma.email.findMany({
        where: {
          emailAccountId: accountId,
          organizationId,
          aiProcessedAt: null,
        },
        select: { id: true },
        take: 50, // Process in batches
      });

      // Schedule triage for new emails
      if (untriagedEmails.length > 0) {
        await this.workerService.scheduleBatchTriage(
          untriagedEmails.map((e) => ({
            emailId: e.id,
            organizationId,
          })),
        );
      }

      this.logger.log(
        `Synced ${result.synced} emails, scheduled ${untriagedEmails.length} for triage`,
      );

      return { synced: result.synced, triaged: untriagedEmails.length };
    } catch (error) {
      this.logger.error(`Failed to sync emails for account ${accountId}`, error);
      throw error;
    }
  }
}
