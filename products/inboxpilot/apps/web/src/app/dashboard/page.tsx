'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  RefreshCw,
  Star,
  Mail,
  MailOpen,
  AlertCircle,
  Clock,
  Info,
  Newspaper,
  Loader2,
  Sparkles,
  Reply,
  X,
  Copy,
  Check,
  Wand2,
  Bell,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

type DraftTone = 'professional' | 'casual' | 'formal';
type DraftIntent = 'accept' | 'decline' | 'follow_up' | 'info_request' | 'thank_you' | 'custom';

interface DraftOptions {
  tone: DraftTone;
  intent: DraftIntent;
  context?: string;
}

const toneOptions: { value: DraftTone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Business-appropriate tone' },
  { value: 'casual', label: 'Casual', description: 'Friendly and relaxed' },
  { value: 'formal', label: 'Formal', description: 'Very formal and respectful' },
];

const intentOptions: { value: DraftIntent; label: string; description: string }[] = [
  { value: 'accept', label: 'Accept', description: 'Accept a request or invitation' },
  { value: 'decline', label: 'Decline', description: 'Politely decline with reasoning' },
  { value: 'follow_up', label: 'Follow Up', description: 'Ask for status or more info' },
  { value: 'info_request', label: 'Request Info', description: 'Ask for specific information' },
  { value: 'thank_you', label: 'Thank You', description: 'Express gratitude' },
  { value: 'custom', label: 'Custom', description: 'Provide your own instructions' },
];

interface Email {
  id: string;
  subject: string | null;
  snippet: string | null;
  fromAddress: string | null;
  fromName: string | null;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  aiCategory: string | null;
  aiPriority: number | null;
  aiSummary: string | null;
  emailAccount: {
    emailAddress: string;
    provider: string;
  };
}

const categoryConfig: Record<
  string,
  { icon: typeof AlertCircle; label: string; color: string }
