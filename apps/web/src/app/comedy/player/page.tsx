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

export default function ComedyPlayerPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('comedy-player');
  }, []);

  const universesQuery = useUniversesQuery();

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
    <PageShell activeNav="Comedy">
      <PageHero
        eyebrow="Comedy Universe"
        title="Comedy Player"
        subtitle="Browse and play comedy clips, specials, and series"
        actions={
          <>
            <Link href="/comedy/series" className="az-chip px-4 py-2 az-body-strong text-az-ink">
              Series
            </Link>
            <Link href="/comedy/specials" className="az-chip px-4 py-2 az-body-strong text-az-ink">
              Specials
            </Link>
            <Link href="/comedy/comedians" className="az-chip px-4 py-2 az-body-strong text-az-ink">
              Comedians
            </Link>
          </>
        }
      />

      {clipsQuery.isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height="280px" borderRadius="16px" />
          ))}
        </div>
      ) : clipsQuery.error ? (
        <ErrorState title="Failed to load comedy clips" />
      ) : clips.length === 0 ? (
        <div className="az-glass px-6 py-16 text-center">
          <p className="az-lead text-az-ink">No comedy clips available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {clips.map((clip) => (
            <Link
              key={clip.id}
              href={`/comedy/player/${clip.id}`}
              className="az-glass block overflow-hidden"
            >
              <div className="relative aspect-video bg-az-surface-raised">
                {clip.thumbnail && (
                  <OptimizedImage src={clip.thumbnail} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <h3 className="az-body-strong text-az-ink">{clip.title}</h3>
                {clip.description && (
                  <p className="az-caption text-az-ink-muted mt-1 truncate">{clip.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
