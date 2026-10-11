'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Spinner, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Crown, Sparkles } from 'lucide-react';
import analytics from '@/lib/analytics';

interface CurrentSubscription {
  id: string;
  planId: string;
  planName: string;
  planPrice: number;
  planDuration: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  nextBillingDate?: string;
  paymentMethod?: string;
}

function SubscriptionCurrentPageContent(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    analytics.pageView('subscription-current');
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const subscriptionQuery = useQuery({
    queryKey: ['subscription-current'],
    queryFn: async () => {
      const res = await apiFetch<CurrentSubscription>('/v1/subscription/current');
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: 60000,
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const sub = subscriptionQuery.data;
      if (!sub?.id) throw new Error('No active subscription');
      const res = await apiFetch(`/v1/subscription/${sub.id}`, { method: 'DELETE' });
      if (res.success) return true;
      throw new Error(res.message || 'Failed to cancel subscription');
    },
    onSuccess: () => {
      setToast({ message: 'Subscription cancelled successfully', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  const toggleAutoRenewMutation = useMutation({
    mutationFn: async (autoRenew: boolean) => {
      const sub = subscriptionQuery.data;
      if (!sub?.id) throw new Error('No active subscription');
      const res = await apiFetch(`/v1/subscription/${sub.id}/auto-renew`, {
        method: 'PATCH',
        body: JSON.stringify({ autoRenew }),
      });
      if (res.success) return true;
      throw new Error(res.message || 'Failed to update auto-renew');
    },
    onSuccess: () => {
      setToast({ message: 'Auto-renew updated', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  const subscription = subscriptionQuery.data ?? null;
  const isLoading = authLoading || subscriptionQuery.isLoading;
  const error = subscriptionQuery.error?.message;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return {
          className: 'bg-az-success-500/15 text-az-success-500',
          label: 'Active',
        };
      case 'cancelled':
        return {
          className: 'bg-az-error-500/15 text-az-error-500',
          label: 'Cancelled',
        };
      case 'expired':
        return { className: 'bg-az-ink/15 text-az-ink-muted', label: 'Expired' };
      case 'past_due':
        return {
          className: 'bg-az-warning-500/15 text-az-warning-500',
          label: 'Past Due',
        };
      default:
        return { className: 'bg-az-ink/15 text-az-ink-muted', label: status };
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
        <div className="flex items-center justify-center py-20 min-h-[60vh]">
          <Spinner size="lg" color="var(--color-az-flame)" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
      <PageHero
        badge="Billing & Access"
        title="Active Subscription"
        description="Review your active universe streaming tier, renewal schedule, and payment settings."
      />

      <div className="max-w-3xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Spinner size="lg" color="var(--color-az-flame)" />
              <p className="mt-4 text-az-ink/60">Loading subscription...</p>
            </div>
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load subscription"
            description={error}
            onButtonPress={() => subscriptionQuery.refetch()}
          />
        ) : subscription ? (
          <ScrollReveal>
            <GlowCard universe="movies" className="p-8">
              {/* Status Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-az-flame" />
                  <div>
                    <h2 className="text-xl font-bold text-az-ink">{subscription.planName}</h2>
                    <p className="text-az-ink/50 text-sm">{subscription.planDuration} plan</p>
                  </div>
                </div>
                {(() => {
                  const statusStyle = getStatusStyle(subscription.status);
                  return (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.className}`}
                    >
                      {statusStyle.label}
                    </span>
                  );
                })()}
              </div>

              {/* Details */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-az-ink/10">
                  <span className="text-az-ink/50">Price</span>
                  <span className="text-az-ink font-semibold">
                    ₦{subscription.planPrice.toLocaleString()}/{subscription.planDuration}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-az-ink/10">
                  <span className="text-az-ink/50">Start Date</span>
                  <span className="text-az-ink font-medium">
                    {new Date(subscription.startDate).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-az-ink/10">
                  <span className="text-az-ink/50">End Date</span>
                  <span className="text-az-ink font-medium">
                    {new Date(subscription.endDate).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {subscription.nextBillingDate && (
                  <div className="flex justify-between items-center py-3 border-b border-az-ink/10">
                    <span className="text-az-ink/50">Next Billing</span>
                    <span className="text-az-ink font-medium">
                      {new Date(subscription.nextBillingDate).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-b border-az-ink/10">
                  <span className="text-az-ink/50">Auto-Renew</span>
                  <button
                    type="button"
                    aria-label="Toggle auto-renew"
                    aria-pressed={subscription.autoRenew}
                    onClick={() => toggleAutoRenewMutation.mutate(!subscription.autoRenew)}
                    disabled={toggleAutoRenewMutation.isPending}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      subscription.autoRenew ? 'bg-az-success-500' : 'bg-az-ink/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-az-ink transition-transform ${
                        subscription.autoRenew ? 'translate-x-[22px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>
                {subscription.paymentMethod && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-az-ink/50">Payment Method</span>
                    <span className="text-az-ink font-medium capitalize">
                      {subscription.paymentMethod}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {subscription.status === 'active' && subscription.autoRenew && (
                  <motion.button
                    type="button"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className="w-full py-3 rounded-full font-semibold transition-all bg-az-error-500/15 text-az-error-500"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                  </motion.button>
                )}
                {(subscription.status === 'expired' || subscription.status === 'cancelled') && (
                  <Link href="/wallet/subscription-plans">
                    <motion.button
                      type="button"
                      className="transition-all az-btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Renew Subscription
                    </motion.button>
                  </Link>
                )}
                <Link href="/wallet/subscription-history">
                  <motion.button
                    type="button"
                    className="w-full py-3 rounded-full font-semibold transition-all border border-az-ink/20 bg-az-ink/10 text-az-ink"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View History
                  </motion.button>
                </Link>
              </div>
            </GlowCard>
          </ScrollReveal>
        ) : (
          <ScrollReveal>
            <div className="text-center py-20 az-glass p-8">
              <Sparkles className="w-12 h-12 text-az-flame mx-auto mb-4 opacity-80" />
              <h2 className="text-xl font-bold text-az-ink mb-2">No Active Subscription</h2>
              <p className="text-az-ink/50 mb-6">
                Subscribe to unlock premium content across all universes
              </p>
              <Link href="/wallet/subscription-plans">
                <motion.button
                  type="button"
                  className="az-btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Plans
                </motion.button>
              </Link>
            </div>
          </ScrollReveal>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg transition-all border ${
            toast.type === 'success'
              ? 'bg-az-success-500/15 border-az-success-500/30 text-az-success-500'
              : 'bg-az-error-500/15 border-az-error-500/30 text-az-error-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </PageShell>
  );
}

const LazySubscriptionCurrentPage = lazy(() =>
  Promise.resolve({ default: SubscriptionCurrentPageContent })
);

export default function SubscriptionCurrentPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazySubscriptionCurrentPage />
    </Suspense>
  );
}
