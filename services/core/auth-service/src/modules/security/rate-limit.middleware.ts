import {
  Injectable,
  NestMiddleware,
  Logger,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  skip?: (req: Request) => boolean;
  skipSuccessfulRequests?: boolean;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor(@Optional() _configService?: ConfigService) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Create a rate limiter with custom configuration
   */
  static create(config: RateLimitConfig) {
    return (req: Request, res: Response, next: NextFunction) => {
      const middleware = new RateLimitMiddleware(new ConfigService());
      middleware.use(req, res, next, config);
    };
  }

  /**
   * Predefined rate limiters
   */
  static readonly auth = RateLimitMiddleware.create({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    keyGenerator: (req) => `auth:${req.ip}`,
  });

  static readonly api = RateLimitMiddleware.create({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req) => `api:${req.ip}`,
  });

  static readonly strict = RateLimitMiddleware.create({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyGenerator: (req) => `strict:${req.ip}:${req.path}`,
  });

  static readonly payment = RateLimitMiddleware.create({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (req) =>
      `payment:${req.ip}:${(req as Request & { user?: { id?: string } }).user?.id}`,
  });

  use(req: Request, res: Response, next: NextFunction, config?: RateLimitConfig): void {
    const cfg = config || {
      windowMs: 60 * 1000,
      maxRequests: 100,
    };

    // Check if we should skip this request
    if (cfg.skip?.(req)) {
      next();
      return;
    }

    const key = cfg.keyGenerator ? cfg.keyGenerator(req) : `default:${req.ip}`;
    const now = Date.now();
    const windowStart = now - cfg.windowMs;

    // Get or create entry
    let entry = this.store.get(key);

    if (!entry || entry.resetTime <= windowStart) {
      // New window
      entry = {
        count: 1,
        resetTime: now + cfg.windowMs,
      };
      this.store.set(key, entry);

      // Set rate limit headers
      this.setHeaders(res, cfg.maxRequests, cfg.maxRequests - 1, entry.resetTime);
      next();
      return;
    }

    // Increment count
    entry.count++;

    // Check if rate limit exceeded
    if (entry.count > cfg.maxRequests) {
      this.logger.warn(`Rate limit exceeded for ${key}`);

      // Set rate limit headers
      this.setHeaders(res, cfg.maxRequests, 0, entry.resetTime);

      // Return 429 Too Many Requests
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      if (cfg.handler) {
        cfg.handler(req, res);
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests',
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
      return;
    }

    // Set rate limit headers
    this.setHeaders(res, cfg.maxRequests, cfg.maxRequests - entry.count, entry.resetTime);

    // Track successful requests if configured
    if (cfg.skipSuccessfulRequests) {
      const originalSend = res.send.bind(res);
      res.send = (body: unknown) => {
        if (res.statusCode < 400) {
          entry!.count--;
        }
        return originalSend(body);
      };
    }

    next();
  }

  /**
   * Set rate limit headers
   */
  private setHeaders(res: Response, limit: number, remaining: number, resetTime: number): void {
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Get current rate limit status for a key
   */
  getStatus(key: string, windowMs: number): { remaining: number; resetTime: number } | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    if (entry.resetTime <= windowStart) {
      return null;
    }

    return {
      remaining: Math.max(0, entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.store.clear();
  }

  /**
   * Cleanup on destroy
   */
  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
