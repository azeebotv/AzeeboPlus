import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { Button, Card, Skeleton, Badge, Chip } from '@azeebo/ui';
import { colors } from '@azeebo/design-tokens';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage(): JSX.Element {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.creator.getAnalytics({ range: timeRange });

        if (cancelled) return;

        if (response.success) {
          setAnalytics(response.data);
        } else {
          setError(response.message || 'Failed to load analytics');
          webLogger.error('Failed to load creator analytics', { error: response.message });
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        webLogger.error('Failed to load creator analytics', { error: message });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Analytics
          </h2>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setTimeRange('7d')} disabled={timeRange === '7d'}>
              7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('30d')} disabled={timeRange === '30d'}>
              30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('90d')} disabled={timeRange === '90d'}>
              90 Days
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} padding="none">
                <Skeleton height="120px" />
              </Card>
            ))}
          </div>

          <div className="h-96">
            <Card padding="none">
              <Skeleton height="90%" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Analytics
          </h2>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setTimeRange('7d')} disabled={timeRange === '7d'}>
              7 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('30d')} disabled={timeRange === '30d'}>
              30 Days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTimeRange('90d')} disabled={timeRange === '90d'}>
              90 Days
            </Button>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-lg" style={{ color: colors.text.secondary }}>
            {error}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
          Analytics
        </h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setTimeRange('7d')} disabled={timeRange === '7d'}>
            7 Days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange('30d')} disabled={timeRange === '30d'}>
            30 Days
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange('90d')} disabled={timeRange === '90d'}>
            90 Days
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <Card padding="none">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  Total Views
                </h3>
                <Badge variant="outline" className="text-xs">
                  {timeRange === '7d' ? 'Weekly' : timeRange === '30d' ? 'Monthly' : 'Quarterly'}
                </Badge>
              </div>
              <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                {analytics?.totalViews?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-500">
                {analytics?.viewsChangePercentage?.toFixed(1) || 0}% vs previous period
              </p>
            </div>
          </Card>

          <Card padding="none">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  Total Watch Time (hrs)
                </h3>
                <Badge variant="outline" className="text-xs">
                  {timeRange === '7d' ? 'Weekly' : timeRange === '30d' ? 'Monthly' : 'Quarterly'}
                </Badge>
              </div>
              <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                {analytics?.totalWatchTime?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-500">
                {analytics?.watchTimeChangePercentage?.toFixed(1) || 0}% vs previous period
              </p>
            </div>
          </Card>

          <Card padding="none">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  Engagement Rate
                </h3>
                <Badge variant="outline" className="text-xs">
                  {timeRange === '7d' ? 'Weekly' : timeRange === '30d' ? 'Monthly' : 'Quarterly'}
                </Badge>
              </div>
              <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                {analytics?.avgEngagementRate?.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">
                {analytics?.engagementRateChangePercentage?.toFixed(1) || 0}% vs previous period
              </p>
            </div>
          </Card>

          <Card padding="none">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  New Followers
                </h3>
                <Badge variant="outline" className="text-xs">
                  {timeRange === '7d' ? 'Weekly' : timeRange === '30d' ? 'Monthly' : 'Quarterly'}
                </Badge>
              </div>
              <p className="text-3xl font-bold" style={{ color: colors.text.primary }}>
                {analytics?.newFollowers?.toLocaleString() || '0'}
              </p>
              <p className="text-sm text-gray-500">
                {analytics?.followersChangePercentage?.toFixed(1) || 0}% vs previous period
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6">
        <div className="w-full">
          <Card padding="none">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
                Views Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.viewsTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fillColor="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="w-full">
          <Card padding="none">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
                Engagement Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.engagementTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" fillColor="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}