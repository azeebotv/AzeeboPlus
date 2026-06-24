import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService, RateLimitConfig } from './rate-limit.service';

export const RateLimit = (limit: number, windowMs: number): ReturnType<typeof SetMetadata> =>
  SetMetadata('rateLimit', { limit, windowMs });

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimitService: RateLimitService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip rate limiting in development (or when NODE_ENV is not set)
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const clientIp = this.getClientIp(request);

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

    const key = this.generateKey(clientIp, request.path);

    const result = await this.rateLimitService.checkRateLimit(key, rateLimitOptions);

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
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedForIp =
      typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : undefined;
    const realIp = request.headers['x-real-ip'];
    const realIpString = typeof realIp === 'string' ? realIp : undefined;

    return (
      request.ip || request.socket.remoteAddress || forwardedForIp || realIpString || 'unknown'
    );
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
