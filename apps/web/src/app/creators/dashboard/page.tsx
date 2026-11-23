'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import {
  Eye,
  Film,
  DollarSign,
  Users,
  ChevronRight,
  UploadCloud,
  Zap,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

interface DashboardData {
  totalViews: number;
  totalContent: number;
  totalEarnings: number;
  totalFollowers: number;
  recentViews: number;
  viewsGrowth: number;
}

const dashLinks = [
  {
    href: '/creator',
    label: 'Studio Dashboard',
    desc: 'Access your full creator studio overview',
    icon: BarChart3,
  },
  {
    href: '/creator/upload',
    label: 'Upload',
    desc: 'Upload and publish new content',
    icon: UploadCloud,
  },
  {
    href: '/creator/earnings',
    label: 'Earnings',
    desc: 'Track revenue, royalties, and payouts',
    icon: DollarSign,
  },
  {
    href: '/creator/monetization',
    label: 'Monetization',
    desc: 'Manage tipping, tiers, and passes',
    icon: Zap,
  },
];

function StatCard({
  label,
  value,
  loading,
  icon: Icon,
}: {
  label: string;
  value: string;
  loading: boolean;
  icon: LucideIcon;
}) {
  return (
    <div className="az-glass relative overflow-hidden p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="az-overline uppercase text-az-ink-muted">{label}</p>
        <div className="flex size-8 items-center justify-center rounded-az-control bg-az-flame/10 text-az-flame">
          <Icon size={16} />
        </div>
      </div>
      {loading ? (
        <Skeleton height="32px" width="120px" />
      ) : (
        <p className="az-section-title text-az-ink">{value}</p>
      )}
    </div>
  );
}

export default function CreatorDashboardPage(): React.JSX.Element {
  const router = useRouter();

  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'dashboard', 'v2'],
    queryFn: async () => {
      const result = await apiFetch<DashboardData>('/v1/creators/dashboard');
      if (result.success && result.data) return result.data;
      return null;
    },
  });

  if (error) {
    return (
      <PageShell maxWidth="xl">
        <ErrorState title="Failed to load dashboard data" />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="xl">
      <PageHero
        eyebrow="Creator Studio"
        title="Creator Dashboard"
        description="Welcome back! Here's your overview."
      />

      <div className="mb-10 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <StatCard
          label="Total Views"
          value={(dashboard?.totalViews ?? 0).toLocaleString()}
          loading={isLoading}
          icon={Eye}
        />
        <StatCard
          label="Content"
          value={String(dashboard?.totalContent ?? 0)}
          loading={isLoading}
          icon={Film}
        />
        <StatCard
          label="Earnings"
          value={`₦${(dashboard?.totalEarnings ?? 0).toLocaleString()}`}
          loading={isLoading}
          icon={DollarSign}
        />
        <StatCard
          label="Followers"
          value={(dashboard?.totalFollowers ?? 0).toLocaleString()}
          loading={isLoading}
          icon={Users}
        />
      </div>

      <h2 className="az-title mb-4 text-az-ink">Quick Links</h2>
      <div className="flex flex-col gap-3">
        {dashLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.href}
              type="button"
              onClick={() => router.push(link.href)}
              className="az-glass flex cursor-pointer items-center gap-4 px-5 py-4 text-left text-az-ink"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-az-control bg-az-flame/10 text-az-flame">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="az-body-strong block text-az-ink">{link.label}</span>
                <span className="az-caption block text-az-ink-muted">{link.desc}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-az-flame" />
            </button>
          );
        })}
      </div>
    </PageShell>
  );
}
