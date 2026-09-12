'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Eye,
  Heart,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  Share2,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalFollowers: number;
  totalEarnings: number;
  viewsGrowth: number;
  followersGrowth: number;
  earningsGrowth: number;
  topContent: Array<{ id: string; title: string; views: number; thumbnail: string }>;
  demographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    topCountries: Array<{ country: string; percentage: number }>;
    genderSplit: { male: number; female: number; other: number };
  };
  engagementMetrics: {
    avgWatchTime: number;
    completionRate: number;
    shareRate: number;
    commentRate: number;
  };
}

export default function CreatorAnalyticsPage(): React.JSX.Element {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'analytics', timeRange],
    queryFn: async () => {
      const res = await apiFetch<AnalyticsData>(`/v1/creators/analytics?range=${timeRange}`);
      if (res.success && res.data) return res.data;
      return null;
    },
  });

  if (error) {
    return (
      <div
        style={{
          backgroundColor: 'var(--brand-near-black, #0b090e)',
          minHeight: '100vh',
          color: 'var(--text-primary, #F5F0EB)',
        }}
      >
        <AppHeader active="Creator" logoVariant="light" />
        <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
          <ErrorState title="Failed to load analytics" />
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
        color: 'var(--text-primary, #F5F0EB)',
      }}
    >
      <AppHeader active="Creator" logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#FFFFFF' }}>Analytics</h1>
        <p style={{ color: 'var(--text-muted, #9A8A7A)', marginBottom: 24 }}>
          Track your content performance and growth
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
            Time Range
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border:
                    timeRange === range
                      ? '1px solid rgba(232,66,10,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                  background:
                    timeRange === range ? 'rgba(232,66,10,0.15)' : '#18151e',
                  color:
                    timeRange === range
                      ? 'var(--brand-orange, #E8420A)'
                      : 'var(--text-muted, #9A8A7A)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: timeRange === range ? 600 : 400,
                  transition: 'all 0.2s ease',
                }}
              >
                {range.toUpperCase()}
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
        ) : analytics ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
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
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                    Total Views
                  </p>
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(232,66,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={15} color="#E8420A" />
                  </div>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  {analytics.totalViews.toLocaleString()}
                </p>
              </div>

              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#18151e',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                    Likes
                  </p>
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(232,66,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={15} color="#E8420A" />
                  </div>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  {analytics.totalLikes.toLocaleString()}
                </p>
              </div>

              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#18151e',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                    Followers
                  </p>
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(232,66,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={15} color="#E8420A" />
                  </div>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  {analytics.totalFollowers.toLocaleString()}
                </p>
              </div>

              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#18151e',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                    Earnings
                  </p>
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={15} color="#10B981" />
                  </div>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#10B981', margin: 0 }}>
                  ₦{analytics.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#FFFFFF' }}>Top Content</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {analytics.topContent.map((item) => (
                  <div
                    key={item.id}
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
                    {item.thumbnail && (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: 600, fontSize: 14, margin: 0, color: '#FFFFFF' }}>{item.title}</h3>
                      <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: '4px 0 0 0' }}>
                        {item.views.toLocaleString()} views
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#FFFFFF' }}>
                Engagement Metrics
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: '#18151e',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                      Avg Watch Time
                    </p>
                    <Clock size={15} color="#9A8A7A" />
                  </div>
                  <p
                    style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0 }}
                  >
                    {analytics.engagementMetrics.avgWatchTime.toFixed(1)}s
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                      Completion Rate
                    </p>
                    <CheckCircle2 size={15} color="#10B981" />
                  </div>
                  <p
                    style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0 }}
                  >
                    {analytics.engagementMetrics.completionRate.toFixed(1)}%
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                      Share Rate
                    </p>
                    <Share2 size={15} color="#3B82F6" />
                  </div>
                  <p
                    style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0 }}
                  >
                    {analytics.engagementMetrics.shareRate.toFixed(1)}%
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 12, margin: 0 }}>
                      Comment Rate
                    </p>
                    <MessageSquare size={15} color="#A855F7" />
                  </div>
                  <p
                    style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0 }}
                  >
                    {analytics.engagementMetrics.commentRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#FFFFFF' }}>
                Audience Demographics
              </h2>
              <div
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: '#18151e',
                }}
              >
                <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 14, marginBottom: 12 }}>
                  Age Groups
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analytics.demographics.ageGroups.map((group) => (
                    <div
                      key={group.range}
                      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <span
                        style={{ width: 80, color: 'var(--text-muted, #9A8A7A)', fontSize: 12 }}
                      >
                        {group.range}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          backgroundColor: '#100e14',
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${group.percentage}%`,
                            height: '100%',
                            backgroundColor: 'var(--brand-orange, #E8420A)',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          width: 50,
                          textAlign: 'right',
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {group.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon="barChart"
            title="No analytics data available yet"
            description="Analytics will appear once your content gets views"
            dark
          />
        )}
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}

