'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface Plan { id: string; name: string; price: number; features: string[]; isPopular?: boolean; }

export default function SubscriptionPlansPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) { router.push('/auth/login'); return; }
    loadPlans();
  }, [isAuthenticated, user, router]);

  const loadPlans = async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([
        apiFetch<any>('/subscriptions/plans'),
        apiFetch<any>('/subscriptions/status'),
      ]);
      if (plansRes.success && plansRes.data) {
        const data = plansRes.data as any;
        setPlans(Array.isArray(data) ? data : data.plans || []);
      }
      if (statusRes.success && statusRes.data) {
        const status = statusRes.data as any;
        setCurrentPlan(status.planId || null);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      await apiFetch<any>('/subscriptions', { method: 'POST', body: JSON.stringify({ planId }) });
      setCurrentPlan(planId);
    } catch { /* ignore */ }
    setSubscribing(null);
  };

  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ paddingTop: 100, paddingBottom: 60, maxWidth: 1000, margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>Subscription Plans</h1>
          <p style={{ color: '#9A8A7A', marginTop: 8, fontSize: 16 }}>Choose the plan that works best for you</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {plans.map(plan => {
              const isCurrent = currentPlan === plan.id;
              return (
                <div key={plan.id} className="az-glass" style={{ padding: 28, borderRadius: 20, position: 'relative', border: plan.isPopular ? '2px solid #E8420A' : '1px solid #2A1A1A' }}>
                  {plan.isPopular && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 999, background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                      Most Popular
                    </div>
                  )}
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{plan.name}</h3>
                  <p style={{ fontSize: 32, fontWeight: 700, color: '#E8420A', marginBottom: 20 }}>
                    ₦{plan.price.toLocaleString()}<span style={{ fontSize: 14, color: '#9A8A7A', fontWeight: 400 }}>/month</span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {plan.features.map((feature, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#D4C8B8' }}>
                        <span style={{ color: '#0D3B2E' }}>✓</span> {feature}
                      </div>
                    ))}
                  </div>
                  {isCurrent ? (
                    <div style={{ padding: '12px 0', textAlign: 'center', borderRadius: 999, border: '1px solid #0D3B2E', color: '#0D3B2E', fontWeight: 600, fontSize: 14 }}>
                      Current Plan
                    </div>
                  ) : (
                    <button onClick={() => handleSubscribe(plan.id)} disabled={subscribing === plan.id} className="az-btn-primary" style={{ width: '100%', padding: '12px 0', borderRadius: 999, border: plan.isPopular ? 'none' : '1px solid #2A1A1A', background: plan.isPopular ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent', color: plan.isPopular ? '#fff' : '#9A8A7A', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                      {subscribing === plan.id ? 'Processing...' : 'Subscribe'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
