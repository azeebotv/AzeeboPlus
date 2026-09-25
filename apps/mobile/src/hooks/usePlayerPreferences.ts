/**
 * Persisted video-player preferences (quality, playback speed, autoplay-next).
 *
 * Stored as one JSON blob in AsyncStorage so the player remembers the
 * viewer's choices across sessions, like YouTube's per-device playback
 * settings. Writes are fire-and-forget: a failed save degrades to
 * session-only preferences, never breaks playback.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@azeebo/react-data/utils/logger';

const STORAGE_KEY = 'azeebo.player.preferences.v1';

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/**
 * Video quality preference. The current backend serves a single adaptive
 * rendition, so 'auto' is the only value that changes playback today — the
 * others are stored now so streams that offer multiple renditions pick them
 * up without another migration.
 */
export const QUALITY_OPTIONS = ['auto', '1080p', '720p', '480p', '360p'] as const;
export type QualityPreference = (typeof QUALITY_OPTIONS)[number];

export interface PlayerPreferences {
  quality: QualityPreference;
  playbackSpeed: PlaybackSpeed;
  autoplayNext: boolean;
}

const DEFAULT_PREFERENCES: PlayerPreferences = {
  quality: 'auto',
  playbackSpeed: 1,
  autoplayNext: true,
};

function parseStored(raw: string | null): PlayerPreferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(raw) as Partial<PlayerPreferences>;
    return {
      quality: QUALITY_OPTIONS.includes(parsed.quality as QualityPreference)
        ? (parsed.quality as QualityPreference)
        : DEFAULT_PREFERENCES.quality,
      playbackSpeed: PLAYBACK_SPEEDS.includes(parsed.playbackSpeed as PlaybackSpeed)
        ? (parsed.playbackSpeed as PlaybackSpeed)
        : DEFAULT_PREFERENCES.playbackSpeed,
      autoplayNext:
        typeof parsed.autoplayNext === 'boolean'
          ? parsed.autoplayNext
          : DEFAULT_PREFERENCES.autoplayNext,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function usePlayerPreferences(): {
  /** Preferences as of hydration; defaults until then. */
  preferences: PlayerPreferences;
  /** False until the persisted values have been read (guards flash-of-default). */
  hydrated: boolean;
  setQuality: (quality: QualityPreference) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setAutoplayNext: (enabled: boolean) => void;
} {
  const [preferences, setPreferences] = useState<PlayerPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const saveQueued = useRef<PlayerPreferences | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!cancelled) {
          setPreferences(parseStored(raw));
          setHydrated(true);
        }
      })
      .catch((err) => {
        logger.warn('Failed to load player preferences', err);
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced persist: sheet interactions can flip several values in quick
  // succession; one write per quiet period beats one per tap.
  const persist = useCallback((next: PlayerPreferences) => {
    saveQueued.current = next;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      const value = saveQueued.current;
      if (!value) return;
      saveQueued.current = null;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value)).catch((err) => {
        logger.warn('Failed to save player preferences', err);
      });
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      // Flush a pending debounce so a last-moment change still persists.
      const pending = saveQueued.current;
      if (pending) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pending)).catch(() => {});
      }
    };
  }, []);

  const update = useCallback(
    (patch: Partial<PlayerPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setQuality = useCallback((quality: QualityPreference) => update({ quality }), [update]);
  const setPlaybackSpeed = useCallback(
    (playbackSpeed: PlaybackSpeed) => update({ playbackSpeed }),
    [update]
  );
  const setAutoplayNext = useCallback(
    (autoplayNext: boolean) => update({ autoplayNext }),
    [update]
  );

  return { preferences, hydrated, setQuality, setPlaybackSpeed, setAutoplayNext };
}
