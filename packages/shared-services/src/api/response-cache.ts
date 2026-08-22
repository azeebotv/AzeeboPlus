/**
 * API Response Caching
 * P-009: Add Cache-Control headers for static content
 */

export interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate?: number;
  isPrivate?: boolean;
  immutable?: boolean;
}

export const CACHE_PRESETS: Record<string, CacheConfig> = {
  static: { maxAge: 31536000, immutable: true },
  images: { maxAge: 86400, staleWhileRevalidate: 604800 },
  api: { maxAge: 0, staleWhileRevalidate: 300 },
  auth: { maxAge: 0, isPrivate: true },
};

export function buildCacheHeader(preset: keyof typeof CACHE_PRESETS): string {
  const config = CACHE_PRESETS[preset];
  const parts: string[] = [];
  if (config.isPrivate) parts.push('private');
  else parts.push('public');
  parts.push(`max-age=${config.maxAge}`);
  if (config.staleWhileRevalidate)
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  if (config.immutable) parts.push('immutable');
  return parts.join(', ');
}
