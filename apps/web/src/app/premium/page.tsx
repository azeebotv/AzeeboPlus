'use client';
import { useState, useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

import { Check, Star } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
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
      const res = await apiFetch<{
        balance: number;
        bonusBalance?: number;
        promoBalance?: number;
        totalBalance?: number;
        currency?: string;
      }>('/wallet');
      if (res.success && res.data) {
        return res.data.balance ?? 0;
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
      <PageShell maxWidth="xl">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" color="var(--color-az-flame)" />
            <p className="az-body mt-4 text-az-ink-muted">Loading premium plans...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell maxWidth="xl">
        <div className="flex min-h-[60vh] items-center justify-center">
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
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="xl">
      <PageHero
        eyebrow="Premium"
        title="Premium Access"
        description="Unlock exclusive content and features"
        className="text-center"
      />

      {status?.isPremium && (
        <div className="mb-8 rounded-az-panel border border-az-warning-400/40 bg-az-glass-fill p-6 backdrop-blur-az-glass">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-az-panel bg-az-warning-400/20 text-az-warning-400">
              <Star size={28} fill="currentColor" />
            </div>
            <div>
              <h2 className="az-subtitle text-az-warning-400">Premium Active</h2>
              <p className="az-body text-az-ink-muted">{status.planName}</p>
            </div>
          </div>
          <p className="az-body mb-2 text-az-ink">
            Expires: {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'N/A'}
          </p>
          <div className="mb-4 flex items-center justify-between">
            <span className="az-body text-az-ink-muted">Auto-renew</span>
            <span
              className={`az-body-strong ${
                status.autoRenew ? 'text-az-success-500' : 'text-az-error-500'
              }`}
            >
              {status.autoRenew ? 'On' : 'Off'}
            </span>
          </div>
          {status.autoRenew && (
            <button
              type="button"
              aria-label="Cancel subscription"
              onClick={handleCancel}
              className="w-full cursor-pointer rounded-az-pill border-none bg-az-error-500/20 px-4 py-3 az-body-strong text-az-error-500 transition-colors hover:bg-az-error-500/30"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      )}

      <div className="az-glass mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="az-overline mb-1 block text-az-flame">Value Pack</span>
          <h3 className="az-subtitle text-az-ink">Bundle Passes</h3>
          <p className="az-caption text-az-ink-muted">Save up to 40% with multi-universe bundles</p>
        </div>
        <Link
          href="/bundles"
          className="az-body-strong rounded-az-pill bg-gradient-to-r from-az-flame to-az-scarlet px-6 py-2.5 text-center text-az-ink transition-transform hover:scale-105 active:scale-95"
        >
          View Bundles
        </Link>
      </div>

      <h2 className="az-subtitle mb-6 text-az-ink">Choose Your Plan</h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="az-glass relative p-6">
            {plan.isPopular && (
              <span className="az-body absolute -top-3 left-1/2 -translate-x-1/2 rounded-az-pill bg-az-flame px-4 py-1 text-az-ink">
                Most Popular
              </span>
            )}
            <h3 className="az-subtitle mb-2 text-az-ink">{plan.name}</h3>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="az-heading text-az-flame">₦{plan.price.toLocaleString()}</span>
              <span className="az-caption text-az-ink-muted">
                {getDurationLabel(plan.duration)}
              </span>
            </div>
            <p className="az-body mb-6 text-az-ink-muted">{plan.description}</p>
            <ul className="mb-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check size={16} className="shrink-0 text-az-success-500" />
                  <span className="az-body text-az-ink">{feature}</span>
                </li>
              ))}
            </ul>
            {plan.isPopular ? (
              <button
                type="button"
                aria-label={`Subscribe to ${plan.name}`}
                onClick={() => setConfirmPlan({ id: plan.id, name: plan.name, price: plan.price })}
                disabled={isPurchasing}
                className="az-btn-primary"
              >
                {isPurchasing ? 'Processing...' : 'Subscribe Now'}
              </button>
            ) : (
              <button
                type="button"
                aria-label={`Subscribe to ${plan.name}`}
                onClick={() => setConfirmPlan({ id: plan.id, name: plan.name, price: plan.price })}
                disabled={isPurchasing}
                className="az-body-strong w-full cursor-pointer rounded-az-pill border border-az-glass-border-hover bg-az-glass-card px-4 py-3 text-az-ink transition-colors hover:bg-az-glass-fill-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPurchasing ? 'Processing...' : 'Subscribe Now'}
              </button>
            )}
          </div>
        ))}
      </div>

      {confirmPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirmPlan(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm subscription"
        >
          <div className="az-glass w-full max-w-sm p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="az-subtitle mb-2 text-az-ink">Confirm Subscription</h3>
            <p className="az-body mb-1 text-az-ink-muted">
              {confirmPlan.name} — ₦{confirmPlan.price.toLocaleString()}
            </p>
            <p className="az-caption mb-6 text-az-ink-muted">
              Wallet balance: ₦{walletBalance.toLocaleString()}
            </p>

            <div className="mb-4 flex flex-col gap-3">
              <button
                type="button"
                aria-label="Pay from wallet"
                onClick={() => handleSubscribe(confirmPlan.id, 'wallet')}
                disabled={isPurchasing || walletBalance < confirmPlan.price}
                className={`w-full rounded-az-pill py-3 az-body-strong transition-colors ${
                  walletBalance >= confirmPlan.price
                    ? 'cursor-pointer border-none bg-az-success-500 text-az-ink hover:bg-az-success-600'
                    : 'cursor-not-allowed border-none bg-az-surface-raised text-az-ink-muted'
                }`}
              >
                {isPurchasing
                  ? 'Processing...'
                  : walletBalance >= confirmPlan.price
                    ? 'Pay from Wallet'
                    : 'Insufficient Balance'}
              </button>
              <button
                type="button"
                aria-label="Pay with card or transfer"
                onClick={() => handleSubscribe(confirmPlan.id, 'external')}
                disabled={isPurchasing}
                className="az-btn-primary"
              >
                {isPurchasing ? 'Processing...' : 'Pay with Card / Transfer'}
              </button>
            </div>

            <button
              type="button"
              aria-label="Cancel subscription confirmation"
              onClick={() => setConfirmPlan(null)}
              className="az-body w-full cursor-pointer rounded-az-pill border border-az-glass-border bg-transparent px-4 py-2 text-az-ink-muted transition-colors hover:bg-az-glass-fill"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-az-panel border px-6 py-3 shadow-az-lifted ${
            toast.type === 'success'
              ? 'border-az-success-500/30 bg-az-success-500/15 text-az-success-500'
              : 'border-az-error-500/30 bg-az-error-500/15 text-az-error-500'
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </PageShell>
  );
}
