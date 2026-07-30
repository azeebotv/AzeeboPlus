'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

export default function ComedyPlayerPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('comedy-player');
  }, []);

  const universesQuery = useQuery({
    queryKey: ['universes'],
    queryFn: async () => {
      const res = await api.universe.getUniverses();
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load universes');
      return res.data;
    },
    staleTime: 300000,
  });

  const comedyUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'comedy');

  const clipsQuery = useQuery({
    queryKey: ['comedy-clips', comedyUniverse?.id],
    queryFn: async () => {
      if (!comedyUniverse?.id) throw new Error('Comedy universe not found');
      const res = await api.content.getContentByUniverse(comedyUniverse.id, 1, 30);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      throw new Error(res.message || 'Failed to load comedy clips');
    },
    enabled: !!comedyUniverse?.id,
    staleTime: 60000,
  });

  const clips = clipsQuery.data || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}>
      <AppHeader active="Comedy" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Comedy Player</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Browse and play comedy clips, specials, and series
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <Link
            href="/comedy/series"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Series
          </Link>
          <Link
            href="/comedy/specials"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Specials
          </Link>
          <Link
            href="/comedy/comedians"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Comedians
          </Link>
        </div>

        {clipsQuery.isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height="280px" borderRadius="16px" />
            ))}
          </div>
        ) : clipsQuery.error ? (
          <ErrorState title="Failed to load comedy clips" />
        ) : clips.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            No comedy clips available yet.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {clips.map((clip) => (
              <Link
                key={clip.id}
                href={`/comedy/player/${clip.id}`}
                style={{
                  textDecoration: 'none',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div
                  style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: '#140808' }}
                >
                  {clip.thumbnail && (
                    <OptimizedImage src={clip.thumbnail} alt="" fill className="object-cover" />
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>
                    {clip.title}
                  </h3>
                  {clip.description && (
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                        margin: '4px 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {clip.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
