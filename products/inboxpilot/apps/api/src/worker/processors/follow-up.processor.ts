import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '@/common/prisma/prisma.service';
import { QUEUE_NAMES } from '../worker.module';
import { FollowUpJobData } from '../worker.service';

interface RedisConnection {
  host: string;
  port: number;
}

interface FollowUpCondition {
  type: 'sender_domain' | 'subject_contains' | 'category' | 'no_reply_within';
  value: string | number;
}

@Injectable()
export class FollowUpProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FollowUpProcessor.name);
  private worker: Worker<FollowUpJobData>;

  constructor(
    @Inject('REDIS_CONNECTION') private readonly redisConnection: RedisConnection,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.worker = new Worker<FollowUpJobData>(
      QUEUE_NAMES.FOLLOW_UP,
      async (job) => this.process(job),
      {
        connection: this.redisConnection,
        concurrency: 2,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Follow-up job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Follow-up job ${job?.id} failed: ${error.message}`);
    });

    this.logger.log('Follow-up processor started');
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.logger.log('Follow-up processor stopped');
  }

  private async process(job: Job<FollowUpJobData>) {
    const { organizationId } = job.data;
    this.logger.log(`Processing follow-ups for org ${organizationId === '*' ? 'all' : organizationId}`);

    try {
      // Get organizations to process
      const organizations = organizationId === '*'
        ? await this.prisma.organization.findMany({ select: { id: true } })
        : [{ id: organizationId }];

      let totalUpdated = 0;
      let totalDue = 0;

      for (const org of organizations) {
        const result = await this.processOrganizationFollowUps(org.id);
        totalUpdated += result.updated;
        totalDue += result.due;
      }

      this.logger.log(`Follow-up check complete: ${totalUpdated} emails updated, ${totalDue} due`);

      return { updated: totalUpdated, due: totalDue };
    } catch (error) {
      this.logger.error(`Failed to process follow-ups`, error);
      throw error;
    }
  }

  private async processOrganizationFollowUps(organizationId: string) {
    // Get active follow-up rules for this organization
    const rules = await this.prisma.followUpRule.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            emailAccounts: {
              select: { id: true },
            },
          },
        },
      },
    });

    let updated = 0;
    let due = 0;

    for (const rule of rules) {
      const accountIds = rule.user.emailAccounts.map((a) => a.id);
      if (accountIds.length === 0) continue;

      // Find emails matching conditions
      const matchingEmails = await this.findMatchingEmails(
        organizationId,
        accountIds,
        rule.conditions as unknown as FollowUpCondition[],
        rule.followUpDays,
      );

      for (const email of matchingEmails) {
        const followUpDate = new Date(email.receivedAt);
        followUpDate.setDate(followUpDate.getDate() + rule.followUpDays);

        await this.prisma.email.update({
          where: { id: email.id },
          data: {
            followUpStatus: 'pending',
            followUpDueAt: followUpDate,
          },
        });
        updated++;
      }

      // Check for overdue follow-ups
      const overdueEmails = await this.prisma.email.findMany({
        where: {
          organizationId,
          emailAccountId: { in: accountIds },
          followUpStatus: 'pending',
          followUpDueAt: { lte: new Date() },
        },
      });

      for (const email of overdueEmails) {
        await this.prisma.email.update({
          where: { id: email.id },
          data: {
            followUpStatus: 'due',
          },
        });
        due++;
      }
    }

    return { updated, due };
  }

  private async findMatchingEmails(
    organizationId: string,
    accountIds: string[],
    conditions: FollowUpCondition[],
    followUpDays: number,
  ) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - followUpDays);

    // Base query: emails without follow-up status
    const baseWhere: Record<string, any> = {
      organizationId,
      emailAccountId: { in: accountIds },
      followUpStatus: 'none',
      receivedAt: { lte: cutoffDate },
    };

    let hasCategoryCondition = false;

    // Apply conditions
    for (const condition of conditions) {
      switch (condition.type) {
        case 'sender_domain':
          baseWhere.fromAddress = { contains: condition.value as string };
          break;
        case 'subject_contains':
          baseWhere.subject = { contains: condition.value as string, mode: 'insensitive' };
          break;
        case 'category':
          baseWhere.aiCategory = condition.value;
          hasCategoryCondition = true;
          break;
        case 'no_reply_within':
          const replyCutoff = new Date();
          replyCutoff.setDate(replyCutoff.getDate() - (condition.value as number));
          baseWhere.receivedAt = { lte: replyCutoff };
          break;
      }
    }

    // If no explicit category condition, default to urgent/action_required
    if (!hasCategoryCondition) {
      baseWhere.OR = [
        { aiCategory: 'action_required' },
        { aiCategory: 'urgent' },
      ];
    }

    return this.prisma.email.findMany({
      where: baseWhere,
      select: {
        id: true,
        receivedAt: true,
      },
      take: 100, // Process in batches
    });
  }
}
