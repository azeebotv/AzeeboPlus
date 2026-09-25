'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

/**
 * Creator Earnings Dashboard (TAA §68)
 * Displays creator earnings, analytics, and payout information.
 */

interface EarningsSummary {
  totalEarnings: number;
  pendingPayout: number;
  paidOut: number;
  currency: string;
  currentMonth: number;
  lastMonth: number;
  growthPercent: number;
}

interface EarningsEntry {
  id: string;
  type: 'views' | 'tips' | 'subscriptions' | 'bonus' | 'payout';
  description: string;
  amount: number;
  currency: string;
  createdAt: string;
  contentTitle?: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  bankName?: string;
  accountNumber?: string;
}

export default function CreatorEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [entries, setEntries] = useState<EarningsEntry[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'payouts'>('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryRes, entriesRes, payoutsRes] = await Promise.all([
        apiFetch<EarningsSummary>('/api/v1/creator/earnings/summary'),
        apiFetch<EarningsEntry[]>('/api/v1/creator/earnings/history?limit=50'),
        apiFetch<PayoutRequest[]>('/api/v1/creator/payouts'),
      ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (entriesRes.success && entriesRes.data) setEntries(entriesRes.data);
      if (payoutsRes.success && payoutsRes.data) setPayouts(payoutsRes.data);
    } catch {
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const typeIcons: Record<string, string> = {
    views: 'Eye',
    tips: 'Heart',
    subscriptions: 'Star',
    bonus: 'Gift',
    payout: 'DollarSign',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Earnings Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track your earnings, payouts, and performance
          </p>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Total Earnings</p>
              <p className="text-2xl font-bold text-foreground">
                {summary.totalEarnings.toLocaleString()} {summary.currency}
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Pending Payout</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.pendingPayout.toLocaleString()} {summary.currency}
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">This Month</p>
              <p className="text-2xl font-bold text-foreground">
                {summary.currentMonth.toLocaleString()} {summary.currency}
              </p>
              <p
                className={`text-xs ${summary.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {summary.growthPercent >= 0 ? '↑' : '↓'} {Math.abs(summary.growthPercent)}% vs last
                month
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border">
              <p className="text-muted-foreground text-sm">Paid Out</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.paidOut.toLocaleString()} {summary.currency}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
          {(['overview', 'history', 'payouts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading earnings...</div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">{error}</div>
        ) : (
          <>
            {/* History tab */}
            {activeTab === 'history' && (
              <div className="bg-card rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <span>{typeIcons[entry.type]}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {entry.description}
                          {entry.contentTitle && (
                            <span className="text-muted-foreground ml-1">
                              • {entry.contentTitle}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">
                          +{entry.amount.toLocaleString()} {entry.currency}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payouts tab */}
            {activeTab === 'payouts' && (
              <div className="space-y-4">
                {/* Request payout button */}
                <div className="flex justify-end">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                    Request Payout
                  </button>
                </div>

                <div className="bg-card rounded-xl border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                          Amount
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                          Requested
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                          Completed
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            {payout.amount.toLocaleString()} {payout.currency}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${statusColors[payout.status]}`}
                            >
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(payout.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {payout.completedAt
                              ? new Date(payout.completedAt).toLocaleDateString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
