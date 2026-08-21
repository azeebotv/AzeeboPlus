import { Test, TestingModule } from '@nestjs/testing';
import { CreatorPayoutService } from './creator-payout.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('CreatorPayoutService', () => {
  let service: CreatorPayoutService;

  const mockPrisma = {
    creatorEarning: {
      findMany: jest.fn(),
    },
    payoutRequest: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CreatorPayoutService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<CreatorPayoutService>(CreatorPayoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCreatorEarnings', () => {
    it('should calculate earnings correctly', async () => {
      mockPrisma.creatorEarning.findMany.mockResolvedValue([{ amount: 10000 }, { amount: 5000 }]);
      mockPrisma.payoutRequest.findMany.mockResolvedValue([
        { amount: 3000, status: 'completed' },
        { amount: 2000, status: 'pending' },
      ]);

      const result = await service.getCreatorEarnings('creator-1');

      expect(result.totalEarnings).toBe('15000');
      expect(result.paidOut).toBe('3000');
      expect(result.pendingPayouts).toBe('2000');
    });

    it('should handle zero earnings', async () => {
      mockPrisma.creatorEarning.findMany.mockResolvedValue([]);
      mockPrisma.payoutRequest.findMany.mockResolvedValue([]);

      const result = await service.getCreatorEarnings('creator-1');

      expect(result.totalEarnings).toBe('0');
    });
  });

  describe('requestPayout', () => {
    it('should create payout request when sufficient balance', async () => {
      mockPrisma.creatorEarning.findMany.mockResolvedValue([{ amount: 100000 }]);
      mockPrisma.payoutRequest.findMany.mockResolvedValue([]);
      mockPrisma.payoutRequest.create.mockResolvedValue({
        id: 'payout-1',
        creatorId: 'creator-1',
        amount: 50000,
        method: 'bank_transfer',
        status: 'pending',
        createdAt: new Date(),
      });

      const result = await service.requestPayout({
        creatorId: 'creator-1',
        amount: 50000,
        method: 'bank_transfer',
        accountDetails: { bankName: 'Test Bank', accountNumber: '123456789' },
      });

      expect(result.status).toBe('pending');
      expect(result.amount).toBe('50000');
    });

    it('should throw when insufficient balance', async () => {
      mockPrisma.creatorEarning.findMany.mockResolvedValue([{ amount: 10000 }]);
      mockPrisma.payoutRequest.findMany.mockResolvedValue([]);

      await expect(
        service.requestPayout({
          creatorId: 'creator-1',
          amount: 50000,
          method: 'bank_transfer',
          accountDetails: {},
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when below minimum payout', async () => {
      mockPrisma.creatorEarning.findMany.mockResolvedValue([{ amount: 100000 }]);
      mockPrisma.payoutRequest.findMany.mockResolvedValue([]);

      await expect(
        service.requestPayout({
          creatorId: 'creator-1',
          amount: 1000,
          method: 'bank_transfer',
          accountDetails: {},
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPayoutHistory', () => {
    it('should return payout history', async () => {
      mockPrisma.payoutRequest.findMany.mockResolvedValue([
        {
          id: 'p1',
          creatorId: 'c1',
          amount: 50000,
          method: 'bank_transfer',
          status: 'completed',
          createdAt: new Date(),
        },
        {
          id: 'p2',
          creatorId: 'c1',
          amount: 30000,
          method: 'mobile_money',
          status: 'pending',
          createdAt: new Date(),
        },
      ]);

      const result = await service.getPayoutHistory('creator-1');

      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe('50000');
    });
  });
});
