'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCreators: 0,
    totalContent: 0,
    activeSubscriptions: 0,
    revenue: 0,
    pendingReviews: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadDashboard();
  }, [isAuthenticated, user]);

  const loadDashboard = async () => {
    try {
      const res = await api.admin.getDashboard();
      if (res.success && res.data) {
        const d = res.data as any;
        setStats({
          totalUsers: d.totalUsers || 0,
          totalCreators: d.topCreators?.length || 0,
          totalContent: d.totalContent || 0,
          activeSubscriptions: d.newUsers || 0,
          revenue: d.totalRevenue || 0,
          pendingReviews: d.newContent || 0,
        });
        setRecentActivity(d.recentActivity || []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Admin Dashboard</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 32 }}>Platform overview and quick actions</p>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #2A1A1A',
              borderTopColor: '#E8420A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              {
                label: 'Total Users',
                value: stats.totalUsers.toLocaleString(),
                icon: '👥',
                color: '#E8420A',
              },
              {
                label: 'Creators',
                value: stats.totalCreators.toLocaleString(),
                icon: '✨',
                color: '#0D3B2E',
              },
              {
                label: 'Content',
                value: stats.totalContent.toLocaleString(),
                icon: '🎬',
                color: '#CC1C1C',
              },
              {
                label: 'Subscriptions',
                value: stats.activeSubscriptions.toLocaleString(),
                icon: '⭐',
                color: '#F59E0B',
              },
              {
                label: 'Revenue',
                value: `₦${stats.revenue.toLocaleString()}`,
                icon: '💰',
                color: '#0D3B2E',
              },
              {
                label: 'Pending Reviews',
                value: stats.pendingReviews.toString(),
                icon: '📋',
                color: '#E8420A',
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

          {/* Quick links */}
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
                { href: '/admin/users', label: 'Manage Users', icon: '👥' },
                { href: '/admin/content-review', label: 'Review Queue', icon: '✅' },
                { href: '/admin/creators', label: 'Manage Creators', icon: '✨' },
                { href: '/admin/financial', label: 'Financial Overview', icon: '💰' },
                { href: '/admin/reports', label: 'Reports', icon: '📊' },
                { href: '/admin/settings', label: 'Platform Settings', icon: '⚙️' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid #2A1A1A',
                    textDecoration: 'none',
                    color: '#F5F0EB',
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'border-color 0.2s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
