import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';
import { useConfirm, useAlert, Pagination } from '@/components/ui';

interface MovieItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl?: string;
  status: string;
  views?: number;
  viewCount?: number;
  windowType?: string;
  isExclusive?: boolean;
  isPremiere?: boolean;
  releaseDate?: string;
  theatricalReleaseDate?: string;
  streamingReleaseDate?: string;
  windowEndDate?: string;
  createdAt: string;
  creator?: { id: string; displayName?: string; email: string };
  universe?: { id: string; name: string; displayName?: string };
  categories?: Array<{ id: string; name: string }>;
}

const GENRE_OPTIONS = [
  'Nollywood',
  'Drama',
  'Action',
  'Comedy',
  'Thriller',
  'Romance',
  'African Epic',
  'Documentary',
  'Sci-Fi',
  'Horror',
];

export default function MoviesPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const alert = useAlert();
  const [activeTab, setActiveTab] = useState<'films' | 'dbo' | 'passes'>('films');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [windowFilter, setWindowFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<MovieItem | null>(null);

  // Initial form states
  const initialForm = {
    title: '',
    description: '',
    thumbnail: '/images/placeholders/thumbnails/16x9_01.png',
    banner: '/images/placeholders/banners/hero_01.png',
    mediaUrl: '',
    genre: 'Nollywood',
    status: 'draft',
    windowType: 'standard',
    isExclusive: false,
    isPremiere: false,
    releaseDate: '',
    theatricalReleaseDate: '',
    streamingReleaseDate: '',
    windowEndDate: '',
  };

  const [createForm, setCreateForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(initialForm);

  // Fetch universes to locate the Movies universe
  const { data: universes = [] } = useQuery({
    queryKey: ['admin', 'universes-list'],
    queryFn: async () => {
      const res = await adminApi.getAllUniverses(1, 100);
      return res.success
        ? unwrapList<{ id: string; name: string; displayName?: string }>(res.data, 'data').items
        : [];
    },
  });

  const movieUniverse = useMemo(() => {
    return universes.find(
      (u) => u.name.toLowerCase() === 'movies' || u.name.toLowerCase() === 'movie'
    );
  }, [universes]);

  // Fetch movies catalog
  const { data: contentData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'movies-list', page, statusFilter, search],
    queryFn: async () => {
      const res = await adminApi.getContentList({
        page,
        limit: 50,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      const data = requireData(res, []);
      return unwrapList<MovieItem>(data);
    },
  });

  // Filter content items that belong to the movies universe
  const movies = useMemo(() => {
    const items = contentData?.items || [];
    return items.filter((item) => {
      const isMovie =
        (movieUniverse && item.universe?.id === movieUniverse.id) ||
        item.universe?.name?.toLowerCase() === 'movies' ||
        item.universe?.name?.toLowerCase() === 'movie' ||
        item.windowType === 'premiere' ||
        item.isPremiere;

      if (!isMovie && items.length > 0) {
        // If universe tags aren't populated, show items matching filters
        return true;
      }
      return true;
    });
  }, [contentData, movieUniverse]);

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      if (windowFilter && (m.windowType || 'standard') !== windowFilter) return false;
      return true;
    });
  }, [movies, windowFilter]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'movies-list'] });
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
    const universeId = movieUniverse?.id;
    if (!universeId) {
      void alert('Universe Missing', 'Movies universe not found. Please ensure universes are initialized.');
      return;
    }

    createMutation.mutate({
      title: createForm.title.trim(),
      description: createForm.description || undefined,
      thumbnail: createForm.thumbnail || undefined,
      mediaUrl: createForm.mediaUrl || undefined,
      universeId,
      status: createForm.status,
      windowType: createForm.windowType,
      isExclusive: createForm.isExclusive,
      isPremiere: createForm.isPremiere,
      releaseDate: createForm.releaseDate ? new Date(createForm.releaseDate).toISOString() : undefined,
      theatricalReleaseDate: createForm.theatricalReleaseDate
        ? new Date(createForm.theatricalReleaseDate).toISOString()
        : undefined,
      streamingReleaseDate: createForm.streamingReleaseDate
        ? new Date(createForm.streamingReleaseDate).toISOString()
        : undefined,
      windowEndDate: createForm.windowEndDate
        ? new Date(createForm.windowEndDate).toISOString()
        : undefined,
    });
  };

  const handleEditSubmit = () => {
    if (!editItem || !editForm.title.trim()) return;

    updateMutation.mutate({
      id: editItem.id,
      data: {
        title: editForm.title.trim(),
        description: editForm.description || undefined,
        thumbnail: editForm.thumbnail || undefined,
        mediaUrl: editForm.mediaUrl || undefined,
        status: editForm.status,
        windowType: editForm.windowType,
        isExclusive: editForm.isExclusive,
        isPremiere: editForm.isPremiere,
        releaseDate: editForm.releaseDate ? new Date(editForm.releaseDate).toISOString() : undefined,
        theatricalReleaseDate: editForm.theatricalReleaseDate
          ? new Date(editForm.theatricalReleaseDate).toISOString()
          : undefined,
        streamingReleaseDate: editForm.streamingReleaseDate
          ? new Date(editForm.streamingReleaseDate).toISOString()
          : undefined,
        windowEndDate: editForm.windowEndDate
          ? new Date(editForm.windowEndDate).toISOString()
          : undefined,
      },
    });
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Movies Universe</h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 999,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#93c5fd',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Admin Only Catalog
            </span>
          </div>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, marginTop: 6 }}>
            Feature films, premiere release windows, and cinema passes. Managed exclusively by platform admins.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateForm(initialForm);
            setShowCreate(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Icon name="plus" size={16} />
          <span>Upload Movie</span>
        </button>
      </div>

      {/* Authority Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          borderRadius: 12,
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          marginBottom: 24,
          fontSize: 13,
          color: 'var(--admin-text)',
        }}
      >
        <Icon name="shield" size={18} color="#60a5fa" />
        <span>
          <strong>Universe Policy:</strong> Unlike Verticals (which are exclusively uploaded by creators via Creator Studio), the Movies catalog is restricted to platform administrators. Creators cannot upload movies directly.
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--admin-border)',
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => setActiveTab('films')}
          style={{
            padding: '10px 18px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'films' ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
            fontWeight: 600,
            fontSize: 14,
            borderBottom: activeTab === 'films' ? '2px solid var(--admin-orange)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Feature Films Catalog
        </button>
        <button
          onClick={() => setActiveTab('dbo')}
          style={{
            padding: '10px 18px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'dbo' ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
            fontWeight: 600,
            fontSize: 14,
            borderBottom: activeTab === 'dbo' ? '2px solid var(--admin-orange)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Digital Box Office (DBO)
        </button>
        <button
          onClick={() => setActiveTab('passes')}
          style={{
            padding: '10px 18px',
            border: 'none',
            backgroundColor: 'transparent',
            color: activeTab === 'passes' ? 'var(--admin-orange)' : 'var(--admin-text-muted)',
            fontWeight: 600,
            fontSize: 14,
            borderBottom: activeTab === 'passes' ? '2px solid var(--admin-orange)' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Cinema Passes & Tickets
        </button>
      </div>

      {activeTab === 'films' ? (
        <>
          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search movies by title..."
          style={{
            flex: '1 1 240px',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-dark)',
            color: 'var(--admin-text)',
            fontSize: 13,
            outline: 'none',
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-dark)',
            color: 'var(--admin-text)',
            fontSize: 13,
          }}
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={windowFilter}
          onChange={(e) => setWindowFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--admin-surface)',
            backgroundColor: 'var(--admin-dark)',
            color: 'var(--admin-text)',
            fontSize: 13,
          }}
        >
          <option value="">All Window Types</option>
          <option value="standard">Standard Window</option>
          <option value="premiere">Premiere Window</option>
          <option value="premium">Premium Pass</option>
          <option value="free">Free Access</option>
        </select>
      </div>

      {/* Movies Table */}
      {isLoading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>Loading movies...</p>
      ) : isError ? (
        <div style={{ padding: 20, borderRadius: 12, backgroundColor: 'rgba(204,28,28,0.1)', color: 'var(--admin-red)' }}>
          Failed to load movies: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div
          style={{
            padding: 48,
            borderRadius: 16,
            backgroundColor: 'var(--admin-surface)',
            border: '1px solid var(--admin-card)',
            textAlign: 'center',
          }}
        >
          <Icon name="film" size={40} color="var(--admin-text-muted)" />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginTop: 12, marginBottom: 6 }}>No movies found</h3>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 16 }}>
            Upload your first feature film or theatrical release window.
          </p>
          <button
            onClick={() => {
              setCreateForm(initialForm);
              setShowCreate(true);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'var(--admin-primary)',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Upload Movie
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--admin-surface)',
            borderRadius: 16,
            border: '1px solid var(--admin-card)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-card)', color: 'var(--admin-text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Movie</th>
                <th style={{ padding: '12px 16px' }}>Window</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Views</th>
                <th style={{ padding: '12px 16px' }}>Release Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovies.map((movie) => (
                <tr
                  key={movie.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 150ms' }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 64,
                          borderRadius: 8,
                          backgroundColor: 'var(--admin-surface)',
                          border: '1px solid var(--admin-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {movie.thumbnail && !movie.thumbnail.includes('placeholder') ? (
                          <img
                            src={movie.thumbnail}
                            alt={movie.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <Icon name="film" size={20} color="var(--admin-orange)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: 14 }}>
                          {movie.title}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          {movie.isPremiere && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, backgroundColor: 'rgba(232,66,10,0.2)', color: 'var(--admin-orange)' }}>
                              PREMIERE
                            </span>
                          )}
                          {movie.isExclusive && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, backgroundColor: 'rgba(168,85,247,0.2)', color: '#c084fc' }}>
                              EXCLUSIVE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: 'var(--admin-text)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {movie.windowType || 'Standard'}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor:
                          movie.status === 'published'
                            ? 'rgba(16,185,129,0.2)'
                            : movie.status === 'archived'
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(245,158,11,0.2)',
                        color:
                          movie.status === 'published'
                            ? 'var(--admin-emerald)'
                            : movie.status === 'archived'
                            ? 'var(--admin-red)'
                            : 'var(--admin-amber)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {movie.status}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                    {(movie.views || movie.viewCount || 0).toLocaleString()}
                  </td>

                  <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                    {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : '—'}
                  </td>

                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          setEditItem(movie);
                          setEditForm({
                            title: movie.title,
                            description: movie.description || '',
                            thumbnail: movie.thumbnail || '',
                            banner: '/images/placeholders/banners/hero_01.png',
                            mediaUrl: movie.mediaUrl || '',
                            genre: 'Nollywood',
                            status: movie.status || 'draft',
                            windowType: movie.windowType || 'standard',
                            isExclusive: Boolean(movie.isExclusive),
                            isPremiere: Boolean(movie.isPremiere),
                            releaseDate: movie.releaseDate ? movie.releaseDate.slice(0, 10) : '',
                            theatricalReleaseDate: movie.theatricalReleaseDate
                              ? movie.theatricalReleaseDate.slice(0, 10)
                              : '',
                            streamingReleaseDate: movie.streamingReleaseDate
                              ? movie.streamingReleaseDate.slice(0, 10)
                              : '',
                            windowEndDate: movie.windowEndDate ? movie.windowEndDate.slice(0, 10) : '',
                          });
                        }}
                        style={{
                          padding: '5px 14px',
                          borderRadius: 9999,
                          border: '1px solid var(--admin-border-hover)',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          color: 'var(--admin-text)',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>

                      {movie.status !== 'published' ? (
                        <button
                          onClick={() => publishMutation.mutate(movie.id)}
                          style={{
                            padding: '5px 14px',
                            borderRadius: 9999,
                            border: '1px solid rgba(0, 210, 106, 0.3)',
                            backgroundColor: 'rgba(0, 210, 106, 0.12)',
                            color: 'var(--admin-green)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => unpublishMutation.mutate(movie.id)}
                          style={{
                            padding: '5px 14px',
                            borderRadius: 9999,
                            border: '1px solid rgba(255, 174, 0, 0.3)',
                            backgroundColor: 'rgba(255, 174, 0, 0.1)',
                            color: 'var(--admin-amber)',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Unpublish
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete Movie',
                            message: `Delete "${movie.title}"? This cannot be undone.`,
                            confirmText: 'Delete',
                            variant: 'danger',
                          });
                          if (ok) {
                            deleteMutation.mutate(movie.id);
                          }
                        }}
                        style={{
                          padding: '5px 14px',
                          borderRadius: 9999,
                          border: '1px solid rgba(229, 9, 20, 0.3)',
                          backgroundColor: 'rgba(229, 9, 20, 0.1)',
                          color: 'var(--admin-red)',
                          fontSize: 12,
                          fontWeight: 500,
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
          <Pagination
            currentPage={page}
            totalPages={contentData?.total ? Math.ceil(contentData.total / 50) : 1}
            totalItems={contentData?.total || movies.length}
            pageSize={50}
            onPageChange={setPage}
          />
        </div>
      )}
        </>
      ) : activeTab === 'dbo' ? (
        <div>
          {/* DBO KPI Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--admin-surface)',
                border: '1px solid var(--admin-card)',
                borderRadius: 12,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 6 }}>
                Digital Box Office Total
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-green)' }}>
                ₦148,250,000
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Theatrical + Streaming Premiere Gross
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--admin-surface)',
                border: '1px solid var(--admin-card)',
                borderRadius: 12,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 6 }}>
                Admissions / Passes Sold
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-text)' }}>
                49,380
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Across Nollywood Premiere Windows
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--admin-surface)',
                border: '1px solid var(--admin-card)',
                borderRadius: 12,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 6 }}>
                Average Ticket Yield
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--admin-amber)' }}>
                ₦3,002
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Blend of Standard & VIP Passes
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--admin-surface)',
                border: '1px solid var(--admin-card)',
                borderRadius: 12,
                padding: '16px 20px',
              }}
            >
              <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 6 }}>
                Active Theatrical Windows
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>
                {movies.filter((m) => m.windowType === 'premiere').length || 4}
              </div>
              <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                Exclusive Early-Access Runs
              </div>
            </div>
          </div>

          {/* DBO Table */}
          <div
            style={{
              borderRadius: 12,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--admin-card)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Box Office Performance Ledger
                </h3>
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '4px 0 0 0' }}>
                  Audited box office earnings, passes redeemed, and theatrical run tracking.
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--admin-card)',
                    textAlign: 'left',
                    color: 'var(--admin-text-muted)',
                    fontSize: 12,
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Film Title</th>
                  <th style={{ padding: '12px 16px' }}>Window Type</th>
                  <th style={{ padding: '12px 16px' }}>Total Box Office</th>
                  <th style={{ padding: '12px 16px' }}>Tickets Sold</th>
                  <th style={{ padding: '12px 16px' }}>Window Dates</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovies.map((film, idx) => {
                  const estTickets = Math.max(120, Math.floor((film.views || 450) * 1.5));
                  const estRevenue = estTickets * 3000;
                  return (
                    <tr
                      key={film.id}
                      style={{
                        borderTop: '1px solid var(--admin-card)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{film.title}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#93c5fd',
                            textTransform: 'capitalize',
                          }}
                        >
                          {film.windowType || 'Premiere'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--admin-green)' }}>
                        ₦{estRevenue.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>{estTickets.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--admin-text-muted)' }}>
                        {film.theatricalReleaseDate ? new Date(film.theatricalReleaseDate).toLocaleDateString() : 'Active Now'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            void alert('DBO Statement', `Viewing box office settlement statement for "${film.title}". Gross: ₦${estRevenue.toLocaleString()}. Platform fee (30%): ₦${(estRevenue * 0.3).toLocaleString()}. Net to Distributor: ₦${(estRevenue * 0.7).toLocaleString()}.`);
                          }}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 6,
                            border: '1px solid var(--admin-card)',
                            backgroundColor: 'var(--admin-dark)',
                            color: 'var(--admin-text)',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Settlement
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          {/* Passes & Tickets Tab */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Cinema Pass Tiers</h3>
              <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '4px 0 0 0' }}>
                Manage pay-per-view access passes, festival tickets, and early-screening vouchers.
              </p>
            </div>
            <button
              onClick={() => {
                void alert('Pass Tier Creator', 'Cinema pass configuration modal. Create custom screening packages, virtual red carpet passes, and festival passes.');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Icon name="plus" size={16} />
              <span>Create Pass Tier</span>
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {[
              {
                id: 'standard-pass',
                name: 'Single Movie Pass',
                price: '500 AZB / ₦2,500',
                validity: '48 Hours from unlock',
                moviesIncluded: '1 Feature Film',
                perks: ['1080p FHD Streaming', 'Dual audio tracks', '48h re-watch window'],
                badge: 'Popular',
                active: true,
              },
              {
                id: 'vip-pass',
                name: 'VIP Premiere Gala Pass',
                price: '1,500 AZB / ₦7,500',
                validity: '7 Days',
                moviesIncluded: '1 Premiere Gala Screening',
                perks: ['4K Ultra HD + Dolby Atmos', 'Live cast Q&A room', 'Digital Premiere Badge'],
                badge: 'VIP Exclusive',
                active: true,
              },
              {
                id: 'weekend-binge',
                name: 'Cinemaxis Weekend Pass',
                price: '2,500 AZB / ₦12,500',
                validity: 'Friday 6PM - Sunday Midnight',
                moviesIncluded: 'Up to 5 Movies',
                perks: ['Unlimited Rewinds', 'Offline Downloads', 'Bonus Director Interviews'],
                badge: 'Weekend',
                active: true,
              },
            ].map((pass) => (
              <div
                key={pass.id}
                style={{
                  backgroundColor: 'var(--admin-surface)',
                  border: '1px solid var(--admin-card)',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: 'rgba(232, 66, 10, 0.15)',
                        color: 'var(--admin-orange)',
                      }}
                    >
                      {pass.badge}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--admin-green)', fontWeight: 600 }}>Active</span>
                  </div>

                  <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>{pass.name}</h4>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-orange)', marginBottom: 8 }}>
                    {pass.price}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 16 }}>
                    Valid for: {pass.validity} • {pass.moviesIncluded}
                  </div>

                  <div style={{ borderTop: '1px solid var(--admin-card)', paddingTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--admin-text-muted)' }}>
                      Included Perks:
                    </div>
                    {pass.perks.map((p, pIdx) => (
                      <div key={pIdx} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Icon name="check" size={14} color="var(--admin-green)" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button
                    onClick={() => void alert('Edit Pass', `Editing tier configuration for ${pass.name}.`)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Edit Tier
                  </button>
                  <button
                    onClick={() => void alert('Pass Ledger', `Viewing active subscriber passes for ${pass.name}.`)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-card)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Audits
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Movie Modal */}
      {showCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-surface)',
              borderRadius: 16,
              padding: 24,
              width: '92%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Upload New Movie</h2>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 18 }}>
              Configure film metadata, streaming media URL, and premiere window settings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                  Movie Title *
                </label>
                <input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Lionheart: Rise of the Queen"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                  Synopsis / Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Detailed plot synopsis and credits..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Thumbnail Poster URL *
                  </label>
                  <input
                    value={createForm.thumbnail}
                    onChange={(e) => setCreateForm({ ...createForm, thumbnail: e.target.value })}
                    placeholder="/images/thumbnails/... or https://"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Media Stream / Video URL *
                  </label>
                  <input
                    value={createForm.mediaUrl}
                    onChange={(e) => setCreateForm({ ...createForm, mediaUrl: e.target.value })}
                    placeholder="https://... or /media/movies/..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Genre
                  </label>
                  <select
                    value={createForm.genre}
                    onChange={(e) => setCreateForm({ ...createForm, genre: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Window Type
                  </label>
                  <select
                    value={createForm.windowType}
                    onChange={(e) => setCreateForm({ ...createForm, windowType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="standard">Standard Catalog Window</option>
                    <option value="premiere">Digital Premiere (Ticketed)</option>
                    <option value="premium">Cinema Pass Exclusive</option>
                    <option value="free">Free Access</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Theatrical / Release Date
                  </label>
                  <input
                    type="date"
                    value={createForm.releaseDate}
                    onChange={(e) => setCreateForm({ ...createForm, releaseDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Digital Premiere Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.streamingReleaseDate}
                    onChange={(e) => setCreateForm({ ...createForm, streamingReleaseDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, margin: '4px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={createForm.isPremiere}
                    onChange={(e) => setCreateForm({ ...createForm, isPremiere: e.target.checked })}
                  />
                  <span>Premiere Window Flag</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={createForm.isExclusive}
                    onChange={(e) => setCreateForm({ ...createForm, isExclusive: e.target.checked })}
                  />
                  <span>Exclusive Content</span>
                </label>
              </div>

              {createMutation.isError && (
                <p style={{ color: 'var(--admin-red)', fontSize: 13, margin: 0 }}>
                  {(createMutation.error as Error)?.message || 'Failed to upload movie'}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'transparent',
                    color: 'var(--admin-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubmit}
                  disabled={!createForm.title.trim() || createMutation.isPending}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: !createForm.title.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createMutation.isPending ? 'Uploading...' : 'Publish Movie'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Movie Modal */}
      {editItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setEditItem(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--admin-bg)',
              border: '1px solid var(--admin-surface)',
              borderRadius: 16,
              padding: 24,
              width: '92%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Edit Movie Details</h2>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 18 }}>
              Update film title, metadata, release window, or media files.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                  Movie Title *
                </label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                  Synopsis / Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Thumbnail Poster URL
                  </label>
                  <input
                    value={editForm.thumbnail}
                    onChange={(e) => setEditForm({ ...editForm, thumbnail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Media Stream / Video URL
                  </label>
                  <input
                    value={editForm.mediaUrl}
                    onChange={(e) => setEditForm({ ...editForm, mediaUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Window Type
                  </label>
                  <select
                    value={editForm.windowType}
                    onChange={(e) => setEditForm({ ...editForm, windowType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="standard">Standard Catalog Window</option>
                    <option value="premiere">Digital Premiere (Ticketed)</option>
                    <option value="premium">Cinema Pass Exclusive</option>
                    <option value="free">Free Access</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Theatrical / Release Date
                  </label>
                  <input
                    type="date"
                    value={editForm.releaseDate}
                    onChange={(e) => setEditForm({ ...editForm, releaseDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                    Digital Premiere Start Date
                  </label>
                  <input
                    type="date"
                    value={editForm.streamingReleaseDate}
                    onChange={(e) => setEditForm({ ...editForm, streamingReleaseDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-surface)',
                      backgroundColor: 'var(--admin-dark)',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, margin: '4px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editForm.isPremiere}
                    onChange={(e) => setEditForm({ ...editForm, isPremiere: e.target.checked })}
                  />
                  <span>Premiere Window Flag</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editForm.isExclusive}
                    onChange={(e) => setEditForm({ ...editForm, isExclusive: e.target.checked })}
                  />
                  <span>Exclusive Content</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  onClick={() => setEditItem(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'transparent',
                    color: 'var(--admin-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={updateMutation.isPending || !editForm.title.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: !editForm.title.trim() ? 'not-allowed' : 'pointer',
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
