import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/base';
import { useAuth } from '@/context/auth-context';
import { Icon } from '@/components/Icons';
import { pollingIntervals } from '@azeebo/design-tokens';

/* ── Types (mirror of the analytics-service agent-registry contract) ───────── */

interface AgentRegistry {
  id: string;
  agentId: string; // business key, e.g. CP-01
  name: string;
  version: string;
  purpose: string;
  description?: string | null;
  humanOwner: string;
  category: string; // control-plane | shared-enterprise | domain-skill-pack
  status: string; // active | suspended | retired | degraded
  executionTier: string; // T0-T4
  riskLevel: string; // R0-R4
  autonomyLevel: string; // A0-A5
  killSwitchLevel: string; // K0-K4
  allowedTools?: string[];
  deniedActions?: string[];
  approvalActions?: string[];
  dataClasses?: string[];
  costBudgetDaily?: number | null;
  costBudgetMonthly?: number | null;
  modelTierDefault?: string | null;
  killSwitchActive?: boolean;
  totalExecutions?: number;
  errorRate?: number;
  healthStatus?: string;
}

interface AgentStats {
  total: number;
  active: number;
  suspended: number;
  retired: number;
  killSwitchActive: number;
}

interface KillSwitchEvent {
  id: string;
  action: string;
  reason: string;
  triggeredBy: string;
  createdAt: string;
  evidence?: string | null;
}

/* ── Backend enum values (the actual IsIn lists) ───────────────────────────── */

const CATEGORIES = ['control-plane', 'shared-enterprise', 'domain-skill-pack'] as const;
const STATUSES = ['active', 'suspended', 'retired', 'degraded'] as const;
const EXECUTION_TIERS = ['T0', 'T1', 'T2', 'T3', 'T4'] as const;
const RISK_LEVELS = ['R0', 'R1', 'R2', 'R3', 'R4'] as const;
const AUTONOMY_LEVELS = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'] as const;
const KILL_SWITCH_LEVELS = ['K0', 'K1', 'K2', 'K3', 'K4'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  'control-plane': 'Control Plane',
  'shared-enterprise': 'Shared Enterprise',
  'domain-skill-pack': 'Domain Skill Pack',
};

/* ── Form state for register/edit ──────────────────────────────────────────── */

interface AgentForm {
  agentId: string;
  name: string;
  version: string;
  purpose: string;
  description: string;
  humanOwner: string;
  category: string;
  executionTier: string;
  riskLevel: string;
  autonomyLevel: string;
  killSwitchLevel: string;
  allowedTools: string; // comma-separated
  deniedActions: string;
  approvalActions: string;
  dataClasses: string;
  costBudgetDaily: string;
  costBudgetMonthly: string;
  modelTierDefault: string;
}

const EMPTY_FORM: AgentForm = {
  agentId: '',
  name: '',
  version: '1.0.0',
  purpose: '',
  description: '',
  humanOwner: '',
  category: 'control-plane',
  executionTier: 'T2',
  riskLevel: 'R1',
  autonomyLevel: 'A1',
  killSwitchLevel: 'K0',
  allowedTools: '',
  deniedActions: '',
  approvalActions: '',
  dataClasses: '',
  costBudgetDaily: '',
  costBudgetMonthly: '',
  modelTierDefault: '',
};

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const statusColor = (s: string) => {
  switch (s) {
    case 'active':
      return 'var(--admin-emerald)';
    case 'suspended':
      return 'var(--admin-amber)';
    case 'retired':
      return 'var(--admin-grey)';
    default:
      return 'var(--admin-text-muted)';
  }
};

const healthColor = (h: string) => {
  switch (h) {
    case 'healthy':
      return 'var(--admin-emerald)';
    case 'degraded':
      return 'var(--admin-amber)';
    case 'unhealthy':
      return 'var(--admin-red)';
    default:
      return 'var(--admin-text-muted)';
  }
};

const riskColor = (r: string) => {
  switch (r) {
    case 'R0':
    case 'R1':
      return 'var(--admin-emerald)';
    case 'R2':
      return 'var(--admin-amber)';
    default:
      return 'var(--admin-red)';
  }
};

