'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { CheckCircle2, Sparkles, Wallet, CreditCard, ShieldCheck, X } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  isPopular?: boolean;
}

interface SubscriptionStatus {
  planId: string | null;
  status: string;
}

interface SubscribeResult {
  success: boolean;
  planId: string;
}

interface WalletBalance {
  balance: number;
}

export default function SubscriptionPlansPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadPlans();
  }, [authLoading, isAuthenticated, user, router]);

  const loadPlans = async () => {
    try {
      const [plansRes, statusRes, walletRes] = await Promise.all([
        apiFetch<Plan[]>('/v1/subscription/plans'),
        apiFetch<SubscriptionStatus>('/v1/subscription/current'),
        apiFetch<WalletBalance>('/wallet'),
      ]);
      if (plansRes.success && plansRes.data) {
        const data = plansRes.data;
        setPlans(Array.isArray(data) ? data : []);
      }
      if (statusRes.success && statusRes.data) {
        const status = statusRes.data;
        setCurrentPlan(status.planId || null);
      }
      if (walletRes.success && walletRes.data) {
        setWalletBalance(walletRes.data.balance);
      }
    } catch {
      setError('Failed to load subscription plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, paymentMethod: 'wallet' | 'external') => {
    setSubscribing(planId);
    setConfirmPlan(null);
    try {
      const result = await apiFetch<SubscribeResult>('/v1/subscription/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId, paymentMethod }),
      });
      if (result.success) {
        setCurrentPlan(planId);
        loadPlans();
      }
    } catch {
      /* ignore */
    }
    setSubscribing(null);
  };

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <PageHero
        badge="Streaming Access"
        title="Subscription Plans"
        description="Select the perfect pass to unlock uninterrupted 4K African cinema premieres, reality TV voting rights, and ad-free listening."
        rightElement={
          walletBalance !== null ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">
              <Wallet className="w-3.5 h-3.5 text-orange-400" />
              <span>
                Wallet Balance: <strong className="text-white">₦{walletBalance.toLocaleString()}</strong>
              </span>
            </div>
          ) : undefined
        }
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 -mt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-white/10 border-t-[var(--brand-orange)] rounded-full animate-spin mb-4" />
            <p className="text-xs text-white/40">Loading plan options...</p>
          </div>
        ) : error ? (
          <div className="az-glass p-8 rounded-3xl border border-white/10 text-center max-w-md mx-auto">
            <p className="text-red-400 text-sm mb-4 leading-relaxed">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                loadPlans();
              }}
              className="az-btn-primary px-6 py-2.5 rounded-full text-xs font-bold"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isPopular = plan.isPopular;
              return (
                <div
                  key={plan.id}
                  className={`az-glass p-7 sm:p-8 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative ${
                    isPopular
                      ? 'border-orange-500/40 bg-gradient-to-b from-orange-500/[0.08] to-transparent shadow-[0_12px_40px_rgba(232,66,10,0.15)] scale-105 z-10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#e8420a] to-[#cc1c1c] text-white text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-white/10">
                      <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                        ₦{plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/50 font-normal">/ month</span>
                    </div>

                    <div className="space-y-3 mb-8">
                      {(plan.features ?? []).map((feature, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-white/70">
                          <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    {isCurrent ? (
                      <div className="w-full py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center tracking-wide">
                        Current Active Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmPlan(plan)}
                        disabled={subscribing === plan.id}
                        className={`w-full py-3.5 rounded-2xl text-xs font-bold tracking-wide transition-all ${
                          isPopular
                            ? 'az-btn-primary shadow-lg hover:shadow-orange-500/20'
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                        }`}
                      >
                        {subscribing === plan.id ? 'Processing...' : 'Choose ' + plan.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Security and Guarantee Badge */}
        <div className="mt-12 az-glass p-6 rounded-3xl border border-white/10 text-center max-w-xl mx-auto flex items-center justify-center gap-3 text-xs text-white/50">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>Encrypted Nigerian & African banking standards. Cancel or change your subscription anytime.</span>
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmPlan &&
        (() => {
          const canAffordWallet = walletBalance !== null && walletBalance >= confirmPlan.price;
          return (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in"
              onClick={() => setConfirmPlan(null)}
            >
              <div
                className="az-glass p-8 rounded-3xl border border-white/15 max-w-sm w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setConfirmPlan(null)}
                  className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-extrabold text-white mb-1 tracking-tight">
                  Confirm Subscription
                </h3>
                <p className="text-xs text-white/60 mb-6">
                  {confirmPlan.name} • ₦{confirmPlan.price.toLocaleString()}/month
                </p>

                {walletBalance !== null && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-6 flex items-center justify-between text-xs">
                    <span className="text-white/60">Wallet Balance:</span>
                    <strong className="text-white font-mono">₦{walletBalance.toLocaleString()}</strong>
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  {walletBalance !== null && (
                    <button
                      onClick={() => handleSubscribe(confirmPlan.id, 'wallet')}
                      disabled={subscribing === confirmPlan.id || !canAffordWallet}
                      className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        canAffordWallet
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                          : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      {subscribing === confirmPlan.id
                        ? 'Processing...'
                        : canAffordWallet
                          ? 'Pay from Wallet Balance'
                          : 'Insufficient Wallet Funds'}
                    </button>
                  )}
                  <button
                    onClick={() => handleSubscribe(confirmPlan.id, 'external')}
                    disabled={subscribing === confirmPlan.id}
                    className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold az-btn-primary flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    {subscribing === confirmPlan.id ? 'Processing...' : 'Pay with Card / Transfer'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </PageShell>
  );
}
