import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { CacheInterceptor } from './cache.interceptor';
import { CacheService } from './cache.service';
import { Reflector } from '@nestjs/core';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from './cache.decorator';

describe('CacheInterceptor with Edge CDN Headers', () => {
  let interceptor: CacheInterceptor;
  let cacheService: jest.Mocked<CacheService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<CacheService>;

    reflector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    interceptor = new CacheInterceptor(cacheService, reflector);
  });

  function createMockContext(options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    cacheKey?: string;
    ttl?: number;
  }) {
    const setHeader = jest.fn();
    const req = {
      method: options.method ?? 'GET',
      url: options.url ?? '/content/featured',
      params: {},
      query: {},
      headers: options.headers ?? {},
    };
    const res = { setHeader };

    const context = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getHandler: jest.fn().mockReturnValue({}),
    } as unknown as ExecutionContext;

    reflector.get.mockImplementation((metadataKey: unknown) => {
      if (metadataKey === CACHE_KEY_METADATA) return options.cacheKey ?? 'content:featured';
      if (metadataKey === CACHE_TTL_METADATA) return options.ttl ?? 300;
      return undefined;
    });

    return { context, setHeader };
  }

  it('sets public Cache-Control and CDN-Cache-Control with stale-while-revalidate on cache miss', async () => {
    const { context, setHeader } = createMockContext({ ttl: 300 });
    cacheService.get.mockResolvedValue(null);

    const callHandler: CallHandler = {
      handle: () => of({ data: ['movie1', 'movie2'] }),
    };

    const observable = await interceptor.intercept(context, callHandler);
    await new Promise((resolve) => observable.subscribe({ next: resolve }));

    expect(setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
    );
    expect(setHeader).toHaveBeenCalledWith(
      'CDN-Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    expect(cacheService.set).toHaveBeenCalledWith(
      'cache:content:featured',
      { data: ['movie1', 'movie2'] },
      300
    );
  });

  it('sets edge caching headers on cache hit', async () => {
    const { context, setHeader } = createMockContext({ ttl: 120 });
    cacheService.get.mockResolvedValue({ data: ['cached-movie'] });

    const callHandler: CallHandler = {
      handle: () => of({}),
    };

    const observable = await interceptor.intercept(context, callHandler);
    let result: unknown;
    await new Promise((resolve) => {
      observable.subscribe({
        next: (val) => {
          result = val;
          resolve(val);
        },
      });
    });

    expect(result).toEqual({ data: ['cached-movie'] });
    expect(setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=60, s-maxage=120, stale-while-revalidate=240'
    );
    expect(setHeader).toHaveBeenCalledWith(
      'CDN-Cache-Control',
      'public, s-maxage=120, stale-while-revalidate=240'
    );
  });

  it('sets private no-cache for user-scoped cache keys', async () => {
    const { context, setHeader } = createMockContext({
      cacheKey: 'content:home:{userId}',
      ttl: 300,
    });
    cacheService.get.mockResolvedValue(null);

    const callHandler: CallHandler = {
      handle: () => of({ userFeed: [] }),
    };

    const observable = await interceptor.intercept(context, callHandler);
    await new Promise((resolve) => observable.subscribe({ next: resolve }));

    expect(setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );
  });
});
