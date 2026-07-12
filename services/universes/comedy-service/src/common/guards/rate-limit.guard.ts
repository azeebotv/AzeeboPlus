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
import { Request } from 'express';
import { RedisService } from '../services/redis.service.js';

export const RateLimit = (limit: number, windowMs: number): ReturnType<typeof SetMetadata> =>
  SetMetadata('rateLimit', { limit, windowMs });

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private reflector: Reflector,
    private redisService: RedisService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      'rateLimit',
      context.getHandler()
    );

    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const key = `ratelimit:${ip}:${request.path}`;
    const { limit, windowMs } = rateLimitOptions;
    const windowSec = Math.ceil(windowMs / 1000);

    try {
      const current = await this.redisService.incr(key);

      if (current === 1) {
        await this.redisService.expire(key, windowSec);
      }

      const ttl = await this.redisService.ttl(key);

      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
      response.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl);

      if (current > limit) {
        this.logger.warn(`Rate limit exceeded for IP: ${ip}`);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests, please try again later.',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Rate limit check failed: ${error}`);
      return true;
    }
  }
}
