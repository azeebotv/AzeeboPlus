import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

jest.mock('../database/prisma.service');
jest.mock('@nestjs/axios');

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: jest.Mocked<PrismaService>;
  let httpService: jest.Mocked<HttpService>;

  const mockPaymentIntent = {
    id: 'pay-123',
    userId: 'user-123',
    amount: 1000,
    currency: 'NGN',
    status: 'pending' as const,
    description: 'Wallet funding',
    provider: 'paystack' as const,
    providerReference: null,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: {
            paymentIntent: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            walletTransaction: {
              create: jest.fn(),
            },
            wallet: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                PAYSTACK_SECRET_KEY: 'sk_test_xxx',
                FLUTTERWAVE_SECRET_KEY: 'flw_test_xxx',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prismaService = module.get(PrismaService);
    httpService = module.get(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('should initiate payment with Paystack', async () => {
      prismaService.paymentIntent.create.mockResolvedValue(mockPaymentIntent);
      httpService.post.mockResolvedValue({
        data: {
          status: true,
          data: {
            reference: 'pay_ref_123',
            authorization_url: 'https://paystack.com/pay/xxx',
          },
        },
      });

      const result = await service.initiatePayment({
        userId: 'user-123',
        amount: 1000,
        email: 'test@example.com',
        provider: 'paystack',
        returnUrl: 'https://app.azeebo.com/wallet',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('authorizationUrl');
      expect(result.data).toHaveProperty('reference');
    });

    it('should validate minimum amount', async () => {
      const result = await service.initiatePayment({
        userId: 'user-123',
        amount: 50,
        email: 'test@example.com',
        provider: 'paystack',
        returnUrl: 'https://app.azeebo.com/wallet',
      });

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code', 'AMOUNT_TOO_LOW');
    });
  });

  describe('verifyPayment', () => {
    it('should verify Paystack payment successfully', async () => {
      const completedPayment = { ...mockPaymentIntent, status: 'completed' as const, providerReference: 'pay_ref_123' };
      prismaService.paymentIntent.findUnique.mockResolvedValue(mockPaymentIntent);
      httpService.get.mockResolvedValue({
        data: {
          status: true,
          data: {
            status: 'success',
            reference: 'pay_ref_123',
          },
        },
      });
      prismaService.paymentIntent.update.mockResolvedValue(completedPayment);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.verifyPayment('pay_ref_123', 'paystack');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'completed');
    });

    it('should fail with invalid reference', async () => {
      prismaService.paymentIntent.findUnique.mockResolvedValue(null);

      const result = await service.verifyPayment('invalid_ref', 'paystack');

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code', 'PAYMENT_NOT_FOUND');
    });

    it('should handle failed payment', async () => {
      prismaService.paymentIntent.findUnique.mockResolvedValue(mockPaymentIntent);
      httpService.get.mockResolvedValue({
        data: {
          status: true,
          data: {
            status: 'failed',
            reference: 'pay_ref_123',
          },
        },
      });
      prismaService.paymentIntent.update.mockResolvedValue({ ...mockPaymentIntent, status: 'failed' as const });

      const result = await service.verifyPayment('pay_ref_123', 'paystack');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'failed');
    });
  });

  describe('webhook idempotency', () => {
    it('should process webhook only once (idempotency)', async () => {
      const completedPayment = { ...mockPaymentIntent, status: 'completed' as const };
      prismaService.paymentIntent.findUnique.mockResolvedValue(completedPayment);
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      await service.handleWebhookCallback({
        event: 'charge.success',
        data: {
          id: 'pay_ref_123',
          status: 'success',
          amount: 1000,
        },
      });

      expect(prismaService.wallet.update).toHaveBeenCalledTimes(1);
    });

    it('should ignore duplicate webhook calls', async () => {
      const completedPayment = { ...mockPaymentIntent, status: 'completed' as const };
      prismaService.paymentIntent.findUnique.mockResolvedValue(completedPayment);

      const result = await service.handleWebhookCallback({
        event: 'charge.success',
        data: {
          id: 'pay_ref_123',
          status: 'success',
          amount: 1000,
        },
      });

      expect(result).toEqual({ processed: false, reason: 'already_processed' });
    });
  });

  describe('refund', () => {
    it('should refund successfully', async () => {
      const completedPayment = { ...mockPaymentIntent, status: 'completed' as const, providerReference: 'pay_ref_123' };
      prismaService.paymentIntent.findUnique.mockResolvedValue(completedPayment);
      httpService.post.mockResolvedValue({
        data: {
          status: true,
          data: {
            status: 'refund_processing',
          },
        },
      });
      prismaService.paymentIntent.update.mockResolvedValue({ ...completedPayment, status: 'refunded' as const });
      (prismaService.$transaction as jest.Mock).mockImplementation(async (cb) => cb(prismaService));

      const result = await service.refund('pay-123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status', 'refunded');
    });

    it('should fail to refund pending payment', async () => {
      prismaService.paymentIntent.findUnique.mockResolvedValue(mockPaymentIntent);

      const result = await service.refund('pay-123');

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code', 'CANNOT_REFUND_NON_COMPLETED');
    });
  });
});
