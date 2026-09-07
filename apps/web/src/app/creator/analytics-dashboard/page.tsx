'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
import { Eye, Users, DollarSign, TrendingUp, Clock } from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalViews: number;
    viewsGrowth: number;
    totalFollowers: number;
    followersGrowth: number;
    totalEarnings: number;
    earningsGrowth: number;
    avgWatchTime: number;
    engagementRate: number;
  };
  demographics: {
    countries: Array<{ name: string; percentage: number }>;
    ageGroups: Array<{ range: string; percentage: number }>;
    genders: Array<{ type: string; percentage: number }>;
  };
  contentPerformance: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    revenue: number;
  }>;
  watchTimeByHour: Array<{ hour: number; views: number }>;
  recentGrowth: Array<{ date: string; views: number; followers: number }>;
}

export default function CreatorAnalyticsDashboard(): React.JSX.Element {
  useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['creator-analytics', timeRange],
    queryFn: async () => {
      const res = await apiFetch<AnalyticsData>(`/creator/analytics?range=${timeRange}`);
      return res.success ? res.data : null;
    },
  });

  const overview = analytics?.overview;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary, #1A0A0A)',
        minHeight: '100vh',
        color: 'var(--text-primary, #F5F0EB)',
      }}
    >
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Analytics Dashboard</h1>
            <p style={{ color: 'var(--text-muted, #9A8A7A)' }}>
              Track your content performance and earnings
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: timeRange === range ? 'var(--brand-orange)' : 'var(--glass-bg)',
                  color: timeRange === range ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="120px" borderRadius="16px" />
            ))
          ) : (
            <>
              <MetricCard
                icon={<Eye size={20} />}
                label="Total Views"
                value={overview?.totalViews?.toLocaleString() || '0'}
                growth={overview?.viewsGrowth}
                color="#3B82F6"
              />
              <MetricCard
                icon={<Users size={20} />}
                label="Followers"
                value={overview?.totalFollowers?.toLocaleString() || '0'}
                growth={overview?.followersGrowth}
                color="#10B981"
              />
              <MetricCard
                icon={<DollarSign size={20} />}
                label="Earnings"
                value={`₦${overview?.totalEarnings?.toLocaleString() || '0'}`}
                growth={overview?.earningsGrowth}
                color="#F59E0B"
              />
              <MetricCard
                icon={<Clock size={20} />}
                label="Avg Watch Time"
                value={`${overview?.avgWatchTime || 0}m`}
                color="#8B5CF6"
              />
            </>
          )}
        </div>

        {/* Content Performance */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Content Performance</h2>
          {isLoading ? (
            <Skeleton height="200px" borderRadius="8px" />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Content
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Views
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Likes
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Comments
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                      }}
                    >
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.contentPerformance?.map((content) => (
                    <tr key={content.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{content.title}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {content.views.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {content.likes.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {content.comments.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          color: 'var(--brand-emerald)',
                        }}
                      >
                        ₦{content.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Demographics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {/* Countries */}
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Top Countries</h3>
            {isLoading ? (
              <Skeleton height="150px" borderRadius="8px" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analytics?.demographics?.countries?.slice(0, 5).map((country) => (
                  <div
                    key={country.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{country.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 60,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'var(--border-default)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${country.percentage}%`,
                            height: '100%',
                            backgroundColor: 'var(--brand-orange)',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          width: 36,
                          textAlign: 'right',
                        }}
                      >
                        {country.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Age Groups */}
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Age Distribution</h3>
            {isLoading ? (
              <Skeleton height="150px" borderRadius="8px" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analytics?.demographics?.ageGroups?.map((group) => (
                  <div
                    key={group.range}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{group.range}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 60,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'var(--border-default)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${group.percentage}%`,
                            height: '100%',
                            backgroundColor: 'var(--brand-blue)',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          width: 36,
                          textAlign: 'right',
                        }}
                      >
                        {group.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Engagement Rate */}
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Engagement</h3>
            {isLoading ? (
              <Skeleton height="150px" borderRadius="8px" />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    border: '8px solid var(--brand-orange)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <span style={{ fontSize: 28, fontWeight: 700 }}>
                    {overview?.engagementRate || 0}%
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Engagement Rate</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  {overview?.engagementRate && overview.engagementRate > 5 ? 'Excellent' : 'Good'}{' '}
                  performance
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  growth,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  growth?: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid var(--glass-border)',
        backgroundColor: 'var(--glass-bg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{value}</div>
      {growth !== undefined && (
        <div
          style={{
            fontSize: 12,
            color: growth >= 0 ? 'var(--brand-emerald)' : 'var(--brand-red)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <TrendingUp size={14} style={{ transform: growth < 0 ? 'rotate(180deg)' : 'none' }} />
          {growth >= 0 ? '+' : ''}
          {growth}% vs last period
        </div>
      )}
    </div>
  );
}
