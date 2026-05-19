import { Test, TestingModule } from '@nestjs/testing';
import { TakedownService } from './takedown.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('@azeebo/api-client', () => ({
  createApiClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),
}));

describe('TakedownService', () => {
  let service: TakedownService;

  const mockPrisma = {
    contentTakedown: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TakedownService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<TakedownService>(TakedownService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTakedown', () => {
    it('should create a takedown', async () => {
      const takedownData = {
        ticketId: 'ticket123',
        contentId: 'content123',
        reportedBy: 'user123',
        reason: 'Violation',
      };

      mockPrisma.contentTakedown.create.mockResolvedValue({ id: 'td123', ...takedownData });

      const result = await service.createTakedown(takedownData);
      expect(result.id).toBe('td123');
    });
  });

  describe('decideTakedown', () => {
    it('should decide a takedown', async () => {
      const takedown = { id: 'td123', contentId: 'content123', status: 'PENDING' };
      mockPrisma.contentTakedown.update.mockResolvedValue({ ...takedown, status: 'REMOVED' });

      const result = await service.decideTakedown('td123', 'REMOVED', 'admin123');
      expect(result.status).toBe('REMOVED');
    });
  });

  describe('getTakedownById', () => {
    it('should throw NotFoundException if takedown not found', async () => {
      mockPrisma.contentTakedown.findUnique.mockResolvedValue(null);

      await expect(service.getTakedownById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
