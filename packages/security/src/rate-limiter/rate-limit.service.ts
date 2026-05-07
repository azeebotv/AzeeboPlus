import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const { limit, windowMs } = config;
    const windowSec = Math.ceil(windowMs / 1000);
    const now = Date.now();
    const resetAt = now + windowMs;

    try {
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, windowSec);
      }

      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;

      if (!allowed) {
        this.logger.warn(`Rate limit exceeded for key: ${key}`);
      }

      return {
        allowed,
        remaining,
        resetAt,
        limit,
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed for key ${key}: ${error}`);
      return {
        allowed: true,
        remaining: limit,
        resetAt: now + windowMs,
        limit,
      };
    }
  }

  async resetRateLimit(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to reset rate limit for key ${key}: ${error}`);
    }
  }

  async getRateLimitStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const { limit, windowMs } = config;
    const now = Date.now();

    try {
      const current = await this.redis.get(key);
      const ttl = await this.redis.ttl(key);

      const count = current ? parseInt(current, 10) : 0;
      const remaining = Math.max(0, limit - count);
      const resetAt = ttl > 0 ? now + ttl * 1000 : now + windowMs;

      return {
        allowed: count < limit,
        remaining,
        resetAt,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to get rate limit status for key ${key}: ${error}`);
      return {
        allowed: true,
        remaining: limit,
        resetAt: now + windowMs,
        limit,
      };
    }
  }
}
