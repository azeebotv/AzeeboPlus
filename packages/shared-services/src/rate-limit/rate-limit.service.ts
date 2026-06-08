import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../audit/audit.service';

export interface RateLimitOptions {
  max: number;
  windowMs: number;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(
    private redisService: RedisService,
    private auditService: AuditService,
  ) {}

  private defaultLimits: Record<string, RateLimitOptions> = {
    default: { max: 100, windowMs: 60000 },
    auth: { max: 5, windowMs: 60000 },
    payment: { max: 10, windowMs: 60000 },
    sensitive: { max: 3, windowMs: 60000 },
    api: { max: 1000, windowMs: 3600000 },
  };

  async checkLimit(key: string, options?: RateLimitOptions): Promise<RateLimitResult> {
    const limitOptions = options || this.defaultLimits.default;
    const windowSeconds = Math.floor(limitOptions.windowMs / 1000);
    const redisKey = `rate_limit:${key}`;

    const client = await this.redisService.getClient();
    const now = Date.now();

    try {
      const pipeline = client.multi();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, windowSeconds);
      const results = await pipeline.exec();

      if (!results || results.length < 2) {
        throw new Error('Failed to execute pipeline');
      }

      const incrResult = results[0];
      if (incrResult[0]) {
        throw incrResult[0];
      }
      const currentCount = incrResult[1] as number;
      
      const ttlResult = await client.ttl(redisKey);
      const ttl = typeof ttlResult === 'number' ? ttlResult : windowSeconds;

      const allowed = currentCount <= limitOptions.max;
      const remaining = Math.max(0, limitOptions.max - currentCount);
      const resetTime = now + (ttl * 1000);

      if (!allowed) {
        await this.logRateLimitViolation(key, currentCount, limitOptions.max);
      }

      return { allowed, remaining, resetTime, limit: limitOptions.max };
    } catch (error) {
      this.logger.error('Failed to check rate limit:', error);
      return {
        allowed: true,
        remaining: limitOptions.max,
        resetTime: now + limitOptions.windowMs,
        limit: limitOptions.max,
      };
    }
  }

  async checkAuthRateLimit(userId: string): Promise<RateLimitResult> {
    return this.checkLimit(`auth:${userId}`, this.defaultLimits.auth);
  }

  async checkPaymentRateLimit(userId: string): Promise<RateLimitResult> {
    return this.checkLimit(`payment:${userId}`, this.defaultLimits.payment);
  }

  async checkSensitiveRateLimit(userId: string): Promise<RateLimitResult> {
    return this.checkLimit(`sensitive:${userId}`, this.defaultLimits.sensitive);
  }

  async checkApiRateLimit(ip: string): Promise<RateLimitResult> {
    return this.checkLimit(`api:${ip}`, this.defaultLimits.api);
  }

  async resetLimit(key: string): Promise<void> {
    const redisKey = `rate_limit:${key}`;
    const client = await this.redisService.getClient();
    await client.del(redisKey);
  }

  async getLimitStats(key: string): Promise<{ count: number; ttl: number }> {
    const redisKey = `rate_limit:${key}`;
    const client = await this.redisService.getClient();

    const [countResult, ttlResult] = await Promise.all([
      client.get(redisKey),
      client.ttl(redisKey),
    ]);

    return {
      count: parseInt(countResult as string) || 0,
      ttl: typeof ttlResult === 'number' ? ttlResult : 0,
    };
  }

  private async logRateLimitViolation(key: string, count: number, max: number): Promise<void> {
    try {
      const actorId = key.includes(':') ? key.split(':')[1] : 'unknown';
      await this.auditService.log({
        actorId,
        actorType: 'user',
        action: 'rate_limit_violation',
        resourceType: 'rate_limit',
        resourceId: key,
        metadata: { count, max },
        status: 'failure',
        errorMessage: `Rate limit exceeded: ${count}/${max}`,
      });
    } catch (error) {
      this.logger.error('Failed to log rate limit violation:', error);
    }
  }
}