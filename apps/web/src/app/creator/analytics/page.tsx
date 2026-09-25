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
      <PageShell glowColor="rgba(232,66,10,0.12)">
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
    <PageShell glowColor="rgba(232,66,10,0.14)">
      <PageHero
        badge="Audience Telemetry"
        title="Studio Analytics"
        description="Granular performance insights, audience demographics, and playback retention metrics."
      />

      <div className="max-w-5xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Time Horizon Selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-white/50">
            Observation Interval
          </span>
          <div className="flex items-center gap-1.5 p-1 rounded-full az-glass border border-white/10">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => {
              const isActive = timeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[var(--brand-orange)] text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
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
                color: 'text-[var(--brand-orange)]',
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
                color: 'text-emerald-400',
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="az-glass p-5 sm:p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                      {stat.label}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
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
              <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--brand-orange)]" />
                  Top Performing Releases
                </h2>
                <div className="space-y-3">
                  {analytics.topContent.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 flex items-center gap-4 transition-all"
                    >
                      {item.thumbnail && (
                        <div className="w-14 h-14 rounded-lg overflow-hidden relative flex-shrink-0 bg-white/5 border border-white/10">
                          <OptimizedImage
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">
                          {item.title}
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
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
                <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-blue-400" />
                    Playback Dynamics
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase text-white/40">Watch Time</span>
                        <Clock className="w-3.5 h-3.5 text-white/40" />
                      </div>
                      <p className="text-xl font-bold text-white">
                        {analytics.engagementMetrics.avgWatchTime.toFixed(1)}s
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase text-white/40">Completion</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-xl font-bold text-white">
                        {analytics.engagementMetrics.completionRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase text-white/40">Virality / Share</span>
                        <Share2 className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <p className="text-xl font-bold text-white">
                        {analytics.engagementMetrics.shareRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase text-white/40">Comments</span>
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <p className="text-xl font-bold text-white">
                        {analytics.engagementMetrics.commentRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audience Age Groups */}
                <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10">
                  <h2 className="text-lg font-bold text-white mb-6">
                    Audience Demographics
                  </h2>
                  <div className="space-y-4">
                    {analytics.demographics.ageGroups.map((group) => (
                      <div key={group.range} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60 font-medium">{group.range} years</span>
                          <span className="text-white font-mono font-bold">{group.percentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[var(--brand-orange)] to-amber-500 rounded-full"
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
          <div className="az-glass p-12 text-center rounded-3xl border border-white/10">
            <BarChart2 className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Analytics Collected</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Audience streams and playback engagement data will populate once your content premieres.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
