import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RateLimitService, RateLimitConfig } from './rate-limit.service';

export const RateLimit = (limit: number, windowMs: number): ReturnType<typeof SetMetadata> =>
  SetMetadata('rateLimit', { limit, windowMs });

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private reflector: Reflector,
    private rateLimitService: RateLimitService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler());

    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    const clientIp = this.getClientIp(request);
    const key = this.generateKey(clientIp, request.path);

    const result = await this.rateLimitService.checkRateLimit(key, rateLimitOptions);

    this.setRateLimitHeaders(response, result);

    if (!result.allowed) {
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
