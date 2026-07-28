'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

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
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader active="Creator" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Subscribers</h1>
        <p style={{ color: '#9A8A7A', marginBottom: 24 }}>
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
                border: '1px solid #2A1A1A',
                background: tab === t ? '#E8420A' : 'transparent',
                color: tab === t ? '#fff' : '#9A8A7A',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
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
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid #2A1A1A',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#9A8A7A',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Total
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#4ADE80' }}>
                {subscriberStats.totalSubscribers.toLocaleString()}
              </p>
            </div>
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid #2A1A1A',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#9A8A7A',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                New This Week
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#60A5FA' }}>
                {subscriberStats.newThisWeek.toLocaleString()}
              </p>
            </div>
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid #2A1A1A',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#9A8A7A',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                New This Month
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#FBBF24' }}>
                {subscriberStats.newThisMonth.toLocaleString()}
              </p>
            </div>
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid #2A1A1A',
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: '#9A8A7A',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Churn Rate
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#F87171' }}>
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
                    backgroundColor: 'rgba(255,255,255,0.03)',
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
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>No subscribers yet</p>
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
                    borderRadius: 12,
                    border: '1px solid #2A1A1A',
                    backgroundColor: 'rgba(26,10,10,0.5)',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#2A1A1A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: '#9A8A7A', fontSize: 16 }}>{sub.displayName[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{sub.displayName}</p>
                    <p style={{ fontSize: 12, color: '#9A8A7A', marginTop: 2 }}>
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
                        color: '#E8420A',
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
                        color: '#FBBF24',
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
          <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>
            Loading demographics...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Age Groups */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Age Groups</h3>
              {subscriberStats.demographics.ageGroups.map((group) => (
                <div key={group.range} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: '#9A8A7A' }}>{group.range}</span>
                    <span style={{ color: '#F5F0EB' }}>
                      {group.count.toLocaleString()} ({group.percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#2A1A1A',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: '#E8420A',
                        width: `${group.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Top Regions */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Top Regions</h3>
              {subscriberStats.demographics.topRegions.map((region) => (
                <div key={region.region} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: '#9A8A7A' }}>{region.region}</span>
                    <span style={{ color: '#F5F0EB' }}>
                      {region.count.toLocaleString()} ({region.percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#2A1A1A',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 3,
                        backgroundColor: '#60A5FA',
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
      <AppFooter />
    </div>
  );
}
