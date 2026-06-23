import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { Reflector } from '@nestjs/core';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler());

    if (!cacheKey) {
      return next.handle();
    }

    const resolvedKey = this.resolveCacheKey(cacheKey, request);
    const cached = await this.cacheService.get(resolvedKey);

    if (cached !== null) {
      return of(cached);
    }

    return next.handle().pipe(
      tap((response) => {
        this.cacheService.set(resolvedKey, response, ttl);
      })
    );
  }

  private resolveCacheKey(
    pattern: string,
    request: { params?: Record<string, string>; query?: Record<string, string> }
  ): string {
    let key = pattern;

    const paramMatches = pattern.match(/\{(\w+)\}/g);
    if (paramMatches) {
      for (const match of paramMatches) {
        const paramName = match.replace(/[{}]/g, '');
        const paramValue = request.params?.[paramName] || request.query?.[paramName];
        if (paramValue) {
          key = key.replace(match, paramValue);
        }
      }
    }

    return `cache:${key}`;
  }
}
