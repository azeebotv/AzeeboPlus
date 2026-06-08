'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  pendingEarnings: number;
  lifetimeEarnings: number;
  earningsHistory: Array<{
    date: string;
    amount: number;
    source: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
  revenueBreakdown: {
    subscriptions: number;
    tips: number;
    ads: number;
    superVotes: number;
  };
}

export default function EarningsDashboardPage(): JSX.Element {
  const router = useRouter();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async (): Promise<void> => {
    try {
      const result = await apiFetch<EarningsData>('/v1/creator/earnings');

      if (result.success && result.data) {
        setEarnings(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load earnings', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Failed to load earnings</p>
          <button
            onClick={loadEarnings}
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
            <h1 className="text-3xl font-bold text-foreground">Earnings Dashboard</h1>
          </div>
        </div>

        <div className="bg-primary rounded-2xl p-8 text-white mb-8 text-center">
          <p className="text-lg opacity-80 mb-2">Available Balance</p>
          <p className="text-5xl font-bold mb-6">{formatCurrency(earnings.availableBalance)}</p>
          <button
            onClick={() => router.push('/wallet/withdraw')}
            className="px-8 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-white/90"
          >
            Withdraw Funds
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(earnings.pendingEarnings)}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending Earnings</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(earnings.lifetimeEarnings)}</p>
            <p className="text-sm text-muted-foreground mt-1">Lifetime Earnings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Revenue Breakdown</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground">Subscriptions</span>
                <span className="font-semibold text-foreground">{formatCurrency(earnings.revenueBreakdown.subscriptions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Tips</span>
                <span className="font-semibold text-foreground">{formatCurrency(earnings.revenueBreakdown.tips)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Ads</span>
                <span className="font-semibold text-foreground">{formatCurrency(earnings.revenueBreakdown.ads)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Super Votes</span>
                <span className="font-semibold text-foreground">{formatCurrency(earnings.revenueBreakdown.superVotes)}</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Earnings History</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {earnings.earningsHistory.slice(0, 10).map((item, index) => (
                <div key={index} className="flex justify-between items-center pb-3 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">{item.source}</p>
                    <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                    <p className={`text-sm ${getStatusColor(item.status)}`}>{item.status}</p>
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
