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
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function HighlightsPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('sports-highlights');
  }, []);

  const highlightsQuery = useQuery({
    queryKey: ['sports-highlights'],
    queryFn: async () => {
      const res = await api.content.getTrendingContent(20);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : [];
      }
      throw new Error(res.message || 'Failed to load highlights');
    },
    staleTime: 60000,
  });

  const highlights: ContentItem[] = highlightsQuery.data ?? [];
  const isLoading = highlightsQuery.isLoading;
  const error = highlightsQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader active="Sports" logoVariant="light" />

      <section
        className="relative py-16 sm:py-20 overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(232,66,10,0.2) 0%, var(--bg-secondary) 60%, var(--bg-primary) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Game Recaps & Clips
          </span>
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Match Highlights
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Watch the best moments from recent matches and events
          </motion.p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            Featured Highlights
          </h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="200px" borderRadius="0" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="70%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load highlights"
            description={error}
            onButtonPress={() => highlightsQuery.refetch()}
          />
        ) : highlights.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((highlight, index) => (
              <motion.div
                key={highlight.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/watch/${highlight.id}`}>
                  <GlowCard universe="sports" className="overflow-hidden group">
                    <div className="relative">
                      <OptimizedImage
                        src={highlight.thumbnail}
                        alt={highlight.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)]/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
                          style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#0b090e">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>
                      </div>
                      {highlight.duration && (
                        <span
                          className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'var(--brand-white)',
                          }}
                        >
                          {Math.floor(highlight.duration / 60)}:
                          {(highlight.duration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm mb-2 truncate">
                        {highlight.title}
                      </h3>
                      <p className="text-sm text-white/50 line-clamp-2">{highlight.description}</p>
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No highlights available</p>
          </div>
        )}
      </section>

      <AppFooter logoVariant="light" />
    </div>
  );
}

const LazyHighlightsPage = lazy(() => Promise.resolve({ default: HighlightsPageContent }));

export default function HighlightsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyHighlightsPage />
    </Suspense>
  );
}
