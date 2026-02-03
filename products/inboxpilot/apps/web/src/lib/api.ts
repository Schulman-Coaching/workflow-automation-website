const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }) {
    return this.request<{
      user: unknown;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{
      user: unknown;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request<unknown>('/auth/me');
  }

  // Email Accounts
  async getEmailAccounts() {
    return this.request<unknown[]>('/email-accounts');
  }

  async syncEmailAccount(accountId: string) {
    return this.request<{ synced: number }>(`/email-accounts/${accountId}/sync`, {
      method: 'POST',
    });
  }

  async disconnectEmailAccount(accountId: string) {
    return this.request<unknown>(`/email-accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  async getGmailOAuthUrl() {
    return this.request<{ url: string }>('/oauth/gmail/url');
  }

  async getOutlookOAuthUrl() {
    return this.request<{ url: string }>('/oauth/outlook/url');
  }

  // Emails
  async getEmails(params?: {
    accountId?: string;
    category?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.accountId) searchParams.set('accountId', params.accountId);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.isRead !== undefined)
      searchParams.set('isRead', String(params.isRead));
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<unknown[]>(`/emails${query ? `?${query}` : ''}`);
  }

  async getEmail(id: string) {
    return this.request<unknown>(`/emails/${id}`);
  }

  async updateEmail(id: string, data: { isRead?: boolean; isStarred?: boolean }) {
    return this.request<unknown>(`/emails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // AI
  async triageEmails(emailIds: string[]) {
    return this.request<unknown[]>('/ai/triage', {
      method: 'POST',
      body: JSON.stringify({ emailIds }),
    });
  }

  async generateDraft(data: {
    emailId: string;
    tone: 'professional' | 'casual' | 'formal';
    intent: string;
    context?: string;
  }) {
    return this.request<{ draftId: string; content: string }>('/ai/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async summarizeEmail(emailId: string) {
    return this.request<{ summary: string }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ emailId }),
    });
  }

  // Organization
  async getOrganization() {
    return this.request<unknown>('/organization');
  }

  // Billing
  async getSubscription() {
    return this.request<{
      id: string;
      status: string;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
      trialEnd: string | null;
    } | null>('/billing/subscription');
  }

  async createCheckout(successUrl: string, cancelUrl: string) {
    return this.request<{ sessionId: string; url: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ successUrl, cancelUrl }),
    });
  }

  async createPortal(returnUrl: string) {
    return this.request<{ url: string }>('/billing/portal', {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    });
  }

  async cancelSubscription() {
    return this.request<{ success: boolean; cancelAtPeriodEnd: boolean }>('/billing/cancel', {
      method: 'POST',
    });
  }

  // Follow-Up Rules
  async getFollowUpRules() {
    return this.request<unknown[]>('/follow-ups/rules');
  }

  async createFollowUpRule(data: {
    name?: string;
    conditions: Array<{ type: string; value: string }>;
    followUpDays?: number;
    reminderTemplate?: string;
  }) {
    return this.request<unknown>('/follow-ups/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFollowUpRule(
    ruleId: string,
    data: {
      name?: string;
      conditions?: Array<{ type: string; value: string }>;
      followUpDays?: number;
      reminderTemplate?: string;
      isActive?: boolean;
    },
  ) {
    return this.request<unknown>(`/follow-ups/rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFollowUpRule(ruleId: string) {
    return this.request<{ success: boolean }>(`/follow-ups/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  // Follow-Up Emails
  async getFollowUpEmails(params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    return this.request<unknown[]>(`/follow-ups/emails${query ? `?${query}` : ''}`);
  }

  async getDueFollowUps() {
    return this.request<unknown[]>('/follow-ups/emails/due');
  }

  async getFollowUpStats() {
    return this.request<{
      pending: number;
      due: number;
      snoozed: number;
      completed: number;
      total: number;
    }>('/follow-ups/stats');
  }

  async snoozeFollowUp(emailId: string, days: number) {
    return this.request<unknown>(`/follow-ups/emails/${emailId}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    });
  }

  async completeFollowUp(emailId: string) {
    return this.request<unknown>(`/follow-ups/emails/${emailId}/complete`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient(API_URL);
