import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/base';
import { Icon } from '@/components/Icons';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface AgentRegistry {
  id: string;
  name: string;
  version: string;
  purpose: string;
  category: string;
  status: string;
  riskLevel: string;
  autonomyLevel: string;
  killSwitchActive: boolean;
  healthStatus: string;
  errorRate: number;
  totalExecutions: number;
  dailyBudgetUsd: number;
  monthlyBudgetUsd: number;
  createdAt: string;
  updatedAt: string;
}

interface AgentStats {
  total: number;
  active: number;
  suspended: number;
  retired: number;
  killSwitchActive: number;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const statusColor = (s: string) => {
  switch (s) {
    case 'ACTIVE':
      return 'var(--admin-emerald)';
    case 'SUSPENDED':
      return 'var(--admin-amber)';
    case 'RETIRED':
      return 'var(--admin-grey)';
    default:
      return 'var(--admin-text-muted)';
  }
};

const healthColor = (h: string) => {
  switch (h) {
    case 'HEALTHY':
      return 'var(--admin-emerald)';
    case 'DEGRADED':
      return 'var(--admin-amber)';
    case 'UNHEALTHY':
      return 'var(--admin-red)';
    default:
      return 'var(--admin-text-muted)';
  }
};

const riskColor = (r: string) => {
  switch (r) {
    case 'R0':
      return 'var(--admin-emerald)';
    case 'R1':
      return 'var(--admin-emerald)';
    case 'R2':
      return 'var(--admin-amber)';
    case 'R3':
      return 'var(--admin-orange)';
    case 'R4':
      return 'var(--admin-red)';
    default:
      return 'var(--admin-text-muted)';
  }
};

const categoryIconName = (c: string) => {
  switch (c) {
    case 'CONTROL_PLANE':
      return 'crosshair';
    case 'SHARED_ENTERPRISE':
      return 'briefcase';
    case 'UNIVERSAL':
      return 'globe';
    default:
      return 'bot';
  }
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const agentsQuery = useQuery({
    queryKey: ['admin', 'agents', { search, categoryFilter, statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      return apiFetch<AgentRegistry[]>(`/api/v1/analytics/agents?${params}`);
    },
    refetchInterval: 30000,
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'agents-stats'],
    queryFn: async () => {
      return apiFetch<AgentStats>('/api/v1/analytics/agents/stats/overview');
    },
  });

  const killSwitchMutation = useMutation({
    mutationFn: async ({ agentId, action }: { agentId: string; action: 'suspend' | 'resume' }) => {
      const endpoint =
        action === 'suspend'
          ? `/api/v1/analytics/agents/${agentId}/kill-switch`
          : `/api/v1/analytics/agents/${agentId}/resume`;
      return apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason: `Admin ${action}` }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents-stats'] });
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/api/v1/analytics/agents/seed', {
        method: 'POST',
        body: JSON.stringify({ force: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents-stats'] });
    },
  });

  // Array/object guards: envelope drift from the analytics service renders
  // empty/zero state instead of crashing on .filter/.map below.
  const agents = Array.isArray(agentsQuery.data?.data) ? agentsQuery.data!.data : [];
  const stats = (statsQuery.data?.data ?? {}) as Partial<AgentStats>;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 32,
        }}
      >
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
            <Icon name="bot" size={32} color="var(--admin-orange)" />
            <span>Agent Registry</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            Manage registered agents, kill switches, health status, and cost budgets
          </p>
        </div>
        <button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: 'var(--admin-blue)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: seedMutation.isPending ? 0.6 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="sprout" size={16} />
          <span>{seedMutation.isPending ? 'Seeding…' : 'Seed AOS-MA-001 Agents'}</span>
        </button>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          {
            label: 'Total Agents',
            value: stats.total ?? agents.length,
            color: 'var(--admin-orange)',
          },
          {
            label: 'Active',
            value:
              stats.active ?? agents.filter((a: AgentRegistry) => a.status === 'ACTIVE').length,
            color: 'var(--admin-emerald)',
          },
          {
            label: 'Suspended',
            value:
              stats.suspended ??
              agents.filter((a: AgentRegistry) => a.status === 'SUSPENDED').length,
            color: 'var(--admin-amber)',
          },
          {
            label: 'Retired',
            value:
              stats.retired ?? agents.filter((a: AgentRegistry) => a.status === 'RETIRED').length,
            color: 'var(--admin-grey)',
          },
          {
            label: 'Kill Switches',
            value:
              stats.killSwitchActive ??
              agents.filter((a: AgentRegistry) => a.killSwitchActive).length,
            color: 'var(--admin-red)',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: 20,
              borderRadius: 16,
              border: '1px solid var(--admin-surface)',
              backgroundColor: 'var(--admin-surface)',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search agents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-bg)',
            color: 'var(--admin-text)',
            fontSize: 14,
            width: 260,
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-bg)',
            color: 'var(--admin-text)',
            fontSize: 14,
          }}
        >
          <option value="">All Categories</option>
          <option value="CONTROL_PLANE">Control Plane</option>
          <option value="SHARED_ENTERPRISE">Shared Enterprise</option>
          <option value="UNIVERSAL">Universal</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-bg)',
            color: 'var(--admin-text)',
            fontSize: 14,
          }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {/* Agent Table */}
      {agentsQuery.isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading agents…
        </p>
      ) : agents.length === 0 ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            border: '1px solid var(--admin-surface)',
            borderRadius: 16,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Icon name="bot" size={48} color="var(--admin-text-muted)" />
          </div>
          <p style={{ fontSize: 16, color: 'var(--admin-text-muted)' }}>
            No agents registered. Seed the AOS-MA-001 agents to get started.
          </p>
        </div>
      ) : (
        <div
          style={{ borderRadius: 16, border: '1px solid var(--admin-surface)', overflow: 'hidden' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(232,66,10,0.08)' }}>
                <th style={thStyle}>Agent</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Risk / Autonomy</th>
                <th style={thStyle}>Health</th>
                <th style={thStyle}>Executions</th>
                <th style={thStyle}>Budgets</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent: AgentRegistry) => (
                <tr key={agent.id} style={{ borderBottom: '1px solid var(--admin-surface)' }}>
                  <td style={tdStyle}>
                    <div>
                      <p
                        style={{
                          fontWeight: 600,
                          color: 'var(--admin-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Icon
                          name={categoryIconName(agent.category)}
                          size={16}
                          color="var(--admin-orange)"
                        />
                        <span>{agent.name}</span>
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                        {agent.purpose}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                        v{agent.version} · {agent.id}
                      </p>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      {agent.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        color: statusColor(agent.status),
                        backgroundColor: `${statusColor(agent.status)}20`,
                      }}
                    >
                      {agent.status}
                    </span>
                    {agent.killSwitchActive && (
                      <span
                        style={{
                          marginLeft: 6,
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--admin-red)',
                          backgroundColor: 'rgba(239,68,68,0.15)',
                        }}
                      >
                        KILL
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{ color: riskColor(agent.riskLevel), fontWeight: 600, fontSize: 13 }}
                    >
                      {agent.riskLevel}
                    </span>
                    <span style={{ color: 'var(--admin-text-muted)', margin: '0 4px' }}>/</span>
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                      {agent.autonomyLevel}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        color: healthColor(agent.healthStatus),
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {agent.healthStatus}
                    </span>
                    {agent.errorRate > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          color: agent.errorRate > 20 ? 'var(--admin-red)' : 'var(--admin-amber)',
                          marginLeft: 6,
                        }}
                      >
                        {agent.errorRate.toFixed(1)}% err
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: 'var(--admin-text)' }}>
                      {agent.totalExecutions.toLocaleString()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      ${agent.dailyBudgetUsd}/day · ${agent.monthlyBudgetUsd}/mo
                    </p>
                  </td>
                  <td style={tdStyle}>
                    {agent.status === 'ACTIVE' && (
                      <button
                        onClick={() =>
                          killSwitchMutation.mutate({ agentId: agent.id, action: 'suspend' })
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--admin-red)',
                          backgroundColor: 'transparent',
                          color: 'var(--admin-red)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Kill Switch
                      </button>
                    )}
                    {agent.status === 'SUSPENDED' && (
                      <button
                        onClick={() =>
                          killSwitchMutation.mutate({ agentId: agent.id, action: 'resume' })
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--admin-emerald)',
                          backgroundColor: 'transparent',
                          color: 'var(--admin-emerald)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Resume
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontWeight: 600,
  fontSize: 12,
  color: 'var(--admin-text-muted)',
  borderBottom: '1px solid var(--admin-surface)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
};
