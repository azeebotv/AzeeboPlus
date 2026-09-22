'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Users, UserPlus, TrendingUp, UserMinus, Globe, Sparkles } from 'lucide-react';

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

  const { data: subData, isLoading, error: queryError, refetch } = subscribersQuery;
  const { data: stats, isLoading: statsLoading } = statsQuery;
  const subscribers = subData?.subscribers ?? [];
  const subscriberStats = stats ?? subData?.stats ?? null;

  return (
    <PageShell glowColor="rgba(232,66,10,0.14)">
      <PageHero
        badge="Audience Circle"
        title="Subscriber Community"
        description="Monitor tier memberships, direct supporter retention, and geographical distribution of your audience."
      />

      <div className="max-w-4xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Stats Row */}
        {!statsLoading && subscriberStats && (
          <ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Active',
                  value: subscriberStats.totalSubscribers.toLocaleString(),
                  icon: Users,
                  color: 'text-emerald-400',
                },
                {
                  label: 'New (7 Days)',
                  value: `+${subscriberStats.newThisWeek.toLocaleString()}`,
                  icon: UserPlus,
                  color: 'text-blue-400',
                },
                {
                  label: 'New (30 Days)',
                  value: `+${subscriberStats.newThisMonth.toLocaleString()}`,
                  icon: TrendingUp,
                  color: 'text-[var(--brand-orange)]',
                },
                {
                  label: 'Churn Rate',
                  value: `${subscriberStats.churnRate}%`,
                  icon: UserMinus,
                  color: 'text-red-400',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="az-glass p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                        {item.label}
                      </span>
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <p className="text-2xl font-extrabold text-white tracking-tight">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full az-glass border border-white/10 self-start w-fit">
          {(['list', 'demographics'] as Tab[]).map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[var(--brand-orange)] text-white shadow-lg'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {t === 'list' ? 'Subscribers Ledger' : 'Audience Demographics'}
              </button>
            );
          })}
        </div>

        {tab === 'list' ? (
          isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="az-glass p-5 rounded-2xl border border-white/10 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </div>
          ) : queryError ? (
            <div className="max-w-md mx-auto py-12">
              <ErrorState
                title="Failed to load subscribers"
                description={queryError.message}
                onButtonPress={() => refetch()}
              />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="az-glass p-12 text-center rounded-3xl border border-white/10">
              <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Active Subscribers Yet</h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Promote your exclusive universe releases to convert viewers into paid subscribers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscribers.map((sub) => (
                <ScrollReveal key={sub.id}>
                  <div className="az-glass p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-[var(--brand-orange)]/15 border border-[var(--brand-orange)]/30 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        {sub.displayName ? sub.displayName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{sub.displayName}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          Subscribed {new Date(sub.subscribedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.plan && (
                        <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-[var(--brand-orange)]/15 border border-[var(--brand-orange)]/30 text-[var(--brand-orange)]">
                          {sub.plan}
                        </span>
                      )}
                      {sub.isGifted && (
                        <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          Gift Pass
                        </span>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )
        ) : statsLoading || !subscriberStats?.demographics ? (
          <div className="az-glass p-12 text-center rounded-3xl border border-white/10">
            <p className="text-xs text-white/50">Aggregating subscriber telemetry...</p>
          </div>
        ) : (
          <ScrollReveal>
            <div className="space-y-6">
              {/* Age Groups */}
              <div className="az-glass p-6 sm:p-7 rounded-3xl border border-white/10">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--brand-orange)]" />
                  Age Demographics
                </h3>
                <div className="space-y-4">
                  {subscriberStats.demographics.ageGroups.map((group) => (
                    <div key={group.range} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">{group.range} years</span>
                        <span className="text-white font-mono font-bold">
                          {group.count.toLocaleString()} ({group.percentage}%)
                        </span>
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

              {/* Top Regions */}
              <div className="az-glass p-6 sm:p-7 rounded-3xl border border-white/10">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  Regional Density
                </h3>
                <div className="space-y-4">
                  {subscriberStats.demographics.topRegions.map((region) => (
                    <div key={region.region} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/60">{region.region}</span>
                        <span className="text-white font-mono font-bold">
                          {region.count.toLocaleString()} ({region.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${region.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageShell>
  );
}
