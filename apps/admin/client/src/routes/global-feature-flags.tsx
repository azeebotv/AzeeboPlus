import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/api/admin';
import type { GlobalFeatureFlag, LastNightlyRun, StaleFlagMetrics } from '@/lib/admin-types';
import { requireData } from '@/lib/payload';
import { Icon } from '@/components/Icons';
import { pollingIntervals } from '@azeebo/design-tokens';

interface ServiceContext {
  label: string;
  description: string;
}

/** Service contexts derived from the typed flag registries' key prefixes. */
const SERVICE_CONTEXTS: Record<string, ServiceContext> = {
  queue: {
    label: 'queue-service',
    description: 'Worker concurrency & dead-letter retry policy (BullMQ)',
  },
  search: { label: 'search-service', description: 'Universal search & fuzzy typo tolerance' },
  media: { label: 'media-service', description: 'Upload, CDN edge cache & transcoding' },
  notification: { label: 'notification-service', description: 'Email / push / SMS delivery' },
  auth: { label: 'auth-service', description: 'Signup, MFA, OTP & email verification' },
  payment: { label: 'payment-service', description: 'Payment providers, webhooks & checkout' },
  wallet: { label: 'wallet-service', description: 'Balances, transfers & ledger' },
  creator: { label: 'creator-service', description: 'Payouts, tips & monetization' },
  subscription: { label: 'subscription-service', description: 'Bundles, trials & dunning' },
  content: { label: 'content-service', description: 'Moderation, transcoding & ingestion' },
  gateway: { label: 'api-gateway', description: 'Maintenance mode, routing & rate limits' },
  user: { label: 'user-service', description: 'Profiles, follow system & deletion' },
  recommendation: { label: 'recommendation-service', description: 'Personalized feed' },
  analytics: { label: 'analytics-service', description: 'Analytics pipeline' },
  reward: { label: 'reward-service', description: 'Points, streaks, badges & missions' },
};

/** Flag whose off-flip stops CDN edge caching — carries the purge action. */
const MEDIA_CDN_EDGE_CACHE_FLAG = 'media_cdn_edge_cache';

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

/** Derive the owning service context from a flag key's first segment. */
function contextFor(key: string): ServiceContext | undefined {
  const prefix = key.split('.')[0]?.split('_')[0] ?? '';
  return SERVICE_CONTEXTS[prefix];
}

/** True when the flag carries a non-boolean (numeric / variant) payload. */
function isNumericFlag(flag: GlobalFeatureFlag): boolean {
  return typeof flag.value === 'number';
}

/** Human labels for the last nightly pass's webhook status. */
const WEBHOOK_LABEL: Record<LastNightlyRun['webhook'], string> = {
  posted: 'webhook posted',
  'skipped-empty': 'skipped · empty',
  'no-webhook': 'no webhook',
  failed: 'webhook failed',
};
const WEBHOOK_BG: Record<LastNightlyRun['webhook'], string> = {
  posted: 'rgba(31,138,76,0.2)',
  'skipped-empty': 'rgba(245,240,235,0.08)',
  'no-webhook': 'rgba(245,240,235,0.08)',
  failed: 'rgba(232,66,10,0.25)',
};
const WEBHOOK_FG: Record<LastNightlyRun['webhook'], string> = {
  posted: 'var(--admin-emerald)',
  'skipped-empty': 'var(--admin-text-muted)',
  'no-webhook': 'var(--admin-text-muted)',
  failed: 'var(--admin-orange)',
};

function flagValueLabel(flag: GlobalFeatureFlag): string {
  if (typeof flag.value === 'number') return String(flag.value);
  return flag.enabled ? 'on' : 'off';
}

// Per-tab persistence key for the stale-filter choice (sessionStorage): once
// the user arrives via the badge (?stale=1), the choice sticks for the tab
// session, so a refresh keeps the stale view instead of dropping back to all
// flags. "Show all flags" clears it.
const STALE_STORAGE_KEY = 'admin-flags-global-stale-view';

const readStoredStale = (): boolean => {
  try {
    return window.sessionStorage.getItem(STALE_STORAGE_KEY) === '1';
  } catch {
    return false; // storage unavailable — the URL param still works
  }
};

