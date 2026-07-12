import { RedisService } from '../redis/redis.service';
export interface CacheSetOptions {
  key: string;
  value: unknown;
  ttl?: number;
}
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}
export interface CacheWarmer<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttl?: number;
}
export declare class CacheService {
  private readonly redisService;
  private readonly logger;
  private readonly defaultTtl;
  private stats;
  constructor(redisService: RedisService);
  /**
   * Retrieves a cached value by key.
   * Returns null if the key doesn't exist or has expired.
   *
   * @param key - The cache key
   * @returns The cached value as a parsed object, or null
   */
  get<T>(key: string): Promise<T | null>;
  /**
   * Stores a value in cache with optional TTL.
   *
   * @param key - The cache key
   * @param value - The value to cache (will be JSON stringified)
   * @param ttl - Time to live in seconds (defaults to 300s / 5min)
   */
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  /**
   * Removes a cached value by key.
   *
   * @param key - The cache key to delete
   */
  delete(key: string): Promise<void>;
  /**
   * Removes multiple cached values by key pattern.
   *
   * @param pattern - The key pattern to match (e.g., 'user:*')
   */
  deleteByPattern(pattern: string): Promise<void>;
  /**
   * Checks if a key exists in cache.
   *
   * @param key - The cache key
   * @returns True if the key exists, false otherwise
   */
  has(key: string): Promise<boolean>;
  /**
   * Invalidates cache for a specific key pattern.
   * Useful for cache busting after data updates.
   *
   * @param pattern - The key pattern to invalidate
   */
  invalidate(pattern: string): Promise<void>;
  /**
   * Cache-aside pattern: Get from cache or fetch from source.
   * If not in cache, fetches from source, caches the result, and returns it.
   *
   * @param key - The cache key
   * @param fetcher - Function to fetch data if not cached
   * @param ttl - Time to live in seconds
   * @returns The cached or freshly fetched value
   */
  getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T | null>;
  /**
   * Warm cache with multiple entries.
   * Useful for pre-loading frequently accessed data on startup.
   *
   * @param warmers - Array of cache warmers with keys, fetchers, and TTLs
   */
  warm<T>(warmers: CacheWarmer<T>[]): Promise<void>;
  /**
   * Get cache statistics.
   *
   * @returns Current cache stats
   */
  getStats(): CacheStats;
  /**
   * Reset cache statistics.
   */
  resetStats(): void;
  /**
   * Get cache health status.
   *
   * @returns Health check result
   */
  healthCheck(): Promise<{
    status: string;
    stats: CacheStats;
  }>;
  private updateHitRate;
}
