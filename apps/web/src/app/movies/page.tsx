'use client';
import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem, Category } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function MoviesPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('movies');
  }, []);

  const universesQuery = useUniversesQuery();

  const moviesUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'movies');

  const moviesQuery = useQuery({
    queryKey: ['movies', moviesUniverse?.id],
    queryFn: async () => {
      if (!moviesUniverse?.id) return [];
      const res = await api.content.getContentByUniverse(moviesUniverse.id, 1, 20);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      return [];
    },
    staleTime: 60000,
    enabled: !!moviesUniverse?.id,
  });

  const categoriesQuery = useQuery({
    queryKey: ['movie-categories'],
    queryFn: async () => {
      const res = await api.content.getCategories();
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : [];
      }
      return [];
    },
    staleTime: 300000,
  });

  const movies: ContentItem[] = moviesQuery.data ?? [];
  const categories: Category[] = categoriesQuery.data ?? [];
  const isLoading = universesQuery.isLoading || (!!moviesUniverse?.id && moviesQuery.isLoading);
  const error = moviesQuery.error?.message || null;

  return (
    <PageShell maxWidth="7xl" activeNav="Movies">
      {/* Hero */}
      {error ? (
        <div className="flex items-center justify-center py-10 sm:py-12">
          <ErrorState
            title="Failed to load movies"
            description={error}
            buttonText="Retry"
            onButtonPress={() => moviesQuery.refetch()}
          />
        </div>
      ) : isLoading ? (
        <Skeleton height="160px" borderRadius="16px" className="mb-8" />
      ) : movies.length > 0 ? (
        <PageHero
          eyebrow={movies[0].contentType || 'Movie'}
          badge="Premium"
          title={movies[0].title}
          description={movies[0].description}
          actions={
            <>
              <Link href={`/watch/${movies[0].id}`}>
                <motion.button
                  type="button"
                  className="az-btn-primary az-btn-primary--inline"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play Now
                </motion.button>
              </Link>
              <Link href={`/watch/${movies[0].id}`}>
                <motion.button
                  type="button"
                  className="az-chip px-6 py-3 text-sm font-semibold text-az-ink transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add to Library
                </motion.button>
              </Link>
            </>
          }
        />
      ) : (
        <div className="flex items-center justify-center py-10 sm:py-12">
          <p className="az-lead text-az-ink-muted">No movies available</p>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-6 sm:py-8">
          <motion.div
            className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide"
            role="group"
            aria-label="Movie categories"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {categories.map((category) => (
              <motion.button
                key={category.id}
                type="button"
                className="az-chip whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-az-ink/70 hover:text-az-ink transition-colors flex-shrink-0"
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category.name}
                {category.contentCount != null ? ` (${category.contentCount})` : ''}
              </motion.button>
            ))}
          </motion.div>
        </section>
      )}

      {/* Movies Grid */}
      <section className="py-6 sm:py-8">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="az-section-title text-az-ink">Featured Movies</h2>
              <p className="az-caption text-az-ink-muted mt-1">Handpicked for you</p>
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`movie-skeleton-${i}`} className="az-glass overflow-hidden">
                <Skeleton height="240px" borderRadius="0" className="sm:h-[240px]" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" borderRadius="0.25rem" />
                  <Skeleton height="16px" width="50%" borderRadius="0.25rem" />
                </div>
              </div>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {movies.map((movie) => (
              <Link key={movie.id} href={`/watch/${movie.id}`}>
                <GlowCard universe="movies" className="overflow-hidden">
                  <div className="relative">
                    <OptimizedImage
                      src={movie.thumbnail}
                      alt={movie.title}
                      className="w-full h-44 sm:h-48 object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-az-pill text-xs font-semibold bg-az-flame text-az-surface-root">
                      Premium
                    </span>
                    <div className="absolute inset-0 az-scrim" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-az-pill text-xs font-medium mb-2 bg-az-scarlet/20 text-az-flame">
                        {movie.contentType || 'Movie'}
                      </span>
                      <h3 className="az-title text-az-ink">{movie.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="az-caption text-az-ink-muted mb-3 line-clamp-2">
                      {movie.description}
                    </p>
                    <motion.button
                      type="button"
                      className="az-btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Watch Now
                    </motion.button>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="text-center py-10 sm:py-12">
            <p className="az-lead text-az-ink-muted">No movies available yet</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

export default MoviesPageContent;
