import { Inject, Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService, gatewayFlags } from '@azeebo/feature-flags';
import type Redis from 'ioredis';

/**
 * Custom throttler guard that applies stricter rate limits to auth endpoints.
 * Auth endpoints: /auth/login, /auth/signup, /auth/register, /auth/otp/*, /auth/forgot-password
 *
 * Uses Redis-backed rate limiting when REDIS_URL is configured,
 * with graceful fallback to in-memory Map for single-instance deployments.
 * Limit: 10 requests per 60 seconds for auth endpoints.
 * All other routes fall through to the default ThrottlerGuard behavior.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(AuthThrottlerGuard.name);
  private readonly inMemoryRequests = new Map<string, { count: number; resetTime: number }>();
  private readonly AUTH_TTL = 60; // 60 seconds in unix-seconds for Redis EXPIRE
  private readonly AUTH_LIMIT = 10;
  private readonly KEY_PREFIX = 'throttle:auth:';
  private readonly CLEANUP_INTERVAL_MS = 60_000; // Run cleanup at most every 60 seconds
  private lastCleanupTime = 0;
  private redisClient: Redis | null = null;
  private readonly useRedis: boolean;
  /**
   * When true, requests are rejected when Redis is down (fail-closed).
   * Defaults to false (fail-open) for backward compatibility.
   * Set RATE_LIMIT_FAIL_CLOSED=true in production for auth endpoints.
   */
  private readonly failClosed: boolean;

  private static readonly AUTH_PATH_PATTERNS = [
    /\/auth\/(login|signup|register)/,
    /\/auth\/otp\//,
    /\/auth\/forgot-password/,
    /\/auth\/reset-password/,
  ];

  constructor(
    @Inject('THROTTLER:MODULE_OPTIONS') options: ThrottlerModuleOptions,
    @Inject(ThrottlerStorage) storageService: ThrottlerStorage,
    @Inject(Reflector) reflector: Reflector,
    @Inject(FeatureFlagService)
    private readonly featureFlagService: FeatureFlagService
  ) {
    super(options, storageService, reflector);
    this.failClosed = process.env.RATE_LIMIT_FAIL_CLOSED === 'true';
    if (process.env.REDIS_URL) {
      try {
        const Redis = require('ioredis');
        this.redisClient = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
          lazyConnect: true,
        });
        this.redisClient!.on('error', (err: Error) => {
          this.logger.error(
            `[CRITICAL] Redis throttler connection lost — falling back to in-memory rate limiting. Rate limits are NOT enforced across instances!` +
              (this.failClosed ? ' FAIL_CLOSED is enabled: auth requests will be rejected.' : '') +
              ` Error: ${err.message}`
          );
          this.redisClient = null;
        });
        this.redisClient!.connect().catch((err) => {
          this.logger.error(
            `[CRITICAL] Redis throttler connect failed — falling back to in-memory rate limiting. Rate limits are NOT enforced across instances!` +
              (this.failClosed ? ' FAIL_CLOSED is enabled: auth requests will be rejected.' : '') +
              ` Error: ${(err as Error).message}`
          );
          this.redisClient = null;
        });
        this.useRedis = true;
      } catch {
        this.logger.warn('ioredis not available, using in-memory throttler');
        this.useRedis = false;
      }
    } else {
      this.useRedis = false;
    }
  }

  private isAuthRoute(path: string): boolean {
    return AuthThrottlerGuard.AUTH_PATH_PATTERNS.some((pattern) => pattern.test(path));
  }

  /**
   * gateway_strict_rate_limits (off by default): when on, auth endpoints are
   * throttled far more aggressively (limit 3 / 60s instead of 10 / 60s) — for
   * credential-stuffing incidents or pre-launch hardening.
   */
  private async getEffectiveAuthLimit(): Promise<number> {
    try {
      const strict = await this.featureFlagService.isEnabled(gatewayFlags.strictRateLimits);
      return strict ? 3 : this.AUTH_LIMIT;
    } catch {
      return this.AUTH_LIMIT;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.path || request.url || '';

    if (!this.isAuthRoute(path)) {
      return super.canActivate(context);
    }

    // Fail-closed: reject auth requests when Redis is unavailable
    if (this.failClosed && (!this.useRedis || !this.redisClient)) {
      this.logger.error(
        `[CRITICAL] Auth request rejected — Redis unavailable and RATE_LIMIT_FAIL_CLOSED=true. IP: ${request.ip || request.socket?.remoteAddress || 'unknown'}`
      );
      throw new ThrottlerException('Service temporarily unavailable. Please try again later.');
    }

    const authLimit = await this.getEffectiveAuthLimit();
    const clientIp = request.ip || request.socket?.remoteAddress || 'unknown';
    const window = Math.floor(Date.now() / (this.AUTH_TTL * 1000)); // Per-IP + endpoint rate limit
    const endpoint = path.replace(/^\/+|\/+$/g, '').replace(/\//g, ':');
    const ipKey = `${this.KEY_PREFIX}${clientIp}:${endpoint}:${window}`;
    let remaining = authLimit;
    if (this.useRedis && this.redisClient) {
      remaining = await this.checkWithRedis(ipKey, `${clientIp}:${endpoint}`, authLimit);
    } else {
      remaining = this.checkInMemory(`${clientIp}:${endpoint}`, window, authLimit);
    }

    // Per-account + endpoint rate limit (extract email/phone from body if available)
    const account_id = request.body?.email || request.body?.phone || request.body?.username;
    if (account_id) {
      const accountKey = `${this.KEY_PREFIX}acct:${account_id}:${endpoint}:${window}`;
      if (this.useRedis && this.redisClient) {
        const acctRemaining = await this.checkWithRedis(
          accountKey,
          `acct:${account_id}:${endpoint}`,
          authLimit
        );
        remaining = Math.min(remaining, acctRemaining);
      } else {
        const acctRemaining = this.checkInMemory(
          `acct:${account_id}:${endpoint}`,
          window,
          authLimit
        );
        remaining = Math.min(remaining, acctRemaining);
      }
    }

    // Set rate-limit response headers
    const response = context.switchToHttp().getResponse();
    if (response && typeof response.setHeader === 'function') {
      response.setHeader('X-RateLimit-Limit', String(authLimit));
      response.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
      response.setHeader('X-RateLimit-Reset', String(window * this.AUTH_TTL));
      response.setHeader('X-RateLimit-Policy', `${authLimit};w=${this.AUTH_TTL}`);
    }

    return true;
  }

  private async checkWithRedis(
    key: string,
    identifier: string,
    limit: number = this.AUTH_LIMIT
  ): Promise<number> {
    try {
      const count = await this.redisClient!.incr(key);
      if (count === 1) {
        await this.redisClient!.expire(key, this.AUTH_TTL);
      }

      if (count > limit) {
        this.logger.warn(`Auth rate limit exceeded for: ${identifier}`);
        throw new ThrottlerException('Too many authentication attempts. Please try again later.');
      }

      return Math.max(0, limit - count);
    } catch (error) {
      if (error instanceof ThrottlerException) throw error;
      this.logger.warn(
        `Redis throttler error, falling back to in-memory: ${(error as Error).message}`
      );
      this.redisClient = null;
      return this.checkInMemory(identifier, Math.floor(Date.now() / (this.AUTH_TTL * 1000)), limit);
    }
  }

  private checkInMemory(
    identifier: string,
    window: number,
    limit: number = this.AUTH_LIMIT
  ): number {
    const now = Date.now();
    const key = `${this.KEY_PREFIX}${identifier}:${window}`;
    const entry = this.inMemoryRequests.get(key);

    if (entry && entry.resetTime > now) {
      if (entry.count >= limit) {
        this.logger.warn(`Auth rate limit exceeded for: ${identifier}`);
        throw new ThrottlerException('Too many authentication attempts. Please try again later.');
      }
      entry.count++;
    } else {
      this.inMemoryRequests.set(key, { count: 1, resetTime: now + this.AUTH_TTL * 1000 });
    }

    if (now - this.lastCleanupTime > this.CLEANUP_INTERVAL_MS) {
      this.lastCleanupTime = now;
      const keysToDelete: string[] = [];
      this.inMemoryRequests.forEach((v, k) => {
        if (v.resetTime <= now) keysToDelete.push(k);
      });
      keysToDelete.forEach((k) => this.inMemoryRequests.delete(k));
    }

    return Math.max(0, limit - (entry?.count || 0));
  }
}