> = {
  urgent: {
    icon: AlertCircle,
    label: 'Urgent',
    color: 'text-red-600 bg-red-50',
  },
  action_required: {
    icon: Clock,
    label: 'Action Required',
    color: 'text-orange-600 bg-orange-50',
  },
  fyi: { icon: Info, label: 'FYI', color: 'text-blue-600 bg-blue-50' },
  newsletter: {
    icon: Newspaper,
    label: 'Newsletter',
    color: 'text-gray-600 bg-gray-50',
  },
  spam: { icon: Mail, label: 'Spam', color: 'text-gray-400 bg-gray-50' },
};

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  // Draft composer state
  const [showDraftComposer, setShowDraftComposer] = useState(false);
  const [draftOptions, setDraftOptions] = useState<DraftOptions>({
    tone: 'professional',
    intent: 'thank_you',
    context: '',
  });
  const [generatedDraft, setGeneratedDraft] = useState<string>('');
  const [draftId, setDraftId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['emails', selectedCategory],
    queryFn: () =>
      api.getEmails({ category: selectedCategory || undefined, limit: 50 }),
  });

  const emails = (data?.data || []) as Email[];

  const markAsReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) =>
      api.updateEmail(id, { isRead }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) =>
      api.updateEmail(id, { isStarred }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const triageMutation = useMutation({
    mutationFn: (emailIds: string[]) => api.triageEmails(emailIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const draftMutation = useMutation({
    mutationFn: (data: { emailId: string; tone: DraftTone; intent: string; context?: string }) =>
      api.generateDraft(data),
    onSuccess: (response) => {
      if (response.data) {
        setGeneratedDraft(response.data.content);
        setDraftId(response.data.draftId);
      }
    },
  });

  const handleGenerateDraft = () => {
    if (!selectedEmail) return;
    setGeneratedDraft('');
    setDraftId('');
    draftMutation.mutate({
      emailId: selectedEmail.id,
      tone: draftOptions.tone,
      intent: draftOptions.intent,
      context: draftOptions.intent === 'custom' ? draftOptions.context : undefined,
    });
  };

  const handleCopyDraft = async () => {
    await navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDraftComposer = () => {
    setShowDraftComposer(true);
    setGeneratedDraft('');
    setDraftId('');
    setDraftOptions({
      tone: 'professional',
      intent: 'thank_you',
      context: '',
    });
  };

  const handleTriageAll = () => {
    const untriagedEmails = emails
      .filter((e) => !e.aiCategory)
      .map((e) => e.id)
      .slice(0, 10);
    if (untriagedEmails.length > 0) {
      triageMutation.mutate(untriagedEmails);
    }
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsReadMutation.mutate({ id: email.id, isRead: true });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy-900">Inbox</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/follow-ups"
              className="btn-ghost flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Follow-Ups
            </Link>
            <button
              onClick={handleTriageAll}
              disabled={triageMutation.isPending}
              className="btn-secondary"
            >
              {triageMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              AI Triage
            </button>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="btn-ghost"
            >
              <RefreshCw
                className={clsx('h-4 w-4', isRefetching && 'animate-spin')}
              />
            </button>
            <Link
              href="/settings/email-accounts"
              className="btn-ghost"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="input w-auto"
            >
              <option value="">All categories</option>
              <option value="urgent">Urgent</option>
              <option value="action_required">Action Required</option>
              <option value="fyi">FYI</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List */}
        <div className="w-[400px] border-r border-gray-200 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Mail className="h-12 w-12 mb-4" />
              <p>No emails found</p>
              <p className="text-sm">Connect an email account to get started</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {emails.map((email) => {
                const category = email.aiCategory
                  ? categoryConfig[email.aiCategory]
                  : null;
                const CategoryIcon = category?.icon;

                return (
                  <li
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={clsx(
                      'px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors',
                      selectedEmail?.id === email.id && 'bg-sky-50',
                      !email.isRead && 'bg-white',
                      email.isRead && 'bg-gray-50/50',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarMutation.mutate({
                            id: email.id,
                            isStarred: !email.isStarred,
                          });
                        }}
                        className="mt-1 text-gray-300 hover:text-yellow-400"
                      >
                        <Star
                          className={clsx(
                            'h-4 w-4',
                            email.isStarred && 'fill-yellow-400 text-yellow-400',
                          )}
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={clsx(
                              'text-sm truncate',
                              !email.isRead
                                ? 'font-semibold text-gray-900'
                                : 'text-gray-700',
                            )}
                          >
                            {email.fromName || email.fromAddress || 'Unknown'}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDistanceToNow(new Date(email.receivedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p
                          className={clsx(
                            'text-sm truncate',
                            !email.isRead
                              ? 'font-medium text-gray-900'
                              : 'text-gray-600',
                          )}
                        >
                          {email.subject || '(no subject)'}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {email.snippet}
                        </p>
                        {category && CategoryIcon && (
                          <div className="mt-2">
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                                category.color,
                              )}
                            >
                              <CategoryIcon className="h-3 w-3" />
                              {category.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Email Detail */}
        <div className="flex-1 bg-white overflow-y-auto">
          {selectedEmail ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {selectedEmail.isRead ? (
                    <MailOpen className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Mail className="h-5 w-5 text-sky-500" />
                  )}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedEmail.subject || '(no subject)'}
                  </h2>
                </div>
                <button
                  onClick={handleOpenDraftComposer}
                  className="btn-primary"
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Generate Reply
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 text-sm">
                <div>
                  <span className="text-gray-500">From:</span>{' '}
                  <span className="font-medium">
                    {selectedEmail.fromName || selectedEmail.fromAddress}
                  </span>
                </div>
                <div className="text-gray-400">
                  {new Date(selectedEmail.receivedAt).toLocaleString()}
                </div>
              </div>

              {selectedEmail.aiSummary && (
                <div className="mb-6 p-4 bg-sky-50 rounded-lg border border-sky-100">
                  <div className="flex items-center gap-2 text-sky-700 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">AI Summary</span>
                  </div>
                  <p className="text-sm text-sky-900">{selectedEmail.aiSummary}</p>
                </div>
              )}

              {/* Draft Composer Panel */}
              {showDraftComposer && (
                <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-purple-700">
                      <Wand2 className="h-4 w-4" />
                      <span className="font-medium">AI Draft Assistant</span>
                    </div>
                    <button
                      onClick={() => setShowDraftComposer(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {!generatedDraft ? (
                    <div className="space-y-4">
                      {/* Tone Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tone
                        </label>
                        <div className="flex gap-2">
                          {toneOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                setDraftOptions({ ...draftOptions, tone: option.value })
                              }
                              className={clsx(
                                'px-3 py-2 text-sm rounded-lg border transition-colors',
                                draftOptions.tone === option.value
                                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-purple-200'
                              )}
                              title={option.description}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Intent Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reply Intent
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {intentOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                setDraftOptions({ ...draftOptions, intent: option.value })
                              }
                              className={clsx(
                                'px-3 py-2 text-sm rounded-lg border transition-colors text-left',
                                draftOptions.intent === option.value
                                  ? 'bg-purple-100 border-purple-300 text-purple-700'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-purple-200'
                              )}
                            >
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs opacity-70">{option.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Context */}
                      {draftOptions.intent === 'custom' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Instructions
                          </label>
                          <textarea
                            value={draftOptions.context}
                            onChange={(e) =>
                              setDraftOptions({ ...draftOptions, context: e.target.value })
                            }
                            placeholder="Describe what you want the reply to accomplish..."
                            className="input h-24 resize-none"
                          />
                        </div>
                      )}

                      {/* Generate Button */}
                      <button
                        onClick={handleGenerateDraft}
                        disabled={draftMutation.isPending}
                        className="btn-primary w-full"
                      >
                        {draftMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Draft
                          </>
                        )}
                      </button>

                      {draftMutation.isError && (
                        <p className="text-sm text-red-600">
                          Failed to generate draft. Please try again.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Generated Draft Display */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Generated Draft
                          </label>
                          <button
                            onClick={handleCopyDraft}
                            className="btn-ghost text-xs py-1 px-2"
                          >
                            {copied ? (
                              <>
                                <Check className="mr-1 h-3 w-3 text-green-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1 h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          value={generatedDraft}
                          onChange={(e) => setGeneratedDraft(e.target.value)}
                          className="input h-48 resize-none font-mono text-sm"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setGeneratedDraft('');
                            setDraftId('');
                          }}
                          className="btn-secondary flex-1"
                        >
                          <Wand2 className="mr-2 h-4 w-4" />
                          Regenerate
                        </button>
                        <button
                          onClick={() => setShowDraftComposer(false)}
                          className="btn-primary flex-1"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Done
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 text-center">
                        Draft saved with ID: {draftId.slice(0, 8)}...
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{selectedEmail.snippet}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Mail className="h-16 w-16 mb-4" />
              <p className="text-lg">Select an email to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
