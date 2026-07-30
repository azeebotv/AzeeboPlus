import { Inject, Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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

  private static readonly AUTH_PATH_PATTERNS = [
    /\/auth\/(login|signup|register)/,
    /\/auth\/otp\//,
    /\/auth\/forgot-password/,
    /\/auth\/reset-password/,
  ];

  constructor(
    @Inject('THROTTLER:MODULE_OPTIONS') options: ThrottlerModuleOptions,
    @Inject(ThrottlerStorage) storageService: ThrottlerStorage,
    @Inject(Reflector) reflector: Reflector
  ) {
    super(options, storageService, reflector);
    if (process.env.REDIS_URL) {
      try {
        const Redis = require('ioredis');
        this.redisClient = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
          lazyConnect: true,
        });
        this.redisClient!.on('error', (err: Error) => {
          this.logger.warn(
            `Redis throttler connection error, falling back to in-memory: ${err.message}`
          );
          this.redisClient = null;
        });
        this.redisClient!.connect().catch((err) => {
          this.logger.warn('Redis connect failed', err);
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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.path || request.url || '';

    if (!this.isAuthRoute(path)) {
      return super.canActivate(context);
    }

    const clientIp = request.ip || request.socket?.remoteAddress || 'unknown';
    const window = Math.floor(Date.now() / (this.AUTH_TTL * 1000));

    // Per-IP + endpoint rate limit
    const endpoint = path.replace(/^\/+|\/+$/g, '').replace(/\//g, ':');
    const ipKey = `${this.KEY_PREFIX}${clientIp}:${endpoint}:${window}`;
    if (this.useRedis && this.redisClient) {
      await this.checkWithRedis(ipKey, clientIp);
    } else {
      this.checkInMemory(`${clientIp}:${endpoint}`, window);
    }

    // Per-account + endpoint rate limit (extract email/phone from body if available)
    const account_id = request.body?.email || request.body?.phone || request.body?.username;
    if (account_id) {
      const accountKey = `${this.KEY_PREFIX}acct:${account_id}:${endpoint}:${window}`;
      if (this.useRedis && this.redisClient) {
        await this.checkWithRedis(accountKey, `account:${account_id}`);
      } else {
        this.checkInMemory(`acct:${account_id}:${endpoint}`, window);
      }
    }

    return true;
  }

  private async checkWithRedis(key: string, clientIp: string): Promise<boolean> {
    try {
      const count = await this.redisClient!.incr(key);
      if (count === 1) {
        await this.redisClient!.expire(key, this.AUTH_TTL);
      }

      if (count > this.AUTH_LIMIT) {
        this.logger.warn(`Auth rate limit exceeded for IP: ${clientIp}`);
        throw new ThrottlerException('Too many authentication attempts. Please try again later.');
      }

      return true;
    } catch (error) {
      if (error instanceof ThrottlerException) throw error;
      this.logger.warn(
        `Redis throttler error, falling back to in-memory: ${(error as Error).message}`
      );
      this.redisClient = null;
      return this.checkInMemory(clientIp, Math.floor(Date.now() / (this.AUTH_TTL * 1000)));
    }
  }

  private checkInMemory(clientIp: string, window: number): boolean {
    const now = Date.now();
    const key = `${this.KEY_PREFIX}${clientIp}:${window}`;
    const entry = this.inMemoryRequests.get(key);

    if (entry && entry.resetTime > now) {
      if (entry.count >= this.AUTH_LIMIT) {
        this.logger.warn(`Auth rate limit exceeded for IP: ${clientIp}`);
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

    return true;
  }
}
