/**
 * Shared-instance video player hook — the screen-level face of the global
 * VideoPlayerProvider (PiP backbone).
 *
 * Every player screen (watch, comedy) calls this hook, and they all get the
 * SAME underlying expo-video player. That is what makes the mini player
 * work: when the owning screen blurs while playing, the provider flips to
 * mini mode and the video keeps running over the next screen.
 *
 * Semantics:
 *  - On focus the screen claims the player for its content; blur while
 *    playing schedules the mini overlay; re-focus dismisses it.
 *  - While the mini overlay shows THIS content, the screen renders without
 *    a VideoView (the overlay owns the only surface) and stays quiescent.
 *  - Progress is flushed on pause, blur, and unmount — including the
 *    navigate-away-while-playing case, which previously lost the final
 *    position (Continue Watching resumed from the last 10s tick).
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { StatusBar as RNStatusBar } from 'react-native';
import { type VideoPlayer } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { contentApi, setPlaybackActive, formatTime } from '@azeebo/react-data';
import { useSharedVideoPlayer } from '../contexts/VideoPlayerContext';

interface UseVideoPlayerOptions {
  contentId: string;
  initialProgress?: number;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
  /**
   * Whether playback should start automatically once the source is ready.
   * Gated by the mobile_autoplay server flag by callers; defaults to false
   * (tap-to-play) which is the conservative behavior.
   */
  autoPlay?: boolean;
  /** Title for the mini-player surface. */
  title?: string;
  /** Route to open when the user expands the mini player. */
  ownerPath?: string;
  /** Stable key identifying the claiming screen (defaults to ownerPath). */
  screenKey?: string;
}

interface UseVideoPlayerReturn {
  isPlaying: boolean;
  isBuffering: boolean;
  isFullscreen: boolean;
  currentTime: number;
  duration: number;
  showControls: boolean;
  error: string | null;
  /**
   * Classifies `error`: 'entitlement' means a 403 from the signed-url
   * endpoint (paywall — offer an upgrade path), 'generic' everything else.
   */
  errorKind: 'entitlement' | 'generic';
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
  /**
   * True when the mini overlay is showing this content: the screen must NOT
   * render its own VideoView and must not re-claim the player.
   */
  isMiniVisible: boolean;
}

