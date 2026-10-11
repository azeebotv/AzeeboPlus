'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import PageShell from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

function VerticalPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('vertical');
  }, []);

  const universesQuery = useUniversesQuery();

  const verticalUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'vertical');

  const {
    data: series = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['vertical-content', verticalUniverse?.id],
    queryFn: async () => {
      if (!verticalUniverse?.id) throw new Error('Vertical universe not found');
      const result = await api.content.getContentByUniverse(verticalUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load content.');
    },
    staleTime: 60000,
    enabled: !!verticalUniverse?.id,
  });

  return (
    <PageShell
      activeNav="Vertical"
      glowColor="color-mix(in srgb, var(--color-az-flame) 18%, transparent)"
    >
      {/* Hero Section */}
      <section>
        {isLoading ? (
          <Skeleton height="400px" borderRadius="16px" className="sm:h-[500px]" />
        ) : error ? (
          <div className="flex h-[400px] items-center justify-center sm:h-[500px]">
            <ErrorState
              title="Failed to load content"
              description={error.message}
              onButtonPress={() => refetch()}
            />
          </div>
        ) : series.length > 0 ? (
          <div className="relative h-[400px] overflow-hidden rounded-az-panel border border-az-glass-border sm:h-[500px]">
            <OptimizedImage
              src={series[0].thumbnail}
              alt={series[0].title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 az-scrim--hero" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="az-overline rounded-az-pill bg-az-flame px-3 py-1 text-az-ink">
                  Premium
                </span>
                <span className="az-overline rounded-az-pill bg-az-scarlet/20 px-3 py-1 text-az-flame">
                  {series[0].contentType || 'Vertical'}
                </span>
              </div>
              <h2 className="az-heading mb-2 text-az-ink sm:az-display">{series[0].title}</h2>
              <p className="az-lead mb-6 max-w-2xl text-az-ink-muted">{series[0].description}</p>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link href={`/watch/${series[0].id}`}>
                  <button type="button" className="az-btn-primary az-btn-primary--inline">
                    Start Watching
                  </button>
                </Link>
                <Link
                  href={`/vertical/lore`}
                  className="az-chip az-body-strong inline-block px-6 py-3 text-az-ink transition-all"
                >
                  Character Lore
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[400px] items-center justify-center sm:h-[500px]">
            <p className="az-lead text-az-ink-muted">No content available</p>
          </div>
        )}
      </section>

      {/* Series Grid */}
      <section className="py-10 sm:py-12">
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <div>
            <h2 className="az-section-title text-az-ink">Vertical Series</h2>
            <p className="az-body mt-1 text-az-ink-muted">Premium African storytelling</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`vertical-skeleton-${i}`} className="az-glass overflow-hidden">
                <Skeleton height="192px" borderRadius="0px" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : series.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {series.map((show) => (
              <Link key={show.id} href={`/watch/${show.id}`}>
                <article className="az-glass cursor-pointer overflow-hidden hover:scale-[1.02]">
                  <div className="relative">
                    <OptimizedImage
                      src={show.thumbnail}
                      alt={show.title}
                      width={400}
                      height={192}
                      className="h-48 w-full object-cover"
                    />
                    <span className="az-overline absolute top-2 right-2 rounded-az-pill bg-az-flame px-2.5 py-0.5 text-az-ink">
                      Premium
                    </span>
                    <div className="absolute inset-0 az-scrim" aria-hidden="true" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="az-overline mb-2 inline-block rounded-az-pill bg-az-scarlet/20 px-2.5 py-0.5 text-az-flame">
                        {show.contentType || 'Vertical'}
                      </span>
                      <h3 className="az-title text-az-ink">{show.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="az-body mb-3 line-clamp-2 text-az-ink-muted">
                      {show.description}
                    </p>
                    <button type="button" className="az-btn-primary">
                      Watch Now
                    </button>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink-muted">No series available yet</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazyVerticalPage = lazy(() => Promise.resolve({ default: VerticalPageContent }));

export default function VerticalPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyVerticalPage />
    </Suspense>
  );
}
