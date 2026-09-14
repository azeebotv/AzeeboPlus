import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { OpsStatus, OpsCheck } from '@/lib/api/admin';
import { Icon } from '@/components/Icons';

/** Dot + color for a check's ok flag. */
const statusDot = (ok: boolean) => ({
  dot: ok ? 'var(--admin-emerald)' : 'var(--admin-red)',
  text: ok ? 'OK' : 'FAIL',
});

const OVERALL: Record<OpsStatus['overall'], { label: string; color: string; bg: string }> = {
  healthy: {
    label: 'All systems healthy',
    color: 'var(--admin-emerald)',
    bg: 'rgba(16,185,129,0.15)',
  },
  degraded: {
    label: 'Degraded — check the cards below',
    color: 'var(--admin-amber)',
    bg: 'rgba(245,158,11,0.15)',
  },
  down: {
    label: 'Something is down — act now',
    color: 'var(--admin-red)',
    bg: 'rgba(204,28,28,0.18)',
  },
};

const ageLabel = (minutes?: number) => {
  if (minutes === undefined) return '';
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  return h < 24 ? `${h}h ${minutes % 60}m ago` : `${Math.floor(h / 24)}d ${h % 24}h ago`;
};

function CheckCard({ check, icon }: { check: OpsCheck; icon: string }) {
  const s = statusDot(check.ok);
  return (
    <div
      style={{
        flex: '1 1 220px',
        border: '1px solid var(--admin-surface)',
        borderRadius: 14,
        backgroundColor: 'rgba(26,10,10,0.5)',
        padding: '16px 18px',
        minWidth: 220,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name={icon} size={16} color={s.dot} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{check.label}</span>
        <span
          style={{
            marginLeft: 'auto',
            width: 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: s.dot,
          }}
          title={s.text}
        />
      </div>
      <div
        style={{
          color: check.ok ? 'var(--admin-text-muted)' : 'var(--admin-red)',
          fontSize: 13,
          lineHeight: 1.4,
        }}
      >
        {check.detail}
      </div>
      <div
        style={{
          color: 'var(--admin-text-muted)',
          fontSize: 11,
          marginTop: 8,
          display: 'flex',
          gap: 10,
        }}
      >
        {check.latencyMs !== undefined && <span>{check.latencyMs} ms</span>}
        {check.ageMinutes !== undefined && <span>last pass {ageLabel(check.ageMinutes)}</span>}
      </div>
    </div>
  );
}

export default function OpsPage() {
  const [since, setSince] = useState<number | null>(null);
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'ops-status'],
    queryFn: async () => {
      const res = await adminApi.getOpsStatus();
      return res.success ? (res.data as OpsStatus) : null;
    },
    refetchInterval: 30_000, // jobs run hourly; a 30s glance window is plenty
  });

  if (isLoading || !data) {
    return (
      <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 60 }}>
        Loading ops status...
      </p>
    );
  }

  const overall = OVERALL[data.overall];
  const cutoff = since ? Date.now() - since * 60 * 60 * 1000 : 0;
  const alerts = data.alerts.filter((a) => new Date(a.at).getTime() >= cutoff);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 6,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Ops Health</h1>
        <span
          style={{
            padding: '4px 14px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: overall.color,
            background: overall.bg,
          }}
        >
          {overall.label}
        </span>
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginLeft: 'auto' }}>
          auto-refreshes every 30s · checked {new Date(dataUpdatedAt).toLocaleTimeString()}
        </span>
      </div>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 24 }}>
        Live probes: admin database, federation (cross-DB join), and the two scheduled jobs' last
        passes.
      </p>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <CheckCard check={data.db} icon="activity" />
        <CheckCard check={data.federation} icon="refresh" />
        {data.jobs.map((j) => (
          <CheckCard key={j.label} check={j} icon="clock" />
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent alerts</h2>
        {(
          [
            { label: 'All time', h: null },
            { label: '24h', h: 24 },
            { label: '7d', h: 24 * 7 },
          ] as const
        ).map((r) => (
          <button
            key={r.label}
            onClick={() => setSince(r.h)}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              border: since === r.h ? 'none' : '1px solid var(--admin-surface)',
              background: since === r.h ? 'var(--admin-orange)' : 'transparent',
              color: since === r.h ? 'white' : 'var(--admin-text-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div
        style={{
          borderRadius: 16,
          border: '1px solid var(--admin-surface)',
          backgroundColor: 'rgba(26,10,10,0.5)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={`${a.at}-${i}`} style={{ borderBottom: '1px solid var(--admin-bg)' }}>
                <td
                  style={{
                    padding: '10px 16px',
                    color: 'var(--admin-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {new Date(a.at).toLocaleString()}
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      color: a.level === 'ERROR' ? 'var(--admin-red)' : 'var(--admin-amber)',
                      background:
                        a.level === 'ERROR' ? 'rgba(204,28,28,0.2)' : 'rgba(245,158,11,0.15)',
                    }}
                  >
                    {a.level}
                  </span>
                </td>
                <td
                  style={{
                    padding: '10px 8px',
                    color: 'var(--admin-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.source}
                </td>
                <td
                  style={{
                    padding: '10px 16px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 480,
                  }}
                >
                  {a.message}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{ textAlign: 'center', padding: 32, color: 'var(--admin-text-muted)' }}
                >
                  No alerts in this window — jobs are passing clean.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
