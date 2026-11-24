import { useConfirm, Pagination } from "@/components/ui";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';

interface ComedyItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl?: string;
  status: string;
  views?: number;
  viewCount?: number;
  duration?: number;
  createdAt: string;
  universe?: { id: string; name: string; displayName?: string };
  metadata?: {
    comedian?: string;
    venue?: string;
    specialType?: string;
    prizePool?: number;
    audioUrl?: string;
  };
}

const COMEDY_TYPES = [
  'Standup Special',
  'Skit Series',
  'Roast Challenge',
  'Comedy Special',
  'Parody',
  'Improv Night',
];

export default function ComedyPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<ComedyItem | null>(null);

  const initialForm = {
    title: '',
    description: '',
    comedian: 'Basketmouth',
    venue: 'Eko Hotel Convention Centre',
    specialType: 'Standup Special',
    thumbnail: '/images/placeholders/thumbnails/16x9_03.png',
    mediaUrl: '',
    audioUrl: '',
    status: 'published',
    duration: 3600,
    prizePool: 0,
  };

  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);

  const { data: universes = [] } = useQuery({
    queryKey: ['admin', 'universes-list'],
    queryFn: async () => {
      const res = await adminApi.getAllUniverses(1, 100);
      return res.success
        ? unwrapList<{ id: string; name: string; displayName?: string }>(res.data, 'data').items
        : [];
    },
  });

  const comedyUniverse = useMemo(() => {
    return universes.find((u) => u.name.toLowerCase() === 'comedy');
  }, [universes]);

  const { data: contentData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'comedy-list', page, statusFilter, search],
    queryFn: async () => {
      const res = await adminApi.getContentList({
        page,
        limit: 50,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      const data = requireData(res, []);
      return unwrapList<ComedyItem>(data);
    },
  });

  const specials = useMemo(() => {
    const items = contentData?.items || [];
    return items.filter((item) => {
      if (comedyUniverse && item.universe?.id === comedyUniverse.id) return true;
      if (item.universe?.name?.toLowerCase() === 'comedy') return true;
      return false;
    });
  }, [contentData, comedyUniverse]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'comedy-list'] });
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
    const universeId = comedyUniverse?.id || 'u0000001-0000-0000-0000-000000000005';

    createMutation.mutate({
      title: createForm.title.trim(),
      description: createForm.description.trim() || `Live performance by ${createForm.comedian}`,
      thumbnail: createForm.thumbnail.trim(),
      mediaUrl: createForm.mediaUrl.trim() || undefined,
      universeId,
      status: createForm.status,
      duration: Number(createForm.duration) || 3600,
      metadata: {
        comedian: createForm.comedian,
        venue: createForm.venue,
        specialType: createForm.specialType,
        prizePool: Number(createForm.prizePool) || 0,
        audioUrl: createForm.audioUrl.trim() || undefined,
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
        duration: Number(editForm.duration) || 3600,
        metadata: {
          comedian: editForm.comedian,
          venue: editForm.venue,
          specialType: editForm.specialType,
          prizePool: Number(editForm.prizePool) || 0,
          audioUrl: editForm.audioUrl.trim() || undefined,
        },
      },
    });
  };

  const openEdit = (item: ComedyItem) => {
    setEditItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      comedian: item.metadata?.comedian || 'Basketmouth',
      venue: item.metadata?.venue || 'Eko Hotel',
      specialType: item.metadata?.specialType || 'Standup Special',
      thumbnail: item.thumbnail || '/images/placeholders/thumbnails/16x9_03.png',
      mediaUrl: item.mediaUrl || '',
      audioUrl: item.metadata?.audioUrl || '',
      status: item.status || 'published',
      duration: item.duration || 3600,
      prizePool: item.metadata?.prizePool || 0,
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
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
            <Icon name="star" size={24} color="#f59e0b" />
            Comedy Hub & Specials
          </h1>
          <p
            style={{
              color: 'var(--admin-text-muted, #94a3b8)',
              fontSize: '14px',
              margin: '4px 0 0 0',
            }}
          >
            Manage stand-up specials, sketch comedy series, and community comedy roast challenges.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          style={{
            backgroundColor: '#f59e0b',
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
          Create Comedy Special
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
            placeholder="Search comedy specials, comedians..."
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
            Loading comedy specials...
          </div>
        ) : isError ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            Failed to load comedy: {(error as Error)?.message}
          </div>
        ) : specials.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <Icon name="star" size={40} color="#64748b" />
            <p style={{ marginTop: '12px', fontSize: '15px' }}>No comedy specials found.</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                marginTop: '12px',
                backgroundColor: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Add First Comedy Special
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border, #334155)', fontSize: '13px', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px' }}>Special</th>
                <th style={{ padding: '12px 16px' }}>Comedian</th>
                <th style={{ padding: '12px 16px' }}>Format</th>
                <th style={{ padding: '12px 16px' }}>Duration</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {specials.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--admin-border, #334155)',
                    fontSize: '14px',
                    color: 'var(--admin-text, #fff)',
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {item.metadata?.venue || 'Live Event'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                    {item.metadata?.comedian || 'Headline Comedian'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#f59e0b' }}>
                    {item.metadata?.specialType || 'Standup Special'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                    {Math.round((item.duration || 3600) / 60)} mins
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
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(148, 163, 184, 0.15)',
                        color: item.status === 'published' ? '#f59e0b' : '#94a3b8',
                      }}
                    >
                      {item.status}
                    </span>
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
                            border: '1px solid #f59e0b',
                            color: '#fbbf24',
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
                          const ok = await confirm({ title: "Delete Comedy Special", message: `Delete comedy special "${item.title}"?`, variant: "danger" });
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
          totalItems={contentData?.total || specials.length}
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
                Create Comedy Special
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
                  Special Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Basketmouth: Lord of the Ribs Live"
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
                    Headline Comedian
                  </label>
                  <input
                    type="text"
                    value={createForm.comedian}
                    onChange={(e) => setCreateForm({ ...createForm, comedian: e.target.value })}
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
                    Venue / Event
                  </label>
                  <input
                    type="text"
                    value={createForm.venue}
                    onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Format Type
                  </label>
                  <select
                    value={createForm.specialType}
                    onChange={(e) => setCreateForm({ ...createForm, specialType: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    {COMEDY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={createForm.duration}
                    onChange={(e) => setCreateForm({ ...createForm, duration: parseInt(e.target.value, 10) || 3600 })}
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
                  Video Stream URL
                </label>
                <input
                  type="text"
                  value={createForm.mediaUrl}
                  onChange={(e) => setCreateForm({ ...createForm, mediaUrl: e.target.value })}
                  placeholder="https://stream.azeebo.com/comedy/...m3u8"
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
                    backgroundColor: '#f59e0b',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Special'}
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
                Edit Comedy Special: {editItem.title}
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
                  Special Title *
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Headline Comedian
                  </label>
                  <input
                    type="text"
                    value={editForm.comedian}
                    onChange={(e) => setEditForm({ ...editForm, comedian: e.target.value })}
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
                    Venue / Event
                  </label>
                  <input
                    type="text"
                    value={editForm.venue}
                    onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
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
                    backgroundColor: '#f59e0b',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
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
