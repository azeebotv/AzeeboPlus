'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';

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
    pending: 'bg-az-warning-500/15 text-az-warning-400',
    processing: 'bg-az-secondary-500/15 text-az-secondary-400',
    completed: 'bg-az-success-500/15 text-az-success-400',
    failed: 'bg-az-error-500/15 text-az-error-400',
  };

  return (
    <PageShell maxWidth="xl" className="pb-16">
      <PageHero
        title="Earnings Dashboard"
        eyebrow="Creators"
        description="Track your earnings, payouts, and performance"
      />

      {/* Summary cards */}
      {summary && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="az-glass p-4">
            <p className="az-caption text-az-ink-muted">Total Earnings</p>
            <p className="az-title mt-1 text-az-ink">
              {summary.totalEarnings.toLocaleString()} {summary.currency}
            </p>
          </div>
          <div className="az-glass p-4">
            <p className="az-caption text-az-ink-muted">Pending Payout</p>
            <p className="az-title mt-1 text-az-secondary-400">
              {summary.pendingPayout.toLocaleString()} {summary.currency}
            </p>
          </div>
          <div className="az-glass p-4">
            <p className="az-caption text-az-ink-muted">This Month</p>
            <p className="az-title mt-1 text-az-ink">
              {summary.currentMonth.toLocaleString()} {summary.currency}
            </p>
            <p
              className={`az-micro-label mt-1 ${summary.growthPercent >= 0 ? 'text-az-success-400' : 'text-az-error-500'}`}
            >
              {summary.growthPercent >= 0 ? '↑' : '↓'} {Math.abs(summary.growthPercent)}% vs last
              month
            </p>
          </div>
          <div className="az-glass p-4">
            <p className="az-caption text-az-ink-muted">Paid Out</p>
            <p className="az-title mt-1 text-az-success-400">
              {summary.paidOut.toLocaleString()} {summary.currency}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-az-control bg-az-glass-fill p-1">
        {(['overview', 'history', 'payouts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`az-body-strong flex-1 rounded-az-control px-4 py-2 transition-colors ${
              activeTab === tab
                ? 'bg-az-glass-fill-active text-az-ink'
                : 'text-az-ink-muted hover:text-az-ink'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="az-body py-12 text-center text-az-ink-muted">Loading earnings...</div>
      ) : error ? (
        <div className="az-body py-12 text-center text-az-error-400">{error}</div>
      ) : (
        <>
          {/* History tab */}
          {activeTab === 'history' && (
            <div className="az-glass overflow-hidden">
              <table className="w-full">
                <thead className="bg-az-glass-fill">
                  <tr>
                    <th className="az-body-strong px-4 py-3 text-left text-az-ink-muted">Type</th>
                    <th className="az-body-strong px-4 py-3 text-left text-az-ink-muted">
                      Description
                    </th>
                    <th className="az-body-strong px-4 py-3 text-left text-az-ink-muted">Amount</th>
                    <th className="az-body-strong px-4 py-3 text-left text-az-ink-muted">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-az-glass-border">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-az-glass-fill">
                      <td className="az-body px-4 py-3">
                        <span>{typeIcons[entry.type]}</span>
                      </td>
                      <td className="az-body px-4 py-3 text-az-ink">
                        {entry.description}
                        {entry.contentTitle && (
                          <span className="ml-1 text-az-ink-muted">• {entry.contentTitle}</span>
                        )}
                      </td>
                      <td className="az-body-strong px-4 py-3 text-az-success-400">
                        +{entry.amount.toLocaleString()} {entry.currency}
                      </td>
                      <td className="az-body px-4 py-3 text-az-ink-muted">
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
                <button className="az-btn-primary az-btn-primary--inline az-btn-primary--sm">
                  Request Payout
                </button>
              </div>

              <div className="az-glass overflow-hidden">
                <table className="w-full">
                  <thead className="bg-az-glass-fill">
                    <tr>
                      <th className="az-body-strong px-4 py-3 text-left text-az-ink-muted">
                        Amount
                      </th>
                      <th className="az-body-strong px-4 py-3 text-left text-az-ink-muted">
                        Status
                      </th>
                      <th className="az-body-strong px-4 py-3 text-left text-az-ink-muted">
                        Requested
                      </th>
                      <th className="az-body-strong px-4 py-3 text-left text-az-ink-muted">
                        Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-az-glass-border">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-az-glass-fill">
                        <td className="az-body-strong px-4 py-3 text-az-ink">
                          {payout.amount.toLocaleString()} {payout.currency}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`az-micro-label rounded-az-pill px-2 py-1 ${statusColors[payout.status]}`}
                          >
                            {payout.status}
                          </span>
                        </td>
                        <td className="az-body px-4 py-3 text-az-ink-muted">
                          {new Date(payout.requestedAt).toLocaleDateString()}
                        </td>
                        <td className="az-body px-4 py-3 text-az-ink-muted">
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
    </PageShell>
  );
}
