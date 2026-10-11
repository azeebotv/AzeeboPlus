'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { EmptyState } from '@/components/ui/EmptyState';
import { extractGenres } from '@/lib/music';
import analytics from '@/lib/analytics';

const GENRE_COLORS: Record<string, string> = {
  afrobeats: 'var(--color-az-flame)',
  hiphop: 'var(--brand-purple)',
  pop: 'var(--brand-pink)',
  rnb: 'var(--brand-cyan)',
  gospel: 'var(--brand-amber)',
  highlife: 'var(--brand-green)',
  Fuji: 'var(--color-az-scarlet)',
  amapiano: 'var(--brand-indigo)',
  reggae: 'var(--brand-green)',
  jazz: 'var(--brand-purple-light)',
  electronic: 'var(--brand-teal)',
  rock: 'var(--color-az-flame)',
};

export default function MusicGenresPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('music-genres');
  }, []);

  const genresQuery = useQuery({
    queryKey: ['music', 'genres'],
    queryFn: async () => {
      const res = await api.request<unknown>('/api/v1/lifestyle/music/genres');
      if (res.success && res.data) return extractGenres(res.data);
      return [];
    },
    staleTime: 300000,
  });

  const genres = genresQuery.data ?? [];
  const isLoading = genresQuery.isLoading;
  const error = genresQuery.error?.message;

  return (
    <PageShell activeNav="Music">
      <PageHero
        eyebrow="Music"
        title="Browse Genres"
        subtitle="Discover music by your favorite genre"
        accentColor="var(--color-az-universe-lifestyle)"
      />

      <div className="py-10 sm:py-12">
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {genres.map((genre, index) => {
                const color =
                  GENRE_COLORS[genre.name?.toLowerCase()] || genre.color || 'var(--color-az-flame)';
                return (
                  <motion.div
                    key={genre.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/music/genres/${genre.slug || genre.id}`}>
                      <div
                        className="relative flex h-40 cursor-pointer flex-col justify-end overflow-hidden rounded-az-card p-6 transition-transform hover:scale-[1.03] sm:h-48 sm:p-8"
                        style={{
                          background: `linear-gradient(135deg, ${color}40 0%, ${color}10 100%)`,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        <div className="absolute left-4 top-4 text-4xl opacity-80 sm:text-5xl">
                          {genre.icon || 'Music'}
                        </div>
                        <div>
                          <h3 className="az-title mb-1 text-az-ink">{genre.name}</h3>
                          {genre.trackCount != null && (
                            <p className="az-caption text-az-ink-muted">
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
    </PageShell>
  );
}
