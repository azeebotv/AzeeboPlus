import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';

const REDIS_CONNECTION_TOKEN = 'default_IORedisModuleConnectionToken';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redis: Record<string, jest.Mock>;

  beforeEach(async () => {
    redis = {
      incr: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      ttl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: REDIS_CONNECTION_TOKEN,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow request when under limit', async () => {
      redis.incr.mockResolvedValue(5);
      redis.expire.mockResolvedValue(1);

      const result = await service.checkRateLimit('test-key', { limit: 10, windowMs: 60000 });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.limit).toBe(10);
    });

    it('should deny request when over limit', async () => {
      redis.incr.mockResolvedValue(11);
      redis.expire.mockResolvedValue(1);

      const result = await service.checkRateLimit('test-key', { limit: 10, windowMs: 60000 });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should set expiry on first request', async () => {
      redis.incr.mockResolvedValue(1);
      redis.expire.mockResolvedValue(1);

      await service.checkRateLimit('test-key', { limit: 10, windowMs: 60000 });

      expect(redis.expire).toHaveBeenCalledWith('test-key', 60);
    });

    it('should return allowed=false on Redis error (fail closed)', async () => {
      redis.incr.mockRejectedValue(new Error('Redis error'));

      const result = await service.checkRateLimit('test-key', { limit: 10, windowMs: 60000 });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('IP Blocking', () => {
    describe('isBlocked', () => {
      it('should return true when IP is blocked', async () => {
        redis.get.mockResolvedValue('blocked');

        const result = await service.isBlocked('192.168.1.1');

        expect(result).toBe(true);
        expect(redis.get).toHaveBeenCalledWith('rate_limit:blocked:192.168.1.1');
      });

      it('should return false when IP is not blocked', async () => {
        redis.get.mockResolvedValue(null);

        const result = await service.isBlocked('192.168.1.1');

        expect(result).toBe(false);
      });

      it('should return false on Redis error', async () => {
        redis.get.mockRejectedValue(new Error('Redis error'));

        const result = await service.isBlocked('192.168.1.1');

        expect(result).toBe(false);
      });
    });

    describe('block', () => {
      it('should block IP with default duration', async () => {
        redis.set.mockResolvedValue('OK');

        await service.block('192.168.1.1');

        expect(redis.set).toHaveBeenCalledWith(
          'rate_limit:blocked:192.168.1.1',
          'blocked',
          'EX',
          3600
        );
      });

      it('should block IP with custom duration', async () => {
        redis.set.mockResolvedValue('OK');

        await service.block('192.168.1.1', 7200);

        expect(redis.set).toHaveBeenCalledWith(
          'rate_limit:blocked:192.168.1.1',
          'blocked',
          'EX',
          7200
        );
      });
    });

    describe('unblock', () => {
      it('should unblock IP', async () => {
        redis.del.mockResolvedValue(1);

        await service.unblock('192.168.1.1');

        expect(redis.del).toHaveBeenCalledWith('rate_limit:blocked:192.168.1.1');
      });
    });
  });

  describe('Violation Tracking', () => {
    describe('recordViolation', () => {
      it('should increment violation count', async () => {
        redis.incr.mockResolvedValue(3);
        redis.expire.mockResolvedValue(1);

        const result = await service.recordViolation('192.168.1.1', 10);

        expect(result).toBe(false);
        expect(redis.incr).toHaveBeenCalledWith('rate_limit:violations:192.168.1.1');
      });

      it('should block IP when threshold reached', async () => {
        redis.incr.mockResolvedValue(10);
        redis.expire.mockResolvedValue(1);
        redis.set.mockResolvedValue('OK');

        const result = await service.recordViolation('192.168.1.1', 10);

        expect(result).toBe(true);
        expect(redis.set).toHaveBeenCalledWith(
          'rate_limit:blocked:192.168.1.1',
          'blocked',
          'EX',
          3600
        );
      });
    });

    describe('getViolationCount', () => {
      it('should return violation count', async () => {
        redis.get.mockResolvedValue('5');

        const count = await service.getViolationCount('192.168.1.1');

        expect(count).toBe(5);
      });

      it('should return 0 when no violations', async () => {
        redis.get.mockResolvedValue(null);

        const count = await service.getViolationCount('192.168.1.1');

        expect(count).toBe(0);
      });
    });

    describe('resetViolations', () => {
      it('should reset violation count', async () => {
        redis.del.mockResolvedValue(1);

        await service.resetViolations('192.168.1.1');

        expect(redis.del).toHaveBeenCalledWith('rate_limit:violations:192.168.1.1');
      });
    });
  });

  describe('resetRateLimit', () => {
    it('should delete rate limit key', async () => {
      redis.del.mockResolvedValue(1);

      await service.resetRateLimit('test-key');

      expect(redis.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return current rate limit status', async () => {
      redis.get.mockResolvedValue('5');
      redis.ttl.mockResolvedValue(30);

      const result = await service.getRateLimitStatus('test-key', { limit: 10, windowMs: 60000 });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.limit).toBe(10);
    });

    it('should return allowed=false on Redis error (fail closed)', async () => {
      redis.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.getRateLimitStatus('test-key', { limit: 10, windowMs: 60000 });

      expect(result.allowed).toBe(false);
    });
  });
});
