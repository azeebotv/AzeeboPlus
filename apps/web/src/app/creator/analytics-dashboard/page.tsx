'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { messageOf, requireData } from '@/lib/payload';
import { Eye, Users, DollarSign, TrendingUp, Clock, Sparkles } from 'lucide-react';

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

  const {
    data: analytics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['creator-analytics', timeRange],
    queryFn: async () => {
      const res = await apiFetch<AnalyticsData>(`/creator/analytics?range=${timeRange}`);
      return requireData(res) ?? null;
    },
  });

  const overview = analytics?.overview;
  const dash = '—';

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 14%, transparent)">
      <PageHero
        badge="Real-time Metrics"
        title="Studio Analytics Cockpit"
        description="Comprehensive telemetry on audience growth, retention velocity, and revenue attribution."
      />

      <div className="max-w-6xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Time Filter */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-az-ink/50">
            Observation Period
          </span>
          <div className="flex items-center gap-1.5 p-1 az-glass border border-az-glass-border">
            {(['7d', '30d', '90d'] as const).map((range) => {
              const isActive = timeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[var(--color-az-flame)] text-az-ink shadow-lg'
                      : 'text-az-ink/60 hover:text-az-ink'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              );
            })}
          </div>
        </div>

        {isError && (
          <ErrorState
            title="Analytics unavailable"
            description={`${messageOf(error)} Metrics are withheld rather than shown as zero.`}
            onButtonPress={() => refetch()}
          />
        )}

        {/* Overview Cards */}
        <ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))
            ) : (
              <>
                <MetricCard
                  icon={<Eye className="w-5 h-5 text-az-secondary-400" />}
                  label="Total Views"
                  value={isError ? dash : overview?.totalViews?.toLocaleString() || '0'}
                  growth={isError ? undefined : overview?.viewsGrowth}
                />
                <MetricCard
                  icon={<Users className="w-5 h-5 text-az-success-400" />}
                  label="Followers"
                  value={isError ? dash : overview?.totalFollowers?.toLocaleString() || '0'}
                  growth={isError ? undefined : overview?.followersGrowth}
                />
                <MetricCard
                  icon={<DollarSign className="w-5 h-5 text-[var(--color-az-flame)]" />}
                  label="Earnings"
                  value={isError ? dash : `₦${overview?.totalEarnings?.toLocaleString() || '0'}`}
                  growth={isError ? undefined : overview?.earningsGrowth}
                />
                <MetricCard
                  icon={<Clock className="w-5 h-5 text-purple-400" />}
                  label="Avg Watch Time"
                  value={isError ? dash : `${overview?.avgWatchTime || 0}m`}
                />
              </>
            )}
          </div>
        </ScrollReveal>

        {/* Content Performance Table */}
        <ScrollReveal delay={0.1}>
          <div className="az-glass p-6 sm:p-8 border border-az-glass-border space-y-6">
            <h2 className="text-base font-bold text-az-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-az-flame)]" />
              Asset Performance Matrix
            </h2>
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : isError ? null : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-az-glass-border text-az-ink/40 font-mono uppercase tracking-wider">
                      <th className="pb-3 pr-4">Title</th>
                      <th className="pb-3 px-4">Views</th>
                      <th className="pb-3 px-4">Reactions</th>
                      <th className="pb-3 px-4">Shares</th>
                      <th className="pb-3 pl-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-az-ink/5">
                    {(analytics?.contentPerformance ?? []).map((item) => (
                      <tr key={item.id} className="hover:bg-az-ink/[0.02] transition-colors">
                        <td className="py-3.5 pr-4 font-semibold text-az-ink max-w-xs truncate">
                          {item.title}
                        </td>
                        <td className="py-3.5 px-4 text-az-ink/60 font-mono">
                          {item.views.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-az-ink/60 font-mono">
                          {item.likes.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-az-ink/60 font-mono">
                          {item.shares.toLocaleString()}
                        </td>
                        <td className="py-3.5 pl-4 text-right font-mono font-bold text-az-success-400">
                          ₦{item.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Engagement Rate Badge */}
        {overview && (
          <ScrollReveal delay={0.2}>
            <div className="az-glass p-6 border border-az-glass-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-az-ink/40 block">
                  Overall Platform Engagement Score
                </span>
                <p className="text-2xl font-extrabold text-az-ink mt-1">
                  {overview.engagementRate || 0}%
                </p>
              </div>
              <span
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                  (overview.engagementRate || 0) > 5
                    ? 'bg-az-success-500/10 text-az-success-400 border-az-success-500/20'
                    : 'bg-az-secondary-500/10 text-az-secondary-400 border-az-secondary-500/20'
                }`}
              >
                {(overview.engagementRate || 0) > 5 ? 'High Performance' : 'Standard Benchmark'}
              </span>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageShell>
  );
}

function MetricCard({
  icon,
  label,
  value,
  growth,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  growth?: number;
}) {
  return (
    <div className="az-glass p-5 sm:p-6 border border-az-glass-border transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wider text-az-ink/40">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-az-glass-fill border border-az-glass-border flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-extrabold text-az-ink tracking-tight mb-1">{value}</p>
      {growth !== undefined && (
        <div
          className={`text-xs font-mono font-semibold flex items-center gap-1 ${
            growth >= 0 ? 'text-az-success-400' : 'text-az-error-400'
          }`}
        >
          <TrendingUp className={`w-3.5 h-3.5 ${growth < 0 ? 'rotate-180' : ''}`} />
          {growth >= 0 ? '+' : ''}
          {growth}% vs previous period
        </div>
      )}
    </div>
  );
}