export function useAzeeboVideoPlayer({
  contentId,
  initialProgress = 0,
  onProgressUpdate,
  onComplete,
  autoPlay = false,
  title,
  ownerPath,
  screenKey,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const {
    player,
    claimPlayer,
    markSourceLoaded,
    notifyScreenFocus,
    notifyScreenBlur,
    miniVisible,
    active,
    loadedSource,
  } = useSharedVideoPlayer();

  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<string | null>(null);

  const resolvedScreenKey = screenKey ?? ownerPath ?? 'watch';

  // The mini overlay shows this exact content: the overlay owns the surface.
  const isMiniVisible = miniVisible && active?.contentId === contentId;

  const isCurrentOwner = active?.contentId === contentId;

  // ── Progress plumbing ─────────────────────────────────────────
  const progressRef = useRef(onProgressUpdate);
  progressRef.current = onProgressUpdate;
  const lastSavedPositionRef = useRef(0);

  const flushProgress = useCallback(() => {
    const position = player.currentTime;
    if (progressRef.current && position > 0 && position !== lastSavedPositionRef.current) {
      lastSavedPositionRef.current = position;
      progressRef.current(position);
    }
  }, [player]);

  // ── Claim + focus/blur lifecycle ──────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (isMiniVisible) {
        // Returning to the owner while minimized: restore full-surface mode
        // and re-claim; the source is already loaded so playback continues.
        notifyScreenFocus(resolvedScreenKey);
        return () => {
          notifyScreenBlur(resolvedScreenKey);
        };
      }
      claimPlayer({ contentId, title: title ?? 'Now playing', ownerPath: ownerPath ?? '/watch' });
      notifyScreenFocus(resolvedScreenKey);
      return () => {
        notifyScreenBlur(resolvedScreenKey);
      };
    }, [contentId, isMiniVisible, resolvedScreenKey])
  );

  // Title arrives async (content fetch) — sync it into the provider so the
  // mini card shows the real title. Direct setActive path: safe to run while
  // focused, unlike a useFocusEffect re-run (whose cleanup would fire blur).
  useEffect(() => {
    if (isCurrentOwner && title && active?.title !== title) {
      claimPlayer({ contentId, title, ownerPath: ownerPath ?? '/watch' });
    }
  }, [title, isCurrentOwner]);

  // ── Source loading (only the claiming content loads its URL) ──
  // M4: a 403 from the signed-url endpoint means the account is not entitled
  // (premium content, no subscription). Surfaced as errorKind 'entitlement'
  // so screens can offer an upgrade path instead of a dead-end error.
  const [errorKind, setErrorKind] = useState<'entitlement' | 'generic'>('generic');

  useEffect(() => {
    if (!contentId || !isCurrentOwner) return;
    let cancelled = false;

    const fetchSignedUrl = async () => {
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
      }
    };

    fetchSignedUrl();
    return () => {
      cancelled = true;
    };
  }, [contentId, isCurrentOwner]);

  // ── Player events ─────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const sub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    return () => sub.remove();
  }, [player]);

  // Register playback with the shared session-timeout exemption: while this
  // video is actually playing, the 30-min inactivity logout defers (the mini
  // player keeps playing across screens where the user isn't "interacting").
  useEffect(() => {
    setPlaybackActive(contentId, isPlaying);
    return () => setPlaybackActive(contentId, false);
  }, [contentId, isPlaying]);

  const [status, setStatus] = useState(player.status);
  useEffect(() => {
    const sub = player.addListener('statusChange', (event) => {
      setStatus(event.status);
    });
    return () => sub.remove();
  }, [player]);

  const [currentTime, setCurrentTime] = useState(player.currentTime);
  useEffect(() => {
    const sub = player.addListener('timeUpdate', (event) => {
      setCurrentTime(event.currentTime);
    });
    return () => sub.remove();
  }, [player]);

  const [duration, setDuration] = useState(0);
  useEffect(() => {
    if (status === 'readyToPlay') {
      setDuration(player.duration);
    }
  }, [status, player]);

  // Pause + flush when the screen minimizes so background playback is an
  // explicit choice (the overlay's play button), not a default.
  useEffect(() => {
    if (miniVisible && isPlaying) {
      player.pause();
      flushProgress();
    }
  }, [miniVisible]);

  // Flush progress on pause.
  useEffect(() => {
    if (!isPlaying) {
      flushProgress();
    }
  }, [isPlaying]);

  // Pause + flush when the screen unmounts entirely (deep navigation while
  // playing previously dropped the final position on the floor).
  useEffect(() => {
    return () => {
      if (player.playing) {
        flushProgress();
        player.pause();
      }
    };
  }, [player]);

  // 10s cadence while playing (previous behavior preserved).
  useEffect(() => {
    if (progressRef.current && isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        flushProgress();
      }, 10000);
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, flushProgress]);

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      flushProgress();
      onComplete?.();
    });
    return () => sub.remove();
  }, [player, onComplete, flushProgress]);

  // ── Source swap + resume position ────────────────────────────
  const autoPlayedSourceRef = useRef<string | null>(null);
  useEffect(() => {
    if (!videoSource) return;
    // Expand-from-mini (or re-focus): the provider already has this source
    // hot in the shared player — replacing it would restart playback from
    // the resume position. Skip when the source is already loaded.
    if (loadedSource === videoSource) return;
    player.replaceAsync(videoSource).then(() => {
      markSourceLoaded(videoSource);
      if (initialProgress > 0) {
        player.currentTime = initialProgress;
      }
    });
  }, [videoSource, loadedSource]);

  // mobile_autoplay: start once per source when the caller passes autoPlay.
  useEffect(() => {
    if (
      autoPlay &&
      status === 'readyToPlay' &&
      videoSource &&
      !isPlaying &&
      autoPlayedSourceRef.current !== videoSource
    ) {
      autoPlayedSourceRef.current = videoSource;
      player.play();
    }
  }, [autoPlay, status, videoSource, isPlaying, player]);

  useEffect(() => {
    if (status === 'error') {
      setError('Playback error occurred');
    }
  }, [status]);

  // ── Fullscreen (unchanged semantics, shared player) ──────────
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      RNStatusBar.setHidden(next);
      const lockPromise = next
        ? ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT)
        : ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      lockPromise.catch(() => {
        // Rotation lock unsupported (e.g. certain tablets/emulators) —
        // surface-fullscreen still applies.
      });
      return next;
    });
  }, []);

  // Restore portrait + status bar when leaving the screen mid-fullscreen.
  useEffect(() => {
    return () => {
      RNStatusBar.setHidden(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
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
      setCurrentTime(clampedTime);
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

  // formatTime is shared with TV via @azeebo/react-data/utils/format.

  return {
    isPlaying,
    isBuffering,
    isFullscreen,
    currentTime,
    duration,
    showControls,
    error,
    errorKind,
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
    isMiniVisible,
  };
}
