import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import type { MonetizationData, MonetizationTier } from '@/lib/creator-types';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--creator-border)',
  backgroundColor: 'var(--creator-dark)',
  color: 'var(--creator-text)',
  fontSize: 14,
};

export default function MonetizationPage() {
  const queryClient = useQueryClient();
  const [tipEnabled, setTipEnabled] = useState(false);
  const [tipMin, setTipMin] = useState('1');
  const [tipMax, setTipMax] = useState('100');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');

  const { data, isLoading } = useQuery({
    queryKey: ['creator', 'monetization'],
    queryFn: async () => {
      const res = await creatorApi.getMonetization();
      if (res.success && res.data) {
        const d = res.data as MonetizationData;
        setTipEnabled(d.tipEnabled);
        setTipMin(String(d.tipMin));
        setTipMax(String(d.tipMax));
        setPayoutMethod(d.payoutMethod);
        return d;
      }
      return null;
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      creatorApi.updateMonetization({
        tipEnabled,
        tipMin: Number(tipMin),
        tipMax: Number(tipMax),
        payoutMethod,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'monetization'] }),
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Monetization</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>
        Configure subscriptions, tips, and payout settings
      </p>

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div style={{ maxWidth: 700 }}>
          {/* Subscription Tiers */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Subscription Tiers</h3>
            {data?.tiers && data.tiers.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                {data.tiers.map((tier: MonetizationTier) => (
                  <div
                    key={tier.id}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      border: '1px solid var(--creator-border)',
                      backgroundColor: 'var(--creator-dark)',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {tier.name}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                      ${tier.price}
                      <span style={{ fontSize: 13, color: 'var(--creator-text-muted)', fontWeight: 400 }}>/mo</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--creator-text-muted)', marginBottom: 8 }}>
                      {tier.subscriberCount} subscribers
                    </div>
                    {tier.perks.length > 0 && (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {tier.perks.map((perk, i) => (
                          <li key={i} style={{ fontSize: 12, color: 'var(--creator-text-muted)', padding: '2px 0' }}>
                            + {perk}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--creator-text-muted)', fontSize: 13 }}>
                No subscription tiers configured. Set up tiers in your creator settings.
              </p>
            )}
          </div>

          {/* Tip Settings */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Tip Settings</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 14 }}>Enable Tips</div>
                <div style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>
                  Allow fans to send one-time tips
                </div>
              </div>
              <button
                onClick={() => setTipEnabled(!tipEnabled)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: tipEnabled ? 'var(--creator-orange)' : 'var(--creator-surface)',
                  position: 'relative',
                  transition: 'background-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: 'var(--creator-surface-light)',
                    position: 'absolute',
                    top: 3,
                    left: tipEnabled ? 23 : 3,
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
            {tipEnabled && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}
                  >
                    Min Tip ($)
                  </label>
                  <input
                    type="number"
                    value={tipMin}
                    onChange={(e) => setTipMin(e.target.value)}
                    min="1"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}
                  >
                    Max Tip ($)
                  </label>
                  <input
                    type="number"
                    value={tipMax}
                    onChange={(e) => setTipMax(e.target.value)}
                    min="1"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payout Method */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Payout Method</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--creator-text-muted)', marginBottom: 6 }}>
                Method
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                style={inputStyle}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            {data?.payoutDetails && Object.keys(data.payoutDetails).length > 0 && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: 'var(--creator-dark)',
                  border: '1px solid var(--creator-border)',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--creator-text-muted)', marginBottom: 8 }}>Current Details</p>
                {Object.entries(data.payoutDetails).map(([key, val]) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      padding: '3px 0',
                    }}
                  >
                    <span style={{ color: 'var(--creator-text-muted)', textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Pricing Summary</h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--creator-border-light)',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--creator-text-muted)' }}>Subscription Tiers</span>
              <span style={{ fontSize: 14 }}>{data?.tiers?.length || 0} active</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--creator-border-light)',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--creator-text-muted)' }}>Tips</span>
              <span style={{ fontSize: 14, color: tipEnabled ? 'var(--creator-green)' : 'var(--creator-text-muted)' }}>
                {tipEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ fontSize: 14, color: 'var(--creator-text-muted)' }}>Platform Fee</span>
              <span style={{ fontSize: 14 }}>15%</span>
            </div>
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Monetization Settings'}
          </button>
          {saveMutation.isSuccess && (
            <p style={{ color: 'var(--creator-green)', fontSize: 13, marginTop: 8 }}>
              Settings saved successfully
            </p>
          )}
          {saveMutation.isError && (
            <p style={{ color: 'var(--creator-red)', fontSize: 13, marginTop: 8 }}>Failed to save settings</p>
          )}
        </div>
      )}
    </div>
  );
}