export default function GlobalFeatureFlagsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // ?stale=1 (linked from the admin nav badge) pre-filters the list to
  // removal candidates — flags past their staleAfter date. The sessionStorage
  // choice restores the same view after a refresh (or a plain sidebar visit)
  // within this tab.
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
    navigate('/feature-flags/global?stale=1#stale');
  };
  const exitStaleMode = () => {
    try {
      window.sessionStorage.removeItem(STALE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setStoredStale(false);
    navigate('/feature-flags/global');
  };
  const toggleStaleMode = () => (staleOnly ? exitStaleMode() : enterStaleMode());
  // ?flag=<key> (linked from the top-bar stale summary rows) deep-links to a
  // specific flag: the list is scrolled to it and the row is highlighted.
  const focusKey = searchParams.get('flag');
  const [search, setSearch] = useState('');
  const [contextFilter, setContextFilter] = useState<string>('all');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  // Rollout % / user-ID targeting drafts for boolean flags (strings while
  // editing; parsed + clamped on commit).
  const [targetingDrafts, setTargetingDrafts] = useState<
    Record<string, { rollout?: string; userIds?: string }>
  >({});
  // Stale-after (expiry) drafts: ISO date strings while editing.
  const [staleDrafts, setStaleDrafts] = useState<Record<string, string>>({});

  const { data: flags = [], isLoading } = useQuery<GlobalFeatureFlag[]>({
    queryKey: ['admin', 'global-feature-flags'],
    queryFn: async () => {
      const res = await adminApi.listGlobalFeatureFlags();
      return requireData(res, []);
    },
  });

  // Prometheus flag_stale_running_total joined per key — which stale flags are
  // ACTIVELY being served past expiry (not just removal candidates).
  const { data: staleMetrics } = useQuery<StaleFlagMetrics>({
    queryKey: ['admin', 'global-feature-flags', 'stale-metrics'],
    queryFn: async () => {
      const res = await adminApi.listStaleFlagMetrics();
      return res.success && res.data
        ? res.data
        : { available: false, fetchedAt: null, staleRunning: {}, autoDisabled: {} };
    },
    staleTime: 30_000,
    // Poll every 30s — the admin backend caches the Prometheus join for the
    // same window, so the dashboard stays live without hammering Prometheus.
    refetchInterval: pollingIntervals.dashboard,
  });

  // Most recent nightly pass (audit-recorded): times, counts, webhook status.
  // Polled so the panel stays fresh when ops triggers a pass from elsewhere
  // without opening the page.
  const { data: lastRun } = useQuery<LastNightlyRun | null>({
    queryKey: ['admin', 'global-feature-flags', 'last-nightly-run'],
    queryFn: async () => {
      const res = await adminApi.getLastNightlyRun();
      return res.success ? (res.data ?? null) : null;
    },
    refetchInterval: pollingIntervals.idle,
  });

  const saveMutation = useMutation({
    mutationFn: (args: { key: string; data: Partial<GlobalFeatureFlag> }) =>
      adminApi.updateGlobalFeatureFlag(args.key, args.data),
    onSuccess: (_data, args) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'global-feature-flags'] });
      setDrafts((d) => {
        const next = { ...d };
        delete next[args.key];
        return next;
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) => adminApi.resetGlobalFeatureFlag(key),
    onSuccess: (_data, key) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'global-feature-flags'] });
      setDrafts((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
    },
  });

  const [purgeFeedback, setPurgeFeedback] = useState<{
    message: string;
    error?: boolean;
  } | null>(null);

  const purgeMutation = useMutation({
    mutationFn: () => adminApi.purgeCdn({ prefix: 'uploads' }),
    onSuccess: (res) => {
      const purged =
        res?.data && typeof (res.data as { purged?: number }).purged === 'number'
          ? (res.data as { purged: number }).purged
          : undefined;
      setPurgeFeedback({
        message:
          purged === undefined
            ? 'Purge accepted.'
            : purged === 0
              ? 'Purge accepted — no paths submitted (CDN not configured in this env).'
              : `Purge accepted — ${purged} path(s) submitted for invalidation.`,
      });
    },
    onError: (err: unknown) => {
      setPurgeFeedback({
        message: `Purge failed: ${err instanceof Error ? err.message : String(err)}`,
        error: true,
      });
    },
  });

  const confirmPurge = () => {
    if (!window.confirm('Invalidate all cached uploads at the CDN edge (/uploads/*)?')) return;
    setPurgeFeedback(null);
    purgeMutation.mutate();
  };

  const contextsPresent = useMemo(() => {
    const seen = new Map<string, ServiceContext>();
    for (const flag of flags) {
      const ctx = contextFor(flag.key);
      const prefix = flag.key.split('.')[0]?.split('_')[0] ?? '';
      if (ctx && !seen.has(prefix)) {
        seen.set(prefix, ctx);
      }
    }
    return Array.from(seen.values());
  }, [flags]);

  const filtered = flags.filter((flag) => {
    const ctx = contextFor(flag.key);
    const matchesContext =
      contextFilter === 'all' ||
      ctx?.label === contextFilter ||
      (contextFilter === 'other' && !ctx);
    if (!matchesContext) return false;
    if (staleOnly && !(flag.staleAfter && Date.parse(flag.staleAfter) <= Date.now())) {
      return false;
    }
    if (!search) return true;
    const haystack = [flag.key, flag.description ?? '', ctx?.label ?? ''].join(' ').toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const numericCount = flags.filter(isNumericFlag).length;

  const commitDraft = (flag: GlobalFeatureFlag) => {
    const raw = (drafts[flag.key] ?? '').trim();
    const value = Number(raw);
    if (raw === '' || Number.isNaN(value)) {
      // Clear a bad draft so the input snaps back to the stored value.
      setDrafts((d) => {
        const next = { ...d };
        delete next[flag.key];
        return next;
      });
      return;
    }
    saveMutation.mutate({ key: flag.key, data: { value } });
  };

  /** Parse a comma/whitespace-separated user-ID list into a clean array. */
  const parseIds = (raw: string): string[] =>
    Array.from(
      new Set(
        raw
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

  /** Commit the rollout % + targeted user IDs for a boolean flag. */
  const commitTargeting = (flag: GlobalFeatureFlag) => {
    const draft = targetingDrafts[flag.key] ?? {};
    const currentRollout = flag.rolloutPercentage ?? 100;
    const rollout = Math.min(100, Math.max(0, Math.round(Number(draft.rollout) || currentRollout)));
    const userIds = parseIds(draft.userIds ?? (flag.userIds ?? []).join(', '));
    saveMutation.mutate({
      key: flag.key,
      data: { rolloutPercentage: rollout, userIds },
    });
    setTargetingDrafts((d) => {
      const next = { ...d };
      delete next[flag.key];
      return next;
    });
  };

  /** Serve the flag to everyone again (100% rollout, no targeted users). */
  const clearTargeting = (flag: GlobalFeatureFlag) => {
    saveMutation.mutate({
      key: flag.key,
      data: { rolloutPercentage: 100, userIds: [] },
    });
  };

  /** Commit the stale-after (expiry) date for a flag. */
  const commitStaleAfter = (flag: GlobalFeatureFlag) => {
    const raw = (staleDrafts[flag.key] ?? '').trim();
    // Empty clears the expiry; otherwise require a parseable ISO date.
    if (raw !== '' && Number.isNaN(Date.parse(raw))) {
      return; // leave the draft so the user fixes it
    }
    saveMutation.mutate({
      key: flag.key,
      data: { staleAfter: raw === '' ? undefined : new Date(raw).toISOString() },
    });
    setStaleDrafts((d) => {
      const next = { ...d };
      delete next[flag.key];
      return next;
    });
  };

  /** Whether a flag's staleAfter has already passed (removal candidate). */
  const isStale = (flag: GlobalFeatureFlag): boolean =>
    Boolean(flag.staleAfter && Date.parse(flag.staleAfter) <= Date.now());

  const staleFlags = flags.filter(isStale);
  const servingStaleFlags = staleFlags.filter((f) => Boolean(staleMetrics?.staleRunning?.[f.key]));
  // Stale flags the self-disable safety has flipped off at least once — the
  // auto-off signal (counter is authoritative even if the stamp was cleared).
  const autoDisabledStaleFlags = staleFlags.filter(
    (f) => (staleMetrics?.autoDisabled?.[f.key]?.total ?? 0) > 0
  );

  // Focus target: a specific ?flag= deep-link wins; otherwise the stale
  // shortcut (?stale=1 / #stale) focuses the FIRST stale row so the badge
  // lands on a removal candidate, not just a filtered list.
  const focusTarget = focusKey ?? (staleShortcut ? (staleFlags[0]?.key ?? null) : null);

  // Auto-scroll to the focused flag once its row renders (data loads async),
  // scrolling only once per target. The highlight persists while the
  // ?flag= param or the stale shortcut is present.
  const scrolledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!focusTarget) return;
    if (scrolledRef.current === focusTarget) return;
    const el = document.getElementById(`flag-row-${focusTarget}`);
    if (!el) return;
    scrolledRef.current = focusTarget;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusTarget, filtered]);

  const [pruneFeedback, setPruneFeedback] = useState<{
    message: string;
    error?: boolean;
    removedKeys?: string[];
  } | null>(null);

  const pruneMutation = useMutation({
    mutationFn: (keys?: string[]) => adminApi.pruneStaleFlags(keys),
    onSuccess: (res) => {
      const d = res?.data;
      const count = d?.removedCount ?? 0;
      setPruneFeedback({
        message:
          count === 0
            ? 'No stale flags were removed (nothing past staleAfter).'
            : `Removed ${count} stale flag(s) — ${d?.archivedCount ?? 0} archived to the audit log` +
              (d?.skipped?.length ? `, ${d.skipped.length} skipped` : '') +
              '.' +
              (d?.removedKeys?.length ? ` Removed: ${d.removedKeys.join(', ')}` : ''),
        removedKeys: d?.removedKeys,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'global-feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'recently-deleted-flags'] });
      // Audit-log badge (nav): removal activity happened.
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
    onError: (err: unknown) => {
      setPruneFeedback({
        message: `Remove failed: ${err instanceof Error ? err.message : String(err)}`,
        error: true,
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (keys: string[]) => adminApi.restoreFlags(keys),
    onSuccess: (res, keys) => {
      const d = res?.data;
      setPruneFeedback({
        message:
          `Restored ${d?.restoredCount ?? 0} of ${keys.length} flag(s) from the audit archive.` +
          (d?.skipped?.length
            ? ` Skipped: ${d.skipped.map((s) => `${s.key} (${s.reason})`).join(', ')}`
            : ''),
        removedKeys: undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'global-feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'recently-deleted-flags'] });
      // Audit-log badge (nav): a restore removes the prune's activity signal
      // for the restored flags — refresh the count.
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
    onError: (err: unknown) => {
      setPruneFeedback({
        message: `Restore failed: ${err instanceof Error ? err.message : String(err)}`,
        error: true,
      });
    },
  });

  const undoPrune = () => {
    if (!pruneFeedback?.removedKeys?.length) return;
    if (
      !window.confirm(
        `Restore ${pruneFeedback.removedKeys.length} flag(s) from the audit archive?\n\n` +
          pruneFeedback.removedKeys.map((k) => `• ${k}`).join('\n')
      )
    )
      return;
    restoreMutation.mutate(pruneFeedback.removedKeys);
  };

  const confirmPrune = () => {
    if (staleFlags.length === 0) return;
    const keys = staleFlags.map((f) => f.key);
    const list = keys.map((k) => `• ${k}`).join('\n');
    if (
      !window.confirm(
        `Remove ${keys.length} stale flag(s)?\n\nEach is archived to the audit log before deletion; ` +
          `services fall back to the registered default.\n\n${list}`
      )
    )
      return;
    setPruneFeedback(null);
    pruneMutation.mutate(keys);
  };

  // Recently removed flags (undo list): restorable from their archived snapshots.
  const { data: recentlyDeleted = [] } = useQuery<
    Array<{
      key: string;
      deletedAt: string;
      deletedBy?: string | null;
      archived: boolean;
      enabled?: boolean;
    }>
  >({
    queryKey: ['admin', 'recently-deleted-flags'],
    queryFn: async () => {
      const res = await adminApi.listRecentlyDeletedFlags();
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
            Global Feature Flags
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>
            {flags.length} flags ({numericCount} numeric) · stored in Redis, merged with service
            defaults
          </p>
          {staleMetrics && (
            <>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color:
                    servingStaleFlags.length > 0
                      ? 'var(--admin-orange)'
                      : 'var(--admin-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {staleMetrics.available ? (
                  servingStaleFlags.length > 0 ? (
                    <>
                      <Icon name="alertTriangle" size={14} color="var(--admin-orange)" />
                      <span>
                        {servingStaleFlags.length} stale flag(s) actively served past expiry (last
                        5m)
                      </span>
                    </>
                  ) : (
                    'No stale flag is currently being served past expiry'
                  )
                ) : (
                  'Stale-serving metrics unavailable — set PROMETHEUS_URL on the admin backend'
                )}
              </p>
              {staleMetrics.available && autoDisabledStaleFlags.length > 0 && (
                <p
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: 'var(--admin-orange)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Icon name="alertTriangle" size={14} color="var(--admin-orange)" />
                  <span>
                    {autoDisabledStaleFlags.length} stale flag(s) auto-disabled by the self-disable
                    safety (flag_auto_disabled_total)
                  </span>
                </p>
              )}
            </>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={confirmPrune}
            disabled={staleFlags.length === 0 || pruneMutation.isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--admin-surface)',
              background: staleFlags.length > 0 ? 'var(--admin-orange)' : 'var(--admin-bg)',
              color: staleFlags.length > 0 ? 'white' : 'var(--admin-text-muted)',
              cursor: staleFlags.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: 13,
            }}
            title={
              staleFlags.length === 0
                ? 'No flags are past their staleAfter date'
                : 'Archive + remove every flag past its staleAfter date'
            }
          >
            {pruneMutation.isPending ? 'Removing…' : `Remove stale flags (${staleFlags.length})`}
          </button>
          {pruneFeedback && (
            <div style={{ marginTop: 8, maxWidth: 380 }}>
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
              {!pruneFeedback.error && pruneFeedback.removedKeys?.length ? (
                <button
                  onClick={undoPrune}
                  disabled={restoreMutation.isPending}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-card)',
                    background: 'var(--admin-green)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {restoreMutation.isPending ? (
                    'Restoring…'
                  ) : (
                    <>
                      <Icon name="undo" size={13} color="white" />
                      Undo — restore from audit archive
                    </>
                  )}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Last nightly pass (audit-recorded): times, counts, webhook status. */}
      {lastRun && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            marginBottom: 16,
            fontSize: 12,
          }}
        >
          <span style={{ color: 'var(--admin-text-muted)', fontWeight: 600 }}>
            Last nightly pass ·{' '}
            <span style={{ color: 'var(--admin-text)' }}>
              {new Date(lastRun.ranAt).toLocaleString()}
            </span>
          </span>
          <span style={{ color: 'var(--admin-text-muted)' }}>
            {lastRun.staleCount} stale global · {lastRun.universeStaleCount} universe
          </span>
          <span style={{ color: 'var(--admin-text-muted)' }}>
            {lastRun.notifiedCount} owner{lastRun.notifiedCount === 1 ? '' : 's'} notified
          </span>
          {lastRun.dryRunUniverse ? (
            <span
              style={{ color: 'var(--admin-orange)' }}
              title="Preview only — nothing was removed in the universe scope"
            >
              would prune {lastRun.wouldPruneUniverse ?? 0} universe (dry-run)
              {lastRun.autoPruned > 0 ? ` · pruned ${lastRun.autoPruned} global` : ''}
            </span>
          ) : (
            <span style={{ color: 'var(--admin-text-muted)' }}>
              pruned {lastRun.autoPruned} global · {lastRun.autoPrunedUniverse} universe
            </span>
          )}
          {lastRun.pruneBlocked === 'no-webhook' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: 'rgba(232,66,10,0.25)',
                color: 'var(--admin-orange)',
              }}
              title="Auto-prune is enabled but no STALE_FLAG_OPS_WEBHOOK_URL is set — the pass blocked removals to prevent silent pruning. Configure the webhook or set STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK=true."
            >
              <Icon name="alertTriangle" size={12} color="var(--admin-orange)" />
              <span>prune blocked · no webhook</span>
            </span>
          )}
          <span
            style={{
              marginLeft: 'auto',
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              background: WEBHOOK_BG[lastRun.webhook],
              color: WEBHOOK_FG[lastRun.webhook],
            }}
            title={`Webhook status of the last pass: ${lastRun.webhook}`}
          >
            {WEBHOOK_LABEL[lastRun.webhook]}
          </span>
        </div>
      )}

      {recentlyDeleted.length > 0 && (
        <div
          style={{
            border: '1px solid var(--admin-surface)',
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
              Recently removed flags ({recentlyDeleted.length}) — restorable from the audit archive
            </span>
            <Icon
              name={showDeleted ? 'chevronDown' : 'chevronRight'}
              size={14}
              color="var(--admin-text-muted)"
            />
          </button>
          {showDeleted && (
            <div style={{ padding: '0 18px 18px' }}>
              {recentlyDeleted.map((f) => (
                <div
                  key={f.key}
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
                    <code style={{ color: 'var(--admin-text-muted)' }}>{f.key}</code>
                    <span style={{ color: 'var(--admin-text-muted)', marginLeft: 8, fontSize: 12 }}>
                      removed {f.deletedAt ? new Date(f.deletedAt).toLocaleString() : ''}
                      {f.deletedBy ? ` by ${f.deletedBy}` : ''}
                      {!f.archived ? ' · no archive' : ''}
                    </span>
                  </div>
                  {f.archived && (
                    <button
                      onClick={() => {
                        if (!window.confirm(`Restore "${f.key}" from the audit archive?`)) return;
                        restoreMutation.mutate([f.key]);
                      }}
                      disabled={restoreMutation.isPending}
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
              ))}
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
            Showing {staleFlags.length} stale flag(s) — removal candidates
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setContextFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid var(--admin-surface)',
            background: contextFilter === 'all' ? 'var(--admin-orange)' : 'transparent',
            color: contextFilter === 'all' ? 'white' : 'var(--admin-text-muted)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          All
        </button>
        {contextsPresent.map((ctx) => (
          <button
            key={ctx.label}
            onClick={() => setContextFilter(contextFilter === ctx.label ? 'all' : ctx.label)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid var(--admin-surface)',
              background: contextFilter === ctx.label ? 'var(--admin-orange)' : 'transparent',
              color: contextFilter === ctx.label ? 'white' : 'var(--admin-text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
            title={ctx.description}
          >
            {ctx.label}
          </button>
        ))}
        <button
          onClick={() => setContextFilter(contextFilter === 'other' ? 'all' : 'other')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid var(--admin-surface)',
            background: contextFilter === 'other' ? 'var(--admin-orange)' : 'transparent',
            color: contextFilter === 'other' ? 'white' : 'var(--admin-text-muted)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Other
        </button>
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

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search flags by key, description or service..."
        style={{ ...inputStyle, marginBottom: 24 }}
      />

      {isLoading && <p style={{ color: 'var(--admin-text-muted)' }}>Loading flags…</p>}

      {filtered.map((flag) => {
        const ctx = contextFor(flag.key);
        const isNumeric = isNumericFlag(flag);
        const isFocused = focusTarget !== null && flag.key === focusTarget;
        // Self-disable flip count for this key (0 when Prometheus is off).
        const autoTotal = staleMetrics?.autoDisabled?.[flag.key]?.total ?? 0;
        const draft = drafts[flag.key];
        const dirty =
          draft !== undefined && draft.trim() !== '' && draft.trim() !== String(flag.value);
        // Targeting draft state for boolean flags (rollout % + user IDs).
        const targetingDraft = targetingDrafts[flag.key] ?? {};
        const targetingDraftRollout =
          targetingDraft.rollout ?? String(flag.rolloutPercentage ?? 100);
        const targetingDraftUserIds = targetingDraft.userIds ?? (flag.userIds ?? []).join(', ');
        const currentRollout = flag.rolloutPercentage ?? 100;
        const targetingDirty =
          Number(targetingDraftRollout) !== currentRollout ||
          parseIds(targetingDraftUserIds).join(',') !== (flag.userIds ?? []).join(',');
        const hasTargeting = currentRollout < 100 || (flag.userIds?.length ?? 0) > 0;
        return (
          <div
            key={flag.key}
            id={`flag-row-${flag.key}`}
            style={{
              padding: '16px 20px',
              borderRadius: 16,
              border: isFocused ? '2px solid var(--admin-orange)' : '1px solid var(--admin-card)',
              backgroundColor: isFocused ? 'rgba(232,66,10,0.12)' : 'var(--admin-surface)',
              boxShadow: isFocused ? '0 0 0 3px rgba(232,66,10,0.25)' : undefined,
              animation: isFocused ? 'flagFlash 1.8s ease-out' : undefined,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              {!isNumeric && (
                <button
                  onClick={() =>
                    saveMutation.mutate({
                      key: flag.key,
                      data: { enabled: !flag.enabled },
                    })
                  }
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 999,
                    border: 'none',
                    background: flag.enabled ? 'var(--admin-green)' : 'var(--admin-surface)',
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                  title={flag.enabled ? 'Click to disable' : 'Click to enable'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: flag.enabled ? 23 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: 'white',
                      transition: 'left 0.15s ease',
                    }}
                  />
                </button>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <code
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--admin-text)',
                    }}
                  >
                    {flag.key}
                  </code>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'rgba(232,66,10,0.15)',
                      color: 'var(--admin-orange)',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {isNumeric ? 'numeric' : flag.enabled ? 'enabled' : 'disabled'}
                  </span>
                  {isStale(flag) && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(232,66,10,0.25)',
                        color: 'var(--admin-orange)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      title={
                        flag.staleNotifiedAt
                          ? 'staleAfter has passed — owner already notified by the sweep'
                          : 'staleAfter has passed — owner NOT yet notified (sweep pending)'
                      }
                    >
                      stale{flag.staleNotifiedAt ? ' · notified' : ' · un-notified'}
                    </span>
                  )}
                  {isStale(flag) && !flag.enabled && !flag.autoDisabledAt && autoTotal === 0 && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(245,240,235,0.08)',
                        color: 'var(--admin-text-muted)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      title="Disabled by an admin — no auto-disable recorded (flag_auto_disabled_total = 0)"
                    >
                      manually off
                    </span>
                  )}
                  {(flag.autoDisabledAt || autoTotal > 0) && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(232,66,10,0.35)',
                        color: 'var(--admin-orange)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      title={`Auto-disabled by the self-disable safety${autoTotal > 0 ? ` ${autoTotal}× (flag_auto_disabled_total)` : ''}${flag.autoDisabledAt ? ` on ${new Date(flag.autoDisabledAt).toLocaleString()}` : ''} — renew the expiry (extend staleAfter) to re-enable`}
                    >
                      auto-off{autoTotal > 0 ? ` · ${autoTotal}×` : ''}
                    </span>
                  )}
                  {isStale(flag) &&
                    staleMetrics?.available &&
                    staleMetrics.staleRunning?.[flag.key] && (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'var(--admin-orange)',
                          color: 'white',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        title={`Still served past expiry — ${staleMetrics.staleRunning[flag.key]!.rate5m.toFixed(1)} eval/min in the last 5m · ${staleMetrics.staleRunning[flag.key]!.total} lifetime evaluations`}
                      >
                        serving past expiry
                      </span>
                    )}
                  {ctx && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(245,240,235,0.08)',
                        color: 'var(--admin-text-muted)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      title={ctx.description}
                    >
                      {ctx.label}
                    </span>
                  )}
                  {flag.owner && (
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                      owner: {flag.owner}
                    </span>
                  )}
                </div>
                {ctx?.description && (
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 4 }}>
                    {ctx.description}
                  </p>
                )}
                {flag.description && flag.description !== 'Default flag' && (
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 2 }}>
                    {flag.description}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  {isNumeric ? (
                    <>
                      <span style={labelStyle}>value</span>
                      <input
                        type="number"
                        value={draft ?? String(flag.value)}
                        onChange={(e) => setDrafts({ ...drafts, [flag.key]: e.target.value })}
                        style={{ ...inputStyle, width: 180 }}
                      />
                      <button
                        onClick={() => commitDraft(flag)}
                        disabled={!dirty}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: dirty ? 'var(--admin-orange)' : 'var(--admin-surface)',
                          color: dirty ? 'white' : 'var(--admin-text-muted)',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: dirty ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => resetMutation.mutate(flag.key)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: '1px solid var(--admin-surface)',
                          background: 'transparent',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                        title="Reset to the service-registered default"
                      >
                        Reset to default
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={labelStyle}>current: {flagValueLabel(flag)}</span>
                      <button
                        onClick={() => resetMutation.mutate(flag.key)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: '1px solid var(--admin-surface)',
                          background: 'transparent',
                          color: 'var(--admin-text-muted)',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                        title="Reset to the service-registered default"
                      >
                        Reset to default
                      </button>
                      {flag.key === MEDIA_CDN_EDGE_CACHE_FLAG && (
                        <button
                          onClick={confirmPurge}
                          disabled={purgeMutation.isPending}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid var(--admin-orange)',
                            background: 'rgba(232,66,10,0.12)',
                            color: purgeMutation.isPending
                              ? 'var(--admin-text-muted)'
                              : 'var(--admin-orange)',
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: purgeMutation.isPending ? 'wait' : 'pointer',
                          }}
                          title="Invalidate all cached uploads at the CDN edge (/uploads/*)"
                        >
                          {purgeMutation.isPending ? 'Purging…' : 'Purge CDN'}
                        </button>
                      )}
                    </>
                  )}
                  {flag.key === MEDIA_CDN_EDGE_CACHE_FLAG && purgeFeedback && (
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: purgeFeedback.error ? 'var(--admin-orange)' : 'var(--admin-green)',
                      }}
                    >
                      {purgeFeedback.message}
                    </p>
                  )}
                </div>

                {/* Rollout % + targeted user IDs — boolean flags only. The
                    evaluator serves userIds first, then a stable hash bucket
                    within the rollout %, so this is the full targeting UI. */}
                {!isNumeric && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--admin-card)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={labelStyle}>rollout</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={targetingDraftRollout}
                        onChange={(e) =>
                          setTargetingDrafts({
                            ...targetingDrafts,
                            [flag.key]: { ...targetingDraft, rollout: e.target.value },
                          })
                        }
                        style={{
                          width: 140,
                          accentColor: 'var(--admin-orange)',
                          cursor: 'pointer',
                        }}
                        aria-label={`${flag.key} rollout percentage`}
                      />
                      <span style={{ color: 'var(--admin-text)', fontSize: 13, minWidth: 44 }}>
                        {targetingDraftRollout}%
                      </span>
                      <span style={labelStyle}>user IDs</span>
                      <input
                        type="text"
                        value={targetingDraftUserIds}
                        onChange={(e) =>
                          setTargetingDrafts({
                            ...targetingDrafts,
                            [flag.key]: { ...targetingDraft, userIds: e.target.value },
                          })
                        }
                        placeholder="u_123, u_456"
                        style={{ ...inputStyle, width: 240, padding: '6px 10px', fontSize: 12 }}
                        aria-label={`${flag.key} targeted user IDs`}
                      />
                      <button
                        onClick={() => commitTargeting(flag)}
                        disabled={!targetingDirty}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: targetingDirty
                            ? 'var(--admin-orange)'
                            : 'var(--admin-surface)',
                          color: targetingDirty ? 'white' : 'var(--admin-text-muted)',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: targetingDirty ? 'pointer' : 'not-allowed',
                        }}
                        title="Apply rollout percentage and targeted user IDs"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => clearTargeting(flag)}
                        disabled={!hasTargeting}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: '1px solid var(--admin-surface)',
                          background: 'transparent',
                          color: hasTargeting
                            ? 'var(--admin-text-muted)'
                            : 'var(--admin-text-muted)',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: hasTargeting ? 'pointer' : 'not-allowed',
                        }}
                        title="Serve to everyone (100% rollout, no targeted users)"
                      >
                        Clear
                      </button>
                    </div>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: 11, marginTop: 6 }}>
                      {currentRollout < 100
                        ? `Currently served to ${currentRollout}% of users`
                        : 'Currently served to everyone'}
                      {(flag.userIds?.length ?? 0) > 0 &&
                        ` · ${flag.userIds!.length} targeted user${flag.userIds!.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                )}

                {/* Stale-after (expiry) — all flags. Drives the stale report:
                    once staleAfter passes, the flag is a removal candidate. */}
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid var(--admin-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={labelStyle}>stale after</span>
                  <input
                    type="date"
                    value={
                      staleDrafts[flag.key] ?? (flag.staleAfter ? flag.staleAfter.slice(0, 10) : '')
                    }
                    onChange={(e) => setStaleDrafts({ ...staleDrafts, [flag.key]: e.target.value })}
                    style={{ ...inputStyle, width: 160, padding: '6px 10px', fontSize: 12 }}
                    aria-label={`${flag.key} stale-after date`}
                  />
                  <button
                    onClick={() => commitStaleAfter(flag)}
                    disabled={!staleDrafts[flag.key]}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: staleDrafts[flag.key]
                        ? 'var(--admin-orange)'
                        : 'var(--admin-surface)',
                      color: staleDrafts[flag.key] ? 'white' : 'var(--admin-text-muted)',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: staleDrafts[flag.key] ? 'pointer' : 'not-allowed',
                    }}
                    title="Set the date after which this flag is a removal candidate"
                  >
                    Set expiry
                  </button>
                  <button
                    onClick={() =>
                      saveMutation.mutate({ key: flag.key, data: { staleAfter: undefined } })
                    }
                    disabled={!flag.staleAfter}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      background: 'transparent',
                      color: flag.staleAfter
                        ? 'var(--admin-text-muted)'
                        : 'var(--admin-text-muted)',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: flag.staleAfter ? 'pointer' : 'not-allowed',
                    }}
                    title="Remove the expiry (flag never goes stale)"
                  >
                    Clear expiry
                  </button>
                  {flag.staleAfter && (
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: 11 }}>
                      {isStale(flag)
                        ? 'STALE — removal candidate'
                        : `expires ${flag.staleAfter.slice(0, 10)}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {!isLoading && filtered.length === 0 && (
        <p style={{ color: 'var(--admin-text-muted)' }}>No flags match the current filter.</p>
      )}

      <KnownFlagsReference />
    </div>
  );
}

/**
 * Typed "known flags" reference rendered from the registries (served by
 * GET /admin/feature-flags/known). Lets ops discover every flag a service
 * understands without reading source.
 */
function KnownFlagsReference() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'known-flags'],
    queryFn: async () => {
      const res = await adminApi.listKnownFlags();
      return requireData(res);
    },
  });

  return (
    <div
      style={{
        marginTop: 32,
        border: '1px solid #3A3A3A',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        <span>
          Known flags reference{' '}
          <span style={{ color: 'var(--admin-text-muted)', fontWeight: 400 }}>
            ({isLoading ? '…' : `${data?.total ?? 0} across ${data?.domains.length ?? 0} domains`})
          </span>
        </span>
        <Icon
          name={open ? 'chevronDown' : 'chevronRight'}
          size={14}
          color="var(--admin-text-muted)"
        />
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px' }}>
          {isLoading ? (
            <p style={{ color: 'var(--admin-text-muted)' }}>Loading…</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {(data?.domains ?? []).map((domain) => (
                <div
                  key={domain.domain}
                  style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}
                >
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, textTransform: 'capitalize' }}>
                    {domain.domain}
                    <span style={{ color: 'var(--admin-text-muted)', fontWeight: 400 }}>
                      {' '}
                      · {domain.flags.length}
                    </span>
                  </h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12 }}>
                    {domain.flags.map((f) => (
                      <li
                        key={f.key}
                        style={{ padding: '3px 0', borderBottom: '1px solid #2A2A2A' }}
                      >
                        <code style={{ color: 'var(--admin-text-muted)' }}>{f.key}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
