'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

interface Film {
  id: string;
  title: string;
  genre: string;
  rating: string;
  thumbnail: string;
  year: number;
  duration: string;
  isExclusive: boolean;
}

function FilmsContent() {
  const [genre, setGenre] = useState('');
  useEffect(() => {
    analytics.pageView('cinemaxis-films');
  }, []);

  const query = useQuery({
    queryKey: ['cinemaxis', 'films', genre],
    queryFn: async () => {
      const params = genre ? `?genre=${genre}` : '';
      const res = await api.request<Film[]>(`/api/v1/movies/films${params}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load films');
    },
  });

  const films: Film[] = query.data ?? [];

  return (
    <PageShell maxWidth="7xl" activeNav="Cinemaxis">
      <PageHero
        eyebrow="Cinemaxis"
        title="Browse Films"
        description="Explore our collection of movies available on Cinemaxis"
      />

      <div className="-mt-4 pb-12">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['', 'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Nollywood'].map(
            (g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`az-body-strong whitespace-nowrap rounded-az-pill px-4 py-2 transition-all ${
                  genre === g
                    ? 'bg-az-flame text-az-surface-root shadow-az-glow'
                    : 'bg-az-ink/5 text-az-ink/50 hover:text-az-ink/70'
                }`}
              >
                {g || 'All'}
              </button>
            )
          )}
        </div>

        {query.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="p-3">
                  <Skeleton height="16px" width="70%" />
                </div>
              </div>
            ))}
          </div>
        ) : query.error ? (
          <ErrorState
            title="Failed to load"
            description={query.error.message}
            onButtonPress={() => query.refetch()}
          />
        ) : films.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4"></p>
            <p className="az-subtitle text-az-ink-muted">
              No films available{genre ? ` in ${genre}` : ''}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {films.map((film, index) => (
              <motion.a
                key={film.id}
                href={`/cinemaxis/film/${film.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="az-glass overflow-hidden group cursor-pointer"
              >
                <div className="relative aspect-[2/3]">
                  <OptimizedImage
                    src={film.thumbnail}
                    alt={film.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 az-scrim" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="az-caption font-medium text-az-ink/60">
                      {film.year} · {film.duration}
                    </p>
                  </div>
                  {film.isExclusive && (
                    <div className="absolute top-2 right-2">
                      <span className="az-micro-label rounded-az-control bg-az-flame px-2 py-0.5 font-bold text-az-surface-root">
                        EXCLUSIVE
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="az-body-strong truncate text-az-ink">{film.title}</h3>
                  <p className="az-caption mt-1 text-az-ink-dim">
                    {film.genre} · {film.rating}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: FilmsContent }));
export default function FilmsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
