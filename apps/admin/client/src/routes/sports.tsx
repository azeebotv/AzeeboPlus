import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';

interface SportsItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl?: string;
  status: string;
  views?: number;
  viewCount?: number;
  releaseDate?: string;
  createdAt: string;
  universe?: { id: string; name: string; displayName?: string };
  metadata?: {
    homeTeam?: string;
    awayTeam?: string;
    league?: string;
    matchDate?: string;
    score?: string;
    homeOdds?: number;
    drawOdds?: number;
    awayOdds?: number;
    marketStatus?: 'open' | 'locked' | 'settled';
  };
}

const LEAGUES = [
  'Nigeria Premier Football League (NPFL)',
  'Africa Cup of Nations (AFCON)',
  'CAF Champions League',
  'Premier League',
  'Basketball Africa League (BAL)',
  'Lagos Boxing Night',
  'Athletics Grand Prix',
];

export default function SportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<SportsItem | null>(null);

  const initialForm = {
    title: '',
    description: '',
    homeTeam: 'Enyimba FC',
    awayTeam: 'Rangers International',
    league: 'Nigeria Premier Football League (NPFL)',
    matchDate: new Date().toISOString().slice(0, 16),
    thumbnail: '/images/placeholders/thumbnails/16x9_02.png',
    mediaUrl: '',
    status: 'published',
    homeOdds: 1.85,
    drawOdds: 3.20,
    awayOdds: 4.10,
    score: '',
    marketStatus: 'open' as const,
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

  const sportsUniverse = useMemo(() => {
    return universes.find((u) => u.name.toLowerCase() === 'sports');
  }, [universes]);

  const { data: contentData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'sports-list', page, statusFilter, search],
    queryFn: async () => {
      const res = await adminApi.getContentList({
        page,
        limit: 50,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      const data = requireData(res, []);
      return unwrapList<SportsItem>(data);
    },
  });

  const matches = useMemo(() => {
    const items = contentData?.items || [];
    return items.filter((item) => {
      if (sportsUniverse && item.universe?.id === sportsUniverse.id) return true;
      if (item.universe?.name?.toLowerCase() === 'sports') return true;
      return false;
    });
  }, [contentData, sportsUniverse]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'sports-list'] });
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
    const universeId = sportsUniverse?.id || 'u0000001-0000-0000-0000-000000000006';

    createMutation.mutate({
      title: createForm.title.trim(),
      description: createForm.description.trim() || `${createForm.homeTeam} vs ${createForm.awayTeam}`,
      thumbnail: createForm.thumbnail.trim(),
      mediaUrl: createForm.mediaUrl.trim() || undefined,
      universeId,
      status: createForm.status,
      metadata: {
        homeTeam: createForm.homeTeam,
        awayTeam: createForm.awayTeam,
        league: createForm.league,
        matchDate: createForm.matchDate,
        homeOdds: Number(createForm.homeOdds) || 1.0,
        drawOdds: Number(createForm.drawOdds) || 1.0,
        awayOdds: Number(createForm.awayOdds) || 1.0,
        score: createForm.score || null,
        marketStatus: createForm.marketStatus,
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
          homeTeam: editForm.homeTeam,
          awayTeam: editForm.awayTeam,
          league: editForm.league,
          matchDate: editForm.matchDate,
          homeOdds: Number(editForm.homeOdds) || 1.0,
          drawOdds: Number(editForm.drawOdds) || 1.0,
          awayOdds: Number(editForm.awayOdds) || 1.0,
          score: editForm.score || null,
          marketStatus: editForm.marketStatus,
        },
      },
    });
  };

  const openEdit = (item: SportsItem) => {
    setEditItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      homeTeam: item.metadata?.homeTeam || 'Home Team',
      awayTeam: item.metadata?.awayTeam || 'Away Team',
      league: item.metadata?.league || LEAGUES[0],
      matchDate: item.metadata?.matchDate || new Date().toISOString().slice(0, 16),
      thumbnail: item.thumbnail || '/images/placeholders/thumbnails/16x9_02.png',
      mediaUrl: item.mediaUrl || '',
      status: item.status || 'published',
      homeOdds: item.metadata?.homeOdds ?? 1.85,
      drawOdds: item.metadata?.drawOdds ?? 3.20,
      awayOdds: item.metadata?.awayOdds ?? 4.10,
      score: item.metadata?.score || '',
      marketStatus: item.metadata?.marketStatus || 'open',
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
            <Icon name="activity" size={24} color="#10b981" />
            Sports Hub & Prediction Markets
          </h1>
          <p
            style={{
              color: 'var(--admin-text-muted, #94a3b8)',
              fontSize: '14px',
              margin: '4px 0 0 0',
            }}
          >
            Schedule sporting fixtures, live streams, teams, and manage prediction market betting odds.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          style={{
            backgroundColor: '#10b981',
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
          Create Fixture / Event
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
            placeholder="Search sports matches, teams..."
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
          <option value="published">Published / Scheduled</option>
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
            Loading sports fixtures...
          </div>
        ) : isError ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            Failed to load sports: {(error as Error)?.message}
          </div>
        ) : matches.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <Icon name="activity" size={40} color="#64748b" />
            <p style={{ marginTop: '12px', fontSize: '15px' }}>No sports fixtures found.</p>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                marginTop: '12px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Add First Match
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border, #334155)', fontSize: '13px', color: '#94a3b8' }}>
                <th style={{ padding: '12px 16px' }}>Match / Fixture</th>
                <th style={{ padding: '12px 16px' }}>League</th>
                <th style={{ padding: '12px 16px' }}>Odds (1 / X / 2)</th>
                <th style={{ padding: '12px 16px' }}>Score</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((item) => (
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
                      {item.metadata?.homeTeam || 'Home'} vs {item.metadata?.awayTeam || 'Away'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                    {item.metadata?.league || 'League'}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#38bdf8' }}>
                    {item.metadata?.homeOdds ?? '1.85'} | {item.metadata?.drawOdds ?? '3.20'} | {item.metadata?.awayOdds ?? '4.10'}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#facc15' }}>
                    {item.metadata?.score || '-'}
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
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(234, 179, 8, 0.15)',
                        color: item.status === 'published' ? '#34d399' : '#facc15',
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
                            border: '1px solid #10b981',
                            color: '#34d399',
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
                          if (confirm(`Delete sports fixture "${item.title}"?`)) {
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
                Schedule Sports Match / Fixture
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
                  Match Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. NPFL Derby: Enyimba vs Rangers"
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
                    Home Team
                  </label>
                  <input
                    type="text"
                    value={createForm.homeTeam}
                    onChange={(e) => setCreateForm({ ...createForm, homeTeam: e.target.value })}
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
                    Away Team
                  </label>
                  <input
                    type="text"
                    value={createForm.awayTeam}
                    onChange={(e) => setCreateForm({ ...createForm, awayTeam: e.target.value })}
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
                  League / Tournament
                </label>
                <select
                  value={createForm.league}
                  onChange={(e) => setCreateForm({ ...createForm, league: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--admin-bg, #0f172a)',
                    border: '1px solid var(--admin-border, #334155)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                >
                  {LEAGUES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Home Odds (1)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={createForm.homeOdds}
                    onChange={(e) => setCreateForm({ ...createForm, homeOdds: parseFloat(e.target.value) || 1 })}
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
                    Draw Odds (X)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={createForm.drawOdds}
                    onChange={(e) => setCreateForm({ ...createForm, drawOdds: parseFloat(e.target.value) || 1 })}
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
                    Away Odds (2)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={createForm.awayOdds}
                    onChange={(e) => setCreateForm({ ...createForm, awayOdds: parseFloat(e.target.value) || 1 })}
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
                  Live Stream / Broadcast URL
                </label>
                <input
                  type="text"
                  value={createForm.mediaUrl}
                  onChange={(e) => setCreateForm({ ...createForm, mediaUrl: e.target.value })}
                  placeholder="https://stream.azeebo.com/sports/...m3u8"
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
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createMutation.isPending ? 'Scheduling...' : 'Save Fixture'}
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
                Edit Fixture: {editItem.title}
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
                  Match Title *
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
                    Final Score (e.g. 2 - 1)
                  </label>
                  <input
                    type="text"
                    value={editForm.score}
                    onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                    placeholder="e.g. 2 - 1"
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
                    Market Status
                  </label>
                  <select
                    value={editForm.marketStatus}
                    onChange={(e) => setEditForm({ ...editForm, marketStatus: e.target.value as any })}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--admin-bg, #0f172a)',
                      border: '1px solid var(--admin-border, #334155)',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  >
                    <option value="open">Open for Betting</option>
                    <option value="locked">Locked (Kickoff)</option>
                    <option value="settled">Settled (Paid out)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                    Home Odds (1)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editForm.homeOdds}
                    onChange={(e) => setEditForm({ ...editForm, homeOdds: parseFloat(e.target.value) || 1 })}
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
                    Draw Odds (X)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editForm.drawOdds}
                    onChange={(e) => setEditForm({ ...editForm, drawOdds: parseFloat(e.target.value) || 1 })}
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
                    Away Odds (2)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editForm.awayOdds}
                    onChange={(e) => setEditForm({ ...editForm, awayOdds: parseFloat(e.target.value) || 1 })}
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
                    backgroundColor: '#10b981',
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
