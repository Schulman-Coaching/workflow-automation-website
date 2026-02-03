'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  Pause,
  Loader2,
  MoreVertical,
  Bell,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface FollowUpEmail {
  id: string;
  subject: string | null;
  fromAddress: string | null;
  fromName: string | null;
  receivedAt: string;
  followUpStatus: string;
  followUpDueAt: string | null;
  aiCategory: string | null;
  aiSuggestedAction: string | null;
  emailAccount: {
    id: string;
    emailAddress: string;
  };
}

interface FollowUpStats {
  pending: number;
  due: number;
  snoozed: number;
  completed: number;
  total: number;
}

interface FollowUpRule {
  id: string;
  name: string | null;
  conditions: Array<{ type: string; value: string }>;
  followUpDays: number;
  isActive: boolean;
  createdAt: string;
}

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'text-yellow-600 bg-yellow-50' },
  due: { icon: AlertCircle, label: 'Due', color: 'text-red-600 bg-red-50' },
  snoozed: { icon: Pause, label: 'Snoozed', color: 'text-blue-600 bg-blue-50' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'text-green-600 bg-green-50' },
};

export default function FollowUpsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'emails' | 'rules'>('emails');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showSnoozeModal, setShowSnoozeModal] = useState<string | null>(null);

  // Queries
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['follow-up-stats'],
    queryFn: () => api.getFollowUpStats(),
  });

  const { data: emailsData, isLoading: emailsLoading } = useQuery({
    queryKey: ['follow-up-emails', statusFilter],
    queryFn: () => api.getFollowUpEmails({ status: statusFilter || undefined }),
  });

  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['follow-up-rules'],
    queryFn: () => api.getFollowUpRules(),
    enabled: activeTab === 'rules',
  });

  const stats = statsData?.data as FollowUpStats | undefined;
  const emails = (emailsData?.data || []) as FollowUpEmail[];
  const rules = (rulesData?.data || []) as FollowUpRule[];

  // Mutations
  const snoozeMutation = useMutation({
    mutationFn: ({ emailId, days }: { emailId: string; days: number }) =>
      api.snoozeFollowUp(emailId, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-emails'] });
      queryClient.invalidateQueries({ queryKey: ['follow-up-stats'] });
      setShowSnoozeModal(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (emailId: string) => api.completeFollowUp(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-emails'] });
      queryClient.invalidateQueries({ queryKey: ['follow-up-stats'] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => api.deleteFollowUpRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-rules'] });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) =>
      api.updateFollowUpRule(ruleId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-rules'] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inbox
        </Link>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-navy-900">Follow-Ups</h1>
              <p className="text-gray-600">
                Track and manage email follow-up reminders
              </p>
            </div>
            <Bell className="h-8 w-8 text-sky-500" />
          </div>

          {/* Stats */}
          {statsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => setStatusFilter(statusFilter === 'due' ? null : 'due')}
                className={clsx(
                  'p-4 rounded-lg text-center transition-colors',
                  statusFilter === 'due' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-red-50 hover:bg-red-100',
                )}
              >
                <p className="text-2xl font-bold text-red-600">{stats.due}</p>
                <p className="text-sm text-red-600">Due Now</p>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'pending' ? null : 'pending')}
                className={clsx(
                  'p-4 rounded-lg text-center transition-colors',
                  statusFilter === 'pending' ? 'bg-yellow-100 ring-2 ring-yellow-500' : 'bg-yellow-50 hover:bg-yellow-100',
                )}
              >
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-yellow-600">Pending</p>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'snoozed' ? null : 'snoozed')}
                className={clsx(
                  'p-4 rounded-lg text-center transition-colors',
                  statusFilter === 'snoozed' ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-blue-50 hover:bg-blue-100',
                )}
              >
                <p className="text-2xl font-bold text-blue-600">{stats.snoozed}</p>
                <p className="text-sm text-blue-600">Snoozed</p>
              </button>
              <div className="p-4 rounded-lg bg-green-50 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-green-600">Completed</p>
              </div>
            </div>
          ) : null}

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('emails')}
              className={clsx(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'emails'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              Follow-Up Emails
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={clsx(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'rules'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              Automation Rules
            </button>
          </div>

          {/* Emails Tab */}
          {activeTab === 'emails' && (
            <div>
              {emailsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
              ) : emails.length > 0 ? (
                <div className="space-y-3">
                  {emails.map((email) => {
                    const config = statusConfig[email.followUpStatus as keyof typeof statusConfig] || statusConfig.pending;
                    const Icon = config.icon;

                    return (
                      <div
                        key={email.id}
                        className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className={clsx('p-2 rounded-full', config.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {email.subject || '(no subject)'}
                            </p>
                            <p className="text-sm text-gray-500">
                              From: {email.fromName || email.fromAddress}
                            </p>
                            {email.followUpDueAt && (
                              <p className="text-sm text-gray-400">
                                Due: {formatDistanceToNow(new Date(email.followUpDueAt), { addSuffix: true })}
                              </p>
                            )}
                            {email.aiSuggestedAction && (
                              <p className="text-sm text-sky-600 mt-1">
                                Suggested: {email.aiSuggestedAction}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {email.followUpStatus !== 'completed' && (
                            <>
                              <button
                                onClick={() => setShowSnoozeModal(email.id)}
                                className="btn-ghost text-gray-600 text-sm"
                              >
                                Snooze
                              </button>
                              <button
                                onClick={() => completeMutation.mutate(email.id)}
                                disabled={completeMutation.isPending}
                                className="btn-ghost text-green-600 text-sm"
                              >
                                {completeMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Complete'
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No follow-ups {statusFilter ? `with status "${statusFilter}"` : 'found'}.</p>
                </div>
              )}
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div>
              {rulesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
              ) : rules.length > 0 ? (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {rule.name || 'Unnamed Rule'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Follow up after {rule.followUpDays} day{rule.followUpDays > 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {rule.conditions.map((condition, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {condition.type}: {condition.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.isActive}
                            onChange={() =>
                              toggleRuleMutation.mutate({
                                ruleId: rule.id,
                                isActive: !rule.isActive,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                        <button
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                          disabled={deleteRuleMutation.isPending}
                          className="btn-ghost text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No follow-up rules configured.</p>
                  <p className="text-sm mt-2">
                    Rules automatically flag emails that need follow-up.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Snooze Modal */}
        {showSnoozeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Snooze Follow-Up</h3>
              <p className="text-gray-600 mb-4">How long would you like to snooze this follow-up?</p>
              <div className="grid grid-cols-2 gap-3">
                {[1, 3, 7, 14].map((days) => (
                  <button
                    key={days}
                    onClick={() => snoozeMutation.mutate({ emailId: showSnoozeModal, days })}
                    disabled={snoozeMutation.isPending}
                    className="btn-secondary"
                  >
                    {days} day{days > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSnoozeModal(null)}
                className="w-full mt-4 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
