'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Cinemaxis" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">FilmBrowse Films</h1>
          <p className="text-white/50 mb-8">
            Explore our collection of movies available on Cinemaxis
          </p>
        </motion.div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['', 'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Nollywood'].map(
            (g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${genre === g ? 'text-white' : 'text-white/50 hover:text-white/70'}`}
                style={{
                  backgroundColor: genre === g ? 'var(--brand-orange)' : 'rgba(255,255,255,0.05)',
                }}
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
            <p className="text-xl text-white/60">No films available{genre ? ` in ${genre}` : ''}</p>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-xs font-medium text-white/60">
                      {film.year} · {film.duration}
                    </p>
                  </div>
                  {film.isExclusive && (
                    <div className="absolute top-2 right-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: 'var(--brand-orange)', color: 'var(--brand-white)' }}
                      >
                        EXCLUSIVE
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-white truncate">{film.title}</h3>
                  <p className="text-xs text-white/40 mt-1">
                    {film.genre} · {film.rating}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>
      <AppFooter />
    </div>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: FilmsContent }));
export default function FilmsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
