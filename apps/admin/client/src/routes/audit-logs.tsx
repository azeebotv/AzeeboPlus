import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import type { AuditLogEntry } from '@/lib/api/admin';

/**
 * Filter chips → query params. Every chip maps to real `targetType`s the
 * backend filters on; a comma-separated value is a group filter (the backend
 * splits it into `{ in: [...] }`). These group the targetTypes each domain
 * actually writes: user-management → user, content-management →
 * content/category/tag, system-settings → admin_user/role/settings/setting.
 * Wallet maps to a targetType nothing writes today, so it truthfully returns
 * empty (wallet-management logs no audit entries yet).
 */
const FILTERS: Record<string, { label: string; targetType?: string; action?: string }> = {
  all: { label: 'All' },
  // Removals = every feature_flag.deleted entry (global + universe scopes) —
  // what the admin nav badge counts; deep-linked via ?action=feature_flag.deleted.
  removals: { label: 'Removals', action: 'feature_flag.deleted' },
  'universe-flags': { label: 'Universe Flags', targetType: 'universe_feature_flag' },
  'global-flags': { label: 'Global Flags', targetType: 'feature_flag' },
  auth: { label: 'Auth', targetType: 'user' },
  content: { label: 'Content', targetType: 'content,category,tag' },
  wallet: { label: 'Wallet', targetType: 'wallet' },
  admin: { label: 'Admin', targetType: 'admin_user,role,settings,setting' },
};

/** Quick time ranges → startDate window. 'all' shows everything. */
const RANGES: Record<string, { label: string; days?: number }> = {
  all: { label: 'All time' },
  '24h': { label: '24h', days: 1 },
  '7d': { label: '7d', days: 7 },
  '30d': { label: '30d', days: 30 },
};

/** Human-readable labels for the feature-flag family of audit actions. */
const FLAG_ACTION_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  'feature_flag.deleted': {
    label: 'Flag removed',
    bg: 'rgba(204,28,28,0.25)',
    color: 'var(--admin-red)',
  },
  'feature_flag.restored': {
    label: 'Flag restored',
    bg: 'rgba(31,138,76,0.25)',
    color: 'var(--admin-emerald)',
  },
  'feature_flag.stale_notified': {
    label: 'Flag stale · notified',
    bg: 'rgba(232,66,10,0.2)',
    color: 'var(--admin-orange)',
  },
  'feature_flag.updated': {
    label: 'Flag updated',
    bg: 'rgba(232,66,10,0.2)',
    color: 'var(--admin-orange)',
  },
};

const actionStyle = (action: string) =>
  FLAG_ACTION_STYLES[action] ?? {
    label: action,
    bg: 'rgba(232,66,10,0.2)',
    color: 'var(--admin-orange)',
  };

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

/** Details cell for feature_flag.deleted rows: archived count + per-flag keys. */
function FlagDeletedDetails({ log }: { log: AuditLogEntry }) {
  const { count, keys } = archivedFromDetails(log);
  const shown = keys.slice(0, 3);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span>
        {log.targetType}
        {log.targetId ? `: ${log.targetId}` : ''}
      </span>
      {count > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(31,138,76,0.2)',
              color: 'var(--admin-emerald)',
            }}
            title="Flag state archived to this entry before removal — restorable from the audit archive"
          >
            🗂 {count} archived flag{count === 1 ? '' : 's'}
          </span>
          {shown.map((k) => (
            <code key={k} style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}>
              {k}
            </code>
          ))}
          {keys.length > shown.length && (
            <span style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}>
              +{keys.length - shown.length} more
            </span>
          )}
        </span>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Deep-link support, mirroring the flags pages' ?stale=1 pattern: the admin
  // nav badge links to ?action=feature_flag.deleted&range=24h so the page
  // lands pre-filtered to removal activity. The params seed the initial chips;
  // any chip/range interaction clears them so local state takes over.
  const urlAction = searchParams.get('action');
  const urlRange = searchParams.get('range');
  const initialFilterId =
    urlAction === 'feature_flag.deleted'
      ? 'removals'
      : (Object.entries(FILTERS).find(
          ([, f]) => f.targetType === searchParams.get('targetType')
        )?.[0] ?? 'all');
  const [filterId, setFilterId] = useState(initialFilterId);
  const filter = FILTERS[filterId] ?? { label: 'All' };
  // Quick time-range scope (24h / 7d / 30d) — pairs with the target-type
  // chips so ops can e.g. see only the last 24h of universe-flag prunes.
  const [range, setRange] = useState(urlRange && urlRange in RANGES ? urlRange : 'all');
  const rangeDays = RANGES[range]?.days;
  const startDate = rangeDays
    ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  // Interacting with a chip/range makes the local state authoritative — drop
  // any deep-link params so the page never silently keeps the badge's scope.
  const selectFilter = (id: string) => {
    setFilterId(id);
    setSearchParams({});
  };
  const selectRange = (id: string) => {
    setRange(id);
    setSearchParams({});
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', filterId, range],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs({
        // Every chip maps to the backend's real targetType/action filter
        // (targetType groups arrive comma-separated → { in: [...] }).
        ...(filter.targetType ? { targetType: filter.targetType } : {}),
        ...(filter.action ? { action: filter.action } : {}),
        ...(startDate ? { startDate } : {}),
        limit: 50,
      });
      return res.success
        ? (res.data as { logs: AuditLogEntry[]; total: number })
        : { logs: [], total: 0 };
    },
  });

  const logs = data?.logs || [];

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Audit Logs</h1>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 24 }}>{data?.total || 0} total entries</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {Object.entries(FILTERS).map(([id, f]) => (
          <button
            key={id}
            onClick={() => selectFilter(id)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: filterId === id ? 'none' : '1px solid var(--admin-surface)',
              background:
                filterId === id
                  ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                  : 'transparent',
              color: filterId === id ? 'white' : 'var(--admin-text-muted)',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Time range — narrows the window via the backend's startDate param. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 12, fontWeight: 600 }}>Time range</span>
        {Object.entries(RANGES).map(([id, r]) => (
          <button
            key={id}
            onClick={() => selectRange(id)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: range === id ? 'none' : '1px solid var(--admin-surface)',
              background: range === id ? 'var(--admin-orange)' : 'transparent',
              color: range === id ? 'white' : 'var(--admin-text-muted)',
              fontWeight: 500,
              fontSize: 12,
              cursor: 'pointer',
            }}
            title={
              r.days
                ? `Only entries from the last ${r.days * 24}h`
                : 'Show every entry regardless of age'
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'rgba(26,10,10,0.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-surface)' }}>
                  {['Timestamp', 'User', 'Action', 'Details', 'IP'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: 'var(--admin-text-muted)',
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--admin-bg)' }}>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'var(--admin-text-muted)',
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{log.actorId}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        title={log.action}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: actionStyle(log.action).bg,
                          color: actionStyle(log.action).color,
                        }}
                      >
                        {actionStyle(log.action).label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'var(--admin-text-muted)',
                        fontSize: 13,
                        maxWidth: 220,
                        ...(log.action === 'feature_flag.deleted'
                          ? { overflow: 'visible', whiteSpace: 'normal' }
                          : {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' as const,
                            }),
                      }}
                    >
                      {log.action === 'feature_flag.deleted' ? (
                        <FlagDeletedDetails log={log} />
                      ) : (
                        <>
                          {log.targetType}
                          {log.targetId ? `: ${log.targetId}` : ''}
                        </>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)', fontSize: 13 }}>
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No audit logs found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
