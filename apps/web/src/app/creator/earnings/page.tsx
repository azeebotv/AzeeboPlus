'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { EmptyState } from '@/components/ui/EmptyState';
import { DollarSign, Wallet, Clock, TrendingUp } from 'lucide-react';

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
      <div
        style={{
          backgroundColor: 'var(--brand-near-black, #0b090e)',
          minHeight: '100vh',
          color: 'var(--text-primary)',
        }}
      >
        <AppHeader active="Creator" logoVariant="light" />
        <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
          <ErrorState title="Failed to load earnings" />
        </main>
        <AppFooter logoVariant="light" />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--brand-near-black, #0b090e)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      <AppHeader active="Creator" logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#FFFFFF' }}>
          Earnings
        </h1>
        <p style={{ color: 'var(--text-muted, #9A8A7A)', marginBottom: 24 }}>
          Track your revenue and payouts
        </p>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              color: 'var(--text-muted, #9A8A7A)',
              fontSize: 13,
              marginBottom: 8,
              display: 'block',
            }}
          >
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
                  border:
                    period === p
                      ? '1px solid rgba(232,66,10,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                  background: period === p ? 'rgba(232,66,10,0.15)' : '#18151e',
                  color:
                    period === p ? 'var(--brand-orange, #E8420A)' : 'var(--text-muted, #9A8A7A)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: period === p ? 600 : 400,
                  transition: 'all 0.2s ease',
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
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#18151e',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                    Total Earnings
                  </p>
                  <DollarSign size={15} color="#E8420A" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  ₦{earnings.totalEarnings.toLocaleString()}
                </p>
              </div>

              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#18151e',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                    Available Balance
                  </p>
                  <Wallet size={15} color="#10B981" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#10B981', margin: 0 }}>
                  ₦{earnings.availableBalance.toLocaleString()}
                </p>
              </div>

              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#18151e',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                    Pending
                  </p>
                  <Clock size={15} color="#F59E0B" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B', margin: 0 }}>
                  ₦{earnings.pendingEarnings.toLocaleString()}
                </p>
              </div>

              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#18151e',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                    Lifetime
                  </p>
                  <TrendingUp size={15} color="#A855F7" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  ₦{earnings.lifetimeEarnings.toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#FFFFFF' }}>
                Revenue Breakdown
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {Object.entries(earnings.revenueBreakdown).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: '#18151e',
                    }}
                  >
                    <p
                      style={{
                        color: 'var(--text-muted, #9A8A7A)',
                        fontSize: 12,
                        textTransform: 'capitalize',
                        margin: '0 0 6px 0',
                      }}
                    >
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                      ₦{value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#FFFFFF' }}>
                Recent Earnings
              </h2>
              {earnings.earningsHistory.length === 0 ? (
                <p
                  style={{ color: 'var(--text-muted, #9A8A7A)', textAlign: 'center', padding: 40 }}
                >
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
                        border: '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: '#18151e',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: '#FFFFFF',
                            margin: 0,
                          }}
                        >
                          {item.source}
                        </p>
                        <p
                          style={{
                            color: 'var(--text-muted, #9A8A7A)',
                            fontSize: 12,
                            margin: '4px 0 0 0',
                          }}
                        >
                          {item.date}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: item.status === 'pending' ? '#F59E0B' : '#10B981',
                            margin: 0,
                          }}
                        >
                          ₦{item.amount.toLocaleString()}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted, #9A8A7A)',
                            textTransform: 'uppercase',
                            margin: '4px 0 0 0',
                          }}
                        >
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
          <EmptyState
            icon="dollar"
            title="No earnings data available yet"
            description="Start creating content to earn money"
            dark
          />
        )}
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
