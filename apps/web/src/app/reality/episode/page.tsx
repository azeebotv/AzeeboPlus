'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import PageShell from '@/components/layout/PageShell';
import { useToast } from '@/components/ToastProvider';

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

export default function EpisodePlayerPage(): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const episodeId = searchParams.get('id') || '';
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchEpisode = async () => {
      if (!episodeId) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await apiFetch<EpisodeDetail>(`/v1/content/episode/${episodeId}`);
        if (result.success && result.data) {
          setEpisode(result.data);
        } else {
          setError(result.message || 'Episode not found');
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

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = useCallback((): void => {
    setIsPlaying((prev) => {
      if (!prev) {
        timerRef.current = setInterval(() => {
          setCurrentTime((prevTime) => {
            if (prevTime >= (episode?.duration || 0)) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 0;
            }
            return prevTime + 1;
          });
        }, 1000);
      } else if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return !prev;
    });
  }, [episode?.duration]);

  const handleSeek = (seconds: number): void => {
    setCurrentTime((prev) => Math.max(0, Math.min(prev + seconds, episode?.duration || 0)));
  };

  const handleVote = async (isSuper: boolean): Promise<void> => {
    try {
      const result = await apiFetch('/reality/votes', {
        method: 'POST',
        body: JSON.stringify({ episodeId, isSuperVote: isSuper }),
      });
      if (!result.success) throw new Error(result.message || 'Failed to submit vote');
      setShowVoteModal(false);
      toast.showToast(`Your ${isSuper ? 'Super ' : ''}vote has been submitted!`, 'success');
    } catch (error: unknown) {
      toast.showToast(error instanceof Error ? error.message : 'Failed to submit vote', 'error');
    }
  };

  if (isLoading) {
    return (
      <PageShell maxWidth="2xl" showFooter={false}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-az-ink/10 border-t-az-flame" />
            <p className="az-body mt-4 text-az-ink-muted">Loading episode...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!episode) {
    return (
      <PageShell maxWidth="2xl" showFooter={false}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="az-title mb-4 text-az-ink">Episode not found</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="az-btn-primary az-btn-primary--inline az-btn-primary--sm"
            >
              Go Back
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  const progress = episode.duration > 0 ? (currentTime / episode.duration) * 100 : 0;

  return (
    <PageShell maxWidth="2xl" showFooter={false}>
      <button
        type="button"
        onClick={() => router.back()}
        className="az-body mb-4 flex items-center gap-2 text-az-ink-muted transition-colors hover:text-az-ink"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        Back
      </button>

      <div className="az-glass relative aspect-video overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="az-section-title mb-2 text-az-ink">{episode.title}</h2>
            <p className="az-body text-az-ink-muted">
              S{episode.seasonNumber} E{episode.episodeNumber}
            </p>
            {isPlaying ? (
              <div className="mt-4 flex h-10 items-end justify-center gap-1">
                <div className="h-5 w-1 animate-pulse bg-az-flame" />
                <div className="h-8 w-1 animate-pulse bg-az-flame [animation-delay:200ms]" />
                <div className="h-6 w-1 animate-pulse bg-az-flame [animation-delay:400ms]" />
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePlayPause}
                className="mt-4 flex h-20 w-20 items-center justify-center rounded-full bg-az-scarlet/80 text-4xl text-az-ink transition-colors"
              >
                Play
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="mb-2 h-1 rounded-full bg-az-ink/10">
            <div
              className="h-full rounded-full bg-az-flame transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="az-body flex justify-between text-az-ink-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(episode.duration)}</span>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={() => handleSeek(-10)}
            className="az-chip flex h-12 w-12 items-center justify-center text-xl text-az-ink transition-colors"
          >
            Rewind
          </button>
          <button
            type="button"
            onClick={handlePlayPause}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-az-flame text-2xl text-az-ink transition-colors"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => handleSeek(10)}
            className="az-chip flex h-12 w-12 items-center justify-center text-xl text-az-ink transition-colors"
          >
            FastForward
          </button>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            type="button"
            onClick={() => setShowSubtitles(true)}
            className="az-chip flex-1 px-4 py-3 font-medium text-az-ink transition-colors"
          >
            MessageCircleSubtitles
          </button>
          <button
            type="button"
            onClick={() => setShowVoteModal(true)}
            className="az-btn-primary flex-1"
          >
            VoteVote
          </button>
        </div>

        <div className="border-t border-az-ink/10 pt-6">
          <h3 className="az-title mb-2 text-az-ink">{episode.title}</h3>
          <p className="az-lead text-az-ink-muted">{episode.description}</p>
        </div>
      </div>

      {showSubtitles && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Select Subtitles"
        >
          <div className="az-glass w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="az-subtitle text-az-ink">Select Subtitles</h3>
              <button
                type="button"
                onClick={() => setShowSubtitles(false)}
                className="az-subtitle text-az-ink-muted transition-colors hover:text-az-ink"
                aria-label="Close subtitles"
              >
                X
              </button>
            </div>
            <div className="space-y-2">
              {['Off', ...episode.subtitles].map((sub) => {
                const isActive = (sub === 'Off' && !selectedSubtitle) || selectedSubtitle === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setSelectedSubtitle(sub === 'Off' ? null : sub);
                      setShowSubtitles(false);
                    }}
                    className={`w-full text-left transition-all ${
                      isActive ? 'az-btn-primary' : 'az-chip text-az-ink'
                    }`}
                  >
                    {sub === 'Off' ? 'Ban Subtitles Off' : sub}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showVoteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vote"
        >
          <div className="az-glass w-full max-w-md p-6">
            <h3 className="az-title mb-2 text-az-ink">Vote for This Episode</h3>
            <p className="az-body mb-6 text-az-ink-muted">Choose your voting option:</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void handleVote(false)}
                className="az-chip w-full px-4 py-3 font-medium text-az-ink transition-colors"
              >
                Regular Vote (1x)
              </button>
              <button
                type="button"
                onClick={() => void handleVote(true)}
                className="az-btn-primary"
              >
                Super Vote (2x)
              </button>
              <button
                type="button"
                onClick={() => setShowVoteModal(false)}
                className="az-body w-full px-4 py-3 text-az-ink-muted transition-colors hover:text-az-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
