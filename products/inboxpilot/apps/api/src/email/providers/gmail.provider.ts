import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import {
  EmailProvider,
  EmailProviderTokens,
  NormalizedEmail,
  ListEmailsOptions,
  ListEmailsResult,
  DeltaSyncResult,
  SendEmailDto,
  EmailAddress,
} from './email-provider.interface';

@Injectable()
export class GmailProvider implements EmailProvider {
  readonly name = 'gmail' as const;

  private readonly oauth2Client;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('oauth.gmail.clientId');
    const clientSecret = this.configService.get<string>('oauth.gmail.clientSecret');
    const redirectUri = this.configService.get<string>('oauth.gmail.redirectUri');

    console.log('Gmail OAuth Config:', {
      clientId: clientId ? `${clientId.substring(0, 20)}...` : 'MISSING',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : 'MISSING',
      redirectUri,
    });

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  getAuthUrl(state: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent',
      state,
    });
  }

  async exchangeCodeForTokens(code: string): Promise<EmailProviderTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiresAt: new Date(tokens.expiry_date!),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<EmailProviderTokens> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: new Date(credentials.expiry_date!),
    };
  }

  async getUserEmail(accessToken: string): Promise<string> {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return data.email!;
  }

  async listEmails(
    accessToken: string,
    options: ListEmailsOptions = {},
  ): Promise<ListEmailsResult> {
    const gmail = this.getGmailClient(accessToken);

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: options.maxResults || 50,
      pageToken: options.pageToken,
      q: options.query,
      labelIds: options.labelIds,
      includeSpamTrash: options.includeSpamTrash || false,
    });

    const emails: NormalizedEmail[] = [];

    if (response.data.messages) {
      for (const msg of response.data.messages) {
        try {
          const email = await this.getEmail(accessToken, msg.id!);
          emails.push(email);
        } catch (error) {
          console.error(`Failed to fetch email ${msg.id}:`, error);
        }
      }
    }

    return {
      emails,
      nextPageToken: response.data.nextPageToken || undefined,
    };
  }

  async getEmail(accessToken: string, emailId: string): Promise<NormalizedEmail> {
    const gmail = this.getGmailClient(accessToken);

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full',
    });

    return this.normalizeEmail(response.data);
  }

  async sendEmail(
    accessToken: string,
    email: SendEmailDto,
  ): Promise<{ id: string }> {
    const gmail = this.getGmailClient(accessToken);

    const raw = this.createRawEmail(email);

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId: email.threadId,
      },
    });

    return { id: response.data.id! };
  }

  async markAsRead(accessToken: string, emailId: string): Promise<void> {
    const gmail = this.getGmailClient(accessToken);
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }

  async markAsUnread(accessToken: string, emailId: string): Promise<void> {
    const gmail = this.getGmailClient(accessToken);
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: ['UNREAD'],
      },
    });
  }

  async archive(accessToken: string, emailId: string): Promise<void> {
    const gmail = this.getGmailClient(accessToken);
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });
  }

  async star(accessToken: string, emailId: string): Promise<void> {
    const gmail = this.getGmailClient(accessToken);
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: ['STARRED'],
      },
    });
  }

  async unstar(accessToken: string, emailId: string): Promise<void> {
    const gmail = this.getGmailClient(accessToken);
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: ['STARRED'],
      },
    });
  }

  async getDeltaChanges(
    accessToken: string,
    historyId?: string,
  ): Promise<DeltaSyncResult> {
    const gmail = this.getGmailClient(accessToken);

    if (!historyId) {
      // Initial sync - return empty, caller should do full sync
      return { emails: [], deletedIds: [] };
    }

    const response = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId,
      historyTypes: ['messageAdded', 'messageDeleted'],
    });

    const emails: NormalizedEmail[] = [];
    const deletedIds: string[] = [];

    if (response.data.history) {
      for (const history of response.data.history) {
        if (history.messagesAdded) {
          for (const added of history.messagesAdded) {
            try {
              const email = await this.getEmail(accessToken, added.message!.id!);
              emails.push(email);
            } catch (error) {
              console.error(`Failed to fetch added email:`, error);
            }
          }
        }
        if (history.messagesDeleted) {
          for (const deleted of history.messagesDeleted) {
            deletedIds.push(deleted.message!.id!);
          }
        }
      }
    }

    return {
      emails,
      deletedIds,
      nextSyncToken: response.data.historyId || undefined,
    };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserEmail(accessToken);
      return true;
    } catch {
      return false;
    }
  }

  private getGmailClient(accessToken: string): gmail_v1.Gmail {
    this.oauth2Client.setCredentials({ access_token: accessToken });
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  private normalizeEmail(message: gmail_v1.Schema$Message): NormalizedEmail {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;

    const fromHeader = getHeader('from') || '';
    const { email: fromAddress, name: fromName } = this.parseEmailAddress(fromHeader);

    const toAddresses = this.parseAddressList(getHeader('to') || undefined);
    const ccAddresses = this.parseAddressList(getHeader('cc') || undefined);
    const bccAddresses = this.parseAddressList(getHeader('bcc') || undefined);

    const { text, html } = this.extractBody(message.payload);

    return {
      providerId: message.id!,
      threadId: message.threadId || undefined,
      subject: getHeader('subject') || undefined,
      snippet: message.snippet || undefined,
      bodyText: text || undefined,
      bodyHtml: html || undefined,
      fromAddress,
      fromName,
      toAddresses,
      ccAddresses,
      bccAddresses,
      receivedAt: new Date(parseInt(message.internalDate || '0', 10)),
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED') || false,
      hasAttachments: this.hasAttachments(message.payload),
      labels: message.labelIds || [],
    };
  }

  private parseEmailAddress(raw: string): { email: string; name?: string } {
    const match = raw.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
    if (match) {
      return {
        name: match[1]?.trim() || undefined,
        email: match[2]?.trim() || raw,
      };
    }
    return { email: raw };
  }

  private parseAddressList(raw?: string): EmailAddress[] {
    if (!raw) return [];
    return raw.split(',').map((addr) => this.parseEmailAddress(addr.trim()));
  }

  private extractBody(payload?: gmail_v1.Schema$MessagePart): {
    text?: string;
    html?: string;
  } {
    if (!payload) return {};

    let text: string | undefined;
    let html: string | undefined;

    const processPayload = (part: gmail_v1.Schema$MessagePart) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.parts) {
        for (const subPart of part.parts) {
          processPayload(subPart);
        }
      }
    };

    processPayload(payload);
    return { text, html };
  }

  private hasAttachments(payload?: gmail_v1.Schema$MessagePart): boolean {
    if (!payload) return false;

    const checkPart = (part: gmail_v1.Schema$MessagePart): boolean => {
      if (part.filename && part.filename.length > 0) {
        return true;
      }
      if (part.parts) {
        return part.parts.some(checkPart);
      }
      return false;
    };

    return checkPart(payload);
  }

  private createRawEmail(email: SendEmailDto): string {
    const to = email.to.map((a) => (a.name ? `"${a.name}" <${a.email}>` : a.email)).join(', ');
    const cc = email.cc?.map((a) => (a.name ? `"${a.name}" <${a.email}>` : a.email)).join(', ');

    let raw = `To: ${to}\r\n`;
    if (cc) raw += `Cc: ${cc}\r\n`;
    raw += `Subject: ${email.subject}\r\n`;
    raw += `Content-Type: text/html; charset=utf-8\r\n`;
    raw += `\r\n`;
    raw += email.bodyHtml || email.bodyText || '';

    return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  }
}
