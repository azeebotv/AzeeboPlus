import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
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
            isBlocked: jest.fn(),
            block: jest.fn(),
            unblock: jest.fn(),
            recordViolation: jest.fn(),
            getViolationCount: jest.fn(),
            resetViolations: jest.fn(),
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
    path: string = '/api/test',
    handler?: jest.Mock
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          headers: {
            'x-forwarded-for': ip,
          },
          path,
          socket: {
            remoteAddress: ip,
          },
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
    it('should block request when IP is blocked', async () => {
      const context = createMockExecutionContext('192.168.1.1');
      rateLimitService.isBlocked.mockResolvedValue(true);

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);

      try {
        await guard.canActivate(context);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('should allow request when no rate limit metadata is set', async () => {
      const context = createMockExecutionContext('192.168.1.1');
      rateLimitService.isBlocked.mockResolvedValue(false);
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rateLimitService.checkRateLimit).not.toHaveBeenCalled();
    });

    it('should allow request when under rate limit', async () => {
      const context = createMockExecutionContext('192.168.1.1');
      rateLimitService.isBlocked.mockResolvedValue(false);
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
      expect(rateLimitService.recordViolation).not.toHaveBeenCalled();
    });

    it('should throw exception and record violation when rate limit exceeded', async () => {
      const context = createMockExecutionContext('192.168.1.1');
      rateLimitService.isBlocked.mockResolvedValue(false);
      jest.spyOn(reflector, 'get').mockReturnValue({ limit: 10, windowMs: 60000 });
      rateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        limit: 10,
      });
      rateLimitService.recordViolation.mockResolvedValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);

      expect(rateLimitService.recordViolation).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should extract client IP from x-forwarded-for header', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            ip: undefined,
            headers: {
              'x-gateway-secret': 'valid-secret',
              'x-forwarded-for': '10.0.0.1, 10.0.0.2',
            },
            path: '/api/test',
            socket: {
              remoteAddress: undefined,
            },
          }),
          getResponse: () => ({
            setHeader: jest.fn(),
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      rateLimitService.isBlocked.mockResolvedValue(false);
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rateLimitService.isBlocked).toHaveBeenCalledWith('10.0.0.1');
    });
  });
});
