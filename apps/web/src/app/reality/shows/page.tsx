'use client';
import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { api } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

export default function RealityShowsPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('reality-shows');
  }, []);

  const universesQuery = useUniversesQuery();

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
    <PageShell activeNav="Reality">
      <PageHero
        eyebrow="Reality Universe"
        title="Reality Shows"
        subtitle={showsQuery.isLoading ? 'Loading…' : `${shows.length} shows`}
      />

      {showsQuery.isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height="340px" borderRadius="16px" />
          ))}
        </div>
      ) : showsQuery.error ? (
        <ErrorState title="Failed to load reality shows" />
      ) : shows.length === 0 ? (
        <div className="az-glass px-6 py-16 text-center">
          <p className="az-lead text-az-ink">No shows available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {shows.map((show) => (
            <Link
              key={show.id}
              href={`/reality/shows/${show.id}`}
              className="az-glass block overflow-hidden"
            >
              <div className="relative aspect-[9/16] bg-az-surface-raised">
                {show.thumbnail && (
                  <OptimizedImage src={show.thumbnail} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <h3 className="az-body-strong text-az-ink">{show.title}</h3>
                {show.description && (
                  <p className="az-caption text-az-ink-muted mt-1 truncate">{show.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
