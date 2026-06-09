'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface FinancialMetrics {
  totalRevenue: number;
  totalPayouts: number;
  pendingPayouts: number;
  platformFees: number;
  revenueGrowth: number;
  payoutGrowth: number;
  transactions: Array<{
    id: string;
    type: 'payment' | 'payout' | 'refund' | 'fee';
    amount: number;
    userId: string;
    userName: string;
    status: 'completed' | 'pending' | 'failed';
    createdAt: string;
  }>;
  revenueBySource: {
    subscriptions: number;
    superVotes: number;
    tips: number;
    ads: number;
    contentSales: number;
  };
}

export default function FinancialMonitoringPage(): JSX.Element {
  const router = useRouter();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async (): Promise<void> => {
    try {
      const result = await apiFetch<FinancialMetrics>(
        `/api/v1/admin/financial-metrics?range=${timeRange}`
      );

      if (result.success && result.data) {
        setMetrics(result.data as unknown as FinancialMetrics);
      }
    } catch (error) {
      webLogger.error('Failed to load financial metrics', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'payment':
        return '💰';
      case 'payout':
        return '💸';
      case 'refund':
        return '↩️';
      case 'fee':
        return '📊';
      default:
        return '💵';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Failed to load financial data</p>
          <button
            onClick={loadMetrics}
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
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Financial Monitoring</h1>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-foreground hover:bg-accent'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-green-500">{formatCurrency(metrics.totalRevenue)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Revenue</p>
            <p className={`text-sm font-medium mt-2 ${metrics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(metrics.revenueGrowth)}%
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-red-500">{formatCurrency(metrics.totalPayouts)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Payouts</p>
            <p className={`text-sm font-medium mt-2 ${metrics.payoutGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.payoutGrowth >= 0 ? '↑' : '↓'} {Math.abs(metrics.payoutGrowth)}%
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-yellow-500">{formatCurrency(metrics.pendingPayouts)}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending Payouts</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-3xl font-bold text-blue-500">{formatCurrency(metrics.platformFees)}</p>
            <p className="text-sm text-muted-foreground mt-1">Platform Fees</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Revenue by Source</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground">Subscriptions</span>
                <span className="font-semibold text-foreground">{formatCurrency(metrics.revenueBySource.subscriptions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Super Votes</span>
                <span className="font-semibold text-foreground">{formatCurrency(metrics.revenueBySource.superVotes)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Tips</span>
                <span className="font-semibold text-foreground">{formatCurrency(metrics.revenueBySource.tips)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Ads</span>
                <span className="font-semibold text-foreground">{formatCurrency(metrics.revenueBySource.ads)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Content Sales</span>
                <span className="font-semibold text-foreground">{formatCurrency(metrics.revenueBySource.contentSales)}</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Recent Transactions</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {metrics.transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center pb-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getTypeIcon(tx.type)}</span>
                    <div>
                      <p className="font-medium text-foreground">{tx.userName}</p>
                      <p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(tx.amount)}</p>
                    <p className={`text-sm ${getStatusColor(tx.status)}`}>{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
