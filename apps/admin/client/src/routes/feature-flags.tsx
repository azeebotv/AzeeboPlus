import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  universe: string;
  universeDisplayName: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ key: '', description: '', rolloutPercentage: 100 });

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async () => {
      const res = await adminApi.listFeatureFlags();
      return res.success ? (res.data as FeatureFlag[]) : [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (key: string) => adminApi.toggleFeatureFlag(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createFeatureFlag({
        key: form.key,
        description: form.description,
        rolloutPercentage: form.rolloutPercentage,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      setShowCreate(false);
      setForm({ key: '', description: '', rolloutPercentage: 100 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => adminApi.deleteFeatureFlagByKey(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] }),
  });

  const filtered = flags.filter(
    (f) =>
      !search ||
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      f.universe.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = flags.filter((f) => f.enabled).length;

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
        placeholder="Search flags..."
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: 12,
          border: '1px solid #2A1A1A',
          backgroundColor: '#0D0505',
          color: '#F5F0EB',
          fontSize: 14,
          marginBottom: 24,
          boxSizing: 'border-box',
        }}
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
            <input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="Flag key (e.g., new_checkout_flow)"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
              }}
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ color: '#9A8A7A', fontSize: 13 }}>Rollout %:</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.rolloutPercentage}
                onChange={(e) => setForm({ ...form, rolloutPercentage: Number(e.target.value) })}
                style={{
                  width: 80,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.key}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: !form.key ? 0.5 : 1,
                }}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
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
          {filtered.map((flag) => (
            <div
              key={flag.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{flag.key}</p>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 500,
                      backgroundColor: flag.enabled ? '#0D3B2E' : '#3B0D0D',
                      color: flag.enabled ? '#4ADE80' : '#F87171',
                    }}
                  >
                    {flag.enabled ? 'ON' : 'OFF'}
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
                    {flag.universeDisplayName || flag.universe}
                  </span>
                </div>
                {flag.metadata?.description && (
                  <p style={{ color: '#9A8A7A', fontSize: 12, marginTop: 4 }}>
                    {String(flag.metadata.description)}
                  </p>
                )}
                {flag.metadata?.rolloutPercentage !== undefined &&
                  flag.metadata.rolloutPercentage !== 100 && (
                    <p style={{ color: '#E8420A', fontSize: 11, marginTop: 2 }}>
                      Rollout: {String(flag.metadata.rolloutPercentage)}%
                    </p>
                  )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => toggleMutation.mutate(flag.key)}
                  disabled={toggleMutation.isPending}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: flag.enabled ? '1px solid #3B0D0D' : '1px solid #0D3B2E',
                    background: flag.enabled ? 'rgba(59,13,13,0.5)' : 'rgba(13,59,46,0.5)',
                    color: flag.enabled ? '#F87171' : '#4ADE80',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {flag.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete flag "${flag.key}"?`)) {
                      deleteMutation.mutate(flag.key);
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
          ))}
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
