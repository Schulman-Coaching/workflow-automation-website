import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { GmailProvider } from './providers/gmail.provider';
import { OutlookProvider } from './providers/outlook.provider';
import { EmailProvider, NormalizedEmail } from './providers/email-provider.interface';

@Injectable()
export class EmailService {
  private readonly encryptionKey: Buffer;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private gmailProvider: GmailProvider,
    private outlookProvider: OutlookProvider,
  ) {
    const key = this.configService.get<string>('encryption.masterKey')!;
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  getProvider(provider: 'gmail' | 'outlook'): EmailProvider {
    switch (provider) {
      case 'gmail':
        return this.gmailProvider;
      case 'outlook':
        return this.outlookProvider;
      default:
        throw new BadRequestException(`Provider ${provider} not supported`);
    }
  }

  // OAuth Methods
  getOAuthUrl(provider: 'gmail' | 'outlook', userId: string, organizationId: string): string {
    const emailProvider = this.getProvider(provider);
    const state = this.encryptState({ userId, organizationId, provider });
    return emailProvider.getAuthUrl(state);
  }

  async handleOAuthCallback(
    provider: 'gmail' | 'outlook',
    code: string,
    state: string,
  ) {
    const { userId, organizationId } = this.decryptState(state);
    const emailProvider = this.getProvider(provider);

    // Exchange code for tokens
    const tokens = await emailProvider.exchangeCodeForTokens(code);

    // Get user email
    const emailAddress = await emailProvider.getUserEmail(tokens.accessToken);

    // Check if account already connected
    const existing = await this.prisma.emailAccount.findUnique({
      where: {
        organizationId_emailAddress: {
          organizationId,
          emailAddress,
        },
      },
    });

    if (existing) {
      // Update tokens
      await this.prisma.emailAccount.update({
        where: { id: existing.id },
        data: {
          accessTokenEncrypted: this.encrypt(tokens.accessToken, organizationId),
          refreshTokenEncrypted: this.encrypt(tokens.refreshToken, organizationId),
          tokenExpiresAt: tokens.expiresAt,
          isActive: true,
        },
      });
      return existing;
    }

    // Create new email account
    const account = await this.prisma.emailAccount.create({
      data: {
        userId,
        organizationId,
        provider,
        emailAddress,
        accessTokenEncrypted: this.encrypt(tokens.accessToken, organizationId),
        refreshTokenEncrypted: this.encrypt(tokens.refreshToken, organizationId),
        tokenExpiresAt: tokens.expiresAt,
      },
    });

    return account;
  }

  // Email Account Methods
  async getEmailAccounts(organizationId: string) {
    return this.prisma.emailAccount.findMany({
      where: { organizationId },
      select: {
        id: true,
        provider: true,
        emailAddress: true,
        isActive: true,
        lastSyncedAt: true,
        createdAt: true,
      },
    });
  }

  async disconnectAccount(accountId: string, organizationId: string) {
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, organizationId },
    });

    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    await this.prisma.emailAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    return { success: true };
  }

  // Email Methods
  async getEmails(
    organizationId: string,
    options: {
      accountId?: string;
      category?: string;
      isRead?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { accountId, category, isRead, page = 1, limit = 50 } = options;

    const where: Record<string, unknown> = { organizationId };
    if (accountId) where.emailAccountId = accountId;
    if (category) where.aiCategory = category;
    if (isRead !== undefined) where.isRead = isRead;

    const [emails, total] = await Promise.all([
      this.prisma.email.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          emailAccount: {
            select: {
              id: true,
              emailAddress: true,
              provider: true,
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

  async getEmailById(emailId: string, organizationId: string) {
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, organizationId },
      include: {
        emailAccount: {
          select: {
            id: true,
            emailAddress: true,
            provider: true,
          },
        },
      },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return email;
  }

  async updateEmail(
    emailId: string,
    organizationId: string,
    data: { isRead?: boolean; isStarred?: boolean },
  ) {
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, organizationId },
      include: { emailAccount: true },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    // Update in provider
    const provider = this.getProvider(email.emailAccount.provider as 'gmail' | 'outlook');
    const accessToken = await this.getAccessToken(email.emailAccount);

    if (data.isRead !== undefined) {
      if (data.isRead) {
        await provider.markAsRead(accessToken, email.providerId);
      } else {
        await provider.markAsUnread(accessToken, email.providerId);
      }
    }

    if (data.isStarred !== undefined) {
      if (data.isStarred) {
        await provider.star(accessToken, email.providerId);
      } else {
        await provider.unstar(accessToken, email.providerId);
      }
    }

    // Update in database
    return this.prisma.email.update({
      where: { id: emailId },
      data,
    });
  }

  // Sync Methods
  async syncEmails(accountId: string, organizationId: string, lookbackDays: number = 30) {
    const account = await this.prisma.emailAccount.findFirst({
      where: { id: accountId, organizationId },
    });

    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    const provider = this.getProvider(account.provider as 'gmail' | 'outlook');
    const accessToken = await this.getAccessToken(account);

    // Fetch last N days of emails
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
    const query = `after:${Math.floor(cutoffDate.getTime() / 1000)}`;

    const result = await provider.listEmails(accessToken, {
      maxResults: 100, // Still batching but can be called multiple times
      query,
    });

    // Save emails to database
    let savedCount = 0;
    for (const email of result.emails) {
      await this.saveEmail(account, email);
      savedCount++;
    }

    // Update last synced
    await this.prisma.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date() },
    });

    return { synced: savedCount };
  }

  async getSentEmailsForAnalysis(userId: string, limit: number = 50) {
    return this.prisma.email.findMany({
      where: {
        emailAccount: { userId },
        fromAddress: {
          contains: (await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email,
        },
      },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      select: {
        subject: true,
        bodyText: true,
        receivedAt: true,
      },
    });
  }

  // Helper Methods
  private async saveEmail(
    account: { id: string; organizationId: string },
    email: NormalizedEmail,
  ) {
    const existingEmail = await this.prisma.email.findUnique({
      where: {
        organizationId_emailAccountId_providerId: {
          organizationId: account.organizationId,
          emailAccountId: account.id,
          providerId: email.providerId,
        },
      },
    });

    if (existingEmail) {
      // Update existing
      return this.prisma.email.update({
        where: { id: existingEmail.id },
        data: {
          isRead: email.isRead,
          isStarred: email.isStarred,
          labels: email.labels,
        },
      });
    }

    // Create thread if needed
    let threadId: string | null = null;
    if (email.threadId) {
      const thread = await this.prisma.emailThread.upsert({
        where: {
          organizationId_emailAccountId_providerThreadId: {
            organizationId: account.organizationId,
            emailAccountId: account.id,
            providerThreadId: email.threadId,
          },
        },
        create: {
          organizationId: account.organizationId,
          emailAccountId: account.id,
          providerThreadId: email.threadId,
          subject: email.subject,
          lastMessageAt: email.receivedAt,
          messageCount: 1,
        },
        update: {
          lastMessageAt: email.receivedAt,
          messageCount: { increment: 1 },
        },
      });
      threadId = thread.id;
    }

    // Create new email
    return this.prisma.email.create({
      data: {
        organizationId: account.organizationId,
        emailAccountId: account.id,
        providerId: email.providerId,
        threadId,
        subject: email.subject,
        snippet: email.snippet,
        bodyText: email.bodyText,
        bodyHtml: email.bodyHtml,
        fromAddress: email.fromAddress,
        fromName: email.fromName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toAddresses: email.toAddresses as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ccAddresses: email.ccAddresses as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bccAddresses: email.bccAddresses as any,
        receivedAt: email.receivedAt,
        isRead: email.isRead,
        isStarred: email.isStarred,
        hasAttachments: email.hasAttachments,
        labels: email.labels,
      },
    });
  }

  private async getAccessToken(account: {
    id: string;
    organizationId: string;
    provider: string;
    accessTokenEncrypted: string;
    refreshTokenEncrypted: string;
    tokenExpiresAt: Date | null;
  }): Promise<string> {
    const now = new Date();

    // Check if token is expired
    if (account.tokenExpiresAt && account.tokenExpiresAt > now) {
      return this.decrypt(account.accessTokenEncrypted, account.organizationId);
    }

    // Refresh token
    const provider = this.getProvider(account.provider as 'gmail' | 'outlook');
    const refreshToken = this.decrypt(account.refreshTokenEncrypted, account.organizationId);
    const tokens = await provider.refreshAccessToken(refreshToken);

    // Update stored tokens
    await this.prisma.emailAccount.update({
      where: { id: account.id },
      data: {
        accessTokenEncrypted: this.encrypt(tokens.accessToken, account.organizationId),
        refreshTokenEncrypted: this.encrypt(tokens.refreshToken, account.organizationId),
        tokenExpiresAt: tokens.expiresAt,
      },
    });

    return tokens.accessToken;
  }

  private encryptState(data: { userId: string; organizationId: string; provider: string }): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decryptState(state: string): { userId: string; organizationId: string; provider: string } {
    const [ivHex, authTagHex, encrypted] = state.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  private encrypt(data: string, organizationId: string): string {
    const key = crypto.scryptSync(this.encryptionKey.toString('hex') + organizationId, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedData: string, organizationId: string): string {
    const key = crypto.scryptSync(this.encryptionKey.toString('hex') + organizationId, 'salt', 32);
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
