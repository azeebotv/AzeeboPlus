import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../payments/payments.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { PaystackProvider } from '../payments/providers/paystack.provider.js';
import { FlutterwaveProvider } from '../payments/providers/flutterwave.provider.js';
import { WebhookRetryService } from '../payments/webhook-retry.service.js';
import { RedisService, CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '../../prisma/client/index.js';
import axios from 'axios';

jest.mock('axios');

describe('PaymentsService', () => {
  let service: PaymentsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paystackProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let flagService: any;

  beforeEach(async () => {
    prisma = {
      paymentIntent: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      wallet: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
      walletTransaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    paystackProvider = {
      initializePayment: jest.fn(),
      verifyPayment: jest.fn(),
      verifyWebhookSignature: jest.fn(),
    };

    const flutterwaveProvider = {
      initializePayment: jest.fn(),
      verifyPayment: jest.fn(),
      verifyWebhookSignature: jest.fn(),
      processRefund: jest.fn(),
    };

    const webhookRetryService = {
      scheduleRetry: jest.fn(),
    };

    const redisService = {
      setIfNotExists: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(false),
    };

    (axios.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: FeatureFlagService,
          useValue: {
            // Providers ON (fallback chain active), new flows OFF by default
            // so existing tests exercise the legacy path.
            isEnabled: jest.fn((key: string) =>
              Promise.resolve(
                key === 'payment_provider_paystack' || key === 'payment_provider_flutterwave'
              )
            ),
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: PaystackProvider,
          useValue: paystackProvider,
        },
        {
          provide: FlutterwaveProvider,
          useValue: flutterwaveProvider,
        },
        {
          provide: WebhookRetryService,
          useValue: webhookRetryService,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(0),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: require('@nestjs/config').ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const config: Record<string, string> = {
                ANALYTICS_SERVICE_URL: 'http://localhost:3001',
                WALLET_SERVICE_URL: 'http://localhost:3002',
              };
              return config[key];
            }),
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'MIN_PAYMENT_AMOUNT_NGN') return 100;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    flagService = (service as unknown as { featureFlagService: { isEnabled: jest.Mock } })
      .featureFlagService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializePayment', () => {
    it('should initialize a payment successfully', async () => {
      const userId = 'user-123';
      const dto = { amount: 1000, currency: 'NGN', description: 'Test payment' };

      prisma.paymentIntent.create.mockResolvedValue({
        id: 'pay-123',
        userId,
        amount: new Decimal(dto.amount),
        currency: dto.currency,
        status: 'pending',
        description: dto.description,
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_123',
        authorizationUrl: 'https://paystack.com/pay/ref_123',
        accessCode: 'access_123',
      });

      prisma.paymentIntent.update.mockResolvedValue({
        id: 'pay-123',
        userId,
        amount: new Decimal(dto.amount),
        currency: dto.currency,
        status: 'processing',
        description: dto.description,
        providerReference: 'ref_123',
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.initializePayment(userId, dto);

      expect(result.success).toBe(true);
      expect(result.data?.checkoutUrl).toBeDefined();
    });

    it('should throw BadRequestException for amount <= 0', async () => {
      const userId = 'user-123';
      const dto = { amount: 0, currency: 'NGN' };

      await expect(service.initializePayment(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for amount below minimum (99 NGN)', async () => {
      const userId = 'user-123';
      const dto = { amount: 99, currency: 'NGN', description: 'Test payment' };

      await expect(service.initializePayment(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should allow payment with minimum amount (100 NGN)', async () => {
      const userId = 'user-123';
      const dto = { amount: 100, currency: 'NGN', description: 'Test payment' };

      prisma.paymentIntent.create.mockResolvedValue({
        id: 'pay-123',
        userId,
        amount: new Decimal(dto.amount),
        currency: dto.currency,
        status: 'pending',
        description: dto.description,
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_123',
        authorizationUrl: 'https://paystack.com/pay/ref_123',
        accessCode: 'access_123',
      });

      prisma.paymentIntent.update.mockResolvedValue({
        id: 'pay-123',
        userId,
        amount: new Decimal(dto.amount),
        currency: dto.currency,
        status: 'processing',
        description: dto.description,
        providerReference: 'ref_123',
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.initializePayment(userId, dto);

      expect(result.success).toBe(true);
      expect(result.data?.checkoutUrl).toBeDefined();
    });

    it('should allow payment with amount above minimum (101 NGN)', async () => {
      const userId = 'user-123';
      const dto = { amount: 101, currency: 'NGN', description: 'Test payment' };

      prisma.paymentIntent.create.mockResolvedValue({
        id: 'pay-123',
        userId,
        amount: new Decimal(dto.amount),
        currency: dto.currency,
        status: 'pending',
        description: dto.description,
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_123',
        authorizationUrl: 'https://paystack.com/pay/ref_123',
        accessCode: 'access_123',
      });

      prisma.paymentIntent.update.mockResolvedValue({
        id: 'pay-123',
        userId,
        amount: new Decimal(dto.amount),
        currency: dto.currency,
        status: 'processing',
        description: dto.description,
        providerReference: 'ref_123',
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.initializePayment(userId, dto);

      expect(result.success).toBe(true);
      expect(result.data?.checkoutUrl).toBeDefined();
    });
  });

  describe('verifyPayment', () => {
    it('should verify a payment successfully', async () => {
      const userId = 'user-123';
      const transactionId = 'pay-123';
      const reference = 'ref_123';

      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: transactionId,
        userId,
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'processing',
        description: null,
        providerReference: reference,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      paystackProvider.verifyPayment.mockResolvedValue({
        status: 'success',
        amount: 1000,
        currency: 'NGN',
        paidAt: new Date(),
        customerEmail: 'test@example.com',
        reference,
      });

      prisma.wallet.update.mockResolvedValue({});
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-123',
        userId,
        balance: new Decimal(10000),
      });
      prisma.walletTransaction.create.mockResolvedValue({});
      prisma.paymentIntent.update.mockResolvedValue({
        id: transactionId,
        userId,
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'completed',
        description: null,
        providerReference: reference,
        metadata: {},
        completedAt: new Date(),
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.verifyPayment(userId, transactionId);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
    });
  });

  describe('race conditions & idempotency', () => {
    it('should handle concurrent payment verification requests', async () => {
      const userId = 'user-123';
      const transactionId = 'pay-123';
      const reference = 'ref_123';

      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: transactionId,
        userId,
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'processing',
        description: null,
        providerReference: reference,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      paystackProvider.verifyPayment.mockResolvedValue({
        status: 'success',
        amount: 1000,
        currency: 'NGN',
        paidAt: new Date(),
        customerEmail: 'test@example.com',
        reference,
      });

      prisma.wallet.update.mockResolvedValue({});
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-123',
        userId,
        balance: new Decimal(10000),
      });
      prisma.walletTransaction.create.mockResolvedValue({});
      prisma.paymentIntent.update.mockResolvedValue({
        id: transactionId,
        userId,
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'completed',
        description: null,
        providerReference: reference,
        metadata: {},
        completedAt: new Date(),
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Simulate 3 concurrent verify requests
      const promises = Array.from({ length: 3 }, () =>
        service.verifyPayment(userId, transactionId)
      );

      const results = await Promise.all(promises);

      // Verify that at least one succeeded
      expect(results.some((r) => r.success)).toBe(true);
    });
  });

  describe('getPayment', () => {
    it('should return payment details for owned payment', async () => {
      const userId = 'user-123';
      const paymentId = 'pay-123';

      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: paymentId,
        userId,
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'completed',
        description: 'Test payment',
        providerReference: 'ref_123',
        metadata: {},
        completedAt: new Date(),
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getPayment(userId, paymentId);

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).id).toBe(paymentId);
    });

    it('should throw error for non-existent payment', async () => {
      const userId = 'user-123';
      const paymentId = 'pay-non-existent';

      prisma.paymentIntent.findUnique.mockResolvedValue(null);

      await expect(service.getPayment(userId, paymentId)).rejects.toThrow();
    });

    it('should throw error when user tries to access another user payment', async () => {
      const userId = 'user-123';
      const paymentId = 'pay-123';

      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: paymentId,
        userId: 'user-456',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'completed',
        description: 'Test payment',
        providerReference: 'ref_123',
        metadata: {},
        completedAt: new Date(),
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.getPayment(userId, paymentId)).rejects.toThrow();
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payment history for user', async () => {
      const userId = 'user-123';
      const mockPayments = [
        {
          id: 'pay-1',
          userId,
          amount: new Decimal(1000),
          currency: 'NGN',
          status: 'completed',
          description: 'Payment 1',
          providerReference: 'ref_1',
          metadata: {},
          completedAt: new Date(),
          idempotencyKey: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'pay-2',
          userId,
          amount: new Decimal(2000),
          currency: 'NGN',
          status: 'pending',
          description: 'Payment 2',
          providerReference: 'ref_2',
          metadata: {},
          completedAt: null,
          idempotencyKey: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.paymentIntent.findMany.mockResolvedValue(mockPayments);

      const result = await service.getPaymentHistory(userId);

      expect(result.success).toBe(true);
      expect(result.data?.transactions).toHaveLength(2);
    });

    it('should return empty array if no payments', async () => {
      const userId = 'user-123';

      prisma.paymentIntent.findMany.mockResolvedValue([]);

      const result = await service.getPaymentHistory(userId);

      expect(result.success).toBe(true);
      expect(result.data?.transactions).toEqual([]);
    });
  });

  describe('rollout-aware provider routing', () => {
    const dto = { amount: 1000, currency: 'NGN', description: 'Test payment' };

    beforeEach(() => {
      prisma.paymentIntent.create.mockResolvedValue({
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'pending',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.paymentIntent.update.mockResolvedValue({ id: 'pay-123', status: 'processing' });
      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_paystack',
        authorizationUrl: 'https://checkout.paystack.com/abc',
      });
      (
        service as unknown as { flutterwaveProvider: { initializePayment: jest.Mock } }
      ).flutterwaveProvider.initializePayment.mockResolvedValue({
        reference: 'ref_flutterwave',
        authorizationUrl: 'https://checkout.flutterwave.com/abc',
      });
    });

    it('passes the user id as the rollout bucketing key to both provider flags', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(
          key === 'payment_provider_paystack' || key === 'payment_provider_flutterwave'
        )
      );

      await service.initializePayment('user-123', dto);

      expect(flagService.isEnabled).toHaveBeenCalledWith('payment_provider_paystack', 'user-123');
      expect(flagService.isEnabled).toHaveBeenCalledWith(
        'payment_provider_flutterwave',
        'user-123'
      );
    });

    it('routes to flutterwave when the paystack flag evaluates false for that user', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'payment_provider_flutterwave')
      );

      const result = await service.initializePayment('user-123', dto);

      expect((result.data as Record<string, unknown>).provider).toBe('flutterwave');
      expect((result.data as Record<string, unknown>).reference).toBe('ref_flutterwave');
    });

    it('throws when both providers evaluate false for the user', async () => {
      flagService.isEnabled.mockResolvedValue(false);

      await expect(service.initializePayment('user-123', dto)).rejects.toThrow(
        'Payment processing is temporarily unavailable'
      );
    });
  });

  describe('provider failover (paystack down → flutterwave fallback)', () => {
    const dto = { amount: 1000, currency: 'NGN', description: 'Test payment' };

    beforeEach(() => {
      prisma.paymentIntent.create.mockResolvedValue({
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'pending',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.paymentIntent.update.mockResolvedValue({ id: 'pay-123', status: 'processing' });
      (
        service as unknown as { flutterwaveProvider: { initializePayment: jest.Mock } }
      ).flutterwaveProvider.initializePayment.mockResolvedValue({
        reference: 'ref_flutterwave',
        authorizationUrl: 'https://checkout.flutterwave.com/abc',
      });
      paystackProvider.initializePayment.mockRejectedValue(new Error('Paystack is down (503)'));
      // Both provider flags ON by default → the fallback chain is active.
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(
          key === 'payment_provider_paystack' || key === 'payment_provider_flutterwave'
        )
      );
    });

    it('falls back to flutterwave when paystack fails, and reports the intent with the fallback provider', async () => {
      const result = await service.initializePayment('user-123', dto);

      expect(paystackProvider.initializePayment).toHaveBeenCalled();
      expect(
        (service as unknown as { flutterwaveProvider: { initializePayment: jest.Mock } })
          .flutterwaveProvider.initializePayment
      ).toHaveBeenCalled();
      expect((result.data as Record<string, unknown>).provider).toBe('flutterwave');
      expect((result.data as Record<string, unknown>).reference).toBe('ref_flutterwave');
      // The intent records the provider that actually authorized the checkout.
      expect(prisma.paymentIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            providerReference: 'ref_flutterwave',
            status: 'processing',
          }),
        })
      );
    });

    it('emits a payment_provider_failover analytics event with from/to/reason', async () => {
      await service.initializePayment('user-123', dto);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3001/analytics/track',
        expect.objectContaining({
          eventName: 'payment_provider_failover',
          userId: 'user-123',
          metadata: expect.objectContaining({
            from: 'paystack',
            to: 'flutterwave',
            reason: 'Paystack is down (503)',
          }),
        })
      );
    });

    it('surfaces the primary provider error when BOTH providers fail', async () => {
      (
        service as unknown as { flutterwaveProvider: { initializePayment: jest.Mock } }
      ).flutterwaveProvider.initializePayment.mockRejectedValue(new Error('Flutterwave also down'));

      await expect(service.initializePayment('user-123', dto)).rejects.toThrow(
        'Paystack is down (503)'
      );
      // The intent is marked failed — no phantom processing row.
      expect(prisma.paymentIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) })
      );
    });

    it('does NOT fail over when the fallback provider flag is disabled for the user', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'payment_provider_paystack')
      );
      const flutterwaveInit = (
        service as unknown as {
          flutterwaveProvider: { initializePayment: jest.Mock };
        }
      ).flutterwaveProvider.initializePayment;

      await expect(service.initializePayment('user-123', dto)).rejects.toThrow(
        'Paystack is down (503)'
      );
      expect(flutterwaveInit).not.toHaveBeenCalled();
    });

    it('does NOT fail over when the PRIMARY is flag-disabled and the active (secondary) provider fails', async () => {
      // Paystack flag OFF → flutterwave is the preferred provider; paystack is
      // not an eligible fallback (it was routed away from for a reason).
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'payment_provider_flutterwave')
      );
      (
        service as unknown as { flutterwaveProvider: { initializePayment: jest.Mock } }
      ).flutterwaveProvider.initializePayment.mockRejectedValue(new Error('Flutterwave down'));

      await expect(service.initializePayment('user-123', dto)).rejects.toThrow('Flutterwave down');
      expect(paystackProvider.initializePayment).not.toHaveBeenCalled();
    });

    it('fails over when confirming an intent (confirmIntent)', async () => {
      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: 'intent-1',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'requires_payment',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.confirmIntent('user-123', 'intent-1');

      expect((result.data as Record<string, unknown>).provider).toBe('flutterwave');
      expect((result.data as Record<string, unknown>).checkoutUrl).toBe(
        'https://checkout.flutterwave.com/abc'
      );
      expect(prisma.paymentIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ providerReference: 'ref_flutterwave' }),
        })
      );
    });
  });

  describe('payment_kyc_required', () => {
    const dto = { amount: 1000, currency: 'NGN', description: 'Test payment' };

    it('blocks initializePayment when the flag is on and the user is not KYC-verified', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'payment_kyc_required')
      );

      await expect(service.initializePayment('user-123', dto, false)).rejects.toThrow(
        'KYC verification required before payment'
      );
      expect(prisma.paymentIntent.create).not.toHaveBeenCalled();
    });

    it('allows initializePayment for a KYC-verified user when the flag is on', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(
          key === 'payment_kyc_required' ||
            key === 'payment_provider_paystack' ||
            key === 'payment_provider_flutterwave'
        )
      );
      prisma.paymentIntent.create.mockResolvedValue({
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'pending',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.paymentIntent.update.mockResolvedValue({ id: 'pay-123', status: 'processing' });
      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_1',
        authorizationUrl: 'https://checkout.paystack.com/abc',
      });

      const result = await service.initializePayment('user-123', dto, true);

      expect(result.success).toBe(true);
    });

    it('ignores KYC when the flag is off', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(
          key === 'payment_provider_paystack' || key === 'payment_provider_flutterwave'
        )
      );
      prisma.paymentIntent.create.mockResolvedValue({
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'pending',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.paymentIntent.update.mockResolvedValue({ id: 'pay-123', status: 'processing' });
      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_1',
        authorizationUrl: 'https://checkout.paystack.com/abc',
      });

      const result = await service.initializePayment('user-123', dto, false);

      expect(result.success).toBe(true);
    });
  });

  describe('payment_new_checkout_flow', () => {
    const dto = { amount: 1000, currency: 'NGN', description: 'Test payment' };

    beforeEach(() => {
      prisma.paymentIntent.create.mockResolvedValue({
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'pending',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.paymentIntent.update.mockResolvedValue({ id: 'pay-123', status: 'processing' });
      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_1',
        authorizationUrl: 'https://checkout.paystack.com/abc',
      });
    });

    it('stores a 30-minute expiry in metadata and returns expiresAt when on', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(
          key === 'payment_provider_paystack' ||
            key === 'payment_provider_flutterwave' ||
            key === 'payment_new_checkout_flow'
        )
      );

      const result = await service.initializePayment('user-123', dto);

      const data = result.data as Record<string, unknown>;
      expect(data.expiresAt).toBeDefined();
      const createCall = prisma.paymentIntent.create.mock.calls[0][0];
      expect(createCall.data.metadata.checkoutExpiresAt).toBe(data.expiresAt);
    });

    it('omits expiresAt when the flag is off', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(
          key === 'payment_provider_paystack' || key === 'payment_provider_flutterwave'
        )
      );

      const result = await service.initializePayment('user-123', dto);

      expect((result.data as Record<string, unknown>).expiresAt).toBeUndefined();
    });

    it('rejects verification of an expired session', async () => {
      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'pending',
        description: 'Test payment',
        providerReference: 'ref_1',
        metadata: { checkoutExpiresAt: new Date(Date.now() - 1000).toISOString() },
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.verifyPayment('user-123', 'pay-123')).rejects.toThrow(
        'Checkout session has expired'
      );
    });
  });

  describe('payment_intents_api', () => {
    const dto = { amount: 1000, currency: 'NGN', description: 'Test payment' };

    it('creates an intent without calling the provider', async () => {
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'payment_intents_api')
      );
      prisma.paymentIntent.create.mockResolvedValue({
        id: 'intent-1',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'requires_payment',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createIntent('user-123', dto);

      expect(paystackProvider.initializePayment).not.toHaveBeenCalled();
      expect((result.data as Record<string, unknown>).status).toBe('requires_payment');
      expect(prisma.paymentIntent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'requires_payment' }),
        })
      );
    });

    it('rejects intent creation when the flag is off', async () => {
      flagService.isEnabled.mockResolvedValue(false);

      await expect(service.createIntent('user-123', dto)).rejects.toThrow(
        'Payment intents API is not enabled'
      );
      expect(prisma.paymentIntent.create).not.toHaveBeenCalled();
    });

    it('confirms an intent by calling the provider', async () => {
      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: 'intent-1',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'requires_payment',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.paymentIntent.update.mockResolvedValue({ id: 'intent-1', status: 'processing' });
      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_1',
        authorizationUrl: 'https://checkout.paystack.com/abc',
      });
      flagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(
          key === 'payment_provider_paystack' || key === 'payment_provider_flutterwave'
        )
      );

      const result = await service.confirmIntent('user-123', 'intent-1');

      expect(paystackProvider.initializePayment).toHaveBeenCalledWith(1000, 'NGN', 'user-123');
      expect((result.data as Record<string, unknown>).checkoutUrl).toBe(
        'https://checkout.paystack.com/abc'
      );
    });

    it('rejects confirmation of a non-awaiting intent', async () => {
      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: 'intent-1',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'completed',
        description: 'Test payment',
        providerReference: 'ref_1',
        metadata: {},
        completedAt: new Date(),
        idempotencyKey: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.confirmIntent('user-123', 'intent-1')).rejects.toThrow(
        'Payment intent is not awaiting confirmation'
      );
    });
  });

  describe('optimistic concurrency (PaymentIntent.version)', () => {
    const staleWriteError = () =>
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.19.3',
      });

    it('initializePayment marks the intent with a version-guarded write that increments version', async () => {
      const userId = 'user-123';
      const dto = { amount: 1000, currency: 'NGN', description: 'Test payment' };

      prisma.paymentIntent.create.mockResolvedValue({
        id: 'pay-123',
        userId,
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'pending',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.paymentIntent.update.mockResolvedValue({
        id: 'pay-123',
        status: 'processing',
        version: 1,
      });
      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_1',
        authorizationUrl: 'https://checkout.paystack.com/abc',
      });

      await service.initializePayment(userId, dto);

      expect(prisma.paymentIntent.update).toHaveBeenCalledWith({
        where: { id: 'pay-123', version: 0 },
        data: {
          providerReference: 'ref_1',
          status: 'processing',
          version: { increment: 1 },
        },
      });
    });

    it('confirmIntent rejects a stale confirmation with ConflictException instead of double-writing', async () => {
      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: 'intent-1',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'requires_payment',
        description: 'Test payment',
        providerReference: null,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      paystackProvider.initializePayment.mockResolvedValue({
        reference: 'ref_1',
        authorizationUrl: 'https://checkout.paystack.com/abc',
      });
      // A concurrent request already confirmed the intent → version moved.
      prisma.paymentIntent.update.mockRejectedValue(staleWriteError());

      await expect(service.confirmIntent('user-123', 'intent-1')).rejects.toThrow(
        ConflictException
      );

      expect(prisma.paymentIntent.update).toHaveBeenCalledWith({
        where: { id: 'intent-1', version: 1 },
        data: {
          providerReference: 'ref_1',
          status: 'processing',
          version: { increment: 1 },
        },
      });
    });

    it('verifyPayment treats a stale completed-claim as idempotent success when the intent is already completed', async () => {
      const userId = 'user-123';
      const transactionId = 'pay-123';
      const reference = 'ref_123';

      prisma.paymentIntent.findUnique
        .mockResolvedValueOnce({
          id: transactionId,
          userId,
          amount: new Decimal(1000),
          currency: 'NGN',
          status: 'processing',
          description: null,
          providerReference: reference,
          metadata: {},
          completedAt: null,
          idempotencyKey: null,
          version: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: transactionId,
          userId,
          amount: new Decimal(1000),
          currency: 'NGN',
          status: 'completed',
          description: null,
          providerReference: reference,
          metadata: {},
          completedAt: new Date(),
          idempotencyKey: null,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      paystackProvider.verifyPayment.mockResolvedValue({
        status: 'success',
        amount: 1000,
        currency: 'NGN',
        paidAt: new Date(),
        customerEmail: 'test@example.com',
        reference,
      });
      prisma.wallet.update.mockResolvedValue({});
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-123',
        userId,
        balance: new Decimal(10000),
      });
      prisma.walletTransaction.create.mockResolvedValue({});
      // A concurrent writer won the completed-claim → our write is stale.
      prisma.paymentIntent.update.mockRejectedValue(staleWriteError());

      const result = await service.verifyPayment(userId, transactionId);

      expect(result.success).toBe(true);
      expect((result.data as Record<string, unknown>).status).toBe('completed');
    });

    it('verifyPayment throws ConflictException when the stale claim was not completed elsewhere', async () => {
      const userId = 'user-123';
      const transactionId = 'pay-123';
      const reference = 'ref_123';
      const processingIntent = {
        id: transactionId,
        userId,
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'processing',
        description: null,
        providerReference: reference,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // Initial read AND the fresh re-check both see a non-completed intent.
      prisma.paymentIntent.findUnique
        .mockResolvedValueOnce(processingIntent)
        .mockResolvedValueOnce(processingIntent);
      paystackProvider.verifyPayment.mockResolvedValue({
        status: 'success',
        amount: 1000,
        currency: 'NGN',
        paidAt: new Date(),
        customerEmail: 'test@example.com',
        reference,
      });
      prisma.wallet.update.mockResolvedValue({});
      prisma.wallet.findUnique.mockResolvedValue({
        id: 'wallet-123',
        userId,
        balance: new Decimal(10000),
      });
      prisma.walletTransaction.create.mockResolvedValue({});
      prisma.paymentIntent.update.mockRejectedValue(staleWriteError());

      await expect(service.verifyPayment(userId, transactionId)).rejects.toThrow(ConflictException);
    });

    it('webhook charge.success skips credit-side analytics when the completed-claim is stale', async () => {
      const reference = 'ref_123';
      const intent = {
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'processing',
        description: null,
        providerReference: reference,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.paymentIntent.findFirst.mockResolvedValue(intent);
      prisma.paymentIntent.findUnique.mockResolvedValue(intent); // fresh re-check after the lock
      prisma.paymentIntent.update.mockRejectedValue(staleWriteError());
      (axios.post as jest.Mock).mockClear(); // isolate analytics calls for this test

      await (
        service as unknown as {
          handlePaymentSuccess: (data: { reference: string }, provider: string) => Promise<void>;
        }
      ).handlePaymentSuccess({ reference }, 'paystack');

      // The stale claim must not fire payment_success analytics (a concurrent
      // writer owns that transition).
      expect(axios.post).not.toHaveBeenCalledWith(
        'http://localhost:3001/analytics/track',
        expect.objectContaining({ eventName: 'payment_success' })
      );
      expect(prisma.paymentIntent.update).toHaveBeenCalledWith({
        where: { id: 'pay-123', version: 1 },
        data: expect.objectContaining({ status: 'completed', version: { increment: 1 } }),
      });
    });

    it('webhook charge.failed does not clobber an intent a concurrent writer transitioned', async () => {
      const reference = 'ref_123';
      prisma.paymentIntent.findFirst.mockResolvedValue({
        id: 'pay-123',
        userId: 'user-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        status: 'processing',
        description: null,
        providerReference: reference,
        metadata: {},
        completedAt: null,
        idempotencyKey: null,
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.paymentIntent.update.mockRejectedValue(staleWriteError());
      (axios.post as jest.Mock).mockClear(); // isolate analytics calls for this test

      await (
        service as unknown as {
          handlePaymentFailed: (data: { reference: string }, provider: string) => Promise<void>;
        }
      ).handlePaymentFailed({ reference }, 'paystack');

      // No payment_failed analytics for a stale mark that never landed.
      expect(axios.post).not.toHaveBeenCalledWith(
        'http://localhost:3001/analytics/track',
        expect.objectContaining({ eventName: 'payment_failed' })
      );
    });
  });
});
