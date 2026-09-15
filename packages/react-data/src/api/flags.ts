import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileFlags } from '@azeebo/feature-flags/registries';
import { apiClient } from './client';

/**
 * Client-side feature flag store for the mobile app.
 *
 * Pulls the evaluated public-flag subset from the gateway's
 * GET /feature-flags/bootstrap endpoint (per-user rollout hashing happens
 * server-side), caches it in AsyncStorage with a short TTL, and exposes typed
 * helpers. Anonymous visitors get a stable visitor id stored locally so
 * rollout buckets stay consistent across app launches.
 */

export interface BootstrapFlag {
  key: string;
  enabled: boolean;
  value?: string | number | boolean | null;
}

export interface BootstrapResponse {
  flags: BootstrapFlag[];
  generatedAt: string;
  evaluatedFor: 'user' | 'anonymous';
}

/** Client-side flag keys — single source of truth: @azeebo/feature-flags mobileFlags registry. */
export const MOBILE_FLAG_KEYS = mobileFlags;

// Universe sentinel builder, re-exported from @azeebo/shared-types — the single
// source of truth for universe slug VALUES (e.g. `movie`, `creator`), so the
// keys the mobile app looks up match what the admin publishes and the gateway
// serves.
export { universeEnabledKey, UNIVERSE_SLUGS } from '@azeebo/shared-types';
export type { UniverseSlug } from '@azeebo/shared-types';

const CACHE_PREFIX = 'azeebo_flags';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const VISITOR_KEY = 'azeebo_visitor_id';
const BOOTSTRAP_TIMEOUT_MS = 10_000;

interface CacheEntry {
  flags: BootstrapFlag[];
  expiresAt: number;
}

// Anonymous visitors are keyed by their stable visitor id (the same value the
// gateway buckets on via `x-anonymous-id`) so two anonymous installs can never
// share a cache entry within the TTL.
const cacheKey = (userId?: string, visitorId?: string): string =>
  `${CACHE_PREFIX}_${userId || `anon_${visitorId || 'unknown'}`}`;

/** Stable per-install visitor id for anonymous rollout bucketing. */
export async function getOrCreateVisitorId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await AsyncStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return 'ssr';
  }
}

async function readCachedFlags(
  userId?: string,
  visitorId?: string
): Promise<BootstrapFlag[] | null> {
  try {
    const key = cacheKey(userId, visitorId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.expiresAt < Date.now()) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return entry.flags;
  } catch {
    return null;
  }
}

async function writeCachedFlags(
  userId: string | undefined,
  visitorId: string | undefined,
  flags: BootstrapFlag[]
): Promise<void> {
  try {
    const entry: CacheEntry = { flags, expiresAt: Date.now() + CACHE_TTL_MS };
    await AsyncStorage.setItem(cacheKey(userId, visitorId), JSON.stringify(entry));
  } catch {
    // Storage unavailable — skip caching.
  }
}

/**
 * Fetch the evaluated public flags for the caller (or return the cached copy).
 * Never throws: on any failure it falls back to the cache, then to an empty
 * array so the app keeps rendering with conservative (disabled) flag values.
 */
export async function fetchBootstrapFlags(userId?: string): Promise<BootstrapFlag[]> {
  const visitorId = await getOrCreateVisitorId();
  const cached = await readCachedFlags(userId, visitorId);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BOOTSTRAP_TIMEOUT_MS);

    try {
      const response = await fetch(`${apiClient.getBaseURL()}/feature-flags/bootstrap`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-anonymous-id': visitorId,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Feature-flag bootstrap failed with status ${response.status}`);
      }

      const json = (await response.json()) as { data?: BootstrapResponse };
      const data = json.data ?? (json as unknown as BootstrapResponse);
      const flags = Array.isArray(data.flags) ? data.flags : [];
      await writeCachedFlags(userId, visitorId, flags);
      return flags;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return (await readCachedFlags(userId, visitorId)) ?? [];
  }
}

/** True only when the flag is present AND evaluated enabled. */
export function isFlagEnabled(flags: BootstrapFlag[], key: string): boolean {
  return flags.some((flag) => flag.key === key && flag.enabled === true);
}

/** Variant payload of an enabled flag (null when absent or disabled). */
export function getFlagValue(
  flags: BootstrapFlag[],
  key: string
): string | number | boolean | null {
  const flag = flags.find((f) => f.key === key);
  if (flag?.enabled !== true) return null;
  return flag.value ?? null;
}
