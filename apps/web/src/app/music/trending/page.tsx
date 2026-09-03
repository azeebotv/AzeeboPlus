'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import MusicTrackList from '@/components/music/MusicTrackList';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import analytics from '@/lib/analytics';

interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
  genre?: string;
  isExplicit?: boolean;
}

export default function MusicTrendingPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('music-trending');
  }, []);

  const trendingQuery = useQuery({
    queryKey: ['music', 'trending'],
    queryFn: async () => {
      const res = await api.request<Track[]>('/api/v1/lifestyle/music/trending');
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: 60000,
  });

  const tracks = trendingQuery.data ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Music" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #E8420A 0%, #4C0A5E 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            FlameTrending Music
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            The hottest tracks right now
          </motion.p>
          <motion.div
            className="flex justify-center gap-4 mt-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/music"
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'var(--brand-white)' }}
            >
              All Tracks
            </Link>
            <span
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'var(--brand-orange)', color: 'var(--brand-white)' }}
            >
              Trending
            </span>
            <Link
              href="/music/genres"
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'var(--brand-white)' }}
            >
              Genres
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <MusicTrackList
            tracks={tracks}
            isLoading={trendingQuery.isLoading}
            error={trendingQuery.error?.message}
            onRetry={() => trendingQuery.refetch()}
          />
        </ScrollReveal>
      </div>

      <AppFooter />
    </div>
  );
}
