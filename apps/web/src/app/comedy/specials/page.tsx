'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function SpecialsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('comedy-specials');
  }, []);

  const universesQuery = useQuery({
    queryKey: ['universes'],
    queryFn: async () => {
      const res = await api.universe.getUniverses();
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load universes');
      return res.data;
    },
    staleTime: 300000,
  });

  const comedyUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'comedy');

  const {
    data: specials = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['comedy-specials', comedyUniverse?.id],
    queryFn: async () => {
      if (!comedyUniverse?.id) throw new Error('Comedy universe not found');
      const result = await api.content.getContentByUniverse(comedyUniverse.id, 1, 30);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load comedy specials.');
    },
    staleTime: 60000,
    enabled: !!comedyUniverse?.id,
  });

  const featured = specials[0] ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Comedy" />

      {/* Featured Special */}
      {isLoading ? (
        <section className="relative">
          <Skeleton height="400px" borderRadius="0" />
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
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)] via-[var(--brand-near-black)]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block"
                  style={{ backgroundColor: 'var(--brand-orange)', color: 'var(--brand-white)' }}
                >
                  Featured Special
                </span>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{featured.title}</h1>
                <p className="text-white/60 text-lg mb-6 max-w-2xl">{featured.description}</p>
                <Link href={`/watch/${featured.id}`}>
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
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Specials Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Comedy Specials</h2>
              <p className="text-sm sm:text-base mt-1 text-white/50">
                Full-length stand-up specials from top comedians
              </p>
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="240px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load specials"
            description={error.message}
            onButtonPress={() => refetch()}
          />
        ) : specials.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {specials.slice(1).map((special) => (
              <Link key={special.id} href={`/watch/${special.id}`}>
                <GlowCard universe="comedy" className="overflow-hidden">
                  <div className="relative">
                    <OptimizedImage
                      src={special.thumbnail}
                      alt={special.title}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)]/80 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A0A0A">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                        style={{
                          backgroundColor: 'rgba(232,66,10,0.2)',
                          color: 'var(--brand-orange)',
                        }}
                      >
                        {special.contentType || 'Special'}
                      </span>
                      <h3 className="text-lg font-bold text-white">{special.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{special.description}</p>
                    <div className="flex items-center justify-between text-xs text-white/40">
                      <span>
                        {special.duration ? `${Math.floor(special.duration / 60)} min` : ''}
                      </span>
                      <span>{special.creator?.name}</span>
                    </div>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No comedy specials available yet</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazySpecialsPage = lazy(() => Promise.resolve({ default: SpecialsPageContent }));

export default function SpecialsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazySpecialsPage />
    </Suspense>
  );
}
