import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface CacheSetOptions {
  key: string;
  value: unknown;
  ttl?: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTtl: number;

  constructor(
    private readonly redisService: RedisService,
  ) {
    this.defaultTtl = parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10);
  }

  /**
   * Retrieves a cached value by key.
   * Returns null if the key doesn't exist or has expired.
   * 
   * @param key - The cache key
   * @returns The cached value as a parsed object, or null
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.get(key);
      if (!value) {
        return null;
      }
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
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        this.logger.debug(`Cache DELETE BY PATTERN: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      this.logger.error(`Cache DELETE BY PATTERN error for ${pattern}: ${(error as Error).message}`);
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
}
