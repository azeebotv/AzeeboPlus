import { useConfirm, Pagination } from "@/components/ui";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';

interface VerticalItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl?: string;
  status: string;
  views?: number;
  viewCount?: number;
  duration?: number;
  isExclusive?: boolean;
  isPremiere?: boolean;
  createdAt: string;
  creator?: { id: string; displayName?: string; email: string };
  universe?: { id: string; name: string; displayName?: string };
  metadata?: {
    chaptersCount?: number;
    coinPrice?: number;
    genre?: string;
    aspectRatio?: string;
  };
}

const VERTICAL_GENRES = [
  'Drama',
  'Romance',
  'Thriller',
  'Comedy',
  'Mystery',
  'Campus Life',
  'Mythology & Lore',
  'Street Hustle',
];

export default function VerticalSeriesPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<VerticalItem | null>(null);

  const initialForm = {
    title: '',
    description: '',
    thumbnail: '/images/placeholders/thumbnails/9x16_01.png',
    mediaUrl: '',
    genre: 'Drama',
    status: 'published',
    chaptersCount: 10,
    coinPrice: 5,
    isExclusive: false,
    isPremiere: false,
  };

  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);

  // Fetch universes to identify Vertical universe
  const { data: universes = [] } = useQuery({
    queryKey: ['admin', 'universes-list'],
    queryFn: async () => {
      const res = await adminApi.getAllUniverses(1, 100);
      return res.success
        ? unwrapList<{ id: string; name: string; displayName?: string }>(res.data, 'data').items
        : [];
    },
  });

  const verticalUniverse = useMemo(() => {
    return universes.find(
      (u) => u.name.toLowerCase() === 'vertical' || u.name.toLowerCase() === 'vertical-series'
    );
  }, [universes]);

  // Fetch vertical series content
  const { data: contentData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'vertical-series-list', page, statusFilter, search],
    queryFn: async () => {
      const res = await adminApi.getContentList({
        page,
        limit: 50,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      const data = requireData(res, []);
      return unwrapList<VerticalItem>(data);
    },
  });

  const series = useMemo(() => {
    const items = contentData?.items || [];
    return items.filter((item) => {
      if (verticalUniverse && item.universe?.id === verticalUniverse.id) return true;
      if (item.universe?.name?.toLowerCase() === 'vertical') return true;
      return false;
    });
  }, [contentData, verticalUniverse]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'vertical-series-list'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createContent(data),
    onSuccess: () => {
      setShowCreate(false);
      setCreateForm(initialForm);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateContent(id, data),
    onSuccess: () => {
      setEditItem(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteContent(id),
    onSuccess: invalidate,
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => adminApi.publishContent(id),
    onSuccess: invalidate,
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => adminApi.unpublishContent(id),
    onSuccess: invalidate,
  });

  const handleCreateSubmit = () => {
    if (!createForm.title.trim()) return;
    const universeId = verticalUniverse?.id || 'u0000001-0000-0000-0000-000000000009';

    createMutation.mutate({
      title: createForm.title.trim(),
      description: createForm.description.trim(),
      thumbnail: createForm.thumbnail.trim(),
      mediaUrl: createForm.mediaUrl.trim() || undefined,
      universeId,
      status: createForm.status,
      isExclusive: createForm.isExclusive,
      isPremiere: createForm.isPremiere,
      metadata: {
        genre: createForm.genre,
        chaptersCount: Number(createForm.chaptersCount) || 1,
        coinPrice: Number(createForm.coinPrice) || 0,
        aspectRatio: '9:16',
      },
    });
  };

  const handleEditSubmit = () => {
    if (!editItem || !editForm.title.trim()) return;
    updateMutation.mutate({
      id: editItem.id,
      data: {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        thumbnail: editForm.thumbnail.trim(),
        mediaUrl: editForm.mediaUrl.trim() || undefined,
        status: editForm.status,
        isExclusive: editForm.isExclusive,
        isPremiere: editForm.isPremiere,
        metadata: {
          genre: editForm.genre,
          chaptersCount: Number(editForm.chaptersCount) || 1,
          coinPrice: Number(editForm.coinPrice) || 0,
          aspectRatio: '9:16',
        },
      },
    });
  };

  const openEdit = (item: VerticalItem) => {
    setEditItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      thumbnail: item.thumbnail || '/images/placeholders/thumbnails/9x16_01.png',
      mediaUrl: item.mediaUrl || '',
      genre: item.metadata?.genre || 'Drama',
      status: item.status || 'published',
      chaptersCount: item.metadata?.chaptersCount || 10,
      coinPrice: item.metadata?.coinPrice ?? 5,
      isExclusive: item.isExclusive ?? false,
      isPremiere: item.isPremiere ?? false,
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--admin-text, #fff)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Icon name="film" size={24} color="#6366f1" />
            Vertical Series (9:16)
          </h1>
          <p
            style={{
              color: 'var(--admin-text-muted, #94a3b8)',
              fontSize: '14px',
              margin: '4px 0 0 0',
            }}
          >
            Manage mobile-first vertical episodic content, chapters, and coin unlock pricing.
            Admin-managed IP.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          style={{
            backgroundColor: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name="plus" size={16} />
          Create Vertical Series
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: 'var(--admin-card-bg, #1e293b)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid var(--admin-border, #334155)',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Search vertical series..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--admin-bg, #0f172a)',
              color: 'var(--admin-text, #fff)',
              border: '1px solid var(--admin-border, #334155)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px',
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            backgroundColor: 'var(--admin-bg, #0f172a)',
            color: 'var(--admin-text, #fff)',
            border: '1px solid var(--admin-border, #334155)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '14px',
          }}
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Content Table */}
      <div
        style={{
          backgroundColor: 'var(--admin-card-bg, #1e293b)',
          borderRadius: '8px',
          border: '1px solid var(--admin-border, #334155)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Loading vertical series catalog...
          </div>
        ) : isError ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            Failed to load vertical series: {(error as Error)?.message}
          </div>
        ) : series.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <Icon name="film" size={40} color="#64748b" />
            <p style={{ marginTop: '12px', fontSize: '15px' }}>No vertical series found.</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                marginTop: '12px',
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Add First Vertical Series
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border, #334155)', fontSize: '13px', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px' }}>Series</th>
                <th style={{ padding: '12px 16px' }}>Genre</th>
                <th style={{ padding: '12px 16px' }}>Chapters</th>
                <th style={{ padding: '12px 16px' }}>Coin Cost</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Views</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {series.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--admin-border, #334155)',
                    fontSize: '14px',
                    color: 'var(--admin-text, #fff)',
                  }}
                >
                  <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={item.thumbnail || '/images/placeholders/thumbnails/9x16_01.png'}
                      alt={item.title}
                      style={{
                        width: '40px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        backgroundColor: '#0f172a',
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.description || 'No description'}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                    {item.metadata?.genre || 'Drama'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                    {item.metadata?.chaptersCount || 10} eps
                  </td>
                  <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 600 }}>
                    {item.metadata?.coinPrice ?? 5} 🪙
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor:
                          item.status === 'published'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(234, 179, 8, 0.15)',
                        color: item.status === 'published' ? '#4ade80' : '#facc15',
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                    {(item.views || item.viewCount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {item.status === 'published' ? (
                        <button
                          onClick={() => unpublishMutation.mutate(item.id)}
                          style={{
                            background: 'none',
                            border: '1px solid #475569',
                            color: '#94a3b8',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => publishMutation.mutate(item.id)}
                          style={{
                            background: 'none',
                            border: '1px solid #22c55e',
                            color: '#4ade80',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(item)}
                        style={{
                          background: 'none',
                          border: '1px solid #6366f1',
                          color: '#818cf8',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          const ok = await confirm({ title: "Delete Vertical Series", message: `Delete vertical series "${item.title}"?`, variant: "danger" });
                          if (ok) deleteMutation.mutate(item.id);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid #ef4444',
                          color: '#f87171',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
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
        )}
        <Pagination
          currentPage={page}
          totalPages={contentData?.total ? Math.ceil(contentData.total / 50) : 1}
          totalItems={contentData?.total || series.length}
          pageSize={50}
          onPageChange={setPage}
        />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-card-bg, #1e293b)',
              border: '1px solid var(--admin-border, #334155)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                Create New Vertical Series
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Series Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. 60 Seconds of Drama"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--admin-bg, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Synopsis / Story Arc
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the fast-paced narrative hook..."
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--admin-bg, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Genre
                  </label>
                  <select
                    value={createForm.genre}
                    onChange={(e) => setCreateForm({ ...createForm, genre: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    {VERTICAL_GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Total Chapters
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.chaptersCount}
                    onChange={(e) => setCreateForm({ ...createForm, chaptersCount: parseInt(e.target.value, 10) || 1 })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Unlock Coin Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.coinPrice}
                    onChange={(e) => setCreateForm({ ...createForm, coinPrice: parseInt(e.target.value, 10) || 0 })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Cover Poster URL (9:16 aspect ratio)
                </label>
                <input
                  type="text"
                  value={createForm.thumbnail}
                  onChange={(e) => setCreateForm({ ...createForm, thumbnail: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--admin-bg, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Video Stream URL (HLS / MP4)
                </label>
                <input
                  type="text"
                  value={createForm.mediaUrl}
                  onChange={(e) => setCreateForm({ ...createForm, mediaUrl: e.target.value })}
                  placeholder="https://stream.azeebo.com/vertical/...m3u8"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--admin-bg, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    color: '#94a3b8',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSubmit}
                  disabled={createMutation.isPending || !createForm.title.trim()}
                  style={{
                    backgroundColor: '#6366f1',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: createMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {createMutation.isPending ? 'Saving...' : 'Create Series'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-card-bg, #1e293b)',
              border: '1px solid var(--admin-border, #334155)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                Edit Vertical Series: {editItem.title}
              </h2>
              <button
                onClick={() => setEditItem(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Series Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--admin-bg, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Synopsis / Story Arc
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--admin-bg, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Genre
                  </label>
                  <select
                    value={editForm.genre}
                    onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    {VERTICAL_GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Total Chapters
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.chaptersCount}
                    onChange={(e) => setEditForm({ ...editForm, chaptersCount: parseInt(e.target.value, 10) || 1 })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Unlock Coin Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.coinPrice}
                    onChange={(e) => setEditForm({ ...editForm, coinPrice: parseInt(e.target.value, 10) || 0 })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Cover Poster URL (9:16)
                </label>
                <input
                  type="text"
                  value={editForm.thumbnail}
                  onChange={(e) => setEditForm({ ...editForm, thumbnail: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--admin-bg, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  Video Stream URL
                </label>
                <input
                  type="text"
                  value={editForm.mediaUrl}
                  onChange={(e) => setEditForm({ ...editForm, mediaUrl: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--admin-bg, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    color: '#94a3b8',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={updateMutation.isPending || !editForm.title.trim()}
                  style={{
                    backgroundColor: '#6366f1',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: updateMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
