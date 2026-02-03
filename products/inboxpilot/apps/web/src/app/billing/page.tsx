'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Loader2,
  CreditCard,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { clsx } from 'clsx';

const features = [
  'Connect unlimited Gmail & Outlook accounts',
  'AI-powered email triage & categorization',
  'Smart draft generation with tone control',
  'Email summaries & priority scoring',
  'Follow-up reminders',
  'Team collaboration (coming soon)',
];

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.getSubscription(),
  });

  const subscription = subscriptionData?.data;
  const isSubscribed = subscription?.status === 'active';
  const isCanceled = subscription?.cancelAtPeriodEnd;

  const checkoutMutation = useMutation({
    mutationFn: () => {
      const baseUrl = window.location.origin;
      return api.createCheckout(
        `${baseUrl}/billing?success=true`,
        `${baseUrl}/billing?canceled=true`,
      );
    },
    onSuccess: (response) => {
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => {
      const baseUrl = window.location.origin;
      return api.createPortal(`${baseUrl}/billing`);
    },
    onSuccess: (response) => {
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    checkoutMutation.mutate();
  };

  const handleManageBilling = () => {
    portalMutation.mutate();
  };

  // Check for success/canceled URL params
  const urlParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null;
  const showSuccess = urlParams?.get('success') === 'true';
  const showCanceled = urlParams?.get('canceled') === 'true';

  if (isLoadingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success/Canceled Messages */}
        {showSuccess && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600" />
            <p className="text-green-800">
              Payment successful! Your subscription is now active.
            </p>
          </div>
        )}

        {showCanceled && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">
              Checkout was canceled. You can try again whenever you are ready.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isSubscribed ? 'Your Subscription' : 'Upgrade to InboxPilot Pro'}
          </h1>
          <p className="text-lg text-gray-600">
            {isSubscribed
              ? 'Manage your subscription and billing details'
              : 'Unlock the full power of AI-assisted email management'}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-md mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-8 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6" />
              <span className="text-sm font-medium uppercase tracking-wide">
                Pro Plan
              </span>
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold">$29</span>
              <span className="text-xl opacity-80">/month</span>
            </div>
            <p className="mt-2 opacity-80">Per user, billed monthly</p>
          </div>

          {/* Features */}
          <div className="px-6 py-8">
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="px-6 pb-8">
            {isSubscribed ? (
              <div className="space-y-4">
                {/* Subscription Status */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Status</span>
                    <span
                      className={clsx(
                        'text-sm font-medium px-2 py-1 rounded',
                        isCanceled
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700',
                      )}
                    >
                      {isCanceled ? 'Canceling' : 'Active'}
                    </span>
                  </div>
                  {subscription?.currentPeriodEnd && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {isCanceled ? 'Access until' : 'Next billing date'}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Manage Button */}
                <button
                  onClick={handleManageBilling}
                  disabled={portalMutation.isPending}
                  className="btn-secondary w-full"
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Manage Billing
                  <ExternalLink className="ml-2 h-4 w-4" />
                </button>

                {/* Cancel Button */}
                {!isCanceled && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
                        cancelMutation.mutate();
                      }
                    }}
                    disabled={cancelMutation.isPending}
                    className="btn-ghost w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Cancel Subscription
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || checkoutMutation.isPending}
                className="btn-primary w-full text-lg py-3"
              >
                {isCheckingOut || checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Subscribe Now
                  </>
                )}
              </button>
            )}

            {checkoutMutation.isError && (
              <p className="mt-4 text-sm text-red-600 text-center">
                Failed to start checkout. Please try again.
              </p>
            )}
          </div>
        </div>

        {/* FAQ/Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Secure payment powered by Stripe. Cancel anytime.
          </p>
          <p className="mt-2">
            Questions? Contact us at support@inboxpilot.ai
          </p>
        </div>
      </div>
    </div>
  );
}
