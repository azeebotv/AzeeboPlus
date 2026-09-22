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
      <PageShell glowColor="rgba(232,66,10,0.12)">
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
    <PageShell glowColor="rgba(232,66,10,0.14)">
      <PageHero
        badge="Treasury & Settlement"
        title="Royalties & Earnings"
        description="Comprehensive accounting of streaming payouts, tip micro-transactions, and ad revenues across the universe."
      />

      <div className="max-w-5xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Period Selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-white/50">
            Accounting Horizon
          </span>
          <div className="flex items-center gap-1.5 p-1 rounded-full az-glass border border-white/10">
            {(['7d', '30d', '90d'] as const).map((p) => {
              const isActive = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[var(--brand-orange)] text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
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
                color: 'text-[var(--brand-orange)]',
                border: 'hover:border-[var(--brand-orange)]/40',
              },
              {
                label: 'Available Balance',
                value: `₦${earnings?.availableBalance.toLocaleString() || '0'}`,
                icon: Wallet,
                color: 'text-emerald-400',
                border: 'hover:border-emerald-500/40',
              },
              {
                label: 'Pending In Transit',
                value: `₦${earnings?.pendingEarnings.toLocaleString() || '0'}`,
                icon: Clock,
                color: 'text-amber-400',
                border: 'hover:border-amber-500/40',
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
                  className={`az-glass p-5 sm:p-6 rounded-2xl border border-white/10 ${stat.border} transition-all`}
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

        {/* Revenue Breakdown */}
        {earnings && (
          <ScrollReveal delay={0.1}>
            <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--brand-orange)]" />
                Revenue Stream Decomposition
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(earnings.revenueBreakdown).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-1">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <p className="text-xl font-bold text-white tracking-tight">
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
          <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10">
            <h2 className="text-lg font-bold text-white mb-6">Recent Settlement Ledger</h2>
            {!earnings || earnings.earningsHistory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-white/40">No earnings recorded for this timeframe.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {earnings.earningsHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.source}</p>
                        <p className="text-xs text-white/40">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        +₦{item.amount.toLocaleString()}
                      </p>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
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
