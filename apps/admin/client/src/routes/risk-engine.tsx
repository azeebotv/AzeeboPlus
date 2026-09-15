import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/base';
import { Icon } from '@/components/Icons';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface RiskClassification {
  id: string;
  actionType: string;
  description: string;
  domain: string;
  riskLevel: string;
  autonomyLevel: string;
  approvalRequired: boolean;
  makerChecker: boolean;
  financialExposure: string;
  reversible: boolean;
  lastAssessedAt: string | null;
}

interface RiskStats {
  total: number;
  byRiskLevel: Record<string, number>;
  byAutonomyLevel: Record<string, number>;
  approvalRequiredCount: number;
  makerCheckerCount: number;
  irreversibleCount: number;
}

interface ApprovalRequest {
  id: string;
  actionType: string;
  requesterId: string;
  status: string;
  riskLevel: string;
  reason: string;
  createdAt: string;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

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

const autonomyColor = (a: string) => {
  switch (a) {
    case 'A0':
      return 'var(--admin-grey)';
    case 'A1':
      return 'var(--admin-emerald)';
    case 'A2':
      return 'var(--admin-blue)';
    case 'A3':
      return 'var(--admin-purple)';
    case 'A4':
      return 'var(--admin-amber)';
    case 'A5':
      return 'var(--admin-red)';
    default:
      return 'var(--admin-text-muted)';
  }
};

const approvalColor = (s: string) => {
  switch (s) {
    case 'PENDING':
      return 'var(--admin-amber)';
    case 'APPROVED':
      return 'var(--admin-emerald)';
    case 'REJECTED':
      return 'var(--admin-red)';
    case 'REVOKED':
      return 'var(--admin-grey)';
    case 'EXPIRED':
      return 'var(--admin-text-muted)';
    default:
      return 'var(--admin-text-muted)';
  }
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function RiskEnginePage() {
  const queryClient = useQueryClient();
  const [domainFilter, setDomainFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [assessAction, setAssessAction] = useState('');
  const [assessResult, setAssessResult] = useState<{
    riskLevel: string;
    autonomyLevel: string;
    decision: string;
    reason?: string;
  } | null>(null);

  const classificationsQuery = useQuery({
    queryKey: ['admin', 'risk-classifications', { domainFilter, riskFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (domainFilter) params.set('domain', domainFilter);
      if (riskFilter) params.set('riskLevel', riskFilter);
      return apiFetch<RiskClassification[]>(`/api/v1/analytics/risk/classifications?${params}`);
    },
    refetchInterval: 30000,
  });

  const statsQuery = useQuery({
    queryKey: ['admin', 'risk-stats'],
    queryFn: async () => {
      return apiFetch<RiskStats>('/api/v1/analytics/risk/stats');
    },
  });

  const approvalsQuery = useQuery({
    queryKey: ['admin', 'risk-approvals'],
    queryFn: async () => {
      return apiFetch<ApprovalRequest[]>('/api/v1/analytics/risk/approvals/pending?limit=20');
    },
  });

  const assessMutation = useMutation({
    mutationFn: async (actionType: string) => {
      const res = await apiFetch<unknown>(`/api/v1/analytics/risk/assess/${actionType}`);
      return res;
    },
    onSuccess: (res) =>
      setAssessResult(
        (
          res as {
            data?: { riskLevel: string; autonomyLevel: string; decision: string; reason?: string };
          }
        )?.data ?? null
      ),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ approvalId, decision }: { approvalId: string; decision: string }) => {
      return apiFetch(`/api/v1/analytics/risk/approvals/${approvalId}/decide`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason: `Admin ${decision}` }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'risk-approvals'] }),
  });

