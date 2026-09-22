import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RedisService } from '@azeebo/shared-services';
import { isDevLoopbackRequest } from '@azeebo/security';

export const RateLimit = (limit: number, windowMs: number): ReturnType<typeof SetMetadata> =>
  SetMetadata('rateLimit', { limit, windowMs });

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly blockListPrefix = 'rate_limit:blocked:';
  private readonly violationPrefix = 'rate_limit:violations:';
  private readonly blockDuration: number;

  constructor(
    @Inject(Reflector) private reflector: Reflector,
    @Inject(RedisService) private redisService: RedisService,
    @Inject(ConfigService) private configService: ConfigService
  ) {
    this.blockDuration = this.configService.get<number>('RATE_LIMIT_BLOCK_DURATION', 3600);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.DISABLE_RATE_LIMITING === 'true') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Dev/loopback bypass: local testing shares one loopback IP, so the
    // shared violation threshold would lock the whole stack out of auth.
    // NODE_ENV=test keeps enforcement so specs verifying limiting work.
    if (isDevLoopbackRequest(request)) {
      return true;
    }

    const clientIp = this.getClientIp(request);

    // Check if IP is blocked
    const isBlocked = await this.isBlocked(clientIp);
    if (isBlocked) {
      response.setHeader('Retry-After', this.blockDuration);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'IP address is blocked due to repeated violations.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      'rateLimit',
      context.getHandler()
    );

    if (!rateLimitOptions) {
      return true;
    }

    const key = `ratelimit:${clientIp}:${request.path}`;
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
        // Record violation and potentially block IP
        await this.recordViolation(clientIp);

        response.setHeader('Retry-After', Math.ceil(ttl));
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests, please try again later.',
            error: 'Too Many Requests',
            retryAfter: Math.ceil(ttl),
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return true;
    }
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

  private async isBlocked(ip: string): Promise<boolean> {
    try {
      const key = `${this.blockListPrefix}${ip}`;
      const exists = await this.redisService.get(key);
      return !!exists;
    } catch (error) {
      this.logger.warn(
        `Failed to check block status for ${ip}: ${error instanceof Error ? error.message : 'unknown'}`
      );
      return false;
    }
  }

  private async block(ip: string, duration: number = this.blockDuration): Promise<void> {
    try {
      const key = `${this.blockListPrefix}${ip}`;
      await this.redisService.set(key, 'blocked', duration);
    } catch (error) {
      this.logger.warn(
        `Failed to block IP ${ip}: ${error instanceof Error ? error.message : 'unknown'}`
      );
    }
  }

  private async recordViolation(ip: string, threshold: number = 10): Promise<void> {
    try {
      const key = `${this.violationPrefix}${ip}`;
      const count = await this.redisService.incr(key);
      await this.redisService.expire(key, 3600);

      if (count >= threshold) {
        await this.block(ip);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to record violation for ${ip}: ${error instanceof Error ? error.message : 'unknown'}`
      );
    }
  }
}
