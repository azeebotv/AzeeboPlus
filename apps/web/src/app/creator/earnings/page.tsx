'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

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
  revenueBreakdown: { subscriptions: number; tips: number; ads: number; superVotes: number };
}

export default function EarningsDashboardPage(): React.JSX.Element {
  const router = useRouter();

  const {
    data: earnings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'earnings'],
    queryFn: async () => {
      const result = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(
        '/v1/creators/earnings'
      );
      if (result.success && result.data) {
        const d = result.data as Record<string, unknown>;
        return {
          totalEarnings: Number(d.totalEarnings ?? d.total ?? 0),
          availableBalance: Number(d.availableBalance ?? d.pending ?? 0),
          pendingEarnings: Number(d.pendingEarnings ?? d.pending ?? 0),
          lifetimeEarnings: Number(d.lifetimeEarnings ?? d.totalEarnings ?? 0),
          earningsHistory: Array.isArray(d.earningsHistory)
            ? (d.earningsHistory as Array<Record<string, unknown>>).map((h) => ({
                date: String(h.date || h.createdAt || ''),
                amount: Number(h.amount || 0),
                source: String(h.source || 'unknown'),
                status: String(h.status || 'completed') as 'completed' | 'pending' | 'failed',
              }))
            : [],
          revenueBreakdown: d.revenueBreakdown || {
            subscriptions: 0,
            tips: 0,
            ads: 0,
            superVotes: 0,
          },
        } as EarningsData;
      }
      return null;
    },
  });

  const formatCurrency = (amount: number): string =>
    `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const getStatusStyle = (status: string): { color: string } => {
    switch (status) {
      case 'completed':
        return { color: '#22C55E' };
      case 'pending':
        return { color: '#EAB308' };
      case 'failed':
        return { color: '#EF4444' };
      default:
        return { color: 'rgba(255,255,255,0.4)' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Skeleton width="120px" height="20px" className="mb-2" />
            <Skeleton width="200px" height="32px" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="az-glass p-6">
                <Skeleton width="60%" height="14px" className="mb-2" />
                <Skeleton width="80%" height="28px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !earnings) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <ErrorState
            title="Failed to load earnings"
            description="Please try again later"
            onButtonPress={() => router.refresh()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-white/50 hover:text-white mb-2 flex items-center gap-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>{' '}
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Earnings Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Available Balance',
              value: formatCurrency(earnings.availableBalance),
              accent: true,
            },
            {
              label: 'Pending Earnings',
              value: formatCurrency(earnings.pendingEarnings),
              accent: false,
            },
            {
              label: 'Total Earnings',
              value: formatCurrency(earnings.totalEarnings),
              accent: false,
            },
            {
              label: 'Lifetime Earnings',
              value: formatCurrency(earnings.lifetimeEarnings),
              accent: false,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`az-glass p-6 ${stat.accent ? 'ring-1' : ''}`}
              style={stat.accent ? { boxShadow: '0 0 20px rgba(232,66,10,0.2)' } : undefined}
            >
              <p className="text-sm text-white/50 mb-1">{stat.label}</p>
              <p
                className="text-2xl font-bold"
                style={stat.accent ? { color: '#E8420A' } : { color: '#fff' }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="az-glass p-6">
            <h2 className="text-xl font-bold text-white mb-4">Revenue Breakdown</h2>
            <div className="space-y-4">
              {[
                {
                  label: 'Subscriptions',
                  amount: earnings.revenueBreakdown.subscriptions,
                  color: '#E8420A',
                },
                { label: 'Tips', amount: earnings.revenueBreakdown.tips, color: '#CC1C1C' },
                { label: 'Ads', amount: earnings.revenueBreakdown.ads, color: '#0D3B2E' },
                {
                  label: 'Super Votes',
                  amount: earnings.revenueBreakdown.superVotes,
                  color: '#EAB308',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-white">{item.label}</span>
                  </div>
                  <span className="font-semibold text-white">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="az-glass p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/wallet/withdraw')}
                className="w-full py-3 rounded-full font-semibold transition-all az-btn-primary"
              >
                Withdraw Funds
              </button>
              <button
                onClick={() => router.push('/wallet/transactions')}
                className="w-full py-3 rounded-full font-semibold transition-colors"
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                }}
              >
                View Transactions
              </button>
            </div>
          </div>
        </div>

        <div className="az-glass p-6">
          <h2 className="text-xl font-bold text-white mb-4">Earnings History</h2>
          <div className="space-y-3">
            {earnings.earningsHistory.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div>
                  <p className="font-medium text-white">{entry.source}</p>
                  <p className="text-sm text-white/50">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">+{formatCurrency(entry.amount)}</p>
                  <p className="text-sm capitalize" style={getStatusStyle(entry.status)}>
                    {entry.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
