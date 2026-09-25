import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBootstrapFlags, type BootstrapFlag } from '../api/flags';
import { useAuth } from '../contexts/AuthContext';

interface UseFeatureFlagsResult {
  flags: Record<string, BootstrapFlag>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isEnabled: (key: string) => boolean;
  getValue: (key: string) => string | number | boolean | null;
}

/**
 * Hook to manage feature flags in the mobile app.
 *
 * Single source of truth: `fetchBootstrapFlags` in `src/api/flags.ts` (the same
 * feed `FlagsContext` uses), including its AsyncStorage TTL cache and
 * conservative fall-back-to-cache behavior. This hook exists for screens that
 * need flags before `FlagsProvider` wraps them (e.g. the login screen) — the
 * two can never diverge because both read the identical cached/fetched feed.
 */
export function useFeatureFlags(): UseFeatureFlagsResult {
  const { user } = useAuth();
  const userId = user?.id;
  const [flags, setFlags] = useState<Record<string, BootstrapFlag>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchBootstrapFlags(userId);
      const map: Record<string, BootstrapFlag> = {};
      for (const flag of result) map[flag.key] = flag;
      setFlags(map);
    } catch (err) {
      // fetchBootstrapFlags never throws in practice, but stay defensive.
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<UseFeatureFlagsResult>(
    () => ({
      flags,
      isLoading,
      error,
      refresh: load,
      isEnabled: (key: string) => flags[key]?.enabled === true,
      getValue: (key: string) => {
        if (flags[key]?.enabled !== true) return null;
        return flags[key]?.value ?? null;
      },
    }),
    [flags, isLoading, error, load]
  );

  return value;
}
