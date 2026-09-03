import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  value?: string | number | boolean | null;
}

interface FeatureFlagsResponse {
  flags: FeatureFlag[];
  generatedAt: string;
  evaluatedFor: 'user' | 'anonymous';
}

interface UseFeatureFlagsResult {
  flags: Record<string, FeatureFlag>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isEnabled: (key: string) => boolean;
  getValue: (key: string) => string | number | boolean | null;
}

const CACHE_KEY = 'azeebo_feature_flags';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  flags: Record<string, FeatureFlag>;
  expiresAt: number;
}

/**
 * Hook to manage feature flags in the mobile app.
 * Fetches flags from the API and caches them locally.
 */
export function useFeatureFlags(): UseFeatureFlagsResult {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const readCache = useCallback(async (): Promise<Record<string, FeatureFlag> | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return null;

      const entry: CacheEntry = JSON.parse(raw);
      if (entry.expiresAt < Date.now()) {
        await AsyncStorage.removeItem(CACHE_KEY);
        return null;
      }

      return entry.flags;
    } catch {
      return null;
    }
  }, []);

  const writeCache = useCallback(async (data: Record<string, FeatureFlag>) => {
    try {
      const entry: CacheEntry = {
        flags: data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      // Storage unavailable — skip caching
    }
  }, []);

  const fetchFlags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = await readCache();
      if (cached) {
        setFlags(cached);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3013';
      const response = await fetch(`${apiUrl}/v1/feature-flags/bootstrap`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Feature flags fetch failed: ${response.status}`);
      }

      const json = await response.json();
      const data = (json.data ?? json) as FeatureFlagsResponse;
      const flagsList = Array.isArray(data.flags) ? data.flags : [];

      // Convert to map
      const flagsMap: Record<string, FeatureFlag> = {};
      for (const flag of flagsList) {
        flagsMap[flag.key] = flag;
      }

      setFlags(flagsMap);
      await writeCache(flagsMap);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load feature flags';
      setError(message);

      // Try cache on error
      const cached = await readCache();
      if (cached) {
        setFlags(cached);
      }
    } finally {
      setIsLoading(false);
    }
  }, [readCache, writeCache]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isEnabled = useCallback(
    (key: string): boolean => {
      return flags[key]?.enabled === true;
    },
    [flags],
  );

  const getValue = useCallback(
    (key: string): string | number | boolean | null => {
      if (flags[key]?.enabled !== true) return null;
      return flags[key]?.value ?? null;
    },
    [flags],
  );

  return {
    flags,
    isLoading,
    error,
    refresh: fetchFlags,
    isEnabled,
    getValue,
  };
}
