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
      </div>

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
              </div>
            </div>
          </div>
        );
      })}

      {!isLoading && filtered.length === 0 && (
        <p style={{ color: '#9A8A7A' }}>No flags match the current filter.</p>
      )}
    </div>
  );
}
