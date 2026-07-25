'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
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

function MovieDetailPageContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;
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
    mutationFn: async (type: string) => {
      const res = await apiFetch('/api/v1/movies/rental/purchase', {
        method: 'POST',
        body: JSON.stringify({ movieId: id, type }),
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Movies" />

      {isLoading ? (
        <>
          <Skeleton height="500px" borderRadius="0" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/50 to-transparent" />
              <AmbientGlow color="rgba(232,66,10,0.25)" size={500} className="bottom-0 right-0" />

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {movie.isPremium && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: '#E8420A', color: '#fff' }}
                      >
                        Premium
                      </span>
                    )}
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                    >
                      {movie.genre}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{movie.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                    <span>
                      ⭐ {movie.rating.toFixed(1)} ({movie.totalRatings})
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
                        className="az-btn-primary"
                        style={{ width: 'auto', paddingInline: '2rem' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Watch Now
                      </motion.button>
                    </Link>
                    {movie.isAvailableForRent && (
                      <motion.button
                        type="button"
                        onClick={() => rentMutation.mutate('rent')}
                        disabled={rentMutation.isPending}
                        className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                        style={{
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                        }}
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
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <ScrollReveal>
                  <h2 className="text-2xl font-bold text-white mb-4">Synopsis</h2>
                </ScrollReveal>
                <p className="text-white/70 leading-relaxed mb-8">
                  {movie.synopsis || movie.description}
                </p>

                <ScrollReveal>
                  <h3 className="text-xl font-bold text-white mb-4">Details</h3>
                </ScrollReveal>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <p className="text-sm text-white/40 mb-1">Director</p>
                    <p className="text-white font-medium">{movie.director || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-1">Genre</p>
                    <p className="text-white font-medium">{movie.genre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-1">Year</p>
                    <p className="text-white font-medium">{movie.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/40 mb-1">Duration</p>
                    <p className="text-white font-medium">{movie.duration}</p>
                  </div>
                </div>

                {movie.cast.length > 0 && (
                  <>
                    <ScrollReveal>
                      <h3 className="text-xl font-bold text-white mb-4">Cast</h3>
                    </ScrollReveal>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {movie.cast.map((actor, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-full text-sm"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
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
                  <h3 className="text-lg font-bold text-white mb-4">Watch Options</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-white/50">Premium Access</span>
                      <span className="text-white font-medium">Included</span>
                    </div>
                    {movie.isAvailableForRent && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Rent (48h)</span>
                        <span className="font-bold" style={{ color: '#E8420A' }}>
                          ₦{movie.rentalPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-white/50">Buy Forever</span>
                      <span className="font-bold" style={{ color: '#E8420A' }}>
                        ₦{movie.purchasePrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Link href={`/watch/${movie.id}`}>
                      <motion.button
                        type="button"
                        className="az-btn-primary w-full"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Watch Now
                      </motion.button>
                    </Link>
                    {movie.isAvailableForRent && (
                      <motion.button
                        type="button"
                        onClick={() => rentMutation.mutate('rent')}
                        disabled={rentMutation.isPending}
                        className="w-full py-3 rounded-full font-semibold transition-all"
                        style={{
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {rentMutation.isPending ? 'Processing...' : 'Rent Movie'}
                      </motion.button>
                    )}
                    <motion.button
                      type="button"
                      onClick={() => rentMutation.mutate('purchase')}
                      disabled={rentMutation.isPending}
                      className="w-full py-3 rounded-full font-semibold transition-all"
                      style={{
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                      }}
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
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">You May Also Like</h2>
              </ScrollReveal>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {movie.relatedMovies.map((related) => (
                  <Link key={related.id} href={`/movies/${related.id}`}>
                    <div className="az-glass overflow-hidden rounded-xl">
                      <OptimizedImage
                        src={related.thumbnail}
                        alt={related.title}
                        width={300}
                        height={169}
                        className="w-full h-32 sm:h-40 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-white truncate">
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

      <AppFooter />

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg transition-all"
          style={{
            backgroundColor:
              toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? '#22C55E' : '#EF4444',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const LazyMovieDetailPage = lazy(() => Promise.resolve({ default: MovieDetailPageContent }));

export default function MovieDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyMovieDetailPage />
    </Suspense>
  );
}
