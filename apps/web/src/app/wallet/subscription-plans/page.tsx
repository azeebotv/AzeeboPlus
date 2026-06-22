'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { webLogger } from '@/lib/logger';
import { apiFetch } from '@/lib/api';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
  isActive: boolean;
  tier: string;
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan?: SubscriptionPlan;
}

export default function SubscriptionPlansPage(): JSX.Element {
  const router = useRouter();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      const [plansResult, subscriptionResult] = await Promise.all([
        apiFetch<SubscriptionPlan[]>('/v1/subscription/plans'),
        apiFetch<Subscription>('/v1/subscription/current'),
      ]);

      if (plansResult.success && plansResult.data) {
        setPlans(plansResult.data);
      }

      if (subscriptionResult.success && subscriptionResult.data) {
        setCurrentSubscription(subscriptionResult.data);
      }
    } catch (err) {
      webLogger.error('Failed to load subscription data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan): Promise<void> => {
    setIsSubscribing(plan.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiFetch('/v1/subscription/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          planId: plan.id,
          autoRenew: true,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to subscribe');
      }

      setSuccess('Subscription activated successfully!');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while subscribing');
    } finally {
      setIsSubscribing(null);
    }
  };

  const handleCancelSubscription = async (): Promise<void> => {
    if (!currentSubscription) return;

    setShowCancelConfirm(false);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiFetch(`/v1/subscription/${currentSubscription.id}`, {
        method: 'DELETE',
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to cancel subscription');
      }

      setSuccess('Subscription cancelled successfully');
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while cancelling');
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'free':
        return 'bg-gray-500';
      case 'basic':
        return 'bg-blue-500';
      case 'premium':
        return 'bg-purple-500';
      case 'enterprise':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-500">{success}</p>
              </div>
            </div>
          </div>
        )}

        {currentSubscription && (
          <div className="bg-card p-6 rounded-lg border-2 border-primary mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Current Plan</h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  currentSubscription.status === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {currentSubscription.status}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {currentSubscription.plan?.name || 'N/A'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Expires: {new Date(currentSubscription.endDate).toLocaleDateString()}
            </p>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-2 bg-destructive text-white rounded-md text-sm font-medium hover:bg-destructive/90"
            >
              Cancel Subscription
            </button>
          </div>
        )}

        <h2 className="text-xl font-semibold text-foreground mb-6">Available Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.planId === plan.id;
            const isPopular = plan.tier === 'premium';

            return (
              <div
                key={plan.id}
                className={`bg-card rounded-lg border p-6 relative ${
                  isPopular ? 'border-primary border-2' : 'border-border'
                } ${isCurrentPlan ? 'opacity-70' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getTierColor(plan.tier)}`}
                  >
                    {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                  </span>
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                </div>

                <div className="flex items-baseline mb-4">
                  <span className="text-2xl text-foreground font-semibold">₦</span>
                  <span className="text-4xl text-foreground font-bold">
                    {plan.price.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground ml-1">/{plan.duration} days</span>
                </div>

                <p className="text-muted-foreground mb-6 text-sm">{plan.description}</p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-green-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                  disabled={isCurrentPlan || isSubscribing === plan.id}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : isPopular
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-card border border-border text-foreground hover:bg-accent'
                  } disabled:opacity-50`}
                >
                  {isSubscribing === plan.id ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </div>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-foreground mb-2">Cancel Subscription</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to cancel your subscription? You will lose access at the end of
              your billing period.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2 px-4 border border-border text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-destructive hover:bg-destructive/90"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
