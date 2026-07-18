import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

/**
 * Local cache service that wraps Redis for the agbala storyworld module.
 * NOTE: This is a thin wrapper around Redis. Consider migrating callers
 * to use @azeebo/shared-services CacheService directly (async API).
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly prefix = 'agbala:';
  private readonly defaultTtl = 300; // 5 minutes in seconds

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.redis.get(`${this.prefix}${key}`);
      if (!value) return undefined;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Cache GET error for ${key}: ${error}`);
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    try {
      const ttlSeconds = ttlMs ? Math.ceil(ttlMs / 1000) : this.defaultTtl;
      await this.redis.set(`${this.prefix}${key}`, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(`Cache SET error for ${key}: ${error}`);
    }
  }

  async invalidate(pattern: string): Promise<number> {
    try {
      const fullPattern = `${this.prefix}${pattern}*`;
      const keys = await this.redis.keys(fullPattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      this.logger.warn(`Cache INVALIDATE error for ${pattern}: ${error}`);
      return 0;
    }
  }
}
