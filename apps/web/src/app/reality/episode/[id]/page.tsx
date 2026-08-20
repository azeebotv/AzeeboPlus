'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader active="Reality" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-orange)] mx-auto" />
            <p className="mt-4 text-white/60">Loading episode player...</p>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader active="Reality" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-white text-xl mb-4">Episode not found</p>
            <Link
              href="/reality"
              className="az-btn-primary inline-block"
              style={{ width: 'auto', paddingInline: '1.5rem' }}
            >
              Back to Reality Shows
            </Link>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}>
      <AppHeader active="Reality" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Link
          href="/reality"
          className="text-sm text-white/50 hover:text-white mb-6 inline-flex items-center gap-1.5 transition-colors"
        >
          ← Back to Reality Shows
        </Link>

        {/* Video Player Box */}
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black mb-6 shadow-2xl border border-white/10 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-[var(--brand-orange)]/90 hover:bg-[var(--brand-orange)] text-white text-3xl font-bold flex items-center justify-center shadow-2xl transition-transform hover:scale-110"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          {/* Bottom Player Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-3">
              <div
                className="bg-[var(--brand-orange)] h-full transition-all"
                style={{ width: `${(currentTime / (episode.duration || 1)) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{formatTime(currentTime)} / {formatTime(episode.duration || 0)}</span>
              <span className="font-semibold text-white">Season {episode.seasonNumber} Episode {episode.episodeNumber}</span>
            </div>
          </div>
        </div>

        {/* Episode Info */}
        <div className="az-glass p-8 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--brand-orange)] text-white uppercase tracking-wider mb-2 inline-block">
                Reality S{episode.seasonNumber} E{episode.episodeNumber}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{episode.title}</h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/vote"
                className="px-6 py-2.5 rounded-full font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))' }}
              >
                Vote in This Episode
              </Link>
            </div>
          </div>

          <p className="text-white/60 leading-relaxed">{episode.description}</p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
