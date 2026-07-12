import { Test, TestingModule } from '@nestjs/testing';
import { SuspensionService } from './suspension.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

jest.mock('@azeebo/http-client', () => ({
  ServiceClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('SuspensionService', () => {
  let service: SuspensionService;

  const mockPrisma = {
    userSuspension: {
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
        SuspensionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SuspensionService>(SuspensionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSuspension', () => {
    it('should create a suspension', async () => {
      const suspensionData = {
        ticketId: 'ticket123',
        userId: 'user123',
        reason: 'Violation',
        suspendedBy: 'admin123',
        durationDays: 7,
      };

      mockPrisma.userSuspension.findFirst.mockResolvedValue(null);
      mockPrisma.userSuspension.create.mockResolvedValue({ id: 'susp123', ...suspensionData });

      const result = await service.createSuspension(suspensionData);
      expect(result.id).toBe('susp123');
    });

    it('should throw BadRequestException if user already suspended', async () => {
      const suspensionData = {
        ticketId: 'ticket123',
        userId: 'user123',
        reason: 'Violation',
        suspendedBy: 'admin123',
      };

      mockPrisma.userSuspension.findFirst.mockResolvedValue({
        id: 'existing123',
        status: 'ACTIVE',
      });

      await expect(service.createSuspension(suspensionData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reinstateUser', () => {
    it('should reinstate a suspended user', async () => {
      const suspension = { id: 'susp123', userId: 'user123', status: 'ACTIVE' };
      mockPrisma.userSuspension.findUnique.mockResolvedValue(suspension);
      mockPrisma.userSuspension.update.mockResolvedValue({ ...suspension, status: 'REINSTATED' });

      const result = await service.reinstateUser('susp123', 'admin123');
      expect(result.status).toBe('REINSTATED');
    });
  });
});
