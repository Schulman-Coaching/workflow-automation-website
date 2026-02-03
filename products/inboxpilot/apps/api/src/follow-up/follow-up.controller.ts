import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { FollowUpService } from './follow-up.service';
import {
  CreateFollowUpRuleDto,
  UpdateFollowUpRuleDto,
  UpdateEmailFollowUpDto,
} from './dto/follow-up.dto';

interface AuthenticatedUser {
  userId: string;
  organizationId: string;
}

@Controller('follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  // Follow-Up Rules
  @Post('rules')
  async createRule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFollowUpRuleDto,
  ) {
    return this.followUpService.createRule(user.organizationId, user.userId, dto);
  }

  @Get('rules')
  async getRules(@CurrentUser() user: AuthenticatedUser) {
    return this.followUpService.getRules(user.organizationId, user.userId);
  }

  @Get('rules/:id')
  async getRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') ruleId: string,
  ) {
    return this.followUpService.getRuleById(ruleId, user.userId);
  }

  @Patch('rules/:id')
  async updateRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') ruleId: string,
    @Body() dto: UpdateFollowUpRuleDto,
  ) {
    return this.followUpService.updateRule(ruleId, user.userId, dto);
  }

  @Delete('rules/:id')
  async deleteRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') ruleId: string,
  ) {
    return this.followUpService.deleteRule(ruleId, user.userId);
  }

  // Follow-Up Emails
  @Get('emails')
  async getFollowUpEmails(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: 'pending' | 'due' | 'snoozed',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followUpService.getFollowUpEmails(user.organizationId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('emails/due')
  async getDueFollowUps(@CurrentUser() user: AuthenticatedUser) {
    return this.followUpService.getDueFollowUps(user.organizationId);
  }

  @Get('stats')
  async getFollowUpStats(@CurrentUser() user: AuthenticatedUser) {
    return this.followUpService.getFollowUpStats(user.organizationId);
  }

  @Patch('emails/:id')
  async updateEmailFollowUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') emailId: string,
    @Body() dto: UpdateEmailFollowUpDto,
  ) {
    return this.followUpService.updateEmailFollowUp(emailId, user.organizationId, dto);
  }

  @Post('emails/:id/snooze')
  async snoozeFollowUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') emailId: string,
    @Body('days') days: number,
  ) {
    return this.followUpService.snoozeFollowUp(emailId, user.organizationId, days);
  }

  @Post('emails/:id/complete')
  async completeFollowUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') emailId: string,
  ) {
    return this.followUpService.completeFollowUp(emailId, user.organizationId);
  }
}
