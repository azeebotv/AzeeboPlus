'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface PlatformOverview {
  totalUsers: number;
  activeUsers: number;
  totalCreators: number;
  totalContent: number;
  totalRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  userGrowth: number;
  revenueGrowth: number;
  contentGrowth: number;
  systemHealth: {
    apiUptime: number;
    databaseLatency: number;
    cacheHitRate: number;
    errorRate: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'user_signup' | 'content_upload' | 'payment' | 'withdrawal' | 'report';
    description: string;
    timestamp: string;
  }>;
  alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
  }>;
}

export default function PlatformOverviewPage(): JSX.Element {
  const router = useRouter();
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async (): Promise<void> => {
    try {
      const response = await api.admin.getPlatformOverview();
      if (response.success && response.data) {
        setOverview(response.data);
      }
    } catch (error) {
      webLogger.error('Failed to load platform overview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAlertIcon = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'user_signup':
        return '👤';
      case 'content_upload':
        return '📤';
      case 'payment':
        return '💰';
      case 'withdrawal':
        return '💸';
      case 'report':
        return '📊';
      default:
        return '📌';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading platform overview...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Failed to load platform overview</p>
          <button
            onClick={loadOverview}
            className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Overview</h1>
            <p className="text-muted-foreground mt-1">Real-time KPI dashboard</p>
          </div>
          <button
            onClick={loadOverview}
            className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-accent"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">{formatNumber(overview.totalUsers)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Users</p>
            <p className={`text-sm font-medium mt-2 ${overview.userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {overview.userGrowth >= 0 ? '↑' : '↓'} {Math.abs(overview.userGrowth)}%
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">{formatNumber(overview.activeUsers)}</p>
            <p className="text-sm text-muted-foreground mt-1">Active Users</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-green-500">{formatCurrency(overview.totalRevenue)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Revenue</p>
            <p className={`text-sm font-medium mt-2 ${overview.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {overview.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(overview.revenueGrowth)}%
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-foreground">{formatNumber(overview.totalContent)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Content</p>
            <p className={`text-sm font-medium mt-2 ${overview.contentGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {overview.contentGrowth >= 0 ? '↑' : '↓'} {Math.abs(overview.contentGrowth)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">System Health</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-foreground">API Uptime</span>
                  <span className="text-sm font-medium text-foreground">{overview.systemHealth.apiUptime}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${overview.systemHealth.apiUptime}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-foreground">Cache Hit Rate</span>
                  <span className="text-sm font-medium text-foreground">{overview.systemHealth.cacheHitRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${overview.systemHealth.cacheHitRate}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-foreground">Database Latency</span>
                  <span className="text-sm font-medium text-foreground">{overview.systemHealth.databaseLatency}ms</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-foreground">Error Rate</span>
                  <span className={`text-sm font-medium ${overview.systemHealth.errorRate > 5 ? 'text-red-500' : 'text-green-500'}`}>
                    {overview.systemHealth.errorRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {overview.recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 pb-3 border-b border-border">
                  <span className="text-xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Alerts</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {overview.alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 pb-3 border-b border-border">
                  <span className="text-xl">{getAlertIcon(alert.severity)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {overview.alerts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No active alerts</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-2xl font-bold text-foreground">{formatNumber(overview.totalCreators)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Creators</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-2xl font-bold text-red-500">{formatCurrency(overview.totalPayouts)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Payouts</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(overview.pendingPayouts)}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending Payouts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
