'use client';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Spinner, ErrorState } from '@azeebo/ui/web';

export default function PremiumAccessPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  const plans = plansQuery.data ?? [];
  const status = statusQuery.data ?? null;
  const isLoading = plansQuery.isLoading || statusQuery.isLoading;
  const error = plansQuery.error?.message || statusQuery.error?.message || null;

  const handleSubscribe = async (planId: string): Promise<void> => {
    setIsPurchasing(true);
    try {
      const result = await apiFetch('/v1/subscription/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId, autoRenew: true }),
      });

      if (result.success) {
        setToast({ message: 'You are now a premium member!', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['premium'] });
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
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
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
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
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
                <h2 className="text-xl font-bold" style={{ color: '#EAB308' }}>
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
                style={{ color: status.autoRenew ? '#22C55E' : '#EF4444' }}
              >
                {status.autoRenew ? 'On' : 'Off'}
              </span>
            </div>
            {status.autoRenew && (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full px-4 py-3 rounded-full font-semibold transition-colors"
                style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }}
              >
                Cancel Subscription
              </button>
            )}
          </div>
        )}

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
                  style={{ backgroundColor: '#E8420A' }}
                >
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold" style={{ color: '#E8420A' }}>
                  ₦{plan.price.toLocaleString()}
                </span>
                <span className="text-white/50">{getDurationLabel(plan.duration)}</span>
              </div>
              <p className="text-white/50 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: '#22C55E' }}>
                      ✓
                    </span>
                    <span className="text-white text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleSubscribe(plan.id)}
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
                        color: '#fff',
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

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg transition-all"
          style={{
            backgroundColor:
              toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? '#22C55E' : '#EF4444',
          }}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
