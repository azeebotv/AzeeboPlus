import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { AdminUniverse } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';

export default function UniversesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', displayName: '', description: '' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'universes', page, search],
    queryFn: async () => {
      const res = await adminApi.getAllUniverses(page, PAGE_SIZE, search || undefined);
      if (res.success && res.data) {
        // The endpoint returns a paginated envelope {data: [...], meta}, not a
        // bare array — cast carefully and never trust the shape (a mismatched
        // payload used to crash this tree with "universes.filter is not a
        // function").
        const d = res.data as unknown as
          | AdminUniverse[]
          | { data?: AdminUniverse[]; meta?: { total?: number; totalPages?: number } };
        const rows = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
        return {
          rows,
          total: (!Array.isArray(d) && d?.meta?.total) || rows.length,
          totalPages: (!Array.isArray(d) && d?.meta?.totalPages) || 1,
        };
      }
      return { rows: [], total: 0, totalPages: 1 };
    },
  });

  const universes = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

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

  // Search is server-side (QueryUniverseDto.search) and debounced via the
  // keyed useQuery — no client-side filter to mismatch on payload shape.

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
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Icon name="globe" size={26} color="var(--admin-orange)" />
            Universes
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>{total} universes</p>
        </div>
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
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
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
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : error ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            backgroundColor: 'rgba(204,28,28,0.08)',
            color: 'var(--admin-red)',
            textAlign: 'center',
          }}
        >
          Failed to load universes — {error instanceof Error ? error.message : 'unknown error'}
        </div>
      ) : universes.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          {search ? `No universes match “${search}”` : 'No universes yet.'}
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {universes.map((u) => (
              <div
                key={u.id}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
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
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 12 }}>
                    {u.description}
                  </p>
                )}
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    {u.contentCount || 0} items
                  </span>
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
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: page <= 1 ? 'var(--admin-text-muted)' : 'var(--admin-text)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                }}
              >
                Prev
              </button>
              <span style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                Page {page} of {totalPages} · {total} total
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: page >= totalPages ? 'var(--admin-text-muted)' : 'var(--admin-text)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
