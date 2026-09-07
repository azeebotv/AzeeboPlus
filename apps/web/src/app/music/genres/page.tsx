'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { EmptyState } from '@/components/ui/EmptyState';
import analytics from '@/lib/analytics';

interface Genre {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  trackCount?: number;
  color?: string;
}

const GENRE_COLORS: Record<string, string> = {
  afrobeats: 'var(--brand-orange)',
  hiphop: 'var(--brand-purple)',
  pop: 'var(--brand-pink)',
  rnb: 'var(--brand-cyan, #06b6d4)',
  gospel: 'var(--brand-amber)',
  highlife: 'var(--brand-green)',
  Fuji: 'var(--brand-red)',
  amapiano: 'var(--brand-indigo, #6366f1)',
  reggae: 'var(--brand-green)',
  jazz: 'var(--brand-purple-light)',
  electronic: 'var(--brand-teal, #14b8a6)',
  rock: 'var(--brand-orange)',
};

export default function MusicGenresPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('music-genres');
  }, []);

  const genresQuery = useQuery({
    queryKey: ['music', 'genres'],
    queryFn: async () => {
      const res = await api.request<Genre[]>('/api/v1/lifestyle/music/genres');
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: 300000,
  });

  const genres = genresQuery.data ?? [];
  const isLoading = genresQuery.isLoading;
  const error = genresQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Music" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #4C0A5E 0%, #1A0A3B 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Music2Browse Genres
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Discover music by your favorite genre
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height="160px" borderRadius="16px" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <ErrorState
            title="Failed to load genres"
            description={error}
            onButtonPress={() => genresQuery.refetch()}
          />
        )}

        {!isLoading && !error && (
          <ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {genres.map((genre, index) => {
                const color =
                  GENRE_COLORS[genre.name?.toLowerCase()] || genre.color || 'var(--brand-orange)';
                return (
                  <motion.div
                    key={genre.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/music/genres/${genre.slug || genre.id}`}>
                      <div
                        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 cursor-pointer hover:scale-[1.03] transition-transform h-40 sm:h-48 flex flex-col justify-end"
                        style={{
                          background: `linear-gradient(135deg, ${color}40 0%, ${color}10 100%)`,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        <div className="absolute top-4 left-4 text-4xl sm:text-5xl opacity-80">
                          {genre.icon || 'Music'}
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                            {genre.name}
                          </h3>
                          {genre.trackCount != null && (
                            <p className="text-sm text-white/50">
                              {genre.trackCount.toLocaleString()} tracks
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {genres.length === 0 && !isLoading && (
              <EmptyState
                icon="music"
                title="No genres available"
                description="Check back later for new music genres"
                dark
              />
            )}
          </ScrollReveal>
        )}
      </div>

      <AppFooter />
    </div>
  );
}
