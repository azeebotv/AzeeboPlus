import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';

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
  border: '1px solid #2A1A1A',
  backgroundColor: '#0D0505',
  color: '#F5F0EB',
  fontSize: 14,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = { color: '#9A8A7A', fontSize: 13 };

export default function FeatureFlagsPage() {
  const queryClient = useQueryClient();
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
      const res = await adminApi.listFeatureFlags();
      const rows = res.success ? ((res.data as unknown[]) ?? []) : [];
      return rows as UniverseFeatureFlagRow[];
    },
  });

  const { data: universes = [] } = useQuery({
    queryKey: ['admin', 'universes'],
    queryFn: async () => {
      const res = await adminApi.getAllUniverses();
      const rows = res.success ? ((res.data as unknown[]) ?? []) : [];
      return rows as AdminUniverseOption[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: (args: { universeId: string; flag: Record<string, unknown> }) =>
      adminApi.createFeatureFlag(args.universeId, args.flag as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      setShowCreate(false);
      setForm({ universeId: '', key: '', description: '', rolloutPercentage: '100', userIds: '', staleAfter: '' });
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
    if (!Number.isNaN(rollout) && rollout >= 0 && rollout <= 100) metadata.rolloutPercentage = rollout;
    const userIds = form.userIds
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
    if (userIds.length > 0) metadata.userIds = userIds;
    if (form.staleAfter.trim()) metadata.staleAfter = form.staleAfter.trim();
    return { featureKey: key, isEnabled: true, metadata };
  };

  const filtered = flags.filter(
    (f) =>
      !search ||
      f.featureKey.toLowerCase().includes(search.toLowerCase()) ||
      f.universe?.name.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = flags.filter((f) => f.isEnabled).length;
  const staleFlags = flags.filter((f) => {
    const staleAfter = f.metadata?.staleAfter;
    return typeof staleAfter === 'string' && !Number.isNaN(Date.parse(staleAfter)) && new Date(staleAfter) < new Date();
  });

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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Feature Flags</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>
            {flags.length} flags ({enabledCount} enabled)
            {staleFlags.length > 0 && (
              <span style={{ color: '#E8420A', marginLeft: 8 }}>· {staleFlags.length} stale</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Create Flag
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search flags by key or universe..."
        style={{ ...inputStyle, marginBottom: 24 }}
      />

      {showCreate && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid #2A1A1A',
            backgroundColor: 'rgba(26,10,10,0.8)',
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
                  color: '#fff',
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
                  border: '1px solid #2A1A1A',
                  background: 'transparent',
                  color: '#9A8A7A',
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
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
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
            return (
              <div
                key={`${flag.universeId}:${flag.featureKey}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `1px solid ${isStale ? '#7A2A0A' : '#2A1A1A'}`,
                  backgroundColor: 'rgba(26,10,10,0.5)',
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
                        backgroundColor: flag.isEnabled ? '#0D3B2E' : '#3B0D0D',
                        color: flag.isEnabled ? '#4ADE80' : '#F87171',
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
                        color: '#9A8A7A',
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
                          color: '#FF9E6B',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        title={`staleAfter (${new Date(staleAfter as string).toLocaleDateString()}) has passed — removal candidate. Universe flags aren't covered by the global stale sweep; clear or extend the expiry below.`}
                      >
                        stale · past expiry
                      </span>
                    )}
                  </div>
                  {flag.metadata?.description != null && (
                    <p style={{ color: '#9A8A7A', fontSize: 12, marginTop: 4 }}>
                      {String(flag.metadata.description)}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {rollout !== undefined && rollout < 100 && (
                      <span style={{ color: '#E8420A', fontSize: 11 }}>Rollout: {rollout}%</span>
                    )}
                    {userIds.length > 0 && (
                      <span style={{ color: '#9A8A7A', fontSize: 11 }}>
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
                    <span style={{ color: '#9A8A7A', fontSize: 11 }}>stale after</span>
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
                          ? '#E8420A'
                          : '#3A2A2A',
                        color: staleDrafts[`${flag.universeId}:${flag.featureKey}`]
                          ? '#fff'
                          : '#9A8A7A',
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
                        border: '1px solid #2A1A1A',
                        background: 'transparent',
                        color: staleAfter ? '#9A8A7A' : '#5A4A4A',
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: staleAfter ? 'pointer' : 'not-allowed',
                      }}
                      title="Remove the expiry (flag never goes stale)"
                    >
                      Clear expiry
                    </button>
                    {staleAfter && (
                      <span style={{ color: '#9A8A7A', fontSize: 11 }}>
                        expires {new Date(staleAfter).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() =>
                      toggleMutation.mutate({ universeId: flag.universeId, flag })
                    }
                    disabled={toggleMutation.isPending}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: flag.isEnabled ? '1px solid #3B0D0D' : '1px solid #0D3B2E',
                      background: flag.isEnabled ? 'rgba(59,13,13,0.5)' : 'rgba(13,59,46,0.5)',
                      color: flag.isEnabled ? '#F87171' : '#4ADE80',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {flag.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete flag "${flag.featureKey}" from ${flag.universe?.name}?`)) {
                        deleteMutation.mutate({
                          universeId: flag.universeId,
                          featureKey: flag.featureKey,
                        });
                      }
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid #2A1A1A',
                      background: 'transparent',
                      color: '#9A8A7A',
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
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>
              {search ? 'No flags match your search' : 'No feature flags yet'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
