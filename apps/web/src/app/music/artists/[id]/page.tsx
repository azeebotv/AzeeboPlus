'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import MusicTrackList from '@/components/music/MusicTrackList';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import analytics from '@/lib/analytics';

interface Artist {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  genre?: string;
  trackCount?: number;
  followerCount?: number;
  socialLinks?: { platform: string; url: string }[];
}

interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
  genre?: string;
  isExplicit?: boolean;
}

export default function ArtistDetailPage(): React.JSX.Element {
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    analytics.pageView('music-artist');
  }, [id]);

  const artistQuery = useQuery({
    queryKey: ['music', 'artist', id],
    queryFn: async () => {
      const res = await api.request<Artist>(`/api/v1/lifestyle/music/artists/${id}`);
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: 60000,
    enabled: !!id,
  });

  const tracksQuery = useQuery({
    queryKey: ['music', 'artist', id, 'tracks'],
    queryFn: async () => {
      const res = await api.request<Track[]>(`/api/v1/lifestyle/music?artistId=${id}`);
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: 60000,
    enabled: !!id,
  });

  const artist = artistQuery.data;
  const tracks = tracksQuery.data ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Music" />

      {/* Artist Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #4C0A5E 0%, #1A0A0A 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/music"
            className="text-sm text-white/40 hover:text-white/60 transition-colors mb-6 inline-block"
          >
            ← Back to Music
          </Link>

          <motion.div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {artist?.avatar ? (
              <OptimizedImage
                src={artist.avatar}
                alt={artist?.name || 'Artist'}
                width={160}
                height={160}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center text-5xl"
                style={{ background: 'linear-gradient(135deg, #4C0A5E, #E8420A)' }}
              >
                Mic
              </div>
            )}

            <div>
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">
                {artist?.name || 'Artist'}
              </h1>
              {artist?.genre && <p className="text-lg text-white/60 mb-2">{artist.genre}</p>}
              {artist?.bio && <p className="text-sm text-white/50 max-w-xl mb-4">{artist.bio}</p>}
              <div className="flex gap-6 text-sm text-white/50">
                {artist?.trackCount != null && <span>{artist.trackCount} tracks</span>}
                {artist?.followerCount != null && (
                  <span>{artist.followerCount.toLocaleString()} followers</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl font-bold text-white mb-6">Tracks</h2>
          <MusicTrackList
            tracks={tracks}
            isLoading={tracksQuery.isLoading}
            error={tracksQuery.error?.message}
            onRetry={() => tracksQuery.refetch()}
          />
        </ScrollReveal>
      </div>

      <AppFooter />
    </div>
  );
}
