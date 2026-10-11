'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { DollarSign, Wallet, Clock, TrendingUp, Sparkles, ArrowUpRight } from 'lucide-react';

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
    refetch,
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
      <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
        <div className="max-w-xl mx-auto py-20 px-4">
          <ErrorState
            title="Failed to load earnings"
            description="Unable to sync royalty ledgers from the treasury."
            onButtonPress={() => refetch()}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 14%, transparent)">
      <PageHero
        badge="Treasury & Settlement"
        title="Royalties & Earnings"
        description="Comprehensive accounting of streaming payouts, tip micro-transactions, and ad revenues across the universe."
      />

      <div className="max-w-5xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-az-ink/50">
            Accounting Horizon
          </span>
          <div className="flex items-center gap-1.5 p-1 az-glass border border-az-glass-border">
            {(['7d', '30d', '90d'] as const).map((p) => {
              const isActive = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[var(--color-az-flame)] text-az-ink shadow-lg'
                      : 'text-az-ink/60 hover:text-az-ink'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Metric Cards */}
        <ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                label: 'Total Earnings',
                value: `₦${earnings?.totalEarnings.toLocaleString() || '0'}`,
                icon: DollarSign,
                color: 'text-[var(--color-az-flame)]',
                border: 'hover:border-[var(--color-az-flame)]/40',
              },
              {
                label: 'Available Balance',
                value: `₦${earnings?.availableBalance.toLocaleString() || '0'}`,
                icon: Wallet,
                color: 'text-az-success-400',
                border: 'hover:border-az-success-500/40',
              },
              {
                label: 'Pending In Transit',
                value: `₦${earnings?.pendingEarnings.toLocaleString() || '0'}`,
                icon: Clock,
                color: 'text-az-warning-400',
                border: 'hover:border-az-warning-500/40',
              },
              {
                label: 'Lifetime Accrual',
                value: `₦${earnings?.lifetimeEarnings.toLocaleString() || '0'}`,
                icon: TrendingUp,
                color: 'text-purple-400',
                border: 'hover:border-purple-500/40',
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`az-glass p-5 sm:p-6 border border-az-glass-border ${stat.border} transition-all`}
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

        {/* Revenue Breakdown */}
        {earnings && (
          <ScrollReveal delay={0.1}>
            <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
              <h2 className="text-lg font-bold text-az-ink mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-az-flame)]" />
                Revenue Stream Decomposition
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(earnings.revenueBreakdown).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-xl bg-az-ink/[0.03] border border-az-ink/5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-az-ink/40 block mb-1">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <p className="text-xl font-bold text-az-ink tracking-tight">
                      ₦{value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Recent Payout History */}
        <ScrollReveal delay={0.2}>
          <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
            <h2 className="text-lg font-bold text-az-ink mb-6">Recent Settlement Ledger</h2>
            {!earnings || earnings.earningsHistory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-az-ink/40">No earnings recorded for this timeframe.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {earnings.earningsHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-az-ink/[0.03] border border-az-ink/5 hover:border-az-glass-border flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-az-glass-fill border border-az-glass-border flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-az-success-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-az-ink">{item.source}</p>
                        <p className="text-xs text-az-ink/40">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-az-success-400">
                        +₦{item.amount.toLocaleString()}
                      </p>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'completed'
                            ? 'bg-az-success-500/10 text-az-success-400'
                            : 'bg-az-warning-500/10 text-az-warning-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </PageShell>
  );
}
