'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  pendingEarnings: number;
  lifetimeEarnings: number;
  earningsHistory: Array<{
    date: string;
    amount: number;
    source: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
  revenueBreakdown: { subscriptions: number; tips: number; ads: number; superVotes: number };
}

export default function CreatorEarningsPage(): React.JSX.Element {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const {
    data: earnings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'earnings', period],
    queryFn: async () => {
      const res = await apiFetch<EarningsData>(`/v1/creators/earnings?range=${period}`);
      if (res.success && res.data) return res.data;
      return {
        totalEarnings: 0,
        availableBalance: 0,
        pendingEarnings: 0,
        lifetimeEarnings: 0,
        earningsHistory: [],
        revenueBreakdown: { subscriptions: 0, tips: 0, ads: 0, superVotes: 0 },
      };
    },
  });

  if (error) {
    return (
      <div style={{ backgroundColor: 'var(--brand-near-black)', minHeight: '100vh', color: 'var(--text-primary)' }}>
        <AppHeader active="Creator" />
        <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
          <ErrorState title="Failed to load earnings" />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--brand-near-black)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <AppHeader active="Creator" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Earnings</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Track your revenue and payouts</p>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8, display: 'block' }}>
            Period
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  background: period === p ? 'rgba(232,66,10,0.2)' : 'transparent',
                  color: period === p ? 'var(--brand-orange)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : earnings ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'rgba(26,10,10,0.5)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Total Earnings</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₦{earnings.totalEarnings.toLocaleString()}
                </p>
              </div>
              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'rgba(26,10,10,0.5)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Available Balance</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success-400)' }}>
                  ₦{earnings.availableBalance.toLocaleString()}
                </p>
              </div>
              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'rgba(26,10,10,0.5)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Pending</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-warning-500)' }}>
                  ₦{earnings.pendingEarnings.toLocaleString()}
                </p>
              </div>
              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'rgba(26,10,10,0.5)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>Lifetime</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₦{earnings.lifetimeEarnings.toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Revenue Breakdown</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {Object.entries(earnings.revenueBreakdown).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'rgba(26,10,10,0.5)',
                    }}
                  >
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₦{value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Recent Earnings</h2>
              {earnings.earningsHistory.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
                  No recent earnings
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {earnings.earningsHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        borderRadius: 16,
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'rgba(26,10,10,0.5)',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>
                          {item.source}
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.date}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: item.status === 'pending' ? 'var(--color-warning-500)' : 'var(--color-success-400)',
                          }}
                        >
                          ₦{item.amount.toLocaleString()}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                          {item.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            No earnings data available yet.
          </p>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
