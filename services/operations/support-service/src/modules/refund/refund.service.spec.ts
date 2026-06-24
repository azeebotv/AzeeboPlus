import { Test, TestingModule } from '@nestjs/testing';
import { RefundService } from './refund.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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

describe('RefundService', () => {
  let service: RefundService;
  let prisma: PrismaService;

  const mockPrisma = {
    refund: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
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
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestRefund', () => {
    it('should create a refund request', async () => {
      const refundData = {
        userId: 'user123',
        paymentId: 'pay123',
        amount: new Decimal(1000),
        currency: 'NGN',
        reason: 'User request',
        ticketId: 'ticket123',
      };

      mockPrisma.refund.findFirst.mockResolvedValue(null);
      mockPrisma.refund.create.mockResolvedValue({ id: 'refund123', ...refundData });

      const result = await service.requestRefund(refundData);
      expect(result.id).toBe('refund123');
      expect(prisma.refund.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if refund already exists', async () => {
      const refundData = {
        userId: 'user123',
        paymentId: 'pay123',
        amount: new Decimal(1000),
        currency: 'NGN',
        reason: 'User request',
        ticketId: 'ticket123',
      };

      mockPrisma.refund.findFirst.mockResolvedValue({ id: 'existing123' });

      await expect(service.requestRefund(refundData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRefundById', () => {
    it('should return refund by id', async () => {
      const refund = { id: 'refund123', paymentId: 'pay123', userId: 'user123' };
      mockPrisma.refund.findUnique.mockResolvedValue(refund);

      const result = await service.getRefundById('refund123');
      expect(result).toEqual(refund);
    });

    it('should throw NotFoundException if refund not found', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue(null);

      await expect(service.getRefundById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectRefund', () => {
    it('should reject a refund', async () => {
      const refund = { id: 'refund123', userId: 'user123', status: 'PENDING' };
      mockPrisma.refund.findUnique.mockResolvedValue(refund);
      mockPrisma.refund.update.mockResolvedValue({ ...refund, status: 'REJECTED' });

      const result = await service.rejectRefund('refund123', 'Invalid request');
      expect(result.status).toBe('REJECTED');
    });
  });
});
