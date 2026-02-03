export interface EmailAddress {
  email: string;
  name?: string;
}

export interface NormalizedEmail {
  providerId: string;
  threadId?: string;
  subject?: string;
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
  fromAddress?: string;
  fromName?: string;
  toAddresses: EmailAddress[];
  ccAddresses: EmailAddress[];
  bccAddresses: EmailAddress[];
  receivedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: string[];
}

export interface ListEmailsOptions {
  maxResults?: number;
  pageToken?: string;
  query?: string;
  labelIds?: string[];
  includeSpamTrash?: boolean;
}

export interface ListEmailsResult {
  emails: NormalizedEmail[];
  nextPageToken?: string;
}

export interface DeltaSyncResult {
  emails: NormalizedEmail[];
  deletedIds: string[];
  nextSyncToken?: string;
}

export interface SendEmailDto {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  replyToMessageId?: string;
  threadId?: string;
}

export interface EmailProviderTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface EmailProvider {
  readonly name: 'gmail' | 'outlook';

  // OAuth
  getAuthUrl(state: string): string;
  exchangeCodeForTokens(code: string): Promise<EmailProviderTokens>;
  refreshAccessToken(refreshToken: string): Promise<EmailProviderTokens>;
  getUserEmail(accessToken: string): Promise<string>;

  // Email Operations
  listEmails(
    accessToken: string,
    options?: ListEmailsOptions,
  ): Promise<ListEmailsResult>;
  getEmail(accessToken: string, emailId: string): Promise<NormalizedEmail>;
  sendEmail(accessToken: string, email: SendEmailDto): Promise<{ id: string }>;

  // Actions
  markAsRead(accessToken: string, emailId: string): Promise<void>;
  markAsUnread(accessToken: string, emailId: string): Promise<void>;
  archive(accessToken: string, emailId: string): Promise<void>;
  star(accessToken: string, emailId: string): Promise<void>;
  unstar(accessToken: string, emailId: string): Promise<void>;

  // Sync
  getDeltaChanges(
    accessToken: string,
    syncToken?: string,
  ): Promise<DeltaSyncResult>;
  setupWebhook?(accessToken: string, webhookUrl: string): Promise<string>;

  // Validation
  validateToken(accessToken: string): Promise<boolean>;
}
