import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Logger } from '@nestjs/common';

/**
 * Custom throttler guard that applies stricter rate limits to auth endpoints.
 * Auth endpoints: /auth/login, /auth/signup, /auth/register, /auth/otp/*, /auth/forgot-password
 *
 * Uses an in-memory Map with TTL-based expiration for per-IP tracking.
 * Limit: 10 requests per 60 seconds for auth endpoints.
 * All other routes fall through to the default ThrottlerGuard behavior.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(AuthThrottlerGuard.name);
  private readonly authRequests = new Map<string, { count: number; resetTime: number }>();
  private readonly AUTH_TTL = 60_000; // 60 seconds
  private readonly AUTH_LIMIT = 10;

  private static readonly AUTH_PATH_PATTERNS = [
    /\/auth\/(login|signup|register)/,
    /\/auth\/otp\//,
    /\/auth\/forgot-password/,
    /\/auth\/reset-password/,
  ];

  private isAuthRoute(path: string): boolean {
    return AuthThrottlerGuard.AUTH_PATH_PATTERNS.some((pattern) => pattern.test(path));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.path || request.url || '';

    if (!this.isAuthRoute(path)) {
      // Non-auth routes: use default throttler behavior
      return super.canActivate(context);
    }

    // Auth routes: apply stricter in-memory rate limiting
    const clientIp = request.ip || request.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const key = `auth:${clientIp}`;
    const entry = this.authRequests.get(key);

    if (entry && entry.resetTime > now) {
      if (entry.count >= this.AUTH_LIMIT) {
        this.logger.warn(`Auth rate limit exceeded for IP: ${clientIp}`);
        throw new ThrottlerException('Too many authentication attempts. Please try again later.');
      }
      entry.count++;
    } else {
      this.authRequests.set(key, { count: 1, resetTime: now + this.AUTH_TTL });
    }

    // Cleanup old entries periodically to prevent memory leaks
    if (this.authRequests.size > 10_000) {
      for (const [k, v] of this.authRequests) {
        if (v.resetTime <= now) this.authRequests.delete(k);
      }
    }

    return true;
  }
}
