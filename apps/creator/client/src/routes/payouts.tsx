import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import type { PayoutsData, CreatorSettings } from '@/lib/creator-types';
import { formatNgn, errorTextStyle } from '@/lib/ui';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--creator-border)',
  backgroundColor: 'var(--creator-dark)',
  color: 'var(--creator-text)',
  fontSize: 14,
};

const statusColor: Record<string, string> = {
  pending: 'rgba(245,158,11,0.2)',
  processing: 'rgba(59,130,246,0.2)',
  completed: 'rgba(13,59,46,0.2)',
  failed: 'rgba(204,28,28,0.2)',
  rejected: 'rgba(204,28,28,0.2)',
};
const statusText: Record<string, string> = {
  pending: 'var(--creator-amber, #f59e0b)',
  processing: 'var(--creator-blue, #3b82f6)',
  completed: 'var(--creator-green)',
  failed: 'var(--creator-red)',
  rejected: 'var(--creator-red)',
};

export default function PayoutsPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['creator', 'payouts'],
    queryFn: async () => {
      const res = await creatorApi.getPayouts();
      return res.success ? (res.data as PayoutsData) : null;
    },
  });

  // The backend rejects payouts below the creator's configured minimum —
  // surface the real threshold instead of guessing one.
  const { data: settings } = useQuery({
    queryKey: ['creator', 'settings'],
    queryFn: async () => {
      const res = await creatorApi.getSettings();
      return res.success ? (res.data as CreatorSettings) : null;
    },
  });
  const minimumPayout = settings?.minimumPayout ?? 0;

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await creatorApi.requestPayoutAmount(Number(amount), method);
      return creatorApi.assertSuccess<{ success: boolean; message: string }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'payouts'] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'earnings'] });
      setAmount('');
    },
  });

  const belowMinimum = Number(amount) > 0 && Number(amount) < minimumPayout;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Payouts</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>
        Request withdrawals and track payout history
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
                Available Balance
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--creator-green)' }}>
                {formatNgn(data.availableBalance)}
              </p>
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
                Total Paid Out
              </p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>{formatNgn(data.totalPaidOut)}</p>
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 24,
              maxWidth: 500,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Request Payout</h3>
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--creator-text-muted)',
                  marginBottom: 6,
                }}
              >
                Amount (₦)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10"
                max={data.availableBalance}
                placeholder="Enter amount"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--creator-text-muted)',
                  marginBottom: 6,
                }}
              >
                Method
              </label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <button
              onClick={() => requestMutation.mutate()}
              disabled={
                requestMutation.isPending ||
                !amount ||
                Number(amount) <= 0 ||
                belowMinimum ||
                Number(amount) > data.availableBalance
              }
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontWeight: 600,
                cursor: requestMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: requestMutation.isPending ? 0.6 : 1,
              }}
            >
              {requestMutation.isPending ? 'Requesting...' : 'Request Payout'}
            </button>
            {belowMinimum && (
              <p style={{ color: 'var(--creator-amber, #f59e0b)', fontSize: 13, marginTop: 8 }}>
                Minimum payout is {formatNgn(minimumPayout)} (set in Settings).
              </p>
            )}
            {requestMutation.isSuccess && (
              <p style={{ color: 'var(--creator-green)', fontSize: 13, marginTop: 8 }}>
                Payout request submitted
              </p>
            )}
            {requestMutation.isError && (
              <p style={errorTextStyle()}>{creatorApi.errorMessage(requestMutation.error)}</p>
            )}
          </div>

          {data.history.length > 0 && (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--creator-border)',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Payout History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--creator-border)' }}>
                      {['Amount', 'Method', 'Status', 'Requested', 'Processed'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 12px',
                            textAlign: 'left',
                            color: 'var(--creator-text-muted)',
                            fontWeight: 600,
                            fontSize: 12,
                            textTransform: 'uppercase',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.map((p) => (
                      <tr
                        key={p.id}
                        style={{ borderBottom: '1px solid var(--creator-border-light)' }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                          {formatNgn(p.amount)}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            color: 'var(--creator-text-muted)',
                            textTransform: 'capitalize',
                          }}
                        >
                          {p.method.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: statusColor[p.status],
                              color: statusText[p.status],
                              textTransform: 'capitalize',
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            color: 'var(--creator-text-muted)',
                            fontSize: 13,
                          }}
                        >
                          {new Date(p.requestedAt).toLocaleDateString()}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            color: 'var(--creator-text-muted)',
                            fontSize: 13,
                          }}
                        >
                          {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          No payout data available
        </p>
      )}
    </div>
  );
}
