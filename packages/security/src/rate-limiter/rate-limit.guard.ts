import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService, RateLimitConfig } from './rate-limit.service';

export const RateLimit = (limit: number, windowMs: number): ReturnType<typeof SetMetadata> =>
  SetMetadata('rateLimit', { limit, windowMs });

export type RateLimitStrictResolver = () => Promise<boolean>;

/**
 * Loopback/dev bypass: in local development every request arrives from
 * ::1 or 127.0.0.1, so a single shared-IP block (or the per-IP violation
 * threshold) locks out the entire stack — gateway, browsers, and test
 * scripts all share one key. Outside production/test, loopback traffic
 * skips rate limiting entirely; production always enforces, and jest
 * (NODE_ENV=test) enforces so specs verifying limiting keep their teeth.
 */
export function isDevLoopbackRequest(request: Request): boolean {
  const env = process.env.NODE_ENV;
  if (env === 'production' || env === 'test') return false;
  if (process.env.DISABLE_RATE_LIMITING === 'true') return true;
  const raw = request.ip || request.socket?.remoteAddress || '';
  return (
    raw === '::1' ||
    raw === '::ffff:127.0.0.1' ||
    raw.startsWith('127.0.0.1.') || // Node >= 17 normalises IPv4-mapped IPv6
    raw === '127.0.0.1'
  );
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimitService: RateLimitService,
    @Optional()
    @Inject('RATE_LIMIT_STRICT_RESOLVER')
    private strictResolver?: RateLimitStrictResolver
  ) {}

  /**
   * Progressive tightening (`security_rate_limit_strict`): when the resolver
   * returns true the effective limit is halved (min 1) across every endpoint
   * that declares @RateLimit, without touching the decorated values.
   */
  private async resolveEffectiveLimit(options: RateLimitConfig): Promise<RateLimitConfig> {
    if (this.strictResolver && (await this.strictResolver())) {
      return { ...options, limit: Math.max(1, Math.floor(options.limit / 2)) };
    }
    return options;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const clientIp = this.getClientIp(request);

    if (isDevLoopbackRequest(request)) {
      return true;
    }

    // Check if IP is blocked
    const isBlocked = await this.rateLimitService.isBlocked(clientIp);
    if (isBlocked) {
      response.setHeader('Retry-After', 3600);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'IP address is blocked due to repeated violations.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const rateLimitOptions = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler());

    if (!rateLimitOptions) {
      return true;
    }

    const effectiveOptions = await this.resolveEffectiveLimit(rateLimitOptions);

    const key = this.generateKey(clientIp, request.path);

    const result = await this.rateLimitService.checkRateLimit(key, effectiveOptions);

    this.setRateLimitHeaders(response, result);

    if (!result.allowed) {
      // Record violation and potentially block IP
      await this.rateLimitService.recordViolation(clientIp);

      response.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later.',
          error: 'Too Many Requests',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private getClientIp(request: Request): string {
    const hasGatewaySecret = !!request.headers['x-gateway-secret'];

    if (hasGatewaySecret) {
      const forwardedFor = request.headers['x-forwarded-for'];
      const forwardedForIp =
        typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : undefined;
      const realIp = request.headers['x-real-ip'];
      const realIpString = typeof realIp === 'string' ? realIp : undefined;

      return (
        forwardedForIp || realIpString || request.ip || request.socket.remoteAddress || 'unknown'
      );
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private generateKey(ip: string, path: string): string {
    return `ratelimit:${ip}:${path}`;
  }

  private setRateLimitHeaders(
    response: Response,
    result: { limit: number; remaining: number; resetAt: number }
  ): void {
    response.setHeader('X-RateLimit-Limit', result.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));
  }
}
