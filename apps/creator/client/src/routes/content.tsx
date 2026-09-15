import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import {
  formatDate,
  inputStyle,
  labelStyle,
  primaryButtonStyle,
  statusBadgeStyle,
} from '@/lib/ui';
import type { ContentItem } from '@/lib/creator-types';

const PAGE_SIZE = 20;

export default function ContentPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'video' });
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['creator', 'content', page, statusFilter],
    queryFn: async () => {
      const res = await creatorApi.getContent(page, PAGE_SIZE, statusFilter || undefined);
      return creatorApi.assertSuccess(res);
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['creator', 'content'] });
    queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: async (d: typeof form) => creatorApi.assertSuccess(await creatorApi.createContent(d)),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setForm({ title: '', description: '', type: 'video' });
      setActionError(null);
    },
    onError: (err: unknown) => setActionError(creatorApi.errorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: d }: { id: string; data: Partial<ContentItem> }) =>
      creatorApi.assertSuccess(await creatorApi.updateContent(id, d)),
    onSuccess: () => {
      invalidate();
      setEditItem(null);
      setActionError(null);
    },
    onError: (err: unknown) => setActionError(creatorApi.errorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => creatorApi.assertSuccess(await creatorApi.deleteContent(id)),
    onSuccess: () => {
      invalidate();
      setActionError(null);
    },
    onError: (err: unknown) => setActionError(creatorApi.errorMessage(err)),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => creatorApi.assertSuccess(await creatorApi.publishContent(id)),
    onSuccess: () => {
      invalidate();
      setActionError(null);
    },
    onError: (err: unknown) => setActionError(creatorApi.errorMessage(err)),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Content</h1>
          <p style={{ color: 'var(--creator-text-muted)', fontSize: 14 }}>{total} items</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={primaryButtonStyle}>
          + New Content
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['', 'draft', 'published', 'scheduled', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: statusFilter === s ? 'none' : '1px solid var(--creator-border)',
              background:
                statusFilter === s
                  ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                  : 'transparent',
              color: statusFilter === s ? 'white' : 'var(--creator-text-muted)',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {s || 'all'}
          </button>
        ))}
      </div>

      {actionError && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid var(--creator-red)',
            backgroundColor: 'rgba(204,28,28,0.1)',
            color: 'var(--creator-red)',
            fontSize: 13,
            marginBottom: 16,
          }}
          role="alert"
        >
          {actionError}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--creator-red)', marginBottom: 12 }}>
            {creatorApi.errorMessage(error)}
          </p>
          <button onClick={() => refetch()} style={primaryButtonStyle}>
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 40 }}>
          No content found. Click “+ New Content” to create your first item.
        </p>
      ) : (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--creator-border)',
            backgroundColor: 'rgba(26,10,10,0.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--creator-border)' }}>
                  {['Title', 'Type', 'Status', 'Views', 'Created', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: 'var(--creator-text-muted)',
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
                {items.map((item: ContentItem) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--creator-border-light)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.title}</td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'var(--creator-text-muted)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {item.type}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={statusBadgeStyle(item.status)}>{item.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--creator-text-muted)' }}>
                      {(item.viewCount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--creator-text-muted)', fontSize: 13 }}>
                      {formatDate(item.createdAt)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {item.status !== 'published' && item.status !== 'archived' && (
                          <button
                            onClick={() => publishMutation.mutate(item.id)}
                            disabled={publishMutation.isPending}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid var(--creator-green)',
                              background: 'transparent',
                              color: 'var(--creator-green)',
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setForm({
                              title: item.title,
                              description: item.description || '',
                              type: item.type,
                            });
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--creator-border)',
                            background: 'transparent',
                            color: 'var(--creator-text-muted)',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this content?')) deleteMutation.mutate(item.id);
                          }}
                          disabled={deleteMutation.isPending}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--creator-red)',
                            background: 'transparent',
                            color: 'var(--creator-red)',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--creator-border)',
                background: 'transparent',
                color: page === 1 ? 'var(--creator-text-muted)' : 'var(--creator-orange)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Prev
            </button>
            <span style={{ padding: '8px 16px', color: 'var(--creator-text-muted)', fontSize: 13 }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--creator-border)',
                background: 'transparent',
                color: page >= totalPages ? 'var(--creator-text-muted)' : 'var(--creator-orange)',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              width: 500,
              maxWidth: '90%',
              backgroundColor: 'var(--creator-bg)',
              border: '1px solid var(--creator-border)',
              borderRadius: 16,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Create Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Title"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => createMutation.mutate(form)}
                  disabled={createMutation.isPending || !form.title}
                  style={{
                    ...primaryButtonStyle,
                    opacity: createMutation.isPending || !form.title ? 0.6 : 1,
                    cursor: createMutation.isPending || !form.title ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid var(--creator-border)',
                    background: 'transparent',
                    color: 'var(--creator-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setEditItem(null)}
        >
          <div
            style={{
              width: 500,
              maxWidth: '90%',
              backgroundColor: 'var(--creator-bg)',
              border: '1px solid var(--creator-border)',
              borderRadius: 16,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Edit Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Title"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: editItem.id,
                      data: {
                        title: form.title,
                        description: form.description,
                        type: form.type as ContentItem['type'],
                      },
                    })
                  }
                  disabled={updateMutation.isPending || !form.title}
                  style={{
                    ...primaryButtonStyle,
                    opacity: updateMutation.isPending || !form.title ? 0.6 : 1,
                  }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditItem(null)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid var(--creator-border)',
                    background: 'transparent',
                    color: 'var(--creator-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
