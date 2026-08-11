import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { GlobalFeatureFlag } from '@/lib/admin-types';

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
};

/** Flag whose off-flip stops CDN edge caching — carries the purge action. */
const MEDIA_CDN_EDGE_CACHE_FLAG = 'media_cdn_edge_cache';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #2A1A1A',
  backgroundColor: '#0D0505',
  color: '#F5F0EB',
  fontSize: 14,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = { color: '#9A8A7A', fontSize: 13 };

/** Derive the owning service context from a flag key's first segment. */
function contextFor(key: string): ServiceContext | undefined {
  const prefix = key.split('.')[0]?.split('_')[0] ?? '';
  return SERVICE_CONTEXTS[prefix];
}

/** True when the flag carries a non-boolean (numeric / variant) payload. */
function isNumericFlag(flag: GlobalFeatureFlag): boolean {
  return typeof flag.value === 'number';
}

function flagValueLabel(flag: GlobalFeatureFlag): string {
  if (typeof flag.value === 'number') return String(flag.value);
  return flag.enabled ? 'on' : 'off';
}

export default function GlobalFeatureFlagsPage() {
  const queryClient = useQueryClient();
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
      return res.success ? (res.data ?? []) : [];
    },
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
      (ctx?.label === contextFilter) ||
      (contextFilter === 'other' && !ctx);
    if (!matchesContext) return false;
    if (!search) return true;
    const haystack = [flag.key, flag.description ?? '', ctx?.label ?? '']
      .join(' ')
      .toLowerCase();
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
              '.' + (d?.removedKeys?.length ? ` Removed: ${d.removedKeys.join(', ')}` : ''),
        removedKeys: d?.removedKeys,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'global-feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'recently-deleted-flags'] });
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
  const { data: recentlyDeleted = [] } = useQuery<Array<{
    key: string;
    deletedAt: string;
    deletedBy?: string | null;
    archived: boolean;
    enabled?: boolean;
  }>>({
    queryKey: ['admin', 'recently-deleted-flags'],
    queryFn: async () => {
      const res = await adminApi.listRecentlyDeletedFlags();
      return res.data ?? [];
    },
  });
  const [showDeleted, setShowDeleted] = useState(false);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Global Feature Flags</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>
            {flags.length} flags ({numericCount} numeric) · stored in Redis, merged with service
            defaults
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={confirmPrune}
            disabled={staleFlags.length === 0 || pruneMutation.isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #2A1A1A',
              background: staleFlags.length > 0 ? '#E8420A' : '#1A1A1A',
              color: staleFlags.length > 0 ? '#fff' : '#6B5B4B',
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
            {pruneMutation.isPending
              ? 'Removing…'
              : `Remove stale flags (${staleFlags.length})`}
          </button>
          {pruneFeedback && (
            <div style={{ marginTop: 8, maxWidth: 380 }}>
              <p
                style={{
                  fontSize: 12,
                  color: pruneFeedback.error ? '#E8420A' : '#1F8A4C',
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
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: '1px solid #2A1A1A',
                    background: '#1F8A4C',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {restoreMutation.isPending ? 'Restoring…' : '↩ Undo — restore from audit archive'}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {recentlyDeleted.length > 0 && (
        <div
          style={{
            border: '1px solid #2A1A1A',
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
              color: '#D8C9B8',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <span>
              Recently removed flags ({recentlyDeleted.length}) — restorable from the audit
              archive
            </span>
            <span>{showDeleted ? '▾' : '▸'}</span>
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
                    borderBottom: '1px solid #2A2A2A',
                    fontSize: 13,
                  }}
                >
                  <div>
                    <code style={{ color: '#D8C9B8' }}>{f.key}</code>
                    <span style={{ color: '#9A8A7A', marginLeft: 8, fontSize: 12 }}>
                      removed{' '}
                      {f.deletedAt ? new Date(f.deletedAt).toLocaleString() : ''}
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
                        border: '1px solid #2A1A1A',
                        background: '#1F8A4C',
                        color: '#fff',
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

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setContextFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid #2A1A1A',
            background: contextFilter === 'all' ? '#E8420A' : 'transparent',
            color: contextFilter === 'all' ? '#fff' : '#9A8A7A',
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
              border: '1px solid #2A1A1A',
              background: contextFilter === ctx.label ? '#E8420A' : 'transparent',
              color: contextFilter === ctx.label ? '#fff' : '#9A8A7A',
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
            border: '1px solid #2A1A1A',
            background: contextFilter === 'other' ? '#E8420A' : 'transparent',
            color: contextFilter === 'other' ? '#fff' : '#9A8A7A',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Other
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search flags by key, description or service..."
        style={{ ...inputStyle, marginBottom: 24 }}
      />

      {isLoading && <p style={{ color: '#9A8A7A' }}>Loading flags…</p>}

      {filtered.map((flag) => {
        const ctx = contextFor(flag.key);
        const isNumeric = isNumericFlag(flag);
        const draft = drafts[flag.key];
        const dirty = draft !== undefined && draft.trim() !== '' && draft.trim() !== String(flag.value);
        // Targeting draft state for boolean flags (rollout % + user IDs).
        const targetingDraft = targetingDrafts[flag.key] ?? {};
        const targetingDraftRollout = targetingDraft.rollout ?? String(flag.rolloutPercentage ?? 100);
        const targetingDraftUserIds = targetingDraft.userIds ?? (flag.userIds ?? []).join(', ');
        const currentRollout = flag.rolloutPercentage ?? 100;
        const targetingDirty =
          Number(targetingDraftRollout) !== currentRollout ||
          parseIds(targetingDraftUserIds).join(',') !== (flag.userIds ?? []).join(',');
        const hasTargeting = currentRollout < 100 || (flag.userIds?.length ?? 0) > 0;
        return (
          <div
            key={flag.key}
            style={{
              padding: '16px 20px',
              borderRadius: 16,
              border: '1px solid #2A1A1A',
              backgroundColor: 'rgba(26,10,10,0.8)',
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
                    background: flag.enabled ? '#1F8A4C' : '#3A2A2A',
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
                      background: '#fff',
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
                      color: '#F5F0EB',
                    }}
                  >
                    {flag.key}
                  </code>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'rgba(232,66,10,0.15)',
                      color: '#E8420A',
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
                        color: '#FF9E6B',
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
                  {ctx && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: 'rgba(245,240,235,0.08)',
                        color: '#9A8A7A',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      title={ctx.description}
                    >
                      {ctx.label}
                    </span>
                  )}
                  {flag.owner && (
                    <span style={{ color: '#9A8A7A', fontSize: 12 }}>owner: {flag.owner}</span>
                  )}
                </div>
                {ctx?.description && (
                  <p style={{ color: '#9A8A7A', fontSize: 13, marginTop: 4 }}>{ctx.description}</p>
                )}
                {flag.description && flag.description !== 'Default flag' && (
                  <p style={{ color: '#C9B8A8', fontSize: 13, marginTop: 2 }}>{flag.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  {isNumeric ? (
                    <>
                      <span style={labelStyle}>value</span>
                      <input
                        type="number"
                        value={draft ?? String(flag.value)}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [flag.key]: e.target.value })
                        }
                        style={{ ...inputStyle, width: 180 }}
                      />
                      <button
                        onClick={() => commitDraft(flag)}
                        disabled={!dirty}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: dirty ? '#E8420A' : '#3A2A2A',
                          color: dirty ? '#fff' : '#9A8A7A',
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
                          border: '1px solid #2A1A1A',
                          background: 'transparent',
                          color: '#9A8A7A',
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
                          border: '1px solid #2A1A1A',
                          background: 'transparent',
                          color: '#9A8A7A',
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
                            border: '1px solid #E8420A',
                            background: 'rgba(232,66,10,0.12)',
                            color: purgeMutation.isPending ? '#9A8A7A' : '#E8420A',
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
                        color: purgeFeedback.error ? '#E8420A' : '#1F8A4C',
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
                      borderTop: '1px solid #1E1010',
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
                        style={{ width: 140, accentColor: '#E8420A', cursor: 'pointer' }}
                        aria-label={`${flag.key} rollout percentage`}
                      />
                      <span style={{ color: '#F5F0EB', fontSize: 13, minWidth: 44 }}>
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
                          background: targetingDirty ? '#E8420A' : '#3A2A2A',
                          color: targetingDirty ? '#fff' : '#9A8A7A',
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
                          border: '1px solid #2A1A1A',
                          background: 'transparent',
                          color: hasTargeting ? '#9A8A7A' : '#5A4A4A',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: hasTargeting ? 'pointer' : 'not-allowed',
                        }}
                        title="Serve to everyone (100% rollout, no targeted users)"
                      >
                        Clear
                      </button>
                    </div>
                    <p style={{ color: '#9A8A7A', fontSize: 11, marginTop: 6 }}>
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
                    borderTop: '1px solid #1E1010',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={labelStyle}>stale after</span>
                  <input
                    type="date"
                    value={staleDrafts[flag.key] ?? (flag.staleAfter ? flag.staleAfter.slice(0, 10) : '')}
                    onChange={(e) =>
                      setStaleDrafts({ ...staleDrafts, [flag.key]: e.target.value })
                    }
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
                      background: staleDrafts[flag.key] ? '#E8420A' : '#3A2A2A',
                      color: staleDrafts[flag.key] ? '#fff' : '#9A8A7A',
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
                      border: '1px solid #2A1A1A',
                      background: 'transparent',
                      color: flag.staleAfter ? '#9A8A7A' : '#5A4A4A',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: flag.staleAfter ? 'pointer' : 'not-allowed',
                    }}
                    title="Remove the expiry (flag never goes stale)"
                  >
                    Clear expiry
                  </button>
                  {flag.staleAfter && (
                    <span style={{ color: '#9A8A7A', fontSize: 11 }}>
                      {isStale(flag) ? 'STALE — removal candidate' : `expires ${flag.staleAfter.slice(0, 10)}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {!isLoading && filtered.length === 0 && (
        <p style={{ color: '#9A8A7A' }}>No flags match the current filter.</p>
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
      return res.success ? res.data : undefined;
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
          <span style={{ color: '#9A8A7A', fontWeight: 400 }}>
            ({isLoading ? '…' : `${data?.total ?? 0} across ${data?.domains.length ?? 0} domains`})
          </span>
        </span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px' }}>
          {isLoading ? (
            <p style={{ color: '#9A8A7A' }}>Loading…</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {(data?.domains ?? []).map((domain) => (
                <div key={domain.domain} style={{ border: '1px solid #333', borderRadius: 8, padding: 12 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, textTransform: 'capitalize' }}>
                    {domain.domain}
                    <span style={{ color: '#9A8A7A', fontWeight: 400 }}> · {domain.flags.length}</span>
                  </h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 12 }}>
                    {domain.flags.map((f) => (
                      <li key={f.key} style={{ padding: '3px 0', borderBottom: '1px solid #2A2A2A' }}>
                        <code style={{ color: '#D8C9B8' }}>{f.key}</code>
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
