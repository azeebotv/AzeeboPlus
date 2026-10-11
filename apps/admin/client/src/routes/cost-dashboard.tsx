import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/base';
import { isRecord, requireData, num } from '@/lib/payload';
import { Icon } from '@/components/Icons';
import { pollingIntervals } from '@azeebo/design-tokens';

/**
 * Cost summary — matched to the model-cost-tracker service contract:
 * getCostSummary returns { totalRequests, totalTokens, totalCostUsd, avgLatencyMs,
 * byModel/byAgent/byDomain/byTier: Record<key, { requests, tokens, cost }> }.
 * (An earlier revision read totalEvents/costUsd/events — fields the backend
 * never sent — so every card silently rendered 0.)
 */
interface CostSummary {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  byModel: Record<string, { requests: number; tokens: number; cost: number }>;
  byAgent: Record<string, { requests: number; tokens: number; cost: number }>;
  byDomain: Record<string, { requests: number; tokens: number; cost: number }>;
}

/** Event row — costUsd is a Prisma Decimal and serializes as a STRING. */
interface CostEvent {
  id: string;
  model: string;
  agentId: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: string;
  latencyMs: number | null;
  domain: string | null;
  recordedAt: string;
}

/** Coerce one summary bucket: numbers may arrive as Decimal strings. */
function asBucket(value: unknown): { requests: number; tokens: number; cost: number } {
  const rec = isRecord(value) ? value : {};
  return {
    requests: num(rec.requests),
    tokens: num(rec.tokens),
    cost: num(rec.cost),
  };
}

