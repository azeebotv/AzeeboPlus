'use client';
import { useEffect, useState } from 'react';

export const metadata = {
  title: 'Episodes | Azeebo',
  description: 'Browse and watch episodes from your favorite reality shows on Azeebo.',
  openGraph: {
    title: 'Episodes | Azeebo',
    description: 'Browse and watch episodes from your favorite reality shows on Azeebo.',
  },
};
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import { OptimizedImage } from '@/components/OptimizedImage';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--brand-orange)' }}
            />
            <p className="mt-4 text-white/60">Loading episodes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-white/50 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">{contentTitle}</h1>
          <p className="text-white/50 mt-1">Episodes</p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2" role="listbox" aria-label="Seasons">
            {seasons.map((season) => (
              <button
                key={season.seasonNumber}
                onClick={() => setSelectedSeason(season.seasonNumber)}
                role="option"
                aria-selected={selectedSeason === season.seasonNumber}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedSeason === season.seasonNumber ? 'az-btn-primary' : ''
                }`}
                style={
                  selectedSeason !== season.seasonNumber
                    ? {
                        border: '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        color: 'var(--brand-white)',
                      }
                    : undefined
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
              className={`az-glass flex gap-4 overflow-hidden transition-all ${
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
                {episode.isLocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-3xl">🔒</span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--brand-orange)' }}>
                    E{episode.episodeNumber.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-white/50">{formatDuration(episode.duration)}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{episode.title}</h3>
                <p className="text-sm text-white/50 mb-2 line-clamp-2">{episode.description}</p>
                <p className="text-xs text-white/40">{formatDate(episode.releaseDate)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
