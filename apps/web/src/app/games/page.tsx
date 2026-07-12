'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { AmbientGlow } from '@/components/motion/AmbientGlow';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import { GlowCard } from '@/components/motion/GlowCard';

export default function GamesPage(): React.JSX.Element {
  const universesQuery = useQuery({
    queryKey: ['universes'],
    queryFn: async () => {
      const res = await api.universe.getUniverses();
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load universes');
      return res.data;
    },
    staleTime: 300000,
  });

  const gamesUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'games');

  const {
    data: games = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['games-content', gamesUniverse?.id],
    queryFn: async () => {
      if (!gamesUniverse?.id) throw new Error('Games universe not found');
      const result = await api.content.getContentByUniverse(gamesUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load games.');
    },
    staleTime: 60000,
  });

  return (
    <div className="min-h-screen az-nollywood-bg">
      <AppHeader active="Games" />

      {/* Hero Section */}
      <section className="relative">
        {isLoading ? (
          <Skeleton height="400px" className="sm:h-[500px]" borderRadius="0px" />
        ) : error ? (
          <div className="h-[400px] sm:h-[500px] flex items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <ErrorState
                title="Failed to load games"
                description={error.message}
                onButtonPress={() => refetch()}
              />
            </motion.div>
          </div>
        ) : games.length > 0 ? (
          <div className="relative h-[400px] sm:h-[500px]">
            <motion.img
              src={games[0].thumbnail}
              alt={games[0].title}
              className="w-full h-full object-cover"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/50 to-transparent" />
            <AmbientGlow color="rgba(59,130,246,0.25)" size={500} className="bottom-0 right-0" />

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 max-w-7xl mx-auto">
              <motion.div
                className="flex items-center gap-2 mb-3 sm:mb-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#E8420A', color: '#fff' }}
                >
                  Premium
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#60A5FA' }}
                >
                  {games[0].contentType || 'Game'}
                </span>
              </motion.div>
              <motion.h2
                className="text-3xl sm:text-4xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                {games[0].title}
              </motion.h2>
              <motion.p
                className="text-white/60 text-base sm:text-lg mb-5 sm:mb-6 max-w-2xl"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                {games[0].description}
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                <Link href={`/watch/${games[0].id}`}>
                  <motion.button
                    type="button"
                    className="az-btn-primary"
                    style={{ width: 'auto', paddingInline: '2rem' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Play Now
                  </motion.button>
                </Link>
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
                  Leaderboard
                </motion.button>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="h-[400px] sm:h-[500px] flex items-center justify-center">
            <p className="text-base sm:text-lg text-white/60">No games available</p>
          </div>
        )}
      </section>

      {/* Games Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Games</h2>
              <p className="text-sm sm:text-base mt-1 text-white/50">Play and earn rewards</p>
            </div>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="208px" className="sm:h-[240px]" borderRadius="0px" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : games.length > 0 ? (
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {games.map((game) => (
              <Link key={game.id} href={`/watch/${game.id}`}>
                <GlowCard universe="games" className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-full h-44 sm:h-48 object-cover"
                    />
                    <span
                      className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: '#E8420A', color: '#fff' }}
                    >
                      Premium
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2"
                        style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#60A5FA' }}
                      >
                        {game.contentType || 'Game'}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white">{game.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{game.description}</p>
                    <motion.button
                      type="button"
                      className="az-btn-primary w-full"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Play Now
                    </motion.button>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="text-center py-10 sm:py-12">
            <p className="text-base sm:text-lg text-white/50">No games available yet</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}
