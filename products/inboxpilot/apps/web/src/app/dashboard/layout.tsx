'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Inbox,
  Send,
  Clock,
  Settings,
  LogOut,
  Plus,
  CreditCard,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Mail className="h-8 w-8 text-sky-500" />
            <span className="text-xl font-bold text-navy-900">InboxPilot</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-sky-50 text-sky-700"
              >
                <Inbox className="h-5 w-5" />
                Inbox
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/drafts"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <Send className="h-5 w-5" />
                Drafts
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/follow-ups"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <Clock className="h-5 w-5" />
                Follow-ups
              </Link>
            </li>
          </ul>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Email Accounts
            </h3>
            <Link
              href="/settings/email-accounts"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Plus className="h-4 w-4" />
              Connect account
            </Link>
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Subscription
            </h3>
            <Link
              href="/billing"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </Link>
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center">
                <span className="text-sm font-medium text-sky-700">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 truncate max-w-[120px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-gray-500 truncate max-w-[120px]">
                  {user?.organization?.name}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Link
                href="/settings"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
