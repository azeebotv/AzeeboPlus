'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface VideoQuality {
  label: string;
  url: string;
  height: number;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  isLoading: boolean;
  error: string | null;
  quality: string;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
}

interface UseVideoPlayerOptions {
  contentId: string;
  autoPlay?: boolean;
  startTime?: number;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

interface UseVideoPlayerReturn {
  state: VideoState;
  signedUrl: string | null;
  qualities: VideoQuality[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  setQuality: (quality: string) => void;
  refreshSignedUrl: () => Promise<void>;
}

export function useVideoPlayer({
  contentId,
  autoPlay = false,
  startTime = 0,
  onProgress,
  onEnded,
  onError,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { isAuthenticated } = useAuth();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [qualities] = useState<VideoQuality[]>([]);
  const [state, setState] = useState<VideoState>({
    isPlaying: false,
    currentTime: startTime,
    duration: 0,
    buffered: 0,
    isLoading: true,
    error: null,
    quality: 'auto',
    volume: 1,
    isMuted: false,
    isFullscreen: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshSignedUrl = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !contentId) {
      setState((prev) => ({ ...prev, error: 'Authentication required', isLoading: false }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await api.content.getSignedUrl(contentId);

      if (response.success && response.data) {
        setSignedUrl(response.data.signedUrl);
        setState((prev) => ({ ...prev, isLoading: false }));
      } else {
        const errorMsg = response.message || 'Failed to load video';
        setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
        onError?.(errorMsg);
      }
    } catch (error) {
      const errorMessage = 'Failed to load video';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
    }
  }, [isAuthenticated, contentId, onError]);

  useEffect(() => {
    refreshSignedUrl();
  }, [refreshSignedUrl]);

  useEffect(() => {
    if (autoPlay && signedUrl) {
      play();
    }
  }, [autoPlay, signedUrl]);

  useEffect(() => {
    if (state.isPlaying && onProgress) {
      progressIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
          onProgress(progress);
        }
      }, 10000);
    }

    return (): void => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [state.isPlaying, onProgress]);

  const play = useCallback((): void => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    setState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback((): void => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const seek = useCallback((time: number): void => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setState((prev) => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number): void => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
    setState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  const toggleMute = useCallback((): void => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, []);

  const toggleFullscreen = useCallback((): void => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
      setState((prev) => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen?.();
      setState((prev) => ({ ...prev, isFullscreen: false }));
    }
  }, []);

  const setQuality = useCallback((quality: string): void => {
    setState((prev) => ({ ...prev, quality }));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = (): void => {
      setState((prev) => ({ ...prev, currentTime: video.currentTime }));
    };

    const handleDurationChange = (): void => {
      setState((prev) => ({ ...prev, duration: video.duration }));
    };

    const handleProgress = (): void => {
      if (video.buffered.length > 0) {
        setState((prev) => ({
          ...prev,
          buffered: (video.buffered.end(video.buffered.length - 1) / video.duration) * 100,
        }));
      }
    };

    const handleEnded = (): void => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      onEnded?.();
    };

    const handleError = (): void => {
      const errorMessage = 'Video playback error occurred';
      setState((prev) => ({ ...prev, error: errorMessage, isPlaying: false }));
      onError?.(errorMessage);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return (): void => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [onEnded, onError]);

  return {
    state,
    signedUrl,
    qualities,
    videoRef,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    setQuality,
    refreshSignedUrl,
  };
}
