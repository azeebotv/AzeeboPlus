'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface DashboardStats {
  totalViews: number;
  followers: number;
  videos: number;
  revenue: number;
}

export default function CreatorDashboardPage(): React.JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const result = await apiFetch<DashboardStats>('/v1/creators/dashboard/stats');
        if (result.success && result.data) setStats(result.data);
      } catch (err) {
        webLogger.error('Failed to fetch creator dashboard stats', err);
        setError('Failed to load dashboard. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
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
                <div
                  style={{
                    backgroundColor: '#2A1A1A',
                    borderRadius: 8,
                    height: 16,
                    width: '60%',
                    marginBottom: 12,
                  }}
                />
                <div
                  style={{ backgroundColor: '#2A1A1A', borderRadius: 8, height: 28, width: '40%' }}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="az-glass"
            style={{ padding: 40, borderRadius: 16, textAlign: 'center', marginBottom: 32 }}
          >
            <p style={{ color: '#CC1C1C', marginBottom: 16 }}>{error}</p>
            <button onClick={() => window.location.reload()} className="az-btn-primary">
              Retry
            </button>
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
                value: stats.totalViews.toLocaleString(),
                icon: '👁️',
                color: '#E8420A',
              },
              {
                label: 'Followers',
                value: stats.followers.toLocaleString(),
                icon: '👥',
                color: '#0D3B2E',
              },
              { label: 'Videos', value: stats.videos.toString(), icon: '🎬', color: '#CC1C1C' },
              {
                label: 'Revenue',
                value: `₦${stats.revenue.toLocaleString()}`,
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
