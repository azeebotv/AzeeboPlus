import { useConfirm } from "@/components/ui";
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import { asArray, requireData } from '@/lib/payload';
import { Icon } from '@/components/Icons';

interface UniverseFeatureFlagRow {
  id: string;
  universeId: string;
  featureKey: string;
  isEnabled: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  universe: { id: string; name: string; displayName: string };
}

interface AdminUniverseOption {
  id: string;
  name: string;
  displayName: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid var(--admin-surface)',
  backgroundColor: 'var(--admin-dark)',
  color: 'var(--admin-text)',
  fontSize: 14,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = { color: 'var(--admin-text-muted)', fontSize: 13 };

// Per-tab persistence key for the stale-filter choice (sessionStorage): once
// the user arrives via the badge (?stale=1), the choice sticks for the tab
// session, so a refresh keeps the stale view instead of dropping back to all
// flags. "Show all flags" clears it.
const STALE_STORAGE_KEY = 'admin-flags-universe-stale-view';

const readStoredStale = (): boolean => {
  try {
    return window.sessionStorage.getItem(STALE_STORAGE_KEY) === '1';
  } catch {
    return false; // storage unavailable — the URL param still works
  }
};

export default function FeatureFlagsPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // ?stale=1 (linked from the admin nav badge) pre-filters the list to the
  // expiry backlog — universe flags past their metadata.staleAfter date. The
  // sessionStorage choice restores the same view after a refresh (or a plain
  // sidebar visit) within this tab.
  const [storedStale, setStoredStale] = useState<boolean>(readStoredStale);
  const staleOnly = searchParams.get('stale') === '1' || storedStale;
  // Write-through: arriving via ?stale=1 (badge or deep-link) persists the
  // choice for this tab session.
  useEffect(() => {
    if (searchParams.get('stale') === '1') {
      try {
        window.sessionStorage.setItem(STALE_STORAGE_KEY, '1');
      } catch {
        /* storage unavailable — the URL param already shows the view */
      }
    }
  }, [searchParams]);
  // #stale (appended to the nav-badge / summary links) is the hash-fragment
  // shortcut: it ALSO auto-scrolls to and highlights the first stale row,
  // not just filters. The router re-renders on hash-only navigations.
  const { hash } = useLocation();
  const staleShortcut = staleOnly || hash === '#stale';

