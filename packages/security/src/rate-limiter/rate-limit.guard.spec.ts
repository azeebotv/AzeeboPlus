import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let rateLimitService: jest.Mocked<RateLimitService>;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        Reflector,
        {
          provide: RateLimitService,
          useValue: {
            checkRateLimit: jest.fn(),
            resetRateLimit: jest.fn(),
            getRateLimitStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    rateLimitService = module.get(RateLimitService);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (
    ip: string = '127.0.0.1',
    userId?: string,
    handler?: jest.Mock
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          user: userId ? { sub: userId } : undefined,
          headers: {
            'x-forwarded-for': ip,
          },
          path: '/api/test',
        }),
        getResponse: () => ({
          setHeader: jest.fn(),
        }),
      }),
      getHandler: () => handler || jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow request when no rate limit metadata is set', async () => {
      const context = createMockExecutionContext('192.168.1.1', 'user-123');

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rateLimitService.checkRateLimit).not.toHaveBeenCalled();
    });

    it('should allow request when under rate limit', async () => {
      const context = createMockExecutionContext('192.168.1.1', 'user-123');

      jest.spyOn(reflector, 'get').mockReturnValue({ limit: 10, windowMs: 60000 });
      rateLimitService.checkRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetAt: Date.now() + 60000,
        limit: 10,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rateLimitService.checkRateLimit).toHaveBeenCalled();
    });

    it('should throw exception when rate limit exceeded', async () => {
      const context = createMockExecutionContext('192.168.1.1', 'user-123');

      jest.spyOn(reflector, 'get').mockReturnValue({ limit: 10, windowMs: 60000 });
      rateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        limit: 10,
      });

      await expect(guard.canActivate(context)).rejects.toThrow();
    });
  });
});
