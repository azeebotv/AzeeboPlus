'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Spinner, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationLabel: string;
  features: string[];
  isPopular?: boolean;
}

interface WalletBalance {
  balance: number;
}

function SubscriptionPaymentPageContent(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const preselectedPlanId = searchParams.get('planId');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(preselectedPlanId);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'external'>('wallet');
  const [step, setStep] = useState<'select' | 'payment' | 'processing' | 'success' | 'error'>(
    preselectedPlanId ? 'payment' : 'select'
  );
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    analytics.pageView('subscription-payment');
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

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await apiFetch<Plan[]>('/v1/subscription/plans');
      if (res.success && res.data) {
        return res.data.map((plan) => ({
          ...plan,
          durationLabel:
            plan.duration === 7 ? 'Weekly' : plan.duration === 30 ? 'Monthly' : 'Yearly',
        }));
      }
      return [];
    },
    staleTime: 300000,
    enabled: isAuthenticated,
  });

  const walletQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const res = await apiFetch<WalletBalance>('/wallet');
      if (res.success && res.data) return res.data;
      return { balance: 0 };
    },
    staleTime: 60000,
    enabled: isAuthenticated,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) throw new Error('No plan selected');
      const res = await apiFetch('/v1/subscription/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          planId: selectedPlanId,
          paymentMethod,
          autoRenew: true,
        }),
      });
      if (res.success) return true;
      throw new Error(res.message || 'Failed to subscribe');
    },
    onSuccess: () => {
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err: Error) => {
      setStep('error');
      setToast({ message: err.message, type: 'error' });
    },
  });

  const plans: Plan[] = plansQuery.data ?? [];
  const walletBalance = walletQuery.data?.balance ?? 0;
  const isLoading = authLoading || plansQuery.isLoading;
  const error = plansQuery.error?.message;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const canAffordWithWallet = selectedPlan ? walletBalance >= selectedPlan.price : false;

  const handleProceedToPayment = () => {
    if (!selectedPlanId) {
      setToast({ message: 'Please select a plan', type: 'error' });
      return;
    }
    setStep('payment');
  };

  const handleConfirmPayment = () => {
    setStep('processing');
    subscribeMutation.mutate();
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Wallet" />

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Subscribe</h1>
            <p className="text-white/50">Complete your subscription setup</p>
          </div>
        </ScrollReveal>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {['Select Plan', 'Payment', 'Confirm'].map((label, index) => {
            const stepNumber = index + 1;
            const currentStep =
              step === 'select' ? 1 : step === 'payment' ? 2 : step === 'processing' ? 3 : 3;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: isCompleted
                      ? '#22C55E'
                      : isActive
                        ? '#E8420A'
                        : 'rgba(255,255,255,0.1)',
                    color: isCompleted || isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <span
                  className="text-sm hidden sm:block"
                  style={{
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {label}
                </span>
                {index < 2 && (
                  <div
                    className="w-8 h-0.5 mx-2"
                    style={{
                      backgroundColor: isCompleted ? '#22C55E' : 'rgba(255,255,255,0.1)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Select Plan */}
        {step === 'select' && (
          <ScrollReveal>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="az-glass p-6 rounded-xl">
                    <Spinner size="md" color="#E8420A" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <ErrorState
                title="Failed to load plans"
                description={error}
                onButtonPress={() => plansQuery.refetch()}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <motion.button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="text-left p-6 rounded-xl transition-all"
                    style={{
                      backgroundColor:
                        selectedPlanId === plan.id
                          ? 'rgba(232,66,10,0.1)'
                          : 'rgba(255,255,255,0.03)',
                      border: `2px solid ${
                        selectedPlanId === plan.id
                          ? '#E8420A'
                          : plan.isPopular
                            ? 'rgba(232,66,10,0.3)'
                            : 'rgba(255,255,255,0.06)'
                      }`,
                      boxShadow:
                        selectedPlanId === plan.id ? '0 0 20px rgba(232,66,10,0.15)' : 'none',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.isPopular && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-3"
                        style={{ backgroundColor: '#E8420A', color: '#fff' }}
                      >
                        Popular
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-2xl font-bold mb-2" style={{ color: '#E8420A' }}>
                      ₦{plan.price.toLocaleString()}
                      <span className="text-sm font-normal text-white/50">
                        /{plan.durationLabel.toLowerCase()}
                      </span>
                    </p>
                    <p className="text-sm text-white/50 mb-4">{plan.description}</p>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                          <span style={{ color: '#22C55E' }}>✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.button>
                ))}
              </div>
            )}

            {selectedPlanId && (
              <div className="mt-8 text-center">
                <motion.button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="az-btn-primary px-12"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue to Payment
                </motion.button>
              </div>
            )}
          </ScrollReveal>
        )}

        {/* Step 2: Payment Method */}
        {step === 'payment' && selectedPlan && (
          <ScrollReveal>
            <GlowCard universe="movies" className="p-8 mb-8">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
              <div
                className="flex justify-between items-center mb-4 pb-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-white/50">Plan</span>
                <span className="text-white font-medium">{selectedPlan.name}</span>
              </div>
              <div
                className="flex justify-between items-center mb-4 pb-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-white/50">Duration</span>
                <span className="text-white font-medium">{selectedPlan.durationLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50">Total</span>
                <span className="text-2xl font-bold" style={{ color: '#E8420A' }}>
                  ₦{selectedPlan.price.toLocaleString()}
                </span>
              </div>
            </GlowCard>

            <GlowCard universe="movies" className="p-8 mb-8">
              <h2 className="text-xl font-bold text-white mb-6">Payment Method</h2>

              {/* Wallet Option */}
              <motion.button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className="w-full p-4 rounded-xl text-left mb-3 transition-all"
                style={{
                  border: `2px solid ${paymentMethod === 'wallet' ? '#22C55E' : 'rgba(255,255,255,0.1)'}`,
                  backgroundColor:
                    paymentMethod === 'wallet' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-white font-semibold">Pay from Wallet</p>
                      <p className="text-xs text-white/40">
                        Balance: ₦{walletBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!canAffordWithWallet && paymentMethod === 'wallet' && (
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                    >
                      Insufficient
                    </span>
                  )}
                </div>
              </motion.button>

              {/* External Payment Option */}
              <motion.button
                type="button"
                onClick={() => setPaymentMethod('external')}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  border: `2px solid ${paymentMethod === 'external' ? '#E8420A' : 'rgba(255,255,255,0.1)'}`,
                  backgroundColor:
                    paymentMethod === 'external' ? 'rgba(232,66,10,0.1)' : 'rgba(255,255,255,0.03)',
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="text-white font-semibold">Card / Bank Transfer</p>
                    <p className="text-xs text-white/40">Pay with card or bank transfer</p>
                  </div>
                </div>
              </motion.button>
            </GlowCard>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 py-3 rounded-full font-semibold transition-all"
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back
              </motion.button>
              <motion.button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentMethod === 'wallet' && !canAffordWithWallet}
                className="flex-1 py-3 rounded-full font-semibold transition-all az-btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Confirm & Pay ₦{selectedPlan.price.toLocaleString()}
              </motion.button>
            </div>
          </ScrollReveal>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="text-center py-20">
            <Spinner size="lg" color="#E8420A" />
            <p className="mt-4 text-white/60 text-lg">Processing your payment...</p>
            <p className="text-white/40 text-sm mt-2">Please don't close this page</p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <ScrollReveal>
            <div className="text-center py-20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-6xl mb-6"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Subscription Active!</h2>
              <p className="text-white/50 mb-8">
                Welcome to {selectedPlan?.name}. Enjoy premium content!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/wallet/subscription-current">
                  <motion.button
                    type="button"
                    className="px-8 py-3 rounded-full font-semibold az-btn-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Subscription
                  </motion.button>
                </Link>
                <Link href="/movies">
                  <motion.button
                    type="button"
                    className="px-8 py-3 rounded-full font-semibold"
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Browse Content
                  </motion.button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Error */}
        {step === 'error' && (
          <ScrollReveal>
            <div className="text-center py-20">
              <p className="text-6xl mb-6">😞</p>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
              <p className="text-white/50 mb-8">Something went wrong. Please try again.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="px-8 py-3 rounded-full font-semibold az-btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
                <Link href="/wallet/subscription-plans">
                  <motion.button
                    type="button"
                    className="px-8 py-3 rounded-full font-semibold"
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Plans
                  </motion.button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
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

const LazySubscriptionPaymentPage = lazy(() =>
  Promise.resolve({ default: SubscriptionPaymentPageContent })
);

export default function SubscriptionPaymentPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazySubscriptionPaymentPage />
    </Suspense>
  );
}
