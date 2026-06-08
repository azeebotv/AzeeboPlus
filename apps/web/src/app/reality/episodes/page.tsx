'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

const PLACEHOLDER_THUMBNAIL = 'https://via.placeholder.com/300x170';

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

export default function EpisodesPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = searchParams.get('id') || '';

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [contentTitle, setContentTitle] = useState<string>('Reality Show');

  useEffect(() => {
    loadEpisodes();
  }, [contentId]);

  const loadEpisodes = async (): Promise<void> => {
    try {
      const result = await apiFetch<{ title?: string }>(`/v1/content/${contentId}`);

      if (result.success && result.data) {
        const content = result.data;
        setContentTitle(content.title || 'Reality Show');

        const mockSeasons: Season[] = [
          {
            seasonNumber: 1,
            episodes: [
              {
                id: 'ep1',
                title: 'Premiere Episode',
                description: 'The journey begins with 20 contestants entering the house',
                episodeNumber: 1,
                seasonNumber: 1,
                duration: 3600,
                thumbnail: PLACEHOLDER_THUMBNAIL,
                releaseDate: '2026-01-15',
                isLocked: false,
              },
              {
                id: 'ep2',
                title: 'First Eviction',
                description: 'Tensions rise as the first eviction approaches',
                episodeNumber: 2,
                seasonNumber: 1,
                duration: 3600,
                thumbnail: PLACEHOLDER_THUMBNAIL,
                releaseDate: '2026-01-22',
                isLocked: false,
              },
              {
                id: 'ep3',
                title: 'Alliance Formation',
                description: 'New alliances form as the game intensifies',
                episodeNumber: 3,
                seasonNumber: 1,
                duration: 3600,
                thumbnail: PLACEHOLDER_THUMBNAIL,
                releaseDate: '2026-01-29',
                isLocked: true,
              },
              {
                id: 'ep4',
                title: 'Mid-Season Twist',
                description: 'A surprise twist changes everything',
                episodeNumber: 4,
                seasonNumber: 1,
                duration: 3600,
                thumbnail: PLACEHOLDER_THUMBNAIL,
                releaseDate: '2026-02-05',
                isLocked: true,
              },
            ],
          },
          {
            seasonNumber: 2,
            episodes: [
              {
                id: 'ep5',
                title: 'Season 2 Premiere',
                description: 'New contestants, new drama',
                episodeNumber: 1,
                seasonNumber: 2,
                duration: 3600,
                thumbnail: PLACEHOLDER_THUMBNAIL,
                releaseDate: '2026-03-01',
                isLocked: true,
              },
            ],
          },
        ];

        setSeasons(mockSeasons);
      }
    } catch (error) {
      webLogger.error('Failed to load episodes', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleEpisodeClick = (episode: Episode): void => {
    if (episode.isLocked) {
      return;
    }
    router.push(`/reality/episode?id=${episode.id}&contentId=${contentId}`);
  };

  const currentSeason = seasons.find((s) => s.seasonNumber === selectedSeason);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading episodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">{contentTitle}</h1>
          <p className="text-muted-foreground mt-1">Episodes</p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {seasons.map((season) => (
              <button
                key={season.seasonNumber}
                onClick={() => setSelectedSeason(season.seasonNumber)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSeason === season.seasonNumber
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-foreground hover:bg-accent'
                }`}
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
              className={`flex gap-4 bg-card rounded-lg border border-border overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                episode.isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary'
              }`}
            >
              <div className="relative w-48 h-28 flex-shrink-0">
                <img
                  src={episode.thumbnail}
                  alt={episode.title}
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
                  <span className="text-xs font-semibold text-primary">
                    E{episode.episodeNumber.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(episode.duration)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {episode.title}
                </h3>

                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {episode.description}
                </p>

                <p className="text-xs text-muted-foreground">
                  {formatDate(episode.releaseDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
