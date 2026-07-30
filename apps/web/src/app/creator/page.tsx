'use client';

import { colors } from '@azeebo/design-tokens';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

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
    href: '/creator/analytics',
    label: 'Analytics',
    desc: 'Engagement, views, and growth metrics',
    icon: '📊',
  },
  {
    href: '/creator/content-manager',
    label: 'Content Manager',
    desc: 'Upload, edit, and organize your content',
    icon: '🎬',
  },
  {
    href: '/creator/earnings',
    label: 'Earnings',
    desc: 'Revenue, payouts, and transaction history',
    icon: '💰',
  },
  {
    href: '/creator/profile',
    label: 'Profile',
    desc: 'Edit your bio, avatar, and social links',
    icon: '👤',
  },
  {
    href: '/creator/drafts',
    label: 'Drafts',
    desc: 'Continue working on unpublished content',
    icon: '📝',
  },
  {
    href: '/creator/scheduled',
    label: 'Scheduled',
    desc: 'Manage content release schedule',
    icon: '📅',
  },
  {
    href: '/creator/published',
    label: 'Published',
    desc: 'View your live content and performance',
    icon: '✅',
  },
  {
    href: '/creator/monetization',
    label: 'Monetization',
    desc: 'Configure tips, subscriptions, and ads',
    icon: '⚡',
  },
  {
    href: '/creator/subscribers',
    label: 'Subscribers',
    desc: 'Manage your subscriber list',
    icon: '👥',
  },
  {
    href: '/creator/challenges',
    label: 'Challenges',
    desc: 'View and participate in creator challenges',
    icon: '🏆',
  },
];

export default function CreatorDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'dashboard'],
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
<div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', color: colors.text.primary }}>
        <AppHeader />
        <main style={{ padding: '100px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
          <ErrorState title="Failed to load dashboard data" />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ padding: '100px 24px 60px', maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Creator Dashboard</h1>
        <p style={{ color: colors.text.secondary, marginBottom: 32 }}>
          {isLoading
            ? 'Loading stats...'
            : `Welcome back! ${stats?.totalContent || 0} pieces of content, ${stats?.totalFollowers || 0} followers`}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Views', value: stats?.totalViews?.toLocaleString() || '0' },
            { label: 'Content', value: String(stats?.totalContent || 0) },
            { label: 'Earnings', value: `₦${stats?.totalEarnings?.toLocaleString() || '0'}` },
            { label: 'Followers', value: (stats?.totalFollowers || 0).toLocaleString() },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: 20,
                borderRadius: 16,
                border: `1px solid ${colors.bg.tertiary}`,
                backgroundColor: 'rgba(26,10,10,0.5)',
                minWidth: 120,
              }}
            >
              <p
                style={{
                  color: colors.text.secondary,
                  fontSize: 12,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {stat.label}
              </p>
              {isLoading ? (
                <Skeleton height="24px" width="80px" />
              ) : (
                <p style={{ fontSize: 24, fontWeight: 700, color: colors.text.primary, margin: 0 }}>
                  {stat.value}
                </p>
              )}
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Quick Links</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {creatorLinks.map((link) => (
             <button
               key={link.href}
               onClick={() => router.push(link.href)}
               aria-label={`Navigate to ${link.label}`}
               style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 20,
                borderRadius: 16,
                cursor: 'pointer',
                textAlign: 'left',
                border: `1px solid ${colors.bg.tertiary}`,
                backgroundColor: 'rgba(26,10,10,0.5)',
color: colors.text.primary,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.bg.tertiary)}
            >
              <span style={{ fontSize: 24 }}>{link.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{link.label}</h3>
                <p style={{ color: colors.text.secondary, fontSize: 13, margin: 0 }}>{link.desc}</p>
              </div>
              <span style={{ color: colors.primary[500], fontSize: 18 }}>→</span>
            </button>
          ))}
        </div>

        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: 'rgba(26,10,10,0.5)',
                    border: `1px solid ${colors.bg.tertiary}`,
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#F5F0EB' }}>
                    {activity.title}
                  </p>
                  <p style={{ color: colors.text.secondary, fontSize: 12 }}>{activity.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
