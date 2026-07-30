'use client';
import { useState, useEffect } from 'react';

export const metadata = {
  title: 'Premium Access | Azeebo',
  description: 'Unlock exclusive content, movies, and features with Azeebo Premium subscriptions.',
  openGraph: {
    title: 'Premium Access | Azeebo',
    description: 'Unlock exclusive content, movies, and features with Azeebo Premium subscriptions.',
  },
};
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Spinner, ErrorState } from '@azeebo/ui/web';

export default function PremiumAccessPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<{
    id: string;
    name: string;
    price: number;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const plansQuery = useQuery({
    queryKey: ['premium', 'plans'],
    queryFn: async () => {
      const res = await apiFetch<
        Array<{
          id: string;
          name: string;
          description: string;
          price: number;
          duration: number;
          features: string[];
          tier: string;
        }>
      >('/v1/subscription/plans');
      if (res.success && res.data) {
        return res.data.map((plan) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration:
            plan.duration === 7
              ? 'weekly'
              : plan.duration === 30
                ? 'monthly'
                : ('yearly' as 'weekly' | 'monthly' | 'yearly'),
          features: plan.features,
          isPopular: plan.tier === 'premium',
        }));
      }
      return [];
    },
    staleTime: 300000,
  });

  const statusQuery = useQuery({
    queryKey: ['premium', 'status'],
    queryFn: async () => {
      const res = await apiFetch<{
        id: string;
        status: string;
        plan?: { name: string };
        endDate: string;
        autoRenew: boolean;
      }>('/v1/subscription/current');
      if (res.success && res.data) {
        const sub = res.data;
        return {
          isPremium: sub.status === 'active',
          subscriptionId: sub.id,
          planName: sub.plan?.name,
          expiresAt: sub.endDate,
          autoRenew: sub.autoRenew,
        };
      }
      return null;
    },
    staleTime: 60000,
  });

  const walletQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => {
      const res = await apiFetch<{ balance: number }>('/wallet');
      if (res.success && res.data) {
        return res.data.balance;
      }
      return 0;
    },
    staleTime: 60000,
  });

  const plans = plansQuery.data ?? [];
  const status = statusQuery.data ?? null;
  const walletBalance = walletQuery.data ?? 0;
  const isLoading = plansQuery.isLoading || statusQuery.isLoading;
  const error = plansQuery.error?.message || statusQuery.error?.message || null;

  const handleSubscribe = async (
    planId: string,
    paymentMethod: 'wallet' | 'external' = 'wallet'
  ): Promise<void> => {
    setIsPurchasing(true);
    setConfirmPlan(null);
    try {
      const result = await apiFetch('/v1/subscription/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId, autoRenew: true, paymentMethod }),
      });

      if (result.success) {
        setToast({ message: 'You are now a premium member!', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['premium'] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      }
    } catch (error: unknown) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to subscribe',
        type: 'error',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (!status?.subscriptionId) {
      setToast({ message: 'No active subscription found to cancel', type: 'error' });
      return;
    }

    try {
      const result = await apiFetch(`/v1/subscription/${status.subscriptionId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        setToast({ message: 'Subscription cancelled', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['premium'] });
      }
    } catch (error) {
      setToast({ message: 'Failed to cancel subscription', type: 'error' });
    }
  };

  const getDurationLabel = (duration: string): string => {
    switch (duration) {
      case 'weekly':
        return '/week';
      case 'monthly':
        return '/month';
      case 'yearly':
        return '/year';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <Spinner size="lg" color="#E8420A" />
            <p className="mt-4 text-white/60">Loading premium plans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <ErrorState
            title="Failed to load premium plans"
            description={error}
            buttonText="Retry"
            onButtonPress={() => {
              plansQuery.refetch();
              statusQuery.refetch();
            }}
          />
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}>
      <AppHeader />

      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Premium Access</h1>
          <p className="text-white/50">Unlock exclusive content and features</p>
        </div>

        {status?.isPremium && (
          <div className="az-glass p-6 mb-8" style={{ border: '2px solid rgba(234,179,8,0.5)' }}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">👑</span>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-warning-400)' }}>
                  Premium Active
                </h2>
                <p className="text-white/50">{status.planName}</p>
              </div>
            </div>
            <p className="text-white mb-2">
              Expires: {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'N/A'}
            </p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50">Auto-renew</span>
              <span
                className="font-semibold"
                style={{ color: status.autoRenew ? 'var(--color-success-500)' : 'var(--color-error-500)' }}
              >
                {status.autoRenew ? 'On' : 'Off'}
              </span>
            </div>
            {status.autoRenew && (
              <button
                type="button"
                aria-label="Cancel subscription"
                onClick={handleCancel}
                className="w-full px-4 py-3 rounded-full font-semibold transition-colors"
                style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: 'var(--color-error-500)' }}
              >
                Cancel Subscription
              </button>
            )}
          </div>
        )}

        <div className="mb-6 p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Bundle Passes</h3>
              <p className="text-white/50 text-sm">Save up to 40% with multi-universe bundles</p>
            </div>
            <Link
              href="/bundles"
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-sm transition-colors"
            >
              View Bundles
            </Link>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-6">Choose Your Plan</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`az-glass p-6 relative ${plan.isPopular ? 'ring-2 ring-[#E8420A]' : ''}`}
              style={plan.isPopular ? { boxShadow: '0 0 30px rgba(232,66,10,0.2)' } : undefined}
            >
              {plan.isPopular && (
                <span
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--brand-orange, #E8420A)' }}
                >
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold" style={{ color: 'var(--brand-orange, #E8420A)' }}>
                  ₦{plan.price.toLocaleString()}
                </span>
                <span className="text-white/50">{getDurationLabel(plan.duration)}</span>
              </div>
              <p className="text-white/50 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: 'var(--color-success-500)' }}>
                      ✓
                    </span>
                    <span className="text-white text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                aria-label={`Subscribe to ${plan.name}`}
                onClick={() => setConfirmPlan({ id: plan.id, name: plan.name, price: plan.price })}
                disabled={isPurchasing}
                className={`w-full py-3 rounded-full font-semibold transition-all ${
                  plan.isPopular ? 'az-btn-primary' : ''
                }`}
                style={
                  plan.isPopular
                    ? undefined
                    : {
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: 'var(--brand-white)',
                      }
                }
              >
                {isPurchasing ? 'Processing...' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <AppFooter />

      {confirmPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setConfirmPlan(null)}
        >
          <div
            className="az-glass p-8 rounded-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">Confirm Subscription</h3>
            <p className="text-white/50 mb-1">
              {confirmPlan.name} — ₦{confirmPlan.price.toLocaleString()}
            </p>
            <p className="text-white/50 mb-6 text-sm">
              Wallet balance: ₦{walletBalance.toLocaleString()}
            </p>

            <div className="flex flex-col gap-3 mb-4">
              <button
                type="button"
                aria-label="Pay from wallet"
                onClick={() => handleSubscribe(confirmPlan.id, 'wallet')}
                disabled={isPurchasing || walletBalance < confirmPlan.price}
                className="w-full py-3 rounded-full font-semibold transition-all"
                style={{
                  background:
                    walletBalance >= confirmPlan?.price
                      ? 'linear-gradient(135deg, #0D3B2E 0%, #0A5C36 100%)'
                      : 'var(--bg-surface, #2A1A1A)',
                  color: walletBalance >= confirmPlan?.price ? '#fff' : '#666',
                  cursor: walletBalance >= confirmPlan?.price ? 'pointer' : 'not-allowed',
                }}
              >
                {isPurchasing
                  ? 'Processing...'
                  : walletBalance >= confirmPlan?.price
                    ? 'Pay from Wallet'
                    : 'Insufficient Balance'}
              </button>
              <button
                type="button"
                aria-label="Pay with card or transfer"
                onClick={() => handleSubscribe(confirmPlan.id, 'external')}
                disabled={isPurchasing}
                className="w-full py-3 rounded-full font-semibold transition-all az-btn-primary"
              >
                {isPurchasing ? 'Processing...' : 'Pay with Card / Transfer'}
              </button>
            </div>

            <button
              type="button"
              aria-label="Cancel subscription confirmation"
              onClick={() => setConfirmPlan(null)}
              className="w-full py-2 rounded-full text-white/50 border border-white/10 hover:bg-white/5 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg transition-all"
          style={{
            backgroundColor:
              toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? 'var(--color-success-500)' : 'var(--color-error-500)',
          }}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
