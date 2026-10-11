'use client';
import { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import { OptimizedImage } from '@/components/OptimizedImage';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { ChevronLeft, Loader2, Lock, Play } from 'lucide-react';

interface Episode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  seasonNumber: number;
  duration: number;
  thumbnail: string;
  releaseDate: string;
  isLocked: boolean;
}

interface Season {
  seasonNumber: number;
  episodes: Episode[];
}

/* Season tabs: the active tab is the primary CTA, idle tabs are frosted chips.
   Kept as module constants because `az-btn-primary` and the chip padding
   utility cannot share one className expression (see no-dead-class-override). */
const SEASON_TAB_ACTIVE =
  'az-btn-primary az-btn-primary--sm az-btn-primary--inline whitespace-nowrap transition-all';
const SEASON_TAB_IDLE =
  'az-chip az-body-strong whitespace-nowrap px-4 py-2 text-az-ink transition-all';

export default function EpisodesPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = searchParams.get('contentId') || '';
  const contentTitle = searchParams.get('title') || 'Reality Show';
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!contentId) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await apiFetch<{ seasons: Season[] }>(`/v1/content/${contentId}/episodes`);
        if (result.success && result.data) {
          setSeasons(result.data.seasons || []);
        }
      } catch (err) {
        webLogger.error('Failed to load episodes', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEpisodes();
  }, [contentId]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const handleEpisodeClick = (episode: Episode): void => {
    if (episode.isLocked) return;
    router.push(`/reality/episode?id=${episode.id}&contentId=${contentId}`);
  };

  const currentSeason = seasons.find((s) => s.seasonNumber === selectedSeason);

  if (isLoading) {
    return (
      <PageShell activeNav="Reality" maxWidth="xl">
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto size-12 animate-spin text-az-flame" aria-hidden="true" />
            <p className="az-body mt-4 text-az-ink-muted">Loading episodes...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="Reality" maxWidth="xl">
      <PageHero
        eyebrow="Reality"
        title={contentTitle}
        subtitle="Episodes"
        actions={
          <button
            type="button"
            onClick={() => router.back()}
            className="az-body-strong inline-flex items-center gap-2 text-az-ink-muted transition-colors hover:text-az-ink"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
            Back
          </button>
        }
      />

      <div className="mb-6">
        <div
          className="scrollbar-hide flex gap-2 overflow-x-auto pb-2"
          role="listbox"
          aria-label="Seasons"
        >
          {seasons.map((season) => (
            <button
              key={season.seasonNumber}
              onClick={() => setSelectedSeason(season.seasonNumber)}
              role="option"
              aria-selected={selectedSeason === season.seasonNumber}
              className={
                selectedSeason === season.seasonNumber ? SEASON_TAB_ACTIVE : SEASON_TAB_IDLE
              }
            >
              Season {season.seasonNumber}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {currentSeason?.episodes.map((episode) => (
          <div
            key={episode.id}
            onClick={() => handleEpisodeClick(episode)}
            className={`az-glass flex gap-4 overflow-hidden transition-all group ${
              episode.isLocked
                ? 'opacity-60 cursor-not-allowed'
                : 'cursor-pointer hover:scale-[1.01]'
            }`}
          >
            <div className="relative w-48 h-28 flex-shrink-0">
              <OptimizedImage
                src={episode.thumbnail}
                alt={episode.title}
                fill
                className="w-full h-full object-cover"
              />
              {episode.isLocked ? (
                <div className="absolute inset-0 flex items-center justify-center bg-az-surface-root/60">
                  <div className="flex size-10 items-center justify-center rounded-full border border-az-ink/20 bg-az-surface-root/70 text-az-ink/70 shadow-az-lifted">
                    <Lock size={18} aria-hidden="true" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-az-surface-root/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex size-10 items-center justify-center rounded-full bg-az-flame/90 text-az-ink shadow-az-glow">
                    <Play size={18} className="ml-0.5 fill-az-ink" aria-hidden="true" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="az-overline text-az-flame">
                  E{episode.episodeNumber.toString().padStart(2, '0')}
                </span>
                <span className="az-caption text-az-ink-muted">
                  {formatDuration(episode.duration)}
                </span>
              </div>
              <h3 className="az-subtitle mb-1 truncate text-az-ink">{episode.title}</h3>
              <p className="az-body mb-2 line-clamp-2 text-az-ink-muted">{episode.description}</p>
              <p className="az-caption text-az-ink/40">{formatDate(episode.releaseDate)}</p>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