  // Enter/leave stale mode from the page itself (the "Stale only" chip and
  // the banner's "Show all flags"): both keep the sessionStorage choice and
  // the URL in sync, so a refresh agrees with the rendered view.
  const enterStaleMode = () => {
    try {
      window.sessionStorage.setItem(STALE_STORAGE_KEY, '1');
    } catch {
      /* storage unavailable — the URL param still drives the view */
    }
    setStoredStale(true);
    navigate('/feature-flags?stale=1#stale');
  };
  const exitStaleMode = () => {
    try {
      window.sessionStorage.removeItem(STALE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setStoredStale(false);
    navigate('/feature-flags');
  };
  const toggleStaleMode = () => (staleOnly ? exitStaleMode() : enterStaleMode());
  // ?flag=<featureKey>&universe=<universeId> (linked from the top-bar stale
  // summary rows) deep-links to a specific flag: the list is scrolled to it
  // and the row is highlighted.
  const focusFeatureKey = searchParams.get('flag');
  const focusUniverseId = searchParams.get('universe');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [staleDrafts, setStaleDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    universeId: '',
    key: '',
    description: '',
    rolloutPercentage: '100',
    userIds: '',
    staleAfter: '',
  });

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async () => {
      const data = requireData(await adminApi.listFeatureFlags(), []);
      // Backend getAll() returns a bare array — but never trust it: a future
      // envelope (or an error object) used to crash the whole tree with
      // "flags.filter is not a function". Coerce through the shared guard.
      return asArray<UniverseFeatureFlagRow>(data);
    },
  });

  const { data: universes = [] } = useQuery({
    queryKey: ['admin', 'universes'],
    queryFn: async () => {
      const data = requireData(await adminApi.getAllUniverses(1, 100), []);
      // getAllUniverses returns the paginated envelope { data: [...], meta }
      // — NOT a bare array (a bare-array cast crashed this page with
      // "universes.filter is not a function" before the payload helpers).
      return asArray<AdminUniverseOption>(data, 'data');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (args: { universeId: string; flag: Record<string, unknown> }) =>
      adminApi.createFeatureFlag(args.universeId, args.flag as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      setShowCreate(false);
      setForm({
        universeId: '',
        key: '',
        description: '',
        rolloutPercentage: '100',
        userIds: '',
        staleAfter: '',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (args: { universeId: string; flag: UniverseFeatureFlagRow }) =>
      adminApi.toggleFeatureFlag(args.universeId, {
        featureKey: args.flag.featureKey,
        isEnabled: !args.flag.isEnabled,
        metadata: args.flag.metadata ?? undefined,
      } as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (args: { universeId: string; featureKey: string }) =>
      adminApi.deleteFeatureFlagByKey(args.universeId, args.featureKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] }),
  });

  /** Update a flag's metadata (full-replace PUT) — used by the expiry editor. */
  const [pruneFeedback, setPruneFeedback] = useState<{
    message: string;
    error?: boolean;
    /** The confirmed pruned batch, so 'undo' can restore exactly those. */
    removed?: Array<{ universeId: string; featureKey: string }>;
  } | null>(null);
  const pruneMutation = useMutation({
    mutationFn: (keys?: Array<{ universeId: string; featureKey: string }>) =>
      adminApi.pruneStaleUniverseFlags(keys),
    onSuccess: (res, keys) => {
      const d = res?.data;
      const count = d?.removedCount ?? 0;
      setPruneFeedback({
        message:
          count === 0
            ? 'No stale universe flags were removed (nothing past staleAfter).'
            : `Removed ${count} stale universe flag(s) — ${d?.archivedCount ?? 0} archived to the audit log` +
              (d?.skipped?.length ? `, ${d.skipped.length} skipped` : '') +
              (d?.removedKeys?.length ? ` Removed: ${d.removedKeys.join(', ')}` : ''),
        removed: keys,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      // Recently removed section + audit-log badge (nav): removal activity happened.
      queryClient.invalidateQueries({ queryKey: ['admin', 'recently-deleted-universe-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
    onError: (err: unknown) => {
      setPruneFeedback({
        message: `Remove failed: ${err instanceof Error ? err.message : String(err)}`,
        error: true,
      });
    },
  });

  const restoreUniverseMutation = useMutation({
    mutationFn: (keys: Array<{ universeId: string; featureKey: string }>) =>
      adminApi.restoreUniverseFlags(keys),
    onSuccess: (res, keys) => {
      const d = res?.data;
      setPruneFeedback({
        message:
          `Restored ${d?.restoredCount ?? 0} of ${keys.length} universe flag(s) from the audit archive.` +
          (d?.skipped?.length
            ? ` Skipped: ${d.skipped.map((s) => `${s.key} (${s.reason})`).join(', ')}`
            : ''),
        removed: undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      // The restored rows are no longer in the recently-removed list.
      queryClient.invalidateQueries({ queryKey: ['admin', 'recently-deleted-universe-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
    onError: (err: unknown) => {
      setPruneFeedback({
        message: `Restore failed: ${err instanceof Error ? err.message : String(err)}`,
        error: true,
      });
    },
  });

  const undoPruneUniverse = async () => {
    const removed = pruneFeedback?.removed;
    if (!removed?.length) return;
    const ok = await confirm({ title: "Restore Flags", message: `Restore ${removed.length} universe flag(s) from the audit archive?`, variant: "info" });
    if (ok) {
      restoreUniverseMutation.mutate(removed);
    }
  };

  const confirmPruneUniverse = async () => {
    if (staleFlags.length === 0) return;
    const keys = staleFlags.map((f) => ({ universeId: f.universeId, featureKey: f.featureKey }));
    const list = staleFlags
      .map((f) => `${f.universe?.name ?? f.universeId}.${f.featureKey}`)
      .join('\n');
    const ok = await confirm({ title: "Prune Stale Flags", message: `Remove ${staleFlags.length} stale universe flag(s)? Each is archived to the audit log before deletion.\n\n${list}`, variant: "danger" });
    if (ok) {
      pruneMutation.mutate(keys);
    }
  };

  const expiryMutation = useMutation({
    mutationFn: (args: {
      universeId: string;
      flag: UniverseFeatureFlagRow;
      staleAfter?: string;
    }) => {
      const metadata: Record<string, unknown> = { ...(args.flag.metadata ?? {}) };
      if (args.staleAfter !== undefined) metadata.staleAfter = args.staleAfter;
      else delete metadata.staleAfter;
      return adminApi.toggleFeatureFlag(args.universeId, {
        featureKey: args.flag.featureKey,
        isEnabled: args.flag.isEnabled,
        metadata,
      } as never);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] }),
  });

  /** Commit the stale-after (expiry) date for a flag. Empty clears the expiry. */
  const commitStaleAfter = (flag: UniverseFeatureFlagRow) => {
    const key = `${flag.universeId}:${flag.featureKey}`;
    const raw = (staleDrafts[key] ?? '').trim();
    // Empty clears the expiry; otherwise require a parseable date.
    if (raw !== '' && Number.isNaN(Date.parse(raw))) {
      return; // leave the draft so the user fixes it
    }
    expiryMutation.mutate({
      universeId: flag.universeId,
      flag,
      staleAfter: raw === '' ? undefined : new Date(raw).toISOString(),
    });
    setStaleDrafts((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });
  };

  const buildCreatePayload = (): Record<string, unknown> | null => {
    const key = form.key.trim();
    if (!key || !form.universeId) return null;
    const metadata: Record<string, unknown> = {};
    if (form.description.trim()) metadata.description = form.description.trim();
    const rollout = Number(form.rolloutPercentage);
    if (!Number.isNaN(rollout) && rollout >= 0 && rollout <= 100)
      metadata.rolloutPercentage = rollout;
    const userIds = form.userIds
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    if (userIds.length > 0) metadata.userIds = userIds;
    if (form.staleAfter.trim()) metadata.staleAfter = form.staleAfter.trim();
    return { featureKey: key, isEnabled: true, metadata };
  };

  const filtered = flags.filter((f) => {
    const matchesSearch =
      !search ||
      f.featureKey.toLowerCase().includes(search.toLowerCase()) ||
      f.universe?.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (staleOnly) {
      const staleAfter = f.metadata?.staleAfter;
      return (
        typeof staleAfter === 'string' &&
        !Number.isNaN(Date.parse(staleAfter)) &&
        new Date(staleAfter) < new Date()
      );
    }
    return true;
  });

  const enabledCount = flags.filter((f) => f.isEnabled).length;
  const staleFlags = flags.filter((f) => {
    const staleAfter = f.metadata?.staleAfter;
    return (
      typeof staleAfter === 'string' &&
      !Number.isNaN(Date.parse(staleAfter)) &&
      new Date(staleAfter) < new Date()
    );
  });

  // Focus target: a specific ?flag=+?universe= deep-link wins; otherwise the
  // stale shortcut (?stale=1 / #stale) focuses the FIRST stale row so the
  // badge lands on an expiry candidate, not just a filtered list.
  const focusTargetKey =
    focusFeatureKey && focusUniverseId
      ? `${focusUniverseId}:${focusFeatureKey}`
      : staleShortcut && staleFlags[0]
        ? `${staleFlags[0].universeId}:${staleFlags[0].featureKey}`
        : null;

  // Auto-scroll to the focused flag once its row renders (data loads async),
  // scrolling only once per target. The highlight persists while the
  // ?flag=+?universe= params or the stale shortcut is present.
  const scrolledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!focusTargetKey) return;
    if (scrolledRef.current === focusTargetKey) return;
    const el = document.getElementById(`flag-row-${focusTargetKey}`);
    if (!el) return;
    scrolledRef.current = focusTargetKey;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusTargetKey, filtered]);

  // Recently removed universe flags (undo list): restorable from their
  // archived audit snapshots (feature_flag.deleted + universe_feature_flag).
  const { data: recentlyDeleted = [] } = useQuery<
    Array<{
      key: string;
      universeId?: string;
      featureKey?: string;
      universeName?: string;
      deletedAt: string;
      deletedBy?: string | null;
      archived: boolean;
      enabled?: boolean;
    }>
  >({
    queryKey: ['admin', 'recently-deleted-universe-flags'],
    queryFn: async () => {
      const res = await adminApi.listRecentlyDeletedUniverseFlags();
      return requireData(res, []);
    },
  });
  const [showDeleted, setShowDeleted] = useState(false);

  return (
    <div>
      {/* Flash animation for the deep-linked (focused) flag row — brightens
          once on arrival, then settles into the persistent highlight. */}
      <style>{`@keyframes flagFlash {
  0% { background-color: rgba(232,66,10,0.45); }
  100% { background-color: rgba(232,66,10,0.12); }
}`}</style>
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
            style={{
              fontSize: 28,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Icon name="flag" size={26} color="var(--admin-orange)" />
            Feature Flags
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>
            {flags.length} flags ({enabledCount} enabled)
            {staleFlags.length > 0 && (
              <span style={{ color: 'var(--admin-orange)', marginLeft: 8 }}>
                · {staleFlags.length} stale
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={confirmPruneUniverse}
            disabled={staleFlags.length === 0 || pruneMutation.isPending}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: '1px solid var(--admin-surface)',
              background: staleFlags.length > 0 ? 'var(--admin-orange)' : 'var(--admin-bg)',
              color: staleFlags.length > 0 ? 'white' : 'var(--admin-text-muted)',
              cursor: staleFlags.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: 14,
            }}
            title={
              staleFlags.length === 0
                ? 'No universe flags are past their staleAfter date'
                : 'Archive + remove every universe flag past its staleAfter date'
            }
          >
            {pruneMutation.isPending ? 'Removing…' : `Remove stale flags (${staleFlags.length})`}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <Icon name="plus" size={16} color="#FFFFFF" />
            Create Flag
          </button>
        </div>
      </div>

      {pruneFeedback && (
        <div style={{ marginBottom: 12, maxWidth: 480 }}>
          <p
            style={{
              fontSize: 12,
              color: pruneFeedback.error ? 'var(--admin-orange)' : 'var(--admin-green)',
              whiteSpace: 'pre-wrap',
              margin: '0 0 6px',
            }}
          >
            {pruneFeedback.message}
          </p>
          {!pruneFeedback.error && pruneFeedback.removed?.length ? (
            <button
              onClick={undoPruneUniverse}
              disabled={restoreUniverseMutation.isPending}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: '1px solid var(--admin-surface)',
                background: 'var(--admin-green)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {restoreUniverseMutation.isPending ? (
                'Restoring…'
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="undo" size={13} color="white" />
                  Undo — restore from audit archive
                </span>
              )}
            </button>
          ) : null}
        </div>
      )}

      {recentlyDeleted.length > 0 && (
        <div
          style={{
            border: '1px solid var(--admin-card)',
            borderRadius: 10,
            marginBottom: 16,
            background: 'rgba(31,138,76,0.05)',
          }}
        >
          <button
            onClick={() => setShowDeleted((v) => !v)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <span>
              Recently removed universe flags ({recentlyDeleted.length}) — restorable from the audit
              archive
            </span>
            <Icon
              name={showDeleted ? 'chevronDown' : 'chevronRight'}
              size={14}
              color="var(--admin-text-muted)"
            />
          </button>
          {showDeleted && (
            <div style={{ padding: '0 18px 18px' }}>
              {recentlyDeleted.map((f) => {
                // The restore endpoint identifies flags by snapshot identity
                // (universeId + featureKey); without an archive there is
                // nothing to replay, so the row renders as not-restorable.
                const restorable = f.archived && !!f.universeId && !!f.featureKey;
                const label = [f.universeName, f.featureKey].filter(Boolean).join('.') || f.key;
                return (
                  <div
                    key={`${f.universeId ?? ''}:${f.featureKey ?? ''}:${f.deletedAt}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid var(--admin-card)',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <code style={{ color: 'var(--admin-text-muted)' }}>{label}</code>
                      <span
                        style={{ color: 'var(--admin-text-muted)', marginLeft: 8, fontSize: 12 }}
                      >
                        removed {f.deletedAt ? new Date(f.deletedAt).toLocaleString() : ''}
                        {f.deletedBy ? ` by ${f.deletedBy}` : ''}
                        {!f.archived ? ' · no archive' : ''}
                      </span>
                    </div>
                    {restorable && (
                      <button
                        onClick={async () => {
                          const ok = await confirm({ title: "Restore Flag", message: `Restore "${label}" from the audit archive?`, variant: "info" });
    if (!ok) return;
                          restoreUniverseMutation.mutate([
                            { universeId: f.universeId!, featureKey: f.featureKey! },
                          ]);
                        }}
                        disabled={restoreUniverseMutation.isPending}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--admin-surface)',
                          background: 'var(--admin-green)',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        Restore
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {staleOnly && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid #7A2A0A',
            backgroundColor: 'rgba(122,42,10,0.15)',
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <span style={{ color: 'var(--admin-text)', fontWeight: 600 }}>
            Showing {staleFlags.length} stale universe flag(s) — expiry backlog
          </span>
          <button
            onClick={exitStaleMode}
            style={{
              marginLeft: 'auto',
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid var(--admin-surface)',
              background: 'transparent',
              color: 'var(--admin-text-muted)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Show all flags
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search flags by key or universe..."
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        {/* "Stale only" toggle — switch the view without the nav badge. */}
        <button
          onClick={toggleStaleMode}
          title={
            staleOnly
              ? 'Show all flags — clear the stale-only filter'
              : 'Show only flags past their staleAfter expiry'
          }
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: staleOnly ? '1px solid #FF9E6B' : '1px solid var(--admin-surface)',
            background: staleOnly ? 'var(--admin-orange)' : 'transparent',
            color: staleOnly ? 'var(--admin-text-muted)' : 'var(--admin-text-muted)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {staleOnly ? `Stale only (${staleFlags.length})` : 'Stale only'}
        </button>
      </div>

      {showCreate && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Create Feature Flag</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={labelStyle}>Universe *</label>
              <select
                value={form.universeId}
                onChange={(e) => setForm({ ...form, universeId: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select universe...</option>
                {universes.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || u.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="Flag key (e.g., voting_enabled, predictions_enabled)"
              style={inputStyle}
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <label style={labelStyle}>Rollout % (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.rolloutPercentage}
                  onChange={(e) => setForm({ ...form, rolloutPercentage: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 2 }}>
                <label style={labelStyle}>User allowlist (comma-separated IDs)</label>
                <input
                  value={form.userIds}
                  onChange={(e) => setForm({ ...form, userIds: e.target.value })}
                  placeholder="user-1,user-2"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={labelStyle}>Stale after (ISO date, optional)</label>
              <input
                value={form.staleAfter}
                onChange={(e) => setForm({ ...form, staleAfter: e.target.value })}
                placeholder="2026-09-01T00:00:00Z"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  const payload = buildCreatePayload();
                  if (payload) saveMutation.mutate({ universeId: form.universeId, flag: payload });
                }}
                disabled={saveMutation.isPending || !form.key.trim() || !form.universeId}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: !form.key.trim() || !form.universeId ? 0.5 : 1,
                }}
              >
                {saveMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((flag) => {
            const rollout = flag.metadata?.rolloutPercentage as number | undefined;
            const userIds = (flag.metadata?.userIds as string[] | undefined) ?? [];
            const staleAfter = flag.metadata?.staleAfter as string | undefined;
            const isStale =
              typeof staleAfter === 'string' &&
              !Number.isNaN(Date.parse(staleAfter)) &&
              new Date(staleAfter) < new Date();
            const rowKey = `${flag.universeId}:${flag.featureKey}`;
            const isFocused = focusTargetKey === rowKey;
            return (
              <div
                key={rowKey}
                id={`flag-row-${rowKey}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: isFocused
                    ? '2px solid var(--admin-orange)'
                    : `1px solid ${isStale ? 'var(--admin-orange)' : 'var(--admin-card)'}`,
                  backgroundColor: isFocused ? 'rgba(232,66,10,0.12)' : 'var(--admin-surface)',
                  boxShadow: isFocused ? '0 0 0 3px rgba(232,66,10,0.25)' : undefined,
                  animation: isFocused ? 'flagFlash 1.8s ease-out' : undefined,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{flag.featureKey}</p>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: flag.isEnabled
                          ? 'var(--admin-green)'
                          : 'var(--admin-dark)',
                        color: flag.isEnabled ? 'var(--admin-emerald)' : 'var(--admin-red)',
                      }}
                    >
                      {flag.isEnabled ? 'ON' : 'OFF'}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: 11,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'var(--admin-text-muted)',
                      }}
                    >
                      {flag.universe?.displayName || flag.universe?.name || 'unknown'}
                    </span>
                    {isStale && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'rgba(232,66,10,0.25)',
                          color: 'var(--admin-orange)',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        title={`staleAfter (${new Date(staleAfter as string).toLocaleDateString()}) has passed — removal candidate. ${
                          typeof flag.metadata?.staleNotifiedAt === 'string'
                            ? `Owner already notified by the stale sweep on ${new Date(flag.metadata.staleNotifiedAt as string).toLocaleString()}.`
                            : 'Owner not yet notified by the stale sweep (pending).'
                        } Clear or extend the expiry below.`}
                      >
                        stale · past expiry
                        {typeof flag.metadata?.staleNotifiedAt === 'string'
                          ? ' · notified'
                          : ' · un-notified'}
                      </span>
                    )}
                  </div>
                  {flag.metadata?.description != null && (
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginTop: 4 }}>
                      {String(flag.metadata.description)}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {rollout !== undefined && rollout < 100 && (
                      <span style={{ color: 'var(--admin-orange)', fontSize: 11 }}>
                        Rollout: {rollout}%
                      </span>
                    )}
                    {userIds.length > 0 && (
                      <span style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}>
                        Allowlist: {userIds.length} user{userIds.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}>
                      stale after
                    </span>
                    <input
                      type="date"
                      value={
                        staleDrafts[`${flag.universeId}:${flag.featureKey}`] ??
                        (staleAfter ? staleAfter.slice(0, 10) : '')
                      }
                      onChange={(e) =>
                        setStaleDrafts({
                          ...staleDrafts,
                          [`${flag.universeId}:${flag.featureKey}`]: e.target.value,
                        })
                      }
                      style={{ ...inputStyle, width: 150, padding: '4px 8px', fontSize: 11 }}
                      aria-label={`${flag.featureKey} stale-after date`}
                    />
                    <button
                      onClick={() => commitStaleAfter(flag)}
                      disabled={!staleDrafts[`${flag.universeId}:${flag.featureKey}`]}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: staleDrafts[`${flag.universeId}:${flag.featureKey}`]
                          ? 'var(--admin-orange)'
                          : 'var(--admin-surface)',
                        color: staleDrafts[`${flag.universeId}:${flag.featureKey}`]
                          ? 'white'
                          : 'var(--admin-text-muted)',
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: staleDrafts[`${flag.universeId}:${flag.featureKey}`]
                          ? 'pointer'
                          : 'not-allowed',
                      }}
                      title="Set the date after which this flag is a removal candidate"
                    >
                      Set expiry
                    </button>
                    <button
                      onClick={() =>
                        expiryMutation.mutate({
                          universeId: flag.universeId,
                          flag,
                          staleAfter: undefined,
                        })
                      }
                      disabled={!staleAfter}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: staleAfter ? 'var(--admin-text-muted)' : 'var(--admin-text-muted)',
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: staleAfter ? 'pointer' : 'not-allowed',
                      }}
                      title="Remove the expiry (flag never goes stale)"
                    >
                      Clear expiry
                    </button>
                    {staleAfter && (
                      <span style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}>
                        expires {new Date(staleAfter).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleMutation.mutate({ universeId: flag.universeId, flag })}
                    disabled={toggleMutation.isPending}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: flag.isEnabled ? '1px solid #3B0D0D' : '1px solid var(--admin-green)',
                      background: flag.isEnabled ? 'rgba(59,13,13,0.5)' : 'rgba(13,59,46,0.5)',
                      color: flag.isEnabled ? 'var(--admin-red)' : 'var(--admin-emerald)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {flag.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Delete Flag",
                        message: `Delete flag "${flag.featureKey}" from ${flag.universe?.name}?`,
                        variant: "danger",
                      });
                      if (ok) {
                        deleteMutation.mutate({
                          universeId: flag.universeId,
                          featureKey: flag.featureKey,
                        });
                      }
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      background: 'transparent',
                      color: 'var(--admin-text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              {search ? 'No flags match your search' : 'No feature flags yet'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
