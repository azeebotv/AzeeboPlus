'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Button, Card, Skeleton, Badge, Avatar } from '@azeebo/ui';
import { colors, universeColors } from '@azeebo/design-tokens';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface DashboardStats {
  totalViews: number;
  followers: number;
  videos: number;
  revenue: number;
}

export default function CreatorDashboardPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const result = await apiFetch<DashboardStats>('/v1/creators/dashboard/stats');

        if (result.success && result.data) {
          setStats(result.data);
        }
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
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: universeColors.creators.primary }}
            >
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1
              className="text-2xl font-bold hidden sm:block"
              style={{ color: colors.text.primary }}
            >
              Creator Dashboard
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Overview', 'Content', 'Analytics', 'Earnings', 'Settings'].map((item) => (
              <Link
                key={item}
                href={`/creators/dashboard/${item.toLowerCase()}`}
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Overview' ? colors.primary[500] : colors.text.secondary }}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar size="md" fallback={user?.name?.charAt(0) || 'U'} />
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    {user?.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>
            Welcome back, {user?.name || 'Creator'}!
          </h2>
          <p style={{ color: colors.text.secondary }}>
            Here&apos;s what&apos;s happening with your content.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} height="120px" className="rounded-lg" />
            ))
          ) : error ? (
            <div className="lg:col-span-4 text-center py-8">
              <p className="mb-4" style={{ color: colors.text.secondary }}>
                {error}
              </p>
              <Button variant="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : stats ? (
            <>
              <Card padding="md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">👁️</span>
                  <Badge variant="outline">Views</Badge>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>
                  {stats.totalViews.toLocaleString()}
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Total Views
                </p>
              </Card>
              <Card padding="md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">👥</span>
                  <Badge variant="outline">Followers</Badge>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>
                  {stats.followers.toLocaleString()}
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Followers
                </p>
              </Card>
              <Card padding="md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">🎬</span>
                  <Badge variant="outline">Videos</Badge>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>
                  {stats.videos}
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Videos
                </p>
              </Card>
              <Card padding="md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">💰</span>
                  <Badge variant="outline">Revenue</Badge>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>
                  ₦{stats.revenue.toLocaleString()}
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Revenue
                </p>
              </Card>
            </>
          ) : (
            Array.from({ length: 4 }).map((_, idx) => (
              <Card key={idx} padding="md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">📊</span>
                  <Badge variant="outline">--</Badge>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>
                  --
                </p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Loading...
                </p>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold mb-6" style={{ color: colors.text.primary }}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/creators/dashboard/content">
                  <Card padding="md" className="cursor-pointer hover:shadow-lg transition-shadow">
                    <span className="text-3xl mb-3 block">📝</span>
                    <h4 className="font-bold" style={{ color: colors.text.primary }}>
                      Manage Content
                    </h4>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      Upload and manage your videos
                    </p>
                  </Card>
                </Link>
                <Link href="/creators/dashboard/analytics">
                  <Card padding="md" className="cursor-pointer hover:shadow-lg transition-shadow">
                    <span className="text-3xl mb-3 block">📊</span>
                    <h4 className="font-bold" style={{ color: colors.text.primary }}>
                      View Analytics
                    </h4>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      Track your performance
                    </p>
                  </Card>
                </Link>
                <Link href="/creators/dashboard/earnings">
                  <Card padding="md" className="cursor-pointer hover:shadow-lg transition-shadow">
                    <span className="text-3xl mb-3 block">💰</span>
                    <h4 className="font-bold" style={{ color: colors.text.primary }}>
                      View Earnings
                    </h4>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      Check your earnings
                    </p>
                  </Card>
                </Link>
                <Link href="/creators/dashboard/settings">
                  <Card padding="md" className="cursor-pointer hover:shadow-lg transition-shadow">
                    <span className="text-3xl mb-3 block">⚙️</span>
                    <h4 className="font-bold" style={{ color: colors.text.primary }}>
                      Manage Settings
                    </h4>
                    <p className="text-sm" style={{ color: colors.text.secondary }}>
                      Update your creator profile
                    </p>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer
        className="border-t py-12"
        style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Azeebo+
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['About', 'Careers', 'Press'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Help
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Support', 'FAQ', 'Contact'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Legal
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Terms', 'Privacy', 'Cookies'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Connect
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Twitter', 'Instagram', 'Facebook'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            className="mt-12 pt-8 border-t text-center text-sm"
            style={{ borderColor: colors.border.light, color: colors.text.tertiary }}
          >
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
