import { Test, TestingModule } from '@nestjs/testing';
import { PaymentReconciliationService } from './payment-reconciliation.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentReconciliationService', () => {
  let service: PaymentReconciliationService;

  const mockPrisma = {
    paymentIntent: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    refund: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentReconciliationService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PaymentReconciliationService>(PaymentReconciliationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestRefund', () => {
    it('should create refund request for successful payment', async () => {
      mockPrisma.paymentIntent.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: 'success',
        amount: 10000,
      });
      mockPrisma.refund.create.mockResolvedValue({
        id: 'refund-1',
        paymentIntentId: 'pay-1',
        amount: 5000,
        status: 'pending',
      });

      const result = await service.requestRefund({
        transactionId: 'pay-1',
        amount: 5000,
        reason: 'Customer request',
        requestedBy: 'admin-1',
      });

      expect(result.status).toBe('pending');
      expect(result.refundId).toBeDefined();
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockPrisma.paymentIntent.findUnique.mockResolvedValue(null);

      await expect(
        service.requestRefund({
          transactionId: 'nonexistent',
          reason: 'Test',
          requestedBy: 'admin',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-successful payment', async () => {
      mockPrisma.paymentIntent.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: 'failed',
        amount: 10000,
      });

      await expect(
        service.requestRefund({
          transactionId: 'pay-1',
          reason: 'Test',
          requestedBy: 'admin',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when refund exceeds payment', async () => {
      mockPrisma.paymentIntent.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: 'success',
        amount: 5000,
      });

      await expect(
        service.requestRefund({
          transactionId: 'pay-1',
          amount: 10000,
          reason: 'Test',
          requestedBy: 'admin',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processRefund', () => {
    it('should approve pending refund', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue({
        id: 'refund-1',
        status: 'pending',
      });
      mockPrisma.refund.update.mockResolvedValue({});

      const result = await service.processRefund('refund-1', 'approved', 'admin-1');

      expect(result.status).toBe('approved');
    });

    it('should reject pending refund', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue({
        id: 'refund-1',
        status: 'pending',
      });
      mockPrisma.refund.update.mockResolvedValue({});

      const result = await service.processRefund('refund-1', 'rejected', 'admin-1');

      expect(result.status).toBe('rejected');
    });

    it('should throw NotFoundException when refund not found', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue(null);

      await expect(service.processRefund('nonexistent', 'approved', 'admin')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when refund already processed', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue({
        id: 'refund-1',
        status: 'approved',
      });

      await expect(service.processRefund('refund-1', 'approved', 'admin')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('reconcileTransactions', () => {
    it('should reconcile transactions for a given date', async () => {
      mockPrisma.paymentIntent.findMany.mockResolvedValue([
        {
          id: 'pay-1',
          amount: 10000,
          status: 'success',
          metadata: { providerVerified: true },
        },
        {
          id: 'pay-2',
          amount: 5000,
          status: 'success',
          metadata: {},
        },
      ]);

      const result = await service.reconcileTransactions(new Date('2024-01-15'));

      expect(result.matched).toBe(1);
      expect(result.mismatched).toBe(1);
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].transactionId).toBe('pay-2');
    });
  });

  describe('getGatewayStatus', () => {
    it('should return gateway status for paystack and flutterwave', async () => {
      const result = await service.getGatewayStatus();

      expect(result).toHaveLength(2);
      expect(result.map((g) => g.provider)).toEqual(['paystack', 'flutterwave']);
    });
  });

  describe('toggleGateway', () => {
    it('should toggle gateway enabled state', async () => {
      const result = await service.toggleGateway('paystack', false, 'admin');

      expect(result).toEqual({ provider: 'paystack', enabled: false });
    });
  });

  describe('switchGatewayMode', () => {
    it('should switch gateway mode', async () => {
      const result = await service.switchGatewayMode('paystack', 'live', 'admin');

      expect(result).toEqual({ provider: 'paystack', mode: 'live' });
    });
  });
});
