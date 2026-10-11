'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { PageShell } from '@/components/layout/PageShell';
import { ArrowLeft, Loader2, Pause, Play } from 'lucide-react';
import Link from 'next/link';

interface EpisodeDetail {
  id: string;
  title: string;
  description: string;
  seasonNumber: number;
  episodeNumber: number;
  duration: number;
  thumbnail: string;
  videoUrl: string;
  subtitles: string[];
}

export default function RealityDynamicEpisodePlayerPage(): React.JSX.Element {
  const params = useParams();
  const episodeId = (params.id as string) || '';
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchEpisode = async () => {
      if (!episodeId) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await apiFetch<EpisodeDetail>(`/v1/reality/episodes/${episodeId}`);
        if (result.success && result.data) {
          setEpisode(result.data);
        } else {
          const fallback = await apiFetch<EpisodeDetail>(`/v1/content/episode/${episodeId}`);
          if (fallback.success && fallback.data) setEpisode(fallback.data);
          else setError(result.message || 'Episode not found');
        }
      } catch (error) {
        webLogger.error('Failed to load episode', error);
        setError('Failed to load episode');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEpisode();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [episodeId]);

  const togglePlay = () => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (episode && prev >= episode.duration) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsPlaying(false);
            return episode.duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <PageShell activeNav="Reality" maxWidth="xl">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto size-12 animate-spin text-az-flame" aria-hidden="true" />
            <p className="az-body mt-4 text-az-ink-muted">Loading episode player...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!episode) {
    return (
      <PageShell activeNav="Reality" maxWidth="xl">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="az-title mb-4 text-az-ink">Episode not found</p>
            <Link href="/reality" className="az-btn-primary az-btn-primary--inline inline-block">
              Back to Reality Shows
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="Reality" maxWidth="xl">
      <Link
        href="/reality"
        className="az-body-strong mb-6 inline-flex items-center gap-1.5 text-az-ink-muted transition-colors hover:text-az-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Reality Shows
      </Link>

      {/* Video Player Box */}
      <div className="relative mb-6 flex aspect-video items-center justify-center overflow-hidden rounded-az-feature border border-az-glass-border bg-az-surface-root shadow-az-lifted">
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={togglePlay}
            className="flex size-20 items-center justify-center rounded-full bg-az-flame/90 text-az-ink shadow-az-glow transition-transform hover:scale-110 hover:bg-az-flame"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="size-8" aria-hidden="true" />
            ) : (
              <Play className="size-8 fill-az-ink" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Bottom Player Controls */}
        <div className="az-scrim--hero absolute bottom-0 left-0 right-0 p-4">
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-az-pill bg-az-ink/20">
            <div
              className="h-full rounded-az-pill bg-az-flame transition-all"
              style={{ width: `${(currentTime / (episode.duration || 1)) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="az-caption text-az-ink/70">
              {formatTime(currentTime)} / {formatTime(episode.duration || 0)}
            </span>
            <span className="az-overline text-az-ink">
              Season {episode.seasonNumber} Episode {episode.episodeNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Episode Info */}
      <div className="az-glass space-y-4 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="az-overline mb-2 inline-block rounded-az-pill bg-az-flame px-3 py-1 text-az-ink">
              Reality S{episode.seasonNumber} E{episode.episodeNumber}
            </span>
            <h1 className="az-headline text-2xl text-az-ink sm:text-3xl">{episode.title}</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/vote" className="az-btn-primary az-btn-primary--inline inline-block">
              Vote in This Episode
            </Link>
          </div>
        </div>

        <p className="az-lead leading-relaxed text-az-ink-muted">{episode.description}</p>
      </div>
    </PageShell>
  );
}
