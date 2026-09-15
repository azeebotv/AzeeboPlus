import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/base';
import { Icon } from '@/components/Icons';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface TaskClassification {
  id: string;
  taskType: string;
  description: string;
  domain: string;
  workClass: string;
  recommendedTier: string;
  estimatedCostUsd: number;
  automationPotential: number;
  eliminationPotential: number;
  processStep: string;
  isAutomationCandidate: boolean;
  isEliminationCandidate: boolean;
}

interface TaskStats {
  total: number;
  byWorkClass: Record<string, number>;
  byDomain: Record<string, number>;
  automationCandidates: number;
  eliminationCandidates: number;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const tierColor = (t: string) => {
  switch (t) {
    case 'X':
      return 'var(--admin-red)';
    case 'S':
      return 'var(--admin-emerald)';
    case 'A2':
      return 'var(--admin-blue)';
    case 'A1':
      return 'var(--admin-purple)';
    case 'H1':
      return 'var(--admin-amber)';
    case 'H0':
      return 'var(--admin-orange)';
    default:
      return 'var(--admin-text-muted)';
  }
};

const workClassLabel = (w: string) => {
  switch (w) {
    case 'X':
      return 'Eliminate (X)';
    case 'S':
      return 'Deterministic (S)';
    case 'A2':
      return 'Low-Cost AI (A2)';
    case 'A1':
      return 'Specialist AI (A1)';
    case 'H1':
      return 'Human + Agent (H1)';
    case 'H0':
      return 'Human Only (H0)';
    default:
      return w;
  }
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function TaskRouterPage() {
  const queryClient = useQueryClient();
  const [domainFilter, setDomainFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const tasksQuery = useQuery({
    queryKey: ['admin', 'tasks', { domainFilter, classFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (domainFilter) params.set('domain', domainFilter);
      if (classFilter) params.set('workClass', classFilter);
      return apiFetch<TaskClassification[]>(
        `/api/v1/analytics/tasks/classifications?${params}`
      );
    },
    refetchInterval: 30000,
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'tasks-stats'],
    queryFn: async () => {
      return apiFetch<TaskStats>('/api/v1/analytics/tasks/classifications/stats');
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/api/v1/analytics/tasks/seed', {
        method: 'POST',
        body: JSON.stringify({ force: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks-stats'] });
    },
  });

  const tasks = tasksQuery.data?.data ?? [];
  const stats = statsQuery.data?.data ?? ({} as TaskStats);

  const domains = [...new Set(tasks.map((t: TaskClassification) => t.domain))].sort();
  const workClasses = ['X', 'S', 'A2', 'A1', 'H1', 'H0'];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="clipboardList" size={28} color="var(--admin-orange)" />
            <span>Task Router</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            H0-H1-A1-A2-S-X work classification, cost optimization, and process mining
          </p>
        </div>
        <button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: 'var(--admin-blue)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: seedMutation.isPending ? 0.6 : 1,
          }}
        >
          <Icon name="sprout" size={16} />
          <span>{seedMutation.isPending ? 'Seeding…' : 'Seed Task Classifications'}</span>
        </button>
      </div>

      {/* Tier Legend */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {[
          {
            tier: 'H0',
            label: 'Human Judgement',
            desc: 'Authority, ambiguity, ethics',
            cost: '$$$$$',
          },
          { tier: 'H1', label: 'Human + Agent', desc: 'Human owns; agent prepares', cost: '$$$$' },
          { tier: 'A1', label: 'Specialist AI', desc: 'Complex reasoning', cost: '$$$' },
          { tier: 'A2', label: 'Low-Cost AI', desc: 'Classification, drafting', cost: '$$' },
          { tier: 'S', label: 'Deterministic', desc: 'Rules-based, no reasoning', cost: '$' },
          { tier: 'X', label: 'Eliminate', desc: 'No enterprise value', cost: '—' },
        ].map(({ tier, label, desc, cost }) => (
          <div
            key={tier}
            style={{
              padding: 16,
              borderRadius: 12,
              border: `1px solid ${tierColor(tier)}30`,
              backgroundColor: `${tierColor(tier)}08`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: tierColor(tier) }}>{tier}</span>
              <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{cost}</span>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', marginBottom: 2 }}>
              {label}
            </p>
            <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>Total Classifications</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-orange)' }}>
            {stats.total ?? tasks.length}
          </p>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>Automation Candidates</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-blue)' }}>
            {stats.automationCandidates ?? 0}
          </p>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>Elimination Candidates</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-red)' }}>
            {stats.eliminationCandidates ?? 0}
          </p>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>Work Classes</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-purple)' }}>
            {Object.keys(stats.byWorkClass ?? {}).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-card)',
            color: 'var(--admin-text)',
            fontSize: 14,
          }}
        >
          <option value="">All Domains</option>
          {domains.map((d: string) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-card)',
            color: 'var(--admin-text)',
            fontSize: 14,
          }}
        >
          <option value="">All Work Classes</option>
          {workClasses.map((c: string) => (
            <option key={c} value={c}>
              {workClassLabel(c)}
            </option>
          ))}
        </select>
      </div>

