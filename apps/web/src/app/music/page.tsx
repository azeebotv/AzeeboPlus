'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import MusicTrackList, { Track } from '@/components/music/MusicTrackList';
import analytics from '@/lib/analytics';

interface Genre {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

function MusicPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('music');
  }, []);

  const musicQuery = useQuery({
    queryKey: ['music-tracks'],
    queryFn: async () => {
      const res = await api.request<Track[]>('/api/v1/lifestyle/music');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load music');
    },
    staleTime: 60000,
  });

  const genresQuery = useQuery({
    queryKey: ['music', 'genres'],
    queryFn: async () => {
      const res = await api.request<Genre[]>('/api/v1/lifestyle/music/genres');
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: 300000,
  });

  const tracks: Track[] = musicQuery.data ?? [];
  const genres: Genre[] = genresQuery.data ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Music" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #4C0A5E 0%, #E8420A 100%)' }}
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
            Stream the latest hits, live performances, and exclusive drops
          </motion.p>
          <motion.div
            className="flex justify-center gap-3 mt-6 flex-wrap"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/music/trending"
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{ background: 'var(--brand-orange)', color: 'var(--brand-white)' }}
            >
              FlameTrending
            </Link>
            <Link
              href="/music/genres"
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'var(--brand-white)' }}
            >
              Music2Genres
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Genre Quick Links */}
      {genres.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {genres.slice(0, 8).map((genre) => (
              <Link
                key={genre.id}
                href={`/music/genres/${genre.slug || genre.id}`}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--brand-white)' }}
              >
                <span>{genre.icon || 'Music'}</span>
                {genre.name}
              </Link>
            ))}
            <Link
              href="/music/genres"
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
              style={{ color: 'var(--brand-orange)' }}
            >
              View All →
            </Link>
          </div>
        </section>
      )}

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

export default MusicPageContent;
