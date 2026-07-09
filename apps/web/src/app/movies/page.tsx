'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem, Category } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';

const MOVIES_UNIVERSE_ID = 'u0000001-0000-0000-0000-000000000004';

export default function MoviesPage(): React.JSX.Element {
  const moviesQuery = useQuery({
    queryKey: ['movies', MOVIES_UNIVERSE_ID],
    queryFn: async () => {
      const res = await api.content.getContentByUniverse(MOVIES_UNIVERSE_ID, 1, 20);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      throw new Error(res.message || 'Failed to load movies');
    },
    staleTime: 60000,
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
  const isLoading = moviesQuery.isLoading;
  const error = moviesQuery.error?.message || null;

  return (
    <div className="min-h-screen az-nollywood-bg">
      <AppHeader active="Movies" />

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="400px" className="sm:h-[500px] rounded-none" />
        ) : error ? (
          <div className="h-[400px] sm:h-[500px] flex items-center justify-center">
            <ErrorState
              title="Failed to load movies"
              description={error}
              buttonText="Retry"
              onButtonPress={() => moviesQuery.refetch()}
            />
          </div>
        ) : movies.length > 0 ? (
          <div className="relative h-[400px] sm:h-[500px]">
            <OptimizedImage
              src={movies[0].thumbnail}
              alt={movies[0].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/50 to-transparent" />
            <AmbientGlow color="rgba(245,158,11,0.25)" size={500} className="bottom-0 right-0" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 max-w-7xl mx-auto">
              <motion.div
                className="flex items-center gap-2 mb-3 sm:mb-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#E8420A', color: '#fff' }}
                >
                  Premium
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                >
                  {movies[0].contentType || 'Movie'}
                </span>
              </motion.div>
              <motion.h2
                className="text-3xl sm:text-4xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                {movies[0].title}
              </motion.h2>
              <motion.p
                className="text-white/60 text-base sm:text-lg mb-5 sm:mb-6 max-w-2xl"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                {movies[0].description}
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                <Link href={`/watch/${movies[0].id}`}>
                  <motion.button
                    type="button"
                    className="az-btn-primary"
                    style={{ width: 'auto', paddingInline: '2rem' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Play Now
                  </motion.button>
                </Link>
                <motion.button
                  type="button"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Add to Library
                </motion.button>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="h-[400px] sm:h-[500px] flex items-center justify-center">
            <p className="text-base sm:text-lg text-white/60">No movies available</p>
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div
            className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-hide"
            role="listbox"
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
                role="option"
                className="whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-white/70 hover:text-white transition-colors flex-shrink-0"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Movies</h2>
              <p className="text-sm sm:text-base mt-1 text-white/50">Handpicked for you</p>
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
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
                    <span
                      className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: '#E8420A', color: '#fff' }}
                    >
                      Premium
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                        style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                      >
                        {movie.contentType || 'Movie'}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white">{movie.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{movie.description}</p>
                    <motion.button
                      type="button"
                      className="az-btn-primary w-full"
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
            <p className="text-base sm:text-lg text-white/50">No movies available yet</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}
