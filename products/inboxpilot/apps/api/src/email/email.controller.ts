import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { WorkerService } from '@/worker/worker.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Public } from '@/auth/decorators/public.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '@/auth/decorators/current-user.decorator';

@Controller()
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly workerService: WorkerService,
  ) {}

  // OAuth Routes
  @UseGuards(JwtAuthGuard)
  @Get('oauth/gmail/url')
  getGmailOAuthUrl(@CurrentUser() user: CurrentUserData) {
    const url = this.emailService.getOAuthUrl(
      'gmail',
      user.id,
      user.organizationId,
    );
    return { success: true, data: { url } };
  }

  @Public()
  @Get('oauth/gmail/callback')
  async gmailCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const account = await this.emailService.handleOAuthCallback('gmail', code, state);
      
      // Schedule background history ingestion for new account
      await this.workerService.scheduleHistoryIngestion({
        accountId: account.id,
        organizationId: account.organizationId,
        lookbackDays: 90, // Start with 90 days for training
      });

      const webUrl = this.configService.get<string>('app.webUrl');
      res.redirect(`${webUrl}/settings/email-accounts?connected=gmail`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const webUrl = this.configService.get<string>('app.webUrl');
      res.redirect(`${webUrl}/settings/email-accounts?error=oauth_failed`);
    }
  }

  // Outlook OAuth Routes
  @UseGuards(JwtAuthGuard)
  @Get('oauth/outlook/url')
  getOutlookOAuthUrl(@CurrentUser() user: CurrentUserData) {
    const url = this.emailService.getOAuthUrl(
      'outlook',
      user.id,
      user.organizationId,
    );
    return { success: true, data: { url } };
  }

  @Public()
  @Get('oauth/outlook/callback')
  async outlookCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const account = await this.emailService.handleOAuthCallback('outlook', code, state);

      // Schedule background history ingestion for new account
      await this.workerService.scheduleHistoryIngestion({
        accountId: account.id,
        organizationId: account.organizationId,
        lookbackDays: 90,
      });

      const webUrl = this.configService.get<string>('app.webUrl');
      res.redirect(`${webUrl}/settings/email-accounts?connected=outlook`);
    } catch (error) {
      console.error('Outlook OAuth callback error:', error);
      const webUrl = this.configService.get<string>('app.webUrl');
      res.redirect(`${webUrl}/settings/email-accounts?error=oauth_failed`);
    }
  }

  // Email Account Routes
  @UseGuards(JwtAuthGuard)
  @Get('email-accounts')
  async getEmailAccounts(@CurrentUser() user: CurrentUserData) {
    const accounts = await this.emailService.getEmailAccounts(
      user.organizationId,
    );
    return { success: true, data: accounts };
  }

  @UseGuards(JwtAuthGuard)
  @Post('email-accounts/:id/train')
  async triggerTraining(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body('lookbackDays') lookbackDays: number = 90,
  ) {
    await this.workerService.scheduleHistoryIngestion({
      accountId: id,
      organizationId: user.organizationId,
      lookbackDays,
    });
    return { success: true, data: { message: 'Training scheduled' } };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('email-accounts/:id')
  async disconnectAccount(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.emailService.disconnectAccount(id, user.organizationId);
    return { success: true, data: { message: 'Account disconnected' } };
  }

  @UseGuards(JwtAuthGuard)
  @Post('email-accounts/:id/sync')
  async syncAccount(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const result = await this.emailService.syncEmails(id, user.organizationId);
    return { success: true, data: result };
  }

  // Email Routes
  @UseGuards(JwtAuthGuard)
  @Get('emails')
  async getEmails(
    @CurrentUser() user: CurrentUserData,
    @Query('accountId') accountId?: string,
    @Query('category') category?: string,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.emailService.getEmails(user.organizationId, {
      accountId,
      category,
      isRead: isRead ? isRead === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return { success: true, data: result.emails, meta: result.meta };
  }

  @UseGuards(JwtAuthGuard)
  @Get('emails/:id')
  async getEmail(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const email = await this.emailService.getEmailById(id, user.organizationId);
    return { success: true, data: email };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('emails/:id')
  async updateEmail(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body() body: { isRead?: boolean; isStarred?: boolean },
  ) {
    const email = await this.emailService.updateEmail(
      id,
      user.organizationId,
      body,
    );
    return { success: true, data: email };
  }
}
