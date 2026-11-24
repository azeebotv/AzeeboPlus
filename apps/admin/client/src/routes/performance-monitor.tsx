import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { GatewayHttpSummary } from '@/lib/api/admin';
import { Icon } from '@/components/Icons';
import { pollingIntervals } from '@azeebo/design-tokens';

const latColor = (ms: number) =>
  ms < 100 ? 'var(--admin-emerald)' : ms < 500 ? 'var(--admin-amber)' : 'var(--admin-red)';

function MetricCard({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
}) {
  return (
    <div
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
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color={color} />
        </div>
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-text)' }}>{value}</span>
        {unit && <span style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>{unit}</span>}
      </div>
    </div>
  );
}

export default function PerformanceMonitorPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(pollingIntervals.dashboard);

  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'gateway-http'],
    queryFn: async () => {
      const res = await adminApi.getGatewayHttp();
      if (!res.success) throw new Error('gateway metrics unavailable');
      return res.data;
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const summary: GatewayHttpSummary | undefined = data;

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
          <strong>Performance metrics unavailable.</strong> {(error as Error)?.message} — the
          gateway scrape failed. No numbers are shown rather than fake ones.
        </div>
      </div>
    );
  }

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
            <Icon name="activity" size={26} color="var(--admin-orange)" />
            Performance Monitor
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
            Real latency through the API gateway, scraped from its Prometheus exposition
            {summary?.available === false ? ' — gateway unreachable' : ''}
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
            Auto-refresh
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
              color: 'var(--admin-text)',
            }}
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
          </select>
          <button
            onClick={() => refetch()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
              color: 'var(--admin-text)',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 60 }}>
          Loading gateway metrics...
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <MetricCard
              label="Total Requests"
              value={summary?.totalRequests?.toLocaleString() ?? '0'}
              icon="activity"
              color="#10B981"
            />
            <MetricCard
              label="Avg Response"
              value={Math.round(summary?.avgMs ?? 0)}
              unit="ms"
              icon="clock"
              color="#3B82F6"
            />
            <MetricCard
              label="P95 / P99"
              value={`${Math.round(summary?.p95Ms ?? 0)} / ${Math.round(summary?.p99Ms ?? 0)}`}
              unit="ms"
              icon="trending"
              color="#8B5CF6"
            />
            <MetricCard
              label="Error Rate"
              value={`${(summary?.errorRate ?? 0).toFixed(2)}%`}
              icon="alertTriangle"
              color="#EF4444"
            />
          </div>

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
                Route Performance
              </h2>
              {summary?.scrapedAt && (
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                  scraped {new Date(summary.scrapedAt).toLocaleTimeString()}
                  {dataUpdatedAt
                    ? ` · fetched ${new Date(dataUpdatedAt).toLocaleTimeString()}`
                    : ''}
                </span>
              )}
            </div>
            {(summary?.routes?.length ?? 0) === 0 ? (
              <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 24 }}>
                No requests recorded since the gateway restarted — traffic will populate this table
                as it flows through the gateway.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-card)' }}>
                      {[
                        'Route',
                        'Method',
                        'Requests',
                        'Avg (ms)',
                        'P95 (ms)',
                        'P99 (ms)',
                        'Errors',
                      ].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: '12px 16px',
                            textAlign: i === 0 ? 'left' : 'right',
                            color: 'var(--admin-text-muted)',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summary!.routes.map((r) => (
                      <tr
                        key={`${r.method}-${r.route}`}
                        style={{ borderBottom: '1px solid var(--admin-card)' }}
                      >
                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--admin-text)',
                            fontFamily: 'monospace',
                            fontSize: 13,
                          }}
                        >
                          {r.route}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: 'rgba(59,130,246,0.12)',
                              color: 'var(--admin-blue)',
                            }}
                          >
                            {r.method}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            color: 'var(--admin-text)',
                          }}
                        >
                          {r.requestCount.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            color: latColor(r.avgMs),
                          }}
                        >
                          {Math.round(r.avgMs)}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            color: latColor(r.p95Ms),
                          }}
                        >
                          {Math.round(r.p95Ms)}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            color: latColor(r.p99Ms),
                          }}
                        >
                          {Math.round(r.p99Ms)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span
                            style={{
                              color:
                                r.errorRate < 1
                                  ? 'var(--admin-emerald)'
                                  : r.errorRate < 5
                                    ? 'var(--admin-amber)'
                                    : 'var(--admin-red)',
                            }}
                          >
                            {r.errorRate.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
