/**
 * Cache strategies for different service types.
 * Defines TTLs, invalidation patterns, and cache keys for each service.
 */
export interface CacheStrategy {
  /** Default TTL in seconds */
  defaultTtl: number;
  /** Key prefix for this service */
  keyPrefix: string;
  /** Patterns to invalidate on data changes */
  invalidationPatterns: string[];
}
export declare const CACHE_STRATEGIES: Record<string, CacheStrategy>;
/**
 * Get cache strategy for a service.
 *
 * @param serviceName - The service name
 * @returns The cache strategy, or default if not found
 */
export declare function getCacheStrategy(serviceName: string): CacheStrategy;
/**
 * Generate a cache key with service prefix.
 *
 * @param serviceName - The service name
 * @param key - The cache key
 * @returns The prefixed cache key
 */
export declare function cacheKey(serviceName: string, key: string): string;
