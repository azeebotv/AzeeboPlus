import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useAdminFlags, ADMIN_FLAG_KEYS } from '@/hooks/useAdminFlags';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  status: string;
  views?: number;
  createdAt: string;
  creator?: { id: string; name: string };
  universe?: { id: string; name: string };
}

export default function ContentPage() {
  const queryClient = useQueryClient();
  const { isEnabled: isFlagEnabled } = useAdminFlags();
  const bulkEnabled = isFlagEnabled(ADMIN_FLAG_KEYS.bulkActions);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tab, setTab] = useState<'content' | 'categories' | 'tags'>('content');
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'content', page, statusFilter, search],
    queryFn: async () => {
      const res = await adminApi.getContentList({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      return res.success
        ? (res.data as { items: ContentItem[]; total: number })
        : { items: [], total: 0 };
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const res = await adminApi.getContentCategories();
      return res.success ? (res.data as Array<{ id: string; name: string }>) : [];
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['admin', 'tags'],
    queryFn: async () => {
      const res = await adminApi.getContentTags();
      return res.success ? (res.data as Array<{ id: string; name: string }>) : [];
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => adminApi.publishContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateContent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      setEditItem(null);
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      adminApi.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      setSelected(new Set());
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => adminApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      setSelected(new Set());
    },
  });

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  };

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Content Management</h1>
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>{total} items</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['content', 'categories', 'tags'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: tab === t ? 'none' : '1px solid #2A1A1A',
              background:
                tab === t ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
              color: tab === t ? '#fff' : '#9A8A7A',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {tab === 'content' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search content..."
              style={{
                flex: 1,
                minWidth: 200,
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {['', 'published', 'draft', 'archived'].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: statusFilter === s ? 'none' : '1px solid #2A1A1A',
                    background:
                      statusFilter === s
                        ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                        : 'transparent',
                    color: statusFilter === s ? '#fff' : '#9A8A7A',
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
          </div>

          {isLoading ? (
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
          ) : (
            <div
              style={{
                borderRadius: 16,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                      {bulkEnabled && (
                        <th style={{ padding: '12px 16px', width: 40 }}>
                          <input
                            type="checkbox"
                            checked={items.length > 0 && selected.size === items.length}
                            onChange={toggleAll}
                            aria-label="Select all content"
                          />
                        </th>
                      )}
                      {['Title', 'Creator', 'Universe', 'Status', 'Views', 'Actions'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            color: '#9A8A7A',
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
                    {items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #1A0A0A' }}>
                        {bulkEnabled && (
                          <td style={{ padding: '12px 16px' }}>
                            <input
                              type="checkbox"
                              checked={selected.has(item.id)}
                              onChange={() => toggleSelected(item.id)}
                              aria-label={`Select ${item.title}`}
                            />
                          </td>
                        )}
                        <td
                          style={{
                            padding: '12px 16px',
                            fontWeight: 600,
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9A8A7A', fontSize: 13 }}>
                          {item.creator?.name || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9A8A7A', fontSize: 13 }}>
                          {item.universe?.name || '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor:
                                item.status === 'published'
                                  ? 'rgba(13,59,46,0.2)'
                                  : item.status === 'draft'
                                    ? 'rgba(245,158,11,0.2)'
                                    : 'rgba(154,138,122,0.2)',
                              color:
                                item.status === 'published'
                                  ? '#0D3B2E'
                                  : item.status === 'draft'
                                    ? '#F59E0B'
                                    : '#9A8A7A',
                              textTransform: 'capitalize',
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#9A8A7A', fontSize: 13 }}>
                          {(item.views || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => {
                                setEditItem(item);
                                setEditForm({ title: item.title, description: item.description });
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid #2A1A1A',
                                background: 'transparent',
                                color: '#9A8A7A',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            {item.status !== 'published' && (
                              <button
                                onClick={() => publishMutation.mutate(item.id)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #0D3B2E 0%, #1A5E45 100%)',
                                  color: '#fff',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                }}
                              >
                                Publish
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('Delete this content?')) deleteMutation.mutate(item.id);
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid #CC1C1C',
                                background: 'transparent',
                                color: '#CC1C1C',
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
              {items.length === 0 && (
                <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>
                  No content found
                </p>
              )}
              {bulkEnabled && selected.size > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 16px',
                    borderTop: '1px solid #2A1A1A',
                    backgroundColor: 'rgba(13,5,5,0.6)',
                  }}
                >
                  <span style={{ color: '#9A8A7A', fontSize: 13 }}>
                    {selected.size} selected
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() =>
                        bulkStatusMutation.mutate({
                          ids: Array.from(selected),
                          status: 'published',
                        })
                      }
                      disabled={bulkStatusMutation.isPending}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'linear-gradient(135deg, #0D3B2E 0%, #1A5E45 100%)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Publish
                    </button>
                    <button
                      onClick={() =>
                        bulkStatusMutation.mutate({
                          ids: Array.from(selected),
                          status: 'archived',
                        })
                      }
                      disabled={bulkStatusMutation.isPending}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid #2A1A1A',
                        background: 'transparent',
                        color: '#9A8A7A',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${selected.size} items?`))
                          bulkDeleteMutation.mutate(Array.from(selected));
                      }}
                      disabled={bulkDeleteMutation.isPending}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid #CC1C1C',
                        background: 'transparent',
                        color: '#CC1C1C',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    background: 'transparent',
                    color: page === 1 ? '#4A3A3A' : '#E8420A',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prev
                </button>
                <span style={{ padding: '8px 16px', color: '#9A8A7A', fontSize: 13 }}>
                  Page {page} of {Math.ceil(total / 20) || 1}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    background: 'transparent',
                    color: page >= Math.ceil(total / 20) ? '#4A3A3A' : '#E8420A',
                    cursor: page >= Math.ceil(total / 20) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <span style={{ fontWeight: 500 }}>{c.name}</span>
            </div>
          ))}
          {categories.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No categories</p>
          )}
        </div>
      )}

      {tab === 'tags' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map((t) => (
            <span
              key={t.id}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
                color: '#F5F0EB',
                fontSize: 13,
              }}
            >
              {t.name}
            </span>
          ))}
          {tags.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', width: '100%' }}>
              No tags
            </p>
          )}
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
              backgroundColor: '#1A0A0A',
              border: '1px solid #2A1A1A',
              borderRadius: 16,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Edit Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Title"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                }}
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Description"
                rows={4}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => updateMutation.mutate({ id: editItem.id, data: editForm })}
                  disabled={updateMutation.isPending}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditItem(null)}
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
        </div>
      )}
    </div>
  );
}
