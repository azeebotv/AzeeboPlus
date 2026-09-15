import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { RealityShow } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(154,138,122,0.2)', color: 'var(--admin-text-muted)' },
  published: { bg: 'rgba(13,59,46,0.3)', color: 'var(--admin-emerald)' },
  archived: { bg: 'rgba(120,120,120,0.2)', color: 'var(--admin-grey)' },
  suspended: { bg: 'rgba(204,28,28,0.15)', color: 'var(--admin-red)' },
};

export default function RealityPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<RealityShow | null>(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: shows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'reality-shows'],
    queryFn: async () => {
      const res = await adminApi.getRealityShows();
      if (!res.success) throw new Error(res.message || 'Failed to load shows');
      const d = res.data as RealityShow[] | { items: RealityShow[] };
      return Array.isArray(d) ? d : d.items || [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'reality-shows'] });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateRealityShowStatus(id, status),
    onSuccess: invalidate,
    onError: (e) => setFormError((e as Error).message || 'Status update failed'),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) => adminApi.createRealityShow(data),
    onSuccess: () => {
      setShowCreate(false);
      setForm({ title: '', description: '' });
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError((e as Error).message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string }) =>
      adminApi.updateRealityShow(id, data),
    onSuccess: () => {
      setEditTarget(null);
      setForm({ title: '', description: '' });
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError((e as Error).message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRealityShow(id),
    onSuccess: invalidate,
    onError: (e) => setFormError((e as Error).message || 'Delete failed'),
  });

  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const submitForm = () => {
    setFormError(null);
    if (!form.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (editTarget) {
      updateMutation.mutate({
        id: editTarget.id,
        title: form.title.trim(),
        description: form.description || undefined,
      });
    } else {
      createMutation.mutate({
        title: form.title.trim(),
        description: form.description || undefined,
      });
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Icon name="tv" size={28} color="var(--admin-orange)" />
            <span>Reality Shows</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>{shows.length} shows</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setEditTarget(null);
            setFormError(null);
            setForm({ title: '', description: '' });
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Icon name={showCreate ? 'x' : 'plus'} size={16} />
          <span>{showCreate ? 'Cancel' : 'New Show'}</span>
        </button>
      </div>

      {formError && (
        <p style={{ color: 'var(--admin-red)', fontSize: 13, marginBottom: 14 }}>{formError}</p>
      )}

      {showCreate && (
        <div
          style={{
            border: '1px solid var(--admin-card)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            background: 'var(--admin-surface)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>New reality show</h2>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Show title (required)"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--admin-surface)',
              backgroundColor: 'var(--admin-dark)',
              color: 'var(--admin-text)',
              fontSize: 14,
              marginBottom: 10,
            }}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--admin-surface)',
              backgroundColor: 'var(--admin-dark)',
              color: 'var(--admin-text)',
              fontSize: 14,
              marginBottom: 12,
              resize: 'vertical',
            }}
          />
          <button
            onClick={submitForm}
            disabled={busy}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--admin-orange)',
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {createMutation.isPending ? 'Creating…' : 'Create show (starts as draft)'}
          </button>
        </div>
      )}

      {isError ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            background: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
          }}
        >
          <strong>Failed to load shows.</strong> {(error as Error)?.message}
        </div>
      ) : isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shows.map((show) => {
            const st =
              STATUS_STYLE[show.status] ??
              ({ bg: 'rgba(154,138,122,0.2)', color: 'var(--admin-text-muted)' } as const);
            return (
              <div
                key={show.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderRadius: 16,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{show.title}</h3>
                  {show.description && (
                    <p
                      style={{
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 420,
                      }}
                    >
                      {show.description}
                    </p>
                  )}
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                    {show.creator?.displayName || 'Unassigned'} · {show.viewCount || 0} views
                  </p>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: st.bg,
                    color: st.color,
                    textTransform: 'capitalize',
                  }}
                >
                  {show.status}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {show.status !== 'published' && (
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: show.id, status: 'published' })
                      }
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--admin-emerald)',
                        background: 'transparent',
                        color: 'var(--admin-emerald)',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Publish
                    </button>
                  )}
                  {show.status !== 'suspended' && (
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({ id: show.id, status: 'suspended' })
                      }
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--admin-amber)',
                        background: 'transparent',
                        color: 'var(--admin-amber)',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Suspend
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditTarget(show);
                      setShowCreate(false);
                      setForm({ title: show.title, description: show.description || '' });
                      setFormError(null);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--admin-surface)',
                      background: 'transparent',
                      color: 'var(--admin-text-muted)',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${show.title}"? This cannot be undone.`)) {
                        deleteMutation.mutate(show.id);
                      }
                    }}
                    disabled={busy}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--admin-red)',
                      background: 'transparent',
                      color: 'var(--admin-red)',
                      fontSize: 11,
                      cursor: busy ? 'wait' : 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {shows.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No reality shows found
            </p>
          )}
        </div>
      )}

      {editTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 16,
          }}
          onClick={() => setEditTarget(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-bg)',
              borderRadius: 16,
              border: '1px solid var(--admin-surface)',
              padding: 24,
              maxWidth: 440,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Edit show</h2>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Show title"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
                marginBottom: 10,
              }}
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
                marginBottom: 12,
                resize: 'vertical',
              }}
            />
            {formError && (
              <p style={{ color: 'var(--admin-red)', fontSize: 12, marginBottom: 10 }}>
                {formError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={submitForm}
                disabled={busy || !form.title.trim()}
                style={{
                  flex: 1,
                  padding: '11px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--admin-orange)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: busy ? 'wait' : 'pointer',
                }}
              >
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => setEditTarget(null)}
                style={{
                  padding: '11px 18px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
