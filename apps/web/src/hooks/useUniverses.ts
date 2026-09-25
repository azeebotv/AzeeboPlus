'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Universe } from '../lib/api/base';

const STORAGE_KEY = 'azeebo:selected_universe';
const CACHE_KEY = 'azeebo:universes_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface UniverseOption {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  icon?: string;
  contentCount?: number;
  route?: string;
}

interface CachedUniverses {
  data: UniverseOption[];
  timestamp: number;
}

function readStoredId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage unavailable (private browsing quota, etc.)
  }
}

function readCache(): UniverseOption[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedUniverses = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function writeCache(data: UniverseOption[]): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedUniverses = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

/**
 * React Query wrapper for the enabled-universes list, shared by universe
 * landing pages (`/sports`, `/comedy`, `/reality`, …).
 *
 * Guards against non-array payloads so a malformed API response surfaces as
 * a query error instead of crashing `.find()` callers.
 *
 * Uses a distinct cache key from the legacy `['universes']` key, which older
 * builds may have poisoned with a non-array payload (staleTime of 5 minutes
 * kept the bad value cached across navigations).
 */
export function useUniversesQuery(staleTime = 5 * 60 * 1000) {
  return useQuery<Universe[]>({
    queryKey: ['universes', 'enabled'],
    queryFn: async () => {
      const res = await api.universe.getUniverses();
      if (!res.success || !Array.isArray(res.data)) {
        throw new Error(res.message || 'Failed to load universes');
      }
      return res.data;
    },
    staleTime,
  });
}

export interface UseUniversesReturn {
  /** All available universes */
  universes: UniverseOption[];
  /** Currently selected universe (null if none selected) */
  selected: UniverseOption | null;
  /** True while the initial fetch is in-flight */
  isLoading: boolean;
  /** Error message if the fetch failed */
  error: string | null;
  /** Select a universe by id and navigate to its page */
  select: (id: string) => void;
  /** Manually re-fetch universes from the API */
  refetch: () => void;
  /** Get a universe by name */
  getUniverse: (name: string) => UniverseOption | undefined;
  /** Check if a universe is enabled */
  isUniverseEnabled: (name: string) => boolean;
  /** Check if a universe has a specific feature */
  hasFeature: (universeName: string, featureKey: string) => boolean;
}

export function useUniverses(): UseUniversesReturn {
  const router = useRouter();
  const [universes, setUniverses] = useState<UniverseOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applySelection = useCallback((list: UniverseOption[], id: string | null) => {
    if (id) {
      const found = list.find((u) => u.id === id);
      // If the stored id doesn't match any universe, fall back to the first
      if (found) {
        setSelectedId(id);
      } else if (list.length > 0) {
        setSelectedId(list[0].id);
      } else {
        setSelectedId(null);
      }
    } else if (list.length > 0) {
      // Default to first universe if nothing stored
      setSelectedId(list[0].id);
    }
  }, []);

  const fetchUniverses = useCallback(async () => {
    // Try cache first
    const cached = readCache();
    if (cached && cached.length > 0) {
      setUniverses(cached);
      const storedId = readStoredId();
      applySelection(cached, storedId);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.universe.getUniverses();
      if (response.success && Array.isArray(response.data)) {
        const list: UniverseOption[] = response.data.map((u) => ({
          id: u.id,
          name: u.name,
          description: u.description,
          icon: u.icon,
          contentCount: u.contentCount,
          route: getUniverseRoute(u.id),
        }));
        setUniverses(list);
        writeCache(list);
        const storedId = readStoredId();
        applySelection(list, storedId);
      } else {
        // API failed — fall back to the static universe list
        const fallback = getFallbackUniverses();
        setUniverses(fallback);
        applySelection(fallback, readStoredId());
        setError(response.message || 'Failed to load universes');
      }
    } catch {
      const fallback = getFallbackUniverses();
      setUniverses(fallback);
      applySelection(fallback, readStoredId());
      setError('Network error. Showing default list.');
    } finally {
      setIsLoading(false);
    }
  }, [applySelection]);

  useEffect(() => {
    fetchUniverses();
  }, [fetchUniverses]);

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      writeStoredId(id);
      const universe = universes.find((u) => u.id === id);
      if (universe?.route) {
        router.push(universe.route);
      }
    },
    [universes, router]
  );

  const refetch = useCallback(() => {
    // Clear cache before re-fetching
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {
        // ignore
      }
    }
    fetchUniverses();
  }, [fetchUniverses]);

  const selected = universes.find((u) => u.id === selectedId) ?? null;

  const getUniverse = useCallback(
    (name: string) => universes.find((u) => u.name === name || u.id === name),
    [universes]
  );

  const isUniverseEnabled = useCallback(
    (name: string) => {
      const universe = getUniverse(name);
      return universe !== undefined;
    },
    [getUniverse]
  );

  const hasFeature = useCallback(
    (universeName: string, featureKey: string) => {
      const universe = getUniverse(universeName);
      if (!universe) return false;
      // Check if the universe has the requested feature enabled
      // Feature flags are stored in the universe's metadata or config
      const universeData = universe as unknown as Record<string, unknown>;
      const features = universeData.features as Record<string, boolean> | undefined;
      if (features && featureKey in features) {
        return features[featureKey];
      }
      // Default to true for backwards compatibility when feature not explicitly set
      return true;
    },
    [getUniverse]
  );

  return {
    universes,
    selected,
    isLoading,
    error,
    select,
    refetch,
    getUniverse,
    isUniverseEnabled,
    hasFeature,
  };
}

/**
 * Maps a universe ID to its web app route.
 */
function getUniverseRoute(id: string): string | undefined {
  const routeMap: Record<string, string> = {
    movie: '/movies',
    comedy: '/comedy',
    sports: '/sports',
    reality: '/reality',
    lifestyle: '/lifestyle',
    vertical: '/vertical',
    games: '/games',
  };
  return routeMap[id.toLowerCase()];
}

/**
 * Hardcoded fallback universes matching the shared-types Universe union.
 * Used when the API is unreachable or returns an error.
 * Note: 'creator' is excluded — it's a role, not a browsable universe.
 */
function getFallbackUniverses(): UniverseOption[] {
  return [
    { id: 'movie', name: 'Movies', icon: '\u{1F3AC}', route: '/movies' },
    { id: 'comedy', name: 'Comedy', icon: '\u{1F602}', route: '/comedy' },
    { id: 'sports', name: 'Sports', icon: '\u26BD', route: '/sports' },
    { id: 'reality', name: 'Reality', icon: '\u{1F4FA}', route: '/reality' },
    { id: 'lifestyle', name: 'Lifestyle', icon: '\u{1F3A8}', route: '/lifestyle' },
    { id: 'vertical', name: 'Vertical', icon: '\u{1F4F1}', route: '/vertical' },
    { id: 'games', name: 'Games', icon: '\u{1F3AE}', route: '/games' },
  ];
}
