'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

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
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const isEnabled = !authLoading && !!isAuthenticated && !!user;

  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'analytics', timeRange],
    queryFn: async () => {
      const result = await apiFetch<Record<string, unknown>>(
        `/v1/creators/analytics?range=${timeRange}`
      );
      if (result.success && result.data) {
        const d = result.data;
        return {
          totalViews: Number(d.views ?? d.totalViews ?? 0),
          totalLikes: Number(d.likes ?? d.totalLikes ?? 0),
          totalFollowers: Number(d.followers ?? d.totalFollowers ?? 0),
          totalEarnings: Number(d.earnings ?? d.totalEarnings ?? 0),
          viewsGrowth: Number(d.viewsGrowth ?? 0),
          followersGrowth: Number(d.followersGrowth ?? 0),
          earningsGrowth: Number(d.earningsGrowth ?? 0),
          topContent: Array.isArray(d.topContent)
            ? (d.topContent as Array<Record<string, unknown>>).map((c) => ({
                id: String(c.id),
                title: String(c.title || ''),
                views: Number(c.views ?? c.viewCount ?? 0),
                thumbnail: String(c.thumbnail || ''),
              }))
            : [],
          demographics: (d.demographics as AnalyticsData['demographics']) || {
            ageGroups: [],
            topCountries: [],
            genderSplit: { male: 0, female: 0, other: 0 },
          },
          engagementMetrics: ((d.engagementMetrics ||
            d.analytics) as AnalyticsData['engagementMetrics']) || {
            avgWatchTime: 0,
            completionRate: 0,
            shareRate: 0,
            commentRate: 0,
          },
        } as AnalyticsData;
      }
      return null;
    },
    enabled: isEnabled,
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton width="120px" height="20px" className="mb-4" />
            <Skeleton width="200px" height="32px" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass p-6">
                <Skeleton width="60%" height="32px" className="mb-2" />
                <Skeleton width="40%" height="16px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Failed to load analytics"
            description="Please try again later"
            onButtonPress={() => router.refresh()}
          />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Views',
      value: formatNumber(analytics.totalViews),
      growth: analytics.viewsGrowth,
    },
    {
      label: 'Followers',
      value: formatNumber(analytics.totalFollowers),
      growth: analytics.followersGrowth,
    },
    {
      label: 'Earnings',
      value: `₦${formatNumber(analytics.totalEarnings)}`,
      growth: analytics.earningsGrowth,
    },
    { label: 'Likes', value: formatNumber(analytics.totalLikes), growth: null },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-white/50 hover:text-white mb-2 flex items-center gap-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>{' '}
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Creator Analytics</h1>
        </div>

        <div className="flex gap-2 mb-8" role="listbox" aria-label="Time range">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              role="option"
              aria-selected={timeRange === range}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${timeRange === range ? 'az-btn-primary' : ''}`}
              style={
                timeRange !== range
                  ? {
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                    }
                  : undefined
              }
            >
              {range === '7d'
                ? '7 Days'
                : range === '30d'
                  ? '30 Days'
                  : range === '90d'
                    ? '90 Days'
                    : 'All Time'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="az-glass p-6">
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-white/50 mt-1">{stat.label}</p>
              {stat.growth !== null && (
                <p
                  className={`text-sm font-medium mt-2`}
                  style={{ color: stat.growth >= 0 ? '#22C55E' : '#EF4444' }}
                >
                  {stat.growth >= 0 ? '↑' : '↓'} {Math.abs(stat.growth)}%
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="az-glass p-6">
            <h2 className="text-xl font-bold text-white mb-4">Engagement Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Avg Watch Time', value: `${analytics.engagementMetrics.avgWatchTime}m` },
                {
                  label: 'Completion Rate',
                  value: `${analytics.engagementMetrics.completionRate}%`,
                },
                { label: 'Share Rate', value: `${analytics.engagementMetrics.shareRate}%` },
                { label: 'Comment Rate', value: `${analytics.engagementMetrics.commentRate}%` },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="text-center p-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem' }}
                >
                  <p className="text-2xl font-bold" style={{ color: '#E8420A' }}>
                    {metric.value}
                  </p>
                  <p className="text-sm text-white/50 mt-1">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="az-glass p-6">
            <h2 className="text-xl font-bold text-white mb-4">Top Performing Content</h2>
            <div className="space-y-3">
              {analytics.topContent.slice(0, 5).map((content, index) => (
                <div key={content.id} className="flex items-center gap-3">
                  <span className="text-lg font-bold w-8" style={{ color: '#E8420A' }}>
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-white truncate">{content.title}</p>
                    <p className="text-sm text-white/50">{formatNumber(content.views)} views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="az-glass p-6">
          <h2 className="text-xl font-bold text-white mb-4">Audience Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Age Groups</h3>
              <div className="space-y-3">
                {analytics.demographics.ageGroups.map((age) => (
                  <div key={age.range} className="flex items-center gap-3">
                    <span className="text-sm text-white w-16">{age.range}</span>
                    <div
                      className="flex-1 h-2 rounded-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${age.percentage}%`, backgroundColor: '#E8420A' }}
                      />
                    </div>
                    <span className="text-sm text-white w-12 text-right">{age.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Top Countries</h3>
              <div className="space-y-3">
                {analytics.demographics.topCountries.map((country) => (
                  <div key={country.country} className="flex items-center gap-3">
                    <span className="text-sm text-white w-24">{country.country}</span>
                    <div
                      className="flex-1 h-2 rounded-full"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${country.percentage}%`, backgroundColor: '#0D3B2E' }}
                      />
                    </div>
                    <span className="text-sm text-white w-12 text-right">
                      {country.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
