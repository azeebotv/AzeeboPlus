'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton } from '@azeebo/ui/web';
import analytics from '@/lib/analytics';
import { ShareButton } from '@/components/ui/ShareButton';
import { ReviewsSection } from '@/components/ui/ReviewsSection';
import { WatchPartyOverlay } from '@/components/watch-party/WatchPartyOverlay';

interface TrackDetail {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  thumbnail: string;
  duration?: number;
  genre?: string;
  isExplicit?: boolean;
  album?: string;
  releaseDate?: string;
  playCount?: number;
  likeCount?: number;
  lyrics?: string;
  audioUrl?: string;
}

export default function TrackDetailPage(): React.JSX.Element {
  const params = useParams();
  const id = params?.id as string;
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    analytics.pageView('music-track');
  }, [id]);

  const trackQuery = useQuery({
    queryKey: ['music', 'track', id],
    queryFn: async () => {
      const res = await api.request<TrackDetail>(`/api/v1/lifestyle/music/${id}`);
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: 60000,
    enabled: !!id,
  });

  const track = trackQuery.data;

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (trackQuery.isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader active="Music" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton height="400px" borderRadius="16px" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Music" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/music"
          className="text-sm text-white/40 hover:text-white/60 transition-colors mb-6 inline-block"
        >
          ← Back to Music
        </Link>

        <motion.div
          className="flex flex-col sm:flex-row gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Album Art */}
          <div className="flex-shrink-0">
            {track?.thumbnail ? (
              <OptimizedImage
                src={track.thumbnail}
                alt={track?.title || 'Track'}
                width={300}
                height={300}
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl object-cover shadow-2xl"
              />
            ) : (
              <div
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl flex items-center justify-center text-7xl"
                style={{ background: 'linear-gradient(135deg, #4C0A5E, #E8420A)' }}
              >
                Music2
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {track?.isExplicit && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/60">
                  E
                </span>
              )}
              {track?.genre && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/60">
                  {track.genre}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {track?.title || 'Track'}
            </h1>

            {track?.artist && (
              <Link
                href={track.artistId ? `/music/artists/${track.artistId}` : '#'}
                className="text-lg text-white/60 hover:text-white/80 transition-colors mb-4 inline-block"
              >
                {track.artist}
              </Link>
            )}

            {track?.album && <p className="text-sm text-white/40 mb-2">Album: {track.album}</p>}

            <div className="flex items-center gap-4 text-sm text-white/40 mb-6">
              {track?.duration && <span>{formatDuration(track.duration)}</span>}
              {track?.releaseDate && (
                <span>{new Date(track.releaseDate).toLocaleDateString()}</span>
              )}
              {track?.playCount != null && <span>{track.playCount.toLocaleString()} plays</span>}
              {track?.likeCount != null && <span>{track.likeCount.toLocaleString()} likes</span>}
            </div>

            {/* Play Button */}
            <motion.button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white text-2xl ml-1">{isPlaying ? 'Pause' : 'Play'}</span>
            </motion.button>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'var(--brand-white)' }}
              >
                HeartLike
              </button>
              <ShareButton
                contentId={track?.id || ''}
                title={track?.title || ''}
                description={track?.artist ? `${track.title} by ${track.artist}` : track?.title}
                thumbnail={track?.thumbnail || ''}
                className="px-4 py-2 rounded-full"
              />
              <WatchPartyOverlay
                contentId={track?.id || ''}
                contentTitle={track?.title || ''}
                isPlaying={isPlaying}
                currentTime={0}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onSeek={() => {}}
              />
              <button
                type="button"
                className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'var(--brand-white)' }}
              >
                + Add to Playlist
              </button>
            </div>
          </div>
        </motion.div>

        {/* Lyrics */}
        {track?.lyrics && (
          <ScrollReveal>
            <section className="mt-12">
              <h2 className="text-xl font-bold text-white mb-4">Lyrics</h2>
              <div className="az-glass p-6 rounded-2xl">
                <pre className="text-sm text-white/60 whitespace-pre-wrap font-sans leading-relaxed">
                  {track.lyrics}
                </pre>
              </div>
            </section>
          </ScrollReveal>
        )}
      </div>

      {/* Reviews Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ReviewsSection contentId={track?.id || ''} />
      </section>

      <AppFooter />
    </div>
  );
}
