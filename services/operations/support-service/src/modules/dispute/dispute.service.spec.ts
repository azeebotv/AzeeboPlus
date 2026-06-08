import { Test, TestingModule } from '@nestjs/testing';
import { DisputeService } from './dispute.service';
import { PrismaService } from '../database/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

describe('DisputeService', () => {
  let service: DisputeService;

  const mockPrisma = {
    payoutDispute: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisputeService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<DisputeService>(DisputeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDispute', () => {
    it('should create a dispute', async () => {
      const disputeData = {
        ticketId: 'ticket123',
        creatorId: 'creator123',
        payoutId: 'payout123',
        amount: new Decimal(5000),
        currency: 'NGN',
        reason: 'Missing payment',
      };

      mockPrisma.payoutDispute.findFirst.mockResolvedValue(null);
      mockPrisma.payoutDispute.create.mockResolvedValue({ id: 'dispute123', ...disputeData });

      const result = await service.createDispute(disputeData);
      expect(result.id).toBe('dispute123');
    });

    it('should throw BadRequestException if dispute already exists', async () => {
      const disputeData = {
        ticketId: 'ticket123',
        creatorId: 'creator123',
        payoutId: 'payout123',
        amount: new Decimal(5000),
        currency: 'NGN',
        reason: 'Missing payment',
      };

      mockPrisma.payoutDispute.findFirst.mockResolvedValue({
        id: 'existing123',
        status: 'PENDING',
      });

      await expect(service.createDispute(disputeData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve a dispute', async () => {
      const dispute = {
        id: 'dispute123',
        creatorId: 'creator123',
        payoutId: 'payout123',
        status: 'PENDING',
      };
      mockPrisma.payoutDispute.update.mockResolvedValue({
        ...dispute,
        status: 'RESOLVED',
        resolution: 'APPROVED',
      });

      const result = await service.resolveDispute('dispute123', 'APPROVED', 'admin123');
      expect(result.status).toBe('RESOLVED');
    });
  });

  describe('getDisputeById', () => {
    it('should throw NotFoundException if dispute not found', async () => {
      mockPrisma.payoutDispute.findUnique.mockResolvedValue(null);

      await expect(service.getDisputeById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
