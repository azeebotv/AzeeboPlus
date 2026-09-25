/**
 * TV video player hook.
 *
 * Wraps expo-video with the transport behaviors a TV remote expects:
 *  - center D-pad / Enter toggles play-pause
 *  - left/right arrows (and media rewind/fast-forward keys) seek ±10s
 *  - media play/pause/stop keys are handled natively by expo-video
 *
 * Progress reporting reuses the shared contentApi so watch history (and
 * therefore Continue Watching on every surface) stays in sync.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useVideoPlayer, type VideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { contentApi, setPlaybackActive, formatTime } from '@azeebo/react-data';
import { mapDPadKeyToAction } from './dPadMap';

export interface UseTVVideoPlayerOptions {
  contentId: string;
  initialProgress?: number;
  autoPlay?: boolean;
  onProgressUpdate?: (positionSeconds: number) => void;
  onComplete?: () => void;
}

export interface UseTVVideoPlayerReturn {
  player: VideoPlayer;
  isPlaying: boolean;
  isBuffering: boolean;
  error: string | null;
  /**
   * Classifies `error`: 'entitlement' means a 403 from the signed-url
   * endpoint (paywall — explain the upgrade path), 'generic' everything else.
   */
  errorKind: 'entitlement' | 'generic';
  videoSource: string | null;
  currentTime: number;
  duration: number;
  /** D-pad handlers — attach to the player surface Pressable. */
  handleDPad: (key: string) => void;
  togglePlay: () => void;
  seekBy: (seconds: number) => void;
  formatTime: (seconds: number) => string;
}

export function useTVVideoPlayer({
  contentId,
  initialProgress = 0,
  autoPlay = true,
  onProgressUpdate,
  onComplete,
}: UseTVVideoPlayerOptions): UseTVVideoPlayerReturn {
  const [error, setError] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useVideoPlayer(null, (p) => {
    p.timeUpdateEventInterval = 1;
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  // Register playback with the shared session-timeout exemption: while this
  // video is actually playing, the 30-min inactivity logout defers (it would
  // otherwise fire mid-episode, since TV playback produces no AppState change).
  useEffect(() => {
    setPlaybackActive(contentId, isPlaying);
    return () => setPlaybackActive(contentId, false);
  }, [contentId, isPlaying]);

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

  // Fetch the signed playback URL.
  // M4: a 403 from the signed-url endpoint means the account is not entitled
  // (premium content, no subscription). Surfaced as errorKind 'entitlement'
  // so the watch screen can explain the paywall instead of showing a generic
  // "Failed to load video" dead end.
  const [errorKind, setErrorKind] = useState<'entitlement' | 'generic'>('generic');

  useEffect(() => {
    if (!contentId) return;
    let cancelled = false;

    (async () => {
      try {
        setIsBuffering(true);
        setError(null);
        setErrorKind('generic');
        const response = await contentApi.getSignedUrl(contentId);
        if (cancelled) return;
        if (response.success && response.data) {
          setVideoSource(response.data.signedUrl);
        } else {
          setError(response.message || 'Failed to load video');
        }
      } catch (err) {
        if (cancelled) return;
        if ((err as { status?: number }).status === 403) {
          setErrorKind('entitlement');
          setError('This title is included with Azeebo+ Premium.');
        } else {
          setError('Failed to load video');
        }
      } finally {
        if (!cancelled) setIsBuffering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contentId]);

  // Load source and resume from initialProgress
  const sourceLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!videoSource) return;
    if (sourceLoadedRef.current === videoSource) return;
    sourceLoadedRef.current = videoSource;

    player
      .replaceAsync(videoSource)
      .then(() => {
        if (initialProgress > 0) {
          player.currentTime = initialProgress;
        }
        setDuration(player.duration);
        if (autoPlay) {
          player.play();
        }
      })
      .catch(() => {
        if (!cancelledGuard.current) setError('Playback error occurred');
      });
  }, [videoSource, player, initialProgress, autoPlay]);

  const cancelledGuard = useRef(false);
  useEffect(() => {
    cancelledGuard.current = false;
    return () => {
      cancelledGuard.current = true;
    };
  }, []);

  useEffect(() => {
    if (status === 'error') {
      setError('Playback error occurred');
    }
  }, [status]);

  // Progress reporting with dedupe (parity with the mobile hook): a single
  // flush path skips no-op writes when the position hasn't advanced, so the
  // 10s interval after a transient pause doesn't POST identical positions.
  const onProgressUpdateRef = useRef(onProgressUpdate);
  onProgressUpdateRef.current = onProgressUpdate;
  const lastSavedPositionRef = useRef(0);

  const flushProgress = useCallback(() => {
    const position = player.currentTime;
    if (onProgressUpdateRef.current && position > 0 && position !== lastSavedPositionRef.current) {
      lastSavedPositionRef.current = position;
      onProgressUpdateRef.current(position);
    }
  }, [player]);

  // Periodic progress reporting while playing, plus a final flush on pause
  useEffect(() => {
    if (onProgressUpdate && isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        flushProgress();
      }, 10000);
    }
    if (!isPlaying && onProgressUpdate && player.currentTime > 0) {
      flushProgress();
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, onProgressUpdate, player, flushProgress]);

  // Final flush on unmount — backing out of the player mid-playback must not
  // lose up to 10s of progress (the interval only covers in-screen playback).
  useEffect(() => {
    return () => {
      flushProgress();
    };
  }, [flushProgress]);

  // Play-to-end callback
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      flushProgress();
      onComplete?.();
    });
    return () => sub.remove();
  }, [player, onComplete, flushProgress]);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const seekBy = useCallback(
    (seconds: number) => {
      const next = Math.max(0, Math.min(player.currentTime + seconds, duration || player.duration));
      player.currentTime = next;
      flushProgress();
    },
    [player, duration, flushProgress]
  );

  /**
   * D-pad key handling. Attach via onKeyUp on the player surface.
   * Key names follow React Native's Keyboard events on Android TV /
   * tvOS ("Select", "Right", "Left", "MediaPlayPause", …).
   */
  const handleDPad = useCallback(
    (key: string) => {
      const action = mapDPadKeyToAction(key);
      if (action === 'togglePlay') {
        togglePlay();
      } else if (action === 'seekForward') {
        seekBy(10);
      } else if (action === 'seekBackward') {
        seekBy(-10);
      }
    },
    [togglePlay, seekBy]
  );

  // formatTime is shared with mobile via @azeebo/react-data/utils/format.

  return {
    player,
    isPlaying,
    isBuffering,
    error,
    errorKind,
    videoSource,
    currentTime,
    duration: duration || player.duration,
    handleDPad,
    togglePlay,
    seekBy,
    formatTime,
  };
}
