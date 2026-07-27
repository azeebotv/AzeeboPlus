/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('@azeebo/shared-types', () => {
  class CircuitBreaker {
    async execute<T>(fn: () => Promise<T>): Promise<T> {
      return fn();
    }
    getStats() {
      return { failures: 0, successes: 0, state: 'CLOSED' };
    }
  }
  class CircuitBreakerOpenError extends Error {}
  return { CircuitBreaker, CircuitBreakerOpenError };
});

import { FlutterwaveProvider } from './flutterwave.provider';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

interface MockRedis {
  get: jest.Mock;
  set: jest.Mock;
}

describe('FlutterwaveProvider', () => {
  let provider: FlutterwaveProvider;
  let redis: MockRedis;

  beforeEach(() => {
    redis = { get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue('OK') };

    const configService = {
      get: jest.fn((key: string, def?: unknown) => {
        const config: Record<string, unknown> = {
          FLUTTERWAVE_SECRET_KEY: 'FLWSECK_test_abc123',
          FLUTTERWAVE_API_URL: 'https://api.flutterwave.com/v3',
          FLUTTERWAVE_CALLBACK_URL: 'http://localhost:3003/webhooks/flutterwave',
        };
        return config[key] ?? def;
      }),
    } as unknown as ConfigService;

    provider = new FlutterwaveProvider(configService, redis as any);
  });

  afterEach(() => jest.clearAllMocks());

  describe('initializePayment', () => {
    it('should throw BadRequestException when API key not configured', async () => {
      const noKeyProvider = new FlutterwaveProvider(
        {
          get: jest.fn((key: string, def?: unknown) =>
            key === 'FLUTTERWAVE_SECRET_KEY' ? '' : def
          ),
        } as any,
        redis as any
      );

      await expect(noKeyProvider.initializePayment(5000, 'NGN', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw for non-positive amount', async () => {
      await expect(provider.initializePayment(-100, 'NGN', 'user-1')).rejects.toThrow(
        'Payment amount must be a positive number'
      );
    });

    it('should throw for amount below minimum', async () => {
      await expect(provider.initializePayment(50, 'NGN', 'user-1')).rejects.toThrow(
        'Minimum payment amount is 100'
      );
    });

    it('should return cached result for idempotency key', async () => {
      const cached = { reference: 'cached-ref', authorizationUrl: 'https://cached' };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await provider.initializePayment(5000, 'NGN', 'user-1', 'idem-1');

      expect(result).toEqual(cached);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should initialize payment successfully', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          status: 'success',
          message: 'Payment link created',
          data: {
            link: 'https://flutterwave.com/pay/abc',
            reference: 'ref_123',
          },
        },
      });

      const result = await provider.initializePayment(5000, 'NGN', 'user-1', 'idem-2');

      expect(result.reference).toBe('ref_123');
      expect(result.authorizationUrl).toBe('https://flutterwave.com/pay/abc');
      expect(redis.set).toHaveBeenCalled();
    });

    it('should throw on API failure', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { status: 'error', message: 'Invalid amount' },
      });

      await expect(provider.initializePayment(5000, 'NGN', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('verifyPayment', () => {
    it('should throw when API key not configured', async () => {
      const noKeyProvider = new FlutterwaveProvider(
        {
          get: jest.fn((key: string, def?: unknown) =>
            key === 'FLUTTERWAVE_SECRET_KEY' ? '' : def
          ),
        } as any,
        redis as any
      );

      await expect(noKeyProvider.verifyPayment('ref-1')).rejects.toThrow(BadRequestException);
    });

    it('should verify payment successfully', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            id: 1,
            tx_ref: 'ref_123',
            status: 'successful',
            amount: 5000,
            currency: 'NGN',
            created_at: '2026-07-15T10:00:00Z',
          },
        },
      });

      const result = await provider.verifyPayment('ref_123');

      expect(result.status).toBe('successful');
      expect(result.amount).toBe(5000);
      expect(result.reference).toBe('ref_123');
    });
  });

  describe('processRefund', () => {
    it('should throw when API key not configured', async () => {
      const noKeyProvider = new FlutterwaveProvider(
        {
          get: jest.fn((key: string, def?: unknown) =>
            key === 'FLUTTERWAVE_SECRET_KEY' ? '' : def
          ),
        } as any,
        redis as any
      );

      await expect(noKeyProvider.processRefund('ref-1', 'reason')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should process refund successfully', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          status: 'success',
          data: { reference: 'refund_1', amount: 5000, status: 'successful' },
        },
      });

      const result = await provider.processRefund('ref_123', 'Customer request');

      expect(result.reference).toBe('refund_1');
      expect(result.status).toBe('successful');
    });
  });

  describe('processPayout', () => {
    it('should throw when API key not configured', async () => {
      const noKeyProvider = new FlutterwaveProvider(
        {
          get: jest.fn((key: string, def?: unknown) =>
            key === 'FLUTTERWAVE_SECRET_KEY' ? '' : def
          ),
        } as any,
        redis as any
      );

      await expect(noKeyProvider.processPayout(5000, 'recipient', 'ref')).rejects.toThrow(
        'Flutterwave API key not configured'
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return false when API key is empty', async () => {
      const noKeyProvider = new FlutterwaveProvider(
        {
          get: jest.fn((key: string, def?: unknown) =>
            key === 'FLUTTERWAVE_SECRET_KEY' ? '' : def
          ),
        } as any,
        redis as any
      );

      const result = await noKeyProvider.verifyWebhookSignature({}, 'sig');
      expect(result).toBe(false);
    });

    it('should verify valid signature', async () => {
      const { createHmac } = await import('crypto');
      const payload = { event: 'charge.completed' };
      const sig = createHmac('sha256', 'FLWSECK_test_abc123')
        .update(JSON.stringify(payload))
        .digest('hex');

      const result = await provider.verifyWebhookSignature(payload, sig);
      expect(result).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const { createHmac } = await import('crypto');
      const payload = { event: 'test' };
      const invalidSig = createHmac('sha256', 'wrong-key')
        .update(JSON.stringify(payload))
        .digest('hex');
      const result = await provider.verifyWebhookSignature(payload, invalidSig);
      expect(result).toBe(false);
    });
  });
});
