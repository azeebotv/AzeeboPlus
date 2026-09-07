import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_CACHE_DB', 1),
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis cache error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis cache connected');
    });
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value) {
        this.stats.hits++;
        return JSON.parse(value);
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      this.logger.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || 300; // Default 5 minutes
      const fullKey = options?.prefix ? `${options.prefix}:${key}` : key;

      await this.redis.setex(fullKey, ttl, JSON.stringify(value));
      this.stats.sets++;

      // Store tags for cache invalidation
      if (options?.tags) {
        for (const tag of options.tags) {
          await this.redis.sadd(`tag:${tag}`, fullKey);
        }
      }
    } catch (error) {
      this.logger.error(`Cache set error for ${key}:`, error);
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.stats.deletes++;
    } catch (error) {
      this.logger.error(`Cache delete error for ${key}:`, error);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.stats.deletes += keys.length;
        this.logger.log(`Deleted ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        await this.redis.del(`tag:${tag}`);
        this.stats.deletes += keys.length;
        this.logger.log(`Invalidated ${keys.length} keys with tag ${tag}`);
      }
    } catch (error) {
      this.logger.error(`Cache invalidate by tag error for ${tag}:`, error);
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Increment a counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      this.logger.error(`Cache increment error for ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      this.logger.error(`Cache expire error for ${key}:`, error);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.resetStats();
      this.logger.log('Cache flushed');
    } catch (error) {
      this.logger.error('Cache flush error:', error);
    }
  }

  /**
   * Get cache health status
   */
  async getHealth(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.redis.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - start;
      return { status: 'unhealthy', latency };
    }
  }

  /**
   * Cleanup on destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
