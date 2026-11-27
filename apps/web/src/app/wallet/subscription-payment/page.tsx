'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { Spinner, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Check, CreditCard, Wallet, ShieldCheck, AlertTriangle } from 'lucide-react';
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
    queryKey: ['wallet', 'balance:object'],
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
      // Conversion event: fires once when the checkout lands on the success step.
      if (selectedPlan) {
        analytics.paymentProcessed('subscription', selectedPlan.price, 'NGN', paymentMethod, {
          planId: selectedPlan.id,
          planName: selectedPlan.name,
        });
      }
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
        badge="Checkout & Activation"
        title="Complete Subscription"
        description="Choose your billing rail and finalize your streaming activation."
      />

      <div className="max-w-3xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {['Select Plan', 'Payment Method', 'Confirm Activation'].map((label, index) => {
            const stepNumber = index + 1;
            const currentStep =
              step === 'select' ? 1 : step === 'payment' ? 2 : step === 'processing' ? 3 : 3;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                    isCompleted
                      ? 'bg-az-success-500/20 text-az-success-400 border-az-success-500/30'
                      : isActive
                        ? 'bg-az-flame text-az-surface-root border-az-flame'
                        : 'bg-az-ink/5 text-az-ink/40 border-az-ink/10'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:block ${
                    isActive ? 'text-az-ink' : 'text-az-ink/50'
                  }`}
                >
                  {label}
                </span>
                {index < 2 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-az-success-500/50' : 'bg-az-ink/10'
                    }`}
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
                  <div key={i} className="az-glass p-6">
                    <Spinner size="md" color="var(--color-az-flame)" />
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
                    className={`text-left p-6 rounded-xl transition-all border-2 ${
                      selectedPlanId === plan.id
                        ? 'border-az-flame bg-az-scarlet/10 shadow-az-glow'
                        : plan.isPopular
                          ? 'border-az-scarlet/30 bg-az-ink/5'
                          : 'border-az-ink/5 bg-az-ink/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.isPopular && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-3 bg-az-flame text-az-surface-root">
                        Popular
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-az-ink mb-1">{plan.name}</h3>
                    <p className="text-2xl font-bold mb-2 text-az-flame">
                      ₦{plan.price.toLocaleString()}
                      <span className="text-sm font-normal text-az-ink/50">
                        /{plan.durationLabel.toLowerCase()}
                      </span>
                    </p>
                    <p className="text-sm text-az-ink/50 mb-4">{plan.description}</p>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-az-ink/60">
                          <Check className="w-3.5 h-3.5 text-az-success-400 flex-shrink-0" />
                          <span>{feature}</span>
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
                  className="az-btn-primary az-btn-primary--inline"
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
              <h2 className="text-xl font-bold text-az-ink mb-6">Order Summary</h2>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-az-ink/10">
                <span className="text-az-ink/50">Plan</span>
                <span className="text-az-ink font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-az-ink/10">
                <span className="text-az-ink/50">Duration</span>
                <span className="text-az-ink font-medium">{selectedPlan.durationLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-az-ink/50">Total</span>
                <span className="az-section-title text-az-flame">
                  ₦{selectedPlan.price.toLocaleString()}
                </span>
              </div>
            </GlowCard>

            <GlowCard universe="movies" className="p-8 mb-8">
              <h2 className="text-xl font-bold text-az-ink mb-6">Payment Method</h2>

              {/* Wallet Option */}
              <motion.button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`w-full p-4 rounded-xl text-left mb-3 transition-all border-2 ${
                  paymentMethod === 'wallet'
                    ? 'border-az-success-500 bg-az-success-500/10'
                    : 'border-az-ink/10 bg-az-ink/5'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-az-success-500/10 border border-az-success-500/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-az-success-400" />
                    </div>
                    <div>
                      <p className="text-az-ink font-semibold">Pay from Wallet</p>
                      <p className="text-xs text-az-ink/40">
                        Balance: ₦{walletBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!canAffordWithWallet && paymentMethod === 'wallet' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-az-error-500/15 text-az-error-400">
                      Insufficient
                    </span>
                  )}
                </div>
              </motion.button>

              {/* External Payment Option */}
              <motion.button
                type="button"
                onClick={() => setPaymentMethod('external')}
                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                  paymentMethod === 'external'
                    ? 'border-az-flame bg-az-scarlet/10'
                    : 'border-az-ink/10 bg-az-ink/5'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-az-flame/10 border border-az-flame/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-az-flame" />
                  </div>
                  <div>
                    <p className="text-az-ink font-semibold">Card / Bank Transfer</p>
                    <p className="text-xs text-az-ink/40">Pay with card or bank transfer</p>
                  </div>
                </div>
              </motion.button>
            </GlowCard>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 py-3 rounded-full font-semibold transition-all border border-az-ink/20 bg-az-ink/10 text-az-ink"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back
              </motion.button>
              <motion.button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentMethod === 'wallet' && !canAffordWithWallet}
                className="flex-1 transition-all az-btn-primary"
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
            <Spinner size="lg" color="var(--color-az-flame)" />
            <p className="mt-4 text-az-ink/60 text-lg">Processing your payment...</p>
            <p className="text-az-ink/40 text-sm mt-2">Please don't close this page</p>
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
                className="w-16 h-16 rounded-full bg-az-success-500/20 border border-az-success-500/40 flex items-center justify-center mx-auto mb-6"
              >
                <ShieldCheck className="w-8 h-8 text-az-success-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-az-ink mb-2">Subscription Active!</h2>
              <p className="text-az-ink/50 mb-8">
                Welcome to {selectedPlan?.name}. Enjoy premium content!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/wallet/subscription-current">
                  <motion.button
                    type="button"
                    className="az-btn-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    View Subscription
                  </motion.button>
                </Link>
                <Link href="/movies">
                  <motion.button
                    type="button"
                    className="px-8 py-3 rounded-full font-semibold border border-az-ink/20 bg-az-ink/10 text-az-ink"
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
              <div className="w-16 h-16 rounded-full bg-az-error-500/20 border border-az-error-500/40 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-az-error-400" />
              </div>
              <h2 className="text-2xl font-bold text-az-ink mb-2">Payment Failed</h2>
              <p className="text-az-ink/50 mb-8">Something went wrong. Please try again.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="az-btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
                <Link href="/wallet/subscription-plans">
                  <motion.button
                    type="button"
                    className="px-8 py-3 rounded-full font-semibold border border-az-ink/20 bg-az-ink/10 text-az-ink"
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

const LazySubscriptionPaymentPage = lazy(() =>
  Promise.resolve({ default: SubscriptionPaymentPageContent })
);

export default function SubscriptionPaymentPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="text-az-ink/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazySubscriptionPaymentPage />
    </Suspense>
  );
}
