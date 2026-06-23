'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function DashboardOverviewPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ totalViews: 0, totalSubscribers: 0, totalEarnings: 0, contentCount: 0 });
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) { router.push('/auth/login'); return; }
    loadDashboard();
  }, [isAuthenticated, user, router]);

  const loadDashboard = async () => {
    try {
      const [statsRes, contentRes] = await Promise.all([
        api.creator.getStats(),
        api.content.getMyContent()
      ]);
      if (statsRes.success && statsRes.data) {
        const d = statsRes.data as any;
        setStats({ totalViews: d.totalViews || 0, totalSubscribers: d.followerCount || 0, totalEarnings: d.totalEarnings || 0, contentCount: d.contentCount || 0 });
      }
      if (contentRes.success && contentRes.data) {
        const items = Array.isArray(contentRes.data) ? contentRes.data : (contentRes.data as any).items || [];
        setRecentContent(items.slice(0, 5));
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  if (!isAuthenticated || !user) return <></>;

  const statCards = [
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', color: '#E8420A' },
    { label: 'Subscribers', value: stats.totalSubscribers.toLocaleString(), icon: '👥', color: '#0D3B2E' },
    { label: 'Earnings', value: `₦${stats.totalEarnings.toLocaleString()}`, icon: '💰', color: '#F59E0B' },
    { label: 'Content', value: stats.contentCount.toString(), icon: '🎬', color: '#CC1C1C' },
  ];

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ paddingTop: 100, paddingBottom: 60, maxWidth: 1000, margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Creator Dashboard</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Welcome back, {user.name}</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {statCards.map((stat, i) => (
                <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{stat.icon}</span>
                    <span style={{ fontSize: 13, color: '#9A8A7A' }}>{stat.label}</span>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
              {[
                { href: '/creator/upload', label: 'Upload Content', primary: true },
                { href: '/creator/content-manager', label: 'Manage Content', primary: false },
                { href: '/creator/analytics', label: 'View Analytics', primary: false },
              ].map(action => (
                <a key={action.href} href={action.href} style={{
                  padding: '12px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 14,
                  background: action.primary ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
                  border: action.primary ? 'none' : '1px solid #2A1A1A',
                  color: action.primary ? '#fff' : '#9A8A7A',
                }}>
                  {action.label}
                </a>
              ))}
            </div>

            {/* Recent content */}
            <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent Content</h2>
              {recentContent.length === 0 ? (
                <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 20 }}>No content yet. Start creating!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentContent.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #2A1A1A' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                        <p style={{ color: '#9A8A7A', fontSize: 12 }}>{item.status || 'draft'}</p>
                      </div>
                      <span style={{ fontSize: 12, color: '#6B5A4A' }}>{item.views || 0} views</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
