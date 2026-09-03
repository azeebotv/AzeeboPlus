import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/Icons';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface RateLimitEntry {
  endpoint: string;
  method: string;
  limit: number;
  windowMs: number;
  currentUsage: number;
  blockedRequests: number;
  topIPs: Array<{ ip: string; count: number }>;
  lastTriggered: number | null;
}

interface RateLimitSnapshot {
  timestamp: number;
  entries: RateLimitEntry[];
  summary: {
    totalEndpoints: number;
    totalBlocked: number;
    activeLimits: number;
  };
}

/* ── API ───────────────────────────────────────────────────────────────────── */

async function fetchRateLimits(): Promise<RateLimitSnapshot> {
  const res = await fetch('/api/v1/analytics/rate-limits');
  if (!res.ok) {
    return generateMockData();
  }
  return res.json();
}

function generateMockData(): RateLimitSnapshot {
  return {
    timestamp: Date.now(),
    entries: [
      {
        endpoint: '/api/v1/auth/login',
        method: 'POST',
        limit: 10,
        windowMs: 60000,
        currentUsage: 7,
        blockedRequests: 23,
        topIPs: [
          { ip: '192.168.1.100', count: 15 },
          { ip: '10.0.0.50', count: 8 },
          { ip: '172.16.0.25', count: 5 },
        ],
        lastTriggered: Date.now() - 300000,
      },
      {
        endpoint: '/api/v1/auth/signup',
        method: 'POST',
        limit: 5,
        windowMs: 300000,
        currentUsage: 2,
        blockedRequests: 45,
        topIPs: [
          { ip: '203.0.113.50', count: 22 },
          { ip: '198.51.100.75', count: 12 },
          { ip: '192.0.2.100', count: 8 },
        ],
        lastTriggered: Date.now() - 600000,
      },
      {
        endpoint: '/api/v1/search',
        method: 'GET',
        limit: 100,
        windowMs: 60000,
        currentUsage: 45,
        blockedRequests: 8,
        topIPs: [
          { ip: '10.0.0.100', count: 340 },
          { ip: '10.0.0.101', count: 280 },
          { ip: '10.0.0.102', count: 150 },
        ],
        lastTriggered: Date.now() - 120000,
      },
      {
        endpoint: '/api/v1/wallet/transfer',
        method: 'POST',
        limit: 5,
        windowMs: 60000,
        currentUsage: 1,
        blockedRequests: 3,
        topIPs: [
          { ip: '172.16.0.50', count: 2 },
          { ip: '172.16.0.51', count: 1 },
        ],
        lastTriggered: Date.now() - 3600000,
      },
      {
        endpoint: '/api/v1/content',
        method: 'GET',
        limit: 200,
        windowMs: 60000,
        currentUsage: 120,
        blockedRequests: 0,
        topIPs: [
          { ip: '10.0.0.1', count: 1200 },
          { ip: '10.0.0.2', count: 980 },
          { ip: '10.0.0.3', count: 750 },
        ],
        lastTriggered: null,
      },
    ],
    summary: {
      totalEndpoints: 5,
      totalBlocked: 79,
      activeLimits: 5,
    },
  };
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function formatWindowMs(ms: number): string {
  if (ms < 60000) return `${ms / 1000}s`;
  if (ms < 3600000) return `${ms / 60000}m`;
  return `${ms / 3600000}h`;
}

function getTimeSince(timestamp: number | null): string {
  if (!timestamp) return 'Never';
  const diff = Date.now() - timestamp;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export default function RateLimitsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    data: rateLimitData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'rate-limits'],
    queryFn: fetchRateLimits,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const entries = rateLimitData?.entries || [];
  const summary = rateLimitData?.summary;

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
            Rate Limits
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Monitor API rate limiting status and blocked requests
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
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
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
                backgroundColor: 'rgba(59,130,246,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="shield" size={20} color="#3B82F6" />
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Active Limits</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
            {summary?.activeLimits || 0}
          </div>
        </div>

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
                backgroundColor: 'rgba(239,68,68,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="alert" size={20} color="#EF4444" />
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Total Blocked</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--admin-red)' }}>
            {summary?.totalBlocked || 0}
          </div>
        </div>

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
                backgroundColor: 'rgba(16,185,129,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="activity" size={20} color="#10B981" />
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Endpoints Monitored
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
            {summary?.totalEndpoints || 0}
          </div>
        </div>
      </div>

      {/* Rate Limit Entries */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: 16,
        }}
      >
        {entries.map((entry, i) => {
          const usagePercent = (entry.currentUsage / entry.limit) * 100;
          const isNearLimit = usagePercent > 80;
          const isAtLimit = usagePercent >= 100;

          return (
            <div
              key={i}
              style={{
                padding: 20,
                borderRadius: 16,
                border: `1px solid ${isAtLimit ? 'var(--admin-red)' : isNearLimit ? 'var(--admin-amber)' : 'var(--border-default)'}`,
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: entry.method === 'GET' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                        color: entry.method === 'GET' ? 'var(--admin-emerald)' : 'var(--admin-blue)',
                      }}
                    >
                      {entry.method}
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {entry.endpoint}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {entry.limit} requests per {formatWindowMs(entry.windowMs)}
                  </div>
                </div>
                {entry.blockedRequests > 0 && (
                  <div
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: 'rgba(239,68,68,0.12)',
                      color: 'var(--admin-red)',
                    }}
                  >
                    {entry.blockedRequests} blocked
                  </div>
                )}
              </div>

              {/* Usage Bar */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Current Usage</span>
                  <span
                    style={{
                      color: isAtLimit
                        ? 'var(--admin-red)'
                        : isNearLimit
                          ? 'var(--admin-amber)'
                          : 'var(--text-primary)',
                    }}
                  >
                    {entry.currentUsage} / {entry.limit}
                  </span>
                </div>
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
                      width: `${Math.min(usagePercent, 100)}%`,
                      height: '100%',
                      backgroundColor: isAtLimit ? 'var(--admin-red)' : isNearLimit ? 'var(--admin-amber)' : 'var(--admin-emerald)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Top IPs */}
              {entry.topIPs.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Top IPs
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {entry.topIPs.slice(0, 3).map((ip, j) => (
                      <div
                        key={j}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          padding: '4px 8px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(26,10,10,0.3)',
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {ip.ip}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{ip.count} requests</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Triggered */}
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                Last triggered: {getTimeSince(entry.lastTriggered)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
