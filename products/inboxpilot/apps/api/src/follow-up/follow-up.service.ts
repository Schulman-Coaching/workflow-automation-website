import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateFollowUpRuleDto,
  UpdateFollowUpRuleDto,
  UpdateEmailFollowUpDto,
  FollowUpConditionDto,
} from './dto/follow-up.dto';

@Injectable()
export class FollowUpService {
  constructor(private prisma: PrismaService) {}

  // Follow-Up Rules CRUD
  async createRule(
    organizationId: string,
    userId: string,
    dto: CreateFollowUpRuleDto,
  ) {
    // Validate conditions
    this.validateConditions(dto.conditions);

    return this.prisma.followUpRule.create({
      data: {
        organizationId,
        userId,
        name: dto.name,
        conditions: JSON.parse(JSON.stringify(dto.conditions)) as Prisma.InputJsonValue,
        followUpDays: dto.followUpDays ?? 3,
        reminderTemplate: dto.reminderTemplate,
      },
    });
  }

  async getRules(organizationId: string, userId: string) {
    return this.prisma.followUpRule.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRuleById(ruleId: string, userId: string) {
    const rule = await this.prisma.followUpRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new NotFoundException('Follow-up rule not found');
    }

    return rule;
  }

  async updateRule(ruleId: string, userId: string, dto: UpdateFollowUpRuleDto) {
    const rule = await this.prisma.followUpRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new NotFoundException('Follow-up rule not found');
    }

    if (dto.conditions) {
      this.validateConditions(dto.conditions);
    }

    return this.prisma.followUpRule.update({
      where: { id: ruleId },
      data: {
        name: dto.name,
        conditions: dto.conditions
          ? (JSON.parse(JSON.stringify(dto.conditions)) as Prisma.InputJsonValue)
          : undefined,
        followUpDays: dto.followUpDays,
        reminderTemplate: dto.reminderTemplate,
        isActive: dto.isActive,
      },
    });
  }

  async deleteRule(ruleId: string, userId: string) {
    const rule = await this.prisma.followUpRule.findFirst({
      where: { id: ruleId, userId },
    });

    if (!rule) {
      throw new NotFoundException('Follow-up rule not found');
    }

    await this.prisma.followUpRule.delete({
      where: { id: ruleId },
    });

    return { success: true };
  }

  // Email Follow-Up Status
  async getFollowUpEmails(
    organizationId: string,
    options: {
      status?: 'pending' | 'due' | 'snoozed';
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { status, page = 1, limit = 50 } = options;

    const where: Record<string, unknown> = {
      organizationId,
      followUpStatus: status ? status : { not: 'none' },
    };

    const [emails, total] = await Promise.all([
      this.prisma.email.findMany({
        where,
        orderBy: [
          { followUpDueAt: 'asc' },
          { receivedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          subject: true,
          fromAddress: true,
          fromName: true,
          receivedAt: true,
          followUpStatus: true,
          followUpDueAt: true,
          aiCategory: true,
          aiPriority: true,
          aiSuggestedAction: true,
          emailAccount: {
            select: {
              id: true,
              emailAddress: true,
            },
          },
        },
      }),
      this.prisma.email.count({ where }),
    ]);

    return {
      emails,
      meta: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    };
  }

  async getDueFollowUps(organizationId: string) {
    return this.prisma.email.findMany({
      where: {
        organizationId,
        followUpStatus: 'due',
        followUpDueAt: { lte: new Date() },
      },
      orderBy: { followUpDueAt: 'asc' },
      select: {
        id: true,
        subject: true,
        fromAddress: true,
        fromName: true,
        receivedAt: true,
        followUpDueAt: true,
        aiSuggestedAction: true,
        emailAccount: {
          select: {
            id: true,
            emailAddress: true,
          },
        },
      },
    });
  }

  async updateEmailFollowUp(
    emailId: string,
    organizationId: string,
    dto: UpdateEmailFollowUpDto,
  ) {
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, organizationId },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return this.prisma.email.update({
      where: { id: emailId },
      data: {
        followUpStatus: dto.status,
        followUpDueAt: dto.dueAt,
      },
    });
  }

  async snoozeFollowUp(emailId: string, organizationId: string, days: number) {
    if (days < 1 || days > 30) {
      throw new BadRequestException('Snooze duration must be between 1 and 30 days');
    }

    const email = await this.prisma.email.findFirst({
      where: { id: emailId, organizationId },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + days);

    return this.prisma.email.update({
      where: { id: emailId },
      data: {
        followUpStatus: 'snoozed',
        followUpDueAt: newDueDate,
      },
    });
  }

  async completeFollowUp(emailId: string, organizationId: string) {
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, organizationId },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return this.prisma.email.update({
      where: { id: emailId },
      data: {
        followUpStatus: 'completed',
      },
    });
  }

  async getFollowUpStats(organizationId: string) {
    const [pending, due, snoozed, completed] = await Promise.all([
      this.prisma.email.count({
        where: { organizationId, followUpStatus: 'pending' },
      }),
      this.prisma.email.count({
        where: { organizationId, followUpStatus: 'due' },
      }),
      this.prisma.email.count({
        where: { organizationId, followUpStatus: 'snoozed' },
      }),
      this.prisma.email.count({
        where: { organizationId, followUpStatus: 'completed' },
      }),
    ]);

    return {
      pending,
      due,
      snoozed,
      completed,
      total: pending + due + snoozed,
    };
  }

  private validateConditions(conditions: FollowUpConditionDto[]) {
    if (!conditions || conditions.length === 0) {
      throw new BadRequestException('At least one condition is required');
    }

    const validTypes = ['sender_domain', 'subject_contains', 'category', 'no_reply_within'];
    const validCategories = ['urgent', 'action_required', 'fyi', 'newsletter', 'spam'];

    for (const condition of conditions) {
      if (!validTypes.includes(condition.type)) {
        throw new BadRequestException(`Invalid condition type: ${condition.type}`);
      }

      if (condition.type === 'category' && !validCategories.includes(condition.value)) {
        throw new BadRequestException(`Invalid category: ${condition.value}`);
      }
    }
  }
}
