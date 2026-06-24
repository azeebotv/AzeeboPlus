import { Test, TestingModule } from '@nestjs/testing';
import { RefundService } from './refund.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';

jest.mock('@azeebo/api-client', () => ({
  createApiClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),
}));

describe('RefundService (Integration)', () => {
  let service: RefundService;

  const mockPrisma = {
    refund: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, string> = {
          PAYMENT_SERVICE_URL: 'http://localhost:3003',
          WALLET_SERVICE_URL: 'http://localhost:3002',
          MODERATION_SERVICE_URL: 'http://localhost:3022',
          CONTENT_SERVICE_URL: 'http://localhost:3004',
          USER_SERVICE_URL: 'http://localhost:3001',
          DEFAULT_API_TIMEOUT: '30000',
        };
        return config[key] || defaultValue;
      }),
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          PAYMENT_SERVICE_URL: 'http://localhost:3003',
          WALLET_SERVICE_URL: 'http://localhost:3002',
          MODERATION_SERVICE_URL: 'http://localhost:3022',
          CONTENT_SERVICE_URL: 'http://localhost:3004',
          USER_SERVICE_URL: 'http://localhost:3001',
          DEFAULT_API_TIMEOUT: '30000',
        };
        return config[key] || 'http://localhost:3000';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RefundService>(RefundService);
  });

  describe('requestRefund', () => {
    it('should create a refund request in database', async () => {
      const refundData = {
        userId: 'user-test-123',
        paymentId: 'pay-test-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        reason: 'User request',
        ticketId: 'ticket-test-123',
      };

      mockPrisma.refund.findFirst.mockResolvedValue(null);
      mockPrisma.refund.create.mockResolvedValue({
        id: 'refund-123',
        ...refundData,
        status: 'PENDING',
      });

      const result = await service.requestRefund(refundData);

      expect(result.id).toBeDefined();
      expect(result.userId).toBe(refundData.userId);
      expect(result.paymentId).toBe(refundData.paymentId);
      expect(result.status).toBe('PENDING');
    });

    it('should prevent duplicate refund requests for same payment', async () => {
      const refundData = {
        userId: 'user-duplicate-123',
        paymentId: 'pay-duplicate-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        reason: 'User request',
        ticketId: 'ticket-duplicate-123',
      };

      mockPrisma.refund.findFirst.mockResolvedValue({ id: 'existing-123' });

      await expect(service.requestRefund(refundData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('idempotency', () => {
    it('should handle duplicate refund requests with same idempotency key', async () => {
      const refundData = {
        userId: 'user-idempotent-123',
        paymentId: 'pay-idempotent-123',
        amount: new Decimal(1000),
        currency: 'NGN',
        reason: 'User request',
        ticketId: 'ticket-idempotent-123',
      };

      mockPrisma.refund.findFirst.mockResolvedValue(null);
      mockPrisma.refund.create.mockResolvedValue({
        id: 'refund-123',
        ...refundData,
        status: 'PENDING',
      });
      mockPrisma.refund.count.mockResolvedValue(1);

      const result1 = await service.requestRefund(refundData);

      expect(result1.id).toBeDefined();
    });
  });
});
