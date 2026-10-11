'use client';
import { Suspense, lazy, useEffect, useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface RentalMovie {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  rentalPrice: number;
  purchasePrice: number;
  duration: string;
  genre: string;
  rating: number;
  year: number;
}

interface RentalOption {
  id: string;
  type: 'rent' | 'purchase';
  price: number;
  duration?: string;
  label: string;
}

function rentalOptionClass(isSelected: boolean): string {
  return isSelected
    ? 'rounded-az-panel border-2 border-az-flame bg-az-scarlet/10 p-4 text-left transition-all'
    : 'rounded-az-panel border-2 border-az-ink/10 bg-az-ink/5 p-4 text-left transition-all';
}

function RentalPageContent(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [selectedMovie, setSelectedMovie] = useState<RentalMovie | null>(null);
  const [selectedOption, setSelectedOption] = useState<RentalOption | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    analytics.pageView('movies-rental');
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const moviesQuery = useQuery({
    queryKey: ['rental-movies'],
    queryFn: async () => {
      const res = await apiFetch<RentalMovie[]>('/api/v1/movies/rental');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load rental movies');
    },
    staleTime: 60000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ movieId }: { movieId: string; type: string }) => {
      // Backend rents by path param and charges the fixed fee server-side.
      const res = await apiFetch(`/api/v1/movies/${movieId}/rent`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (res.success) return res.data;
      throw new Error(res.message || 'Failed to process rental');
    },
    onSuccess: () => {
      setToast({ message: 'Rental successful! Enjoy your movie.', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['rental-movies'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setSelectedMovie(null);
      setSelectedOption(null);
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  const movies: RentalMovie[] = moviesQuery.data ?? [];
  const isLoading = moviesQuery.isLoading;
  const error = moviesQuery.error?.message;

  const rentalOptions: RentalOption[] = selectedMovie
    ? [
        {
          id: 'rent-48h',
          type: 'rent',
          price: selectedMovie.rentalPrice,
          duration: '48 hours',
          label: 'Rent for 48h',
        },
        {
          id: 'purchase',
          type: 'purchase',
          price: selectedMovie.purchasePrice,
          label: 'Buy Forever',
        },
      ]
    : [];

  return (
    <PageShell activeNav="Movies" maxWidth="7xl">
      <PageHero
        title="FilmRent Movies"
        subtitle="Rent or buy premium movies on demand"
        glowColor="color-mix(in srgb, var(--color-az-flame) 18%, transparent)"
      />

      {/* Movies Grid */}
      <section>
        <ScrollReveal>
          <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Available to Rent</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="240px" borderRadius="0" className="sm:h-[240px]" />
                <div className="space-y-3 p-4">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="50%" />
                  <Skeleton height="36px" borderRadius="0" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load rental movies"
            description={error}
            onButtonPress={() => moviesQuery.refetch()}
          />
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {movies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard universe="movies" className="overflow-hidden">
                  <div className="relative">
                    <OptimizedImage
                      src={movie.thumbnail}
                      alt={movie.title}
                      width={400}
                      height={240}
                      className="h-48 w-full object-cover sm:h-56"
                    />
                    <div className="absolute inset-0 az-scrim" />
                    <div className="absolute right-2 top-2">
                      <span className="az-caption rounded-az-pill bg-az-scarlet/90 px-2.5 py-1 font-semibold text-az-ink">
                        ₦{movie.rentalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="az-caption mb-2 inline-block rounded-az-pill bg-az-scarlet/20 px-2.5 py-0.5 text-az-flame">
                        {movie.genre}
                      </span>
                      <h3 className="az-title text-az-ink">{movie.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="az-caption mb-3 flex items-center gap-2 text-az-ink/40">
                      <span>{movie.rating}</span>
                      <span aria-hidden="true">·</span>
                      <span>{movie.year}</span>
                      <span aria-hidden="true">·</span>
                      <span>{movie.duration}</span>
                    </div>
                    <p className="az-body mb-4 line-clamp-2 text-az-ink-muted">
                      {movie.description}
                    </p>
                    <motion.button
                      type="button"
                      onClick={() => setSelectedMovie(movie)}
                      className="az-btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Rent / Buy
                    </motion.button>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="az-lead text-az-ink/50">No movies available for rental</p>
          </div>
        )}
      </section>

      {/* Rental Modal */}
      {selectedMovie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setSelectedMovie(null);
            setSelectedOption(null);
          }}
        >
          <div
            className="az-glass w-full max-w-md p-6"
            role="dialog"
            aria-modal="true"
            aria-label={selectedMovie.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-4">
              <OptimizedImage
                src={selectedMovie.thumbnail}
                alt={selectedMovie.title}
                width={80}
                height={120}
                className="h-24 w-16 rounded-az-card object-cover"
              />
              <div>
                <h3 className="az-subtitle text-az-ink">{selectedMovie.title}</h3>
                <p className="az-body text-az-ink-muted">
                  {selectedMovie.genre} · {selectedMovie.year}
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              {rentalOptions.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOption(option)}
                  aria-pressed={selectedOption?.id === option.id}
                  className={rentalOptionClass(selectedOption?.id === option.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="az-body-strong text-az-ink">{option.label}</p>
                      {option.duration && (
                        <p className="az-caption text-az-ink/40">{option.duration}</p>
                      )}
                    </div>
                    <p className="az-subtitle text-az-flame">₦{option.price.toLocaleString()}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <motion.button
                type="button"
                onClick={() => {
                  if (selectedOption) {
                    purchaseMutation.mutate({
                      movieId: selectedMovie.id,
                      type: selectedOption.type,
                    });
                  }
                }}
                disabled={!selectedOption || purchaseMutation.isPending}
                className="az-btn-primary transition-all"
                whileHover={selectedOption ? { scale: 1.02 } : undefined}
                whileTap={selectedOption ? { scale: 0.98 } : undefined}
              >
                {purchaseMutation.isPending
                  ? 'Processing...'
                  : selectedOption
                    ? `Pay ₦${selectedOption.price.toLocaleString()}`
                    : 'Select an option'}
              </motion.button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMovie(null);
                  setSelectedOption(null);
                }}
                className="az-body w-full rounded-az-pill border border-az-glass-border px-4 py-2 text-az-ink-muted transition-colors hover:bg-az-glass-fill"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-az-panel border px-6 py-3 shadow-az-lifted ${
            toast.type === 'success'
              ? 'border-az-success-500/30 bg-az-success-500/15 text-az-success-500'
              : 'border-az-error-500/30 bg-az-error-500/15 text-az-error-500'
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </PageShell>
  );
}

const LazyRentalPage = lazy(() => Promise.resolve({ default: RentalPageContent }));

export default function RentalPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyRentalPage />
    </Suspense>
  );
}
