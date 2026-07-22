import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await adminApi.getDashboard();
      return res.success ? res.data : null;
    },
  });

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0', icon: '👥', color: '#E8420A' },
    { label: 'Daily Active', value: stats.dailyActiveUsers?.toLocaleString() || '0', icon: '📈', color: '#0D3B2E' },
    { label: 'Content', value: stats.totalContent?.toLocaleString() || '0', icon: '🎬', color: '#CC1C1C' },
    { label: 'Total Views', value: stats.totalViews?.toLocaleString() || '0', icon: '👁️', color: '#F59E0B' },
    { label: 'Revenue', value: `₦${stats.totalRevenue?.toLocaleString() || '0'}`, icon: '💰', color: '#0D3B2E' },
    { label: 'New Users', value: stats.newUsers?.toLocaleString() || '0', icon: '🆕', color: '#E8420A' },
  ] : [];

  const quickLinks = [
    { href: '/users', label: 'Manage Users', icon: '👥' },
    { href: '/content-review', label: 'Review Queue', icon: '✅' },
    { href: '/creators', label: 'Manage Creators', icon: '✨' },
    { href: '/financial', label: 'Financial Overview', icon: '💰' },
    { href: '/reports', label: 'Reports', icon: '📊' },
    { href: '/settings', label: 'Platform Settings', icon: '⚙️' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Admin Dashboard</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Platform overview and quick actions</p>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ padding: 24, borderRadius: 16, border: '1px solid #CC1C1C', backgroundColor: 'rgba(204,28,28,0.1)' }}>
          <p style={{ color: '#CC1C1C', fontWeight: 600 }}>Failed to load dashboard</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            {statCards.map((stat, i) => (
              <div key={i} style={{ padding: 20, borderRadius: 16, border: '1px solid #2A1A1A', backgroundColor: 'rgba(26,10,10,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{stat.icon}</span>
                  <span style={{ fontSize: 12, color: '#9A8A7A' }}>{stat.label}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div style={{ padding: 24, borderRadius: 20, border: '1px solid #2A1A1A', backgroundColor: 'rgba(26,10,10,0.5)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); navigate(link.href); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, border: '1px solid #2A1A1A', textDecoration: 'none', color: '#F5F0EB', fontSize: 14, fontWeight: 500, transition: 'border-color 0.2s' }}
                >
                  <span style={{ fontSize: 18 }}>{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
