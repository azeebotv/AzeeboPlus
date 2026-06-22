'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Episode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  seasonNumber: number;
  duration: number;
  videoUrl: string;
  subtitles?: Array<{ language: string; url: string }>;
}

export default function EpisodePlayerPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const episodeId = searchParams.get('id') || '';
  const contentId = searchParams.get('contentId') || '';

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(false);
  const [showVoteModal, setShowVoteModal] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadEpisode();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [episodeId]);

  const loadEpisode = async (): Promise<void> => {
    try {
      const result = await apiFetch<Episode>(`/v1/content/episodes/${episodeId}`);

      if (result.success && result.data) {
        setEpisode(result.data);
      }
    } catch (error) {
      webLogger.error('Failed to load episode', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = (): void => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } else {
      setIsPlaying(true);
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= (episode?.duration || 0)) {
            setIsPlaying(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleSeek = (seconds: number): void => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, episode?.duration || 0));
    setCurrentTime(newTime);
  };

  const handleVote = async (isSuper: boolean): Promise<void> => {
    try {
      const result = await apiFetch<unknown>('/v1/content/vote', {
        method: 'POST',
        body: JSON.stringify({
          episodeId,
          isSuperVote: isSuper,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit vote');
      }

      setShowVoteModal(false);
      alert(`Your ${isSuper ? 'Super ' : ''}vote has been submitted!`);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to submit vote');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-xl mb-4">Episode not found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-primary text-white rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const progress = (currentTime / episode.duration) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 pt-4 px-4">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
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
        </div>

        <div className="relative bg-black aspect-video rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-white text-2xl font-bold mb-2">{episode.title}</h2>
              <p className="text-gray-400">
                S{episode.seasonNumber} E{episode.episodeNumber}
              </p>

              {isPlaying ? (
                <div className="flex items-end gap-1 h-10 mt-4">
                  <div className="w-1 bg-primary animate-pulse h-5"></div>
                  <div
                    className="w-1 bg-primary animate-pulse h-8"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="w-1 bg-primary animate-pulse h-6"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                </div>
              ) : (
                <button
                  onClick={handlePlayPause}
                  className="mt-4 w-20 h-20 rounded-full bg-primary/80 text-white text-4xl flex items-center justify-center hover:bg-primary transition-colors"
                >
                  ▶
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="h-1 bg-muted rounded-full mb-2">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(episode.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mb-6">
            <button
              onClick={() => handleSeek(-10)}
              className="w-12 h-12 rounded-full bg-card border border-border text-foreground hover:bg-accent flex items-center justify-center text-xl"
            >
              ⏪
            </button>

            <button
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full bg-primary text-white text-2xl flex items-center justify-center hover:bg-primary/90"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button
              onClick={() => handleSeek(10)}
              className="w-12 h-12 rounded-full bg-card border border-border text-foreground hover:bg-accent flex items-center justify-center text-xl"
            >
              ⏩
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowSubtitles(true)}
              className="flex-1 py-3 px-4 bg-card border border-border rounded-md text-foreground hover:bg-accent font-medium"
            >
              💬 Subtitles
            </button>

            <button
              onClick={() => setShowVoteModal(true)}
              className="flex-1 py-3 px-4 bg-primary text-white rounded-md hover:bg-primary/90 font-medium"
            >
              🗳 Vote
            </button>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-xl font-bold text-foreground mb-2">{episode.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{episode.description}</p>
          </div>
        </div>
      </div>

      {showSubtitles && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-card w-full max-w-md rounded-t-lg sm:rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Select Subtitles</h3>
              <button
                onClick={() => setShowSubtitles(false)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedSubtitle(null);
                  setShowSubtitles(false);
                }}
                className={`w-full p-3 rounded-md text-left ${
                  !selectedSubtitle
                    ? 'bg-primary text-white'
                    : 'bg-muted text-foreground hover:bg-accent'
                }`}
              >
                Off
              </button>

              {episode.subtitles?.map((subtitle) => (
                <button
                  key={subtitle.language}
                  onClick={() => {
                    setSelectedSubtitle(subtitle.language);
                    setShowSubtitles(false);
                  }}
                  className={`w-full p-3 rounded-md text-left ${
                    selectedSubtitle === subtitle.language
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground hover:bg-accent'
                  }`}
                >
                  {subtitle.language}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showVoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-foreground mb-2">Vote for Contestant</h3>
            <p className="text-muted-foreground mb-6">Choose your voting option:</p>
            <div className="space-y-3">
              <button
                onClick={() => handleVote(false)}
                className="w-full py-3 px-4 bg-card border border-border text-foreground rounded-md hover:bg-accent font-medium"
              >
                Regular Vote (1x)
              </button>
              <button
                onClick={() => handleVote(true)}
                className="w-full py-3 px-4 bg-primary text-white rounded-md hover:bg-primary/90 font-medium"
              >
                Super Vote (2x)
              </button>
              <button
                onClick={() => setShowVoteModal(false)}
                className="w-full py-3 px-4 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
