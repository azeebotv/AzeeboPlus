import { useState, useCallback, useEffect, useRef } from 'react';

interface UseVideoPlayerOptions {
  contentId: string;
  initialProgress?: number;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

interface UseVideoPlayerReturn {
  isPlaying: boolean;
  isBuffering: boolean;
  isFullscreen: boolean;
  currentTime: number;
  duration: number;
  showControls: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  seekForward: (seconds?: number) => void;
  seekBackward: (seconds?: number) => void;
  toggleFullscreen: () => void;
  setShowControls: (show: boolean) => void;
  setDuration: (duration: number) => void;
  formatTime: (seconds: number) => string;
}

export function useVideoPlayer({
  contentId: _contentId,
  initialProgress = 0,
  onProgressUpdate,
  onComplete,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialProgress);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(initialProgress);
  }, [initialProgress]);

  useEffect(() => {
    const cleanup = (): void => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
    return cleanup;
  }, []);

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= duration && duration > 0) {
          onComplete?.();
          setIsPlaying(false);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
        if (onProgressUpdate) {
          onProgressUpdate(newTime);
        }
        return newTime;
      });
    }, 1000);
  }, [duration, onProgressUpdate, onComplete]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const play = useCallback(() => {
    setIsPlaying(true);
    setIsBuffering(false);
    setError(null);
    startProgressTracking();
    scheduleHideControls();
  }, [startProgressTracking, scheduleHideControls]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stopProgressTracking();
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
  }, [stopProgressTracking]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, duration));
      setCurrentTime(clampedTime);
      if (onProgressUpdate) {
        onProgressUpdate(clampedTime);
      }
    },
    [duration, onProgressUpdate]
  );

  const seekForward = useCallback(
    (seconds = 10) => {
      seek(currentTime + seconds);
    },
    [currentTime, seek]
  );

  const seekBackward = useCallback(
    (seconds = 10) => {
      seek(currentTime - seconds);
    },
    [currentTime, seek]
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isPlaying,
    isBuffering,
    isFullscreen,
    currentTime,
    duration,
    showControls,
    error,
    play,
    pause,
    togglePlay,
    seek,
    seekForward,
    seekBackward,
    toggleFullscreen,
    setShowControls,
    setDuration,
    formatTime,
  };
}
