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

export default function VerticalTitlesPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('vertical-titles');
  }, []);

  const universesQuery = useUniversesQuery();

  const verticalUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'vertical');

  const titlesQuery = useQuery({
    queryKey: ['vertical-titles', verticalUniverse?.id],
    queryFn: async () => {
      if (!verticalUniverse?.id) throw new Error('Vertical universe not found');
      const res = await api.content.getContentByUniverse(verticalUniverse.id, 1, 50);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      throw new Error(res.message || 'Failed to load vertical titles');
    },
    enabled: !!verticalUniverse?.id,
    staleTime: 60000,
  });

  const titles = titlesQuery.data || [];

  return (
    <PageShell activeNav="Vertical">
      <PageHero
        eyebrow="Vertical Universe"
        title="Vertical Titles"
        subtitle="Short-form vertical content from the Azeebo+ universe"
      />

      {titlesQuery.isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height="340px" borderRadius="16px" />
          ))}
        </div>
      ) : titlesQuery.error ? (
        <ErrorState title="Failed to load vertical titles" />
      ) : titles.length === 0 ? (
        <div className="az-glass px-6 py-16 text-center">
          <p className="az-lead text-az-ink">No vertical titles available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {titles.map((title) => (
            <Link
              key={title.id}
              href={`/vertical/titles/${title.id}`}
              className="az-glass block overflow-hidden"
            >
              <div className="relative aspect-[9/16] bg-az-surface-raised">
                {title.thumbnail && (
                  <OptimizedImage src={title.thumbnail} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <h3 className="az-body-strong text-az-ink">{title.title}</h3>
                {title.description && (
                  <p className="az-caption text-az-ink-muted mt-1 truncate">{title.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
