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

export default function RealityShowsPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('reality-shows');
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

  const realityUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'reality');

  const showsQuery = useQuery({
    queryKey: ['reality-shows', realityUniverse?.id],
    queryFn: async () => {
      if (!realityUniverse?.id) throw new Error('Reality universe not found');
      const res = await api.content.getContentByUniverse(realityUniverse.id, 1, 50);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      throw new Error(res.message || 'Failed to load reality shows');
    },
    enabled: !!realityUniverse?.id,
    staleTime: 60000,
  });

  const shows = showsQuery.data || [];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Reality" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Reality Shows</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          {showsQuery.isLoading ? 'Loading...' : `${shows.length} shows`}
        </p>

        {showsQuery.isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height="340px" borderRadius="16px" />
            ))}
          </div>
        ) : showsQuery.error ? (
          <ErrorState title="Failed to load reality shows" />
        ) : shows.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            No shows available yet.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {shows.map((show) => (
              <Link
                key={show.id}
                href={`/reality/shows/${show.id}`}
                style={{
                  textDecoration: 'none',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '9/16',
                    backgroundColor: 'var(--bg-tertiary)',
                  }}
                >
                  {show.thumbnail && (
                    <OptimizedImage src={show.thumbnail} alt="" fill className="object-cover" />
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <h3
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {show.title}
                  </h3>
                  {show.description && (
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
                      {show.description}
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
