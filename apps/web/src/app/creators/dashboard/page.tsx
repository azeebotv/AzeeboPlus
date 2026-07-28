'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

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
    href: '/creator/content-manager',
    label: 'Content Manager',
    desc: 'Manage your uploaded content',
  },
  { href: '/creator/analytics', label: 'Analytics', desc: 'View engagement and growth metrics' },
  { href: '/creator/earnings', label: 'Earnings', desc: 'Track revenue and payouts' },
  { href: '/creator/profile', label: 'Profile', desc: 'Edit your creator profile' },
  { href: '/creator/drafts', label: 'Drafts', desc: 'Continue working on drafts' },
  { href: '/creator/scheduled', label: 'Scheduled', desc: 'Manage scheduled content' },
];

function StatCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid #2A1A1A',
        backgroundColor: 'rgba(26,10,10,0.5)',
      }}
    >
      <p
        style={{
          color: '#9A8A7A',
          fontSize: 12,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {label}
      </p>
      {loading ? (
        <Skeleton height="32px" width="120px" />
      ) : (
        <p style={{ fontSize: 28, fontWeight: 700, color: '#F5F0EB', margin: 0 }}>{value}</p>
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
    queryKey: ['creator', 'dashboard'],
    queryFn: async () => {
      const result = await apiFetch<DashboardData>('/v1/creators/dashboard');
      if (result.success && result.data) return result.data;
      return null;
    },
  });

  if (error) {
    return (
      <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
        <AppHeader />
        <main style={{ padding: '100px 24px 60px', maxWidth: 960, margin: '0 auto' }}>
          <ErrorState title="Failed to load dashboard data" />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ padding: '100px 24px 60px', maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Creator Dashboard</h1>
        <p style={{ color: '#9A8A7A', marginBottom: 32 }}>
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
          />
          <StatCard
            label="Content"
            value={String(dashboard?.totalContent ?? 0)}
            loading={isLoading}
          />
          <StatCard
            label="Earnings"
            value={`$${(dashboard?.totalEarnings ?? 0).toLocaleString()}`}
            loading={isLoading}
          />
          <StatCard
            label="Followers"
            value={(dashboard?.totalFollowers ?? 0).toLocaleString()}
            loading={isLoading}
          />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Quick Links</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dashLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                borderRadius: 16,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#F5F0EB',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8420A')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2A1A1A')}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{link.label}</h3>
                <p style={{ color: '#9A8A7A', fontSize: 13, margin: 0 }}>{link.desc}</p>
              </div>
              <span style={{ color: '#E8420A', fontSize: 18 }}>→</span>
            </button>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
