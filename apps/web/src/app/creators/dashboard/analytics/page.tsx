'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function DashboardAnalyticsPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState({ totalViews: 0, totalWatchTime: 0, averageViewDuration: 0, subscriberGrowth: 0, topContent: [] as any[], demographics: { ageGroups: [] as any[], regions: [] as any[] } });
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!isAuthenticated || !user) { router.push('/auth/login'); return; }
    loadAnalytics();
  }, [isAuthenticated, user, router, period]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.creator.getAnalytics({ range: period });
      if (response.success && response.data) setAnalytics(response.data as typeof analytics);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ paddingTop: 100, paddingBottom: 60, maxWidth: 1000, margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>Analytics</h1>
            <p style={{ color: '#9A8A7A', marginTop: 4 }}>Track your content performance</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setPeriod(key)} style={{ padding: '8px 16px', borderRadius: 999, border: period === key ? 'none' : '1px solid #2A1A1A', background: period === key ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent', color: period === key ? '#fff' : '#9A8A7A', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Views', value: analytics.totalViews.toLocaleString(), icon: '👁️', color: '#E8420A' },
                { label: 'Watch Time', value: `${Math.floor(analytics.totalWatchTime / 60)}h`, icon: '⏱️', color: '#0D3B2E' },
                { label: 'Avg Duration', value: `${Math.floor(analytics.averageViewDuration / 60)}m`, icon: '📊', color: '#F59E0B' },
                { label: 'Subscriber Growth', value: `+${analytics.subscriberGrowth}`, icon: '📈', color: '#CC1C1C' },
              ].map((stat, i) => (
                <div key={i} className="az-glass" style={{ padding: 20, borderRadius: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{stat.icon}</span>
                    <span style={{ fontSize: 13, color: '#9A8A7A' }}>{stat.label}</span>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {analytics.topContent.length > 0 && (
              <div className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Top Content</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analytics.topContent.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < analytics.topContent.length - 1 ? '1px solid #2A1A1A' : 'none' }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                      </div>
                      <span style={{ fontSize: 13, color: '#E8420A', fontWeight: 600 }}>{(item.views || 0).toLocaleString()} views</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
