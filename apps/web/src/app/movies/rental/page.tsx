'use client';
import { Suspense, lazy, useEffect, useState } from 'react';

export const metadata = {
  title: 'Rent Movies | Azeebo',
  description: 'Rent or buy premium movies on demand. Watch anytime, anywhere on Azeebo.',
  openGraph: {
    title: 'Rent Movies | Azeebo',
    description: 'Rent or buy premium movies on demand. Watch anytime, anywhere on Azeebo.',
  },
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    mutationFn: async ({ movieId, type }: { movieId: string; type: string }) => {
      const res = await apiFetch('/api/v1/movies/rental/purchase', {
        method: 'POST',
        body: JSON.stringify({ movieId, type }),
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Movies" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #E8420A 0%, #1A0A0A 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🎬 Rent Movies
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Rent or buy premium movies on demand
          </motion.p>
        </div>
      </section>

      {/* Movies Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            Available to Rent
          </h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="240px" borderRadius="0" />
                <div className="p-4 space-y-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      className="w-full h-48 sm:h-56 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                    <div className="absolute top-2 right-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: 'rgba(232,66,10,0.9)',
                          color: 'var(--brand-white)',
                        }}
                      >
                        ₦{movie.rentalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                        style={{
                          backgroundColor: 'rgba(232,66,10,0.2)',
                          color: 'var(--brand-orange)',
                        }}
                      >
                        {movie.genre}
                      </span>
                      <h3 className="text-lg font-bold text-white">{movie.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                      <span>⭐ {movie.rating}</span>
                      <span>·</span>
                      <span>{movie.year}</span>
                      <span>·</span>
                      <span>{movie.duration}</span>
                    </div>
                    <p className="text-sm text-white/50 mb-4 line-clamp-2">{movie.description}</p>
                    <motion.button
                      type="button"
                      onClick={() => setSelectedMovie(movie)}
                      className="az-btn-primary w-full"
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
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No movies available for rental</p>
          </div>
        )}
      </section>

      {/* Rental Modal */}
      {selectedMovie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => {
            setSelectedMovie(null);
            setSelectedOption(null);
          }}
        >
          <div
            className="az-glass p-6 rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <OptimizedImage
                src={selectedMovie.thumbnail}
                alt={selectedMovie.title}
                width={80}
                height={120}
                className="w-16 h-24 object-cover rounded-lg"
              />
              <div>
                <h3 className="text-lg font-bold text-white">{selectedMovie.title}</h3>
                <p className="text-sm text-white/50">
                  {selectedMovie.genre} · {selectedMovie.year}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {rentalOptions.map((option) => (
                <motion.button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOption(option)}
                  className="w-full p-4 rounded-xl text-left transition-all"
                  style={{
                    border: `2px solid ${selectedOption?.id === option.id ? 'var(--brand-orange)' : 'rgba(255,255,255,0.1)'}`,
                    backgroundColor:
                      selectedOption?.id === option.id
                        ? 'rgba(232,66,10,0.1)'
                        : 'rgba(255,255,255,0.05)',
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{option.label}</p>
                      {option.duration && (
                        <p className="text-xs text-white/40">{option.duration}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold" style={{ color: 'var(--brand-orange)' }}>
                      ₦{option.price.toLocaleString()}
                    </p>
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
                className="w-full py-3 rounded-full font-semibold transition-all az-btn-primary"
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
                className="w-full py-2 rounded-full text-white/50 border border-white/10 hover:bg-white/5 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg transition-all"
          style={{
            backgroundColor:
              toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? 'var(--color-success-500)' : 'var(--color-error-500)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const LazyRentalPage = lazy(() => Promise.resolve({ default: RentalPageContent }));

export default function RentalPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyRentalPage />
    </Suspense>
  );
}