      {/* Task Table */}
      {tasksQuery.isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : tasks.length === 0 ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            border: '1px solid var(--admin-surface)',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Icon name="clipboardList" size={48} color="var(--admin-text-muted)" />
          <p style={{ fontSize: 16, color: 'var(--admin-text-muted)', margin: 0 }}>
            No task classifications yet. Seed the AOS-MA-001 task types to get started.
          </p>
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: '1px solid var(--admin-surface)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(232,66,10,0.08)' }}>
                <th style={thStyle}>Task Type</th>
                <th style={thStyle}>Domain</th>
                <th style={thStyle}>Work Class</th>
                <th style={thStyle}>Recommended Tier</th>
                <th style={thStyle}>Est. Cost</th>
                <th style={thStyle}>Automation %</th>
                <th style={thStyle}>Elimination %</th>
                <th style={thStyle}>Flags</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: TaskClassification) => (
                <tr key={task.id} style={{ borderBottom: '1px solid var(--admin-surface)' }}>
                  <td style={tdStyle}>
                    <p style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{task.taskType}</p>
                    <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                      {task.description}
                    </p>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        backgroundColor: 'rgba(139,92,246,0.15)',
                        color: 'var(--admin-purple)',
                      }}
                    >
                      {task.domain}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: tierColor(task.workClass) }}>
                      {task.workClass}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: tierColor(task.recommendedTier),
                        backgroundColor: `${tierColor(task.recommendedTier)}15`,
                      }}
                    >
                      {task.recommendedTier}
                    </span>
                  </td>
                  <td style={tdStyle}>${task.estimatedCostUsd.toFixed(4)}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 40,
                          height: 4,
                          backgroundColor: 'var(--admin-surface)',
                          borderRadius: 2,
                        }}
                      >
                        <div
                          style={{
                            width: `${task.automationPotential}%`,
                            height: 4,
                            backgroundColor: 'var(--admin-blue)',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                        {task.automationPotential}%
                      </span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 40,
                          height: 4,
                          backgroundColor: 'var(--admin-surface)',
                          borderRadius: 2,
                        }}
                      >
                        <div
                          style={{
                            width: `${task.eliminationPotential}%`,
                            height: 4,
                            backgroundColor: 'var(--admin-red)',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                        {task.eliminationPotential}%
                      </span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    {task.isAutomationCandidate && (
                      <span
                        style={{
                          marginRight: 4,
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          backgroundColor: 'rgba(59,130,246,0.15)',
                          color: 'var(--admin-blue)',
                        }}
                      >
                        AUTO
                      </span>
                    )}
                    {task.isEliminationCandidate && (
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          backgroundColor: 'rgba(239,68,68,0.15)',
                          color: 'var(--admin-red)',
                        }}
                      >
                        KILL
                      </span>
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
  padding: '12px 14px',
  fontWeight: 600,
  fontSize: 11,
  color: 'var(--admin-text-muted)',
  borderBottom: '1px solid var(--admin-surface)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
};
