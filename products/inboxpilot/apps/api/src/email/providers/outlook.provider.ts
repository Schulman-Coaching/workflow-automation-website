import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface GraphMessage {
  id: string;
  conversationId?: string;
  subject?: string;
  bodyPreview?: string;
  body?: {
    contentType: string;
    content: string;
  };
  from?: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  toRecipients?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  bccRecipients?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  receivedDateTime: string;
  isRead: boolean;
  flag?: {
    flagStatus: string;
  };
  hasAttachments: boolean;
  categories?: string[];
}

interface GraphDeltaResponse {
  value: GraphMessage[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
}

@Injectable()
export class OutlookProvider implements EmailProvider {
  readonly name = 'outlook' as const;
  private readonly logger = new Logger(OutlookProvider.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  private readonly GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
  private readonly AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0';

  private readonly SCOPES = [
    'openid',
    'profile',
    'email',
    'offline_access',
    'Mail.Read',
    'Mail.ReadWrite',
    'Mail.Send',
    'User.Read',
  ];

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('oauth.outlook.clientId') || '';
    this.clientSecret = this.configService.get<string>('oauth.outlook.clientSecret') || '';
    this.redirectUri =
      this.configService.get<string>('oauth.outlook.redirectUri') ||
      'http://localhost:3000/api/v1/oauth/outlook/callback';

    this.logger.log('Outlook OAuth Config initialized');
  }

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      response_mode: 'query',
      scope: this.SCOPES.join(' '),
      state,
      prompt: 'consent',
    });

    return `${this.AUTH_URL}/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<EmailProviderTokens> {
    const response = await fetch(`${this.AUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error('Failed to exchange code for tokens', error);
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const data: MicrosoftTokenResponse = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<EmailProviderTokens> {
    const response = await fetch(`${this.AUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: this.SCOPES.join(' '),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error('Failed to refresh token', error);
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data: MicrosoftTokenResponse = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async getUserEmail(accessToken: string): Promise<string> {
    const response = await this.graphRequest<{ mail?: string; userPrincipalName: string }>(
      accessToken,
      '/me',
    );
    return response.mail || response.userPrincipalName;
  }

  async listEmails(
    accessToken: string,
    options: ListEmailsOptions = {},
  ): Promise<ListEmailsResult> {
    const params = new URLSearchParams({
      $top: String(options.maxResults || 50),
      $orderby: 'receivedDateTime desc',
      $select:
        'id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,isRead,flag,hasAttachments,categories',
    });

    if (options.query) {
      params.set('$filter', `contains(subject, '${options.query}') or contains(body/content, '${options.query}')`);
    }

    if (options.pageToken) {
      // pageToken is the full nextLink URL for Outlook
      const response = await fetch(options.pageToken, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      return {
        emails: data.value.map((msg: GraphMessage) => this.normalizeEmail(msg)),
        nextPageToken: data['@odata.nextLink'],
      };
    }

    const response = await this.graphRequest<{ value: GraphMessage[]; '@odata.nextLink'?: string }>(
      accessToken,
      `/me/messages?${params.toString()}`,
    );

    return {
      emails: response.value.map((msg) => this.normalizeEmail(msg)),
      nextPageToken: response['@odata.nextLink'],
    };
  }

  async getEmail(accessToken: string, emailId: string): Promise<NormalizedEmail> {
    const params = new URLSearchParams({
      $select:
        'id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,isRead,flag,hasAttachments,categories',
    });

    const response = await this.graphRequest<GraphMessage>(
      accessToken,
      `/me/messages/${emailId}?${params.toString()}`,
    );
    return this.normalizeEmail(response);
  }

  async sendEmail(accessToken: string, email: SendEmailDto): Promise<{ id: string }> {
    const message = {
      subject: email.subject,
      body: {
        contentType: email.bodyHtml ? 'HTML' : 'Text',
        content: email.bodyHtml || email.bodyText || '',
      },
      toRecipients: email.to.map((addr) => ({
        emailAddress: {
          address: addr.email,
          name: addr.name,
        },
      })),
      ccRecipients: email.cc?.map((addr) => ({
        emailAddress: {
          address: addr.email,
          name: addr.name,
        },
      })),
    };

    if (email.replyToMessageId) {
      // Reply to existing message
      const response = await this.graphRequest<{ id?: string }>(
        accessToken,
        `/me/messages/${email.replyToMessageId}/reply`,
        'POST',
        { message, comment: '' },
      );
      return { id: response.id || email.replyToMessageId };
    }

    // Send new message
    const response = await this.graphRequest<{ id?: string }>(accessToken, '/me/sendMail', 'POST', {
      message,
      saveToSentItems: true,
    });

    return { id: response.id || 'sent' };
  }

  async markAsRead(accessToken: string, emailId: string): Promise<void> {
    await this.graphRequest(accessToken, `/me/messages/${emailId}`, 'PATCH', {
      isRead: true,
    });
  }

  async markAsUnread(accessToken: string, emailId: string): Promise<void> {
    await this.graphRequest(accessToken, `/me/messages/${emailId}`, 'PATCH', {
      isRead: false,
    });
  }

  async archive(accessToken: string, emailId: string): Promise<void> {
    // Move to Archive folder
    const archiveFolder = await this.getOrCreateFolder(accessToken, 'Archive');
    await this.graphRequest(accessToken, `/me/messages/${emailId}/move`, 'POST', {
      destinationId: archiveFolder.id,
    });
  }

  async star(accessToken: string, emailId: string): Promise<void> {
    await this.graphRequest(accessToken, `/me/messages/${emailId}`, 'PATCH', {
      flag: { flagStatus: 'flagged' },
    });
  }

  async unstar(accessToken: string, emailId: string): Promise<void> {
    await this.graphRequest(accessToken, `/me/messages/${emailId}`, 'PATCH', {
      flag: { flagStatus: 'notFlagged' },
    });
  }

  async getDeltaChanges(
    accessToken: string,
    deltaLink?: string,
  ): Promise<DeltaSyncResult> {
    const emails: NormalizedEmail[] = [];
    const deletedIds: string[] = [];

    let url = deltaLink || `${this.GRAPH_BASE_URL}/me/mailFolders/inbox/messages/delta`;

    while (url) {
      const response: GraphDeltaResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r) => r.json());

      for (const msg of response.value) {
        if ((msg as unknown as { '@removed': unknown })['@removed']) {
          deletedIds.push(msg.id);
        } else {
          emails.push(this.normalizeEmail(msg));
        }
      }

      if (response['@odata.nextLink']) {
        url = response['@odata.nextLink'];
      } else {
        return {
          emails,
          deletedIds,
          nextSyncToken: response['@odata.deltaLink'],
        };
      }
    }

    return { emails, deletedIds };
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserEmail(accessToken);
      return true;
    } catch {
      return false;
    }
  }

  private async graphRequest<T = Record<string, unknown>>(
    accessToken: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown,
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.GRAPH_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Graph API error: ${response.status}`, error);
      throw new Error(`Graph API error: ${response.status} - ${error}`);
    }

    // Some endpoints return empty response
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  private async getOrCreateFolder(accessToken: string, folderName: string) {
    // Try to find existing folder
    const response = await this.graphRequest(
      accessToken,
      `/me/mailFolders?$filter=displayName eq '${folderName}'`,
    );

    if ((response.value as unknown[])?.length > 0) {
      return (response.value as { id: string }[])[0];
    }

    // Create folder if not exists
    return this.graphRequest(accessToken, '/me/mailFolders', 'POST', {
      displayName: folderName,
    });
  }

  private normalizeEmail(message: GraphMessage): NormalizedEmail {
    const toAddresses: EmailAddress[] = (message.toRecipients || []).map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    }));

    const ccAddresses: EmailAddress[] = (message.ccRecipients || []).map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    }));

    const bccAddresses: EmailAddress[] = (message.bccRecipients || []).map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    }));

    const bodyText =
      message.body?.contentType === 'text' ? message.body.content : undefined;
    const bodyHtml =
      message.body?.contentType === 'html' ? message.body.content : undefined;

    return {
      providerId: message.id,
      threadId: message.conversationId,
      subject: message.subject,
      snippet: message.bodyPreview,
      bodyText,
      bodyHtml,
      fromAddress: message.from?.emailAddress.address,
      fromName: message.from?.emailAddress.name,
      toAddresses,
      ccAddresses,
      bccAddresses,
      receivedAt: new Date(message.receivedDateTime),
      isRead: message.isRead,
      isStarred: message.flag?.flagStatus === 'flagged',
      hasAttachments: message.hasAttachments,
      labels: message.categories || [],
    };
  }
}
