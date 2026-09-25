import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { PaystackProvider } from './providers/paystack.provider.js';
import { FlutterwaveProvider } from './providers/flutterwave.provider.js';
import { WebhookRetryService } from './webhook-retry.service.js';
import { RedisService, CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentsService Integration', () => {
  let service: PaymentsService;

  const mockPrismaService = {
    paymentIntent: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refund: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    webhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPaystackProvider = {
    initializePayment: jest.fn(),
    verifyPayment: jest.fn(),
    processRefund: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  };

  const mockFlutterwaveProvider = {
    initializePayment: jest.fn(),
    verifyPayment: jest.fn(),
    processRefund: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  };

  const mockWebhookRetryService = {
    scheduleRetry: jest.fn(),
  };

  const mockRedisService = {
    setIfNotExists: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(1),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidate: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: FeatureFlagService,
          useValue: {
            isEnabled: jest.fn((key: string) =>
              Promise.resolve(
                key === 'payment_provider_paystack' || key === 'payment_provider_flutterwave'
              )
            ),
          },
        },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PaystackProvider, useValue: mockPaystackProvider },
        { provide: FlutterwaveProvider, useValue: mockFlutterwaveProvider },
        { provide: WebhookRetryService, useValue: mockWebhookRetryService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CacheService, useValue: mockCacheService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                ANALYTICS_SERVICE_URL: 'http://analytics-service:3040',
                WALLET_SERVICE_URL: 'http://wallet-service:3010',
              };
              return config[key];
            }),
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              if (key === 'MIN_PAYMENT_AMOUNT_NGN') return 100;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();

    mockPrismaService.$transaction.mockReset();
    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    });

    mockedAxios.post.mockResolvedValue({ data: { success: true } });
  });

  describe('initializePayment', () => {
    it('should create a pending payment record and return checkout URL', async () => {
      const userId = 'user-1';
      const dto = { amount: 5000, currency: 'NGN', description: 'Wallet top-up' };

      mockPrismaService.paymentIntent.create.mockResolvedValue({
        id: 'pi-1',
        userId,
        amount: 5000,
        currency: 'NGN',
        status: 'pending',
        description: 'Wallet top-up',
        metadata: {},
        idempotencyKey: null,
        providerReference: null,
        createdAt: new Date('2025-01-01'),
      });

      mockPaystackProvider.initializePayment.mockResolvedValue({
        reference: 'psk-ref-1',
        authorizationUrl: 'https://checkout.paystack.com/psk-ref-1',
      });

      mockPrismaService.paymentIntent.update.mockResolvedValue({});

      const result = await service.initializePayment(userId, dto);

      expect(result.success).toBe(true);
      expect(result.data.paymentId).toBe('pi-1');
      expect(result.data.checkoutUrl).toBe('https://checkout.paystack.com/psk-ref-1');
      expect(result.data.reference).toBe('psk-ref-1');
      expect(result.data.status).toBe('pending');

      expect(mockPrismaService.paymentIntent.create).toHaveBeenCalledWith({
        data: {
          userId,
          amount: 5000,
          currency: 'NGN',
          status: 'pending',
          description: 'Wallet top-up',
          metadata: {},
          idempotencyKey: undefined,
        },
      });

      expect(mockPaystackProvider.initializePayment).toHaveBeenCalledWith(5000, 'NGN', userId);
    });

    it('should throw BadRequestException when amount is zero or negative', async () => {
      await expect(
        service.initializePayment('user-1', { amount: 0, currency: 'NGN', description: 'test' })
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.initializePayment('user-1', { amount: -100, currency: 'NGN', description: 'test' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when NGN amount is below minimum', async () => {
      await expect(
        service.initializePayment('user-1', { amount: 50, currency: 'NGN', description: 'test' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing payment when idempotencyKey matches', async () => {
      // Prime the short-lived idempotency cache so the service takes the
      // existing-payment fast path instead of creating a new intent.
      mockCacheService.get.mockResolvedValue('true');
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-existing',
        userId: 'user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'processing',
        providerReference: 'psk-ref-existing',
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.initializePayment('user-1', {
        amount: 5000,
        currency: 'NGN',
        description: 'test',
        idempotencyKey: 'idem-key-1',
      });

      expect(result.success).toBe(true);
      expect(result.data.paymentId).toBe('pi-existing');
      expect(mockPrismaService.paymentIntent.create).not.toHaveBeenCalled();
    });

    it('should mark payment as failed when provider call fails', async () => {
      mockPrismaService.paymentIntent.create.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'pending',
        description: 'test',
        metadata: {},
        idempotencyKey: null,
        providerReference: null,
        version: 0,
        createdAt: new Date('2025-01-01'),
      });

      mockPaystackProvider.initializePayment.mockRejectedValue(new Error('Provider unavailable'));

      await expect(
        service.initializePayment('user-1', {
          amount: 5000,
          currency: 'NGN',
          description: 'test',
        })
      ).rejects.toThrow(InternalServerErrorException);

      // The failed-mark is an optimistic-concurrency write keyed on the version
      // the caller read (0) and atomically increments it.
      expect(mockPrismaService.paymentIntent.update).toHaveBeenCalledWith({
        where: { id: 'pi-1', version: 0 },
        data: { status: 'failed', version: { increment: 1 } },
      });
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment and credit wallet on success', async () => {
      const paymentIntent = {
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'processing',
        providerReference: 'psk-ref-1',
        description: 'Wallet top-up',
        completedAt: null,
      };

      mockPrismaService.paymentIntent.findUnique.mockResolvedValue(paymentIntent);
      mockRedisService.setIfNotExists.mockResolvedValue(true);
      mockPaystackProvider.verifyPayment.mockResolvedValue({ status: 'success' });
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await service.verifyPayment('user-1', 'pi-1');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://wallet-service:3010/wallet/credit',
        expect.objectContaining({
          userId: 'user-1',
          amount: 5000,
          description: expect.stringContaining('Wallet top-up'),
          reference: 'psk-ref-1',
        })
      );

      expect(mockCacheService.invalidate).toHaveBeenCalledWith('payment:history:user-1');
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue(null);

      await expect(service.verifyPayment('user-1', 'pi-nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when userId does not match', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-other',
        status: 'processing',
      });

      await expect(service.verifyPayment('user-1', 'pi-1')).rejects.toThrow(BadRequestException);
    });

    it('should return completed status for already-completed payment', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'completed',
        providerReference: 'psk-ref-1',
        description: 'test',
        completedAt: new Date(),
      });

      const result = await service.verifyPayment('user-1', 'pi-1');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('completed');
    });

    it('should acquire distributed lock before verifying', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'processing',
        providerReference: 'psk-ref-1',
        description: 'test',
        completedAt: null,
      });

      mockRedisService.setIfNotExists.mockResolvedValue(true);
      mockPaystackProvider.verifyPayment.mockResolvedValue({ status: 'success' });

      await service.verifyPayment('user-1', 'pi-1');

      expect(mockRedisService.setIfNotExists).toHaveBeenCalledWith(
        'payment_verify_lock:pi-1',
        '1',
        60
      );
    });

    it('should release lock even on failure', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'processing',
        providerReference: 'psk-ref-1',
        description: 'test',
        completedAt: null,
      });

      mockRedisService.setIfNotExists.mockResolvedValue(true);
      mockPaystackProvider.verifyPayment.mockRejectedValue(new Error('Provider error'));

      // A plain provider error (no upstream shape) maps to an honest 500; the
      // lock release is asserted below and happens in the finally block.
      await expect(service.verifyPayment('user-1', 'pi-1')).rejects.toThrow(
        InternalServerErrorException
      );

      expect(mockRedisService.del).toHaveBeenCalledWith('payment_verify_lock:pi-1');
    });
  });

  describe('requestRefund', () => {
    it('should create a refund record for a completed payment', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'completed',
        providerReference: 'psk-ref-1',
        refundAmount: null,
      });

      mockPrismaService.refund.create.mockResolvedValue({
        id: 'refund-1',
        paymentIntentId: 'pi-1',
        amount: 5000,
        reason: 'Wrong purchase',
        status: 'pending',
      });

      mockPaystackProvider.processRefund.mockResolvedValue({ reference: 'refund-psk-1' });
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await service.requestRefund('user-1', 'pi-1', 'Wrong purchase');

      expect(result.success).toBe(true);
      const data = result.data as unknown as Record<string, unknown>;
      expect(data.status).toBe('completed');
      expect(data.refundId).toBe('refund-1');

      expect(mockPrismaService.refund.create).toHaveBeenCalledWith({
        data: {
          paymentIntentId: 'pi-1',
          amount: 5000,
          reason: 'Wrong purchase',
          status: 'pending',
          idempotencyKey: undefined,
        },
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://wallet-service:3010/wallet/debit',
        expect.objectContaining({
          userId: 'user-1',
          amount: 5000,
          description: expect.stringContaining('Wrong purchase'),
        })
      );
    });

    it('should throw NotFoundException when payment does not exist', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue(null);

      await expect(service.requestRefund('user-1', 'pi-nonexistent', 'reason')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when payment is not completed', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        status: 'pending',
        providerReference: 'psk-ref-1',
        refundAmount: null,
      });

      await expect(service.requestRefund('user-1', 'pi-1', 'reason')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when userId does not match', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-other',
        amount: 5000,
        status: 'completed',
        providerReference: 'psk-ref-1',
        refundAmount: null,
      });

      await expect(service.requestRefund('user-1', 'pi-1', 'reason')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should return existing refund for duplicate idempotencyKey', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        status: 'completed',
        providerReference: 'psk-ref-1',
        refundAmount: null,
      });

      mockPrismaService.refund.findUnique.mockResolvedValue({
        id: 'refund-existing',
        amount: 5000,
        status: 'completed',
      });

      const result = await service.requestRefund('user-1', 'pi-1', 'reason', 'idem-refund-1');

      expect(result.success).toBe(true);
      const data = result.data as unknown as Record<string, unknown>;
      expect(data.refundId).toBe('refund-existing');
      expect(mockPrismaService.refund.create).not.toHaveBeenCalled();
    });

    it('should mark refund as failed when provider call fails', async () => {
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        status: 'completed',
        providerReference: 'psk-ref-1',
        refundAmount: null,
      });

      mockPrismaService.refund.create.mockResolvedValue({
        id: 'refund-1',
        paymentIntentId: 'pi-1',
      });

      mockPaystackProvider.processRefund.mockRejectedValue(new Error('Refund provider error'));

      await expect(service.requestRefund('user-1', 'pi-1', 'reason')).rejects.toThrow(
        InternalServerErrorException
      );

      expect(mockPrismaService.refund.update).toHaveBeenCalledWith({
        where: { id: 'refund-1' },
        data: { status: 'failed' },
      });
    });
  });

  describe('getPaymentHistory', () => {
    it('should return paginated payment history', async () => {
      mockCacheService.get.mockResolvedValue(null);

      mockPrismaService.paymentIntent.findMany.mockResolvedValue([
        {
          id: 'pi-2',
          amount: 3000,
          currency: 'NGN',
          status: 'completed',
          description: 'Subscription',
          createdAt: new Date('2025-01-02'),
        },
        {
          id: 'pi-1',
          amount: 5000,
          currency: 'NGN',
          status: 'completed',
          description: 'Wallet top-up',
          createdAt: new Date('2025-01-01'),
        },
      ]);

      const result = await service.getPaymentHistory('user-1');

      expect(result.success).toBe(true);
      expect(result.data.transactions).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(result.data.transactions[0].id).toBe('pi-2');
      expect(result.data.transactions[1].id).toBe('pi-1');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return cached history when available', async () => {
      const cachedResult = {
        success: true,
        data: {
          transactions: [{ id: 'pi-1', type: 'payment', amount: 5000 }],
          total: 1,
          page: 1,
          limit: 50,
        },
      };

      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getPaymentHistory('user-1');

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.paymentIntent.findMany).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should process charge.success webhook and credit wallet', async () => {
      mockPaystackProvider.verifyWebhookSignature.mockReturnValue(true);

      mockPrismaService.webhookEvent.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentIntent.findFirst.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        currency: 'NGN',
        status: 'processing',
        providerReference: 'psk-ref-1',
        description: 'Wallet top-up',
      });
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue(null);

      mockRedisService.setIfNotExists.mockResolvedValue(true);
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await service.handleWebhook(
        {
          eventId: 'evt-1',
          event: 'charge.success',
          data: { reference: 'psk-ref-1' },
        },
        'valid-signature'
      );

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://wallet-service:3010/wallet/credit',
        expect.objectContaining({ userId: 'user-1', amount: 5000 })
      );
      expect(mockPrismaService.webhookEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'evt-1',
          result: 'success',
        }),
      });
    });

    it('should throw BadRequestException when webhook signature is missing', async () => {
      await expect(
        service.handleWebhook({ eventId: 'evt-1', event: 'charge.success' }, undefined)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when webhook signature is invalid', async () => {
      mockPaystackProvider.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.handleWebhook({ eventId: 'evt-1', event: 'charge.success' }, 'bad-signature')
      ).rejects.toThrow(BadRequestException);
    });

    it('should skip already-processed webhook events', async () => {
      mockPaystackProvider.verifyWebhookSignature.mockReturnValue(true);
      mockPrismaService.webhookEvent.findUnique.mockResolvedValue({
        eventId: 'evt-1',
        result: 'success',
      });

      const result = await service.handleWebhook(
        { eventId: 'evt-1', event: 'charge.success', data: { reference: 'psk-ref-1' } },
        'valid-signature'
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.paymentIntent.findFirst).not.toHaveBeenCalled();
    });

    it('should handle charge.failed webhook and mark payment as failed', async () => {
      mockPaystackProvider.verifyWebhookSignature.mockReturnValue(true);
      mockPrismaService.webhookEvent.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentIntent.findFirst.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        status: 'processing',
        providerReference: 'psk-ref-1',
        version: 0,
      });

      const result = await service.handleWebhook(
        {
          eventId: 'evt-2',
          event: 'charge.failed',
          data: { reference: 'psk-ref-1' },
        },
        'valid-signature'
      );

      expect(result.success).toBe(true);
      // The failed-mark is keyed on the version read (0) and increments it.
      expect(mockPrismaService.paymentIntent.update).toHaveBeenCalledWith({
        where: { id: 'pi-1', version: 0 },
        data: { status: 'failed', version: { increment: 1 } },
      });
    });

    it('should schedule retry when webhook processing fails', async () => {
      mockPaystackProvider.verifyWebhookSignature.mockReturnValue(true);
      mockPrismaService.webhookEvent.findUnique.mockResolvedValue(null);
      mockPrismaService.paymentIntent.findFirst.mockResolvedValue({
        id: 'pi-1',
        userId: 'user-1',
        amount: 5000,
        status: 'processing',
        providerReference: 'psk-ref-1',
        description: 'test',
      });
      mockPrismaService.paymentIntent.findUnique.mockResolvedValue(null);

      mockRedisService.setIfNotExists.mockResolvedValue(true);
      mockedAxios.post.mockRejectedValue(new Error('Wallet service down'));

      await expect(
        service.handleWebhook(
          {
            eventId: 'evt-3',
            event: 'charge.success',
            data: { reference: 'psk-ref-1' },
          },
          'valid-signature'
        )
      ).rejects.toThrow();

      expect(mockWebhookRetryService.scheduleRetry).toHaveBeenCalledWith(
        'evt-3',
        'paystack',
        'charge.success',
        expect.any(Object),
        expect.any(Error)
      );
    });

    it('should acknowledge unhandled event types', async () => {
      mockPaystackProvider.verifyWebhookSignature.mockReturnValue(true);
      mockPrismaService.webhookEvent.findUnique.mockResolvedValue(null);

      const result = await service.handleWebhook(
        { eventId: 'evt-4', event: 'subscription.created', data: {} },
        'valid-signature'
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.webhookEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ result: 'ignored' }),
      });
    });
  });
});
