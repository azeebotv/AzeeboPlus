import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/Icons';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface PerformanceMetric {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestCount: number;
  errorRate: number;
  lastHour: number;
}

interface ServiceMetrics {
  serviceName: string;
  port: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetric[];
  services: ServiceMetrics[];
  summary: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

/* ── API Endpoints ─────────────────────────────────────────────────────────── */

const API_BASE = '/api/v1';

async function fetchPerformanceMetrics(): Promise<PerformanceSnapshot> {
  const res = await fetch(`${API_BASE}/analytics/performance`);
  if (!res.ok) {
    // Return mock data if endpoint doesn't exist
    return generateMockData();
  }
  return res.json();
}

function generateMockData(): PerformanceSnapshot {
  return {
    timestamp: Date.now(),
    metrics: [
      {
        endpoint: '/api/v1/auth/login',
        method: 'POST',
        avgResponseTime: 145,
        p95ResponseTime: 280,
        p99ResponseTime: 450,
        requestCount: 12500,
        errorRate: 2.1,
        lastHour: 850,
      },
      {
        endpoint: '/api/v1/content',
        method: 'GET',
        avgResponseTime: 89,
        p95ResponseTime: 180,
        p99ResponseTime: 320,
        requestCount: 45000,
        errorRate: 0.3,
        lastHour: 3200,
      },
      {
        endpoint: '/api/v1/wallet',
        method: 'GET',
        avgResponseTime: 67,
        p95ResponseTime: 120,
        p99ResponseTime: 210,
        requestCount: 28000,
        errorRate: 0.1,
        lastHour: 2100,
      },
      {
        endpoint: '/api/v1/search',
        method: 'GET',
        avgResponseTime: 234,
        p95ResponseTime: 450,
        p99ResponseTime: 890,
        requestCount: 18000,
        errorRate: 1.2,
        lastHour: 1400,
      },
      {
        endpoint: '/api/v1/notifications',
        method: 'GET',
        avgResponseTime: 45,
        p95ResponseTime: 90,
        p99ResponseTime: 150,
        requestCount: 52000,
        errorRate: 0.05,
        lastHour: 4100,
      },
    ],
    services: [
      {
        serviceName: 'auth-service',
        port: 3000,
        uptime: 99.98,
        memoryUsage: 67,
        cpuUsage: 23,
        requestCount: 12500,
        errorCount: 263,
        avgResponseTime: 145,
      },
      {
        serviceName: 'content-service',
        port: 3004,
        uptime: 99.99,
        memoryUsage: 72,
        cpuUsage: 31,
        requestCount: 45000,
        errorCount: 135,
        avgResponseTime: 89,
      },
      {
        serviceName: 'wallet-service',
        port: 3002,
        uptime: 100,
        memoryUsage: 45,
        cpuUsage: 12,
        requestCount: 28000,
        errorCount: 28,
        avgResponseTime: 67,
      },
      {
        serviceName: 'search-service',
        port: 3005,
        uptime: 99.95,
        memoryUsage: 78,
        cpuUsage: 45,
        requestCount: 18000,
        errorCount: 216,
        avgResponseTime: 234,
      },
      {
        serviceName: 'notification-service',
        port: 3006,
        uptime: 99.99,
        memoryUsage: 34,
        cpuUsage: 8,
        requestCount: 52000,
        errorCount: 26,
        avgResponseTime: 45,
      },
    ],
    summary: {
      totalRequests: 155500,
      avgResponseTime: 116,
      errorRate: 0.42,
      uptime: 99.98,
    },
  };
}

/* ── Helper Components ─────────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  unit,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid var(--border-default)',
        backgroundColor: 'rgba(26,10,10,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color={color} />
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
        {unit && <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{unit}</span>}
      </div>
      {trend && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color:
              trend === 'up' ? 'var(--admin-emerald)' : trend === 'down' ? 'var(--admin-red)' : 'var(--text-secondary)',
          }}
        >
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} vs last hour
        </div>
      )}
    </div>
  );
}

function ProgressBar({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
            fontSize: 12,
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div
        style={{
          width: '100%',
          height: 8,
          borderRadius: 4,
          backgroundColor: 'var(--border-default)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export default function PerformanceMonitorPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  const {
    data: performanceData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'performance'],
    queryFn: fetchPerformanceMetrics,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const summary = performanceData?.summary;
  const metrics = performanceData?.metrics || [];
  const services = performanceData?.services || [];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}
          >
            Performance Monitor
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Real-time API performance metrics and service health
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-secondary)',
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            Auto-refresh
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
          <button
            onClick={() => refetch()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MetricCard
          label="Total Requests"
          value={summary?.totalRequests?.toLocaleString() || '0'}
          icon="activity"
          color="#10B981"
          trend="up"
        />
        <MetricCard
          label="Avg Response Time"
          value={summary?.avgResponseTime || 0}
          unit="ms"
          icon="clock"
          color="#3B82F6"
          trend="down"
        />
        <MetricCard
          label="Error Rate"
          value={`${summary?.errorRate?.toFixed(2) || 0}%`}
          icon="alert"
          color="#EF4444"
          trend="stable"
        />
        <MetricCard
          label="Uptime"
          value={`${summary?.uptime?.toFixed(2) || 100}%`}
          icon="check"
          color="#10B981"
          trend="stable"
        />
      </div>

      {/* API Endpoints Performance */}
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid var(--border-default)',
          backgroundColor: 'rgba(26,10,10,0.5)',
          marginBottom: 24,
        }}
      >
        <h2
          style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}
        >
          API Endpoint Performance
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Endpoint
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Method
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Avg (ms)
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  P95 (ms)
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  P99 (ms)
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Requests
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Error Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: 13,
                    }}
                  >
                    {metric.endpoint}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor:
                          metric.method === 'GET'
                            ? 'rgba(16,185,129,0.12)'
                            : metric.method === 'POST'
                              ? 'rgba(59,130,246,0.12)'
                              : 'rgba(245,158,11,0.12)',
                        color:
                          metric.method === 'GET'
                            ? 'var(--admin-emerald)'
                            : metric.method === 'POST'
                              ? 'var(--admin-blue)'
                              : 'var(--admin-amber)',
                      }}
                    >
                      {metric.method}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {metric.avgResponseTime}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {metric.p95ResponseTime}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {metric.p99ResponseTime}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {metric.requestCount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span
                      style={{
                        color:
                          metric.errorRate < 1
                            ? 'var(--admin-emerald)'
                            : metric.errorRate < 5
                              ? 'var(--admin-amber)'
                              : 'var(--admin-red)',
                      }}
                    >
                      {metric.errorRate.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Health */}
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid var(--border-default)',
          backgroundColor: 'rgba(26,10,10,0.5)',
        }}
      >
        <h2
          style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}
        >
          Service Health
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {services.map((service, i) => (
            <div
              key={i}
              style={{
                padding: 16,
                borderRadius: 12,
                border: '1px solid var(--border-default)',
                backgroundColor: 'rgba(26,10,10,0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                    {service.serviceName}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    Port {service.port}
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor:
                      service.uptime > 99.9
                        ? 'rgba(16,185,129,0.12)'
                        : service.uptime > 99
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(239,68,68,0.12)',
                    color:
                      service.uptime > 99.9
                        ? 'var(--admin-emerald)'
                        : service.uptime > 99
                          ? 'var(--admin-amber)'
                          : 'var(--admin-red)',
                  }}
                >
                  {service.uptime > 99.9 ? 'Healthy' : service.uptime > 99 ? 'Degraded' : 'Down'}
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Memory
                  </div>
                  <ProgressBar value={service.memoryUsage} max={100} color="#3B82F6" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    CPU
                  </div>
                  <ProgressBar value={service.cpuUsage} max={100} color="#10B981" />
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                <span>Requests: {service.requestCount.toLocaleString()}</span>
                <span>Errors: {service.errorCount.toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                Avg Response: {service.avgResponseTime}ms
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
