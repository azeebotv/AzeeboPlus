'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function SeriesPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('comedy-series');
  }, []);

  const universesQuery = useUniversesQuery();

  const comedyUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'comedy');

  const seriesQuery = useQuery({
    queryKey: ['comedy-series', comedyUniverse?.id],
    queryFn: async () => {
      if (!comedyUniverse?.id) throw new Error('Comedy universe not found');
      const res = await api.content.getContentByUniverse(comedyUniverse.id, 1, 30);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      throw new Error(res.message || 'Failed to load comedy series');
    },
    staleTime: 60000,
    enabled: !!comedyUniverse?.id,
  });

  const series: ContentItem[] = seriesQuery.data ?? [];
  const isLoading = seriesQuery.isLoading;
  const error = seriesQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Comedy" />

      <section
        className="relative py-16 sm:py-20"
        style={{
          background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Comedy Series
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Binge-worthy comedy series from Africa&apos;s funniest creators
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">All Series</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="90%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load series"
            description={error}
            onButtonPress={() => seriesQuery.refetch()}
          />
        ) : series.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/watch/${item.id}`}>
                  <GlowCard universe="comedy" className="overflow-hidden group">
                    <div className="relative">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)]/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8420A">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>
                      </div>
                      {item.duration && (
                        <span
                          className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'var(--brand-white)',
                          }}
                        >
                          {Math.floor(item.duration / 60)}m
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm mb-2 truncate">{item.title}</h3>
                      <p className="text-sm text-white/50 line-clamp-2">{item.description}</p>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No comedy series available</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazySeriesPage = lazy(() => Promise.resolve({ default: SeriesPageContent }));

export default function SeriesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazySeriesPage />
    </Suspense>
  );
}
