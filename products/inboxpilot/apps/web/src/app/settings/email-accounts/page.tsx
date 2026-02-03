'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface EmailAccount {
  id: string;
  provider: string;
  emailAddress: string;
  isActive: boolean;
  lastSyncedAt: string | null;
}

export default function EmailAccountsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['email-accounts'],
    queryFn: () => api.getEmailAccounts(),
  });

  const accounts = (data?.data || []) as EmailAccount[];

  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) => api.disconnectEmailAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (accountId: string) => api.syncEmailAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const handleConnectGmail = async () => {
    try {
      const response = await api.getGmailOAuthUrl();
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to get OAuth URL:', error);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const response = await api.getOutlookOAuthUrl();
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to get Outlook OAuth URL:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inbox
        </Link>

        <div className="card">
          <h1 className="text-2xl font-bold text-navy-900 mb-2">
            Email Accounts
          </h1>
          <p className="text-gray-600 mb-6">
            Connect your email accounts to start using InboxPilot.
          </p>

          {/* Connected Accounts */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          ) : accounts.length > 0 ? (
            <div className="space-y-3 mb-8">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Mail className="h-5 w-5 text-sky-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {account.emailAddress}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {account.provider}
                        {account.lastSyncedAt && (
                          <>
                            {' · '}
                            Last synced:{' '}
                            {new Date(account.lastSyncedAt).toLocaleString()}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => syncMutation.mutate(account.id)}
                      disabled={syncMutation.isPending}
                      className="btn-ghost text-gray-600"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          syncMutation.isPending ? 'animate-spin' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => disconnectMutation.mutate(account.id)}
                      disabled={disconnectMutation.isPending}
                      className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 mb-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No email accounts connected yet.</p>
            </div>
          )}

          {/* Connect Options */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Connect a new account
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleConnectGmail}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
                    />
                    <path
                      fill="#34A853"
                      d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"
                    />
                    <path
                      fill="#4A90E2"
                      d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Gmail</p>
                  <p className="text-sm text-gray-500">Connect your Gmail account</p>
                </div>
              </button>

              <button
                onClick={handleConnectOutlook}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#0078D4"
                      d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12z"
                    />
                    <path
                      fill="#fff"
                      d="M7 7h10v10H7z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Outlook</p>
                  <p className="text-sm text-gray-500">Connect your Outlook account</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
