'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

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
  mediaUrl?: string;
  autoPlay?: boolean;
  startTime?: number;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

interface UseVideoPlayerReturn {
  state: VideoState;
  signedUrl: string | null;
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
  mediaUrl,
  autoPlay = false,
  startTime = 0,
  onProgress,
  onEnded,
  onError,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const { isAuthenticated } = useAuth();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  // Skip signed URL fetch for YouTube, iframe, and FTP content
  const isEmbeddedMedia = mediaUrl
    ? /youtube\.com\/watch|youtu\.be\/|iframe|ftp:\/\//.test(mediaUrl)
    : false;
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
  const fetchInProgressRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store callbacks in refs to avoid re-creating refreshSignedUrl on every render.
  // Without this, changing onError/onEnded triggers refreshSignedUrl recreation,
  // which triggers the useEffect([refreshSignedUrl]) to fire again, causing an
  // infinite loop of signed-url requests that exhausts browser connections.
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const refreshSignedUrl = useCallback(async (): Promise<void> => {
    // Skip signed URL fetch for embedded media (YouTube, iframe, FTP)
    // Also skip if mediaUrl hasn't loaded yet (undefined = content not fetched yet)
    if (isEmbeddedMedia) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    if (!isAuthenticated || !contentId) {
      setState((prev) => ({ ...prev, error: 'Authentication required', isLoading: false }));
      return;
    }

    // Prevent duplicate concurrent requests
    if (fetchInProgressRef.current) {
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchInProgressRef.current = true;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const response = await api.content.getSignedUrl(contentId);

      // Check if request was aborted
      if (controller.signal.aborted) {
        return;
      }

      if (response.success && response.data) {
        setSignedUrl(response.data.signedUrl);
        setState((prev) => ({ ...prev, isLoading: false }));
      } else {
        const errorMsg = response.message || 'Failed to load video';
        setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
        onErrorRef.current?.(errorMsg);
      }
    } catch (error) {
      // Don't update state if request was aborted
      if (controller.signal.aborted) {
        return;
      }
      const errorMessage = 'Failed to load video';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      onErrorRef.current?.(errorMessage);
    } finally {
      fetchInProgressRef.current = false;
    }
  }, [isAuthenticated, contentId, isEmbeddedMedia]);

  useEffect(() => {
    refreshSignedUrl();

    return () => {
      // Cleanup: abort any in-flight request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refreshSignedUrl]);

  useEffect(() => {
    if (autoPlay && signedUrl) {
      play();
    }
  }, [autoPlay, signedUrl]);

  useEffect(() => {
    if (state.isPlaying && onProgressRef.current) {
      progressIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          const duration = videoRef.current.duration;
          if (duration && duration > 0 && !isNaN(duration)) {
            const progress = (videoRef.current.currentTime / duration) * 100;
            onProgressRef.current?.(progress);
          }
        }
      }, 10000);
    }

    return (): void => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [state.isPlaying]);

  const play = useCallback((): void => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          setState((prev) => ({ ...prev, isPlaying: true }));
        })
        .catch((_error) => {
          // Video play failed — state updated below
          setState((prev) => ({ ...prev, isPlaying: false }));
        });
    }
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
      container.requestFullscreen?.().catch(() => {
        /* Fullscreen request denied by browser or user */
      });
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
      onEndedRef.current?.();
    };

    const handleError = (): void => {
      const errorMessage = 'Video playback error occurred';
      setState((prev) => ({ ...prev, error: errorMessage, isPlaying: false }));
      onErrorRef.current?.(errorMessage);
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
  }, []);

  return {
    state,
    signedUrl,
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
