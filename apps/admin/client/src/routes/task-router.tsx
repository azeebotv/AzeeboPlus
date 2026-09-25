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
  priority: string;
  complexityTier: string;
  slaHours: number | null;
  estimatedCostUsd: number | string | null; // Prisma Decimal serializes as string
  processStep: string | null;
  processOwner: string | null;
  automationCandidate: boolean;
  eliminationCandidate: boolean;
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
  const [showForm, setShowForm] = useState(false);
  // null = create, string = editing that taskType (the business key)
  const [editingTaskType, setEditingTaskType] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    taskType: '',
    workClass: 'A2',
    domain: 'finance',
    priority: 'normal',
    complexityTier: 'T2',
    description: '',
    slaHours: '',
    estimatedCostUsd: '',
    processStep: '',
    processOwner: '',
    automationCandidate: false,
    eliminationCandidate: false,
  });

  const tasksQuery = useQuery({
    queryKey: ['admin', 'tasks', { domainFilter, classFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (domainFilter) params.set('domain', domainFilter);
      if (classFilter) params.set('workClass', classFilter);
      return apiFetch<TaskClassification[]>(`/api/v1/analytics/tasks/classifications?${params}`);
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

  const resetForm = () => {
    setFormData({
      taskType: '',
      workClass: 'A2',
      domain: 'finance',
      priority: 'normal',
      complexityTier: 'T2',
      description: '',
      slaHours: '',
      estimatedCostUsd: '',
      processStep: '',
      processOwner: '',
      automationCandidate: false,
      eliminationCandidate: false,
    });
    setEditingTaskType(null);
    setFormError('');
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (task: TaskClassification) => {
    setFormData({
      taskType: task.taskType,
      workClass: task.workClass,
      domain: task.domain,
      priority: task.priority || 'normal',
      complexityTier: task.complexityTier || 'T2',
      description: task.description || '',
      slaHours: task.slaHours != null ? String(task.slaHours) : '',
      estimatedCostUsd: task.estimatedCostUsd != null ? String(task.estimatedCostUsd) : '',
      processStep: task.processStep || '',
      processOwner: task.processOwner || '',
      automationCandidate: task.automationCandidate,
      eliminationCandidate: task.eliminationCandidate,
    });
    setEditingTaskType(task.taskType);
    setFormError('');
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingTaskType) {
        // PUT — taskType is immutable (the route key), so it is not sent.
        const body: Record<string, unknown> = {
          workClass: formData.workClass,
          domain: formData.domain,
          priority: formData.priority,
          complexityTier: formData.complexityTier,
          automationCandidate: formData.automationCandidate,
          eliminationCandidate: formData.eliminationCandidate,
        };
        if (formData.description.trim()) body.description = formData.description.trim();
        if (formData.slaHours !== '') {
          const sla = Number(formData.slaHours);
          if (Number.isNaN(sla) || sla < 0)
            throw new Error('SLA hours must be a non-negative number.');
          body.slaHours = sla;
        }
        if (formData.estimatedCostUsd !== '') {
          const cost = Number(formData.estimatedCostUsd);
          if (Number.isNaN(cost) || cost < 0)
            throw new Error('Estimated cost must be a non-negative number.');
          body.estimatedCostUsd = cost;
        }
        if (formData.processStep) body.processStep = formData.processStep;
        if (formData.processOwner.trim()) body.processOwner = formData.processOwner.trim();
        return apiFetch(
          `/api/v1/analytics/tasks/classifications/${encodeURIComponent(editingTaskType)}`,
          { method: 'PUT', body: JSON.stringify(body) }
        );
      }
      // POST — required: taskType, workClass, domain, complexityTier.
      if (!formData.taskType.trim()) throw new Error('Task type is required.');
      if (!formData.domain.trim()) throw new Error('Domain is required.');
      const body: Record<string, unknown> = {
        taskType: formData.taskType.trim(),
        workClass: formData.workClass,
        domain: formData.domain.trim(),
        priority: formData.priority,
        complexityTier: formData.complexityTier,
        automationCandidate: formData.automationCandidate,
        eliminationCandidate: formData.eliminationCandidate,
      };
      if (formData.description.trim()) body.description = formData.description.trim();
      if (formData.slaHours !== '') {
        const sla = Number(formData.slaHours);
        if (Number.isNaN(sla) || sla < 0)
          throw new Error('SLA hours must be a non-negative number.');
        body.slaHours = sla;
      }
      if (formData.estimatedCostUsd !== '') {
        const cost = Number(formData.estimatedCostUsd);
        if (Number.isNaN(cost) || cost < 0)
          throw new Error('Estimated cost must be a non-negative number.');
        body.estimatedCostUsd = cost;
      }
      if (formData.processStep) body.processStep = formData.processStep;
      if (formData.processOwner.trim()) body.processOwner = formData.processOwner.trim();
      return apiFetch('/api/v1/analytics/tasks/classifications', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks-stats'] });
      setShowForm(false);
      resetForm();
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to save classification'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskType: string) => {
      return apiFetch(`/api/v1/analytics/tasks/classifications/${encodeURIComponent(taskType)}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'tasks-stats'] });
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to delete classification'),
  });

  // Array/object guards: envelope drift renders empty/zero, never crashes.
  const tasks = Array.isArray(tasksQuery.data?.data) ? tasksQuery.data!.data : [];
  const stats = (statsQuery.data?.data ?? {}) as Partial<TaskStats>;

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
        <button
          onClick={openCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: 'var(--admin-orange)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span>+ New Classification</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--admin-orange)',
            backgroundColor: 'rgba(232,66,10,0.05)',
            marginBottom: 24,
          }}
        >
          <h3
            style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}
          >
            {editingTaskType ? `Edit ${editingTaskType}` : 'New Task Classification'}
          </h3>
          {formError && (
            <div
              role="alert"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(204,28,28,0.4)',
                backgroundColor: 'rgba(204,28,28,0.12)',
                color: 'var(--admin-red-light)',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {formError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Task Type *
              </label>
              <input
                type="text"
                value={formData.taskType}
                disabled={!!editingTaskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                placeholder="e.g. invoice_generation"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  opacity: editingTaskType ? 0.6 : 1,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Work Class *
              </label>
              <select
                value={formData.workClass}
                onChange={(e) => setFormData({ ...formData, workClass: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              >
                {['X', 'S', 'A2', 'A1', 'H1', 'H0'].map((c: string) => (
                  <option key={c} value={c}>
                    {workClassLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Domain *
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="e.g. finance"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Complexity Tier *
              </label>
              <select
                value={formData.complexityTier}
                onChange={(e) => setFormData({ ...formData, complexityTier: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              >
                {['T0', 'T1', 'T2', 'T3', 'T4'].map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              >
                {['low', 'normal', 'high', 'urgent'].map((p: string) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Process Step (P0–P7)
              </label>
              <select
                value={formData.processStep}
                onChange={(e) => setFormData({ ...formData, processStep: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              >
                <option value="">—</option>
                {['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].map((p: string) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                SLA Hours
              </label>
              <input
                type="number"
                min="0"
                value={formData.slaHours}
                onChange={(e) => setFormData({ ...formData, slaHours: e.target.value })}
                placeholder="24"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Est. Cost / Execution (USD)
              </label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={formData.estimatedCostUsd}
                onChange={(e) => setFormData({ ...formData, estimatedCostUsd: e.target.value })}
                placeholder="0.0200"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Process Owner
              </label>
              <input
                type="text"
                value={formData.processOwner}
                onChange={(e) => setFormData({ ...formData, processOwner: e.target.value })}
                placeholder="e.g. Finance Ops lead"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What this task does and why it matters"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, alignItems: 'center' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--admin-text)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={formData.automationCandidate}
                onChange={(e) =>
                  setFormData({ ...formData, automationCandidate: e.target.checked })
                }
              />
              Automation Candidate
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--admin-text)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={formData.eliminationCandidate}
                onChange={(e) =>
                  setFormData({ ...formData, eliminationCandidate: e.target.checked })
                }
              />
              Elimination Candidate
            </label>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              style={{
                marginLeft: 'auto',
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'transparent',
                color: 'var(--admin-text-muted)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: 'var(--admin-emerald)',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {saveMutation.isPending ? 'Saving…' : editingTaskType ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </div>
      )}

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
            <p
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', marginBottom: 2 }}
            >
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
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Total Classifications
          </p>
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
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Automation Candidates
          </p>
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
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Elimination Candidates
          </p>
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
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Work Classes
          </p>
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
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading…
        </p>
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
        <div
          style={{ borderRadius: 16, border: '1px solid var(--admin-surface)', overflow: 'hidden' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(232,66,10,0.08)' }}>
                <th style={thStyle}>Task Type</th>
                <th style={thStyle}>Domain</th>
                <th style={thStyle}>Work Class</th>
                <th style={thStyle}>Recommended Tier</th>
                <th style={thStyle}>Est. Cost</th>
                <th style={thStyle}>Flags</th>
                <th style={thStyle}>Actions</th>
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
                        color: tierColor(task.complexityTier),
                        backgroundColor: `${tierColor(task.complexityTier)}15`,
                      }}
                    >
                      {task.complexityTier}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {task.estimatedCostUsd != null
                      ? `$${Number(task.estimatedCostUsd).toFixed(4)}`
                      : '—'}
                  </td>
                  <td style={tdStyle}>
                    {task.automationCandidate && (
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
                    {task.eliminationCandidate && (
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
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => openEdit(task)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-blue)',
                          backgroundColor: 'transparent',
                          color: 'var(--admin-blue)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete classification "${task.taskType}"? Routing will 404 for it.`
                            )
                          ) {
                            deleteMutation.mutate(task.taskType);
                          }
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-red)',
                          backgroundColor: 'transparent',
                          color: 'var(--admin-red)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
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
