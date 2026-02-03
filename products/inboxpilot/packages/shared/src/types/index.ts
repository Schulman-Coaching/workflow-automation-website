// Organization (Tenant)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  planId: string | null;
  stripeCustomerId: string | null;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  timezone?: string;
  defaultTone?: EmailTone;
}

// User
export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'owner' | 'admin' | 'member';

export interface UserSettings {
  emailNotifications?: boolean;
  dailyDigest?: boolean;
}

// Email Account
export interface EmailAccount {
  id: string;
  userId: string;
  organizationId: string;
  provider: EmailProvider;
  emailAddress: string;
  isActive: boolean;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailProvider = 'gmail' | 'outlook';

// Email
export interface Email {
  id: string;
  organizationId: string;
  emailAccountId: string;
  providerId: string;
  threadId: string | null;
  subject: string | null;
  snippet: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  fromAddress: string | null;
  fromName: string | null;
  toAddresses: EmailAddress[];
  ccAddresses: EmailAddress[];
  bccAddresses: EmailAddress[];
  receivedAt: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: string[];
  aiCategory: EmailCategory | null;
  aiPriority: number | null;
  aiSummary: string | null;
  aiSuggestedAction: string | null;
  aiProcessedAt: Date | null;
  followUpStatus: FollowUpStatus;
  followUpDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export type EmailCategory =
  | 'urgent'
  | 'action_required'
  | 'fyi'
  | 'newsletter'
  | 'spam';

export type FollowUpStatus =
  | 'none'
  | 'pending'
  | 'scheduled'
  | 'completed';

// Email Thread
export interface EmailThread {
  id: string;
  organizationId: string;
  emailAccountId: string;
  providerThreadId: string | null;
  subject: string | null;
  lastMessageAt: Date | null;
  messageCount: number;
  participantAddresses: string[];
  aiCategory: EmailCategory | null;
  aiPriority: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Email Draft
export interface EmailDraft {
  id: string;
  organizationId: string;
  userId: string;
  emailAccountId: string;
  replyToEmailId: string | null;
  toAddresses: EmailAddress[];
  ccAddresses: EmailAddress[];
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  aiGenerated: boolean;
  aiPromptUsed: string | null;
  aiVersion: number;
  status: DraftStatus;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DraftStatus = 'draft' | 'sent' | 'discarded';

// AI Types
export type EmailTone = 'professional' | 'casual' | 'formal';

export type DraftIntent =
  | 'accept'
  | 'decline'
  | 'follow_up'
  | 'info_request'
  | 'thank_you'
  | 'custom';

export interface AITriageResult {
  category: EmailCategory;
  priority: number;
  summary: string;
  suggestedAction: string;
}

export interface AIDraftRequest {
  emailId: string;
  tone: EmailTone;
  intent: DraftIntent;
  context?: string;
}

// Contact
export interface Contact {
  id: string;
  organizationId: string;
  emailAddress: string;
  name: string | null;
  company: string | null;
  lastContactedAt: Date | null;
  contactFrequency: number;
  aiRelationshipType: RelationshipType | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type RelationshipType =
  | 'client'
  | 'vendor'
  | 'internal'
  | 'newsletter'
  | 'unknown';

// Plans & Billing
export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxEmailAccounts: number;
  maxUsers: number;
  aiRequestsPerMonth: number;
  features: PlanFeatures;
  isActive: boolean;
  createdAt: Date;
}

export interface PlanFeatures {
  drafts: boolean;
  followUps: boolean;
  customPrompts: boolean;
  analytics: boolean;
  prioritySupport: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
