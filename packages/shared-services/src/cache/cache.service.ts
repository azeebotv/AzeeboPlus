import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl: number;
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };

  constructor(private readonly redisService: RedisService) {
    this.defaultTtl = parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10);
  }

  /**
   * Retrieves a cached value by key.
   * Returns null if the key doesn't exist or has expired.
   *
   * @param key - The cache key
   * @returns The cached value as a parsed object, or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.get(key);
      if (!value) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }
      this.stats.hits++;
      this.updateHitRate();
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Stores a value in cache with optional TTL.
   *
   * @param key - The cache key
   * @param value - The value to cache (will be JSON stringified)
   * @param ttl - Time to live in seconds (defaults to 300s / 5min)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const ttlSeconds = ttl || this.defaultTtl;
      await this.redisService.set(key, serialized, ttlSeconds);
      this.stats.sets++;
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}: ${(error as Error).message}`);
    }
  }

  /**
   * Removes a cached value by key.
   *
   * @param key - The cache key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redisService.del(key);
      this.stats.deletes++;
      this.logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}: ${(error as Error).message}`);
    }
  }

  /**
   * Removes multiple cached values by key pattern.
   *
   * @param pattern - The key pattern to match (e.g., 'user:*')
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const redis = await this.redisService.getClient();
      const keys: string[] = [];
      let cursor = '0';
      do {
        const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        keys.push(...batch);
      } while (cursor !== '0');
      if (keys.length > 0) {
        await redis.del(...keys);
        this.stats.deletes += keys.length;
        this.logger.debug(`Cache DELETE BY PATTERN: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      this.logger.error(
        `Cache DELETE BY PATTERN error for ${pattern}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Checks if a key exists in cache.
   *
   * @param key - The cache key
   * @returns True if the key exists, false otherwise
   */
  async has(key: string): Promise<boolean> {
    try {
      const ttl = await this.redisService.ttl(key);
      return ttl > 0;
    } catch (error) {
      this.logger.error(`Cache HAS error for key ${key}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Invalidates cache for a specific key pattern.
   * Useful for cache busting after data updates.
   *
   * @param pattern - The key pattern to invalidate
   */
  async invalidate(pattern: string): Promise<void> {
    await this.deleteByPattern(pattern);
  }

  /**
   * Cache-aside pattern: Get from cache or fetch from source.
   * If not in cache, fetches from source, caches the result, and returns it.
   *
   * @param key - The cache key
   * @param fetcher - Function to fetch data if not cached
   * @param ttl - Time to live in seconds
   * @returns The cached or freshly fetched value
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T | null> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    try {
      const value = await fetcher();
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache GET_OR_SET fetcher error for key ${key}: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Warm cache with multiple entries.
   * Useful for pre-loading frequently accessed data on startup.
   *
   * @param warmers - Array of cache warmers with keys, fetchers, and TTLs
   */
  async warm<T>(warmers: CacheWarmer<T>[]): Promise<void> {
    const results = await Promise.allSettled(
      warmers.map(async (warmer) => {
        try {
          const value = await warmer.fetcher();
          if (value !== null && value !== undefined) {
            await this.set(warmer.key, value, warmer.ttl);
          }
          return { key: warmer.key, success: true };
        } catch (error) {
          this.logger.error(`Cache WARM error for key ${warmer.key}: ${(error as Error).message}`);
          return { key: warmer.key, success: false };
        }
      })
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    this.logger.log(`Cache WARM: ${succeeded}/${warmers.length} entries warmed`);
  }

  /**
   * Get cache statistics.
   *
   * @returns Current cache stats
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics.
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, hitRate: 0 };
  }

  /**
   * Get cache health status.
   *
   * @returns Health check result
   */
  async healthCheck(): Promise<{ status: string; stats: CacheStats }> {
    try {
      const redis = await this.redisService.getClient();
      await redis.ping();
      return { status: 'healthy', stats: this.getStats() };
    } catch (error) {
      return { status: 'unhealthy', stats: this.getStats() };
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}
