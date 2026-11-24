'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { api, apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { Clock, DollarSign, Wallet, ShieldCheck, Zap } from 'lucide-react';

interface MonetizationData {
  eligibility: { isEligible: boolean; requirements: string[] };
  earnings: { totalEarned: number; pendingPayout: number; paidOut: number };
  settings: { enableSuperTips: boolean; enableSponsoredContent: boolean; minPayoutAmount: number };
}

export default function MonetizationPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const isEnabled = !authLoading && !!isAuthenticated && !!user;

  const {
    data: monetization,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['creator', 'monetization'],
    queryFn: async () => {
      const response = await api.creator.getStats();
      if (response.success && response.data) {
        const d = response.data as {
          totalEarnings?: number;
          totalViews?: number;
          pendingEarnings?: number;
        };
        return {
          eligibility: {
            isEligible: (d.totalEarnings || 0) > 0,
            requirements: (d.totalViews || 0) < 1000 ? ['Reach 1,000 verified streams'] : [],
          },
          earnings: {
            totalEarned: d.totalEarnings || 0,
            pendingPayout: d.pendingEarnings || 0,
            paidOut: 0,
          },
          settings: { enableSuperTips: true, enableSponsoredContent: false, minPayoutAmount: 5000 },
        } as MonetizationData;
      }
      return {
        eligibility: { isEligible: false, requirements: [] },
        earnings: { totalEarned: 0, pendingPayout: 0, paidOut: 0 },
        settings: { enableSuperTips: false, enableSponsoredContent: false, minPayoutAmount: 5000 },
      } as MonetizationData;
    },
    enabled: isEnabled,
  });

  const toggleSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: boolean }) =>
      apiFetch('/v1/creators/monetization/settings', {
        method: 'PUT',
        body: JSON.stringify({ [key]: value }),
      }),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['creator', 'monetization'] });
      const previous = queryClient.getQueryData<MonetizationData>(['creator', 'monetization']);
      if (previous) {
        queryClient.setQueryData<MonetizationData>(['creator', 'monetization'], {
          ...previous,
          settings: { ...previous.settings, [key]: value },
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['creator', 'monetization'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'monetization'] });
    },
  });

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  if (isLoading) {
    return (
      <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
        <div className="max-w-3xl mx-auto py-20 px-4 space-y-6">
          <Skeleton className="h-12 w-48 rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !monetization) {
    return (
      <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
        <div className="max-w-md mx-auto py-20 px-4">
          <ErrorState
            title="Failed to load monetization"
            description="Unable to sync monetization program configuration."
            onButtonPress={() => refetch()}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 14%, transparent)">
      <PageHero
        badge="Revenue Architecture"
        title="Monetization Engine"
        description="Configure audience tips, brand partnerships, and direct-to-creator streaming payouts."
      />

      <div className="max-w-4xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Eligibility Banner */}
        <ScrollReveal>
          <div className="az-glass p-6 sm:p-7 border border-az-glass-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    monetization.eligibility.isEligible
                      ? 'bg-az-success-500/15 border border-az-success-500/30 text-az-success-400'
                      : 'bg-az-warning-500/15 border border-az-warning-500/30 text-az-warning-400'
                  }`}
                >
                  {monetization.eligibility.isEligible ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <Clock className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-az-ink">
                    {monetization.eligibility.isEligible
                      ? 'Certified for Platform Monetization'
                      : 'Monetization In Review'}
                  </h3>
                  <p className="text-xs text-az-ink/50 mt-0.5">
                    {monetization.eligibility.isEligible
                      ? 'Your studio receives active creator rev-shares and super tip payouts.'
                      : 'Complete the threshold requirements below to unlock creator revenue.'}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono uppercase px-3 py-1 rounded-full border self-start sm:self-center ${
                  monetization.eligibility.isEligible
                    ? 'bg-az-success-500/10 text-az-success-400 border-az-success-500/20'
                    : 'bg-az-warning-500/10 text-az-warning-400 border-az-warning-500/20'
                }`}
              >
                {monetization.eligibility.isEligible ? 'Active Partner' : 'Pending'}
              </span>
            </div>

            {monetization.eligibility.requirements.length > 0 && (
              <div className="pt-4 border-t border-az-ink/5 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-az-ink/40 block">
                  Outstanding Milestones:
                </span>
                {monetization.eligibility.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-az-warning-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-az-warning-400" />
                    {req}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Earnings Metric Cards */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Earned',
                value: `₦${monetization.earnings.totalEarned.toLocaleString()}`,
                icon: DollarSign,
                color: 'text-[var(--color-az-flame)]',
              },
              {
                label: 'Pending Payout',
                value: `₦${monetization.earnings.pendingPayout.toLocaleString()}`,
                icon: Clock,
                color: 'text-az-warning-400',
              },
              {
                label: 'Settled to Bank',
                value: `₦${monetization.earnings.paidOut.toLocaleString()}`,
                icon: Wallet,
                color: 'text-az-success-400',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="az-glass p-6 border border-az-glass-border transition-all text-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-az-glass-fill border border-az-glass-border flex items-center justify-center mx-auto mb-3">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-az-ink/40 mb-1">
                    {item.label}
                  </p>
                  <p className="text-2xl font-extrabold text-az-ink tracking-tight">{item.value}</p>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Toggles & Settings */}
        <ScrollReveal delay={0.2}>
          <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
            <h2 className="text-base font-bold text-az-ink mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--color-az-flame)]" />
              Creator Revenue Channels
            </h2>
            <div className="divide-y divide-az-ink/5">
              {[
                {
                  key: 'enableSuperTips',
                  label: 'Super Tips & Micro-transactions',
                  desc: 'Allow passionate fans to send direct tip payments while watching premieres',
                },
                {
                  key: 'enableSponsoredContent',
                  label: 'Brand Placements & Sponsorships',
                  desc: 'Allow vetted brand advertisers to integrate sponsor overlays on your content',
                },
              ].map((setting) => {
                const isChecked = Boolean(
                  monetization.settings[setting.key as keyof typeof monetization.settings]
                );
                return (
                  <div key={setting.key} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-az-ink">{setting.label}</h4>
                      <p className="text-xs text-az-ink/50 mt-0.5">{setting.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isChecked}
                      onClick={() => toggleSetting.mutate({ key: setting.key, value: !isChecked })}
                      className={`w-12 h-7 rounded-full p-1 transition-colors relative flex-shrink-0 ${
                        isChecked ? 'bg-[var(--color-az-flame)]' : 'bg-az-glass-card'
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={`w-5 h-5 rounded-full bg-az-ink shadow-md ${
                          isChecked ? 'ml-auto' : 'ml-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PageShell>
  );
}
