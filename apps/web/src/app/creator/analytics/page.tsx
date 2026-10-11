'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import {
  Eye,
  Heart,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  Share2,
  MessageSquare,
  Sparkles,
  BarChart2,
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
    refetch,
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
      <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
        <div className="max-w-xl mx-auto py-20 px-4">
          <ErrorState
            title="Failed to load analytics"
            description="Unable to sync streaming telemetry for your studio."
            onButtonPress={() => refetch()}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 14%, transparent)">
      <PageHero
        badge="Audience Telemetry"
        title="Studio Analytics"
        description="Granular performance insights, audience demographics, and playback retention metrics."
      />

      <div className="max-w-5xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Time Horizon Selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-az-ink/50">
            Observation Interval
          </span>
          <div className="flex items-center gap-1.5 p-1 az-glass border border-az-glass-border">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => {
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
                  {range.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                label: 'Total Views',
                value: analytics?.totalViews.toLocaleString() || '0',
                icon: Eye,
                color: 'text-[var(--color-az-flame)]',
              },
              {
                label: 'Reactions / Likes',
                value: analytics?.totalLikes.toLocaleString() || '0',
                icon: Heart,
                color: 'text-pink-400',
              },
              {
                label: 'Audience Reach',
                value: analytics?.totalFollowers.toLocaleString() || '0',
                icon: Users,
                color: 'text-purple-400',
              },
              {
                label: 'Revenue Accrued',
                value: `₦${analytics?.totalEarnings.toLocaleString() || '0'}`,
                icon: DollarSign,
                color: 'text-az-success-400',
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="az-glass p-5 sm:p-6 border border-az-glass-border transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-az-ink/40">
                      {stat.label}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-az-glass-fill border border-az-glass-border flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="az-headline text-2xl sm:text-3xl font-extrabold text-az-ink">
                      {stat.value}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {analytics ? (
          <>
            {/* Top Performing Releases */}
            <ScrollReveal delay={0.1}>
              <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
                <h2 className="text-lg font-bold text-az-ink mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--color-az-flame)]" />
                  Top Performing Releases
                </h2>
                <div className="space-y-3">
                  {analytics.topContent.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-az-ink/[0.03] border border-az-ink/5 hover:border-az-glass-border flex items-center gap-4 transition-all"
                    >
                      {item.thumbnail && (
                        <div className="w-14 h-14 rounded-lg overflow-hidden relative flex-shrink-0 bg-az-glass-fill border border-az-glass-border">
                          <OptimizedImage
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-az-ink truncate">{item.title}</h3>
                        <p className="text-xs text-az-ink/50 mt-0.5">
                          {item.views.toLocaleString()} verified streams
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Engagement Metrics & Demographics */}
            <ScrollReveal delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Engagement Breakdown */}
                <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
                  <h2 className="text-lg font-bold text-az-ink mb-6 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-az-secondary-400" />
                    Playback Dynamics
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-az-ink/[0.03] border border-az-ink/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase text-az-ink/40">
                          Watch Time
                        </span>
                        <Clock className="w-3.5 h-3.5 text-az-ink/40" />
                      </div>
                      <p className="text-xl font-bold text-az-ink">
                        {analytics.engagementMetrics.avgWatchTime.toFixed(1)}s
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-az-ink/[0.03] border border-az-ink/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase text-az-ink/40">
                          Completion
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-az-success-400" />
                      </div>
                      <p className="text-xl font-bold text-az-ink">
                        {analytics.engagementMetrics.completionRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-az-ink/[0.03] border border-az-ink/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase text-az-ink/40">
                          Virality / Share
                        </span>
                        <Share2 className="w-3.5 h-3.5 text-az-secondary-400" />
                      </div>
                      <p className="text-xl font-bold text-az-ink">
                        {analytics.engagementMetrics.shareRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-az-ink/[0.03] border border-az-ink/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase text-az-ink/40">
                          Comments
                        </span>
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <p className="text-xl font-bold text-az-ink">
                        {analytics.engagementMetrics.commentRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audience Age Groups */}
                <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
                  <h2 className="text-lg font-bold text-az-ink mb-6">Audience Demographics</h2>
                  <div className="space-y-4">
                    {analytics.demographics.ageGroups.map((group) => (
                      <div key={group.range} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-az-ink/60 font-medium">{group.range} years</span>
                          <span className="text-az-ink font-mono font-bold">
                            {group.percentage}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-az-glass-fill overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[var(--color-az-flame)] to-az-warning-500 rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </>
        ) : (
          <div className="az-glass p-12 text-center border border-az-glass-border">
            <BarChart2 className="w-12 h-12 text-az-ink/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-az-ink mb-2">No Analytics Collected</h3>
            <p className="text-xs text-az-ink/50 max-w-sm mx-auto">
              Audience streams and playback engagement data will populate once your content
              premieres.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
