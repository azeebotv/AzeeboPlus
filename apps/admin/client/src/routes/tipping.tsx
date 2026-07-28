import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api/admin';

interface CreatorTipInfo {
  creatorId: string;
  creatorName: string;
  totalTips: number;
  totalAmount: number;
  topTier: string | null;
}

export default function TippingPage() {
  const [creators, setCreators] = useState<CreatorTipInfo[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingCreators(true);
      try {
        const usersRes = await adminApi.getUsers(1, 50, 'creator');
        const users =
          usersRes.success && usersRes.data
            ? Array.isArray(usersRes.data)
              ? (usersRes.data as Array<{ id: string; name?: string; displayName?: string }>)
              : (
                  usersRes.data as unknown as {
                    items: Array<{ id: string; name?: string; displayName?: string }>;
                  }
                ).items || []
            : [];

        const results = await Promise.allSettled(
          users.map(async (u) => {
            const statsRes = await adminApi.getTipStats(u.id);
            const stats =
              statsRes.success && statsRes.data
                ? (statsRes.data as {
                    totalTips: number;
                    totalAmount: number;
                    topTier: string | null;
                  })
                : { totalTips: 0, totalAmount: 0, topTier: null };
            return {
              creatorId: u.id,
              creatorName: u.displayName || u.name || u.id.slice(0, 8),
              totalTips: stats.totalTips,
              totalAmount: stats.totalAmount,
              topTier: stats.topTier,
            };
          })
        );

        if (!cancelled) {
          setCreators(
            results
              .filter((r) => r.status === 'fulfilled')
              .map((r) => (r as PromiseFulfilledResult<CreatorTipInfo>).value)
              .filter((c) => c.totalTips > 0)
              .sort((a, b) => b.totalAmount - a.totalAmount)
          );
        }
      } catch {
        // Silent
      } finally {
        if (!cancelled) setLoadingCreators(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalAmount = creators.reduce((s, c) => s + c.totalAmount, 0);
  const totalTips = creators.reduce((s, c) => s + c.totalTips, 0);
  const tierDistribution = creators.reduce<Record<string, number>>((acc, c) => {
    const tier = c.topTier || 'none';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Tipping Dashboard</h1>
        <p style={{ color: '#9A8A7A' }}>Creator tipping overview and leaderboard</p>
      </div>

      {loadingCreators ? (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>
          Loading tipping data...
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12,
              marginBottom: 32,
            }}
          >
            {[
              { label: 'Total Tips', value: totalTips.toLocaleString(), color: '#E8420A' },
              {
                label: 'Total Amount',
                value: `₦${totalAmount.toLocaleString()}`,
                color: '#0D3B2E',
              },
              {
                label: 'Active Tippers',
                value: creators.length.toLocaleString(),
                color: '#F59E0B',
              },
              {
                label: 'Tiers Unlocked',
                value: Object.keys(tierDistribution)
                  .filter((t) => t !== 'none')
                  .length.toString(),
                color: '#3884FF',
              },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #2A1A1A',
                  backgroundColor: 'rgba(26,10,10,0.5)',
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: '#9A8A7A',
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
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}
          >
            <div
              style={{
                borderRadius: 16,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                padding: 20,
              }}
            >
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Tier Distribution</h3>
              {Object.entries(tierDistribution).length === 0 ? (
                <p style={{ color: '#9A8A7A', fontSize: 13 }}>No tier data available</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(tierDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .map(([tier, count]) => {
                      const colors: Record<string, string> = {
                        bronze: '#B87333',
                        silver: '#C0C0C0',
                        gold: '#FFD700',
                        platinum: '#E5E4E2',
                      };
                      return (
                        <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: colors[tier] || '#6B7280',
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: 14,
                              textTransform: 'capitalize',
                              color: '#F5F0EB',
                            }}
                          >
                            {tier === 'none' ? 'No Tier' : tier}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#9A8A7A' }}>
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
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                padding: 20,
              }}
            >
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
                Top Creators by Tips
              </h3>
              {creators.length === 0 ? (
                <p style={{ color: '#9A8A7A', fontSize: 13 }}>No tipping activity yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {creators.slice(0, 10).map((c, i) => (
                    <div
                      key={c.creatorId}
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#9A8A7A', width: 20 }}>
                        #{i + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: '#F5F0EB' }}>
                        {c.creatorName}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#E8420A' }}>
                        ₦{c.totalAmount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: '#9A8A7A' }}>{c.totalTips} tips</span>
                      {c.topTier && (
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#fff',
                            textTransform: 'uppercase',
                            backgroundColor:
                              c.topTier === 'platinum'
                                ? '#E5E4E2'
                                : c.topTier === 'gold'
                                  ? '#FFD700'
                                  : c.topTier === 'silver'
                                    ? '#C0C0C0'
                                    : '#B87333',
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
        </>
      )}
    </div>
  );
}
