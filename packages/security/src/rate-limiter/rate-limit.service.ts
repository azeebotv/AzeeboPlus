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
  private readonly blockListPrefix = 'rate_limit:blocked:';
  private readonly violationPrefix = 'rate_limit:violations:';
  private readonly blockDuration = 3600; // 1 hour default

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
      this.logger.error(
        `CRITICAL: Rate limit check failed for key ${key} — Redis unreachable. ` +
          `Failing closed to protect service. Error: ${error}`
      );
      return {
        allowed: false,
        remaining: 0,
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
        allowed: count <= limit,
        remaining,
        resetAt,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `CRITICAL: Rate limit status check failed for key ${key} — Redis unreachable. ` +
          `Failing closed. Error: ${error}`
      );
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + windowMs,
        limit,
      };
    }
  }

  // IP Blocking functionality
  private maskIp(ip: string): string {
    return ip.replace(/\d+$/, 'xxx');
  }

  async isBlocked(ip: string): Promise<boolean> {
    try {
      const key = `${this.blockListPrefix}${ip}`;
      const exists = await this.redis.get(key);
      return !!exists;
    } catch (error) {
      this.logger.error(
        `Failed to check block status for IP ${this.maskIp(ip)} — failing closed. Error: ${error}`
      );
      return true;
    }
  }

  async block(ip: string, duration: number = this.blockDuration): Promise<void> {
    try {
      const key = `${this.blockListPrefix}${ip}`;
      await this.redis.set(key, 'blocked', 'EX', duration);
      this.logger.warn(`IP ${this.maskIp(ip)} has been blocked for ${duration} seconds`);
    } catch (error) {
      this.logger.error(`Failed to block IP ${this.maskIp(ip)}: ${error}`);
    }
  }

  async unblock(ip: string): Promise<void> {
    try {
      const key = `${this.blockListPrefix}${ip}`;
      await this.redis.del(key);
      this.logger.log(`IP ${this.maskIp(ip)} has been unblocked`);
    } catch (error) {
      this.logger.error(`Failed to unblock IP ${this.maskIp(ip)}: ${error}`);
    }
  }

  async recordViolation(ip: string, threshold: number = 10): Promise<boolean> {
    try {
      const key = `${this.violationPrefix}${ip}`;
      const count = await this.redis.incr(key);
      await this.redis.expire(key, 3600); // Reset violations count after 1 hour

      if (count >= threshold) {
        await this.block(ip);
        this.logger.warn(`IP ${this.maskIp(ip)} blocked after ${count} violations`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to record violation for IP ${this.maskIp(ip)}: ${error}`);
      return false;
    }
  }

  async getViolationCount(ip: string): Promise<number> {
    try {
      const key = `${this.violationPrefix}${ip}`;
      const count = await this.redis.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      this.logger.error(`Failed to get violation count for IP ${this.maskIp(ip)}: ${error}`);
      return 0;
    }
  }

  async resetViolations(ip: string): Promise<void> {
    try {
      const key = `${this.violationPrefix}${ip}`;
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to reset violations for IP ${this.maskIp(ip)}: ${error}`);
    }
  }
}
