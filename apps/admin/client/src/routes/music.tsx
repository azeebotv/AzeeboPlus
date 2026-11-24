import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { MusicTrackAdmin, MusicArtistAdmin } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';
import { useConfirm, Pagination } from '@/components/ui';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  published: { bg: 'rgba(46,160,67,0.15)', color: '#3fb950' },
  draft: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  archived: { bg: 'rgba(120,120,120,0.2)', color: 'var(--admin-text-muted)' },
};

export default function MusicPage() {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'tracks' | 'artists'>('tracks');
  const [page, setPage] = useState(1);
  const [genreFilter, setGenreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTrack, setEditTrack] = useState<MusicTrackAdmin | null>(null);

  const initialTrackForm = {
    title: '',
    artistName: '',
    albumName: '',
    genre: 'Afrobeats',
    duration: 180,
    coverImage: '/images/placeholders/thumbnails/16x9_03.png',
    trackUrl: '',
    status: 'published',
    isPremium: false,
  };

  const [trackForm, setTrackForm] = useState(initialTrackForm);
  const [formError, setFormError] = useState('');

  // Fetch Tracks
  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ['admin', 'music-tracks', page, genreFilter, statusFilter],
    queryFn: async () => {
      const res = await adminApi.getMusicTracks({
        page,
        limit: 20,
        genre: genreFilter || undefined,
        status: statusFilter || undefined,
      });
      return res.success && res.data ? res.data : { items: [], total: 0 };
    },
  });

  // Fetch Artists
  const { data: artistsData, isLoading: artistsLoading } = useQuery({
    queryKey: ['admin', 'music-artists'],
    queryFn: async () => {
      const res = await adminApi.getMusicArtists({ page: 1, limit: 50 });
      return res.success && res.data ? res.data : { items: [], total: 0 };
    },
  });

  // Fetch Genres
  const { data: genres = [] } = useQuery({
    queryKey: ['admin', 'music-genres'],
    queryFn: async () => {
      const res = await adminApi.getMusicGenres();
      return res.success && Array.isArray(res.data)
        ? res.data
        : ['Afrobeats', 'Amapiano', 'Highlife', 'Afro-fusion', 'Gospel', 'Hip Hop', 'R&B'];
    },
  });

  const saveTrackMutation = useMutation({
    mutationFn: async () => {
      if (!trackForm.title.trim()) throw new Error('Track title is required');
      if (!trackForm.artistName.trim()) throw new Error('Artist name is required');
      if (editTrack) {
        return adminApi.updateMusicTrack(editTrack.id, trackForm);
      }
      return adminApi.createMusicTrack(trackForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'music-tracks'] });
      closeModal();
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to save track'),
  });

  const deleteTrackMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMusicTrack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'music-tracks'] });
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditTrack(null);
    setTrackForm(initialTrackForm);
    setFormError('');
  };

  const openCreateModal = () => {
    setEditTrack(null);
    setTrackForm(initialTrackForm);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (track: MusicTrackAdmin) => {
    setEditTrack(track);
    setTrackForm({
      title: track.title,
      artistName: track.artistName || '',
      albumName: track.albumName || '',
      genre: track.genre || 'Afrobeats',
      duration: track.duration || 180,
      coverImage: track.coverImage || '/images/placeholders/thumbnails/16x9_03.png',
      trackUrl: track.trackUrl || '',
      status: track.status || 'published',
      isPremium: !!track.isPremium,
    });
    setFormError('');
    setShowModal(true);
  };

  const tracks: MusicTrackAdmin[] = tracksData?.items ?? [];
  const totalTracks = tracksData?.total ?? 0;
  const artists: MusicArtistAdmin[] = artistsData?.items ?? [];

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 6,
            }}
          >
            <Icon name="music" size={28} color="var(--admin-orange)" />
            <span>Music Universe</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>
            Manage Afrobeats, Amapiano & African audio tracks, artists, and streaming catalogs
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: 'var(--admin-orange)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="plus" size={16} />
          <span>Upload Track</span>
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--admin-border)',
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setActiveTab('tracks')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'tracks' ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
            fontWeight: 600,
            fontSize: 14,
            borderBottom: activeTab === 'tracks' ? '2px solid var(--admin-orange)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Audio Tracks ({totalTracks})
        </button>
        <button
          onClick={() => setActiveTab('artists')}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'artists' ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
            fontWeight: 600,
            fontSize: 14,
            borderBottom: activeTab === 'artists' ? '2px solid var(--admin-orange)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Artists & Curators ({artists.length})
        </button>
      </div>

      {activeTab === 'tracks' ? (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <select
              value={genreFilter}
              onChange={(e) => {
                setGenreFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--admin-card-bg)',
                border: '1px solid var(--admin-border)',
                color: 'var(--admin-text)',
                fontSize: 13,
              }}
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: 'var(--admin-card-bg)',
                border: '1px solid var(--admin-border)',
                color: 'var(--admin-text)',
                fontSize: 13,
              }}
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Tracks Table */}
          {tracksLoading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)' }}>
              Loading music catalog...
            </div>
          ) : tracks.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: 'center',
                backgroundColor: 'var(--admin-card-bg)',
                borderRadius: 14,
                border: '1px solid var(--admin-border)',
              }}
            >
              <Icon name="music" size={40} color="var(--admin-text-muted)" />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>No tracks found</h3>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 4 }}>
                Upload tracks or clear filters to populate the Music universe.
              </p>
            </div>
          ) : (
            <div
              style={{
                borderRadius: 14,
                border: '1px solid var(--admin-border)',
                backgroundColor: 'var(--admin-card-bg)',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'rgba(255,107,0,0.04)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Track</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Artist</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Genre</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Duration</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Tier</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tracks.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={t.coverImage || '/images/placeholders/thumbnails/16x9_03.png'}
                            alt=""
                            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                          />
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--admin-text)', margin: 0 }}>{t.title}</p>
                            {t.albumName && (
                              <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', margin: 0 }}>
                                {t.albumName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--admin-text)' }}>{t.artistName || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            backgroundColor: 'rgba(255,107,0,0.12)',
                            color: 'var(--admin-orange)',
                          }}
                        >
                          {t.genre || 'Afrobeats'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                        {t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {t.isPremium ? (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              backgroundColor: 'rgba(245,158,11,0.15)',
                              color: '#f59e0b',
                            }}
                          >
                            VIP Only
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>Free Stream</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: STATUS_STYLE[t.status]?.bg || 'rgba(120,120,120,0.15)',
                            color: STATUS_STYLE[t.status]?.color || 'var(--admin-text-muted)',
                          }}
                        >
                          {t.status || 'published'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            onClick={() => openEditModal(t)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              backgroundColor: 'transparent',
                              border: '1px solid var(--admin-border)',
                              color: 'var(--admin-text)',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (await confirm({ title: 'Delete Track', message: `Delete "${t.title}"?`, variant: 'danger' })) {
                                deleteTrackMutation.mutate(t.id);
                              }
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              backgroundColor: 'transparent',
                              border: '1px solid rgba(204,28,28,0.4)',
                              color: 'var(--admin-red)',
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

              {totalTracks > 20 && (
                <div style={{ padding: 16, borderTop: '1px solid var(--admin-border)' }}>
                  <Pagination currentPage={page} totalPages={Math.ceil(totalTracks / 20)} onPageChange={setPage} />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Artists Directory */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {artistsLoading ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--admin-text-muted)', gridColumn: '1 / -1' }}>
              Loading artists...
            </div>
          ) : artists.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: 48,
                textAlign: 'center',
                backgroundColor: 'var(--admin-card-bg)',
                borderRadius: 14,
                border: '1px solid var(--admin-border)',
              }}
            >
              <Icon name="users" size={40} color="var(--admin-text-muted)" />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>No artists cataloged</h3>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>
                Artists are automatically populated when tracks are uploaded.
              </p>
            </div>
          ) : (
            artists.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: 18,
                  borderRadius: 14,
                  border: '1px solid var(--admin-border)',
                  backgroundColor: 'var(--admin-card-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <img
                  src={a.image || '/images/placeholders/avatars/01.png'}
                  alt=""
                  style={{ width: 52, height: 52, borderRadius: 999, objectFit: 'cover' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--admin-text)' }}>{a.name}</h4>
                    {a.isVerified && <Icon name="checkCircle" size={14} color="#3fb950" />}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '4px 0 0 0' }}>
                    {a.genre || 'Afrobeats'}
                  </p>
                  {a.monthlyListeners != null && (
                    <p style={{ fontSize: 11, color: 'var(--admin-orange)', margin: '4px 0 0 0' }}>
                      {a.monthlyListeners.toLocaleString()} monthly listeners
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upload/Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--admin-text)' }}>
              {editTrack ? 'Edit Audio Track' : 'Upload Audio Track'}
            </h3>

            {formError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(204,28,28,0.15)',
                  border: '1px solid rgba(204,28,28,0.4)',
                  color: 'var(--admin-red)',
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Track Title *</label>
                <input
                  type="text"
                  value={trackForm.title}
                  onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                  placeholder="e.g. City Boys"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Artist Name *</label>
                  <input
                    type="text"
                    value={trackForm.artistName}
                    onChange={(e) => setTrackForm({ ...trackForm, artistName: e.target.value })}
                    placeholder="e.g. Burna Boy"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Album / Single</label>
                  <input
                    type="text"
                    value={trackForm.albumName}
                    onChange={(e) => setTrackForm({ ...trackForm, albumName: e.target.value })}
                    placeholder="e.g. I Told Them..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Genre</label>
                  <select
                    value={trackForm.genre}
                    onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Duration (seconds)</label>
                  <input
                    type="number"
                    value={trackForm.duration}
                    onChange={(e) => setTrackForm({ ...trackForm, duration: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      backgroundColor: 'var(--admin-card-bg)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Audio Stream / Media URL</label>
                <input
                  type="text"
                  value={trackForm.trackUrl}
                  onChange={(e) => setTrackForm({ ...trackForm, trackUrl: e.target.value })}
                  placeholder="https://cdn.azeebo.tv/audio/..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={trackForm.isPremium}
                    onChange={(e) => setTrackForm({ ...trackForm, isPremium: e.target.checked })}
                  />
                  <span>VIP / Subscriber Only Track</span>
                </label>

                <select
                  value={trackForm.status}
                  onChange={(e) => setTrackForm({ ...trackForm, status: e.target.value })}
                  style={{
                    marginLeft: 'auto',
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                    backgroundColor: 'var(--admin-card-bg)',
                    color: 'var(--admin-text)',
                    fontSize: 12,
                  }}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => saveTrackMutation.mutate()}
                disabled={saveTrackMutation.isPending}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  backgroundColor: 'var(--admin-orange)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: saveTrackMutation.isPending ? 0.6 : 1,
                }}
              >
                {saveTrackMutation.isPending ? 'Saving...' : editTrack ? 'Save Changes' : 'Upload Track'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
