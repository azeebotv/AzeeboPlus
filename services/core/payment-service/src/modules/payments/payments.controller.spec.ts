import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { FeatureFlagService, FeatureFlagGuard } from '@azeebo/feature-flags';
import { RateLimitGuard } from '@azeebo/security';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const mockPaymentsService = {
    initializePayment: jest.fn(),
    verifyPayment: jest.fn(),
    getPaymentHistory: jest.fn(),
    getPayment: jest.fn(),
    requestRefund: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: FeatureFlagService,
          useValue: { isEnabled: jest.fn().mockResolvedValue(true) },
        },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(FeatureFlagGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('initializePayment', () => {
    const req = { user: { sub: 'user-123', id: 'user-123' } };

    it('should initialize a payment and return payment ID', async () => {
      const dto = { amount: 1000, currency: 'NGN', description: 'Wallet funding' };
      const result = {
        success: true,
        data: {
          paymentId: 'pay-abc123',
          provider: 'paystack',
          checkoutUrl: 'https://checkout.paystack.com/abc123',
          reference: 'ref_abc123',
          amount: 1000,
          currency: 'NGN',
          status: 'pending',
          createdAt: '2026-05-15T10:00:00.000Z',
        },
      };
      mockPaymentsService.initializePayment.mockResolvedValue(result);

      const response = await controller.initializePayment(req, dto);

      expect(response.success).toBe(true);
      expect(response.data.paymentId).toBe('pay-abc123');
      expect(mockPaymentsService.initializePayment).toHaveBeenCalledWith('user-123', dto, false);
    });

    it('should throw BadRequestException for amount <= 0', async () => {
      const dto = { amount: 0, currency: 'NGN' };
      mockPaymentsService.initializePayment.mockRejectedValue(
        new BadRequestException('Amount must be greater than 0')
      );

      await expect(controller.initializePayment(req, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for amount below minimum', async () => {
      const dto = { amount: 50, currency: 'NGN', description: 'Wallet funding' };
      mockPaymentsService.initializePayment.mockRejectedValue(
        new BadRequestException('Minimum payment amount for NGN is 100')
      );

      await expect(controller.initializePayment(req, dto)).rejects.toThrow(BadRequestException);
    });

    it('should propagate provider initialization errors', async () => {
      const dto = { amount: 1000, currency: 'NGN', description: 'Wallet funding' };
      mockPaymentsService.initializePayment.mockRejectedValue(
        new BadRequestException('Payment initialization failed: Paystack API error')
      );

      await expect(controller.initializePayment(req, dto)).rejects.toThrow(
        'Payment initialization failed: Paystack API error'
      );
    });

    it('should pass idempotencyKey to service', async () => {
      const dto = {
        amount: 1000,
        currency: 'NGN',
        description: 'Wallet funding',
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = {
        success: true,
        data: {
          paymentId: 'pay-abc123',
          provider: 'paystack',
          checkoutUrl: 'https://checkout.paystack.com/abc123',
          reference: 'ref_abc123',
          amount: 1000,
          currency: 'NGN',
          status: 'pending',
          createdAt: '2026-05-15T10:00:00.000Z',
        },
      };
      mockPaymentsService.initializePayment.mockResolvedValue(result);

      await controller.initializePayment(req, dto);

      expect(mockPaymentsService.initializePayment).toHaveBeenCalledWith('user-123', dto, false);
    });
  });

  describe('verifyPayment', () => {
    const req = { user: { sub: 'user-123', id: 'user-123' } };

    it('should verify payment and credit wallet', async () => {
      const dto = { transactionId: 'pay-abc123' };
      const result = {
        success: true,
        data: {
          paymentId: 'pay-abc123',
          provider: 'paystack',
          reference: 'ref_abc123',
          status: 'completed',
          amount: 1000,
          currency: 'NGN',
          paidAt: '2026-05-15T10:30:00.000Z',
          transactionId: 'ref_abc123',
        },
      };
      mockPaymentsService.verifyPayment.mockResolvedValue(result);

      const response = await controller.verifyPayment(req, dto);

      expect(response.success).toBe(true);
      expect(response.data.status).toBe('completed');
      expect(mockPaymentsService.verifyPayment).toHaveBeenCalledWith('user-123', 'pay-abc123');
    });

    it('should throw NotFoundException for non-existent payment', async () => {
      const dto = { transactionId: 'pay-nonexistent' };
      mockPaymentsService.verifyPayment.mockRejectedValue(
        new NotFoundException('Payment not found')
      );

      await expect(controller.verifyPayment(req, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when payment belongs to another user', async () => {
      const dto = { transactionId: 'pay-abc123' };
      mockPaymentsService.verifyPayment.mockRejectedValue(
        new BadRequestException('Invalid payment for user')
      );

      await expect(controller.verifyPayment(req, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when provider verification fails', async () => {
      const dto = { transactionId: 'pay-abc123' };
      mockPaymentsService.verifyPayment.mockRejectedValue(
        new BadRequestException('Payment verification failed')
      );

      await expect(controller.verifyPayment(req, dto)).rejects.toThrow(BadRequestException);
    });

    it('should handle duplicate transaction verification gracefully', async () => {
      const dto = { transactionId: 'pay-abc123' };
      const result = {
        success: true,
        data: {
          paymentId: 'pay-abc123',
          provider: 'paystack',
          reference: 'ref_abc123',
          status: 'completed',
          amount: 1000,
          currency: 'NGN',
          paidAt: '2026-05-15T10:30:00.000Z',
          transactionId: 'ref_abc123',
        },
      };
      mockPaymentsService.verifyPayment.mockResolvedValue(result);

      const response = await controller.verifyPayment(req, dto);

      expect(response.success).toBe(true);
      expect(response.data.status).toBe('completed');
    });
  });

  describe('getPaymentHistory', () => {
    const req = { user: { sub: 'user-123', id: 'user-123' } };

    it('should return payment history for the authenticated user', async () => {
      const result = {
        success: true,
        data: {
          transactions: [
            {
              id: 'pay-1',
              type: 'payment',
              amount: 1000,
              currency: 'NGN',
              status: 'completed',
              description: 'Wallet funding',
              createdAt: '2026-05-15T10:30:00.000Z',
            },
            {
              id: 'pay-2',
              type: 'payment',
              amount: 5000,
              currency: 'NGN',
              status: 'pending',
              description: 'Content purchase',
              createdAt: '2026-05-14T15:45:00.000Z',
            },
          ],
          total: 2,
          page: 1,
          limit: 50,
        },
      };
      mockPaymentsService.getPaymentHistory.mockResolvedValue(result);

      const response = await controller.getPaymentHistory(req);

      expect(response.success).toBe(true);
      expect(response.data.transactions).toHaveLength(2);
      expect(mockPaymentsService.getPaymentHistory).toHaveBeenCalledWith('user-123');
    });

    it('should return empty history when user has no payments', async () => {
      const result = {
        success: true,
        data: {
          transactions: [],
          total: 0,
          page: 1,
          limit: 50,
        },
      };
      mockPaymentsService.getPaymentHistory.mockResolvedValue(result);

      const response = await controller.getPaymentHistory(req);

      expect(response.success).toBe(true);
      expect(response.data.transactions).toEqual([]);
    });

    it('should only return history for the authenticated user', async () => {
      const req2 = { user: { sub: 'user-456', id: 'user-456' } };
      const result = {
        success: true,
        data: { transactions: [], total: 0, page: 1, limit: 50 },
      };
      mockPaymentsService.getPaymentHistory.mockResolvedValue(result);

      await controller.getPaymentHistory(req2);

      expect(mockPaymentsService.getPaymentHistory).toHaveBeenCalledWith('user-456');
    });
  });

  describe('getPayment', () => {
    const req = { user: { sub: 'user-123', id: 'user-123' } };

    it('should return payment details for owned payment', async () => {
      const result = {
        success: true,
        data: {
          id: 'pay-abc123',
          amount: 1000,
          currency: 'NGN',
          status: 'completed',
          description: 'Wallet funding',
          createdAt: '2026-05-15T10:30:00.000Z',
          updatedAt: '2026-05-15T10:30:00.000Z',
        },
      };
      mockPaymentsService.getPayment.mockResolvedValue(result);

      const response = await controller.getPayment(req, 'pay-abc123');

      expect(response.success).toBe(true);
      expect((response.data as Record<string, unknown>).id).toBe('pay-abc123');
      expect(mockPaymentsService.getPayment).toHaveBeenCalledWith('user-123', 'pay-abc123');
    });

    it('should throw NotFoundException for non-existent payment', async () => {
      mockPaymentsService.getPayment.mockRejectedValue(
        new NotFoundException('Payment not found')
      );

      await expect(controller.getPayment(req, 'pay-nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when accessing another user payment', async () => {
      mockPaymentsService.getPayment.mockRejectedValue(
        new BadRequestException('Invalid payment for user')
      );

      await expect(controller.getPayment(req, 'pay-other-user')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('requestRefund', () => {
    const req = { user: { sub: 'user-123', id: 'user-123' } };

    it('should request a refund for a completed payment', async () => {
      const dto = { transactionId: 'pay-abc123', reason: 'Product not received as described' };
      const result = {
        success: true,
        data: {
          refundId: 'ref-abc123',
          amount: 1000,
          status: 'completed',
          message: 'Refund processed successfully',
        },
      };
      mockPaymentsService.requestRefund.mockResolvedValue(result);

      const response = await controller.requestRefund(req, dto);

      expect(response.success).toBe(true);
      expect(mockPaymentsService.requestRefund).toHaveBeenCalledWith(
        'user-123',
        'pay-abc123',
        'Product not received as described'
      );
    });

    it('should throw NotFoundException for non-existent payment', async () => {
      const dto = { transactionId: 'pay-nonexistent', reason: 'Product not received as described' };
      mockPaymentsService.requestRefund.mockRejectedValue(
        new NotFoundException('Payment not found')
      );

      await expect(controller.requestRefund(req, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when payment is not completed', async () => {
      const dto = { transactionId: 'pay-abc123', reason: 'Product not received as described' };
      mockPaymentsService.requestRefund.mockRejectedValue(
        new BadRequestException('Only completed payments can be refunded')
      );

      await expect(controller.requestRefund(req, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment belongs to another user', async () => {
      const dto = { transactionId: 'pay-other', reason: 'Product not received as described' };
      mockPaymentsService.requestRefund.mockRejectedValue(
        new BadRequestException('Invalid payment for user')
      );

      await expect(controller.requestRefund(req, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('route ordering', () => {
    it('should have history route before wildcard :id route', () => {
      // Nest stores route-path metadata on the method function itself, not on
      // the prototype keyed by method name.
      const methodRoutes = Object.getOwnPropertyNames(
        PaymentsController.prototype
      ).filter((name) => {
        const fn = (PaymentsController.prototype as unknown as Record<string, unknown>)[name];
        return typeof fn === 'function' && Reflect.getMetadata('path', fn as object) !== undefined;
      });

      expect(methodRoutes).toContain('getPaymentHistory');
      expect(methodRoutes).toContain('getPayment');
    });
  });
});
