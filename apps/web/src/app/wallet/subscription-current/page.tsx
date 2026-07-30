'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Spinner, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
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
        return { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', label: 'Active' };
      case 'cancelled':
        return { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'Cancelled' };
      case 'expired':
        return { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF', label: 'Expired' };
      case 'past_due':
        return { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B', label: 'Past Due' };
      default:
        return { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF', label: status };
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <Spinner size="lg" color="#E8420A" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Wallet" />

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Current Subscription</h1>
            <p className="text-white/50">Manage your subscription plan</p>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Spinner size="lg" color="#E8420A" />
              <p className="mt-4 text-white/60">Loading subscription...</p>
            </div>
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load subscription"
            description={error}
            onButtonPress={() => subscriptionQuery.refetch()}
          />
        ) : subscription ? (
          <GlowCard universe="movies" className="p-8">
            {/* Status Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👑</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{subscription.planName}</h2>
                  <p className="text-white/50 text-sm">{subscription.planDuration} plan</p>
                </div>
              </div>
              {(() => {
                const statusStyle = getStatusStyle(subscription.status);
                return (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                  >
                    {statusStyle.label}
                  </span>
                );
              })()}
            </div>

            {/* Details */}
            <div className="space-y-4 mb-8">
              <div
                className="flex justify-between items-center py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-white/50">Price</span>
                <span className="text-white font-semibold">
                  ₦{subscription.planPrice.toLocaleString()}/{subscription.planDuration}
                </span>
              </div>
              <div
                className="flex justify-between items-center py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-white/50">Start Date</span>
                <span className="text-white font-medium">
                  {new Date(subscription.startDate).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div
                className="flex justify-between items-center py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-white/50">End Date</span>
                <span className="text-white font-medium">
                  {new Date(subscription.endDate).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {subscription.nextBillingDate && (
                <div
                  className="flex justify-between items-center py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-white/50">Next Billing</span>
                  <span className="text-white font-medium">
                    {new Date(subscription.nextBillingDate).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between items-center py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-white/50">Auto-Renew</span>
                <button
                  type="button"
                  onClick={() => toggleAutoRenewMutation.mutate(!subscription.autoRenew)}
                  disabled={toggleAutoRenewMutation.isPending}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{
                    backgroundColor: subscription.autoRenew ? '#22C55E' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: subscription.autoRenew ? 'translateX(22px)' : 'translateX(2px)',
                    }}
                  />
                </button>
              </div>
              {subscription.paymentMethod && (
                <div className="flex justify-between items-center py-3">
                  <span className="text-white/50">Payment Method</span>
                  <span className="text-white font-medium capitalize">
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
                  className="w-full py-3 rounded-full font-semibold transition-all"
                  style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
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
                    className="w-full py-3 rounded-full font-semibold transition-all az-btn-primary"
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
                  className="w-full py-3 rounded-full font-semibold transition-all"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'var(--brand-white)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View History
                </motion.button>
              </Link>
            </div>
          </GlowCard>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📋</p>
            <h2 className="text-xl font-bold text-white mb-2">No Active Subscription</h2>
            <p className="text-white/50 mb-6">Subscribe to unlock premium content</p>
            <Link href="/wallet/subscription-plans">
              <motion.button
                type="button"
                className="az-btn-primary px-8"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Plans
              </motion.button>
            </Link>
          </div>
        )}
      </div>

      <AppFooter />

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg transition-all"
          style={{
            backgroundColor:
              toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? '#22C55E' : '#EF4444',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const LazySubscriptionCurrentPage = lazy(() =>
  Promise.resolve({ default: SubscriptionCurrentPageContent })
);

export const metadata = {
  title: 'Current Subscription | Azeebo',
  description: 'View and manage your active subscription plan, billing, and auto-renewal settings.',
  openGraph: {
    title: 'Current Subscription | Azeebo',
    description: 'View and manage your active subscription plan, billing, and auto-renewal settings.',
  },
};

export default function SubscriptionCurrentPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazySubscriptionCurrentPage />
    </Suspense>
  );
}
