import { Test, TestingModule } from '@nestjs/testing';
import { AppealService } from './appeal.service';
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

describe('AppealService', () => {
  let service: AppealService;

  const mockPrisma = {
    appeal: {
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
        AppealService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AppealService>(AppealService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAppeal', () => {
    it('should create an appeal', async () => {
      const appealData = {
        ticketId: 'ticket123',
        userId: 'user123',
        appealType: 'content',
        resourceId: 'content123',
        resourceType: 'CONTENT',
        originalDecision: 'REMOVED',
        reason: 'False positive',
      };

      mockPrisma.appeal.findFirst.mockResolvedValue(null);
      mockPrisma.appeal.create.mockResolvedValue({ id: 'appeal123', ...appealData });

      const result = await service.createAppeal(appealData);
      expect(result.id).toBe('appeal123');
    });

    it('should throw BadRequestException if appeal already exists', async () => {
      const appealData = {
        ticketId: 'ticket123',
        userId: 'user123',
        appealType: 'content',
        resourceId: 'content123',
        resourceType: 'CONTENT',
        originalDecision: 'REMOVED',
        reason: 'False positive',
      };

      mockPrisma.appeal.findFirst.mockResolvedValue({ id: 'existing123', status: 'PENDING' });

      await expect(service.createAppeal(appealData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('decideAppeal', () => {
    it('should decide an appeal', async () => {
      const appeal = {
        id: 'appeal123',
        userId: 'user123',
        resourceId: 'content123',
        resourceType: 'CONTENT',
        status: 'PENDING',
      };
      mockPrisma.appeal.findUnique.mockResolvedValue(appeal);
      mockPrisma.appeal.update.mockResolvedValue({ ...appeal, status: 'APPROVED' });

      const result = await service.decideAppeal('appeal123', 'APPROVED', 'admin123');
      expect(result.status).toBe('APPROVED');
    });
  });
});
