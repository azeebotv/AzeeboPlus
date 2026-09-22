import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import type { EarningsData, EarningsHistoryData, EarningsEntry } from '@/lib/creator-types';
import { formatNgn, formatDate, cardStyle, errorTextStyle } from '@/lib/ui';

export default function EarningsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['creator', 'earnings'],
    queryFn: async () => {
      const res = await creatorApi.getEarnings();
      return res.success ? (res.data as EarningsData) : null;
    },
  });

  const history = useQuery({
    queryKey: ['creator', 'earnings-history'],
    queryFn: async () => {
      const res = await creatorApi.getEarningsHistory(50);
      return res.success ? (res.data as EarningsHistoryData) : null;
    },
  });

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const res = await creatorApi.requestPayout();
      return creatorApi.assertSuccess<{ success: boolean; message: string }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'earnings'] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'payouts'] });
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Earnings</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>
        Track your revenue and payouts
      </p>

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : isError ? (
        <p style={errorTextStyle()}>{creatorApi.errorMessage(error)}</p>
      ) : data ? (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 180,
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 4 }}>
                Total Earnings
              </p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>{formatNgn(data.total)}</p>
            </div>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 180,
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 4 }}>
                Pending Payout
              </p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>{formatNgn(data.pendingPayout)}</p>
            </div>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 180,
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 4 }}>
                Lifetime Earnings
              </p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>{formatNgn(data.lifetimeEarnings)}</p>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Request Payout</h3>
            <p style={{ color: 'var(--creator-text-muted)', fontSize: 13, marginBottom: 16 }}>
              Request a payout of your available balance. Payouts are processed within 3-5 business
              days.
            </p>
            <button
              onClick={() => payoutMutation.mutate()}
              disabled={payoutMutation.isPending || data.pendingPayout > 0}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontWeight: 600,
                cursor:
                  payoutMutation.isPending || data.pendingPayout > 0 ? 'not-allowed' : 'pointer',
                opacity: payoutMutation.isPending || data.pendingPayout > 0 ? 0.6 : 1,
              }}
            >
              {payoutMutation.isPending
                ? 'Requesting...'
                : data.pendingPayout > 0
                  ? 'Payout Pending'
                  : 'Request Payout'}
            </button>
            {payoutMutation.isSuccess && (
              <p style={{ color: 'var(--creator-green)', fontSize: 13, marginTop: 8 }}>
                Payout request submitted successfully
              </p>
            )}
            {payoutMutation.isError && (
              <p style={errorTextStyle()}>{creatorApi.errorMessage(payoutMutation.error)}</p>
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Earnings History
              {history.data?.total != null && (
                <span style={{ color: 'var(--creator-text-muted)', fontWeight: 400, fontSize: 13 }}>
                  {' '}
                  ({history.data.total} entries)
                </span>
              )}
            </h3>
            {history.isLoading ? (
              <p style={{ color: 'var(--creator-text-muted)', fontSize: 13 }}>Loading history...</p>
            ) : history.data && history.data.items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: 'var(--creator-text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Type</th>
                    <th style={{ padding: '8px 0', fontWeight: 500 }}>Description</th>
                    <th style={{ padding: '8px 0', fontWeight: 500, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.data.items.map((entry: EarningsEntry) => (
                    <tr
                      key={entry.id}
                      style={{
                        borderTop: '1px solid var(--creator-border-light)',
                      }}
                    >
                      <td style={{ padding: '10px 0' }}>{formatDate(entry.createdAt)}</td>
                      <td style={{ padding: '10px 0', textTransform: 'capitalize' }}>
                        {entry.type.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '10px 0', color: 'var(--creator-text-muted)' }}>
                        {entry.description?.includes('Challenge prize') ? (
                          <span style={{ color: 'var(--creator-text)' }}>
                            <span aria-hidden>🏆</span> Challenge prize
                          </span>
                        ) : (
                          (entry.description ?? '—')
                        )}
                      </td>
                      <td
                        style={{
                          padding: '10px 0',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: 'var(--creator-green)',
                        }}
                      >
                        +{formatNgn(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--creator-text-muted)', fontSize: 13 }}>
                No earnings recorded yet.
              </p>
            )}
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          No earnings data available
        </p>
      )}
    </div>
  );
}
