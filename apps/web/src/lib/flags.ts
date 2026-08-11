/**
 * Client-side feature flag store.
 *
 * Pulls the evaluated public-flag subset from the gateway's
 * GET /feature-flags/bootstrap endpoint (per-user rollout hashing happens
 * server-side), caches it in localStorage with a short TTL, and exposes typed
 * helpers. Anonymous visitors get a stable visitor id sent as `x-anonymous-id`
 * so rollout buckets stay consistent across page loads.
 */

import { resolvedApiUrl } from './api/base';

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

/** Client-side flag keys (mirrors @azeebo/feature-flags webFlags registry). */
export const WEB_FLAG_KEYS = {
  maintenanceMode: 'web_maintenance_mode',
  newHome: 'web_new_home',
  darkMode: 'web_dark_mode',
  autoplay: 'web_autoplay',
  lowDataDefault: 'web_low_data_default',
  recommendationsRail: 'web_recommendations_rail',
  announcementBanner: 'web_announcement_banner',
  premiumUpsell: 'web_premium_upsell',
} as const;

/** Sentinel key for per-universe availability, e.g. `universe.reality.enabled`. */
export const universeFlagKey = (name: string): string => `universe.${name}.enabled`;

const CACHE_PREFIX = 'azeebo_flags';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const VISITOR_KEY = 'azeebo_visitor_id';
const BOOTSTRAP_TIMEOUT_MS = 10_000;

interface CacheEntry {
  flags: Record<string, BootstrapFlag>;
  expiresAt: number;
}

const cacheKey = (userId?: string): string => `${CACHE_PREFIX}_${userId || 'anon'}`;

/** Stable per-browser visitor id for anonymous rollout bucketing. */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function readCachedFlags(userId?: string): Record<string, BootstrapFlag> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.expiresAt < Date.now()) {
      localStorage.removeItem(cacheKey(userId));
      return null;
    }
    return entry.flags;
  } catch {
    return null;
  }
}

function writeCachedFlags(userId: string | undefined, flags: BootstrapFlag[]): void {
  if (typeof window === 'undefined') return;
  try {
    const map: Record<string, BootstrapFlag> = {};
    for (const flag of flags) map[flag.key] = flag;
    const entry: CacheEntry = { flags: map, expiresAt: Date.now() + CACHE_TTL_MS };
    localStorage.setItem(cacheKey(userId), JSON.stringify(entry));
  } catch {
    // Storage unavailable (private mode / quota) — skip caching.
  }
}

/**
 * Fetch the evaluated public flags for the caller (or return the cached copy).
 * Never throws: on any failure it falls back to the cache, then to an empty map
 * so the app keeps rendering with conservative (disabled) flag values.
 */
export async function fetchBootstrapFlags(userId?: string): Promise<Record<string, BootstrapFlag>> {
  const cached = readCachedFlags(userId);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BOOTSTRAP_TIMEOUT_MS);
    const response = await fetch(`${resolvedApiUrl}/feature-flags/bootstrap`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-anonymous-id': getOrCreateVisitorId(),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Feature-flag bootstrap failed with status ${response.status}`);
    }

    const json = await response.json();
    const data = (json.data ?? json) as BootstrapResponse;
    const flags = Array.isArray(data.flags) ? data.flags : [];
    writeCachedFlags(userId, flags);

    const map: Record<string, BootstrapFlag> = {};
    for (const flag of flags) map[flag.key] = flag;
    return map;
  } catch {
    return readCachedFlags(userId) ?? {};
  }
}

/** True only when the flag is present AND evaluated enabled. */
export function isFlagEnabled(flags: Record<string, BootstrapFlag>, key: string): boolean {
  return flags[key]?.enabled === true;
}

/** Variant payload of an enabled flag (null when absent or disabled). */
export function getFlagValue(
  flags: Record<string, BootstrapFlag>,
  key: string
): string | number | boolean | null {
  if (flags[key]?.enabled !== true) return null;
  return flags[key]?.value ?? null;
}
