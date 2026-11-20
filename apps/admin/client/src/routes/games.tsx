import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';

interface GameItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl?: string;
  status: string;
  views?: number;
  viewCount?: number;
  createdAt: string;
  universe?: { id: string; name: string; displayName?: string };
  metadata?: {
    category?: string;
    developer?: string;
    playUrl?: string;
    coinReward?: number;
    isMultiplayer?: boolean;
  };
}

const GAME_CATEGORIES = [
  'Esports Tournament',
  'Trivia & Quiz',
  'Arcade & Action',
  'Sports Simulation',
  'Strategy',
  'Card & Board',
  'HTML5 Instant Play',
];

export default function GamesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<GameItem | null>(null);

  const initialForm = {
    title: '',
    description: '',
    developer: 'Azeebo Games Studio',
    category: 'Trivia & Quiz',
    playUrl: '',
    thumbnail: '/images/placeholders/thumbnails/16x9_01.png',
    mediaUrl: '',
    status: 'published',
    coinReward: 25,
    isMultiplayer: true,
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

  const gamesUniverse = useMemo(() => {
    return universes.find((u) => u.name.toLowerCase() === 'games');
  }, [universes]);

  const { data: contentData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'games-list', page, statusFilter, search],
    queryFn: async () => {
      const res = await adminApi.getContentList({
        page,
        limit: 50,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      const data = requireData(res, []);
      return unwrapList<GameItem>(data);
    },
  });

  const games = useMemo(() => {
    const items = contentData?.items || [];
    return items.filter((item) => {
      if (gamesUniverse && item.universe?.id === gamesUniverse.id) return true;
      if (item.universe?.name?.toLowerCase() === 'games') return true;
      return false;
    });
  }, [contentData, gamesUniverse]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'games-list'] });
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
    const universeId = gamesUniverse?.id || 'u0000001-0000-0000-0000-000000000008';

    createMutation.mutate({
      title: createForm.title.trim(),
      description: createForm.description.trim() || `${createForm.category} title by ${createForm.developer}`,
      thumbnail: createForm.thumbnail.trim(),
      mediaUrl: createForm.mediaUrl.trim() || undefined,
      universeId,
      status: createForm.status,
      metadata: {
        developer: createForm.developer,
        category: createForm.category,
        playUrl: createForm.playUrl.trim() || undefined,
        coinReward: Number(createForm.coinReward) || 0,
        isMultiplayer: createForm.isMultiplayer,
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
        metadata: {
          developer: editForm.developer,
          category: editForm.category,
          playUrl: editForm.playUrl.trim() || undefined,
          coinReward: Number(editForm.coinReward) || 0,
          isMultiplayer: editForm.isMultiplayer,
        },
      },
    });
  };

  const openEdit = (item: GameItem) => {
    setEditItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      developer: item.metadata?.developer || 'Azeebo Games Studio',
      category: item.metadata?.category || 'Trivia & Quiz',
      playUrl: item.metadata?.playUrl || '',
      thumbnail: item.thumbnail || '/images/placeholders/thumbnails/16x9_01.png',
      mediaUrl: item.mediaUrl || '',
      status: item.status || 'published',
      coinReward: item.metadata?.coinReward ?? 25,
      isMultiplayer: item.metadata?.isMultiplayer ?? true,
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
            <Icon name="gem" size={24} color="#8b5cf6" />
            Games & Esports Hub
          </h1>
          <p
            style={{
              color: 'var(--admin-text-muted, #94a3b8)',
              fontSize: '14px',
              margin: '4px 0 0 0',
            }}
          >
            Manage interactive trivia questions, esports tournament brackets, and instant HTML5 playable games.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          style={{
            backgroundColor: '#8b5cf6',
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
          Create Game / Tournament
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
            placeholder="Search games, tournaments..."
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
            Loading games catalog...
          </div>
        ) : isError ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            Failed to load games: {(error as Error)?.message}
          </div>
        ) : games.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <Icon name="gem" size={40} color="#64748b" />
            <p style={{ marginTop: '12px', fontSize: '15px' }}>No games or tournaments found.</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                marginTop: '12px',
                backgroundColor: '#8b5cf6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Add First Game
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border, #334155)', fontSize: '13px', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px' }}>Game / Tournament</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Developer</th>
                <th style={{ padding: '12px 16px' }}>Coin Reward</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.map((item) => (
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
                      {item.description || 'Instant Play'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#c084fc' }}>
                    {item.metadata?.category || 'Esports'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                    {item.metadata?.developer || 'Azeebo'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#facc15', fontWeight: 600 }}>
                    +{item.metadata?.coinReward ?? 25} 🪙
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
                            ? 'rgba(139, 92, 246, 0.15)'
                            : 'rgba(148, 163, 184, 0.15)',
                        color: item.status === 'published' ? '#a78bfa' : '#94a3b8',
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
                            border: '1px solid #8b5cf6',
                            color: '#a78bfa',
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
                        onClick={() => {
                          if (confirm(`Delete game "${item.title}"?`)) {
                            deleteMutation.mutate(item.id);
                          }
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
                Create Game / Esports Tournament
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
                  Game / Tournament Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. FIFA Naija National Cup 2026"
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
                    Category
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    {GAME_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Developer / Studio
                  </label>
                  <input
                    type="text"
                    value={createForm.developer}
                    onChange={(e) => setCreateForm({ ...createForm, developer: e.target.value })}
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
                    Coin Reward for Winner
                  </label>
                  <input
                    type="number"
                    value={createForm.coinReward}
                    onChange={(e) => setCreateForm({ ...createForm, coinReward: parseInt(e.target.value, 10) || 0 })}
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

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                  HTML5 / WebGL Play URL (Optional)
                </label>
                <input
                  type="text"
                  value={createForm.playUrl}
                  onChange={(e) => setCreateForm({ ...createForm, playUrl: e.target.value })}
                  placeholder="https://games.azeebo.com/play/..."
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
                    backgroundColor: '#8b5cf6',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Game'}
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
                Edit Game: {editItem.title}
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
                  Title *
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
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    {GAME_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Developer / Studio
                  </label>
                  <input
                    type="text"
                    value={editForm.developer}
                    onChange={(e) => setEditForm({ ...editForm, developer: e.target.value })}
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
                    backgroundColor: '#8b5cf6',
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