const categoryIconName = (c: string) => {
  switch (c) {
    case 'control-plane':
      return 'cpu';
    case 'shared-enterprise':
      return 'network';
    default:
      return 'bot';
  }
};

const splitList = (v: string): string[] =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const joinList = (v?: string[] | null): string => (v ?? []).join(', ');

const numOrNull = (v: string): number | null => {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/* ── Shared style constants ────────────────────────────────────────────────── */

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--admin-border, var(--admin-surface))',
  backgroundColor: 'var(--admin-bg)',
  color: 'var(--admin-text)',
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--admin-text-muted)',
  marginBottom: 6,
};

const btnStyle = (variant: 'primary' | 'ghost' | 'danger'): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  border: variant === 'ghost' || variant === 'danger' ? '1px solid' : 'none',
  borderColor:
    variant === 'danger' ? 'var(--admin-red)' : 'var(--admin-border, var(--admin-surface))',
  color:
    variant === 'primary'
      ? 'white'
      : variant === 'danger'
        ? 'var(--admin-red)'
        : 'var(--admin-text)',
  backgroundColor: variant === 'primary' ? 'var(--admin-blue)' : 'transparent',
});

const fieldGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
};

/* ── Modal shell ───────────────────────────────────────────────────────────── */

function Modal({
  title,
  onClose,
  children,
  width = 640,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--admin-bg)',
          border: '1px solid var(--admin-border, var(--admin-surface))',
          borderRadius: 16,
          width: '100%',
          maxWidth: width,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text)' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--admin-text-muted)',
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Register / Edit form ──────────────────────────────────────────────────── */

