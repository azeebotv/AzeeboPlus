import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/Icons';
import { apiFetch } from '@/lib/api/base';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface ServiceHealth {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastCheck: number;
  dbStatus?: 'up' | 'down' | 'unknown';
  /** Which loopback transport answered (backend tries localhost → [::1] →
   * 127.0.0.1). 'ipv6' means a ::1-only listener — healthy, not an outage. */
  transport?: 'localhost' | 'ipv6' | 'ipv4';
  /** 'down' only: last transport failure code (e.g. ECONNREFUSED). */
  errorDetail?: string;
}

interface HealthSnapshot {
  timestamp: number;
  services: ServiceHealth[];
  healthy: number;
  total: number;
}

/* ── Service Registry ──────────────────────────────────────────────────────── */

interface ServiceDef {
  name: string;
  port: number;
  description: string;
}

interface ServiceCategory {
  name: string;
  icon: string;
  services: ServiceDef[];
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    name: 'Core',
    icon: 'database',
    services: [
      { name: 'auth-service', port: 3000, description: 'Authentication & JWT' },
      { name: 'user-service', port: 3001, description: 'User profiles & preferences' },
      { name: 'wallet-service', port: 3002, description: 'Wallets & balances' },
      { name: 'payment-service', port: 3003, description: 'Payment processing' },
      { name: 'content-service', port: 3004, description: 'Content management' },
      { name: 'search-service', port: 3005, description: 'Full-text search' },
      { name: 'media-service', port: 3019, description: 'Media uploads & CDN' },
      { name: 'knowledge-service', port: 3020, description: 'Knowledge base & articles' },
    ],
  },
  {
    name: 'Engagement',
    icon: 'flame',
    services: [
      { name: 'notification-service', port: 3006, description: 'Push, email, SMS' },
      { name: 'reward-service', port: 3007, description: 'Points & rewards' },
      { name: 'engagement-service', port: 3023, description: 'Likes, comments, shares' },
      { name: 'messaging-service', port: 3024, description: 'Direct messaging' },
      { name: 'referral-service', port: 3025, description: 'Referral programs' },
      { name: 'subscription-service', port: 3026, description: 'Subscriptions & billing' },
    ],
  },
  {
    name: 'Intelligence',
    icon: 'brain',
    services: [
      { name: 'analytics-service', port: 3008, description: 'Event tracking & metrics' },
      { name: 'recommendation-service', port: 3009, description: 'ML recommendations' },
    ],
  },
  {
    name: 'Universes',
    icon: 'globe',
    services: [
      { name: 'reality-service', port: 3010, description: 'Reality shows' },
      { name: 'movie-service', port: 3011, description: 'Movies & film' },
      { name: 'comedy-service', port: 3012, description: 'Comedy content' },
      { name: 'games-service', port: 3014, description: 'Gaming' },
      { name: 'lifestyle-service', port: 3016, description: 'Lifestyle content' },
      { name: 'vertical-service', port: 3017, description: 'Vertical short-form' },
      { name: 'creator-service', port: 3018, description: 'Creator tools & dashboard' },
      { name: 'sports-service', port: 3021, description: 'Sports content' },
      { name: 'live-event-service', port: 3027, description: 'Live streaming events' },
    ],
  },
  {
    name: 'Operations',
    icon: 'settings',
    services: [
      { name: 'queue-service', port: 3015, description: 'Background job processing' },
      { name: 'moderation-service', port: 3022, description: 'Content moderation' },
      { name: 'support-service', port: 3028, description: 'Support tickets' },
    ],
  },
  {
    name: 'Gateway',
    icon: 'network',
    services: [{ name: 'api-gateway', port: 3013, description: 'API routing & rate limiting' }],
  },
];

const ALL_SERVICES: ServiceDef[] = SERVICE_CATEGORIES.flatMap((cat) => cat.services);

/* ── Health Check Hook ─────────────────────────────────────────────────────── */

