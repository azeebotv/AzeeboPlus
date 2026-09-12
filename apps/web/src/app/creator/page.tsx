'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import {
  BarChart3,
  Film,
  DollarSign,
  Zap,
  PenTool,
  TrendingUp,
  ClipboardList,
  FileText,
  Calendar,
  CheckCircle,
  Users,
  Trophy,
  ArrowRight,
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
    href: '/creators/dashboard',
    label: 'Dashboard',
    desc: 'View your creator overview',
    icon: BarChart3,
  },
  {
    href: '/creators/upload',
    label: 'Upload',
    desc: 'Upload new content',
    icon: Film,
  },
  {
    href: '/creators/earnings',
    label: 'Earnings',
    desc: 'Revenue, payouts, and transaction history',
    icon: DollarSign,
  },
  {
    href: '/creators/monetization',
    label: 'Monetization',
    desc: 'Configure tips, subscriptions, and ads',
    icon: Zap,
  },
  {
    href: '/creators/signup',
    label: 'Creator Signup',
    desc: 'Apply to become a creator',
    icon: PenTool,
  },
  {
    href: '/creator/analytics',
    label: 'Analytics (Legacy)',
    desc: 'Engagement, views, and growth metrics',
    icon: TrendingUp,
  },
  {
    href: '/creator/content-manager',
    label: 'Content Manager (Legacy)',
    desc: 'Upload, edit, and organize your content',
    icon: ClipboardList,
  },
  {
    href: '/creator/drafts',
    label: 'Drafts',
    desc: 'Continue working on unpublished content',
    icon: FileText,
  },
  {
    href: '/creator/scheduled',
    label: 'Scheduled',
    desc: 'Manage content release schedule',
    icon: Calendar,
  },
  {
    href: '/creator/published',
    label: 'Published',
    desc: 'View your live content and performance',
    icon: CheckCircle,
  },
  {
    href: '/creator/subscribers',
    label: 'Subscribers',
    desc: 'Manage your subscriber list',
    icon: Users,
  },
  {
    href: '/creator/challenges',
    label: 'Challenges',
    desc: 'View and participate in creator challenges',
    icon: Trophy,
  },
];

export default function CreatorDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const {
    data: stats,
    isLoading,
    error,
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
      <div
        style={{
          backgroundColor: 'var(--brand-near-black, #0b090e)',
          minHeight: '100vh',
          color: 'var(--text-primary)',
        }}
      >
        <AppHeader logoVariant="light" />
        <main style={{ padding: '100px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
          <ErrorState title="Failed to load dashboard data" />
        </main>
        <AppFooter logoVariant="light" />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--brand-near-black, #0b090e)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      <AppHeader logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'white' }}>Creator Hub</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
          {isLoading
            ? 'Loading stats...'
            : `Welcome back! ${stats?.totalContent || 0} pieces of content, ${stats?.totalFollowers || 0} followers`}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
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
                border: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: 'var(--brand-surface, #18151e)',
              }}
            >
              <p
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 12,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 600,
                }}
              >
                {stat.label}
              </p>
              {isLoading ? (
                <Skeleton height="28px" width="80px" />
              ) : (
                <p style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: 0 }}>
                  {stat.value}
                </p>
              )}
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: 'white' }}>Creator Tools & Portals</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {creatorLinks.map((link) => {
            const Icon = link.icon;
            return (
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
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'var(--brand-surface, #18151e)',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(232,66,10,0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(232,66,10,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-orange, #E8420A)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, color: 'white' }}>{link.label}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>{link.desc}</p>
                </div>
                <ArrowRight size={18} style={{ color: 'var(--brand-orange, #E8420A)' }} />
              </button>
            );
          })}
        </div>

        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: 'white' }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: 'var(--brand-surface, #18151e)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'white', marginBottom: 2 }}>
                    {activity.title}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>{activity.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
