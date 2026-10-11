import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/base';
import { adminApi } from '@/lib/api/admin';
import { asArray } from '@/lib/payload';
import type { TippingConfig } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';
import { pollingIntervals } from '@azeebo/design-tokens';

interface CreatorTipInfo {
  creatorId: string;
  creatorName: string;
  currency: string;
  totalTips: number;
  totalAmount: number;
  topTier: string | null;
}

export default function TippingPage() {
  const queryClient = useQueryClient();
  const [editingConfig, setEditingConfig] = useState(false);
  const [commissionPct, setCommissionPct] = useState<number>(10);
  const [maxTip, setMaxTip] = useState<number>(500000);
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  const { data: config } = useQuery({
    queryKey: ['admin', 'tipping-config'],
    queryFn: async () => {
      const res = await adminApi.getTippingConfig();
      if (res.success && res.data) {
        const d = res.data as TippingConfig;
        setCommissionPct(d.platformCommissionPct ?? 10);
        setMaxTip(d.maxTipAmount ?? 500000);
        return d;
      }
      return null;
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (newCfg: { platformCommissionPct: number; maxTipAmount: number }) =>
      adminApi.updateTippingConfig(newCfg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tipping-config'] });
      setEditingConfig(false);
      setConfigFeedback('Configuration updated successfully.');
      setTimeout(() => setConfigFeedback(null), 4000);
    },
  });
  // One aggregated backend call — the old version fanned out to 51 HTTP
  // requests per page load (list creators + one stats call each).
  const {
    data: creators = [],
    isLoading: loadingCreators,
    error,
  } = useQuery({
    queryKey: ['admin', 'tipping-summary'],
    queryFn: async (): Promise<CreatorTipInfo[]> => {
      const res = await apiFetch<CreatorTipInfo[]>('/api/v1/admin/ops/tipping-summary?limit=50');
      if (!res.success) throw new Error(res.message || 'Failed to load tipping data');
      // Array guard: a downstream envelope drift must render the empty state,
      // not crash on creators.reduce().
      return asArray<CreatorTipInfo>(res.data);
    },
    refetchInterval: pollingIntervals.idle,
  });

  const totalAmount = creators.reduce((s, c) => s + c.totalAmount, 0);
  const totalTips = creators.reduce((s, c) => s + c.totalTips, 0);
  const displayCurrency = creators[0]?.currency || 'NGN';
  const tierDistribution = creators.reduce<Record<string, number>>((acc, c) => {
    const tier = c.topTier || 'none';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Icon name="heart" size={26} color="var(--admin-orange)" />
          Tipping Dashboard
        </h1>
        <p style={{ color: 'var(--admin-text-muted)' }}>Creator tipping overview and leaderboard</p>
      </div>

      {loadingCreators ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading tipping data...
        </p>
      ) : error ? (
        <div
          role="alert"
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            border: '1px solid rgba(204,28,28,0.4)',
            backgroundColor: 'rgba(204,28,28,0.12)',
            color: 'var(--admin-red-light)',
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          Failed to load tipping data: {(error as Error).message} — check that creator-service is
          running.
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 32,
            }}
          >
            {[
              {
                label: 'Total Tips',
                value: totalTips.toLocaleString(),
                color: 'var(--admin-orange)',
              },
              {
                label: 'Total Amount',
                value: `${displayCurrency} ${totalAmount.toLocaleString()}`,
                color: 'var(--admin-green)',
              },
              {
                label: 'Active Tippers',
                value: creators.length.toLocaleString(),
                color: 'var(--admin-amber)',
              },
              {
                label: 'Tiers Unlocked',
                value: Object.keys(tierDistribution)
                  .filter((t) => t !== 'none')
                  .length.toString(),
                color: 'var(--admin-blue)',
              },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {c.label}
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                padding: 20,
              }}
            >
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Tier Distribution</h3>
              {Object.entries(tierDistribution).length === 0 ? (
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                  No tier data available
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(tierDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([tier, count]) => {
                      const colors: Record<string, string> = {
                        bronze: 'var(--admin-orange)',
                        silver: 'var(--admin-silver)',
                        gold: 'var(--admin-amber)',
                        platinum: 'var(--admin-silver)',
                      };
                      return (
                        <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: colors[tier] || 'var(--admin-grey)',
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: 14,
                              textTransform: 'capitalize',
                              color: 'var(--admin-text)',
                            }}
                          >
                            {tier === 'none' ? 'No Tier' : tier}
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--admin-text-muted)',
                            }}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div
              style={{
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                padding: 20,
              }}
            >
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
                Top Creators by Tips
              </h3>
              {creators.length === 0 ? (
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                  No tipping activity yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {creators.slice(0, 10).map((c, i) => (
                    <div
                      key={c.creatorId}
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--admin-text-muted)',
                          width: 20,
                        }}
                      >
                        #{i + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--admin-text)' }}>
                        {c.creatorName}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-orange)' }}>
                        {c.currency} {c.totalAmount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                        {c.totalTips} tips
                      </span>
                      {c.topTier && (
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'white',
                            textTransform: 'uppercase',
                            backgroundColor:
                              c.topTier === 'platinum'
                                ? 'var(--admin-silver)'
                                : c.topTier === 'gold'
                                  ? 'var(--admin-amber)'
                                  : c.topTier === 'silver'
                                    ? 'var(--admin-silver)'
                                    : 'var(--admin-orange)',
                          }}
                        >
                          {c.topTier}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Platform Tipping Configuration Card */}
          <div
            style={{
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
              padding: 24,
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
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                  Platform Tipping Settings
                </h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                  Configure platform cut on creator gifts and transaction limits
                </p>
              </div>

              {!editingConfig ? (
                <button
                  onClick={() => setEditingConfig(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-card)',
                    backgroundColor: 'transparent',
                    color: 'var(--admin-orange)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Edit Settings
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setEditingConfig(false);
                      setCommissionPct(config?.platformCommissionPct ?? 10);
                      setMaxTip(config?.maxTipAmount ?? 500000);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'transparent',
                      color: 'var(--admin-text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      updateConfigMutation.mutate({
                        platformCommissionPct: Number(commissionPct),
                        maxTipAmount: Number(maxTip),
                      })
                    }
                    disabled={updateConfigMutation.isPending}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: 'var(--admin-green)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {updateConfigMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}
            </div>

            {configFeedback && (
              <p style={{ color: 'var(--admin-emerald)', fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
                {configFeedback}
              </p>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 20,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                  }}
                >
                  Platform Commission (%)
                </label>
                {editingConfig ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 14,
                    }}
                  />
                ) : (
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-orange)' }}>
                    {config?.platformCommissionPct ?? 10}%
                  </p>
                )}
                <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                  Portion retained by platform per tip transaction
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                  }}
                >
                  Maximum Tip Amount ({config?.currency || 'NGN'})
                </label>
                {editingConfig ? (
                  <input
                    type="number"
                    min="100"
                    step="1000"
                    value={maxTip}
                    onChange={(e) => setMaxTip(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 14,
                    }}
                  />
                ) : (
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-text)' }}>
                    {config?.currency || 'NGN'} {(config?.maxTipAmount ?? 500000).toLocaleString()}
                  </p>
                )}
                <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                  Maximum allowed tip in a single payment
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
