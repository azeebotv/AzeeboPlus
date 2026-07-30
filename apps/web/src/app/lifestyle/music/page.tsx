'use client';
import { Suspense, lazy, useEffect, useState } from 'react';

export const metadata = {
  title: 'Music | Azeebo',
  description: 'Discover the latest hits, trending tracks, and exclusive music on Azeebo.',
  openGraph: {
    title: 'Music | Azeebo',
    description: 'Discover the latest hits, trending tracks, and exclusive music on Azeebo.',
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

function MusicPageContent(): React.JSX.Element {
  const [playingId, setPlayingId] = useState<string | null>(null);

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
  const isLoading = musicQuery.isLoading;
  const error = musicQuery.error?.message;

  const togglePlay = (trackId: string) => {
    setPlayingId(playingId === trackId ? null : trackId);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
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

      {/* Now Playing Bar */}
      {playingId && (
        <div
          className="sticky top-0 z-40 py-3 px-4"
          style={{
            backgroundColor: 'rgba(26,10,10,0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: 'rgba(232,66,10,0.2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#E8420A">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {tracks.find((t) => t.id === playingId)?.title}
              </p>
              <p className="text-xs text-white/50 truncate">
                {tracks.find((t) => t.id === playingId)?.artist}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlayingId(null)}
              className="text-white/40 hover:text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tracks List */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            Trending Tracks
          </h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="az-glass p-3 flex items-center gap-4">
                <Skeleton width="48px" height="48px" borderRadius="0" />
                <div className="flex-1 space-y-2">
                  <Skeleton height="16px" width="50%" />
                  <Skeleton height="12px" width="30%" />
                </div>
                <Skeleton width="40px" height="16px" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load music"
            description={error}
            onButtonPress={() => musicQuery.refetch()}
          />
        ) : tracks.length > 0 ? (
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
              >
                <div
                  className="az-glass p-3 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    border: playingId === track.id ? '1px solid rgba(232,66,10,0.3)' : undefined,
                  }}
                  onClick={() => togglePlay(track.id)}
                >
                  <span className="text-sm text-white/30 w-6 text-center">{index + 1}</span>
                  <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <OptimizedImage
                      src={track.thumbnail}
                      alt={track.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                      {playingId === track.id ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                      {track.isExplicit && (
                        <span
                          className="px-1 py-0.5 rounded text-[8px] font-bold"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          E
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 truncate">{track.artist}</p>
                  </div>
                  {track.genre && (
                    <span
                      className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {track.genre}
                    </span>
                  )}
                  <span className="text-xs text-white/40">
                    {track.duration
                      ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}`
                      : ''}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="text-white/30 hover:text-[#E8420A] transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No music available</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyMusicPage = lazy(() => Promise.resolve({ default: MusicPageContent }));

export default function MusicPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyMusicPage />
    </Suspense>
  );
}
