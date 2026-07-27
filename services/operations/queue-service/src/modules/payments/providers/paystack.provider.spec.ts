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

import { PaystackProvider } from './paystack.provider';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaystackProvider', () => {
  let provider: PaystackProvider;
  let redis: { get: jest.Mock; set: jest.Mock };

  beforeEach(() => {
    redis = { get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue('OK') };

    const configService = {
      get: jest.fn((key: string, def?: unknown) => {
        const config: Record<string, unknown> = {
          PAYSTACK_SECRET_KEY: 'sk_test_abc123',
          PAYSTACK_API_URL: 'https://api.paystack.co',
          PAYSTACK_CALLBACK_URL: 'http://localhost:3003/webhooks/paystack',
        };
        return config[key] ?? def;
      }),
    } as unknown as ConfigService;

    provider = new PaystackProvider(configService, redis as any);
  });

  afterEach(() => jest.clearAllMocks());

  describe('initializePayment', () => {
    it('should throw BadRequestException when API key not configured', async () => {
      const noKeyProvider = new PaystackProvider(
        {
          get: jest.fn((key: string, def?: unknown) => (key === 'PAYSTACK_SECRET_KEY' ? '' : def)),
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

    it('should throw for amount above maximum', async () => {
      await expect(provider.initializePayment(20_000_000, 'NGN', 'user-1')).rejects.toThrow(
        'Maximum payment amount is 10,000,000'
      );
    });

    it('should return cached result for idempotency key', async () => {
      const cached = {
        reference: 'cached-ref',
        authorizationUrl: 'https://cached',
        accessCode: 'code',
      };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await provider.initializePayment(5000, 'NGN', 'user-1', 'idem-1');

      expect(result).toEqual(cached);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should initialize payment and store idempotency result', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: 'https://paystack.co/pay/abc',
            access_code: 'acc_code',
            reference: 'ref_123',
          },
        },
      });

      const result = await provider.initializePayment(5000, 'NGN', 'user-1', 'idem-2');

      expect(result.reference).toBe('ref_123');
      expect(result.authorizationUrl).toBe('https://paystack.co/pay/abc');
      expect(redis.set).toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    it('should throw when API key not configured', async () => {
      const noKeyProvider = new PaystackProvider(
        {
          get: jest.fn((key: string, def?: unknown) => (key === 'PAYSTACK_SECRET_KEY' ? '' : def)),
        } as any,
        redis as any
      );

      await expect(noKeyProvider.verifyPayment('ref-1')).rejects.toThrow(BadRequestException);
    });

    it('should verify payment successfully', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          status: true,
          data: {
            status: 'success',
            amount: 500000,
            currency: 'NGN',
            paid_at: '2026-07-15T10:00:00Z',
            reference: 'ref_123',
            customer: { email: 'user@example.com' },
          },
        },
      });

      const result = await provider.verifyPayment('ref_123');

      expect(result.status).toBe('success');
      expect(result.amount).toBe(5000);
      expect(result.currency).toBe('NGN');
    });
  });

  describe('processRefund', () => {
    it('should throw when API key not configured', async () => {
      const noKeyProvider = new PaystackProvider(
        {
          get: jest.fn((key: string, def?: unknown) => (key === 'PAYSTACK_SECRET_KEY' ? '' : def)),
        } as any,
        redis as any
      );

      await expect(noKeyProvider.processRefund('ref-1', 'reason')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('processPayout', () => {
    it('should throw when API key not configured', async () => {
      const noKeyProvider = new PaystackProvider(
        {
          get: jest.fn((key: string, def?: unknown) => (key === 'PAYSTACK_SECRET_KEY' ? '' : def)),
        } as any,
        redis as any
      );

      await expect(noKeyProvider.processPayout(5000, 'recipient', 'ref')).rejects.toThrow(
        'Paystack API key not configured'
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return false when API key is empty', async () => {
      const noKeyProvider = new PaystackProvider(
        {
          get: jest.fn((key: string, def?: unknown) => (key === 'PAYSTACK_SECRET_KEY' ? '' : def)),
        } as any,
        redis as any
      );

      const result = await noKeyProvider.verifyWebhookSignature({}, 'sig');
      expect(result).toBe(false);
    });

    it('should verify valid signature', async () => {
      const { createHmac } = await import('crypto');
      const payload = { event: 'charge.success' };
      const sig = createHmac('sha512', 'sk_test_abc123')
        .update(JSON.stringify(payload))
        .digest('hex');

      const result = await provider.verifyWebhookSignature(payload, sig);
      expect(result).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const result = await provider.verifyWebhookSignature({ event: 'test' }, 'invalid-sig');
      expect(result).toBe(false);
    });
  });
});
