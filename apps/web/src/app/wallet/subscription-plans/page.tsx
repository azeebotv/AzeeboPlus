'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

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
    <div
      style={{
        backgroundColor: 'var(--brand-near-black, #0b090e)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      <AppHeader logoVariant="light" />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 1000,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>Subscription Plans</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 16 }}>
            Choose the plan that works best for you
          </p>
          {walletBalance !== null && (
            <p
              style={{ color: 'var(--brand-forest)', marginTop: 8, fontSize: 14, fontWeight: 600 }}
            >
              Wallet Balance: ₦{walletBalance.toLocaleString()}
            </p>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #18151e',
                borderTopColor: 'var(--brand-orange)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: 'var(--brand-orange)', marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                loadPlans();
              }}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                background: 'var(--brand-orange)',
                color: 'var(--brand-white)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              return (
                <div
                  key={plan.id}
                  className="az-glass"
                  style={{
                    padding: 28,
                    borderRadius: 20,
                    position: 'relative',
                    border: plan.isPopular ? '2px solid #E8420A' : '1px solid #18151e',
                  }}
                >
                  {plan.isPopular && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '4px 16px',
                        borderRadius: 999,
                        background:
                          'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--brand-white)',
                      }}
                    >
                      Most Popular
                    </div>
                  )}
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
                  <p
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: 'var(--brand-orange)',
                      marginBottom: 20,
                    }}
                  >
                    ₦{plan.price.toLocaleString()}
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>
                      /month
                    </span>
                  </p>
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}
                  >
                    {(plan.features ?? []).map((feature, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 14,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span style={{ color: 'var(--brand-forest)' }}></span> {feature}
                      </div>
                    ))}
                  </div>
                  {isCurrent ? (
                    <div
                      style={{
                        padding: '12px 0',
                        textAlign: 'center',
                        borderRadius: 999,
                        border: '1px solid rgba(16,185,129,0.3)',
                        backgroundColor: 'rgba(16,185,129,0.1)',
                        color: '#34D399',
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmPlan(plan)}
                      disabled={subscribing === plan.id}
                      className="az-btn-primary"
                      style={{
                        width: '100%',
                        padding: '12px 0',
                        borderRadius: 999,
                        border: plan.isPopular ? 'none' : '1px solid #18151e',
                        background: plan.isPopular
                          ? 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)'
                          : 'transparent',
                        color: plan.isPopular ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      {subscribing === plan.id ? 'Processing...' : 'Subscribe'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {confirmPlan &&
        (() => {
          const canAffordWallet = walletBalance !== null && walletBalance >= confirmPlan.price;
          return (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 24,
              }}
              onClick={() => setConfirmPlan(null)}
            >
              <div
                className="az-glass"
                style={{ padding: 32, borderRadius: 20, maxWidth: 400, width: '100%' }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                  Confirm Subscription
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {confirmPlan.name} — ₦{confirmPlan.price.toLocaleString()}/month
                </p>

                {walletBalance !== null && (
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
                    Wallet: ₦{walletBalance.toLocaleString()}
                  </p>
                )}

                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}
                >
                  {walletBalance !== null && (
                    <button
                      onClick={() => handleSubscribe(confirmPlan.id, 'wallet')}
                      disabled={subscribing === confirmPlan.id || !canAffordWallet}
                      style={{
                        width: '100%',
                        padding: '12px 0',
                        borderRadius: 999,
                        background: canAffordWallet
                          ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                          : 'var(--bg-secondary)',
                        color: canAffordWallet ? 'white' : 'var(--brand-grey)',
                        border: 'none',
                        cursor: canAffordWallet ? 'pointer' : 'not-allowed',
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {subscribing === confirmPlan.id
                        ? 'Processing...'
                        : canAffordWallet
                          ? 'Pay from Wallet'
                          : 'Insufficient Balance'}
                    </button>
                  )}
                  <button
                    onClick={() => handleSubscribe(confirmPlan.id, 'external')}
                    disabled={subscribing === confirmPlan.id}
                    style={{
                      width: '100%',
                      padding: '12px 0',
                      borderRadius: 999,
                      background:
                        'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
                      color: 'var(--brand-white)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {subscribing === confirmPlan.id ? 'Processing...' : 'Pay with Card / Transfer'}
                  </button>
                </div>

                <button
                  onClick={() => setConfirmPlan(null)}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 999,
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })()}

      <AppFooter logoVariant="light" />
    </div>
  );
}
