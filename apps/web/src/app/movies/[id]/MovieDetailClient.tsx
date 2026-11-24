'use client';
import { useEffect, useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import analytics from '@/lib/analytics';

interface MovieDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  banner?: string;
  genre: string;
  year: number;
  duration: string;
  rating: number;
  totalRatings: number;
  cast: string[];
  director: string;
  synopsis: string;
  rentalPrice: number;
  purchasePrice: number;
  isPremium: boolean;
  isAvailableForRent: boolean;
  relatedMovies: { id: string; title: string; thumbnail: string }[];
}

export default function MovieDetailClient({ id }: { id: string }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    analytics.pageView('movies-detail', { id });
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const movieQuery = useQuery({
    queryKey: ['movie-detail', id],
    queryFn: async () => {
      const res = await apiFetch<MovieDetail>(`/api/v1/movies/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load movie details');
    },
    staleTime: 60000,
    enabled: !!id,
  });

  const rentMutation = useMutation({
    mutationFn: async () => {
      // Backend rents by path param and charges the fixed fee server-side.
      const res = await apiFetch(`/api/v1/movies/${id}/rent`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (res.success) return res.data;
      throw new Error(res.message || 'Failed to process');
    },
    onSuccess: () => {
      setToast({ message: 'Success! Enjoy your movie.', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['movie-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  const movie = movieQuery.data ?? null;
  const isLoading = movieQuery.isLoading;
  const error = movieQuery.error?.message;

  return (
    <PageShell maxWidth="full" activeNav="Movies">
      <div className="max-w-7xl mx-auto pt-4">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/home' },
            { label: 'Movies', href: '/movies' },
            { label: movie?.title || 'Movie Details' },
          ]}
        />
      </div>

      {isLoading ? (
        <>
          <Skeleton height="500px" borderRadius="0" />
          <div className="max-w-7xl mx-auto py-10">
            <Skeleton height="32px" width="250px" className="mb-4" />
            <Skeleton height="20px" width="350px" className="mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton height="16px" width="100%" />
                <Skeleton height="16px" width="90%" />
                <Skeleton height="16px" width="80%" />
              </div>
              <div>
                <Skeleton height="250px" borderRadius="0.5rem" />
              </div>
            </div>
          </div>
        </>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <ErrorState
            title="Failed to load movie"
            description={error}
            onButtonPress={() => movieQuery.refetch()}
          />
        </div>
      ) : movie ? (
        <>
          {/* Banner */}
          <section className="relative">
            <div className="relative h-[400px] sm:h-[500px]">
              <OptimizedImage
                src={movie.banner || movie.thumbnail}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 az-scrim--hero" />
              <AmbientGlow
                color="color-mix(in srgb, var(--color-az-scarlet) 25%, transparent)"
                size={500}
                className="bottom-0 right-0"
              />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {movie.isPremium && (
                      <span className="px-3 py-1 rounded-az-pill text-xs font-semibold bg-az-flame text-az-surface-root">
                        Premium
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-az-pill text-xs font-medium bg-az-scarlet/20 text-az-flame">
                      {movie.genre}
                    </span>
                  </div>
                  <h1 className="az-headline text-3xl sm:text-4xl text-az-ink mb-2">
                    {movie.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-az-ink-muted mb-4">
                    <span>
                      {movie.rating.toFixed(1)} ({movie.totalRatings})
                    </span>
                    <span>·</span>
                    <span>{movie.year}</span>
                    <span>·</span>
                    <span>{movie.duration}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Link href={`/watch/${movie.id}`}>
                      <motion.button
                        type="button"
                        className="az-btn-primary az-btn-primary--inline"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Watch Now
                      </motion.button>
                    </Link>
                    {movie.isAvailableForRent && (
                      <motion.button
                        type="button"
                        onClick={() => rentMutation.mutate()}
                        disabled={rentMutation.isPending}
                        className="az-chip px-6 py-3 text-sm font-semibold text-az-ink transition-all disabled:opacity-55"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {rentMutation.isPending
                          ? 'Processing...'
                          : `Rent ₦${movie.rentalPrice.toLocaleString()}`}
                      </motion.button>
                    )}
                    <Link href="/movies/watchlist">
                      <motion.button
                        type="button"
                        className="az-chip px-6 py-3 text-sm font-semibold text-az-ink transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Add to Library
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="max-w-7xl mx-auto py-10 sm:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ScrollReveal>
                  <h2 className="az-section-title text-az-ink mb-4">Synopsis</h2>
                </ScrollReveal>
                <p className="text-az-ink-muted leading-relaxed mb-8">
                  {movie.synopsis || movie.description}
                </p>

                <ScrollReveal>
                  <h3 className="az-title text-az-ink mb-4">Details</h3>
                </ScrollReveal>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <p className="text-sm text-az-ink-muted mb-1">Director</p>
                    <p className="text-az-ink font-medium">{movie.director || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-az-ink-muted mb-1">Genre</p>
                    <p className="text-az-ink font-medium">{movie.genre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-az-ink-muted mb-1">Year</p>
                    <p className="text-az-ink font-medium">{movie.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-az-ink-muted mb-1">Duration</p>
                    <p className="text-az-ink font-medium">{movie.duration}</p>
                  </div>
                </div>

                {movie.cast.length > 0 && (
                  <>
                    <ScrollReveal>
                      <h3 className="az-title text-az-ink mb-4">Cast</h3>
                    </ScrollReveal>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {movie.cast.map((actor, index) => (
                        <span key={index} className="az-chip px-3 py-1.5 text-sm text-az-ink/70">
                          {actor}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div>
                <GlowCard universe="movies" className="p-6 sticky top-24">
                  <h3 className="az-subtitle text-az-ink mb-4">Watch Options</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-az-ink-muted">Premium Access</span>
                      <span className="text-az-ink font-medium">Included</span>
                    </div>
                    {movie.isAvailableForRent && (
                      <div className="flex justify-between items-center">
                        <span className="text-az-ink-muted">Rent (48h)</span>
                        <span className="font-bold text-az-flame">
                          ₦{movie.rentalPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-az-ink-muted">Buy Forever</span>
                      <span className="font-bold text-az-flame">
                        ₦{movie.purchasePrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Link href={`/watch/${movie.id}`}>
                      <motion.button
                        type="button"
                        className="az-btn-primary"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Watch Now
                      </motion.button>
                    </Link>
                    {movie.isAvailableForRent && (
                      <motion.button
                        type="button"
                        onClick={() => rentMutation.mutate()}
                        disabled={rentMutation.isPending}
                        className="az-chip w-full py-3 font-semibold text-az-ink transition-all disabled:opacity-55"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {rentMutation.isPending ? 'Processing...' : 'Rent Movie'}
                      </motion.button>
                    )}
                    <motion.button
                      type="button"
                      onClick={() => rentMutation.mutate()}
                      disabled={rentMutation.isPending}
                      className="az-chip w-full py-3 font-semibold text-az-ink transition-all disabled:opacity-55"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {rentMutation.isPending ? 'Processing...' : 'Buy Movie'}
                    </motion.button>
                  </div>
                </GlowCard>
              </div>
            </div>
          </section>

          {/* Related Movies */}
          {movie.relatedMovies.length > 0 && (
            <section className="max-w-7xl mx-auto py-10">
              <ScrollReveal>
                <h2 className="az-section-title text-az-ink mb-6">You May Also Like</h2>
              </ScrollReveal>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {movie.relatedMovies.map((related) => (
                  <Link key={related.id} href={`/movies/${related.id}`}>
                    <div className="az-glass overflow-hidden">
                      <OptimizedImage
                        src={related.thumbnail}
                        alt={related.title}
                        width={300}
                        height={169}
                        className="w-full h-32 sm:h-40 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-az-ink truncate">
                          {related.title}
                        </h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-az-panel border shadow-lg transition-all ${
            toast.type === 'success'
              ? 'bg-az-success-500/15 border-az-success-500/30 text-az-success-400'
              : 'bg-az-error-500/15 border-az-error-500/30 text-az-error-400'
          }`}
        >
          {toast.message}
        </div>
      )}
    </PageShell>
  );
}
