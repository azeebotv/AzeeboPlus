import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api/base';
import { Icon } from '@/components/Icons';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface ServiceHealth {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
}

interface AgentStats {
  total: number;
  byStatus: Record<string, number>;
  killSwitchActive: number;
}

interface CostSummary {
  totalRequests: number;
  totalCostUsd: number;
  byModel: Record<string, { events: number; costUsd: number }>;
}

interface TaskStats {
  total: number;
  byClass: Record<string, number>;
  automationCandidates: number;
  eliminationCandidates: number;
}

interface RiskStats {
  classifications: { total: number; approvalRequired: number; makerChecker: number };
  assessments: { total: number; byDecision: Record<string, number>; overridden: number };
  approvals: { total: number; byStatus: Record<string, number>; pending: number };
}

interface CapacitySummary {
  totalEntries: number;
  totalHoursReleased: number;
  headcountAvoided: number;
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const STATUS_COLOR = {
  healthy: 'var(--admin-emerald)',
  degraded: 'var(--admin-amber)',
  down: 'var(--admin-red)',
  unknown: 'var(--admin-grey)',
} as const;

function StatusDot({ status }: { status: 'healthy' | 'degraded' | 'down' | 'unknown' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: STATUS_COLOR[status],
        boxShadow: `0 0 8px ${STATUS_COLOR[status]}66`,
      }}
    />
  );
}

/* ── Component ─────────────────────────────────────────────────────────────── */

const BACKEND_SERVICES = [
  { name: 'auth-service', port: 3000 },
  { name: 'user-service', port: 3001 },
  { name: 'wallet-service', port: 3002 },
  { name: 'payment-service', port: 3003 },
  { name: 'content-service', port: 3004 },
  { name: 'search-service', port: 3005 },
  { name: 'notification-service', port: 3006 },
  { name: 'reward-service', port: 3007 },
  { name: 'analytics-service', port: 3008 },
  { name: 'recommendation-service', port: 3009 },
  { name: 'reality-service', port: 3010 },
  { name: 'movie-service', port: 3011 },
  { name: 'comedy-service', port: 3012 },
  { name: 'api-gateway', port: 3013 },
  { name: 'games-service', port: 3014 },
  { name: 'queue-service', port: 3015 },
  { name: 'lifestyle-service', port: 3016 },
  { name: 'vertical-service', port: 3017 },
  { name: 'creator-service', port: 3018 },
  { name: 'media-service', port: 3019 },
  { name: 'knowledge-service', port: 3020 },
  { name: 'sports-service', port: 3021 },
  { name: 'moderation-service', port: 3022 },
  { name: 'engagement-service', port: 3023 },
  { name: 'messaging-service', port: 3024 },
  { name: 'referral-service', port: 3025 },
  { name: 'subscription-service', port: 3026 },
  { name: 'live-event-service', port: 3027 },
  { name: 'support-service', port: 3028 },
] as const;

function useServiceHealth() {
  return useQuery({
    queryKey: ['admin', 'service-health'] as const,
    // Probed server-side via the admin backend — the browser never dials
    // localhost:30xx (those hostnames only resolve where the services run).
    queryFn: async (): Promise<ServiceHealth[]> => {
      const res = await apiFetch<{
        services: Array<{
          name: string;
          port: number;
          status: ServiceHealth['status'];
          latencyMs: number;
        }>;
        checkedAt: string;
      }>('/api/v1/admin/ops/services');
      if (!res.success || !res.data) return [];
      // services array guard: envelope drift renders empty, never crashes.
      const services = Array.isArray(res.data.services) ? res.data.services : [];
      return services.map((s) => ({
        name: s.name,
        port: s.port,
        status: s.status,
        latency: s.latencyMs,
      }));
    },
    refetchInterval: 15_000,
  });
}

