'use client';
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface EngagementMetrics {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  contentViews: number;
  interactions: number;
  predictions: number;
  leaderboardViews: number;
  referralSignups: number;
}

interface EngagementTrend {
  date: string;
  activeUsers: number;
  interactions: number;
  contentViews: number;
}

export default function EngagementMonitoringPage(): JSX.Element {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [trends, setTrends] = useState<EngagementTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async (): Promise<void> => {
    try {
      const [metricsRes, trendsRes] = await Promise.all([
        api.admin.getEngagementMetrics(),
        api.admin.getEngagementTrends(timeRange),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data as unknown as EngagementMetrics);
      }
      if (trendsRes.success && trendsRes.data) {
        setTrends(trendsRes.data as unknown as EngagementTrend[]);
      }
    } catch (error) {
      webLogger.error('Failed to load engagement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading engagement data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Engagement Monitoring</h1>
            <p className="text-muted-foreground">Track user engagement and platform activity</p>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  timeRange === range
                    ? 'bg-primary text-white'
                    : 'bg-card text-muted-foreground hover:bg-accent'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {metrics && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground mb-1">Daily Active Users</p>
                <p className="text-2xl font-bold text-foreground">{metrics.dailyActiveUsers.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground mb-1">Monthly Active Users</p>
                <p className="text-2xl font-bold text-foreground">{metrics.monthlyActiveUsers.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground mb-1">Avg Session Duration</p>
                <p className="text-2xl font-bold text-foreground">{metrics.averageSessionDuration} min</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground mb-1">Content Views</p>
                <p className="text-2xl font-bold text-foreground">{metrics.contentViews.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground mb-1">Interactions</p>
                <p className="text-2xl font-bold text-purple-500">{metrics.interactions.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground mb-1">Predictions Made</p>
                <p className="text-2xl font-bold text-blue-500">{metrics.predictions.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground mb-1">Leaderboard Views</p>
                <p className="text-2xl font-bold text-green-500">{metrics.leaderboardViews.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground mb-1">Referral Signups</p>
                <p className="text-2xl font-bold text-orange-500">{metrics.referralSignups.toLocaleString()}</p>
              </div>
            </div>
          </>
        )}

        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Engagement Trends</h2>
          <div className="space-y-4">
            {trends.map((trend) => (
              <div key={trend.date} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-24">{trend.date}</span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Users</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min((trend.activeUsers / 10000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-16 text-right">{trend.activeUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Views</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min((trend.contentViews / 50000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-16 text-right">{trend.contentViews.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Interactions</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min((trend.interactions / 20000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-16 text-right">{trend.interactions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {trends.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-foreground mb-2">No engagement data available</h2>
            <p className="text-muted-foreground">Data will appear once users start interacting with the platform</p>
          </div>
        )}
      </div>
    </div>
  );
}
