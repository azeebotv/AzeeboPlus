import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { asArray, isRecord, num } from '@/lib/payload';
import type { PayoutRequest } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';

/**
 * Financial overview — only real numbers:
 *  - all-time revenue: completed wallet credits (dashboard stats)
 *  - 30-day revenue series: daily aggregation of the same ledger
 *    (GET /admin/dashboard/revenue)
 *  - wallet float: aggregate balances from /admin/wallets/stats
 *  - payout requests: pending & historical payouts with approval flow
 */
export default function FinancialPage() {
  const queryClient = useQueryClient();
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutStatus, setPayoutStatus] = useState<string>('pending');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'financial'],
    queryFn: async () => {
      const [dashRes, revenueRes, walletRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getDashboardRevenue(30),
        adminApi.getWalletStats(),
      ]);
      // Throw so React Query surfaces a real error instead of silently zeroing
      if (!dashRes.success) throw new Error(dashRes.message || 'Failed to load dashboard');
      const dash: Record<string, unknown> = isRecord(dashRes.data) ? dashRes.data : {};
      const wallet: Record<string, unknown> = isRecord(walletRes.data) ? walletRes.data : {};
      const series = asArray<{ date: string; revenue: number }>(revenueRes.data).map((p) => ({
        date: String(p?.date ?? ''),
        revenue: num(p?.revenue),
      }));
      return {
        totalRevenue: num(dash.totalRevenue),
        revenue30d: series.reduce((sum, p) => sum + p.revenue, 0),
        series,
        totalBalance: num(wallet.totalBalance),
        totalBonus: num(wallet.totalBonus),
        totalPromo: num(wallet.totalPromo),
        todayTransactions: num(wallet.todayTransactions),
      };
    },
  });

  const { data: payoutsData, isLoading: loadingPayouts, isError: isPayoutsError, refetch: refetchPayouts } = useQuery({
    queryKey: ['admin', 'payouts', payoutPage, payoutStatus],
    queryFn: async () => {
      const res = await adminApi.getPayoutRequests({
        page: payoutPage,
        limit: 10,
        status: payoutStatus === 'all' ? undefined : payoutStatus,
      });
      if (!res.success) throw new Error(res.message || 'Failed to load payout requests');
      const d = res.data as { items: PayoutRequest[]; total: number; stats: any };
      return {
        items: d?.items || [],
        total: d?.total || 0,
        stats: d?.stats || null,
      };
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approvePayoutRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.rejectPayoutRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      setRejectId(null);
      setRejectReason('');
    },
  });

  const fin =
    data ??
    {
      totalRevenue: 0,
      revenue30d: 0,
      series: [],
      totalBalance: 0,
      totalBonus: 0,
      totalPromo: 0,
      todayTransactions: 0,
    };

  const maxRevenue = Math.max(1, ...fin.series.map((p) => p.revenue));

  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  const cards = [
    { label: 'Revenue (all time)', value: fmt(fin.totalRevenue), color: 'var(--admin-emerald)' },
    { label: 'Revenue (last 30 days)', value: fmt(fin.revenue30d), color: 'var(--admin-emerald)' },
    { label: 'Wallet Float (user balances)', value: fmt(fin.totalBalance), color: 'var(--admin-orange)' },
    { label: 'Bonus Balance Float', value: fmt(fin.totalBonus), color: 'var(--admin-amber)' },
    { label: 'Pending Payouts', value: fmt(payoutsData?.stats?.pendingAmount ?? 0), color: 'var(--admin-red)' },
    { label: 'Wallet Transactions Today', value: fin.todayTransactions.toLocaleString(), color: '#8b5cf6' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="dollarSign" size={28} color="var(--admin-orange)" />
          <span>Financial Overview</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', maxWidth: 720 }}>
          Revenue reflects completed wallet credits from the live ledger. Review creator payout requests, float liabilities, and settlement schedules.
        </p>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : isError ? (
        <div
          style={{
            padding: 32,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            backgroundColor: 'rgba(204,28,28,0.08)',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <p style={{ color: 'var(--admin-red)', fontWeight: 600, marginBottom: 8 }}>
            Failed to load financial data
          </p>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
            {error instanceof Error ? error.message : 'An unexpected error occurred. Do not rely on any cached totals.'}
          </p>
          <button
            onClick={() => refetch()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-red)',
              backgroundColor: 'transparent',
              color: 'var(--admin-red)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {cards.map((c) => (
              <div
                key={c.label}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>{c.label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {fin.series.length > 0 && (
            <div
              style={{
                padding: 24,
                borderRadius: 20,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                marginBottom: 32,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Revenue — last 30 days</h2>
              <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
                Daily completed wallet credits
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140 }}>
                {fin.series.map((p) => (
                  <div
                    key={p.date}
                    title={`${p.date}: ${fmt(p.revenue)}`}
                    style={{
                      flex: 1,
                      minWidth: 4,
                      height: `${Math.max(2, (p.revenue / maxRevenue) * 100)}%`,
                      backgroundColor: 'var(--admin-emerald)',
                      opacity: 0.85,
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Payout Requests Section */}
          <div
            style={{
              padding: 24,
              borderRadius: 20,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Payout Requests</h2>
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                  Review creator cash-out requests and approve transfers
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {['pending', 'approved', 'completed', 'rejected', 'all'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setPayoutStatus(st);
                      setPayoutPage(1);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: payoutStatus === st ? 'none' : '1px solid var(--admin-card)',
                      backgroundColor:
                        payoutStatus === st
                          ? 'var(--admin-orange)'
                          : 'transparent',
                      color: payoutStatus === st ? 'white' : 'var(--admin-text-muted)',
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loadingPayouts ? (
              <p style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}>
                Loading payouts...
              </p>
            ) : isPayoutsError ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ color: 'var(--admin-red)', fontWeight: 600, marginBottom: 8 }}>
                  Failed to load payout requests
                </p>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 12 }}>
                  Do not approve or reject based on stale data. Reload to get the current state.
                </p>
                <button
                  onClick={() => refetchPayouts()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-red)',
                    backgroundColor: 'transparent',
                    color: 'var(--admin-red)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (payoutsData?.items?.length ?? 0) === 0 ? (
              <p style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}>
                No {payoutStatus} payout requests found.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-card)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', color: 'var(--admin-text-muted)' }}>Recipient</th>
                      <th style={{ padding: '10px 12px', color: 'var(--admin-text-muted)' }}>Amount</th>
                      <th style={{ padding: '10px 12px', color: 'var(--admin-text-muted)' }}>Method</th>
                      <th style={{ padding: '10px 12px', color: 'var(--admin-text-muted)' }}>Status</th>
                      <th style={{ padding: '10px 12px', color: 'var(--admin-text-muted)' }}>Requested</th>
                      <th style={{ padding: '10px 12px', color: 'var(--admin-text-muted)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutsData?.items.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px' }}>
                          <p style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                            {p.user?.displayName || 'Creator'}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                            {p.user?.email || p.userId}
                          </p>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--admin-emerald)' }}>
                          {p.currency} {Number(p.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', textTransform: 'capitalize', color: 'var(--admin-text)' }}>
                          {p.method}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              backgroundColor:
                                p.status === 'approved' || p.status === 'completed'
                                  ? 'rgba(13,59,46,0.3)'
                                  : p.status === 'pending'
                                    ? 'rgba(232,66,10,0.2)'
                                    : 'rgba(204,28,28,0.2)',
                              color:
                                p.status === 'approved' || p.status === 'completed'
                                  ? 'var(--admin-emerald)'
                                  : p.status === 'pending'
                                    ? 'var(--admin-orange)'
                                    : 'var(--admin-red)',
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--admin-text-muted)' }}>
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {p.status === 'pending' && (
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                onClick={() => approveMutation.mutate(p.id)}
                                disabled={approveMutation.isPending}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  border: 'none',
                                  backgroundColor: 'var(--admin-emerald)',
                                  color: 'white',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectId(p.id)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  border: '1px solid var(--admin-red)',
                                  backgroundColor: 'transparent',
                                  color: 'var(--admin-red)',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Reject Reason Modal */}
          {rejectId && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--admin-dark)',
                  border: '1px solid var(--admin-card)',
                  borderRadius: 16,
                  padding: 24,
                  width: '90%',
                  maxWidth: 420,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Reject Payout Request</h3>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
                  Provide an explanation for rejecting this creator payout request.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Bank details mismatch, flagged for audit..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    backgroundColor: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={() => {
                      setRejectId(null);
                      setRejectReason('');
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'transparent',
                      color: 'var(--admin-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (rejectId) {
                        rejectMutation.mutate({ id: rejectId, reason: rejectReason });
                      }
                    }}
                    disabled={rejectMutation.isPending}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: 'var(--admin-red)',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