  const seedRiskMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/api/v1/analytics/risk/seed', {
        method: 'POST',
        body: JSON.stringify({ force: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'risk-classifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'risk-stats'] });
    },
  });

  // Array/object guards: envelope drift renders empty/zero, never crashes.
  const classifications = Array.isArray(classificationsQuery.data?.data)
    ? classificationsQuery.data!.data
    : [];
  const stats = (statsQuery.data?.data ?? {}) as Partial<RiskStats>;
  const approvals = Array.isArray(approvalsQuery.data?.data) ? approvalsQuery.data!.data : [];

  const domains = [...new Set(classifications.map((c: RiskClassification) => c.domain))].sort();

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
            <Icon name="shield" size={32} color="var(--admin-blue)" />
            <span>Risk Engine</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            R0-R4 risk levels, A0-A5 autonomy levels, approval gates, and maker-checker separation
          </p>
        </div>
        <button
          onClick={() => seedRiskMutation.mutate()}
          disabled={seedRiskMutation.isPending}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: 'var(--admin-blue)',
            color: 'white',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: seedRiskMutation.isPending ? 0.6 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="sprout" size={16} />
          <span>{seedRiskMutation.isPending ? 'Seeding…' : 'Seed Risk Classifications'}</span>
        </button>
      </div>

      {/* Decision Matrix Legend */}
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid var(--admin-surface)',
          backgroundColor: 'var(--admin-surface)',
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--admin-text)' }}>
          Decision Matrix (Risk × Autonomy)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: '8px 12px',
                    border: '1px solid var(--admin-surface)',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span>Risk</span>
                    <Icon name="arrowDown" size={12} color="var(--admin-text-muted)" />
                    <span>/ Autonomy</span>
                    <Icon name="arrowRight" size={12} color="var(--admin-text-muted)" />
                  </div>
                </th>
                {['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].map((a) => (
                  <th
                    key={a}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--admin-surface)',
                      color: autonomyColor(a),
                      fontWeight: 600,
                    }}
                  >
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { risk: 'R0', decisions: ['ASK', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW'] },
                { risk: 'R1', decisions: ['ASK', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW'] },
                { risk: 'R2', decisions: ['ASK', 'ASK', 'ALLOW', 'ALLOW', 'ALLOW', 'ALLOW'] },
                { risk: 'R3', decisions: ['DENY', 'ASK', 'ASK', 'ASK', 'ALLOW', 'ALLOW'] },
                { risk: 'R4', decisions: ['DENY', 'DENY', 'DENY', 'ASK', 'ASK', 'ASK'] },
              ].map(({ risk, decisions }) => (
                <tr key={risk}>
                  <td
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--admin-surface)',
                      fontWeight: 600,
                      color: riskColor(risk),
                    }}
                  >
                    {risk}
                  </td>
                  {decisions.map((d, i) => (
                    <td
                      key={i}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid var(--admin-surface)',
                        textAlign: 'center',
                        fontWeight: 600,
                        color:
                          d === 'ALLOW'
                            ? 'var(--admin-emerald)'
                            : d === 'ASK'
                              ? 'var(--admin-amber)'
                              : 'var(--admin-red)',
                        backgroundColor:
                          d === 'ALLOW'
                            ? 'rgba(16,185,129,0.08)'
                            : d === 'ASK'
                              ? 'rgba(245,158,11,0.08)'
                              : 'rgba(239,68,68,0.08)',
                      }}
                    >
                      {d}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
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
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Total Classifications
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-orange)' }}>
            {stats.total ?? classifications.length}
          </p>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Approval Required
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-amber)' }}>
            {stats.approvalRequiredCount ?? 0}
          </p>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Maker-Checker Enforced
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-purple)' }}>
            {stats.makerCheckerCount ?? 0}
          </p>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-surface)',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            Irreversible Actions
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-red)' }}>
            {stats.irreversibleCount ?? 0}
          </p>
        </div>
      </div>

      {/* Risk Level Distribution */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['R0', 'R1', 'R2', 'R3', 'R4'].map((r) => (
          <div
            key={r}
            style={{
              flex: '1 1 80px',
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${riskColor(r)}30`,
              backgroundColor: `${riskColor(r)}08`,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 700, color: riskColor(r) }}>
              {stats.byRiskLevel?.[r] ?? 0}
            </p>
            <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{r}</p>
          </div>
        ))}
      </div>

      {/* Quick Risk Assessment */}
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid var(--admin-surface)',
          backgroundColor: 'var(--admin-surface)',
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--admin-text)' }}>
          Quick Risk Assessment
        </h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter action type (e.g. payment.refund, content.delete)"
            value={assessAction}
            onChange={(e) => setAssessAction(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid var(--admin-surface)',
              backgroundColor: 'var(--admin-bg)',
              color: 'var(--admin-text)',
              fontSize: 14,
            }}
          />
          <button
            onClick={() => assessAction && assessMutation.mutate(assessAction)}
            disabled={!assessAction || assessMutation.isPending}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: 'var(--admin-orange)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: !assessAction || assessMutation.isPending ? 0.5 : 1,
            }}
          >
            Assess
          </button>
        </div>
        {assessResult && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 10,
              border: '1px solid var(--admin-surface)',
              backgroundColor: 'var(--admin-darker)',
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontWeight: 700,
                  color: riskColor(assessResult.riskLevel),
                  backgroundColor: `${riskColor(assessResult.riskLevel)}15`,
                  fontSize: 14,
                }}
              >
                {assessResult.riskLevel}
              </span>
              <Icon name="arrowRight" size={14} color="var(--admin-text-muted)" />
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontWeight: 700,
                  color: autonomyColor(assessResult.autonomyLevel),
                  backgroundColor: `${autonomyColor(assessResult.autonomyLevel)}15`,
                  fontSize: 14,
                }}
              >
                {assessResult.autonomyLevel}
              </span>
              <Icon name="arrowRight" size={14} color="var(--admin-text-muted)" />
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontWeight: 700,
                  color:
                    assessResult.decision === 'ALLOW'
                      ? 'var(--admin-emerald)'
                      : assessResult.decision === 'ASK'
                        ? 'var(--admin-amber)'
                        : 'var(--admin-red)',
                  backgroundColor:
                    assessResult.decision === 'ALLOW'
                      ? 'rgba(16,185,129,0.15)'
                      : assessResult.decision === 'ASK'
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(239,68,68,0.15)',
                  fontSize: 14,
                }}
              >
                {assessResult.decision}
              </span>
            </div>
            {assessResult.reason && (
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                {assessResult.reason}
              </p>
            )}
          </div>
        )}
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
            backgroundColor: 'var(--admin-bg)',
            color: 'var(--admin-text)',
            fontSize: 14,
          }}
        >
          <option value="">All Domains</option>
          {domains.map((d) => (
            <option key={d as string} value={d as string}>
              {d as string}
            </option>
          ))}
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-bg)',
            color: 'var(--admin-text)',
            fontSize: 14,
          }}
        >
          <option value="">All Risk Levels</option>
          {['R0', 'R1', 'R2', 'R3', 'R4'].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Classifications Table */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid var(--admin-surface)',
          overflow: 'hidden',
          marginBottom: 32,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(232,66,10,0.08)' }}>
              <th style={thStyle}>Action Type</th>
              <th style={thStyle}>Domain</th>
              <th style={thStyle}>Risk</th>
              <th style={thStyle}>Autonomy</th>
              <th style={thStyle}>Financial</th>
              <th style={thStyle}>Flags</th>
            </tr>
          </thead>
          <tbody>
            {classifications.map((c: RiskClassification) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--admin-surface)' }}>
                <td style={tdStyle}>
                  <p style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{c.actionType}</p>
                  <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{c.description}</p>
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
                    {c.domain}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 700, color: riskColor(c.riskLevel) }}>
                    {c.riskLevel}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 700, color: autonomyColor(c.autonomyLevel) }}>
                    {c.autonomyLevel}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      color:
                        c.financialExposure === 'high'
                          ? 'var(--admin-red)'
                          : c.financialExposure === 'medium'
                            ? 'var(--admin-amber)'
                            : 'var(--admin-text-muted)',
                    }}
                  >
                    {c.financialExposure}
                  </span>
                </td>
                <td style={tdStyle}>
                  {c.approvalRequired && (
                    <span
                      style={{
                        marginRight: 4,
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        backgroundColor: 'rgba(245,158,11,0.15)',
                        color: 'var(--admin-amber)',
                      }}
                    >
                      APPROVE
                    </span>
                  )}
                  {c.makerChecker && (
                    <span
                      style={{
                        marginRight: 4,
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        backgroundColor: 'rgba(139,92,246,0.15)',
                        color: 'var(--admin-purple)',
                      }}
                    >
                      MC
                    </span>
                  )}
                  {!c.reversible && (
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        backgroundColor: 'rgba(239,68,68,0.15)',
                        color: 'var(--admin-red)',
                      }}
                    >
                      IRREV
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Approvals */}
      <div
        style={{
          padding: 24,
          borderRadius: 16,
          border: '1px solid var(--admin-surface)',
          backgroundColor: 'var(--admin-surface)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
          Pending Approval Requests
        </h2>
        {approvals.length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 24 }}>
            No pending approvals
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvals.map((a: ApprovalRequest) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{a.actionType}</p>
                  <p style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    Requester: {a.requesterId} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      color: approvalColor(a.status),
                      backgroundColor: `${approvalColor(a.status)}15`,
                    }}
                  >
                    {a.status}
                  </span>
                  {a.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() =>
                          approveMutation.mutate({ approvalId: a.id, decision: 'approved' })
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: 'var(--admin-emerald)',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          approveMutation.mutate({ approvalId: a.id, decision: 'rejected' })
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: 'var(--admin-red)',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
