'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { Card, Avatar, Skeleton, Button, ErrorState } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';

interface AdminStats {
  totalUsers: number;
  totalContent: number;
  totalViews: number;
  totalRevenue: number;
  newUsers: number;
  newContent: number;
  topCreators: { id: string; name: string; contentCount: number; views: number }[];
  recentActivity: { id: string; action: string; user: string; time: string }[];
}

const SidebarItem = ({
  icon,
  label,
  active,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href: string;
}): React.ReactElement => (
  <a
    href={href}
    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
    style={{
      backgroundColor: active ? `${colors.primary[500]}20` : 'transparent',
      color: active ? colors.primary[500] : colors.text.secondary,
    }}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </a>
);

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}): React.ReactElement => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium" style={{ color: colors.text.secondary }}>
        {title}
      </h3>
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${colors.primary[500]}15` }}
      >
        <span style={{ color: colors.primary[500] }}>{icon}</span>
      </div>
    </div>
    <p className="text-3xl font-bold mb-1" style={{ color: colors.text.primary }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    <p className="text-sm" style={{ color: trend === 'up' ? colors.success[500] : colors.error[500] }}>
      {subtitle}
    </p>
  </Card>
);

export default function AdminPage(): JSX.Element {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalContent: 0,
    totalViews: 0,
    totalRevenue: 0,
    newUsers: 0,
    newContent: 0,
    topCreators: [],
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    const fetchStats = async (): Promise<void> => {
      try {
        setIsLoading(true);

        const dashboardResponse = await api.admin.getDashboard();

        if (!dashboardResponse.success || !dashboardResponse.data) {
          throw new Error('Failed to fetch dashboard data');
        }

        setStats(dashboardResponse.data as unknown as AdminStats);
      } catch (error) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <></>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ backgroundColor: `${colors.bg.primary}cc`, borderColor: colors.border.light }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: gradients.brand }}
            >
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              Azeebo+ Admin
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar size="md" fallback={user.name?.charAt(0)} />
              <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                {user.name}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <aside
          className="hidden lg:block w-64 border-r min-h-[calc(100vh-72px)] sticky top-[72px]"
          style={{ borderColor: colors.border.light }}
        >
          <nav className="p-4 space-y-2">
            <SidebarItem active href="/admin" icon="📊" label="Dashboard" />
            <SidebarItem href="/admin/users" icon="👥" label="Users" />
            <SidebarItem href="/admin/content" icon="🎬" label="Content" />
            <SidebarItem href="/admin/creators" icon="✨" label="Creators" />
            <SidebarItem href="/admin/universes" icon="🌍" label="Universes" />
            <SidebarItem href="/admin/payments" icon="💳" label="Payments" />
            <SidebarItem href="/admin/analytics" icon="📈" label="Analytics" />
            <SidebarItem href="/admin/settings" icon="⚙️" label="Settings" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-8"
            style={{ color: colors.text.primary }}
          >
            Dashboard
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton width="40%" height="16px" />
                    <Skeleton width="40px" height="40px" borderRadius="20px" />
                  </div>
                  <Skeleton width="60%" height="36px" className="mb-1" />
                  <Skeleton width="40%" height="14px" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <ErrorState description={error} onButtonPress={() => window.location.reload()} />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  subtitle={`+${stats.newUsers} new today`}
                  icon="👥"
                  trend="up"
                />
                <StatCard
                  title="Total Content"
                  value={stats.totalContent}
                  subtitle={`+${stats.newContent} new today`}
                  icon="🎬"
                  trend="up"
                />
                <StatCard
                  title="Total Views"
                  value={stats.totalViews}
                  subtitle="+12% from last month"
                  icon="👁️"
                  trend="up"
                />
                <StatCard
                  title="Total Revenue"
                  value={`$${stats.totalRevenue}`}
                  subtitle="+8% from last month"
                  icon="💰"
                  trend="up"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Creators */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-6" style={{ color: colors.text.primary }}>
                    Top Creators
                  </h3>
                  <div className="space-y-4">
                    {stats.topCreators.map((creator, index) => (
                      <div key={creator.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center h-6 w-6 rounded-full font-bold text-xs"
                            style={{
                              backgroundColor: `${colors.primary[500]}20`,
                              color: colors.primary[500],
                            }}
                          >
                            {index + 1}
                          </div>
                          <Avatar size="md" fallback={creator.name.charAt(0)} />
                          <div>
                            <h4 className="font-medium" style={{ color: colors.text.primary }}>
                              {creator.name}
                            </h4>
                            <p className="text-sm" style={{ color: colors.text.secondary }}>
                              {creator.contentCount} videos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold" style={{ color: colors.text.primary }}>
                            {creator.views.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-6" style={{ color: colors.text.primary }}>
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${colors.primary[500]}15` }}
                        >
                          <span style={{ color: colors.primary[500] }}>✅</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: colors.text.primary }}>
                            <span className="font-medium">{activity.action}</span> by{' '}
                            {activity.user}
                          </p>
                          <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* System Status */}
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-6" style={{ color: colors.text.primary }}>
                  System Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title: 'API Services', status: 'All services operational' },
                    { title: 'Database', status: 'Connected and healthy' },
                    { title: 'Storage', status: '90% available' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-4 border"
                      style={{
                        backgroundColor: `${colors.success}10`,
                        borderColor: `${colors.success}30`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium" style={{ color: colors.text.primary }}>
                          {item.title}
                        </h4>
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: colors.success[500] }}
                        ></span>
                      </div>
                      <p className="text-sm" style={{ color: colors.text.secondary }}>
                        {item.status}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
