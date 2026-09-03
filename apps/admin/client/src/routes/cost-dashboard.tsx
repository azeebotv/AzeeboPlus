import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/base';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface CostSummary {
  totalEvents: number;
  totalCostUsd: number;
  byModel: Record<
    string,
    { events: number; costUsd: number; inputTokens: number; outputTokens: number }
  >;
  byAgent: Record<string, { events: number; costUsd: number }>;
  byDomain: Record<string, { events: number; costUsd: number }>;
}

interface CostEvent {
  id: string;
  model: string;
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  domain: string;
  createdAt: string;
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function CostDashboardPage() {
  const summaryQuery = useQuery<{ data: CostSummary }>({
    queryKey: ['admin', 'cost-summary'],
    queryFn: async () => {
      const res = await apiFetch<CostSummary>('/api/v1/analytics/cost/summary');
      return res as ApiResponse<CostData>;
    },
    refetchInterval: 30000,
  });

  const eventsQuery = useQuery<{ data: CostEvent[] }>({
    queryKey: ['admin', 'cost-events'],
    queryFn: async () => {
      const res = await apiFetch<CostEvent[]>('/api/v1/analytics/cost/events?limit=50');
      return res as ApiResponse<CostData>;
    },
  });

  const summary = (summaryQuery.data as ApiResponse<CostSummary>)?.data ?? {
    totalEvents: 0,
    totalCostUsd: 0,
    byModel: {},
    byAgent: {},
    byDomain: {},
  };
  const events = (eventsQuery.data as ApiResponse<CostEvent[]>)?.data ?? [];

  const topModels = Object.entries(summary.byModel)
    .sort(([, a], [, b]) => (b as CostEvent).costUsd - (a as CostEvent).costUsd)
    .slice(0, 10);

  const topAgents = Object.entries(summary.byAgent)
    .sort(([, a], [, b]) => (b as CostEvent).costUsd - (a as CostEvent).costUsd)
    .slice(0, 10);

  const topDomains = Object.entries(summary.byDomain)
    .sort(([, a], [, b]) => (b as CostEvent).costUsd - (a as CostEvent).costUsd)
    .slice(0, 10);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>💰 Model Cost Dashboard</h1>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 32 }}>
        Per-request AI cost telemetry, model pricing, and budget tracking
      </p>

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Total AI Requests"
          value={summary.totalEvents.toLocaleString()}
          color="#E8420A"
        />
        <StatCard
          label="Total Cost (USD)"
          value={`$${summary.totalCostUsd.toFixed(2)}`}
          color="#10B981"
        />
        <StatCard
          label="Models Used"
          value={String(Object.keys(summary.byModel).length)}
          color="#3B82F6"
        />
        <StatCard
          label="Domains"
          value={String(Object.keys(summary.byDomain).length)}
          color="#8B5CF6"
        />
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 32 }}
      >
        {/* Cost by Model */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'rgba(26,10,10,0.5)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
            Cost by Model
          </h2>
          {topModels.length === 0 ? (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>No cost data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topModels.map(([model, data]) => {
                const d = data as CostEvent;
                const pct = summary.totalCostUsd > 0 ? (d.costUsd / summary.totalCostUsd) * 100 : 0;
                return (
                  <div key={model}>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--admin-text)', fontWeight: 500 }}>
                        {model}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--admin-emerald)' }}>
                        ${d.costUsd.toFixed(4)}
                      </span>
                    </div>
                    <div style={{ height: 4, backgroundColor: 'var(--admin-surface)', borderRadius: 2 }}>
                      <div
                        style={{
                          height: 4,
                          width: `${pct}%`,
                          backgroundColor: 'var(--admin-emerald)',
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{d.events} reqs</span>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                        {((d.inputTokens + d.outputTokens) / 1000).toFixed(1)}K tokens
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cost by Agent */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'rgba(26,10,10,0.5)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
            Cost by Agent
          </h2>
          {topAgents.length === 0 ? (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>No agent data yet</p>
          ) : (
            topAgents.map(([agentId, data]: [string, any]) => (
              <div
                key={agentId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--admin-surface)',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--admin-text)' }}>{agentId}</span>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, color: 'var(--admin-emerald)', fontWeight: 600 }}>
                    ${data.costUsd.toFixed(4)}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{data.events} reqs</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cost by Domain */}
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'rgba(26,10,10,0.5)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
            Cost by Domain
          </h2>
          {topDomains.length === 0 ? (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>No domain data yet</p>
          ) : (
            topDomains.map(([domain, data]: [string, any]) => (
              <div
                key={domain}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--admin-surface)',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--admin-text)' }}>{domain}</span>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, color: 'var(--admin-emerald)', fontWeight: 600 }}>
                    ${data.costUsd.toFixed(4)}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{data.events} reqs</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Cost Events */}
      <div
        style={{
          padding: 24,
          borderRadius: 16,
          border: '1px solid var(--admin-surface)',
          backgroundColor: 'rgba(26,10,10,0.5)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
          Recent AI Requests
        </h2>
        {events.length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 24 }}>
            No cost events recorded yet. Use @TrackCost() decorator to instrument AI calls.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Model</th>
                  <th style={thStyle}>Agent</th>
                  <th style={thStyle}>Input</th>
                  <th style={thStyle}>Output</th>
                  <th style={thStyle}>Cost</th>
                  <th style={thStyle}>Latency</th>
                  <th style={thStyle}>Domain</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt: CostEvent) => (
                  <tr key={evt.id} style={{ borderBottom: '1px solid var(--admin-surface)' }}>
                    <td style={tdStyle}>{new Date(evt.createdAt).toLocaleTimeString()}</td>
                    <td style={tdStyle}>
                      <code style={{ color: 'var(--admin-blue)', fontSize: 12 }}>{evt.model}</code>
                    </td>
                    <td style={tdStyle}>{evt.agentId || '—'}</td>
                    <td style={tdStyle}>{(evt.inputTokens / 1000).toFixed(1)}K</td>
                    <td style={tdStyle}>{(evt.outputTokens / 1000).toFixed(1)}K</td>
                    <td style={{ ...tdStyle, color: 'var(--admin-emerald)', fontWeight: 600 }}>
                      ${evt.costUsd.toFixed(6)}
                    </td>
                    <td style={tdStyle}>{evt.latencyMs}ms</td>
                    <td style={tdStyle}>{evt.domain || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid var(--admin-surface)',
        backgroundColor: 'rgba(26,10,10,0.5)',
      }}
    >
      <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontWeight: 600,
  fontSize: 11,
  color: 'var(--admin-text-muted)',
  borderBottom: '1px solid var(--admin-surface)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  color: 'var(--admin-text)',
};
