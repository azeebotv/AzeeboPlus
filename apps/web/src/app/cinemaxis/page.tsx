'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function CinemaxisPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('cinemaxis');
  }, []);

  const universesQuery = useUniversesQuery();

  const cinemaxisUniverse = universesQuery.data?.find(
    (u) => u.name?.toLowerCase() === 'cinema' || u.name?.toLowerCase() === 'cinemaxis'
  );

  const contentQuery = useQuery({
    queryKey: ['cinemaxis-content', cinemaxisUniverse?.id],
    queryFn: async () => {
      if (!cinemaxisUniverse?.id) throw new Error('Cinemaxis universe not found');
      const res = await api.content.getContentByUniverse(cinemaxisUniverse.id, 1, 20);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      throw new Error(res.message || 'Failed to load content');
    },
    staleTime: 60000,
    enabled: !!cinemaxisUniverse?.id,
  });

  const items: ContentItem[] = contentQuery.data ?? [];
  const isLoading = contentQuery.isLoading;
  const error = contentQuery.error?.message || null;

  return (
    <PageShell
      maxWidth="7xl"
      activeNav="Cinemaxis"
      glowColor="color-mix(in srgb, var(--color-az-category-violet) 12%, transparent)"
    >
      <PageHero
        eyebrow="Cinemaxis Universe"
        title="Cinemaxis"
        description="Premium African cinema. Blockbuster movies, award-winning films, and exclusive releases."
        glowColor="color-mix(in srgb, var(--color-az-category-violet) 14%, transparent)"
        actions={
          <>
            <Link href="/movies">
              <motion.button
                type="button"
                aria-label="Browse movies"
                className="az-body-strong rounded-az-pill border border-[color-mix(in_srgb,var(--color-az-category-violet)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-az-category-violet)_20%,transparent)] px-6 py-3 text-az-ink transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse Movies
              </motion.button>
            </Link>
            <Link href="/movies/premieres">
              <motion.button
                type="button"
                aria-label="View premieres"
                className="az-body-strong rounded-az-pill bg-az-category-violet-light px-6 py-3 text-[var(--color-az-surface-root)] transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Premieres
              </motion.button>
            </Link>
          </>
        }
      />

      <section className="py-4">
        <ScrollReveal>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="az-section-title text-az-ink">Featured Films</h2>
              <p className="az-body mt-1 text-az-ink-muted">Curated from African cinema</p>
            </div>
            <Link
              href="/browse"
              className="az-body-strong text-az-category-violet-light transition-colors hover:text-az-category-violet"
            >
              View All
            </Link>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="192px" borderRadius="0px" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load content"
            description={error}
            buttonText="Retry"
            onButtonPress={() => contentQuery.refetch()}
          />
        ) : items.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link key={item.id} href={`/watch/${item.id}`}>
                <GlowCard universe="movies" className="overflow-hidden">
                  <div className="relative">
                    <OptimizedImage
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 az-scrim" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="az-body-strong text-az-ink">{item.title}</h3>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="az-caption line-clamp-2 text-az-ink-muted">{item.description}</p>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="text-center py-12">
            <p className="az-lead text-az-ink-muted">No content available yet</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

export default CinemaxisPageContent;
