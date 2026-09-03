import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AdminUniverse } from '@/lib/admin-types';

export default function UniversesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', displayName: '', description: '' });

  const { data: universes = [], isLoading } = useQuery({
    queryKey: ['admin', 'universes'],
    queryFn: async () => {
      const res = await adminApi.getAllUniverses();
      return res.success ? (res.data as AdminUniverse[]) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUniverse(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] });
      setShowCreate(false);
      setForm({ name: '', displayName: '', description: '' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      adminApi.toggleUniverse(id, isEnabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUniverse(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'universes'] }),
  });

  const filtered = universes.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Universes</h1>
          <p style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>{universes.length} universes</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
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
          Create Universe
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search universes..."
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: 12,
          border: '1px solid var(--admin-surface)',
          backgroundColor: 'var(--admin-dark)',
          color: 'var(--admin-text)',
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
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'rgba(26,10,10,0.8)',
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Create Universe</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name (slug)"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
              }}
            />
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="Display Name"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
              }}
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
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
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((u) => (
            <div
              key={u.id}
              style={{
                padding: 20,
                borderRadius: 16,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: 16 }}>{u.displayName || u.name}</h3>
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>{u.name}</p>
                </div>
                <button
                  onClick={() => toggleMutation.mutate({ id: u.id, isEnabled: !u.isEnabled })}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: 'none',
                    backgroundColor: u.isEnabled ? 'rgba(13,59,46,0.2)' : 'rgba(154,138,122,0.2)',
                    color: u.isEnabled ? 'var(--admin-green)' : 'var(--admin-text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {u.isEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              {u.description && (
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 12 }}>{u.description}</p>
              )}
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{u.contentCount || 0} items</span>
                <button
                  onClick={() => {
                    if (confirm('Delete this universe?')) deleteMutation.mutate(u.id);
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 8,
                    border: '1px solid #CC1C1C',
                    background: 'transparent',
                    color: 'var(--admin-red)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
