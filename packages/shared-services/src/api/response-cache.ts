/**
 * API Response Caching & CDN Edge Acceleration
 * P-009: Add Cache-Control & CDN-Cache-Control headers with stale-while-revalidate
 */

export interface CacheConfig {
  maxAge: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  isPrivate?: boolean;
  immutable?: boolean;
}

export const CACHE_PRESETS: Record<string, CacheConfig> = {
  static: { maxAge: 31536000, immutable: true },
  images: { maxAge: 86400, staleWhileRevalidate: 604800 },
  api: { maxAge: 0, staleWhileRevalidate: 300 },
  auth: { maxAge: 0, isPrivate: true },
  publicCatalog: { maxAge: 60, sMaxAge: 300, staleWhileRevalidate: 600 },
  featured: { maxAge: 60, sMaxAge: 300, staleWhileRevalidate: 600 },
  trending: { maxAge: 30, sMaxAge: 180, staleWhileRevalidate: 360 },
};

export function buildCacheHeader(preset: keyof typeof CACHE_PRESETS | CacheConfig): string {
  const config = typeof preset === 'string' ? CACHE_PRESETS[preset] : preset;
  if (!config) return 'no-cache, private';

  const parts: string[] = [];
  if (config.isPrivate) {
    parts.push('private');
    parts.push('no-cache, no-store, must-revalidate');
    return parts.join(', ');
  }

  parts.push('public');
  parts.push(`max-age=${config.maxAge}`);
  if (config.sMaxAge !== undefined) parts.push(`s-maxage=${config.sMaxAge}`);
  if (config.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }
  if (config.immutable) parts.push('immutable');

  return parts.join(', ');
}

export function buildCdnCacheHeader(preset: keyof typeof CACHE_PRESETS | CacheConfig): string {
  const config = typeof preset === 'string' ? CACHE_PRESETS[preset] : preset;
  if (!config || config.isPrivate) return 'private, no-store';

  const parts: string[] = ['public'];
  const sMaxAge = config.sMaxAge ?? config.maxAge;
  parts.push(`s-maxage=${sMaxAge}`);
  if (config.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }
  return parts.join(', ');
}