/** Coerce the full summary payload into the typed shape, field by field. */
function asSummary(value: unknown): CostSummary {
  const rec = isRecord(value) ? value : {};
  const toBuckets = (
    raw: unknown
  ): Record<string, { requests: number; tokens: number; cost: number }> => {
    if (!isRecord(raw)) return {};
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, asBucket(v)]));
  };
  return {
    totalRequests: num(rec.totalRequests),
    totalTokens: num(rec.totalTokens),
    totalCostUsd: num(rec.totalCostUsd),
    avgLatencyMs: num(rec.avgLatencyMs),
    byModel: toBuckets(rec.byModel),
    byAgent: toBuckets(rec.byAgent),
    byDomain: toBuckets(rec.byDomain),
  };
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  color: 'var(--admin-text-muted)',
};
const tdStyle: React.CSSProperties = { padding: '10px 14px', fontSize: 13 };

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function CostDashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ['admin', 'cost-summary'],
    queryFn: async () => {
      const res = await apiFetch<CostSummary>('/api/v1/analytics/cost/summary');
      return res.success ? asSummary(res.data) : null;
    },
    refetchInterval: pollingIntervals.dashboard,
  });

  const eventsQuery = useQuery({
    queryKey: ['admin', 'cost-events'],
    queryFn: async () => {
      const res = await apiFetch<CostEvent[]>('/api/v1/analytics/cost/events?limit=50');
      const rows = requireData(res, []);
      return (Array.isArray(rows) ? rows : []).map((e) => {
        const rec: Record<string, unknown> = isRecord(e) ? e : {};
        return {
          id: String(rec.id ?? ''),
          model: String(rec.model ?? '(unknown)'),
          agentId: rec.agentId == null ? null : String(rec.agentId),
          inputTokens: num(rec.inputTokens),
          outputTokens: num(rec.outputTokens),
          costUsd: String(rec.costUsd ?? '0'),
          latencyMs: rec.latencyMs == null ? null : num(rec.latencyMs),
          domain: rec.domain == null ? null : String(rec.domain),
          recordedAt: String(rec.recordedAt ?? ''),
        } satisfies CostEvent;
      });
    },
  });

  const summary = summaryQuery.data ?? {
    totalRequests: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    avgLatencyMs: 0,
    byModel: {},
    byAgent: {},
    byDomain: {},
  };
  const events = eventsQuery.data ?? [];

  const topModels = Object.entries(summary.byModel)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .slice(0, 10);

  const topAgents = Object.entries(summary.byAgent)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .slice(0, 10);

  const topDomains = Object.entries(summary.byDomain)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .slice(0, 10);

  const statCards = [
    {
      label: 'Total Requests',
      value: summary.totalRequests.toLocaleString(),
      color: 'var(--admin-text)',
    },
    {
      label: 'Total Cost (30d)',
      value: `$${summary.totalCostUsd.toFixed(4)}`,
      color: 'var(--admin-emerald)',
    },
    {
      label: 'Total Tokens',
      value: summary.totalTokens.toLocaleString(),
      color: 'var(--admin-orange)',
    },
    {
      label: 'Avg Latency',
      value: `${Math.round(summary.avgLatencyMs)}ms`,
      color: 'var(--admin-blue)',
    },
  ];

  /** Shared ranked-leaderboard renderer for byModel/byAgent/byDomain. */
  const renderLeaderboard = (
    title: string,
    rows: [string, { requests: number; tokens: number; cost: number }][]
  ) => (
    <div
      style={{
        padding: 18,
        borderRadius: 16,
        border: '1px solid var(--admin-card)',
        backgroundColor: 'var(--admin-surface)',
        minWidth: 0,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{title}</h3>
      {rows.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
          No cost events recorded yet
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map(([key, d]) => {
            const pct = summary.totalCostUsd > 0 ? (d.cost / summary.totalCostUsd) * 100 : 0;
            return (
              <div key={key} style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <code
                    style={{
                      color: 'var(--admin-blue)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {key}
                  </code>
                  <span style={{ color: 'var(--admin-text-muted)', flexShrink: 0 }}>
                    ${d.cost.toFixed(4)} · {d.requests} reqs
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'var(--admin-card)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      height: '100%',
                      borderRadius: 3,
                      backgroundColor: 'var(--admin-emerald)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Icon name="dollarSign" size={32} color="var(--admin-emerald)" />
        <span>Model Cost Dashboard</span>
      </h1>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 32 }}>
        Per-request AI cost telemetry, model pricing, and budget tracking
      </p>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {statCards.map((c) => (
          <div
            key={c.label}
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
            <p style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Leaderboards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {renderLeaderboard('Top Models', topModels)}
        {renderLeaderboard('Top Agents', topAgents)}
        {renderLeaderboard('Top Domains', topDomains)}
      </div>

      {/* Recent Events */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid var(--admin-card)',
          backgroundColor: 'var(--admin-surface)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--admin-card)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700 }}>Recent Cost Events</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-card)' }}>
                {['Time', 'Model', 'Agent', 'Domain', 'In', 'Out', 'Cost', 'Latency'].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      ...tdStyle,
                      color: 'var(--admin-text-muted)',
                      textAlign: 'center',
                      padding: 32,
                    }}
                  >
                    No cost events recorded yet
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <td style={tdStyle}>
                      {evt.recordedAt ? new Date(evt.recordedAt).toLocaleTimeString() : '—'}
                    </td>
                    <td style={tdStyle}>
                      <code style={{ color: 'var(--admin-blue)', fontSize: 12 }}>{evt.model}</code>
                    </td>
                    <td style={tdStyle}>{evt.agentId || '—'}</td>
                    <td style={tdStyle}>{evt.domain || '—'}</td>
                    <td style={tdStyle}>{(evt.inputTokens / 1000).toFixed(1)}K</td>
                    <td style={tdStyle}>{(evt.outputTokens / 1000).toFixed(1)}K</td>
                    <td style={{ ...tdStyle, color: 'var(--admin-emerald)', fontWeight: 600 }}>
                      ${Number(evt.costUsd).toFixed(6)}
                    </td>
                    <td style={tdStyle}>{evt.latencyMs == null ? '—' : `${evt.latencyMs}ms`}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
