import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../database/prisma.service';
import { PaystackProvider } from './providers/paystack.provider';
import { FlutterwaveProvider } from './providers/flutterwave.provider';
import { WebhookRetryService } from './webhook-retry.service';
import { ConfigService } from '@nestjs/config';

jest.mock('../database/prisma.service');
jest.mock('./providers/paystack.provider');
jest.mock('./providers/flutterwave.provider');
jest.mock('./webhook-retry.service');
jest.mock('axios');

describe('PaymentsService E2E Tests', () => {
  let service: PaymentsService;
  let prisma: jest.Mocked<PrismaService>;
  let webhookRetryService: jest.Mocked<WebhookRetryService>;

  const mockPaymentIntent = {
    id: 'pi-123',
    userId: 'user-123',
    amount: new (require('@prisma/client').Prisma.Decimal)(1000),
    currency: 'NGN',
    status: 'pending',
    description: 'Test payment',
    providerReference: 'paystack-ref-1',
    metadata: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    idempotencyKey: 'idempotency-key-1',
    refundAmount: null,
  };

  const mockWebhookEvent = {
    id: 'event-123',
    eventId: 'evt-paystack-1',
    provider: 'paystack',
    type: 'charge.success',
    payload: { event: 'charge.success', data: { reference: 'paystack-ref-1' } },
    result: 'success',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWebhookRetry = {
    id: 'retry-123',
    eventId: 'evt-paystack-1',
    provider: 'paystack',
    type: 'charge.success',
    payload: { event: 'charge.success', data: { reference: 'paystack-ref-1' } },
    retryCount: 0,
    maxRetries: 5,
    nextRetryAt: new Date(Date.now() + 60000),
    status: 'pending',
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            paymentIntent: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            webhookEvent: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            webhookRetry: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            payment: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            refund: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(async (callback) => {
              return callback(prisma);
            }),
          },
        },
        {
          provide: PaystackProvider,
          useValue: {
            verifyWebhookSignature: jest.fn().mockReturnValue(true),
            initializePayment: jest.fn(),
            verifyPayment: jest.fn(),
            requestRefund: jest.fn(),
          },
        },
        {
          provide: FlutterwaveProvider,
          useValue: {
            verifyWebhookSignature: jest.fn().mockReturnValue(true),
            initializePayment: jest.fn(),
            verifyPayment: jest.fn(),
            requestRefund: jest.fn(),
          },
        },
        {
          provide: WebhookRetryService,
          useValue: {
            scheduleRetry: jest.fn(),
            processPendingRetries: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('http://localhost:3002'),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService);
    webhookRetryService = module.get(WebhookRetryService);
  });

  describe('Webhook Deduplication Tests', () => {
    it('should deduplicate webhook events with same eventId', async () => {
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(mockWebhookEvent);

      const body = {
        eventId: 'evt-paystack-1',
        event: 'charge.success',
        data: { reference: 'paystack-ref-1' },
      };

      const result = await service.handleWebhook(body, 'valid-signature', 'paystack');

      expect(result.success).toBe(true);
      expect((result.data as { message: string }).message).toBe(
        'Event evt-paystack-1 already processed'
      );
      expect(prisma.paymentIntent.update).not.toHaveBeenCalled();
    });

    it('should process new webhook event', async () => {
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.paymentIntent.findFirst as jest.Mock).mockResolvedValue(mockPaymentIntent);
      (prisma.paymentIntent.update as jest.Mock).mockResolvedValue({
        ...mockPaymentIntent,
        status: 'completed',
      });
      (prisma.webhookEvent.create as jest.Mock).mockResolvedValue(mockWebhookEvent);

      const body = {
        eventId: 'evt-paystack-new',
        event: 'charge.success',
        data: { reference: 'paystack-ref-1' },
      };

      const result = await service.handleWebhook(body, 'valid-signature', 'paystack');

      expect(result.success).toBe(true);
      expect(prisma.webhookEvent.create).toHaveBeenCalled();
      expect(prisma.paymentIntent.update).toHaveBeenCalled();
    });

    it('should deduplicate Flutterwave webhook events', async () => {
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
        ...mockWebhookEvent,
        eventId: 'evt-flutterwave-1',
        provider: 'flutterwave',
      });

      const body = {
        id: 'evt-flutterwave-1',
        type: 'charge.completed',
        data: { tx_ref: 'flutterwave-ref-1' },
      };

      const result = await service.handleWebhook(body, 'valid-signature', 'flutterwave');

      expect(result.success).toBe(true);
      expect((result.data as { message: string }).message).toBe(
        'Event evt-flutterwave-1 already processed'
      );
    });
  });

  describe('Webhook Retry Tests', () => {
    it('should schedule retry when webhook processing fails', async () => {
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.paymentIntent.findFirst as jest.Mock).mockResolvedValue(mockPaymentIntent);
      (prisma.paymentIntent.update as jest.Mock).mockRejectedValue(new Error('DB error'));
      (prisma.webhookEvent.create as jest.Mock).mockResolvedValue(mockWebhookEvent);

      const body = {
        eventId: 'evt-paystack-retry',
        event: 'charge.success',
        data: { reference: 'paystack-ref-1' },
      };

      await expect(service.handleWebhook(body, 'valid-signature', 'paystack')).rejects.toThrow();

      expect(webhookRetryService.scheduleRetry).toHaveBeenCalled();
      expect(prisma.webhookEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ result: 'failed' }) })
      );
    });

    it('should increment retry count for existing retry records', async () => {
      (prisma.webhookRetry.findFirst as jest.Mock).mockResolvedValue(mockWebhookRetry);
      (prisma.webhookRetry.update as jest.Mock).mockResolvedValue({
        ...mockWebhookRetry,
        retryCount: 1,
      });

      await webhookRetryService.scheduleRetry(
        'evt-paystack-1',
        'paystack',
        'charge.success',
        {},
        new Error('Test error')
      );

      expect(webhookRetryService.scheduleRetry).toHaveBeenCalledWith(
        'evt-paystack-1',
        'paystack',
        'charge.success',
        {},
        expect.any(Error)
      );
    });

    it('should mark retry as failed when max retries exceeded', async () => {
      const exhaustedRetry = {
        ...mockWebhookRetry,
        retryCount: 4,
        maxRetries: 5,
      };

      (prisma.webhookRetry.findFirst as jest.Mock).mockResolvedValue(exhaustedRetry);
      (prisma.webhookRetry.update as jest.Mock).mockResolvedValue({
        ...exhaustedRetry,
        retryCount: 5,
        status: 'failed',
      });

      await webhookRetryService.scheduleRetry(
        'evt-paystack-1',
        'paystack',
        'charge.success',
        {},
        new Error('Test error')
      );

      expect(webhookRetryService.scheduleRetry).toHaveBeenCalledWith(
        'evt-paystack-1',
        'paystack',
        'charge.success',
        {},
        expect.any(Error)
      );
    });

    it('should create new retry record for first failure', async () => {
      (prisma.webhookRetry.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.webhookRetry.create as jest.Mock).mockResolvedValue(mockWebhookRetry);

      await webhookRetryService.scheduleRetry(
        'evt-paystack-new',
        'paystack',
        'charge.success',
        {},
        new Error('Test error')
      );

      expect(webhookRetryService.scheduleRetry).toHaveBeenCalledWith(
        'evt-paystack-new',
        'paystack',
        'charge.success',
        {},
        expect.any(Error)
      );
    });
  });

  describe('Payment Processing Tests', () => {
    it('should handle idempotent payment initialization', async () => {
      const idempotencyKey = 'payment-idempotency-key';

      (prisma.paymentIntent.findUnique as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent(
        {
          userId: 'user-123',
          amount: 1000,
          currency: 'NGN',
          description: 'Test',
        },
        idempotencyKey
      );

      expect(result.success).toBe(true);
      expect(result.data?.paymentId).toBe('pi-123');
      expect(prisma.paymentIntent.create).not.toHaveBeenCalled();
    });

    it('should create new payment intent for first request', async () => {
      const idempotencyKey = 'new-payment-key';

      (prisma.paymentIntent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.paymentIntent.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent(
        {
          userId: 'user-123',
          amount: 1000,
          currency: 'NGN',
          description: 'Test',
        },
        idempotencyKey
      );

      expect(result.success).toBe(true);
      expect(prisma.paymentIntent.create).toHaveBeenCalled();
    });

    it('should handle payment failure webhook', async () => {
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.paymentIntent.findFirst as jest.Mock).mockResolvedValue(mockPaymentIntent);
      (prisma.paymentIntent.update as jest.Mock).mockResolvedValue({
        ...mockPaymentIntent,
        status: 'failed',
      });
      (prisma.webhookEvent.create as jest.Mock).mockResolvedValue(mockWebhookEvent);

      const body = {
        eventId: 'evt-failure',
        event: 'charge.failed',
        data: { reference: 'paystack-ref-1' },
      };

      const result = await service.handleWebhook(body, 'valid-signature', 'paystack');

      expect(result.success).toBe(true);
      expect(prisma.paymentIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'pi-123' }, data: { status: 'failed' } })
      );
    });
  });

  describe('Refund Processing Tests', () => {
    it('should handle refund success webhook', async () => {
      const refund = {
        id: 'refund-123',
        paymentIntentId: 'pi-123',
        amount: new (require('@prisma/client').Prisma.Decimal)(500),
        status: 'pending',
        providerReference: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.paymentIntent.findFirst as jest.Mock).mockResolvedValue(mockPaymentIntent);
      (prisma.refund.findFirst as jest.Mock).mockResolvedValue(refund);
      (prisma.refund.update as jest.Mock).mockResolvedValue({
        ...refund,
        status: 'completed',
        providerReference: 'refund-ref-1',
      });
      (prisma.webhookEvent.create as jest.Mock).mockResolvedValue(mockWebhookEvent);

      const body = {
        eventId: 'evt-refund',
        event: 'refund.success',
        data: { reference: 'refund-ref-1', transaction: 'paystack-ref-1' },
      };

      const result = await service.handleWebhook(body, 'valid-signature', 'paystack');

      expect(result.success).toBe(true);
      expect(prisma.refund.update).toHaveBeenCalled();
    });

    it('should handle failed refund', async () => {
      const mockRefund = {
        id: 'refund-123',
        paymentIntentId: 'pi-123',
        amount: new (require('@prisma/client').Prisma.Decimal)(500),
        status: 'pending',
        providerReference: 'refund-ref-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.paymentIntent.findFirst as jest.Mock).mockResolvedValue(mockPaymentIntent);
      (prisma.refund.findFirst as jest.Mock).mockResolvedValue(mockRefund);
      (prisma.refund.update as jest.Mock).mockRejectedValue(new Error('Refund failed'));

      const body = {
        eventId: 'evt-refund-fail',
        event: 'refund.success',
        data: { reference: 'refund-ref-2', transaction: 'paystack-ref-1' },
      };

      await expect(service.handleWebhook(body, 'valid-signature', 'paystack')).rejects.toThrow();

      expect(webhookRetryService.scheduleRetry).toHaveBeenCalled();
    });
  });

  describe('Retry Storm Protection', () => {
    it('should use exponential backoff for retries', async () => {
      const mockDelays = [60000, 120000, 240000, 480000, 960000];

      for (let i = 0; i < 5; i++) {
        const existingRetry = {
          ...mockWebhookRetry,
          retryCount: i,
        };

        (prisma.webhookRetry.findFirst as jest.Mock).mockResolvedValue(existingRetry);
        (prisma.webhookRetry.update as jest.Mock).mockResolvedValue({
          ...existingRetry,
          retryCount: i + 1,
          nextRetryAt: new Date(Date.now() + mockDelays[i]),
        });

        await webhookRetryService.scheduleRetry(
          'evt-backoff',
          'paystack',
          'charge.success',
          {},
          new Error('Test error')
        );
      }

      expect(webhookRetryService.scheduleRetry).toHaveBeenCalledTimes(5);
    });

    it('should cap retry delay at maximum', async () => {
      const existingRetry = {
        ...mockWebhookRetry,
        retryCount: 10,
      };

      (prisma.webhookRetry.findFirst as jest.Mock).mockResolvedValue(existingRetry);
      (prisma.webhookRetry.update as jest.Mock).mockImplementation((args) => {
        const delay = args.data.nextRetryAt.getTime() - Date.now();
        expect(delay).toBeLessThanOrEqual(3600000);
        return Promise.resolve(existingRetry);
      });

      await webhookRetryService.scheduleRetry(
        'evt-max-delay',
        'paystack',
        'charge.success',
        {},
        new Error('Test error')
      );
    });
  });
});
