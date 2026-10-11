import type { OpsStatus, JobRunSummary, PgbouncerHealth, TransportStoreStatus } from '@/lib/api/admin';

/** Dot + color for a check's ok flag. */
export const statusDot = (ok: boolean) => ({
  dot: ok ? 'var(--admin-emerald)' : 'var(--admin-red)',
  text: ok ? 'OK' : 'FAIL',
});

export const OVERALL: Record<OpsStatus['overall'], { label: string; color: string; bg: string }> = {
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

export const ageLabel = (minutes?: number) => {
  if (minutes === undefined) return '';
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  return h < 24 ? `${h}h ${minutes % 60}m ago` : `${Math.floor(h / 24)}d ${h % 24}h ago`;
};

/** Which ledger job a card's pass history comes from (undefined = no chart). */
export const HISTORY_JOB_BY_LABEL: Record<string, string> = {
  'Freshness job': 'freshness',
  'Audit retention': 'audit-retention',
  'Pool audit': 'pool-audit',
  'Plist watchdog': 'plist-watchdog',
};

export const RUN_COLORS: Record<JobRunSummary['runs'][number]['status'], string> = {
  ok: 'var(--admin-emerald)',
  warn: 'var(--admin-amber)',
  error: 'var(--admin-red)',
};

/** Human window label: 168 → "7d", but 24 stays "24h". */
export const windowLabel = (h: number) => (h > 24 && h % 24 === 0 ? `${h / 24}d` : `${h}h`);

/** Per-pool color/label for the pgbouncer saturation level. */
export const PG_LEVEL: Record<
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
export const STORE_CHIP: Record<
  TransportStoreStatus['mode'],
  { label: string; color: string; bg: string }
> = {
  redis: { label: 'redis', color: 'var(--admin-emerald)', bg: 'rgba(16,185,129,0.15)' },
  memory: { label: 'memory', color: 'var(--admin-amber)', bg: 'rgba(245,158,11,0.15)' },
};

/** Window choices for the foreign-persistence card's toggle (hours). The
 * service clamps to 6h–14d, so these all pass through untouched. */
export const FOREIGN_WINDOW_OPTIONS: Array<{ label: string; hours: number }> = [
  { label: '48h', hours: 48 },
  { label: '7d', hours: 24 * 7 },
  { label: '14d', hours: 24 * 14 },
];

/** localStorage key for the foreign-persistence window choice — ops get
 * their last window back on reload (sessionStorage would forget it in every
 * new tab, defeating the point). Valid values are the toggle's own options;
 * anything else falls back to following the snapshot. */
export const FOREIGN_WINDOW_STORAGE_KEY = 'azeebo_ops_foreign_window_hours';

export function sPlural(n: number): string {
  return n === 1 ? '' : 's';
}
