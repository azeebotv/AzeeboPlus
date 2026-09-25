import { Test, TestingModule } from '@nestjs/testing';
import { WebhookSecurityService } from './webhook-security.service.js';
import { RedisService } from '@azeebo/shared-services';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

describe('WebhookSecurityService', () => {
  let service: WebhookSecurityService;
  let redisService: RedisService;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    setIfNotExists: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookSecurityService,
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((_key: string, defaultValue?: unknown) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<WebhookSecurityService>(WebhookSecurityService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyPaystackSignature', () => {
    const secret = 'test_paystack_secret';
    const payload = JSON.stringify({ data: { reference: 'test-ref' } });
    const validSignature = createHmac('sha512', secret).update(payload).digest('hex');

    it('should return true for valid signature', () => {
      const result = service.verifyPaystackSignature(payload, validSignature, secret);
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const result = service.verifyPaystackSignature(payload, 'invalid-signature', secret);
      expect(result).toBe(false);
    });

    it('should return false when signature is missing', () => {
      const result = service.verifyPaystackSignature(payload, '', secret);
      expect(result).toBe(false);
    });

    it('should return false when secret is missing', () => {
      const result = service.verifyPaystackSignature(payload, validSignature, '');
      expect(result).toBe(false);
    });
  });

  describe('verifyFlutterwaveSignature', () => {
    const secret = 'test_flutterwave_secret';
    const payload = JSON.stringify({ data: { tx_ref: 'test-ref' } });
    const validSignature = createHmac('sha256', secret).update(payload).digest('hex');

    it('should return true for valid signature', () => {
      const result = service.verifyFlutterwaveSignature(payload, validSignature, secret);
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const result = service.verifyFlutterwaveSignature(payload, 'invalid-signature', secret);
      expect(result).toBe(false);
    });

    it('should return false when signature is missing', () => {
      const result = service.verifyFlutterwaveSignature(payload, '', secret);
      expect(result).toBe(false);
    });

    it('should return false when secret is missing', () => {
      const result = service.verifyFlutterwaveSignature(payload, validSignature, '');
      expect(result).toBe(false);
    });
  });

  describe('isDuplicate', () => {
    it('should return true when reference exists in Redis', async () => {
      mockRedisService.exists.mockResolvedValue(1);

      const result = await service.isDuplicate('test-ref');

      expect(result).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith('webhook_processed:test-ref');
    });

    it('should return false when reference does not exist in Redis', async () => {
      mockRedisService.exists.mockResolvedValue(0);

      const result = await service.isDuplicate('test-ref');

      expect(result).toBe(false);
    });
  });

  describe('markAsProcessed', () => {
    it('should store reference in Redis with TTL', async () => {
      await service.markAsProcessed('test-ref');

      expect(redisService.set).toHaveBeenCalledWith('webhook_processed:test-ref', '1', 86400);
    });
  });

  describe('isReplay', () => {
    it('should return true when event is too old', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600;

      const result = await service.isReplay('test-ref', oldTimestamp);

      expect(result).toBe(true);
    });

    it('should return true when reference exists in replay window', async () => {
      const recentTimestamp = Math.floor(Date.now() / 1000) - 10;
      mockRedisService.exists.mockResolvedValue(1);

      const result = await service.isReplay('test-ref', recentTimestamp);

      expect(result).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith('webhook_replay:test-ref');
    });

    it('should return false when reference is not in replay window', async () => {
      const recentTimestamp = Math.floor(Date.now() / 1000) - 10;
      mockRedisService.exists.mockResolvedValue(0);

      const result = await service.isReplay('test-ref', recentTimestamp);

      expect(result).toBe(false);
    });
  });

  describe('recordInReplayWindow', () => {
    it('should store reference in replay window with TTL', async () => {
      await service.recordInReplayWindow('test-ref');

      expect(redisService.set).toHaveBeenCalledWith('webhook_replay:test-ref', '1', 300);
    });
  });
});
