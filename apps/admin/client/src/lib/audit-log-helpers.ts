import type { AuditLogEntry } from './api/admin';

/**
 * Pure helpers for rendering audit-log rows — extracted from audit-logs.tsx so
 * route modules export ONLY components (vite-plugin-react Fast-Refresh
 * invalidates any file whose exports aren't exclusively components, which
 * stranded stale modules in open tabs and produced ghost crashes from
 * previous code generations).
 *
 * Source badge: which trail a row came from. 'auth-service' rows are the
 * federated login/token events from azeebo_auth (read-only view, see
 * audit.service.ts fetchAuthTrail); everything else is written by the admin
 * panel itself. Undefined source (older payloads) renders as admin.
 */
type SourceStyle = { label: string; bg: string; color: string; title: string };
const ADMIN_SOURCE: SourceStyle = {
  label: 'Admin panel',
  bg: 'rgba(154,138,122,0.18)',
  color: 'var(--admin-text-muted)',
  title: 'Written by the admin panel itself',
};
const SOURCE_STYLES: Record<string, SourceStyle> = {
  'auth-service': {
    label: 'Auth service',
    bg: 'rgba(59,130,246,0.18)',
    color: 'var(--admin-blue)',
    title: 'Federated read-only from auth-service (login/token events)',
  },
  admin: ADMIN_SOURCE,
};

export const sourceStyleFor = (source?: string): SourceStyle =>
  SOURCE_STYLES[source ?? 'admin'] ?? ADMIN_SOURCE;

export const sourceBadgeFor = (source?: string): string => sourceStyleFor(source).label;

/**
 * Archived flag key(s) + count from a `feature_flag.deleted` entry's details.
 * Each removal archives one snapshot (`archivedSnapshot`); the plural
 * `archivedSnapshots` array is handled defensively in case a batch path ever
 * writes several into one entry. Global snapshots don't carry the key (it
 * lives on `targetId`); universe snapshots carry `featureKey` + `universeName`.
 */
export const archivedFromDetails = (
  log: AuditLogEntry
): {
  count: number;
  keys: string[];
} => {
  const details = log.details ?? {};
  const singular = details.archivedSnapshot as Record<string, unknown> | undefined;
  const plural = Array.isArray(details.archivedSnapshots)
    ? (details.archivedSnapshots as Record<string, unknown>[])
    : [];
  const snapshots = plural.length > 0 ? plural : singular ? [singular] : [];
  const keys = snapshots.map((s) => {
    if (log.targetType === 'universe_feature_flag') {
      const featureKey = (s.featureKey as string | undefined) ?? log.targetId;
      const universeName =
        (s.universeName as string | undefined) ?? (s.universeDisplayName as string | undefined);
      return universeName ? `${universeName}.${featureKey}` : (featureKey ?? 'unknown');
    }
    // Global flags store the key on targetId; the snapshot holds the rest.
    return log.targetId ?? (s.key as string | undefined) ?? 'unknown';
  });
  return { count: snapshots.length, keys };
};