function useHealthMonitor() {
  const historyRef = useRef<HealthSnapshot[]>([]);
  const [history, setHistory] = useState<HealthSnapshot[]>([]);

  const fetchHealth = useCallback(async (): Promise<ServiceHealth[]> => {
    // Probed server-side via the admin backend — the browser never dials
    // localhost:30xx (those hostnames only resolve where the services run).
    const res = await apiFetch<{
      services: Array<{
        name: string;
        port: number;
        status: ServiceHealth['status'];
        latencyMs: number;
        dbStatus: NonNullable<ServiceHealth['dbStatus']>;
        transport?: ServiceHealth['transport'];
        errorDetail?: string;
      }>;
      checkedAt: string;
    }>('/api/v1/admin/ops/services');
    if (!res.success || !res.data) return [];
    // services array guard: a backend envelope drift must render an empty
    // grid, not crash the monitor loop.
    const services = Array.isArray(res.data.services) ? res.data.services : [];
    const results: ServiceHealth[] = services.map((s) => ({
      name: s.name,
      port: s.port,
      status: s.status,
      latency: s.latencyMs,
      lastCheck: Date.now(),
      dbStatus: s.dbStatus,
      ...(s.transport !== undefined && { transport: s.transport }),
      ...(s.errorDetail !== undefined && { errorDetail: s.errorDetail }),
    }));

    const snapshot: HealthSnapshot = {
      timestamp: Date.now(),
      services: results,
      healthy: results.filter((s) => s.status === 'healthy').length,
      total: results.length,
    };

    historyRef.current = [...historyRef.current.slice(-59), snapshot];
    setHistory([...historyRef.current]);

    return results;
  }, []);

  const query = useQuery({
    queryKey: ['admin', 'service-health-monitor'],
    queryFn: fetchHealth,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const services = query.data ?? [];
  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const totalCount = ALL_SERVICES.length;

  // Calculate uptime from history
  const uptimeMap = new Map<string, number>();
  if (historyRef.current.length > 1) {
    for (const svc of ALL_SERVICES) {
      let upCount = 0;
      for (const snap of historyRef.current) {
        const found = snap.services.find((s) => s.name === svc.name);
        if (found?.status === 'healthy') upCount++;
      }
      uptimeMap.set(svc.name, Math.round((upCount / historyRef.current.length) * 100));
    }
  }

  // Track status transitions
  const transitionsRef = useRef<Array<{ name: string; from: string; to: string; time: number }>>(
    []
  );
  const prevServicesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    for (const svc of services) {
      const prev = prevServicesRef.current.get(svc.name);
      if (prev && prev !== svc.status) {
        transitionsRef.current = [
          { name: svc.name, from: prev, to: svc.status, time: Date.now() },
          ...transitionsRef.current.slice(0, 49),
        ];
      }
      prevServicesRef.current.set(svc.name, svc.status);
    }
  }, [services]);

  return {
    services,
    healthyCount,
    totalCount,
    uptimeMap,
    history,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    lastFetch: query.dataUpdatedAt,
    transitions: transitionsRef.current,
    refetch: query.refetch,
  };
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export default function ServiceHealthPage() {
  const {
    services,
    healthyCount,
    totalCount,
    uptimeMap,
    history,
    isLoading,
    isFetching,
    lastFetch,
    transitions,
    refetch,
  } = useHealthMonitor();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const overallStatus =
    healthyCount === totalCount ? 'healthy' : healthyCount > totalCount * 0.8 ? 'degraded' : 'down';
  const avgLatency =
    services.length > 0
      ? Math.round(services.reduce((a, s) => a + s.latency, 0) / services.length)
      : 0;
  const downServices = services.filter((s) => s.status === 'down');

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
            <Icon name="activity" size={28} />
            Service Health Dashboard
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            Real-time monitoring of all {totalCount} backend services
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => {
              setAutoRefresh(!autoRefresh);
              if (!autoRefresh) refetch();
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${autoRefresh ? 'rgba(16,185,129,0.25)' : 'var(--admin-surface)'}`,
              backgroundColor: autoRefresh ? 'rgba(16,185,129,0.06)' : 'transparent',
              color: autoRefresh ? 'var(--admin-emerald)' : 'var(--admin-text-muted)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name={autoRefresh ? 'pause' : 'play'} size={14} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={() => refetch()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-surface)',
              backgroundColor: 'transparent',
              color: 'var(--admin-text-muted)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name="refresh" size={14} />
            Refresh now
          </button>
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${STATUS_COLORS[overallStatus]}30`,
              backgroundColor: `${STATUS_COLORS[overallStatus]}10`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <StatusDot status={overallStatus} />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: STATUS_COLORS[overallStatus],
                textTransform: 'capitalize',
              }}
            >
              {overallStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <SummaryCard
          title="Services Healthy"
          value={`${healthyCount}/${totalCount}`}
          icon="checkCircle"
          color="#10B981"
          subtitle={
            downServices.length > 0 ? `${downServices.length} down` : 'All systems operational'
          }
        />
        <SummaryCard
          title="Avg Response Time"
          value={`${avgLatency}ms`}
          icon="clock"
          color={
            avgLatency < 200
              ? 'var(--admin-emerald)'
              : avgLatency < 500
                ? 'var(--admin-amber)'
                : 'var(--admin-red)'
          }
          subtitle="Across all services"
        />
        <SummaryCard
          title="Uptime (session)"
          value={history.length > 0 ? `${Math.round((healthyCount / totalCount) * 100)}%` : '--'}
          icon="trending"
          color="#3B82F6"
          subtitle={`${history.length} check${history.length !== 1 ? 's' : ''} recorded`}
        />
        <SummaryCard
          title="Status Changes"
          value={transitions.length}
          icon="alertTriangle"
          color={transitions.length > 0 ? 'var(--admin-amber)' : 'var(--admin-emerald)'}
          subtitle={transitions.length > 0 ? 'Transitions detected' : 'No transitions'}
        />
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 120,
                borderRadius: 16,
                backgroundColor: 'var(--admin-surface)',
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Service Categories */}
          {SERVICE_CATEGORIES.map((category) => {
            const catServices = services.filter((s: ServiceHealth) =>
              category.services.some((cs: ServiceDef) => cs.name === s.name)
            );
            const catHealthy = catServices.filter(
              (s: ServiceHealth) => s.status === 'healthy'
            ).length;

            return (
              <div key={category.name} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon name={category.icon} size={18} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                    {category.name}
                  </h2>
                  <span
                    style={{
                      fontSize: 12,
                      color:
                        catHealthy === category.services.length
                          ? 'var(--admin-emerald)'
                          : 'var(--admin-amber)',
                      marginLeft: 8,
                    }}
                  >
                    {catHealthy}/{category.services.length}
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 12,
                  }}
                >
                  {category.services.map((svcDef: ServiceDef) => {
                    const svc = services.find((s: ServiceHealth) => s.name === svcDef.name);
                    const status: 'healthy' | 'degraded' | 'down' = svc?.status ?? 'down';
                    const isExpanded = expanded === svcDef.name;
                    const uptime = uptimeMap.get(svcDef.name);

                    return (
                      <div
                        key={svcDef.name}
                        onClick={() => setExpanded(isExpanded ? null : svcDef.name)}
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          border: `1px solid ${STATUS_COLORS[status]}20`,
                          backgroundColor: `${STATUS_COLORS[status]}06`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = `${STATUS_COLORS[status]}40`;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `${STATUS_COLORS[status]}20`;
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Service Header */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StatusDot status={status} />
                            <span
                              style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text)' }}
                            >
                              {svcDef.name}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                            :{svcDef.port}
                          </span>
                        </div>

                        {/* Description */}
                        <p
                          style={{
                            fontSize: 12,
                            color: 'var(--admin-text-muted)',
                            marginBottom: 8,
                          }}
                        >
                          {svcDef.description}
                        </p>

                        {/* Metrics Row */}
                        <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                          <span style={{ color: 'var(--admin-text-muted)' }}>
                            Latency:{' '}
                            <span
                              style={{
                                color: svc?.latency
                                  ? svc.latency < 200
                                    ? 'var(--admin-emerald)'
                                    : svc.latency < 500
                                      ? 'var(--admin-amber)'
                                      : 'var(--admin-red)'
                                  : 'var(--admin-text-muted)',
                                fontWeight: 600,
                              }}
                            >
                              {svc?.latency ? `${svc.latency}ms` : '--'}
                            </span>
                          </span>
                          {uptime !== undefined && (
                            <span style={{ color: 'var(--admin-text-muted)' }}>
                              Uptime:{' '}
                              <span
                                style={{
                                  color:
                                    uptime >= 99
                                      ? 'var(--admin-emerald)'
                                      : uptime >= 95
                                        ? 'var(--admin-amber)'
                                        : 'var(--admin-red)',
                                  fontWeight: 600,
                                }}
                              >
                                {uptime}%
                              </span>
                            </span>
                          )}{' '}
                          {svc?.dbStatus && (
                            <span style={{ color: 'var(--admin-text-muted)' }}>
                              DB:{' '}
                              <span
                                style={{
                                  color:
                                    svc.dbStatus === 'up'
                                      ? 'var(--admin-emerald)'
                                      : 'var(--admin-red)',
                                  fontWeight: 600,
                                }}
                              >
                                {svc.dbStatus}
                              </span>
                            </span>
                          )}
                          {svc?.transport && svc.transport !== 'localhost' && (
                            <span
                              style={{ color: 'var(--admin-amber)' }}
                              title={
                                svc.transport === 'ipv6'
                                  ? 'Answered on [::1] — an IPv6-only listener (IPv4 dials are refused). Healthy; noted so a refused 127.0.0.1 probe is never mistaken for an outage.'
                                  : 'Answered on 127.0.0.1 — an IPv4-only listener.'
                              }
                            >
                              {svc.transport === 'ipv6' ? 'IPv6-only' : 'IPv4-only'}
                            </span>
                          )}
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: 12,
                              paddingTop: 12,
                              borderTop: `1px solid ${STATUS_COLORS[status]}15`,
                            }}
                          >
                            <div
                              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
                            >
                              <DetailItem label="Port" value={String(svcDef.port)} />
                              <DetailItem
                                label="Status"
                                value={status}
                                color={STATUS_COLORS[status]}
                              />
                              <DetailItem
                                label="Latency"
                                value={svc?.latency ? `${svc.latency}ms` : 'N/A'}
                              />
                              <DetailItem label="DB" value={svc?.dbStatus ?? 'N/A'} />
                              <DetailItem
                                label="Transport"
                                value={
                                  svc?.transport
                                    ? svc.transport === 'localhost'
                                      ? 'dual-stack (localhost)'
                                      : svc.transport === 'ipv6'
                                        ? 'IPv6 only ([::1])'
                                        : 'IPv4 only (127.0.0.1)'
                                    : svc?.status === 'down'
                                      ? `unreachable${svc?.errorDetail ? ` (${svc.errorDetail})` : ''}`
                                      : 'N/A'
                                }
                              />
                              {uptime !== undefined && (
                                <DetailItem label="Session Uptime" value={`${uptime}%`} />
                              )}
                              <DetailItem
                                label="Last Check"
                                value={
                                  svc?.lastCheck
                                    ? new Date(svc.lastCheck).toLocaleTimeString()
                                    : 'N/A'
                                }
                              />
                            </div>
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 11,
                                color: 'var(--admin-text-muted)',
                              }}
                            >
                              Health:{' '}
                              <code style={{ color: 'var(--admin-text-muted)' }}>
                                http://localhost:{svcDef.port}
                                {svcDef.name === 'live-event-service' ? '/health' : '/v1/health'}
                              </code>
                              {' — probed as localhost → [::1] → 127.0.0.1 until one answers'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Recent Status Transitions */}
          {transitions.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="alertTriangle" size={18} />
                Recent Status Changes
              </h2>
              <div
                style={{
                  borderRadius: 12,
                  border: '1px solid var(--admin-card)',
                  overflow: 'hidden',
                }}
              >
                {transitions.slice(0, 10).map((t, i) => (
                  <div
                    key={`${t.name}-${t.time}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      backgroundColor: i % 2 === 0 ? 'var(--admin-card)' : 'transparent',
                      borderBottom: i < 9 ? '1px solid var(--admin-card)' : 'none',
                    }}
                  >
                    <StatusDot status={t.to as 'healthy' | 'degraded' | 'down'} />
                    <span
                      style={{ fontSize: 13, color: 'var(--admin-text)', fontWeight: 500, flex: 1 }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          STATUS_COLORS[t.from as keyof typeof STATUS_COLORS] ??
                          'var(--admin-text-muted)',
                      }}
                    >
                      {t.from}
                    </span>
                    <Icon name="arrowRight" size={12} color="var(--admin-text-muted)" />
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          STATUS_COLORS[t.to as keyof typeof STATUS_COLORS] ??
                          'var(--admin-text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {t.to}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                      {new Date(t.time).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latency Sparkline */}
          {history.length > 1 && (
            <div style={{ marginTop: 32 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="trending" size={18} />
                Latency History
              </h2>
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              >
                <LatencyChart history={history} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: '1px solid var(--admin-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--admin-text-muted)',
        }}
      >
        <span>
          {isFetching
            ? 'Checking...'
            : `Last checked: ${lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'never'}`}
        </span>
        <span>{history.length} snapshots recorded this session</span>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

const STATUS_COLORS = {
  healthy: 'var(--admin-emerald)',
  degraded: 'var(--admin-amber)',
  down: 'var(--admin-red)',
} as const;

function StatusDot({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  return (
    <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: STATUS_COLORS[status],
        }}
      />
      {status === 'healthy' && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: `2px solid ${STATUS_COLORS.healthy}40`,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: `1px solid ${color}20`,
        backgroundColor: `${color}06`,
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
        <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{title}</span>
        <Icon name={icon} size={16} />
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 4 }}>{subtitle}</p>
    </div>
  );
}

function DetailItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '6px 0' }}>
      <p
        style={{
          fontSize: 10,
          color: 'var(--admin-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, color: color ?? 'var(--admin-text)' }}>{value}</p>
    </div>
  );
}

function LatencyChart({ history }: { history: HealthSnapshot[] }) {
  if (history.length < 2) return null;

  const maxLatency = Math.max(
    ...history.map((h) => Math.max(...h.services.map((s) => s.latency))),
    100
  );
  const width = 800;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate average latency per snapshot
  const points = history.map((snap, i) => {
    const avg = snap.services.reduce((a, s) => a + s.latency, 0) / snap.services.length;
    return {
      x: padding.left + (i / (history.length - 1)) * chartWidth,
      y: padding.top + chartHeight - (avg / maxLatency) * chartHeight,
      avg: Math.round(avg),
      healthy: snap.healthy,
      total: snap.total,
    };
  });

  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return null;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${last.x} ${padding.top + chartHeight} L ${first.x} ${padding.top + chartHeight} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: height }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
      `}</style>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
        <g key={pct}>
          <line
            x1={padding.left}
            y1={padding.top + chartHeight * (1 - pct)}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight * (1 - pct)}
            stroke="var(--admin-border)"
            strokeWidth={1}
          />
          <text
            x={padding.left - 8}
            y={padding.top + chartHeight * (1 - pct) + 4}
            textAnchor="end"
            fontSize={10}
            fill="#6B5A4A"
          >
            {Math.round(maxLatency * pct)}ms
          </text>
        </g>
      ))}
      {/* Area fill */}
      <path d={areaD} fill="url(#latencyGradient)" opacity={0.3} />
      {/* Line */}{' '}
      <path
        d={pathD}
        fill="none"
        stroke="#E8420A"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={p.healthy === p.total ? 'var(--admin-emerald)' : 'var(--admin-amber)'}
          stroke="#1A0A0A"
          strokeWidth={1}
        />
      ))}
      {/* Gradient definition */}
      <defs>
        <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8420A" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#E8420A" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}
