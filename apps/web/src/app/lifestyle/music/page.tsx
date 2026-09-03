import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lifestyle Music  - Azeebo+',
  description: 'Lifestyle Music  on Azeebo+',
};

'use client';
import { Suspense, lazy, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import MusicTrackList, { Track } from '@/components/music/MusicTrackList';
import analytics from '@/lib/analytics';

function MusicPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('lifestyle-music');
  }, []);

  const musicQuery = useQuery({
    queryKey: ['lifestyle-music'],
    queryFn: async () => {
      const res = await api.request<Track[]>('/api/v1/lifestyle/music');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load music');
    },
    staleTime: 60000,
  });

  const tracks: Track[] = musicQuery.data ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Lifestyle" />

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
            Music
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Discover the latest hits and trending tracks
          </motion.p>
        </div>
      </section>

      <MusicTrackList
        tracks={tracks}
        isLoading={musicQuery.isLoading}
        error={musicQuery.error?.message}
        onRetry={() => musicQuery.refetch()}
      />

      <AppFooter />
    </div>
  );
}

const LazyMusicPage = lazy(() => Promise.resolve({ default: MusicPageContent }));

export default function MusicPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyMusicPage />
    </Suspense>
  );
}
