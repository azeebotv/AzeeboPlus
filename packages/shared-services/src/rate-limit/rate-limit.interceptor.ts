import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException, Logger, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { RateLimitService, RateLimitOptions } from './rate-limit.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { id?: string };
}

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitInterceptor.name);

  constructor(
    private reflector: Reflector,
    private rateLimitService: RateLimitService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler()) ||
                   this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getClass());

    if (!options) {
      return next.handle();
    }

    const userId = request.user?.id || 'anonymous';
    const key = this.getKey(request, userId);
    const result = await this.rateLimitService.checkLimit(key, options);

    if (!result.allowed) {
      const resetTime = new Date(result.resetTime).toISOString();
      this.logger.warn(`Rate limit exceeded for ${key}: ${result.limit - result.remaining}/${result.limit}`);
      
      throw new ForbiddenException({
        success: false,
        message: options.message || 'Rate limit exceeded',
        details: {
          limit: result.limit,
          remaining: result.remaining,
          resetTime,
        },
      });
    }

    this.setRateLimitHeaders(request, result);
    return next.handle();
  }

  private getKey(request: Request, userId: string): string {
    const path = request.path;

    if (path.includes('auth') || path.includes('login') || path.includes('register')) {
      return `auth:${userId}`;
    }
    if (path.includes('payment') || path.includes('transaction')) {
      return `payment:${userId}`;
    }
    if (path.includes('admin') || path.includes('moderation')) {
      return `sensitive:${userId}`;
    }

    const ip = this.getClientIp(request);
    return `api:${ip}`;
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    return request.ip || 'unknown';
  }

  private setRateLimitHeaders(request: Request, result: { limit: number; remaining: number; resetTime: number }) {
    const response = request.res;
    if (response) {
      response.setHeader('X-RateLimit-Limit', String(result.limit));
      response.setHeader('X-RateLimit-Remaining', String(result.remaining));
      response.setHeader('X-RateLimit-Reset', String(Math.floor(result.resetTime / 1000)));
    }
  }
}