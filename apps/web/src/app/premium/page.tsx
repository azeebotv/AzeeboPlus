'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: 'weekly' | 'monthly' | 'yearly';
  features: string[];
  isPopular: boolean;
  discount?: number;
}

interface PremiumStatus {
  isPremium: boolean;
  planName?: string;
  expiresAt?: string;
  autoRenew: boolean;
}

export default function PremiumAccessPage(): JSX.Element {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    loadPremiumData();
  }, []);

  const loadPremiumData = async (): Promise<void> => {
    try {
      const [plansResult, statusResult] = await Promise.all([
        apiFetch<Array<{ id: string; name: string; description: string; price: number; duration: number; features: string[]; tier: string }>>('/v1/subscription/plans'),
        apiFetch<{ status: string; plan?: { name: string }; endDate: string; autoRenew: boolean }>('/v1/subscription/current'),
      ]);

      if (plansResult.success && plansResult.data) {
        setPlans(plansResult.data.map((plan) => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          duration: plan.duration === 7 ? 'weekly' : plan.duration === 30 ? 'monthly' : 'yearly',
          features: plan.features,
          isPopular: plan.tier === 'premium',
        })));
      }

      if (statusResult.success && statusResult.data) {
        const sub = statusResult.data;
        setStatus({
          isPremium: sub.status === 'active',
          planName: sub.plan?.name,
          expiresAt: sub.endDate,
          autoRenew: sub.autoRenew,
        });
      }
    } catch (error) {
      webLogger.error('Failed to load premium data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string): Promise<void> => {
    setIsPurchasing(true);
    try {
      const result = await apiFetch('/v1/subscription/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId, autoRenew: true }),
      });

      if (result.success) {
        alert('You are now a premium member!');
        loadPremiumData();
      }
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to subscribe');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (!confirm('Are you sure you want to cancel your premium subscription?')) return;

    try {
      const result = await apiFetch('/v1/subscription/cancel', {
        method: 'DELETE',
      });

      if (result.success) {
        alert('Subscription cancelled');
        loadPremiumData();
      }
    } catch (error) {
      alert('Failed to cancel subscription');
    }
  };

  const getDurationLabel = (duration: string): string => {
    switch (duration) {
      case 'weekly': return '/week';
      case 'monthly': return '/month';
      case 'yearly': return '/year';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading premium plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Premium Access</h1>
          <p className="text-muted-foreground">Unlock exclusive content and features</p>
        </div>

        {status?.isPremium && (
          <div className="bg-card rounded-lg border-2 border-yellow-500 p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">👑</span>
              <div>
                <h2 className="text-xl font-bold text-yellow-500">Premium Active</h2>
                <p className="text-muted-foreground">{status.planName}</p>
              </div>
            </div>
            <p className="text-foreground mb-2">
              Expires: {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'N/A'}
            </p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Auto-renew</span>
              <span className={`font-semibold ${status.autoRenew ? 'text-green-500' : 'text-red-500'}`}>
                {status.autoRenew ? 'On' : 'Off'}
              </span>
            </div>
            {status.autoRenew && (
              <button
                onClick={handleCancel}
                className="w-full px-4 py-3 bg-red-500/20 text-red-500 rounded-lg font-semibold hover:bg-red-500/30"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        )}

        <h2 className="text-xl font-bold text-foreground mb-6">Choose Your Plan</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card rounded-lg border-2 p-6 relative ${
                plan.isPopular ? 'border-primary' : 'border-border'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-primary">₦{plan.price.toLocaleString()}</span>
                <span className="text-muted-foreground">{getDurationLabel(plan.duration)}</span>
              </div>
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="text-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isPurchasing}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.isPopular
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-muted text-foreground hover:bg-accent'
                }`}
              >
                {isPurchasing ? 'Processing...' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