export default function SystemHealthPage() {
  const navigate = useNavigate();

  const servicesQuery = useServiceHealth();
  const services: ServiceHealth[] = servicesQuery.data ?? [];
  const healthyCount = services.filter((s: ServiceHealth) => s.status === 'healthy').length;
  const totalCount = services.length || BACKEND_SERVICES.length;

  // Fetch all governance system stats in parallel
  const agentsQuery = useQuery({
    queryKey: ['admin', 'health-agents'],
    queryFn: async () => {
      // The registry controller exposes GET /agents/stats/overview (a bare
      // /agents/stats 404s — the ':agentId' route shadows it).
      return apiFetch<AgentStats>('/api/v1/analytics/agents/stats/overview');
    },
    refetchInterval: 30_000,
  });

  const costQuery = useQuery({
    queryKey: ['admin', 'health-cost'],
    queryFn: async () => {
      return apiFetch<CostSummary>('/api/v1/analytics/cost/summary');
    },
    refetchInterval: 30_000,
  });

  const tasksQuery = useQuery({
    queryKey: ['admin', 'health-tasks'],
    queryFn: async () => {
      return apiFetch<TaskStats>('/api/v1/analytics/tasks/classifications/stats');
    },
    refetchInterval: 30_000,
  });

  const riskQuery = useQuery({
    queryKey: ['admin', 'health-risk'],
    queryFn: async () => {
      // The risk controller exposes GET /risk/stats — /risk/stats does not
      // exist as a separate resource and 500s as 'Failed to reach upstream'.
      return apiFetch<RiskStats>('/api/v1/analytics/risk/stats');
    },
    refetchInterval: 30_000,
  });

  const capacityQuery = useQuery({
    queryKey: ['admin', 'health-capacity'],
    queryFn: async () => {
      return apiFetch<CapacitySummary>('/api/v1/analytics/capacity/summary/current');
    },
    refetchInterval: 30_000,
  });

  // Defaults are field-level, not object-level: a 200 payload missing one
  // field used to crash .toLocaleString() into the error boundary because
  // `??` only fires when the WHOLE object is undefined.
  const agentsRaw = agentsQuery.data?.data;
  const agents = {
    total: agentsRaw?.total ?? 0,
    active: agentsRaw?.byStatus?.['active'] ?? 0,
    suspended: agentsRaw?.byStatus?.['suspended'] ?? 0,
    retired: agentsRaw?.byStatus?.['retired'] ?? 0,
    killSwitchActive: agentsRaw?.killSwitchActive ?? 0,
  };
  const costRaw = costQuery.data?.data;
  const cost = {
    totalRequests: costRaw?.totalRequests ?? 0,
    totalCostUsd: costRaw?.totalCostUsd ?? 0,
    byModel: costRaw?.byModel ?? {},
  };
  const tasksRaw = tasksQuery.data?.data;
  const tasks = {
    total: tasksRaw?.total ?? 0,
    byClass: tasksRaw?.byClass ?? {},
    automationCandidates: tasksRaw?.automationCandidates ?? 0,
    eliminationCandidates: tasksRaw?.eliminationCandidates ?? 0,
  };
  const riskRaw = riskQuery.data?.data;
  const risk = {
    total: riskRaw?.classifications?.total ?? 0,
    byRiskLevel: riskRaw?.approvals?.byStatus ?? {},
    approvalRequiredCount: riskRaw?.classifications?.approvalRequired ?? 0,
    irreversibleCount: riskRaw?.assessments?.overridden ?? 0,
  };
  const capacityRaw = capacityQuery.data?.data;
  const capacity = {
    totalEntries: capacityRaw?.totalEntries ?? 0,
    totalHoursReleased: capacityRaw?.totalHoursReleased ?? 0,
    headcountAvoided: capacityRaw?.headcountAvoided ?? 0,
  };

  const isLoading =
    agentsQuery.isLoading ||
    costQuery.isLoading ||
    tasksQuery.isLoading ||
    riskQuery.isLoading ||
    capacityQuery.isLoading;
  const hasError =
    agentsQuery.isError ||
    costQuery.isError ||
    tasksQuery.isError ||
    riskQuery.isError ||
    capacityQuery.isError;

  // Determine overall system health
  const getSystemStatus = (): 'healthy' | 'degraded' | 'down' => {
    if (hasError) return 'degraded';
    if (agents.killSwitchActive > 0) return 'degraded';
    if (agents.active === 0 && agents.total > 0) return 'degraded';
    return 'healthy';
  };

  const systemStatus = getSystemStatus();

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
            <Icon name="activity" size={28} color="var(--admin-orange)" />
            <span>System Health</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            Single-pane-of-glass view across all AOS-MA-001 governance systems
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 20px',
            borderRadius: 10,
            border: `1px solid ${STATUS_COLOR[systemStatus]}30`,
            backgroundColor: `${STATUS_COLOR[systemStatus]}10`,
          }}
        >
          <StatusDot status={systemStatus} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: STATUS_COLOR[systemStatus],
              textTransform: 'capitalize',
            }}
          >
            {systemStatus}
          </span>
        </div>
      </div>

      {/* Backend Service Health Grid */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text)' }}>
            Backend Services ({healthyCount}/{totalCount} healthy)
          </h2>
          <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
            Auto-refreshes every 15s
          </span>
        </div>
        {servicesQuery.isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 8,
            }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{ height: 48, borderRadius: 8, backgroundColor: 'var(--admin-surface)' }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 8,
            }}
          >
            {services.map((svc: ServiceHealth) => (
              <div
                key={svc.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1px solid ${svc.status === 'healthy' ? 'rgba(16,185,129,0.19)' : svc.status === 'degraded' ? 'rgba(245,158,11,0.19)' : 'rgba(239,68,68,0.19)'}`,
                  backgroundColor:
                    svc.status === 'healthy'
                      ? 'rgba(16,185,129,0.03)'
                      : svc.status === 'degraded'
                        ? 'rgba(245,158,11,0.03)'
                        : 'rgba(239,68,68,0.03)',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor:
                      svc.status === 'healthy'
                        ? 'var(--admin-emerald)'
                        : svc.status === 'degraded'
                          ? 'var(--admin-amber)'
                          : 'var(--admin-red)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--admin-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {svc.name.replace('-service', '').replace('-', ' ')}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>
                    :{svc.port} {svc.latency > 0 && `· ${svc.latency}ms`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <div
                style={{
                  width: '60%',
                  height: 12,
                  backgroundColor: 'var(--admin-surface)',
                  borderRadius: 4,
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  width: '40%',
                  height: 28,
                  backgroundColor: 'var(--admin-surface)',
                  borderRadius: 4,
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* System Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            <SummaryCard
              title="Agent Registry"
              value={agents.total}
              subtitle={`${agents.active} active · ${agents.suspended} suspended`}
              color="#E8420A"
              status={agents.killSwitchActive > 0 ? 'degraded' : 'healthy'}
              onClick={() => navigate('/agents')}
            />
            <SummaryCard
              title="AI Cost Tracker"
              value={`$${cost.totalCostUsd.toFixed(2)}`}
              subtitle={`${cost.totalRequests.toLocaleString()} requests`}
              color="#10B981"
              status="healthy"
              onClick={() => navigate('/cost-dashboard')}
            />
            <SummaryCard
              title="Task Router"
              value={tasks.total}
              subtitle={`${tasks.automationCandidates} auto · ${tasks.eliminationCandidates} elim`}
              color="#3B82F6"
              status="healthy"
              onClick={() => navigate('/task-router')}
            />
            <SummaryCard
              title="Risk Engine"
              value={risk.total}
              subtitle={`${risk.approvalRequiredCount} approvals · ${risk.irreversibleCount} irrevers`}
              color="#8B5CF6"
              status={risk.irreversibleCount > 0 ? 'degraded' : 'healthy'}
              onClick={() => navigate('/risk-engine')}
            />
            <SummaryCard
              title="Capacity Ledger"
              value={`${capacity.totalHoursReleased}h`}
              subtitle={`${capacity.headcountAvoided} HC avoided`}
              color="#F59E0B"
              status="healthy"
              onClick={() => navigate('/capacity-ledger')}
            />
          </div>

          {/* Detailed Sections */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
              marginBottom: 32,
            }}
          >
            {/* Agent Health Breakdown */}
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: 'var(--admin-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="bot" size={18} color="var(--admin-blue)" />
                <span>Agent Health Breakdown</span>
                <span
                  onClick={() => navigate('/agents')}
                  style={{
                    fontSize: 12,
                    color: 'var(--admin-orange)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  View
                  <Icon name="arrowRight" size={12} color="var(--admin-orange)" />
                </span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <StatRow label="Active" value={agents.active} color="#10B981" />
                <StatRow label="Suspended" value={agents.suspended} color="#F59E0B" />
                <StatRow label="Retired" value={agents.retired} color="#6B7280" />
                <StatRow label="Kill Switches" value={agents.killSwitchActive} color="#EF4444" />
              </div>
            </div>

            {/* Work Classification Distribution */}
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: 'var(--admin-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="clipboardList" size={18} color="var(--admin-orange)" />
                <span>Work Classification</span>
                <span
                  onClick={() => navigate('/task-router')}
                  style={{
                    fontSize: 12,
                    color: 'var(--admin-orange)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  View
                  <Icon name="arrowRight" size={12} color="var(--admin-orange)" />
                </span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'H0', label: 'Human Judgement', color: 'var(--admin-orange)' },
                  { key: 'H1', label: 'Human + Agent', color: 'var(--admin-amber)' },
                  { key: 'A1', label: 'Specialist AI', color: 'var(--admin-purple)' },
                  { key: 'A2', label: 'Low-Cost AI', color: 'var(--admin-blue)' },
                  { key: 'S', label: 'Deterministic', color: 'var(--admin-emerald)' },
                  { key: 'X', label: 'Eliminate', color: 'var(--admin-red)' },
                ].map(({ key, label, color }) => {
                  const count = tasks.byClass?.[key] ?? 0;
                  const pct = tasks.total > 0 ? (count / tasks.total) * 100 : 0;
                  return (
                    <div key={key}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 2,
                        }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--admin-text)' }}>
                          {key} — {label}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                          {count}
                        </span>
                      </div>
                      <div
                        style={{ height: 6, backgroundColor: 'var(--admin-card)', borderRadius: 3 }}
                      >
                        <div
                          style={{
                            height: 6,
                            width: `${pct}%`,
                            backgroundColor: color,
                            borderRadius: 3,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Risk Level Distribution + Capacity Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {/* Risk Level Distribution */}
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: 'var(--admin-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="shield" size={18} color="var(--admin-red)" />
                <span>Approval Pipeline</span>
                <span
                  onClick={() => navigate('/risk-engine')}
                  style={{
                    fontSize: 12,
                    color: 'var(--admin-orange)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  View
                  <Icon name="arrowRight" size={12} color="var(--admin-orange)" />
                </span>
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { key: 'pending', label: 'Pending', color: 'var(--admin-amber)' },
                  { key: 'approved', label: 'Approved', color: 'var(--admin-emerald)' },
                  { key: 'rejected', label: 'Rejected', color: 'var(--admin-red)' },
                  { key: 'revoked', label: 'Revoked', color: 'var(--admin-grey)' },
                ].map(({ key, label, color }) => {
                  const count = risk.byRiskLevel?.[key] ?? 0;
                  return (
                    <div
                      key={key}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 10,
                        border: `1px solid ${color}30`,
                        backgroundColor: `${color}08`,
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: 20, fontWeight: 700, color }}>{count}</p>
                      <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Capacity Summary */}
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: 'var(--admin-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="clock" size={18} color="var(--admin-amber)" />
                <span>Capacity Summary</span>
                <span
                  onClick={() => navigate('/capacity-ledger')}
                  style={{
                    fontSize: 12,
                    color: 'var(--admin-orange)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  View
                  <Icon name="arrowRight" size={12} color="var(--admin-orange)" />
                </span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div
                  style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--admin-darker)' }}
                >
                  <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Hours Released</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-emerald)' }}>
                    {capacity.totalHoursReleased}h
                  </p>
                </div>
                <div
                  style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--admin-darker)' }}
                >
                  <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                    Headcount Avoided
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-blue)' }}>
                    {capacity.headcountAvoided}
                  </p>
                </div>
                <div
                  style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--admin-darker)' }}
                >
                  <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                    Workflows Tracked
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-orange)' }}>
                    {capacity.totalEntries}
                  </p>
                </div>
                <div
                  style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--admin-darker)' }}
                >
                  <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                    Pending Approvals
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-amber)' }}>
                    {risk.approvalRequiredCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function SummaryCard({
  title,
  value,
  subtitle,
  color,
  status,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid var(--admin-card)',
        backgroundColor: 'var(--admin-surface)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${color}40`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--admin-card)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <p style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{title}</p>
        <StatusDot status={status} />
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>{subtitle}</p>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid var(--admin-surface)',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--admin-text)' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
