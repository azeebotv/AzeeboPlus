'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import AppHeader from '@/components/layout/AppHeader';
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--brand-orange)',
              }}
            />
            <p className="mt-4 text-white/60">Loading episode...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <p className="text-white text-xl mb-4">Episode not found</p>
            <button
              onClick={() => router.back()}
              className="az-btn-primary"
              style={{ width: 'auto', paddingInline: '1.5rem' }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = episode.duration > 0 ? (currentTime / episode.duration) * 100 : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <div className="max-w-6xl mx-auto pt-4 px-4">
        <button
          onClick={() => router.back()}
          className="text-white/50 hover:text-white flex items-center gap-2 mb-4 transition-colors"
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

        <div className="relative aspect-video rounded-xl overflow-hidden az-glass">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-white text-2xl font-bold mb-2">{episode.title}</h2>
              <p className="text-white/50">
                S{episode.seasonNumber} E{episode.episodeNumber}
              </p>
              {isPlaying ? (
                <div className="flex items-end gap-1 h-10 mt-4 justify-center">
                  <div
                    className="w-1 animate-pulse h-5"
                    style={{ backgroundColor: 'var(--brand-orange)' }}
                  />
                  <div
                    className="w-1 animate-pulse h-8"
                    style={{ backgroundColor: 'var(--brand-orange)', animationDelay: '0.2s' }}
                  />
                  <div
                    className="w-1 animate-pulse h-6"
                    style={{ backgroundColor: 'var(--brand-orange)', animationDelay: '0.4s' }}
                  />
                </div>
              ) : (
                <button
                  onClick={handlePlayPause}
                  className="mt-4 w-20 h-20 rounded-full text-white text-4xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'rgba(232,66,10,0.8)' }}
                >
                  ▶
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div
              className="h-1 rounded-full mb-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: 'var(--brand-orange)' }}
              />
            </div>
            <div className="flex justify-between text-sm text-white/50">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(episode.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mb-6">
            <button
              onClick={() => handleSeek(-10)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors"
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'var(--brand-white)',
              }}
            >
              ⏪
            </button>
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 rounded-full text-white text-2xl flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'var(--brand-orange)' }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              onClick={() => handleSeek(10)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors"
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'var(--brand-white)',
              }}
            >
              ⏩
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowSubtitles(true)}
              className="flex-1 py-3 px-4 rounded-full font-medium transition-colors"
              style={{
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'var(--brand-white)',
              }}
            >
              💬 Subtitles
            </button>
            <button
              onClick={() => setShowVoteModal(true)}
              className="flex-1 py-3 px-4 rounded-full font-medium transition-colors az-btn-primary"
            >
              🗳 Vote
            </button>
          </div>

          <div className="pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-xl font-bold text-white mb-2">{episode.title}</h3>
            <p className="text-white/50 leading-relaxed">{episode.description}</p>
          </div>
        </div>
      </div>

      {showSubtitles && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Select Subtitles"
        >
          <div className="az-glass w-full max-w-md rounded-t-xl sm:rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Select Subtitles</h3>
              <button
                onClick={() => setShowSubtitles(false)}
                className="text-white/50 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {['Off', ...episode.subtitles].map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedSubtitle(sub === 'Off' ? null : sub);
                    setShowSubtitles(false);
                  }}
                  className={`w-full p-3 rounded-full text-left transition-all ${
                    (sub === 'Off' && !selectedSubtitle) || selectedSubtitle === sub
                      ? 'az-btn-primary'
                      : ''
                  }`}
                  style={
                    sub !== 'Off' && selectedSubtitle !== sub
                      ? {
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          color: 'var(--brand-white)',
                        }
                      : undefined
                  }
                >
                  {sub === 'Off' ? '🚫 Subtitles Off' : sub}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showVoteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vote"
        >
          <div className="az-glass rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-2">Vote for This Episode</h3>
            <p className="text-white/50 mb-6">Choose your voting option:</p>
            <div className="space-y-3">
              <button
                onClick={() => handleVote(false)}
                className="w-full py-3 px-4 rounded-full font-medium transition-colors"
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'var(--brand-white)',
                }}
              >
                Regular Vote (1x)
              </button>
              <button
                onClick={() => handleVote(true)}
                className="w-full py-3 px-4 rounded-full font-medium transition-colors az-btn-primary"
              >
                Super Vote (2x)
              </button>
              <button
                onClick={() => setShowVoteModal(false)}
                className="w-full py-3 px-4 text-white/50 hover:text-white transition-colors"
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
