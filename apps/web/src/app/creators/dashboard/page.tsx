'use client';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

interface DashboardStats {
  totalViews: number;
  followerCount: number;
  contentCount: number;
  totalEarnings: number;
}

export default function CreatorDashboardPage(): React.JSX.Element {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isEnabled = !authLoading && !!isAuthenticated && !!user;

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'dashboard-stats'],
    queryFn: async () => {
      const result = await apiFetch<DashboardStats>('/v1/creators/stats');
      if (result.success && result.data) return result.data;
      return null;
    },
    enabled: isEnabled,
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
          <p className="text-yellow-200 font-semibold">Creator Dashboard Moved</p>
          <p className="text-yellow-300 text-sm">The creator dashboard has moved to <a href="https://creator.azeeboplus.com" className="underline">creator.azeeboplus.com</a>. This page will be removed in a future release.</p>
        </div>
        {/* Welcome Section */}
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Creator Dashboard</h1>
        <p style={{ color: '#9A8A7A', marginBottom: 32 }}>
          Welcome back, {user?.name || 'Creator'}! Here&apos;s what&apos;s happening with your
          content.
        </p>

        {/* Stats Grid */}
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
                <Skeleton width="60%" height="16px" className="mb-3" />
                <Skeleton width="40%" height="28px" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="az-glass"
            style={{ padding: 40, borderRadius: 16, textAlign: 'center', marginBottom: 32 }}
          >
            <ErrorState
              title="Failed to load dashboard"
              description="Please try again later"
              onButtonPress={() => router.refresh()}
            />
          </div>
        ) : stats ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              {
                label: 'Total Views',
                value: (stats.totalViews || 0).toLocaleString(),
                icon: '👁️',
                color: '#E8420A',
              },
              {
                label: 'Followers',
                value: (stats.followerCount || 0).toLocaleString(),
                icon: '👥',
                color: '#0D3B2E',
              },
              {
                label: 'Content',
                value: (stats.contentCount || 0).toString(),
                icon: '🎬',
                color: '#CC1C1C',
              },
              {
                label: 'Earnings',
                value: `₦${(stats.totalEarnings || 0).toLocaleString()}`,
                icon: '💰',
                color: '#F59E0B',
              },
            ].map((stat, i) => (
              <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{stat.icon}</span>
                  <span style={{ fontSize: 12, color: '#9A8A7A' }}>{stat.label}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {[
              {
                href: '/creators/dashboard/content',
                icon: '📝',
                label: 'Manage Content',
                desc: 'Upload and manage your videos',
              },
              {
                href: '/creators/dashboard/analytics',
                icon: '📊',
                label: 'View Analytics',
                desc: 'Track your performance',
              },
              {
                href: '/creators/dashboard/earnings',
                icon: '💰',
                label: 'View Earnings',
                desc: 'Check your earnings',
              },
              {
                href: '/creators/dashboard/settings',
                icon: '⚙️',
                label: 'Settings',
                desc: 'Update your creator profile',
              },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: 'block',
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid #2A1A1A',
                  textDecoration: 'none',
                  color: '#F5F0EB',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E8420A')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2A1A1A')}
              >
                <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>
                  {action.icon}
                </span>
                <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{action.label}</p>
                <p style={{ fontSize: 12, color: '#9A8A7A' }}>{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
