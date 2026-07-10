import { useState, useCallback, useEffect, useRef } from 'react';
import { useVideoPlayer, type VideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { contentApi } from '../api';

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
  videoSource: string | null;
  player: VideoPlayer;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  seekForward: (seconds?: number) => void;
  seekBackward: (seconds?: number) => void;
  toggleFullscreen: () => void;
  setShowControls: (show: boolean) => void;
  formatTime: (seconds: number) => string;
}

export function useAzeeboVideoPlayer({
  contentId,
  initialProgress = 0,
  onProgressUpdate,
  onComplete,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<string | null>(null);

  const player = useVideoPlayer(null, (p) => {
    p.timeUpdateEventInterval = 1;
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  const timeUpdate = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    targetOffsetFromLive: 0,
    bufferedPosition: 0,
  });

  const currentTime = timeUpdate?.currentTime ?? player.currentTime;

  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (status === 'readyToPlay') {
      setDuration(player.duration);
    }
  }, [status, player]);

  useEffect(() => {
    if (!contentId) return;

    let cancelled = false;

    const fetchSignedUrl = async () => {
      try {
        setIsBuffering(true);
        setError(null);
        const response = await contentApi.getSignedUrl(contentId);
        if (cancelled) return;

        if (response.success && response.data) {
          setVideoSource(response.data.signedUrl);
        } else {
          setError(response.message || 'Failed to load video');
        }
      } catch {
        if (!cancelled) setError('Failed to load video');
      } finally {
        if (!cancelled) setIsBuffering(false);
      }
    };

    fetchSignedUrl();
    return () => { cancelled = true; };
  }, [contentId]);

  useEffect(() => {
    if (!videoSource) return;

    player.replaceAsync(videoSource).then(() => {
      if (initialProgress > 0) {
        player.currentTime = initialProgress;
      }
    });
  }, [videoSource, player, initialProgress]);

  useEffect(() => {
    if (status === 'error') {
      setError('Playback error occurred');
    }
  }, [status]);

  useEffect(() => {
    if (onProgressUpdate && isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        onProgressUpdate(player.currentTime);
      }, 10000);
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, onProgressUpdate, player]);

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      onComplete?.();
    });
    return () => sub.remove();
  }, [player, onComplete]);

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

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  const play = useCallback(() => {
    player.play();
    setIsBuffering(false);
    setError(null);
    scheduleHideControls();
  }, [player, scheduleHideControls]);

  const pause = useCallback(() => {
    player.pause();
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
  }, [player]);

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
      player.currentTime = clampedTime;
      onProgressUpdate?.(clampedTime);
    },
    [player, duration, onProgressUpdate]
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
    videoSource,
    player,
    play,
    pause,
    togglePlay,
    seek,
    seekForward,
    seekBackward,
    toggleFullscreen,
    setShowControls,
    formatTime,
  };
}
