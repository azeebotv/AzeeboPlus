'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton } from '@azeebo/ui/web';
import { extractTracks } from '@/lib/music';
import analytics from '@/lib/analytics';
import { ShareButton } from '@/components/ui/ShareButton';
import { ReviewsSection } from '@/components/ui/ReviewsSection';
import { WatchPartyOverlay } from '@/components/watch-party/WatchPartyOverlay';
import { Heart, Music2, Pause, Play } from 'lucide-react';

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
      const res = await api.request<unknown>(`/api/v1/lifestyle/music/${id}`);
      if (res.success && res.data) return extractTracks(res.data)[0] ?? null;
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
      <PageShell activeNav="Music" maxWidth="lg">
        <div className="py-12">
          <Skeleton height="400px" borderRadius="16px" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="Music" maxWidth="lg">
      <div className="py-12">
        <Link
          href="/music"
          className="az-caption mb-6 inline-block text-az-ink-muted transition-colors hover:text-az-ink"
        >
          ← Back to Music
        </Link>

        <motion.div
          className="flex flex-col gap-8 sm:flex-row"
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
                className="size-64 rounded-az-card object-cover shadow-2xl sm:size-72"
              />
            ) : (
              <div className="flex size-64 items-center justify-center rounded-az-card bg-az-flame/15 text-az-flame sm:size-72">
                <Music2 size={72} strokeWidth={1.5} aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              {track?.isExplicit && (
                <span className="az-micro-label rounded-az-control bg-az-glass-card px-1.5 py-0.5 text-az-ink-muted">
                  E
                </span>
              )}
              {track?.genre && (
                <span className="az-caption rounded-az-pill bg-az-glass-card px-2 py-0.5 text-az-ink-muted">
                  {track.genre}
                </span>
              )}
            </div>

            <h1 className="az-headline mb-2 text-3xl text-az-ink sm:text-4xl">
              {track?.title || 'Track'}
            </h1>

            {track?.artist && (
              <Link
                href={track.artistId ? `/music/artists/${track.artistId}` : '#'}
                className="az-subtitle mb-4 inline-block text-az-ink-muted transition-colors hover:text-az-ink"
              >
                {track.artist}
              </Link>
            )}

            {track?.album && (
              <p className="az-caption mb-2 text-az-ink-muted">Album: {track.album}</p>
            )}

            <div className="az-caption mb-6 flex items-center gap-4 text-az-ink-muted">
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
              className="mb-6 flex size-16 items-center justify-center rounded-full bg-az-flame text-az-surface-root"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? (
                <Pause size={24} className="ml-1" aria-hidden="true" />
              ) : (
                <Play size={24} className="ml-1" aria-hidden="true" />
              )}
            </motion.button>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                className="az-body-strong inline-flex items-center gap-2 rounded-az-pill border border-az-ink/20 px-4 py-2 text-az-ink transition-all hover:bg-az-ink/5"
              >
                <Heart size={16} aria-hidden="true" />
                Like
              </button>
              <ShareButton
                contentId={track?.id || ''}
                title={track?.title || ''}
                description={track?.artist ? `${track.title} by ${track.artist}` : track?.title}
                thumbnail={track?.thumbnail || ''}
                className="px-4 py-2 rounded-az-pill"
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
                className="az-body-strong inline-flex items-center gap-2 rounded-az-pill border border-az-ink/20 px-4 py-2 text-az-ink transition-all hover:bg-az-ink/5"
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
              <h2 className="az-title mb-4 text-az-ink">Lyrics</h2>
              <div className="az-glass p-6">
                <pre className="az-body whitespace-pre-wrap font-sans leading-relaxed text-az-ink-muted">
                  {track.lyrics}
                </pre>
              </div>
            </section>
          </ScrollReveal>
        )}
      </div>

      {/* Reviews Section */}
      <section className="py-8">
        <ReviewsSection contentId={track?.id || ''} />
      </section>
    </PageShell>
  );
}
