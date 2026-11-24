'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';
import { Play } from 'lucide-react';
import analytics from '@/lib/analytics';

function SpecialsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('comedy-specials');
  }, []);

  const universesQuery = useUniversesQuery();

  const comedyUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'comedy');

  const {
    data: specials = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['comedy-specials', comedyUniverse?.id],
    queryFn: async () => {
      if (!comedyUniverse?.id) throw new Error('Comedy universe not found');
      const result = await api.content.getContentByUniverse(comedyUniverse.id, 1, 30);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load comedy specials.');
    },
    staleTime: 60000,
    enabled: !!comedyUniverse?.id,
  });

  const featured = specials[0] ?? null;

  return (
    <PageShell activeNav="Comedy">
      {/* Featured Special */}
      {isLoading ? (
        <section className="py-4">
          <Skeleton height="400px" borderRadius="16px" />
        </section>
      ) : featured ? (
        <section className="py-4">
          <div className="relative h-[400px] overflow-hidden rounded-az-feature sm:h-[500px]">
            <OptimizedImage
              src={featured.thumbnail}
              alt={featured.title}
              fill
              className="object-cover"
              priority
            />
            <div className="az-scrim--hero absolute inset-0" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="az-micro-label mb-4 inline-block rounded-az-pill bg-az-flame px-3 py-1 text-az-surface-root">
                  Featured Special
                </span>
                <h1 className="az-headline mb-3 text-az-ink text-4xl sm:text-5xl">
                  {featured.title}
                </h1>
                <p className="az-lead mb-6 max-w-2xl text-az-ink-muted">{featured.description}</p>
                <Link href={`/watch/${featured.id}`}>
                  <motion.button
                    type="button"
                    className="az-btn-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Watch Now
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Specials Grid */}
      <section className="py-10 sm:py-12">
        <ScrollReveal>
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <div>
              <h2 className="az-section-title text-az-ink">Comedy Specials</h2>
              <p className="az-body mt-1 text-az-ink-muted">
                Full-length stand-up specials from top comedians
              </p>
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="240px" borderRadius="0" />
                <div className="space-y-3 p-4">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load specials"
            description={error.message}
            onButtonPress={() => refetch()}
          />
        ) : specials.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {specials.slice(1).map((special) => (
              <Link key={special.id} href={`/watch/${special.id}`}>
                <GlowCard universe="comedy" className="overflow-hidden">
                  <div className="relative">
                    <OptimizedImage
                      src={special.thumbnail}
                      alt={special.title}
                      width={400}
                      height={192}
                      className="h-48 w-full object-cover"
                    />
                    <div className="az-scrim absolute inset-0" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100">
                      <div className="flex size-14 items-center justify-center rounded-full bg-az-ink/90">
                        <Play
                          className="size-5 fill-az-surface-root text-az-surface-root"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="az-micro-label mb-2 inline-block rounded-az-pill bg-az-scarlet/20 px-2.5 py-0.5 text-az-flame">
                        {special.contentType || 'Special'}
                      </span>
                      <h3 className="az-body-strong text-az-ink">{special.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="az-caption mb-3 line-clamp-2 text-az-ink-muted">
                      {special.description}
                    </p>
                    <div className="az-micro-label flex items-center justify-between text-az-ink-muted">
                      <span>
                        {special.duration ? `${Math.floor(special.duration / 60)} min` : ''}
                      </span>
                      <span>{special.creator?.name}</span>
                    </div>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink-muted">No comedy specials available yet</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

const LazySpecialsPage = lazy(() => Promise.resolve({ default: SpecialsPageContent }));

export default function SpecialsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazySpecialsPage />
    </Suspense>
  );
}
