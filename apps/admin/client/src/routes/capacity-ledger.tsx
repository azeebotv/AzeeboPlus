import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/base';
import { useAuth } from '@/context/AuthContext';
import { Icon } from '@/components/Icons';
import { pollingIntervals } from '@azeebo/design-tokens';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface CapacityEntry {
  id: string;
  taskType: string;
  domain: string;
  baselineHours: number;
  postAgentHours: number;
  hoursReleased: number;
  headcountAvoided: boolean;
  validated: boolean;
  validatedBy: string | null;
  period: string;
  createdAt: string;
}

// Summary — matched to capacity-ledger service getPeriodSummary: byDomain
// buckets are { baseline, released, count } (an earlier revision read a
// `tasks` field that doesn't exist, so every card showed 0 workflows).
interface CapacitySummary {
  totalEntries: number;
  totalHoursReleased: number;
  headcountAvoided: number;
  byDomain: Record<string, { baseline: number; released: number; count: number }>;
}

/* ── Component ─────────────────────────────────────────────────────────── */

/**
 * Period picker options (current quarter plus two back and four forward).
 * Entries must use the quarter format — the summary endpoint
 * (`/summary/:period`) and the seeded data both use `YYYY-QN`, so a
 * `YYYY-MM` month value would never roll up into any quarter summary.
 */
const QUARTER_OPTIONS: string[] = (() => {
  const now = new Date();
  const quarters: string[] = [];
  for (let offset = -1; offset <= 4; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset * 3, 1);
    quarters.push(`${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`);
  }
  return quarters;
})();

