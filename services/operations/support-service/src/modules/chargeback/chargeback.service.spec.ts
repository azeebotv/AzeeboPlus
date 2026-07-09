import { Test, TestingModule } from '@nestjs/testing';
import { ChargebackService } from './chargeback.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('@azeebo/api-client', () => ({
  createApiClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: { id: 'txn-123' } }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  }),
  noopTokenStorage: {},
}));

describe('ChargebackService', () => {
  let service: ChargebackService;

  const mockPrisma = {
    chargeback: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('http://mock-url'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChargebackService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ChargebackService>(ChargebackService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChargeback', () => {
    it('should create a chargeback', async () => {
      const chargebackData = {
        ticketId: 'ticket123',
        paymentId: 'pay123',
        userId: 'user123',
        amount: new Decimal(1000),
        currency: 'NGN',
        reason: 'Unauthorized',
      };

      mockPrisma.chargeback.findFirst.mockResolvedValue(null);
      mockPrisma.chargeback.create.mockResolvedValue({ id: 'cb123', ...chargebackData });

      const result = await service.createChargeback(chargebackData);
      expect(result.id).toBe('cb123');
    });

    it('should throw BadRequestException if chargeback already exists', async () => {
      const chargebackData = {
        ticketId: 'ticket123',
        paymentId: 'pay123',
        userId: 'user123',
        amount: new Decimal(1000),
        currency: 'NGN',
        reason: 'Unauthorized',
      };

      mockPrisma.chargeback.findFirst.mockResolvedValue({ id: 'existing123', status: 'PENDING' });

      await expect(service.createChargeback(chargebackData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveChargeback', () => {
    it('should resolve a chargeback', async () => {
      const chargeback = {
        id: 'cb123',
        userId: 'user123',
        paymentId: 'pay123',
        amount: new Decimal(1000),
        currency: 'NGN',
      };
      mockPrisma.chargeback.findUnique.mockResolvedValue(chargeback);
      mockPrisma.chargeback.update.mockResolvedValue({ ...chargeback, status: 'WON' });

      const result = await service.resolveChargeback('cb123', 'WON', 'admin123');
      expect(result.status).toBe('WON');
    });
  });
});
