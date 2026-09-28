import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type {
  OpsStatus,
  OpsCheck,
  OpsRunHistory,
  JobRunSummary,
  JobRunDailySummary,
  RunJobOutcome,
  PgbouncerHealth,
  PgbouncerPoolRow,
  OpsServicesSnapshot,
  OpsServiceHealth,
  TransportStoreStatus,
  OpsTransportFlip,
  TransportFlipTrend,
  TransportFlipTrendRow,
  ForeignPersistence,
} from '@/lib/api/admin';
import { Icon } from '@/components/Icons';

/** Dot + color for a check's ok flag. */
const statusDot = (ok: boolean) => ({
  dot: ok ? 'var(--admin-emerald)' : 'var(--admin-red)',
  text: ok ? 'OK' : 'FAIL',
});

/**
 * Loud warning when a service's answering transport changed between probe
 * sweeps — a family flip (::1 ↔ 127.0.0.1) usually means someone re-bound
 * the service: config edit, restart with a different bind address, or a
 * second process stealing the port on the other family. Flips hold on the
 * backend for 10 minutes so polling races can't swallow them; this banner
 * renders whatever is still live. `onDismiss` only hides it client-side —
 * the backend hold still expires on its own.
 */
function TransportMismatchBanner({
  flips,
  onDismiss,
}: {
  flips: OpsTransportFlip[];
  onDismiss: () => void;
}) {
  if (flips.length === 0) return null;
  const familyFlips = flips.filter((f) => f.familyChanged);
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 18px',
        borderRadius: 10,
        border: '1px solid var(--admin-amber)',
        background: 'rgba(245,158,11,0.12)',
        marginBottom: 20,
      }}
    >
      <Icon name="alertTriangle" size={20} color="var(--admin-amber)" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--admin-amber)' }}>
          Transport mismatch detected
          {familyFlips.length > 0 &&
            ` — ${familyFlips.length} service${
              familyFlips.length === 1 ? '' : 's'
            } changed loopback family`}
        </div>
        <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
          {flips.map((f) => (
            <div key={`${f.service}:${f.detectedAt}`}>
              <strong style={{ color: 'var(--admin-text)' }}>{f.service}</strong>: {f.from} → {f.to}{' '}
              {f.familyChanged && (
                <span style={{ color: 'var(--admin-amber)', fontWeight: 600 }}>
                  (family change)
                </span>
              )}{' '}
              —{' '}
              <span title={new Date(f.detectedAt).toISOString()}>
                {new Date(f.detectedAt).toLocaleTimeString()}
              </span>
              {
                ' — usually a re-bind: check for a config edit, a duplicate process on the other family, or a port steal.'
              }
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss transport mismatch warning"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--admin-text-muted)',
          cursor: 'pointer',
          padding: 4,
          fontSize: 16,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

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

/** Which ledger job a card's pass history comes from (undefined = no chart). */
const HISTORY_JOB_BY_LABEL: Record<string, string> = {
  'Freshness job': 'freshness',
  'Audit retention': 'audit-retention',
  'Pool audit': 'pool-audit',
  'Plist watchdog': 'plist-watchdog',
};

const RUN_COLORS: Record<JobRunSummary['runs'][number]['status'], string> = {
  ok: 'var(--admin-emerald)',
  warn: 'var(--admin-amber)',
  error: 'var(--admin-red)',
};

/** Human window label: 168 → "7d", but 24 stays "24h". */
const windowLabel = (h: number) => (h > 24 && h % 24 === 0 ? `${h / 24}d` : `${h}h`);

/** Per-pool color/label for the pgbouncer saturation level. */
const PG_LEVEL: Record<
  NonNullable<PgbouncerHealth['level']>,
  { label: string; color: string; bg: string }
> = {
  ok: { label: 'OK', color: 'var(--admin-emerald)', bg: 'rgba(16,185,129,0.15)' },
  degraded: { label: 'DEGRADED', color: 'var(--admin-amber)', bg: 'rgba(245,158,11,0.15)' },
  critical: { label: 'CRITICAL', color: 'var(--admin-red)', bg: 'rgba(204,28,28,0.18)' },
};

/**
 * Header-chip visuals for the transport store's backing. REDIS (emerald):
 * baselines + hold-window flips are fleet-wide (cross-restart, cross-
 * replica). MEMORY (amber): the store degraded to per-process memory —
 * flips still detect within one replica, but a restart or a second replica
 * loses the history, so degraded is worth seeing at a glance.
 */
const STORE_CHIP: Record<
  TransportStoreStatus['mode'],
  { label: string; color: string; bg: string }
> = {
  redis: { label: 'redis', color: 'var(--admin-emerald)', bg: 'rgba(16,185,129,0.15)' },
  memory: { label: 'memory', color: 'var(--admin-amber)', bg: 'rgba(245,158,11,0.15)' },
};

/** Window choices for the foreign-persistence card's toggle (hours). The
 * service clamps to 6h–14d, so these all pass through untouched. */
const FOREIGN_WINDOW_OPTIONS: Array<{ label: string; hours: number }> = [
  { label: '48h', hours: 48 },
  { label: '7d', hours: 24 * 7 },
  { label: '14d', hours: 24 * 14 },
];

/**
 * Inline per-workspace sparkline: one bar per bucket of flagged passes over
 * the ledger window (oldest → newest, fixed width — every row's buckets are
 * directly comparable). Silent gap = quiet period; bar height scales to the
 * row's own max (so a 1-pass/2h cadence stays visible on a 100-pass row).
 * Pure CSS divs — no chart lib, no per-row SVG, nothing that matters at 6
 * rows on a poll-heavy card.
 */
function PassTrendBars({
  history,
  bucketSeconds,
  windowHours,
}: {
  history: number[];
  bucketSeconds: number;
  windowHours: number;
}) {
  const max = Math.max(...history);
  const label =
    `Flagged passes per ${bucketSeconds >= 3600
      ? `${Math.round(bucketSeconds / 3600)}h`
      : `${Math.round(bucketSeconds / 60)}m`} bucket, ` +
    `last ${windowHours}h (oldest → newest)${
      max === 0
        ? ''
        : ` — peak bucket: ${max} pass${max === 1 ? '' : 'es'}`
    }`;
  return (
    <div
      role="img"
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: 2,
        height: 14,
        verticalAlign: 'middle',
      }}
    >
      {history.map((n, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: Math.max(2, Math.round((n / max) * 14)),
            borderRadius: 1,
            backgroundColor:
              n === 0
                ? 'var(--admin-border-subtle)'
                : n >= max
                  ? 'var(--admin-amber)'
                  : 'var(--admin-text-muted)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Intensity companion to PassTrendBars: one bar per bucket of the row's
 * PEAK recorded connection count (null = no pass in that bucket recorded a
 * count — rendered as a silent stub). Height scales to the row's own peak,
 * so a 2-conn dialer and a 60-conn dialer are both readable; the all-null
 * case (ledger rows from before conns were recorded) degrades to a quiet
 * dash instead of an empty gap. Same pure-CSS approach as the pass
 * sparkline — no chart lib, nothing that matters at 6 rows.
 */
function ConnTrendBars({
  connHistory,
  bucketSeconds,
  windowHours,
}: {
  connHistory: Array<number | null>;
  bucketSeconds: number;
  windowHours: number;
}) {
  const known = connHistory.filter((v): v is number => v !== null);
  const max = known.length > 0 ? Math.max(...known) : 0;
  const label =
    `Peak conns per ${bucketSeconds >= 3600
      ? `${Math.round(bucketSeconds / 3600)}h`
      : `${Math.round(bucketSeconds / 60)}m`} bucket, ` +
    `last ${windowHours}h (oldest → newest)${
      max === 0 ? '' : ` — peak: ${max} conns`
    }`;
  if (max === 0) {
    return (
      <div
        role="img"
        title={label}
        aria-label={label}
        style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}
      >
        —
      </div>
    );
  }
  return (
    <div
      role="img"
      title={label}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: 2,
        height: 14,
        verticalAlign: 'middle',
      }}
    >
      {connHistory.map((v, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: v === null ? 2 : Math.max(2, Math.round((v / max) * 14)),
            borderRadius: 1,
            backgroundColor:
              v === null
                ? 'var(--admin-border-subtle)'
                : v >= max
                  ? 'var(--admin-amber)'
                  : 'var(--admin-text-muted)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * pgbouncer saturation card: client-connection budget against
 * max_client_conn plus the per-database pool breakdown. At ≥95% the
 * pooler refuses new clients — every service sees it as a total DB outage
 * — so this card has its own dedicated alert band (80% warn, 95% critical).
 */
/**
 * Group foreign-persistence rows by attributed project for the card's grouped
 * table, with per-group aggregates for the section headers. `fp.rows` is
 * already sorted (span desc, named groups before path-self groups, workspace
 * name), so groups emerge in display order and rows keep their in-group
 * order. Missing `project` (pre-attribution backend) degrades to the
 * workspace path itself — one row per group, flat table, no crash.
 */
type ForeignRow = ForeignPersistence['rows'][number];

type ForeignGroupAggregates = {
  passes: number;
  peakConns: number;
  sustainedCount: number;
  anySustained: boolean;
};

function groupForeignRowsByProject(rows: ForeignRow[]): Array<[string, ForeignGroupAggregates, ForeignRow[]]> {
  const groups = new Map<string, { aggregates: ForeignGroupAggregates; rows: ForeignRow[] }>();
  for (const row of rows) {
    const project = row.project ?? row.workspace;
    const g = groups.get(project);
    if (g) {
      g.aggregates.passes += row.passes;
      const peak = (row.connHistory ?? []).reduce<number>((m, v) => (v !== null && v > m ? v : m), g.aggregates.peakConns);
      g.aggregates.peakConns = peak;
      if (row.sustained) {
        g.aggregates.sustainedCount += 1;
        g.aggregates.anySustained = true;
      }
      g.rows.push(row);
    } else {
      groups.set(project, {
        aggregates: {
          passes: row.passes,
          peakConns: (row.connHistory ?? []).reduce<number>((m, v) => (v !== null && v > m ? v : m), 0),
          sustainedCount: row.sustained ? 1 : 0,
          anySustained: row.sustained,
        },
        rows: [row],
      });
    }
  }
  return [...groups.entries()].map(([project, { aggregates, rows: gRows }]) => [project, aggregates, gRows] as const);
}

function PgbouncerCard({
  health,
  foreignPersistence,
  onWindowChange,
  onWindowHours,
}: {
  health?: PgbouncerHealth | null;
  /** Dedicated ledger re-query for the card's window toggle — wins over the
   * pgbouncer snapshot's embedded persistence when present, so switching
   * windows doesn't wait on (or refetch) the whole sweep. */
  foreignPersistence?: ForeignPersistence | null;
  /** Fires when a window chip is clicked; the page re-queries the ledger. */
  onWindowChange?: (hours: number) => void;
  /** The page's active toggle window (null/undefined = snapshot's own). */
  onWindowHours?: number | null;
}) {
  if (!health) return null;
  const level = PG_LEVEL[health.level ?? 'ok'];
  const fp = foreignPersistence ?? health.foreignPersistence;
  return (
    <div
      data-testid="pgbouncer-card"
      style={{
        flex: '1 1 100%',
        border: '1px solid var(--admin-card)',
        borderRadius: 14,
        backgroundColor: 'var(--admin-surface)',
        padding: '16px 18px',
        marginBottom: 28,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon
          name="activity"
          size={16}
          color={health.available ? level.color : 'var(--admin-amber)'}
        />
        <span style={{ fontWeight: 600, fontSize: 14 }}>pgbouncer pools</span>
        {health.available && (
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: level.color,
              background: level.bg,
            }}
          >
            {level.label}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--admin-text-muted)', fontSize: 11 }}>
          probed in {health.latencyMs} ms
        </span>
      </div>

      {!health.available ? (
        <div style={{ color: 'var(--admin-amber)', fontSize: 13 }}>
          Pooler not reachable — {health.detail ?? 'unknown reason'}
        </div>
      ) : (
        <>
          {health.level === 'critical' && (
            <div
              style={{
                marginBottom: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(204,28,28,0.15)',
                color: 'var(--admin-red)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Alert: client connections ≥95% of max_client_conn — pgbouncer will refuse new clients
              and every service will see connection failures.
            </div>
          )}
          {health.level === 'degraded' && (
            <div
              style={{
                marginBottom: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(245,158,11,0.12)',
                color: 'var(--admin-amber)',
                fontSize: 13,
              }}
            >
              Warning: client connections ≥80% of max_client_conn — approaching the ceiling.
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                flex: 1,
                height: 10,
                borderRadius: 5,
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-card)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, health.usagePercent ?? 0)}%`,
                  height: '100%',
                  borderRadius: 5,
                  backgroundColor: level.color,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: level.color,
                whiteSpace: 'nowrap',
              }}
            >
              {health.totalClients} / {health.maxClientConn} clients ({health.usagePercent}%)
            </span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                {[
                  'Database',
                  'User',
                  'Clients active',
                  'Clients waiting',
                  'Servers active',
                  'Servers idle',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '4px 8px 4px 0',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(health.pools ?? []).map((p) => (
                <PgbouncerPoolRowView key={`${p.database}-${p.user}`} p={p} />
              ))}
              {(health.pools ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--admin-text-muted)', padding: '6px 0' }}>
                    No pools yet — no service has connected since the pooler started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Per-service pool budgets: what each workspace's prisma client is
              CAPPED to open against the pooler (from its .env), rolled up by
              database. Together with the pool table above, one card shows
              both sides of the connection economy: what clients may open
              (budgets) and what they have opened (pools). */}
          <p
            style={{
              margin: '18px 0 6px',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--admin-text-muted)',
            }}
          >
            Per-service pool budgets
          </p>
          {(health.serviceBudgets ?? []).length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                  {['Database', 'Service', 'connection_limit', 'Uncapped'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '4px 8px 4px 0',
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(health.serviceBudgets ?? []).map((b) =>
                  b.services.map((s, i) => (
                    <tr key={s.workspace} style={{ borderTop: '1px solid var(--admin-card)' }}>
                      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>
                        {i === 0 ? b.database : ''}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{s.workspace}</td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {s.connectionLimit ?? '—'}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0' }}>
                        {s.connectionLimit === null ? (
                          <span
                            style={{ color: 'var(--admin-amber)', fontWeight: 600 }}
                            title="No connection_limit in its .env — Prisma default pool, unbounded worst case"
                          >
                            uncapped
                          </span>
                        ) : (
                          <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                {/* Rollup rows: per-database worst case, aligned with the
                    pool table's database names for quick comparison. */}
                {(health.serviceBudgets ?? []).map((b) => (
                  <tr
                    key={`rollup-${b.database}`}
                    style={{ borderTop: '2px solid var(--admin-card)' }}
                  >
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 700 }}>{b.database}</td>
                    <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>
                      worst case — {b.services.length} service{sPlural(b.services.length)}
                      {b.uncapped.length > 0 ? ` (+${b.uncapped.length} uncapped)` : ''}
                    </td>
                    <td
                      style={{
                        padding: '5px 8px 5px 0',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 700,
                      }}
                    >
                      {b.uncapped.length > 0 ? `${b.worstCaseTotal}+` : b.worstCaseTotal}
                    </td>
                    <td style={{ padding: '5px 8px 5px 0' }} />
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: 0 }}>
              Per-service budgets unavailable — {health.budgetsDetail ?? 'workspace tree not found'}
              .
            </p>
          )}

          {/* Direct-Postgres bypass detector: repo-owned processes holding
              ESTABLISHED sockets straight to :5432 instead of through the
              pooler. Foreign (non-repo) clients are listed separately —
              noise, not ours. */}
          <p
            style={{
              margin: '18px 0 6px',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--admin-text-muted)',
            }}
          >
            Direct-Postgres bypasses
          </p>
          {health.bypassesDetail ? (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: 0 }}>
              Bypass scan skipped — {health.bypassesDetail}
            </p>
          ) : (health.bypasses ?? []).length === 0 ? (
            <p style={{ color: 'var(--admin-emerald)', fontSize: 12, margin: 0 }}>
              ✓ No repo processes are connecting to Postgres directly — all traffic goes through
              pgbouncer.
              {(health.foreignDirectClients ?? []).length > 0 && (
                <span style={{ color: 'var(--admin-text-muted)' }}>
                  {' '}
                  ({(health.foreignDirectClients ?? []).reduce((n, f) => n + f.connections, 0)}{' '}
                  direct connections from other projects on this host
                  {(health.foreignDirectClients ?? []).some((f) => f.ipv6)
                    ? ', including IPv6 loopback (::1) dials'
                    : ''}
                  .)
                </span>
              )}
            </p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                    {['Workspace', 'Process', 'PID', 'Conns'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '4px 8px 4px 0',
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(health.bypasses ?? []).map((b) => (
                    <tr key={`${b.pid}-${b.workspace}`}>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{b.workspace}</td>
                      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-amber)' }}>
                        {b.command}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {b.pid}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {b.connections}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
                These processes dial Postgres :5432 directly, skipping pgbouncer — connection limits
                and pool budgeting do not apply to them. Restart them on the pooler DATABASE_URL.
                {(health.foreignDirectClients ?? []).length > 0 && (
                  <>
                    {' '}
                    ({(health.foreignDirectClients ?? []).reduce(
                      (n, f) => n + f.connections,
                      0
                    )}{' '}
                    other direct connections on this host belong to different projects
                    {(health.foreignDirectClients ?? []).some((f) => f.ipv6)
                      ? ', some over IPv6 loopback (::1)'
                      : ''}
                    .)
                  </>
                )}
              </p>
            </>
          )}
          {(health.foreignDirectClients ?? []).length > 0 && (
            <>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 10 }}
              >
                <thead>
                  <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                    {['Foreign project', 'Direct conns', 'over IPv6'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '4px 8px 4px 0',
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(health.foreignDirectClients ?? []).map((f) => (
                    <tr key={f.workspace}>
                      <td style={{ padding: '5px 8px 5px 0' }}>{f.workspace}</td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {f.connections}
                      </td>
                      <td
                        style={{
                          padding: '5px 8px 5px 0',
                          fontVariantNumeric: 'tabular-nums',
                          color: f.ipv6 ? 'var(--admin-amber)' : 'var(--admin-text-muted)',
                        }}
                      >
                        {f.ipv6 ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
                Context only: these belong to other projects on this host dialing Postgres :5432
                directly — not azeebo processes, and never counted as bypasses. Shown because
                foreign fleets often bind IPv6 loopback (::1) exclusively, which changes where you
                look when chasing connections.
              </p>
            </>
          )}
          {fp && fp.rows.length > 0 && (
            <>
              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  Foreign dialer persistence — ledger, last {fp.windowHours}h
                </div>
                <div style={{ display: 'inline-flex', gap: 4 }} role="group" aria-label="Persistence window">
                  {FOREIGN_WINDOW_OPTIONS.map(({ label, hours }) => {
                    const active = hours === (onWindowHours ?? fp.windowHours);
                    return (
                      <button
                        key={hours}
                        type="button"
                        disabled={active}
                        onClick={() => onWindowChange?.(hours)}
                        title={`Re-query the ledger for the last ${label} — sparklines rescale to the chosen window`}
                        style={{
                          padding: '2px 10px',
                          fontSize: 11,
                          fontWeight: active ? 700 : 500,
                          borderRadius: 999,
                          border: '1px solid rgba(148,163,184,0.35)',
                          background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
                          color: active ? 'var(--admin-emerald)' : 'var(--admin-text-muted)',
                          cursor: active ? 'default' : 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 6 }}
              >
                <thead>
                  <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                    {['Foreign project', 'Flagged passes', 'History', 'Conns', 'Span', 'Last seen', ''].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '4px 8px 4px 0',
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupForeignRowsByProject(fp.rows).map(([project, aggregates, rows]) => {
                    const solo = rows.length === 1;
                    return [
                      ...(solo
                        ? []
                        : [
                            <tr
                              key={`grp:${project}`}
                              style={{ color: 'var(--admin-text-muted)' }}
                            >
                              <td
                                colSpan={7}
                                style={{
                                  padding: '10px 8px 2px 0',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  borderTop: '1px solid var(--admin-border-subtle)',
                                }}
                              >
                                {project} — {rows.length} workspace{rows.length === 1 ? '' : 's'} ·{' '}
                                {aggregates.passes} pass{aggregates.passes === 1 ? '' : 'es'} · peak{' '}
                                {aggregates.peakConns} conn{aggregates.peakConns === 1 ? '' : 's'}
                                {aggregates.anySustained
                                  ? ` · ${aggregates.sustainedCount} sustained`
                                  : ''}
                              </td>
                            </tr>,
                          ]),
                      ...rows.map((f) => (
                        <tr key={f.workspace}>
                          <td style={{ padding: '5px 8px 5px 0' }}>
                            <span
                              style={{ fontWeight: solo ? 600 : 400 }}
                              title={
                                (f.project ?? f.workspace) === f.workspace
                                  ? `No POOL_FOREIGN_PROJECT_ROOTS root matched — the workspace path is its own project group`
                                  : `Project: ${f.project} — workspace: ${f.workspace}`
                              }
                            >
                              {f.project ?? f.workspace}
                            </span>
                          </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {f.passes}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', whiteSpace: 'nowrap' }}>
                        <PassTrendBars
                          history={f.history}
                          bucketSeconds={f.bucketSeconds}
                          windowHours={fp.windowHours ?? 0}
                        />
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', whiteSpace: 'nowrap' }}>
                        <ConnTrendBars
                          connHistory={f.connHistory ?? []}
                          bucketSeconds={f.bucketSeconds}
                          windowHours={fp.windowHours ?? 0}
                        />
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {f.spanHours >= 1
                          ? `${f.spanHours.toFixed(1)}h`
                          : `${Math.round(f.spanHours * 60)}m`}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>
                        {new Date(f.lastSeen).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0' }}>
                        {f.approved ? (
                          <span
                            style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}
                            title={`On POOL_FOREIGN_ALLOWLIST — approved, never tracked by the nightly pool-health tracker (span shown for budget context)`}
                          >
                            approved — not tracked
                          </span>
                        ) : f.sustained ? (
                          fp?.trackingIssueUrl ? (
                            <a
                              href={fp.trackingIssueUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: 'var(--admin-amber)',
                                fontWeight: 600,
                                fontSize: 11,
                                textDecoration: 'underline',
                              }}
                              title={`At/over the ${fp?.sustainedMinSpanHours}h threshold — this dialer is listed in the nightly pool-health tracking issue`}
                            >
                              sustained — tracking issue ↗
                            </a>
                          ) : (
                            <span
                              style={{
                                color: 'var(--admin-amber)',
                                fontWeight: 600,
                                fontSize: 11,
                              }}
                              title={`At/over the ${fp?.sustainedMinSpanHours}h threshold — the nightly pool-health tracker opens/updates its tracking issue for this dialer`}
                            >
                              sustained — tracked nightly
                            </span>
                          )
                        ) : (
                          <span
                            style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}
                            title={`Below the ${fp?.sustainedMinSpanHours}h sustained threshold — context only, no tracking issue`}
                          >
                            below threshold
                          </span>
                        )}
                      </td>
                        </tr>
                      )),
                    ];
                  })}
                </tbody>
              </table>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
                Per-workspace persistence from the pool-audit ledger (same run/gap semantics as the
                nightly foreign-dialer tracker — a span ≥{' '}
                {fp.sustainedMinSpanHours}h is what opens its tracking
                issue). Rows are grouped by owning project (POOL_FOREIGN_PROJECT_ROOTS prefix
                match; unmatched workspaces stand alone). History shows each workspace's flagged
                passes per ~2h bucket across the window (bar height scales to the row's own
                peak). This is history, not a live scan: a workspace can appear here after it
                stopped dialing.
              </p>
            </>
          )}
          {fp &&
            fp.rows.length === 0 &&
            !fp.detail &&
            (health.foreignDirectClients ?? []).length > 0 && (
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '8px 0 0' }}>
                No flagged foreign passes in the last {fp.windowHours}h of
                the ledger — the clients above are new since the last watchdog pass recorded them.
              </p>
            )}
          {fp?.detail && (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '8px 0 0' }}>
              Persistence history unavailable — {fp.detail}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Transport-flip persistence trend — ledger-backed history of which services
 * re-bound and how often. The live banner answers "what is flipping RIGHT
 * NOW" (10-minute hold window); this answers "what has been flipping all
 * month". Only services that actually flipped in the window render; steady
 * days are recorded in the ledger but need no row here.
 */
function TransportFlipTrendCard({ trend }: { trend?: TransportFlipTrend | null }) {
  if (!trend) return null;
  // Per-service rollup: rows are (service, day); flip-only services sort by
  // flip volume desc, then name — the noisy re-binder tops the table.
  const flipServices = (() => {
    const byService = new Map<string, TransportFlipTrendRow[]>();
    for (const r of trend.rows) {
      const list = byService.get(r.service) ?? [];
      list.push(r);
      byService.set(r.service, list);
    }
    return [...byService.entries()]
      .filter(([, perDay]) => perDay.some((d) => d.flips > 0))
      .map(([service, perDay]) => {
        perDay.sort((a, b) => b.day.localeCompare(a.day));
        return [service, perDay] as const;
      })
      .sort(
        (a, b) =>
          b[1].reduce((n, r) => n + r.flips, 0) - a[1].reduce((n, r) => n + r.flips, 0) ||
          a[0].localeCompare(b[0])
      );
  })();
  // Quiet window (rows exist, nobody flipped) hides the card entirely: a
  // permanently-empty table is noise, and the banner owns "what changed
  // recently". The card earns its place only when there is something to
  // trend — or when the ledger read itself failed (honest degrade).
  if (flipServices.length === 0 && !trend.detail) return null;
  return (
    <div
      style={{
        background: 'var(--admin-card)',
        border: '1px solid var(--admin-border)',
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
        Transport flip trend
        <span
          style={{ color: 'var(--admin-text-muted)', fontWeight: 400, fontSize: 12, marginLeft: 8 }}
        >
          ledger, last {trend.windowDays}d
        </span>
      </div>
      {trend.detail ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '8px 0 0' }}>
          Flip trend unavailable — {trend.detail}
        </p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 8 }}>
            <thead>
              <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                {['Service', 'Days seen', 'Flips', 'Family flips', 'Last flip'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '4px 8px 4px 0',
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flipServices.map(([service, perDay]) => {
                const totalFlips = perDay.reduce((n, r) => n + r.flips, 0);
                const totalFamily = perDay.reduce((n, r) => n + r.familyFlips, 0);
                const newest = perDay[0];
                return (
                  <tr key={service}>
                    <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{service}</td>
                    <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                      {perDay.length}
                    </td>
                    <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                      {totalFlips}
                    </td>
                    <td
                      style={{
                        padding: '5px 8px 5px 0',
                        fontVariantNumeric: 'tabular-nums',
                        color: totalFamily > 0 ? 'var(--admin-amber)' : 'var(--admin-text-muted)',
                        fontWeight: totalFamily > 0 ? 700 : 400,
                      }}
                    >
                      {totalFamily}
                    </td>
                    <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>
                      {newest?.lastFlipAt
                        ? `${new Date(newest.lastFlipAt).toLocaleDateString()} ${newest.lastFrom}→${newest.lastTo}`
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
            Recorded server-side on every probe sweep (one row per service per day, flips merged):{' '}
            {trend.servicesWithFlips} service{sPlural(trend.servicesWithFlips)} flipped at least
            once, {trend.totalFlips} flip{sPlural(trend.totalFlips)} total, {trend.totalFamilyFlips}{' '}
            crossing loopback families. A quiet window hides this card — steady-state sweeps are
            recorded in the ledger either way.
          </p>
          {trend.events.length > 0 && (
            <>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--admin-text-muted)',
                  margin: '12px 0 2px',
                }}
              >
                Recent flip events (every detected transition, newest first)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 4 }}>
                <thead>
                  <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
                    {['When', 'Service', 'Transition', 'Family'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '4px 8px 4px 0',
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trend.events.map((e) => (
                    <tr key={`${e.service}:${e.detectedAt}`}>
                      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(e.detectedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>
                        {e.service}
                      </td>
                      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {e.from}→{e.to}
                      </td>
                      <td
                        style={{
                          padding: '5px 8px 5px 0',
                          color: e.familyChanged ? 'var(--admin-amber)' : 'var(--admin-text-muted)',
                          fontWeight: e.familyChanged ? 700 : 400,
                        }}
                      >
                        {e.familyChanged ? 'crossed' : 'rebind'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Per-row transport cell for the fleet table: label + color + tooltip. */
function transportCell(s: {
  status: OpsServiceHealth['status'];
  transport?: OpsServiceHealth['transport'];
  errorDetail?: string;
}): { label: string; color: string; title?: string; weight?: number } {
  if (s.status === 'down')
    return {
      label: 'unreachable',
      color: 'var(--admin-red)',
      title: s.errorDetail ? `last probe failure: ${s.errorDetail}` : 'probe sweep could not reach the service',
    };
  if (s.transport === undefined) return { label: '—', color: 'var(--admin-text-muted)' };
  if (s.transport === 'localhost')
    return {
      label: 'dual-stack',
      color: 'var(--admin-text-muted)',
      title: 'Answered on localhost — the hostname may resolve to either loopback family, so no family is asserted.',
    };
  return {
    label: s.transport === 'ipv6' ? 'IPv6-only' : 'IPv4-only',
    color: 'var(--admin-amber)',
    weight: 600,
    title:
      s.transport === 'ipv6'
        ? 'Answered on [::1] — an IPv6-only listener (IPv4 dials are refused). Healthy; a refused 127.0.0.1 probe is never an outage.'
        : 'Answered on 127.0.0.1 — an IPv4-only listener.',
  };
}

/**
 * Fleet transport table — one row per probed service with the loopback
 * family that answered the latest sweep. Sits beside the flip trend so the
 * CURRENT state is readable without cross-referencing history: a trend row
 * plus this column answers "which family is it on right now?". localhost
 * renders as dual-stack on purpose — hostname probes answer on either
 * family, so calling one out would just re-label the normal case.
 */
function FleetTransportCard({ snapshot }: { snapshot?: OpsServicesSnapshot | null }) {
  if (!snapshot || snapshot.services.length === 0) return null;
  const healthy = snapshot.services.filter((s) => s.status === 'healthy').length;
  return (
    <div
      data-testid="fleet-transport-card"
      style={{
        border: '1px solid var(--admin-card)',
        borderRadius: 14,
        backgroundColor: 'var(--admin-surface)',
        padding: '16px 18px',
        marginBottom: 28,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name="refresh" size={16} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>Fleet transport</span>
        <span style={{ marginLeft: 'auto', color: 'var(--admin-text-muted)', fontSize: 11 }}>
          {healthy}/{snapshot.services.length} answering · family flips this sweep:{' '}
          {snapshot.transportFlips.length}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ color: 'var(--admin-text-muted)', textAlign: 'left' }}>
            {['Service', 'Port', 'Status', 'Transport', 'Latency'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '4px 8px 4px 0',
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {snapshot.services.map((s) => {
            const t = transportCell(s);
            const statusColor =
              s.status === 'healthy'
                ? 'var(--admin-emerald)'
                : s.status === 'degraded'
                  ? 'var(--admin-amber)'
                  : 'var(--admin-red)';
            return (
              <tr key={s.name}>
                <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>
                  {s.port}
                </td>
                <td style={{ padding: '5px 8px 5px 0', color: statusColor }}>{s.status}</td>
                <td
                  style={{
                    padding: '5px 8px 5px 0',
                    color: t.color,
                    fontWeight: t.weight,
                    whiteSpace: 'nowrap',
                  }}
                  title={t.title}
                >
                  {t.label}
                </td>
                <td
                  style={{
                    padding: '5px 8px 5px 0',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  {s.latencyMs} ms
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, margin: '4px 0 0' }}>
        Transport is the loopback family that answered the latest probe sweep (dual-stack =
        hostname probe, either family). Family changes land in the banner above and the flip
        trend below; this column is where they landed.
      </p>
    </div>
  );
}

function sPlural(n: number): string {
  return n === 1 ? '' : 's';
}

function PgbouncerPoolRowView({ p }: { p: PgbouncerPoolRow }) {
  const waiting = p.clWaiting > 0;
  return (
    <tr style={{ borderTop: '1px solid var(--admin-card)' }}>
      <td style={{ padding: '5px 8px 5px 0', fontWeight: 600 }}>{p.database}</td>
      <td style={{ padding: '5px 8px 5px 0', color: 'var(--admin-text-muted)' }}>{p.user}</td>
      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>{p.clActive}</td>
      <td
        style={{
          padding: '5px 8px 5px 0',
          fontVariantNumeric: 'tabular-nums',
          color: waiting ? 'var(--admin-amber)' : 'var(--admin-text-muted)',
          fontWeight: waiting ? 700 : 400,
        }}
        title={waiting ? 'Clients queued waiting for a server connection' : undefined}
      >
        {p.clWaiting}
      </td>
      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>{p.svActive}</td>
      <td style={{ padding: '5px 8px 5px 0', fontVariantNumeric: 'tabular-nums' }}>{p.svIdle}</td>
    </tr>
  );
}

/**
 * Pass-history strip from the job_runs ledger: one bar per recorded pass,
 * oldest → newest left → right; taller bars for warn, full-height for error.
 * In the 7d window, per-day success-rate rows replace the per-pass bars
 * (an hourly job would otherwise need ~168 unreadable bars).
 */
function RunStrip({
  summary,
  windowHours = 24,
}: {
  summary?: JobRunSummary;
  windowHours?: number;
}) {
  if (!summary || summary.total === 0) {
    return (
      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 10 }}>
        No recorded runs in the last {windowLabel(windowHours)}
      </div>
    );
  }
  if (windowHours > 24) {
    return <DailyRates daily={summary.daily} windowHours={windowHours} />;
  }
  const runs = [...summary.runs].reverse();
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 34 }}>
        {runs.map((r, i) => (
          <div
            key={`${r.ranAt}-${i}`}
            title={`${new Date(r.ranAt).toLocaleTimeString()} · ${r.status}${
              r.detail ? ` — ${r.detail}` : ''
            }`}
            style={{
              flex: 1,
              minWidth: 3,
              height: r.status === 'error' ? '100%' : r.status === 'warn' ? '80%' : '55%',
              backgroundColor: RUN_COLORS[r.status],
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 6 }}>
        last {summary.total} pass{summary.total === 1 ? '' : 'es'} ·{' '}
        <span style={{ color: 'var(--admin-emerald)' }}>{summary.ok} ok</span>
        {summary.warn > 0 && (
          <>
            {' · '}
            <span style={{ color: 'var(--admin-amber)' }}>{summary.warn} warn</span>
          </>
        )}
        {summary.error > 0 && (
          <>
            {' · '}
            <span style={{ color: 'var(--admin-red)' }}>{summary.error} failed</span>
          </>
        )}
      </div>
    </div>
  );
}

/** Per-day success-rate rows for the 7d window (UTC days, chronological). */
function DailyRates({ daily, windowHours }: { daily: JobRunDailySummary[]; windowHours: number }) {
  if (daily.length === 0) {
    return (
      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 10 }}>
        No recorded runs in the last {windowLabel(windowHours)}
      </div>
    );
  }
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'grid', gap: 3 }}>
        {daily.map((d) => (
          <div
            key={d.date}
            style={{
              display: 'grid',
              gridTemplateColumns: '46px 1fr 38px 52px',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              lineHeight: 1.2,
            }}
            title={`${d.date}: ${d.ok}/${d.total} pass${d.total === 1 ? '' : 'es'} succeeded`}
          >
            <span style={{ color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {d.date.slice(5).replace('-', '/')}
            </span>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'var(--admin-surface)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${d.rate}%`,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor:
                    d.rate >= 100
                      ? 'var(--admin-emerald)'
                      : d.rate >= 60
                        ? 'var(--admin-amber)'
                        : 'var(--admin-red)',
                }}
              />
            </div>
            <span
              style={{
                color:
                  d.rate >= 100
                    ? 'var(--admin-emerald)'
                    : d.rate >= 60
                      ? 'var(--admin-amber)'
                      : 'var(--admin-red)',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {d.rate}%
            </span>
            <span style={{ color: 'var(--admin-text-muted)' }}>
              {d.ok}/{d.total}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 6 }}>
        {windowLabel(windowHours)} window · {daily.length} day{daily.length === 1 ? '' : 's'} with
        runs · {daily.reduce((n, d) => n + d.total, 0)} pass
        {daily.reduce((n, d) => n + d.total, 0) === 1 ? '' : 'es'} total
      </div>
    </div>
  );
}

/** Outcome of the last manual run for a card (or a failed start). */
interface RunOutcomeView {
  outcome?: RunJobOutcome;
  error?: string;
}

function RunOutcomePanel({ jobId, view }: { jobId: string; view?: RunOutcomeView }) {
  if (!view || (view.outcome?.job !== jobId && !view.error)) return null;
  const o = view.outcome;
  if (view.error) {
    return (
      <div
        style={{
          marginTop: 10,
          padding: '8px 10px',
          borderRadius: 8,
          background: 'rgba(204,28,28,0.12)',
          color: 'var(--admin-red)',
          fontSize: 12,
        }}
      >
        Could not start: {view.error}
      </div>
    );
  }
  if (!o) return null;
  return (
    <div
      style={{
        marginTop: 10,
        padding: '8px 10px',
        borderRadius: 8,
        background: o.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.12)',
        fontSize: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 700,
          color: o.ok ? 'var(--admin-emerald)' : 'var(--admin-red)',
        }}
      >
        <Icon
          name={o.ok ? 'check' : 'x'}
          size={14}
          color={o.ok ? 'var(--admin-emerald)' : 'var(--admin-red)'}
        />
        <span>
          {o.ok ? 'finished ok' : 'finished with errors'} · {(o.durationMs / 1000).toFixed(1)}s
        </span>
      </div>
      {o.output.length > 0 && (
        <pre
          style={{
            margin: '6px 0 0',
            maxHeight: 150,
            overflow: 'auto',
            fontSize: 11,
            lineHeight: 1.5,
            color: 'var(--admin-text-muted)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {o.output.slice(-8).join('\n')}
        </pre>
      )}
    </div>
  );
}

function CheckCard({
  check,
  icon,
  historyJob,
  historyHours,
  onRun,
  runPending,
  runJobId,
  runOutcome,
}: {
  check: OpsCheck;
  icon: string;
  historyJob?: JobRunSummary;
  historyHours?: number;
  onRun?: () => void;
  runPending?: boolean;
  /** Ledger job name this card's manual run maps to (for outcome rendering). */
  runJobId?: string;
  runOutcome?: RunOutcomeView;
}) {
  const s = statusDot(check.ok);
  return (
    <div
      style={{
        flex: '1 1 220px',
        border: '1px solid var(--admin-card)',
        borderRadius: 14,
        backgroundColor: 'var(--admin-surface)',
        padding: '16px 18px',
        minWidth: 220,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name={icon} size={16} color={s.dot} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{check.label}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {onRun && (
            <button
              onClick={onRun}
              disabled={runPending}
              style={{
                padding: '3px 10px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                background: 'transparent',
                color: runPending ? 'var(--admin-text-muted)' : 'var(--admin-orange)',
                fontSize: 11,
                fontWeight: 600,
                cursor: runPending ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Run this job's script now"
            >
              {runPending ? 'Running…' : 'Run now'}
            </button>
          )}
          <span
            style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: s.dot }}
            title={s.text}
          />
        </span>
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
          flexWrap: 'wrap',
        }}
      >
        {check.latencyMs !== undefined && <span>{check.latencyMs} ms</span>}
        {check.ageMinutes !== undefined && <span>last pass {ageLabel(check.ageMinutes)}</span>}
        {check.rowsPurged !== undefined && (
          <span style={{ color: check.rowsPurged > 0 ? 'var(--admin-amber)' : undefined }}>
            purged {check.rowsPurged} row{check.rowsPurged === 1 ? '' : 's'}
          </span>
        )}
      </div>
      <RunStrip summary={historyJob} windowHours={historyHours} />
      {runJobId && <RunOutcomePanel jobId={runJobId} view={runOutcome} />}
    </div>
  );
}

export default function OpsPage() {
  const [since, setSince] = useState<number | null>(null);
  /** Window for the job cards' pass-history strips. */
  const [historyHours, setHistoryHours] = useState<number>(24);
  /** Window for the foreign-persistence card's ledger re-query (null = the
   * pgbouncer snapshot's embedded persistence, 48h). */
  const [foreignWindowHours, setForeignWindowHours] = useState<number | null>(null);
  // Dedicated foreign-persistence query: keyed by the card's toggle window so
  // switching 48h/7d/14d re-queries ONLY the ledger read (cheap SQL), never
  // the whole pgbouncer sweep. Null key = follow the snapshot; once a window
  // is chosen the dedicated data wins until the window goes back to null.
  const { data: foreignPersistence } = useQuery({
    queryKey: ['admin', 'ops-foreign-persistence', foreignWindowHours],
    enabled: foreignWindowHours !== null,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const res = await adminApi.getOpsForeignPersistence(foreignWindowHours ?? undefined);
      return res.success ? (res.data as ForeignPersistence) : null;
    },
    refetchInterval: 30_000,
  });
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'ops-status'],
    queryFn: async () => {
      const res = await adminApi.getOpsStatus();
      return res.success ? (res.data as OpsStatus) : null;
    },
    refetchInterval: 30_000, // jobs run hourly; a 30s glance window is plenty
  });
  const { data: runs } = useQuery({
    queryKey: ['admin', 'ops-runs', historyHours],
    queryFn: async () => {
      const res = await adminApi.getOpsRunHistory(historyHours);
      return res.success ? (res.data as OpsRunHistory) : null;
    },
    refetchInterval: 60_000,
  });
  const { data: pgbouncer } = useQuery({
    queryKey: ['admin', 'ops-pgbouncer'],
    queryFn: async () => {
      const res = await adminApi.getOpsPgbouncer();
      return res.success ? (res.data as PgbouncerHealth) : null;
    },
    refetchInterval: 30_000,
  });
  // Fleet probe sweep — same endpoint the Service Health page uses, so the
  // react-query cache is shared and neither page can swallow the other's flip.
  const { data: servicesSnapshot } = useQuery({
    queryKey: ['admin', 'ops-services'],
    queryFn: async () => {
      const res = await adminApi.getOpsServices();
      return res.success ? (res.data as OpsServicesSnapshot) : null;
    },
    refetchInterval: 30_000,
  });
  // Ledger-backed flip history: the banner shows what changed in the last
  // 10 minutes; the trend card shows what changed across the fortnight.
  // 5-min staleness fits — the underlying rows update at most once per sweep.
  const { data: flipTrend } = useQuery({
    queryKey: ['admin', 'ops-flip-trend'],
    queryFn: async () => {
      const res = await adminApi.getOpsTransportFlipTrend();
      return res.success ? (res.data as TransportFlipTrend) : null;
    },
    refetchInterval: 60_000,
    staleTime: 5 * 60_000,
  });
  const [dismissedFlipKeys, setDismissedFlipKeys] = useState<Set<string>>(new Set());
  const liveFlips = (servicesSnapshot?.transportFlips ?? []).filter(
    (f) => !dismissedFlipKeys.has(`${f.service}:${f.detectedAt}`)
  );
  // Header chip: is the transport store Redis-backed or degraded to memory?
  const storeChip = servicesSnapshot?.transportStore ?? null;
  const queryClient = useQueryClient();
  const [runJobId, setRunJobId] = useState<string | null>(null);
  const [runOutcome, setRunOutcome] = useState<Record<string, RunOutcomeView>>({});
  const runMutation = useMutation({
    mutationFn: (job: string) => adminApi.runOpsJob(job),
    onMutate: (job) => {
      setRunJobId(job);
      setRunOutcome((prev) => ({ ...prev, [job]: {} }));
    },
    onSuccess: (res, job) => {
      setRunOutcome((prev) => ({ ...prev, [job]: { outcome: res.data } }));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ops-status'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ops-runs'] });
    },
    onError: (err, job) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'unknown error';
      setRunOutcome((prev) => ({ ...prev, [job]: { error: msg } }));
    },
  });
  const RUN_JOB_BY_LABEL: Record<string, string> = {
    'Freshness job': 'freshness',
    'Audit retention': 'audit-retention',
    'Pool audit': 'pool-audit',
    'Plist watchdog': 'plist-watchdog',
  };

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
  const runsByJob = Object.fromEntries((runs?.perJob ?? []).map((s) => [s.job, s]));
  const drill = runsByJob['drill'];

  return (
    <div>
      <TransportMismatchBanner
        flips={liveFlips}
        onDismiss={() =>
          setDismissedFlipKeys(
            (prev) => new Set([...prev, ...liveFlips.map((f) => `${f.service}:${f.detectedAt}`)])
          )
        }
      />
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
        {storeChip && (
          <span
            style={{
              padding: '4px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              color: STORE_CHIP[storeChip.mode].color,
              background: STORE_CHIP[storeChip.mode].bg,
            }}
            title={storeChip.detail}
          >
            store: {STORE_CHIP[storeChip.mode].label}
            {storeChip.redisDb !== null && (
              <span style={{ fontWeight: 500, opacity: 0.85 }}> · db {storeChip.redisDb}</span>
            )}
          </span>
        )}
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginLeft: 'auto' }}>
          auto-refreshes every 30s · checked {new Date(dataUpdatedAt).toLocaleTimeString()}
        </span>
      </div>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 24 }}>
        Live probes: admin database, federation (cross-DB join), and the scheduled jobs' last
        passes.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)' }}>
          Pass history
        </span>
        {(
          [
            { label: '24h', h: 24 },
            { label: '7d', h: 24 * 7 },
          ] as const
        ).map((r) => (
          <button
            key={r.label}
            onClick={() => setHistoryHours(r.h)}
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              border: historyHours === r.h ? 'none' : '1px solid var(--admin-surface)',
              background: historyHours === r.h ? 'var(--admin-orange)' : 'transparent',
              color: historyHours === r.h ? 'white' : 'var(--admin-text-muted)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <PgbouncerCard
        health={pgbouncer}
        foreignPersistence={foreignPersistence}
        onWindowHours={foreignWindowHours}
        onWindowChange={setForeignWindowHours}
      />
      <div style={{ marginTop: 16 }}>
        <TransportFlipTrendCard trend={flipTrend} />
      </div>
      <FleetTransportCard snapshot={servicesSnapshot} />

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <CheckCard check={data.db} icon="activity" historyHours={historyHours} />
        <CheckCard check={data.federation} icon="refresh" historyHours={historyHours} />
        {data.jobs.map((j) => {
          const runJob = RUN_JOB_BY_LABEL[j.label];
          return (
            <CheckCard
              key={j.label}
              check={j}
              icon="clock"
              historyJob={runsByJob[HISTORY_JOB_BY_LABEL[j.label] ?? '']}
              historyHours={historyHours}
              onRun={runJob ? () => runMutation.mutate(runJob) : undefined}
              runPending={runJob !== undefined && runMutation.isPending && runJobId === runJob}
              runJobId={runJob}
              runOutcome={runJob ? runOutcome[runJob] : undefined}
            />
          );
        })}
      </div>

      {drill && drill.total > 0 && drill.lastAt && (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: '-16px 0 24px' }}>
          Weekly federation drill: last ran {new Date(drill.lastAt).toLocaleString()} —{' '}
          {drill.error > 0 ? (
            <span style={{ color: 'var(--admin-red)' }}>failures recorded</span>
          ) : (
            <span style={{ color: 'var(--admin-emerald)' }}>passing</span>
          )}{' '}
          ({drill.total} recorded run{drill.total === 1 ? '' : 's'} in{' '}
          {windowLabel(runs?.windowHours ?? 24)})
        </p>
      )}

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
          border: '1px solid var(--admin-card)',
          backgroundColor: 'var(--admin-surface)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'rgba(232,66,10,0.08)',
                borderBottom: '1px solid var(--admin-card)',
              }}
            >
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Timestamp
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Level
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Source
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--admin-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={`${a.at}-${i}`} style={{ borderBottom: '1px solid var(--admin-card)' }}>
                <td
                  style={{
                    padding: '12px 16px',
                    color: 'var(--admin-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {new Date(a.at).toLocaleString()}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span
                    style={{
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      color: a.level === 'ERROR' ? 'var(--admin-red)' : 'var(--admin-amber)',
                      background:
                        a.level === 'ERROR' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
                    }}
                  >
                    {a.level}
                  </span>
                </td>
                <td
                  style={{
                    padding: '12px 8px',
                    color: 'var(--admin-text)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.source}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
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
