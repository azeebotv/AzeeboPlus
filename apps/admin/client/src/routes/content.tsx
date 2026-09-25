import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useAdminFlags, ADMIN_FLAG_KEYS } from '@/hooks/useAdminFlags';
import { unwrapList, asArray } from '@/lib/payload';
import { Icon } from '@/components/Icons';
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
  // Category/tag inline editors (backend has full CRUD — previously the UI
  // was read-only and every mutation helper went unused).
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [newTag, setNewTag] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    universeId: '',
    creatorId: '',
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'content', page, statusFilter, search],
    queryFn: async () => {
      const res = await adminApi.getContentList({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      return res.success ? unwrapList<ContentItem>(res.data) : { items: [], total: 0 };
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const res = await adminApi.getContentCategories();
      // Backend includes _count.contentItems — surface it on the rows.
      return res.success
        ? unwrapList<{ id: string; name: string; _count?: { contentItems?: number } }>(res.data)
            .items
        : [];
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['admin', 'tags'],
    queryFn: async () => {
      const res = await adminApi.getContentTags();
      return res.success ? unwrapList<{ id: string; name: string }>(res.data).items : [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin', 'content-stats'],
    queryFn: async () => {
      const res = await adminApi.getContentStats();
      if (!res.success) return null;
      const d = res.data as {
        total?: number;
        byStatus?: Record<string, number>;
        createdLast7Days?: number;
        createdLast30Days?: number;
      };
      return d ?? null;
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

  const invalidateTaxonomy = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
  };

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => adminApi.createContentCategory({ name }),
    onSuccess: () => {
      setNewCategory('');
      invalidateTaxonomy();
    },
  });
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      adminApi.updateContentCategory(id, { name }),
    onSuccess: () => {
      setEditingCategory(null);
      invalidateTaxonomy();
    },
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteContentCategory(id),
    onSuccess: invalidateTaxonomy,
  });
  const createTagMutation = useMutation({
    mutationFn: (name: string) => adminApi.createContentTag({ name }),
    onSuccess: () => {
      setNewTag('');
      invalidateTaxonomy();
    },
  });
  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteContentTag(id),
    onSuccess: invalidateTaxonomy,
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => adminApi.unpublishContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }),
  });

  const { data: universes = [] } = useQuery({
    queryKey: ['admin', 'universes-for-content'],
    queryFn: async () => {
      const res = await adminApi.getAllUniverses(1, 100);
      // Paginated { data, meta } envelope — not a bare array.
      return res.success
        ? unwrapList<{ id: string; name: string; displayName?: string }>(res.data, 'data').items
        : [];
    },
  });

  // Backend create contract requires creatorId — offer the creator roster.
  // GET /admin/users?role=creator returns a { users, total, ... } envelope.
  const { data: creators = [] } = useQuery({
    queryKey: ['admin', 'creators-for-content'],
    queryFn: async () => {
      const res = await adminApi.getCreators(1, 100);
      return asArray<{ id: string; displayName?: string; email: string }>(
        res.success ? res.data : null,
        'users'
      );
    },
  });

  const createContentMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createContent(data),
    onSuccess: () => {
      setShowCreate(false);
      setCreateForm({ title: '', description: '', mediaUrl: '', universeId: '', creatorId: '' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
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
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))
    );
  };

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
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
          <Icon name="film" size={28} color="var(--admin-orange)" />
          <span>Content Management</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--admin-text-muted)' }}>{total} items</p>
          {stats && (
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
              {stats.byStatus?.published ?? 0} published · {stats.byStatus?.draft ?? 0} draft ·{' '}
              {stats.createdLast7Days ?? 0} new this week
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' }}>
        {(['content', 'categories', 'tags'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: tab === t ? 'none' : '1px solid var(--admin-border)',
              background:
                tab === t ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)' : 'transparent',
              color: tab === t ? 'white' : 'var(--admin-text-muted)',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
        {tab === 'content' && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              marginLeft: 'auto',
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            + New Content
          </button>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {tab === 'content' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search content..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                flex: 1,
                minWidth: 200,
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--admin-border)',
                backgroundColor: 'var(--admin-card)',
                color: 'var(--admin-text)',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--admin-border)',
                backgroundColor: 'var(--admin-card)',
                color: 'var(--admin-text)',
                fontSize: 14,
                outline: 'none',
              }}
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {bulkEnabled && selected.size > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--admin-orange)',
                backgroundColor: 'rgba(232,66,10,0.08)',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-orange)' }}>
                {selected.size} item{selected.size > 1 ? 's' : ''} selected
              </span>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button
                  type="button"
                  disabled={bulkStatusMutation.isPending}
                  onClick={() =>
                    bulkStatusMutation.mutate({ ids: Array.from(selected), status: 'published' })
                  }
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'var(--admin-emerald)',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Publish Selected
                </button>
                <button
                  type="button"
                  disabled={bulkStatusMutation.isPending}
                  onClick={() =>
                    bulkStatusMutation.mutate({ ids: Array.from(selected), status: 'draft' })
                  }
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'var(--admin-surface)',
                    color: 'var(--admin-text)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Draft Selected
                </button>
                <button
                  type="button"
                  disabled={bulkStatusMutation.isPending}
                  onClick={() =>
                    bulkStatusMutation.mutate({ ids: Array.from(selected), status: 'archived' })
                  }
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'var(--admin-red)',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Archive Selected
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
              Loading...
            </p>
          ) : isError ? (
            <div
              style={{
                padding: 20,
                borderRadius: 12,
                border: '1px solid var(--admin-red)',
                background: 'rgba(204,28,28,0.1)',
                color: 'var(--admin-red)',
              }}
            >
              <strong>Failed to load content.</strong>{' '}
              {(error as Error)?.message || 'Unknown error'} — this is a backend failure, not an
              empty list.
            </div>
          ) : (
            <div
              style={{
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-surface)' }}>
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
                            color: 'var(--admin-text-muted)',
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
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--admin-bg)' }}>
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
                          <Link
                            to={`/content/${item.id}`}
                            style={{ marginLeft: 8, fontSize: 12, textDecoration: 'none' }}
                          >
                            View →
                          </Link>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--admin-text-muted)',
                            fontSize: 13,
                          }}
                        >
                          {item.creator?.name || '-'}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--admin-text-muted)',
                            fontSize: 13,
                          }}
                        >
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
                                  ? 'var(--admin-green)'
                                  : item.status === 'draft'
                                    ? 'var(--admin-amber)'
                                    : 'var(--admin-text-muted)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--admin-text-muted)',
                            fontSize: 13,
                          }}
                        >
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
                                border: '1px solid var(--admin-surface)',
                                background: 'transparent',
                                color: 'var(--admin-text-muted)',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            {item.status !== 'published' ? (
                              <button
                                onClick={() => publishMutation.mutate(item.id)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: 'var(--admin-emerald)',
                                  color: 'white',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                }}
                              >
                                Publish
                              </button>
                            ) : (
                              <button
                                onClick={() => unpublishMutation.mutate(item.id)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: '1px solid var(--admin-surface)',
                                  background: 'transparent',
                                  color: 'var(--admin-amber)',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                }}
                              >
                                Unpublish
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
                                color: 'var(--admin-red)',
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
                <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
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
                    borderTop: '1px solid var(--admin-surface)',
                    backgroundColor: 'rgba(13,5,5,0.6)',
                  }}
                >
                  <span style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
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
                        background: 'var(--admin-emerald)',
                        color: 'white',
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
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
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
                        color: 'var(--admin-red)',
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
                    border: '1px solid var(--admin-surface)',
                    background: 'transparent',
                    color: page === 1 ? 'var(--admin-text-muted)' : 'var(--admin-orange)',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prev
                </button>
                <span
                  style={{ padding: '8px 16px', color: 'var(--admin-text-muted)', fontSize: 13 }}
                >
                  Page {page} of {Math.ceil(total / 20) || 1}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    background: 'transparent',
                    color:
                      page >= Math.ceil(total / 20)
                        ? 'var(--admin-text-muted)'
                        : 'var(--admin-orange)',
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCategory.trim())
                  createCategoryMutation.mutate(newCategory.trim());
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
              }}
            />
            <button
              disabled={!newCategory.trim() || createCategoryMutation.isPending}
              onClick={() => createCategoryMutation.mutate(newCategory.trim())}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + Add
            </button>
          </div>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              {editingCategory?.id === c.id ? (
                <>
                  <input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ id: c.id, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingCategory.name.trim())
                        updateCategoryMutation.mutate({
                          id: c.id,
                          name: editingCategory.name.trim(),
                        });
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--admin-orange)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 14,
                    }}
                  />
                  <button
                    disabled={!editingCategory.name.trim()}
                    onClick={() =>
                      updateCategoryMutation.mutate({ id: c.id, name: editingCategory.name.trim() })
                    }
                    style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    style={{ padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span
                    style={{
                      color: 'var(--admin-text-muted)',
                      fontSize: 12,
                      marginLeft: 'auto',
                      marginRight: 12,
                    }}
                  >
                    {c._count?.contentItems ?? 0} items
                  </span>
                  <button
                    onClick={() => setEditingCategory({ id: c.id, name: c.name })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--admin-surface)',
                      background: 'transparent',
                      color: 'var(--admin-text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete category "${c.name}"?`))
                        deleteCategoryMutation.mutate(c.id);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #CC1C1C',
                      background: 'transparent',
                      color: 'var(--admin-red)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No categories yet — add the first one above.
            </p>
          )}
        </div>
      )}

      {tab === 'tags' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="New tag name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag.trim()) createTagMutation.mutate(newTag.trim());
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
              }}
            />
            <button
              disabled={!newTag.trim() || createTagMutation.isPending}
              onClick={() => createTagMutation.mutate(newTag.trim())}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map((t) => (
              <span
                key={t.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              >
                {t.name}
                <button
                  onClick={() => {
                    if (confirm(`Delete tag "${t.name}"?`)) deleteTagMutation.mutate(t.id);
                  }}
                  aria-label={`Delete tag ${t.name}`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--admin-red)',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {tags.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                padding: 40,
                color: 'var(--admin-text-muted)',
                width: '100%',
              }}
            >
              No tags yet — add the first one above.
            </p>
          )}
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
              width: 520,
              maxWidth: '90%',
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-surface)',
              borderRadius: 16,
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>New Content</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Title *"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                }}
              />
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Description"
                rows={3}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
              <input
                value={createForm.mediaUrl}
                onChange={(e) => setCreateForm({ ...createForm, mediaUrl: e.target.value })}
                placeholder="Media URL"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                }}
              />
              <select
                value={createForm.universeId}
                onChange={(e) => setCreateForm({ ...createForm, universeId: e.target.value })}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                }}
              >
                <option value="">No universe</option>
                {universes.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || u.name}
                  </option>
                ))}
              </select>
              <select
                value={createForm.creatorId}
                onChange={(e) => setCreateForm({ ...createForm, creatorId: e.target.value })}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                }}
              >
                <option value="">Select creator *</option>
                {creators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.email}
                  </option>
                ))}
              </select>
              {createContentMutation.isError && (
                <p style={{ color: 'var(--admin-red)', fontSize: 13, margin: 0 }}>
                  {(createContentMutation.error as Error)?.message || 'Create failed'}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() =>
                    createContentMutation.mutate({
                      title: createForm.title.trim(),
                      description: createForm.description || undefined,
                      mediaUrl: createForm.mediaUrl || undefined,
                      universeId: createForm.universeId || undefined,
                      creatorId: createForm.creatorId || undefined,
                    })
                  }
                  disabled={
                    !createForm.title.trim() ||
                    !createForm.creatorId ||
                    createContentMutation.isPending
                  }
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
                  {createContentMutation.isPending ? 'Creating...' : 'Create'}
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
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-surface)',
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
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
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
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
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
                    color: 'white',
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
        </div>
      )}
    </div>
  );
}
