'use client';
import { Suspense, lazy, useEffect } from 'react';

export const metadata = {
  title: 'Movie Premieres | Azeebo',
  description: 'Discover upcoming movie premieres, set reminders, and get notified on Azeebo.',
  openGraph: {
    title: 'Movie Premieres | Azeebo',
    description: 'Discover upcoming movie premieres, set reminders, and get notified on Azeebo.',
  },
};
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface Premiere {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  premiereDate: string;
  genre?: string;
  cast?: string[];
  isExclusive?: boolean;
}

function PremieresPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('movies-premieres');
  }, []);

  const premieresQuery = useQuery({
    queryKey: ['movie-premieres'],
    queryFn: async () => {
      const res = await api.request<Premiere[]>('/api/v1/movies/premieres');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load premieres');
    },
    staleTime: 60000,
  });

  const premieres: Premiere[] = premieresQuery.data ?? [];
  const isLoading = premieresQuery.isLoading;
  const error = premieresQuery.error?.message;
  const featured = premieres[0] ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Movies" />

      {/* Featured Premiere */}
      {isLoading ? (
        <section className="relative">
          <Skeleton height="500px" borderRadius="0" />
        </section>
      ) : featured ? (
        <section className="relative">
          <div className="relative h-[400px] sm:h-[500px]">
            <OptimizedImage
              src={featured.thumbnail}
              alt={featured.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'var(--color-warning-500)', color: '#000' }}
                  >
                    Coming Soon
                  </span>
                  {featured.isExclusive && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--brand-orange)',
                        color: 'var(--brand-white)',
                      }}
                    >
                      Azeebo+ Exclusive
                    </span>
                  )}
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{featured.title}</h1>
                <p className="text-white/60 text-lg mb-4 max-w-2xl">{featured.description}</p>
                {featured.genre && <p className="text-sm text-white/40 mb-4">{featured.genre}</p>}
                <div className="flex items-center gap-4">
                  <motion.button
                    type="button"
                    className="az-btn-primary"
                    style={{ width: 'auto', paddingInline: '2rem' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Set Reminder
                  </motion.button>
                  <span className="text-white/60 text-sm">
                    Premieres{' '}
                    {new Date(featured.premiereDate).toLocaleDateString('en-NG', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Upcoming Premieres */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            Upcoming Premieres
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
            title="Failed to load premieres"
            description={error}
            onButtonPress={() => premieresQuery.refetch()}
          />
        ) : premieres.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {premieres.map((premiere, index) => {
              const daysUntil = Math.ceil(
                (new Date(premiere.premiereDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <motion.div
                  key={premiere.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlowCard universe="movies" className="overflow-hidden">
                    <div className="relative">
                      <OptimizedImage
                        src={premiere.thumbnail}
                        alt={premiere.title}
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                      {daysUntil > 0 && (
                        <div className="absolute top-2 right-2">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: 'rgba(245,158,11,0.9)', color: '#000' }}
                          >
                            {daysUntil} days
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 right-4">
                        {premiere.genre && (
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                            style={{
                              backgroundColor: 'rgba(232,66,10,0.2)',
                              color: 'var(--brand-orange)',
                            }}
                          >
                            {premiere.genre}
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-white">{premiere.title}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-white/50 mb-3 line-clamp-2">
                        {premiere.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                        <span>
                          {new Date(premiere.premiereDate).toLocaleDateString('en-NG', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {premiere.isExclusive && (
                          <span style={{ color: 'var(--brand-orange)' }}>Exclusive</span>
                        )}
                      </div>
                      <motion.button
                        type="button"
                        className="az-btn-primary w-full"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Remind Me
                      </motion.button>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No upcoming premieres</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyPremieresPage = lazy(() => Promise.resolve({ default: PremieresPageContent }));

export default function PremieresPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyPremieresPage />
    </Suspense>
  );
}
