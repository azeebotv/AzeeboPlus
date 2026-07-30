'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

function CinemaxisPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('cinemaxis');
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

  const cinemaxisUniverse = universesQuery.data?.find(
    (u) => u.name?.toLowerCase() === 'cinema' || u.name?.toLowerCase() === 'cinemaxis'
  );

  const contentQuery = useQuery({
    queryKey: ['cinemaxis-content', cinemaxisUniverse?.id],
    queryFn: async () => {
      if (!cinemaxisUniverse?.id) throw new Error('Cinemaxis universe not found');
      const res = await api.content.getContentByUniverse(cinemaxisUniverse.id, 1, 20);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      throw new Error(res.message || 'Failed to load content');
    },
    staleTime: 60000,
    enabled: !!cinemaxisUniverse?.id,
  });

  const items: ContentItem[] = contentQuery.data ?? [];
  const isLoading = contentQuery.isLoading;
  const error = contentQuery.error?.message || null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A1A' }}>
      <AppHeader active="Cinemaxis" />

      {/* Hero */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A1A3B 0%, #1A0A3B 50%, #2D1B69 100%)' }}
      >
        <AmbientGlow
          color="rgba(168,85,247,0.2)"
          size={600}
          className="top-[-100px] right-[-100px]"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1
              className="text-4xl sm:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Cinemaxis
            </motion.h1>
            <motion.p
              className="text-xl text-white/70 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Premium African cinema. Blockbuster movies, award-winning films, and exclusive
              releases.
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link href="/movies">
                <motion.button
                  type="button"
                  aria-label="Browse movies"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
                  style={{
                    backgroundColor: 'rgba(168,85,247,0.2)',
                    border: '1px solid rgba(168,85,247,0.4)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Browse Movies
                </motion.button>
              </Link>
              <Link href="/movies/premieres">
                <motion.button
                  type="button"
                  aria-label="View premieres"
                  className="px-6 py-3 rounded-full text-sm font-semibold text-[#1A0A3B] transition-all"
                  style={{ backgroundColor: '#a855f7' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Premieres
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Films</h2>
              <p className="text-base mt-1 text-white/50">Curated from African cinema</p>
            </div>
            <Link
              href="/browse"
              className="text-sm font-medium transition-colors"
              style={{ color: '#a855f7' }}
            >
              View All
            </Link>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="192px" borderRadius="0px" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load content"
            description={error}
            buttonText="Retry"
            onButtonPress={() => contentQuery.refetch()}
          />
        ) : items.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link key={item.id} href={`/watch/${item.id}`}>
                <GlowCard universe="movies" className="overflow-hidden">
                  <div className="relative">
                    <OptimizedImage
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A1A]/80 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-white/50 line-clamp-2">{item.description}</p>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No content available yet</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

export default CinemaxisPageContent;
