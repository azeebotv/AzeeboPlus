import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { Icon } from '@/components/Icons';
import { pollingIntervals } from '@azeebo/design-tokens';

/** Usage-bar color: calm until near the ceiling. */
const usageColor = (pct: number) =>
  pct < 60 ? 'var(--admin-emerald)' : pct < 90 ? 'var(--admin-amber)' : 'var(--admin-red)';

export default function RateLimitsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'gateway-rate-limits'],
    queryFn: async () => {
      const res = await adminApi.getGatewayRateLimits();
      if (!res.success) throw new Error('gateway rate-limit metrics unavailable');
      return res.data;
    },
    refetchInterval: autoRefresh ? pollingIntervals.dashboard : false,
  });

  if (isError) {
    return (
      <div style={{ padding: 24 }}>
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            background: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
          }}
        >
          <strong>Rate-limit data unavailable.</strong> {(error as Error)?.message} — the gateway
          scrape failed. No numbers are shown rather than fake ones.
        </div>
      </div>
    );
  }

  const entries = data?.entries ?? [];
  const blocked = data?.blockedByEndpoint ?? [];
  const blockedTotal = data?.blockedTotal ?? 0;
  const nearLimit = entries.filter((e) => e.usagePercent >= 60).length;

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--admin-text)',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Icon name="shield" size={26} color="var(--admin-orange)" />
            Rate Limits
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
            Auth rate limits as enforced by the gateway (10/60s per IP and per account; 3/60s in
            strict mode){data?.available === false ? ' — gateway unreachable' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--admin-text-muted)',
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={() => refetch()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
              color: 'var(--admin-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="refresh" size={16} color="currentColor" />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 60 }}>
          Loading gateway rate-limit state...
        </p>
      ) : (
        <>
          {/* Summary strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: 'Tracked identifiers',
                value: entries.length,
                icon: 'users',
                color: '#3B82F6',
              },
              {
                label: 'Near limit (≥60%)',
                value: nearLimit,
                icon: 'alertTriangle',
                color: nearLimit > 0 ? '#F59E0B' : '#10B981',
              },
              {
                label: 'Blocked (since restart)',
                value: blockedTotal.toLocaleString(),
                icon: 'x',
                color: blockedTotal > 0 ? '#EF4444' : '#10B981',
              },
              {
                label: 'Enforced endpoints',
                value: new Set([
                  ...entries.map((e) => e.endpoint),
                  ...blocked.map((b) => b.endpoint),
                ]).size,
                icon: 'shield',
                color: '#8B5CF6',
              },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: `${c.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={c.icon} size={20} color={c.color} />
                  </div>
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>{c.label}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-text)' }}>
                  {c.value}
                </div>
              </div>
            ))}
          </div>

          {/* Active windows */}
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--admin-text)' }}>
                Active rate-limit windows
              </h2>
              {data?.scrapedAt && (
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                  scraped {new Date(data.scrapedAt).toLocaleTimeString()}
                  {dataUpdatedAt
                    ? ` · fetched ${new Date(dataUpdatedAt).toLocaleTimeString()}`
                    : ''}
                </span>
              )}
            </div>
            {entries.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 24 }}>
                No auth traffic since the gateway restarted — windows appear here the moment auth
                endpoints are exercised.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {entries.map((e) => (
                  <div
                    key={`${e.identifierType}-${e.identifier}-${e.endpoint}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr) 180px 70px',
                      alignItems: 'center',
                      gap: 14,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--admin-card)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--admin-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {e.identifier}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                        {e.identifierType}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: 'var(--admin-text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.endpoint}
                    </div>
                    <div>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'var(--admin-surface)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, e.usagePercent)}%`,
                            height: '100%',
                            borderRadius: 3,
                            backgroundColor: usageColor(e.usagePercent),
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 3 }}>
                        {e.limit - e.remaining}/{e.limit} used in window
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        fontSize: 13,
                        color: usageColor(e.usagePercent),
                      }}
                    >
                      {e.usagePercent}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blocked history */}
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--admin-text)',
                marginBottom: 16,
              }}
            >
              Blocked requests by endpoint
            </h2>
            {blocked.length === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 24 }}>
                No requests have been blocked — throttles have not tripped since the gateway
                restarted.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {blocked.map((b) => (
                  <div
                    key={b.endpoint}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        color: 'var(--admin-text)',
                      }}
                    >
                      {b.endpoint}
                    </span>
                    <span style={{ color: 'var(--admin-red)', fontWeight: 600, fontSize: 13 }}>
                      {b.blocked.toLocaleString()} blocked
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
