'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users, UserPlus, TrendingUp, UserMinus, Globe } from 'lucide-react';

type Tab = 'list' | 'demographics';

export default function CreatorSubscribersPage(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('list');

  const subscribersQuery = useQuery({
    queryKey: ['creator-subscribers'],
    queryFn: async () => {
      const res = await api.creator.getSubscribers(1, 50);
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load subscribers');
      return res.data;
    },
    staleTime: 30000,
  });

  const statsQuery = useQuery({
    queryKey: ['creator-subscriber-stats'],
    queryFn: async () => {
      const res = await api.creator.getSubscriberStats();
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load stats');
      return res.data;
    },
    staleTime: 30000,
  });

  const { data: subData, isLoading, error: queryError } = subscribersQuery;
  const { data: stats, isLoading: statsLoading } = statsQuery;
  const subscribers = subData?.subscribers ?? [];
  const subscriberStats = stats ?? subData?.stats ?? null;

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
          Subscribers
        </h1>
        <p style={{ color: 'var(--text-muted, #9A8A7A)', marginBottom: 24 }}>
          Manage your subscribers and view demographics
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['list', 'demographics'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border:
                  tab === t ? '1px solid rgba(232,66,10,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: tab === t ? 'var(--brand-orange, #E8420A)' : '#18151e',
                color: tab === t ? '#FFFFFF' : 'var(--text-muted, #9A8A7A)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              {t === 'list' ? 'Subscriber List' : 'Demographics'}
            </button>
          ))}
        </div>

        {/* Stats cards */}
        {!statsLoading && subscriberStats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: '#18151e',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #9A8A7A)',
                    textTransform: 'uppercase',
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  Total
                </p>
                <Users size={14} color="#10B981" />
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#10B981', margin: 0 }}>
                {subscriberStats.totalSubscribers.toLocaleString()}
              </p>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: '#18151e',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #9A8A7A)',
                    textTransform: 'uppercase',
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  New This Week
                </p>
                <UserPlus size={14} color="#3B82F6" />
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#3B82F6', margin: 0 }}>
                {subscriberStats.newThisWeek.toLocaleString()}
              </p>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: '#18151e',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #9A8A7A)',
                    textTransform: 'uppercase',
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  New This Month
                </p>
                <TrendingUp size={14} color="#F59E0B" />
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B', margin: 0 }}>
                {subscriberStats.newThisMonth.toLocaleString()}
              </p>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: '#18151e',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #9A8A7A)',
                    textTransform: 'uppercase',
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  Churn Rate
                </p>
                <UserMinus size={14} color="#EF4444" />
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', margin: 0 }}>
                {subscriberStats.churnRate}%
              </p>
            </div>
          </div>
        )}

        {tab === 'list' ? (
          isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: '#18151e',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Skeleton height="20px" width="150px" />
                  <div style={{ marginTop: 8 }}>
                    <Skeleton height="12px" width="100px" />
                  </div>
                </div>
              ))}
            </div>
          ) : queryError ? (
            <ErrorState
              title="Failed to load subscribers"
              description={queryError?.message || 'An error occurred'}
              onButtonPress={() => subscribersQuery.refetch()}
            />
          ) : subscribers.length === 0 ? (
            <EmptyState
              icon="users"
              title="No subscribers yet"
              description="Share your content to attract subscribers"
              dark
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subscribers.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: '#18151e',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#100e14',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 600 }}>
                      {sub.displayName[0]}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#FFFFFF' }}>
                      {sub.displayName}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted, #9A8A7A)', marginTop: 2 }}>
                      Subscribed {new Date(sub.subscribedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {sub.plan && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: 'rgba(232,66,10,0.15)',
                        color: 'var(--brand-orange, #E8420A)',
                        border: '1px solid rgba(232,66,10,0.3)',
                      }}
                    >
                      {sub.plan}
                    </span>
                  )}
                  {sub.isGifted && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: 'rgba(245,158,11,0.15)',
                        color: '#F59E0B',
                        border: '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      Gift
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        ) : statsLoading || !subscriberStats?.demographics ? (
          <p style={{ color: 'var(--text-muted, #9A8A7A)', textAlign: 'center', padding: 40 }}>
            Loading demographics...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Age Groups */}
            <div
              style={{
                backgroundColor: '#18151e',
                borderRadius: 16,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#FFFFFF' }}>
                Age Groups
              </h3>
              {subscriberStats.demographics.ageGroups.map((group) => (
                <div key={group.range} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: 'var(--text-muted, #9A8A7A)' }}>{group.range}</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 500 }}>
                      {group.count.toLocaleString()} ({group.percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#100e14',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: 'var(--brand-orange, #E8420A)',
                        width: `${group.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Top Regions */}
            <div
              style={{
                backgroundColor: '#18151e',
                borderRadius: 16,
                padding: 20,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Globe size={18} color="#3B82F6" />
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#FFFFFF' }}>
                  Top Regions
                </h3>
              </div>
              {subscriberStats.demographics.topRegions.map((region) => (
                <div key={region.region} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: 'var(--text-muted, #9A8A7A)' }}>{region.region}</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 500 }}>
                      {region.count.toLocaleString()} ({region.percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#100e14',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: '#3B82F6',
                        width: `${region.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