export default function CapacityLedgerPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formError, setFormError] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const now = new Date();
  const currentQuarter = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  const [formData, setFormData] = useState({
    taskType: '',
    domain: 'FINANCE',
    baselineHours: '',
    postAgentHours: '',
    headcountAvoided: false,
    vendorAvoided: false,
    redeploymentTarget: '',
    roleDescription: '',
    notes: '',
    // Quarter format — matches the summary endpoint (`/summary/:period`) and
    // the seeded data; a `YYYY-MM` month value would never roll up.
    period: currentQuarter,
  });

  const entriesQuery = useQuery({
    queryKey: ['admin', 'capacity-entries', { periodFilter, domainFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (periodFilter) params.set('period', periodFilter);
      if (domainFilter) params.set('domain', domainFilter);
      return apiFetch<CapacityEntry[]>(`/api/v1/analytics/capacity/entries?${params}`);
    },
    refetchInterval: pollingIntervals.dashboard,
  });

  const summaryQuery = useQuery({
    queryKey: ['admin', 'capacity-summary', periodFilter],
    queryFn: async () => {
      const period =
        periodFilter ||
        `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
      return apiFetch<CapacitySummary>(`/api/v1/analytics/capacity/summary/${period}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Guard the numeric fields: parseFloat('') is NaN, and JSON.stringify
      // serializes NaN as null — corrupting the analytics payload.
      const baseline = Number.parseFloat(data.baselineHours);
      const postAgent = Number.parseFloat(data.postAgentHours);
      if (!data.taskType.trim()) throw new Error('Task type is required.');
      if (Number.isNaN(baseline) || baseline < 0)
        throw new Error('Baseline hours must be a non-negative number.');
      if (Number.isNaN(postAgent) || postAgent < 0)
        throw new Error('Post-agent hours must be a non-negative number.');
      return apiFetch('/api/v1/analytics/capacity/entries', {
        method: 'POST',
        body: JSON.stringify({
          taskType: data.taskType,
          domain: data.domain,
          baselineHours: baseline,
          postAgentHours: postAgent,
          headcountAvoided: data.headcountAvoided,
          vendorAvoided: data.vendorAvoided,
          redeploymentTarget: data.redeploymentTarget.trim() || undefined,
          roleDescription: data.roleDescription.trim() || undefined,
          notes: data.notes.trim() || undefined,
          period: data.period,
        }),
      });
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to add entry'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'capacity-entries'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'capacity-summary'] });
      setShowAddForm(false);
      setFormData({
        taskType: '',
        domain: 'FINANCE',
        baselineHours: '',
        postAgentHours: '',
        headcountAvoided: false,
        vendorAvoided: false,
        redeploymentTarget: '',
        roleDescription: '',
        notes: '',
        period: currentQuarter,
      });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return apiFetch(`/api/v1/analytics/capacity/entries/${entryId}/validate`, {
        method: 'POST',
        body: JSON.stringify({ validatedBy: user?.email || user?.id || 'admin' }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'capacity-entries'] }),
    onError: () => setFormError('Failed to validate entry — is the analytics service up?'),
  });

  const entries = (
    Array.isArray(entriesQuery.data?.data) ? entriesQuery.data!.data : []
  ) as CapacityEntry[];
  const summary = summaryQuery.data?.data ?? {
    totalEntries: 0,
    totalHoursReleased: 0,
    headcountAvoided: 0,
    byDomain: {},
  };

  const domains = [
    'FINANCE',
    'COMMERCIAL',
    'RIGHTS',
    'CUSTOMER',
    'PRODUCT',
    'SECURITY',
    'PEOPLE',
    'PMO',
  ];

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
            <Icon name="clock" size={32} color="var(--admin-orange)" />
            <span>Capacity & Efficiency Ledger</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            Track operational hours saved, automation ROI, and leadership sign-off across automated workflows
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              apiFetch('/api/v1/analytics/capacity/seed', { method: 'POST' }).then(() => {
                queryClient.invalidateQueries({ queryKey: ['admin', 'capacity-entries'] });
                queryClient.invalidateQueries({ queryKey: ['admin', 'capacity-summary'] });
              });
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: '1px solid var(--admin-blue)',
              backgroundColor: 'transparent',
              color: 'var(--admin-blue)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Icon name="sprout" size={16} />
            <span>Seed Sample Data</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
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
            {showAddForm ? 'Cancel' : '+ Record Capacity'}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
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
            Record New Capacity Entry
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Task Type
              </label>
              <input
                type="text"
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                placeholder="e.g. payment.reconciliation"
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
                Domain
              </label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
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
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
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
                Manual Hours Previously Needed (hrs/wk)
              </label>
              <input
                type="number"
                value={formData.baselineHours}
                onChange={(e) => setFormData({ ...formData, baselineHours: e.target.value })}
                placeholder="40"
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
                Hours Required With Automation (hrs/wk)
              </label>
              <input
                type="number"
                value={formData.postAgentHours}
                onChange={(e) => setFormData({ ...formData, postAgentHours: e.target.value })}
                placeholder="12"
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: 'var(--admin-text-muted)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Staff Reassigned To (optional)
              </label>
              <input
                type="text"
                value={formData.redeploymentTarget}
                onChange={(e) => setFormData({ ...formData, redeploymentTarget: e.target.value })}
                placeholder="e.g. Revenue Operations"
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
                Role Description / Team Impact (optional)
              </label>
              <input
                type="text"
                value={formData.roleDescription}
                onChange={(e) => setFormData({ ...formData, roleDescription: e.target.value })}
                placeholder="e.g. Senior reconciler, 2 FTE"
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
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Context for finance and leadership review"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-bg)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
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
                checked={formData.headcountAvoided}
                onChange={(e) => setFormData({ ...formData, headcountAvoided: e.target.checked })}
              />
              Staff Time Saved
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
                checked={formData.vendorAvoided}
                onChange={(e) => setFormData({ ...formData, vendorAvoided: e.target.checked })}
              />
              External Vendor / Agency Cost Avoided
            </label>
            <select
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-bg)',
                color: 'var(--admin-text)',
                fontSize: 14,
              }}
            >
              {QUARTER_OPTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <button
              onClick={() => createMutation.mutate(formData)}
              disabled={
                !formData.taskType ||
                !formData.baselineHours ||
                !formData.postAgentHours ||
                createMutation.isPending
              }
              style={{
                marginLeft: 'auto',
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: 'var(--admin-emerald)',
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                opacity:
                  !formData.taskType || !formData.baselineHours || !formData.postAgentHours
                    ? 0.5
                    : 1,
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>
            Total Staff Hours Saved
          </p>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-emerald)' }}>
            {summary.totalHoursReleased.toLocaleString()}h
          </p>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>
            Full-Time Roles Reallocated
          </p>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-blue)' }}>
            {summary.headcountAvoided}
          </p>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>
            Automated Workflows
          </p>
          <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-orange)' }}>
            {summary.totalEntries}
          </p>
        </div>
      </div>

      {/* Domain Breakdown */}
      {Object.keys(summary.byDomain).length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {Object.entries(summary.byDomain).map(
            ([domain, data]: [string, { baseline: number; released: number; count: number }]) => (
              <div
                key={domain}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              >
                <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                  {domain}
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                  {data.released}h saved
                </p>
                <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                  {data.count} workflows
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-bg)',
            color: 'var(--admin-text)',
            fontSize: 14,
          }}
        >
          <option value="">All periods</option>
          {QUARTER_OPTIONS.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-bg)',
            color: 'var(--admin-text)',
            fontSize: 14,
          }}
        >
          <option value="">All Domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Entries Table */}
      {entriesQuery.isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading…
        </p>
      ) : entries.length === 0 ? (
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            border: '1px solid var(--admin-surface)',
            borderRadius: 16,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Icon name="clock" size={48} color="var(--admin-text-muted)" />
          </div>
          <p style={{ fontSize: 16, color: 'var(--admin-text-muted)' }}>
            No capacity entries recorded yet. Add your first entry above.
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
                <th style={thStyle}>Manual Hours</th>
                <th style={thStyle}>Automated Hours</th>
                <th style={thStyle}>Hours Saved</th>
                <th style={thStyle}>Time Saved %</th>
                <th style={thStyle}>Roles Saved</th>
                <th style={thStyle}>Validated</th>
                <th style={thStyle}>Period</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: CapacityEntry) => {
                const savingsPct =
                  entry.baselineHours > 0
                    ? Math.round((entry.hoursReleased / entry.baselineHours) * 100)
                    : 0;
                return (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--admin-surface)' }}>
                    <td style={tdStyle}>
                      <p style={{ fontWeight: 600, color: 'var(--admin-text)' }}>
                        {entry.taskType}
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
                        {entry.domain}
                      </span>
                    </td>
                    <td style={tdStyle}>{entry.baselineHours}h</td>
                    <td style={tdStyle}>{entry.postAgentHours}h</td>
                    <td style={{ ...tdStyle, color: 'var(--admin-emerald)', fontWeight: 700 }}>
                      {entry.hoursReleased}h
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color:
                            savingsPct > 50
                              ? 'var(--admin-emerald)'
                              : savingsPct > 25
                                ? 'var(--admin-amber)'
                                : 'var(--admin-text-muted)',
                          backgroundColor:
                            savingsPct > 50
                              ? 'rgba(16,185,129,0.1)'
                              : savingsPct > 25
                                ? 'rgba(245,158,11,0.1)'
                                : 'transparent',
                        }}
                      >
                        {savingsPct}%
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {entry.headcountAvoided ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--admin-blue)',
                            backgroundColor: 'rgba(59,130,246,0.15)',
                          }}
                        >
                          Avoided
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {entry.validated ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--admin-emerald)',
                            backgroundColor: 'rgba(16,185,129,0.15)',
                          }}
                        >
                          <Icon name="check" size={12} color="var(--admin-emerald)" />
                          <span>{entry.validatedBy}</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                          Pending
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>{entry.period}</td>
                    <td style={tdStyle}>
                      {!entry.validated && (
                        <button
                          onClick={() => validateMutation.mutate(entry.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--admin-emerald)',
                            backgroundColor: 'transparent',
                            color: 'var(--admin-emerald)',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Validate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
