import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './worker.module';

interface RedisConnection {
  host: string;
  port: number;
}

export interface EmailSyncJobData {
  accountId: string;
  organizationId: string;
  fullSync?: boolean;
}

export interface EmailTriageJobData {
  emailId: string;
  organizationId: string;
}

export interface EmailHistoryJobData {
  accountId: string;
  organizationId: string;
  lookbackDays: number;
}

export interface StyleAnalysisJobData {
  userId: string;
  organizationId: string;
}

export interface FollowUpJobData {
  organizationId: string;
}

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);

  private emailSyncQueue: Queue<EmailSyncJobData>;
  private emailTriageQueue: Queue<EmailTriageJobData>;
  private emailHistoryQueue: Queue<EmailHistoryJobData>;
  private styleAnalysisQueue: Queue<StyleAnalysisJobData>;
  private followUpQueue: Queue<FollowUpJobData>;

  constructor(
    @Inject('REDIS_CONNECTION') private readonly redisConnection: RedisConnection,
  ) {}

  async onModuleInit() {
    this.emailSyncQueue = new Queue(QUEUE_NAMES.EMAIL_SYNC, {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    this.emailTriageQueue = new Queue(QUEUE_NAMES.EMAIL_TRIAGE, {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 3000,
        },
      },
    });

    this.emailHistoryQueue = new Queue(QUEUE_NAMES.EMAIL_HISTORY, {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 200,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    });

    this.styleAnalysisQueue = new Queue(QUEUE_NAMES.STYLE_ANALYSIS, {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 200,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    });

    this.followUpQueue = new Queue(QUEUE_NAMES.FOLLOW_UP, {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 200,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
      },
    });

    this.logger.log('Worker queues initialized');

    // Set up recurring jobs
    await this.setupRecurringJobs();
  }

  async onModuleDestroy() {
    await Promise.all([
      this.emailSyncQueue?.close(),
      this.emailTriageQueue?.close(),
      this.emailHistoryQueue?.close(),
      this.styleAnalysisQueue?.close(),
      this.followUpQueue?.close(),
    ]);
    this.logger.log('Worker queues closed');
  }

  private async setupRecurringJobs() {
    // Check and process follow-ups every hour
    await this.followUpQueue.upsertJobScheduler(
      'follow-up-check',
      { pattern: '0 * * * *' }, // Every hour
      {
        name: 'check-follow-ups',
        data: { organizationId: '*' }, // Will process all organizations
      },
    );

    this.logger.log('Recurring jobs scheduled');
  }

  // Email Sync Jobs
  async scheduleEmailSync(data: EmailSyncJobData): Promise<string> {
    const job = await this.emailSyncQueue.add('sync-emails', data, {
      jobId: `sync-${data.accountId}-${Date.now()}`,
    });
    this.logger.debug(`Scheduled email sync job ${job.id} for account ${data.accountId}`);
    return job.id!;
  }

  async scheduleRecurringEmailSync(accountId: string, organizationId: string): Promise<void> {
    await this.emailSyncQueue.upsertJobScheduler(
      `recurring-sync-${accountId}`,
      { pattern: '*/5 * * * *' }, // Every 5 minutes
      {
        name: 'sync-emails',
        data: { accountId, organizationId, fullSync: false },
      },
    );
    this.logger.log(`Scheduled recurring sync for account ${accountId}`);
  }

  async removeRecurringEmailSync(accountId: string): Promise<void> {
    await this.emailSyncQueue.removeJobScheduler(`recurring-sync-${accountId}`);
    this.logger.log(`Removed recurring sync for account ${accountId}`);
  }

  // Email History Jobs
  async scheduleHistoryIngestion(data: EmailHistoryJobData): Promise<string> {
    const job = await this.emailHistoryQueue.add('ingest-history', data, {
      jobId: `history-${data.accountId}-${Date.now()}`,
    });
    this.logger.debug(`Scheduled history ingestion job ${job.id} for account ${data.accountId}`);
    return job.id!;
  }

  // Style Analysis Jobs
  async scheduleStyleAnalysis(data: StyleAnalysisJobData): Promise<string> {
    const job = await this.styleAnalysisQueue.add('analyze-style', data, {
      jobId: `style-${data.userId}-${Date.now()}`,
    });
    this.logger.debug(`Scheduled style analysis job ${job.id} for user ${data.userId}`);
    return job.id!;
  }

  // Email Triage Jobs
  async scheduleEmailTriage(data: EmailTriageJobData): Promise<string> {
    const job = await this.emailTriageQueue.add('triage-email', data, {
      jobId: `triage-${data.emailId}`,
    });
    this.logger.debug(`Scheduled triage job ${job.id} for email ${data.emailId}`);
    return job.id!;
  }

  async scheduleBatchTriage(emails: { emailId: string; organizationId: string }[]): Promise<void> {
    const jobs = emails.map((email) => ({
      name: 'triage-email',
      data: email,
      opts: { jobId: `triage-${email.emailId}` },
    }));
    await this.emailTriageQueue.addBulk(jobs);
    this.logger.log(`Scheduled batch triage for ${emails.length} emails`);
  }

  // Follow-Up Jobs
  async scheduleFollowUpCheck(organizationId: string): Promise<string> {
    const job = await this.followUpQueue.add(
      'check-follow-ups',
      { organizationId },
      { jobId: `followup-check-${organizationId}-${Date.now()}` },
    );
    this.logger.debug(`Scheduled follow-up check for org ${organizationId}`);
    return job.id!;
  }

  // Queue Stats
  async getQueueStats() {
    const [syncCounts, triageCounts, historyCounts, styleCounts, followUpCounts] = await Promise.all([
      this.emailSyncQueue.getJobCounts(),
      this.emailTriageQueue.getJobCounts(),
      this.emailHistoryQueue.getJobCounts(),
      this.styleAnalysisQueue.getJobCounts(),
      this.followUpQueue.getJobCounts(),
    ]);

    return {
      emailSync: syncCounts,
      emailTriage: triageCounts,
      emailHistory: historyCounts,
      styleAnalysis: styleCounts,
      followUp: followUpCounts,
    };
  }
}
