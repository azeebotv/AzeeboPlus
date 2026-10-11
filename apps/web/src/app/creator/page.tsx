'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import {
  Film,
  DollarSign,
  Zap,
  TrendingUp,
  FileText,
  Calendar,
  CheckCircle,
  Users,
  Trophy,
  ArrowRight,
  Eye,
  Sparkles,
} from 'lucide-react';

interface CreatorStats {
  totalViews: number;
  totalContent: number;
  totalEarnings: number;
  totalFollowers: number;
  totalSubscribers: number;
  recentActivity: Array<{
    id: string;
    type: 'upload' | 'publish' | 'earnings' | 'subscriber';
    title: string;
    amount?: number;
    date: string;
  }>;
}

const creatorLinks = [
  {
    href: '/creator/content-manager',
    label: 'Content Manager',
    desc: 'Upload, manage, and catalog releases',
    icon: Film,
  },
  {
    href: '/creator/upload',
    label: 'Direct Studio Upload',
    desc: 'Ingest raw 4K footage and multi-track audio',
    icon: Film,
  },
  {
    href: '/creator/earnings',
    label: 'Earnings & Payouts',
    desc: 'Revenue share, streaming royalty settlement',
    icon: DollarSign,
  },
  {
    href: '/creator/monetization',
    label: 'Monetization Settings',
    desc: 'Configure tips, pay-per-view, and passes',
    icon: Zap,
  },
  {
    href: '/creator/analytics',
    label: 'Audience Analytics',
    desc: 'Engagement metrics, retention and watch time',
    icon: TrendingUp,
  },
  {
    href: '/creator/subscribers',
    label: 'Subscriber Circle',
    desc: 'Manage VIP supporters and tier subscribers',
    icon: Users,
  },
  {
    href: '/creator/challenges',
    label: 'Creator Challenges',
    desc: 'Compete in community bounty programs',
    icon: Trophy,
  },
  {
    href: '/creator/drafts',
    label: 'Unfinished Drafts',
    desc: 'Resume editing unpublished drafts',
    icon: FileText,
  },
  {
    href: '/creator/scheduled',
    label: 'Release Schedule',
    desc: 'Automated premiere calendars and timings',
    icon: Calendar,
  },
  {
    href: '/creator/published',
    label: 'Live Catalog',
    desc: 'Audit performance of live published titles',
    icon: CheckCircle,
  },
];

export default function CreatorDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['creator', 'dashboard', 'legacy'],
    queryFn: async () => {
      const res = await apiFetch<CreatorStats>('/v1/creators/dashboard');
      if (res.success && res.data) return res.data;
      return {
        totalViews: 0,
        totalContent: 0,
        totalEarnings: 0,
        totalFollowers: 0,
        totalSubscribers: 0,
        recentActivity: [],
      };
    },
  });

  if (error) {
    return (
      <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
        <div className="max-w-xl mx-auto py-20 px-4">
          <ErrorState
            title="Failed to load dashboard data"
            description="Unable to connect to the creator analytics service."
            onButtonPress={() => refetch()}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 14%, transparent)">
      <PageHero
        badge="Studio Portal"
        title="Creator Control Hub"
        description="Monitor real-time audience engagement, publish original narratives, and track streaming earnings across the Azeebo+ universe."
      />

      <div className="max-w-6xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-10">
        {/* KPI Stats Grid */}
        <ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                label: 'Total Views',
                value: stats?.totalViews?.toLocaleString() || '0',
                icon: Eye,
                color: 'text-az-flame',
              },
              {
                label: 'Published Titles',
                value: String(stats?.totalContent || 0),
                icon: Film,
                color: 'text-az-secondary-400',
              },
              {
                label: 'Gross Royalties',
                value: `₦${stats?.totalEarnings?.toLocaleString() || '0'}`,
                icon: DollarSign,
                color: 'text-az-success-400',
              },
              {
                label: 'Followers',
                value: (stats?.totalFollowers || 0).toLocaleString(),
                icon: Users,
                color: 'text-az-category-violet-light',
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="az-glass p-5 sm:p-6 border border-az-glass-border relative overflow-hidden group transition-all"
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

        {/* Tools & Modules Grid */}
        <ScrollReveal delay={0.1}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-az-ink tracking-tight">
                  Studio Tools & Portals
                </h2>
                <p className="text-xs text-az-ink/50">
                  Manage distribution, audiences, and payout configurations
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creatorLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <motion.button
                    key={link.href}
                    onClick={() => router.push(link.href)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="az-glass p-5 border border-az-glass-border text-left flex items-center gap-4 group transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-az-flame)]/10 border border-[var(--color-az-flame)]/20 flex items-center justify-center flex-shrink-0 text-[var(--color-az-flame)] group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-az-ink group-hover:text-[var(--color-az-flame)] transition-colors">
                        {link.label}
                      </h3>
                      <p className="text-xs text-az-ink/50 truncate mt-0.5">{link.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-az-ink/30 group-hover:text-[var(--color-az-flame)] group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <ScrollReveal delay={0.2}>
            <div className="az-glass p-6 border border-az-glass-border">
              <h3 className="text-base font-bold text-az-ink mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-az-flame)]" />
                Recent Studio Activity
              </h3>
              <div className="divide-y divide-az-ink/5">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-az-ink">{activity.title}</p>
                      <p className="text-xs text-az-ink/40">{activity.date}</p>
                    </div>
                    {activity.amount && (
                      <span className="text-xs font-mono font-bold text-az-success-400">
                        +₦{activity.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </PageShell>
  );
}
