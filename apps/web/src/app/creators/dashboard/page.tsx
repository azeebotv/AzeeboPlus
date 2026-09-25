'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    href: '/creators/dashboard',
    label: 'Dashboard',
    desc: 'View your creator overview',
    icon: BarChart3,
  },
  { href: '/creators/upload', label: 'Upload', desc: 'Upload new content', icon: UploadCloud },
  {
    href: '/creators/earnings',
    label: 'Earnings',
    desc: 'Track revenue and payouts',
    icon: DollarSign,
  },
  {
    href: '/creators/monetization',
    label: 'Monetization',
    desc: 'Manage tipping and subscriptions',
    icon: Zap,
  },
];

function StatCard({
  label,
  value,
  loading,
  icon: Icon,
  accentColor = '#E8420A',
}: {
  label: string;
  value: string;
  loading: boolean;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'var(--bg-tertiary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <p
          style={{
            color: 'var(--text-muted, #9A8A7A)',
            fontSize: 12,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: `${accentColor}1A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} color={accentColor} />
        </div>
      </div>
      {loading ? (
        <Skeleton height="32px" width="120px" />
      ) : (
        <p style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{value}</p>
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
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          minHeight: '100vh',
          color: 'var(--text-primary)',
        }}
      >
        <AppHeader logoVariant="light" />
        <main style={{ padding: '100px 24px 60px', maxWidth: 960, margin: '0 auto' }}>
          <ErrorState title="Failed to load dashboard data" />
        </main>
        <AppFooter logoVariant="light" />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      <AppHeader logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: '#FFFFFF' }}>
          Creator Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted, #9A8A7A)', marginBottom: 32 }}>
          Welcome back! Here&apos;s your overview.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <StatCard
            label="Total Views"
            value={(dashboard?.totalViews ?? 0).toLocaleString()}
            loading={isLoading}
            icon={Eye}
            accentColor="#E8420A"
          />
          <StatCard
            label="Content"
            value={String(dashboard?.totalContent ?? 0)}
            loading={isLoading}
            icon={Film}
            accentColor="#3B82F6"
          />
          <StatCard
            label="Earnings"
            value={`₦${(dashboard?.totalEarnings ?? 0).toLocaleString()}`}
            loading={isLoading}
            icon={DollarSign}
            accentColor="#10B981"
          />
          <StatCard
            label="Followers"
            value={(dashboard?.totalFollowers ?? 0).toLocaleString()}
            loading={isLoading}
            icon={Users}
            accentColor="#A855F7"
          />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#FFFFFF' }}>
          Quick Links
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dashLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(232,66,10,0.5)';
                  e.currentTarget.style.backgroundColor = '#1d1925';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.backgroundColor = '#18151e';
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(232,66,10,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} color="#E8420A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, color: '#FFFFFF' }}>
                    {link.label}
                  </h3>
                  <p style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13, margin: 0 }}>
                    {link.desc}
                  </p>
                </div>
                <ChevronRight size={18} color="#E8420A" />
              </button>
            );
          })}
        </div>
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
