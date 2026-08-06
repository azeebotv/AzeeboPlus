import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import type { EarningsData } from '@/lib/creator-types';

export default function EarningsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['creator', 'earnings'],
    queryFn: async () => {
      const res = await creatorApi.getEarnings();
      return res.success ? (res.data as EarningsData) : null;
    },
  });

  const payoutMutation = useMutation({
    mutationFn: () => creatorApi.requestPayout(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'earnings'] }),
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Earnings</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>Track your revenue and payouts</p>

      {isLoading ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : data ? (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 180,
              }}
            >
              <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 4 }}>Total Earnings</p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>${data.total.toLocaleString()}</p>
            </div>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 180,
              }}
            >
              <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 4 }}>Pending Payout</p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>
                ${data.pendingPayout.toLocaleString()}
              </p>
            </div>
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                flex: 1,
                minWidth: 180,
              }}
            >
              <p style={{ fontSize: 13, color: '#9A8A7A', marginBottom: 4 }}>Lifetime Earnings</p>
              <p style={{ fontSize: 28, fontWeight: 700 }}>
                ${data.lifetimeEarnings.toLocaleString()}
              </p>
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid #2A1A1A',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Request Payout</h3>
            <p style={{ color: '#9A8A7A', fontSize: 13, marginBottom: 16 }}>
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
                color: '#fff',
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
              <p style={{ color: '#0D3B2E', fontSize: 13, marginTop: 8 }}>
                Payout request submitted successfully
              </p>
            )}
            {payoutMutation.isError && (
              <p style={{ color: '#CC1C1C', fontSize: 13, marginTop: 8 }}>
                Failed to request payout
              </p>
            )}
          </div>
        </>
      ) : (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>
          No earnings data available
        </p>
      )}
    </div>
  );
}
