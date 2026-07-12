import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../payments/payments.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { PaystackProvider } from '../payments/providers/paystack.provider.js';
import { FlutterwaveProvider } from '../payments/providers/flutterwave.provider.js';
import { WebhookRetryService } from '../payments/webhook-retry.service.js';
import { RedisService } from '../../common/services/redis.service.js';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import axios from 'axios';

jest.mock('axios');

describe('PaymentsService', () => {
  let service: PaymentsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paystackProvider: any;

  beforeEach(async () => {
    prisma = {
      paymentIntent: {
        create: jest.fn(),
        findUnique: jest.fn(),
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
});