function AgentFormModal({
  existing,
  onClose,
  onSubmit,
  pending,
  serverError,
}: {
  existing?: AgentRegistry | null;
  onClose: () => void;
  onSubmit: (form: AgentForm) => void;
  pending: boolean;
  serverError?: string | null;
}) {
  const [form, setForm] = useState<AgentForm>(() =>
    existing
      ? {
          agentId: existing.agentId,
          name: existing.name,
          version: existing.version,
          purpose: existing.purpose,
          description: existing.description ?? '',
          humanOwner: existing.humanOwner,
          category: existing.category,
          executionTier: existing.executionTier,
          riskLevel: existing.riskLevel,
          autonomyLevel: existing.autonomyLevel,
          killSwitchLevel: existing.killSwitchLevel,
          allowedTools: joinList(existing.allowedTools),
          deniedActions: joinList(existing.deniedActions),
          approvalActions: joinList(existing.approvalActions),
          dataClasses: joinList(existing.dataClasses),
          costBudgetDaily: existing.costBudgetDaily != null ? String(existing.costBudgetDaily) : '',
          costBudgetMonthly:
            existing.costBudgetMonthly != null ? String(existing.costBudgetMonthly) : '',
          modelTierDefault: existing.modelTierDefault ?? '',
        }
      : EMPTY_FORM
  );
  const set =
    (k: keyof AgentForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid =
    form.agentId.trim() !== '' &&
    form.name.trim() !== '' &&
    form.purpose.trim() !== '' &&
    form.humanOwner.trim() !== '';

  return (
    <Modal
      title={existing ? `Edit agent ${existing.agentId}` : 'Register agent'}
      onClose={onClose}
      width={720}
    >
      {serverError && (
        <p
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: 'rgba(239,68,68,0.12)',
            color: 'var(--admin-red)',
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {serverError}
        </p>
      )}
      <div style={fieldGrid}>
        <div>
          <label style={labelStyle}>Agent ID * (e.g. CP-01)</label>
          <input
            style={inputStyle}
            value={form.agentId}
            onChange={set('agentId')}
            disabled={!!existing}
          />
        </div>
        <div>
          <label style={labelStyle}>Name *</label>
          <input style={inputStyle} value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label style={labelStyle}>Version</label>
          <input style={inputStyle} value={form.version} onChange={set('version')} />
        </div>
        <div>
          <label style={labelStyle}>Human owner role *</label>
          <input
            style={inputStyle}
            value={form.humanOwner}
            onChange={set('humanOwner')}
            placeholder="COO / PMO"
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Purpose *</label>
          <textarea
            style={{ ...inputStyle, minHeight: 60 }}
            value={form.purpose}
            onChange={set('purpose')}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 60 }}
            value={form.description}
            onChange={set('description')}
          />
        </div>
        <div>
          <label style={labelStyle}>Category *</label>
          <select style={inputStyle} value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] ?? c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Execution tier</label>
          <select style={inputStyle} value={form.executionTier} onChange={set('executionTier')}>
            {EXECUTION_TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Risk level</label>
          <select style={inputStyle} value={form.riskLevel} onChange={set('riskLevel')}>
            {RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Autonomy level</label>
          <select style={inputStyle} value={form.autonomyLevel} onChange={set('autonomyLevel')}>
            {AUTONOMY_LEVELS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Kill-switch level</label>
          <select style={inputStyle} value={form.killSwitchLevel} onChange={set('killSwitchLevel')}>
            {KILL_SWITCH_LEVELS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Daily budget (USD)</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            value={form.costBudgetDaily}
            onChange={set('costBudgetDaily')}
          />
        </div>
        <div>
          <label style={labelStyle}>Monthly budget (USD)</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="0.01"
            value={form.costBudgetMonthly}
            onChange={set('costBudgetMonthly')}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Default model tier</label>
          <input
            style={inputStyle}
            value={form.modelTierDefault}
            onChange={set('modelTierDefault')}
            placeholder="claude-sonnet-4-20250514"
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Allowed tools (comma-separated)</label>
          <input style={inputStyle} value={form.allowedTools} onChange={set('allowedTools')} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Denied actions (comma-separated)</label>
          <input style={inputStyle} value={form.deniedActions} onChange={set('deniedActions')} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Approval actions (comma-separated)</label>
          <input
            style={inputStyle}
            value={form.approvalActions}
            onChange={set('approvalActions')}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Data classes (comma-separated)</label>
          <input style={inputStyle} value={form.dataClasses} onChange={set('dataClasses')} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
        <button style={btnStyle('ghost')} onClick={onClose}>
          Cancel
        </button>
        <button
          style={btnStyle('primary')}
          disabled={!valid || pending}
          onClick={() => onSubmit(form)}
        >
          {pending ? 'Saving…' : existing ? 'Save changes' : 'Register agent'}
        </button>
      </div>
    </Modal>
  );
}

/* ── Detail modal with kill-switch history ─────────────────────────────────── */

function AgentDetailModal({ agent, onClose }: { agent: AgentRegistry; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const historyQuery = useQuery({
    queryKey: ['admin', 'agents', agent.agentId, 'kill-switch-history'],
    queryFn: async () => {
      const res = await apiFetch<KillSwitchEvent[] | { data: KillSwitchEvent[] }>(
        `/api/v1/analytics/agents/${encodeURIComponent(agent.agentId)}/kill-switch-history`
      );
      const payload = (res as { data?: KillSwitchEvent[] }).data ?? res;
      return Array.isArray(payload) ? payload : [];
    },
  });

  // The backend exposes POST :agentId/retire but no UI ever called it.
  const retireMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/api/v1/analytics/agents/${encodeURIComponent(agent.agentId)}/retire`, {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Retired via admin panel detail view',
          triggeredBy: user?.email ?? 'admin-panel',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] });
      onClose();
    },
  });

  return (
    <Modal title={`${agent.agentId} — ${agent.name}`} onClose={onClose} width={760}>
      <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
        {agent.purpose}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          ['Status', agent.status, statusColor(agent.status)],
          ['Health', agent.healthStatus ?? 'unknown', healthColor(agent.healthStatus ?? 'unknown')],
          ['Risk / Autonomy', `${agent.riskLevel} / ${agent.autonomyLevel}`, 'var(--admin-text)'],
          ['Execution tier', agent.executionTier, 'var(--admin-text)'],
          ['Kill-switch level', agent.killSwitchLevel, 'var(--admin-text)'],
          ['Human owner', agent.humanOwner, 'var(--admin-text)'],
          [
            'Budget',
            `${agent.costBudgetDaily ?? '—'} / day · ${agent.costBudgetMonthly ?? '—'} / mo`,
            'var(--admin-text)',
          ],
          ['Model tier', agent.modelTierDefault ?? '—', 'var(--admin-text)'],
          ['Executions', String(agent.totalExecutions ?? 0), 'var(--admin-text)'],
          [
            'Error rate',
            `${(agent.errorRate ?? 0).toFixed(1)}%`,
            (agent.errorRate ?? 0) > 20 ? 'var(--admin-red)' : 'var(--admin-text)',
          ],
        ].map(([label, value, color]) => (
          <div
            key={label}
            style={{
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--admin-border, var(--admin-surface))',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
              {label}
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color }}>{value}</p>
          </div>
        ))}
      </div>
      {(agent.allowedTools?.length ?? 0) > 0 && (
        <p style={{ fontSize: 13, color: 'var(--admin-text)', marginBottom: 8 }}>
          <strong>Allowed tools:</strong> {agent.allowedTools!.join(', ')}
        </p>
      )}
      {(agent.deniedActions?.length ?? 0) > 0 && (
        <p style={{ fontSize: 13, color: 'var(--admin-text)', marginBottom: 8 }}>
          <strong>Denied actions:</strong> {agent.deniedActions!.join(', ')}
        </p>
      )}
      {(agent.approvalActions?.length ?? 0) > 0 && (
        <p style={{ fontSize: 13, color: 'var(--admin-text)', marginBottom: 16 }}>
          <strong>Approval actions:</strong> {agent.approvalActions!.join(', ')}
        </p>
      )}

      {agent.status !== 'retired' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            style={{ ...btnStyle('danger'), opacity: retireMutation.isPending ? 0.6 : 1 }}
            disabled={retireMutation.isPending}
            onClick={() => {
              if (window.confirm(`Retire agent ${agent.agentId}? This is recorded for audit.`)) {
                retireMutation.mutate();
              }
            }}
          >
            {retireMutation.isPending ? 'Retiring…' : 'Retire agent'}
          </button>
        </div>
      )}

      <h3
        style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text)', margin: '18px 0 10px' }}
      >
        Kill-switch history
      </h3>
      {historyQuery.isLoading ? (
        <p style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>Loading history…</p>
      ) : (historyQuery.data?.length ?? 0) === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
          No kill-switch events recorded.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {historyQuery.data!.map((ev) => (
            <div
              key={ev.id}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-border, var(--admin-surface))',
                fontSize: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: ev.action === 'activate' ? 'var(--admin-red)' : 'var(--admin-emerald)',
                  }}
                >
                  {ev.action}
                </span>
                <span style={{ color: 'var(--admin-text-muted)' }}>
                  {new Date(ev.createdAt).toLocaleString()}
                </span>
              </div>
              <p style={{ color: 'var(--admin-text)' }}>{ev.reason}</p>
              <p style={{ color: 'var(--admin-text-muted)', marginTop: 2 }}>by {ev.triggeredBy}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgentRegistry | null>(null);
  const [detail, setDetail] = useState<AgentRegistry | null>(null);
  const [killReason, setKillReason] = useState('');
  const [killTarget, setKillTarget] = useState<AgentRegistry | null>(null);

  const agentsQuery = useQuery({
    queryKey: ['admin', 'agents', { search, categoryFilter, statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      return apiFetch<AgentRegistry[]>(`/api/v1/analytics/agents?${params}`);
    },
    refetchInterval: pollingIntervals.dashboard,
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'agents-stats'],
    queryFn: () => apiFetch<AgentStats>('/api/v1/analytics/agents/stats/overview'),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'agents-stats'] });
  };

  const upsertMutation = useMutation({
    mutationFn: async ({ form, existing }: { form: AgentForm; existing: AgentRegistry | null }) => {
      const base = {
        name: form.name.trim(),
        version: form.version.trim() || undefined,
        purpose: form.purpose.trim(),
        description: form.description.trim() || undefined,
        humanOwner: form.humanOwner.trim(),
        category: form.category,
        executionTier: form.executionTier,
        riskLevel: form.riskLevel,
        autonomyLevel: form.autonomyLevel,
        killSwitchLevel: form.killSwitchLevel,
        allowedTools: splitList(form.allowedTools),
        deniedActions: splitList(form.deniedActions),
        approvalActions: splitList(form.approvalActions),
        dataClasses: splitList(form.dataClasses),
        costBudgetDaily: numOrNull(form.costBudgetDaily) ?? undefined,
        costBudgetMonthly: numOrNull(form.costBudgetMonthly) ?? undefined,
        modelTierDefault: form.modelTierDefault.trim() || undefined,
      };
      if (existing) {
        return apiFetch(`/api/v1/analytics/agents/${encodeURIComponent(existing.agentId)}`, {
          method: 'PUT',
          body: JSON.stringify(base),
        });
      }
      return apiFetch('/api/v1/analytics/agents', {
        method: 'POST',
        body: JSON.stringify({ ...base, agentId: form.agentId.trim() }),
      });
    },
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setEditing(null);
    },
  });

  const killSwitchMutation = useMutation({
    mutationFn: async ({
      agent,
      action,
      reason,
    }: {
      agent: AgentRegistry;
      action: 'suspend' | 'resume';
      reason: string;
    }) => {
      return apiFetch(
        `/api/v1/analytics/agents/${encodeURIComponent(agent.agentId)}/${action === 'suspend' ? 'kill-switch' : 'resume'}`,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: reason.trim() || `Admin ${action} via panel`,
            triggeredBy: user?.email ?? 'admin-panel',
          }),
        }
      );
    },
    onSuccess: () => {
      invalidate();
      setKillTarget(null);
      setKillReason('');
    },
  });

  const retireMutation = useMutation({
    mutationFn: async ({ agent, reason }: { agent: AgentRegistry; reason: string }) => {
      return apiFetch(`/api/v1/analytics/agents/${encodeURIComponent(agent.agentId)}/retire`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reason.trim() || 'Retired via admin panel',
          triggeredBy: user?.email ?? 'admin-panel',
        }),
      });
    },
    onSuccess: () => {
      invalidate();
      setKillTarget(null);
      setKillReason('');
    },
  });

  const seedMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/v1/analytics/agents/seed', {
        method: 'POST',
        body: JSON.stringify({ force: true }),
      }),
    onSuccess: invalidate,
  });

  // Array guards: envelope drift renders empty state instead of crashing.
  const raw = agentsQuery.data as { data?: AgentRegistry[] } | AgentRegistry[] | undefined;
  const agents: AgentRegistry[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const statsRaw = statsQuery.data as { data?: AgentStats } | AgentStats | undefined;
  const stats: Partial<AgentStats> =
    statsRaw && typeof statsRaw === 'object' && 'data' in statsRaw && statsRaw.data
      ? statsRaw.data
      : ((statsRaw as Partial<AgentStats>) ?? {});

  const killAction = killSwitchMutation.isPending || retireMutation.isPending;

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
            Register, configure, kill-switch, and retire agents — aligned with the registry API
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            style={btnStyle('ghost')}
          >
            <Icon name="sprout" size={16} />
            <span style={{ marginLeft: 6 }}>
              {seedMutation.isPending ? 'Seeding…' : 'Seed AOS-MA-001'}
            </span>
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            style={btnStyle('primary')}
          >
            + Register agent
          </button>
        </div>
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
            value: stats.active ?? agents.filter((a) => a.status === 'active').length,
            color: 'var(--admin-emerald)',
          },
          {
            label: 'Suspended',
            value: stats.suspended ?? agents.filter((a) => a.status === 'suspended').length,
            color: 'var(--admin-amber)',
          },
          {
            label: 'Retired',
            value: stats.retired ?? agents.filter((a) => a.status === 'retired').length,
            color: 'var(--admin-grey)',
          },
          {
            label: 'Kill Switches',
            value: stats.killSwitchActive ?? agents.filter((a) => a.killSwitchActive).length,
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
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
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
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
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
            No agents registered. Register one manually or seed the AOS-MA-001 agents.
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
              {agents.map((agent) => (
                <tr
                  key={agent.id ?? agent.agentId}
                  style={{ borderBottom: '1px solid var(--admin-surface)' }}
                >
                  <td style={tdStyle}>
                    <div>
                      <button
                        onClick={() => setDetail(agent)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontWeight: 600,
                          color: 'var(--admin-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Icon
                          name={categoryIconName(agent.category)}
                          size={16}
                          color="var(--admin-orange)"
                        />
                        <span>{agent.name}</span>
                      </button>
                      <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                        {agent.purpose}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                        {agent.agentId} · v{agent.version}
                      </p>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      {CATEGORY_LABELS[agent.category] ?? agent.category}
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
                        color: healthColor(agent.healthStatus ?? 'unknown'),
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {agent.healthStatus ?? 'unknown'}
                    </span>
                    {(agent.errorRate ?? 0) > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          color:
                            (agent.errorRate ?? 0) > 20 ? 'var(--admin-red)' : 'var(--admin-amber)',
                          marginLeft: 6,
                        }}
                      >
                        {(agent.errorRate ?? 0).toFixed(1)}% err
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ color: 'var(--admin-text)' }}>
                      {(agent.totalExecutions ?? 0).toLocaleString()}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      ${agent.costBudgetDaily ?? '—'}/day · ${agent.costBudgetMonthly ?? '—'}/mo
                    </p>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => setDetail(agent)} style={btnStyle('ghost')}>
                        Details
                      </button>
                      <button
                        onClick={() => {
                          setEditing(agent);
                          setFormOpen(true);
                        }}
                        style={btnStyle('ghost')}
                      >
                        Edit
                      </button>
                      {agent.status === 'active' && (
                        <button
                          onClick={() => {
                            setKillTarget(agent);
                            setKillReason('');
                          }}
                          style={btnStyle('danger')}
                        >
                          Kill Switch
                        </button>
                      )}
                      {agent.status === 'suspended' && (
                        <button
                          onClick={() =>
                            killSwitchMutation.mutate({ agent, action: 'resume', reason: '' })
                          }
                          style={{
                            ...btnStyle('ghost'),
                            borderColor: 'var(--admin-emerald)',
                            color: 'var(--admin-emerald)',
                          }}
                        >
                          Resume
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register / Edit modal */}
      {formOpen && (
        <AgentFormModal
          existing={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={(form) => upsertMutation.mutate({ form, existing: editing })}
          pending={upsertMutation.isPending}
          serverError={
            upsertMutation.error
              ? String((upsertMutation.error as Error).message ?? 'Request failed')
              : null
          }
        />
      )}

      {/* Detail modal */}
      {detail && <AgentDetailModal agent={detail} onClose={() => setDetail(null)} />}

      {/* Kill-switch confirm modal (reason is recorded server-side) */}
      {killTarget && (
        <Modal
          title={`Kill switch — ${killTarget.agentId}`}
          onClose={() => setKillTarget(null)}
          width={480}
        >
          <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', marginBottom: 14 }}>
            Suspending <strong>{killTarget.name}</strong> immediately marks it unhealthy and blocks
            executions. This action is recorded in the kill-switch history.
          </p>
          <label style={labelStyle}>Reason (recorded for audit)</label>
          <textarea
            style={{ ...inputStyle, minHeight: 70 }}
            value={killReason}
            onChange={(e) => setKillReason(e.target.value)}
            placeholder="Why is this agent being suspended?"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button style={btnStyle('ghost')} onClick={() => setKillTarget(null)}>
              Cancel
            </button>
            <button
              style={btnStyle('danger')}
              disabled={killAction}
              onClick={() => {
                killSwitchMutation.mutate({
                  agent: killTarget,
                  action: 'suspend',
                  reason: killReason,
                });
              }}
            >
              {killAction ? 'Working…' : 'Activate kill switch'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
