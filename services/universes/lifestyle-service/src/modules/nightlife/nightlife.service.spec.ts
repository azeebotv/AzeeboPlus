import { Test, TestingModule } from '@nestjs/testing';
import { NightlifeService } from './nightlife.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('NightlifeService', () => {
  let service: NightlifeService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockNightlifeEntry = {
    id: 'nightlife-1',
    name: 'Test Club',
    slug: 'test-club',
    type: 'club',
    description: 'Test description',
    coverImage: 'https://example.com/cover.jpg',
    address: '123 Test Street',
    city: 'New York',
    country: 'USA',
    latitude: 40.7128,
    longitude: -74.006,
    hours: '10 PM - 4 AM',
    dressCode: 'Smart Casual',
    coverCharge: 20,
    rating: 4.5,
    status: 'published',
    viewCount: 300,
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    createdById: 'user-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NightlifeService,
        {
          provide: PrismaService,
          useValue: {
            nightlifeEntry: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<NightlifeService>(NightlifeService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEntries', () => {
    it('should return paginated nightlife entries', async () => {
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([mockNightlifeEntry]);
      (prismaService.nightlifeEntry.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getEntries();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by city', async () => {
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([mockNightlifeEntry]);
      (prismaService.nightlifeEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, 'New York');

      expect((prismaService.nightlifeEntry.findMany as jest.Mock).mock.calls[0][0].where.city).toBe(
        'New York'
      );
    });

    it('should filter by type', async () => {
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([mockNightlifeEntry]);
      (prismaService.nightlifeEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, 'club');

      expect((prismaService.nightlifeEntry.findMany as jest.Mock).mock.calls[0][0].where.type).toBe(
        'club'
      );
    });
  });

  describe('getEntryBySlug', () => {
    it('should return nightlife entry', async () => {
      (prismaService.nightlifeEntry.findUnique as jest.Mock).mockResolvedValue(mockNightlifeEntry);
      (prismaService.nightlifeEntry.update as jest.Mock).mockResolvedValue(mockNightlifeEntry);

      const result = await service.getEntryBySlug('test-club');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).name).toBe('Test Club');
    });

    it('should throw NotFoundException if entry not found', async () => {
      (prismaService.nightlifeEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getEntryBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFeatured', () => {
    it('should return featured nightlife entries', async () => {
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([mockNightlifeEntry]);

      const result = await service.getFeatured();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createEntry', () => {
    it('should create nightlife entry successfully', async () => {
      (prismaService.nightlifeEntry.create as jest.Mock).mockResolvedValue(mockNightlifeEntry);

      const result = await service.createEntry({
        name: 'Test Club',
        type: 'club',
        description: 'Test description',
        city: 'New York',
        country: 'USA',
        createdById: 'user-123',
      });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).slug).toBe('test-club');
    });
  });

  describe('updateEntry', () => {
    it('should update nightlife entry successfully', async () => {
      (prismaService.nightlifeEntry.findUnique as jest.Mock).mockResolvedValue(mockNightlifeEntry);
      (prismaService.nightlifeEntry.update as jest.Mock).mockResolvedValue({
        ...mockNightlifeEntry,
        name: 'Updated Club',
        slug: 'updated-club',
      });

      const result = await service.updateEntry('nightlife-1', { name: 'Updated Club' });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).name).toBe('Updated Club');
    });

    it('should throw NotFoundException if entry not found', async () => {
      (prismaService.nightlifeEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateEntry('not-found', { name: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteEntry', () => {
    it('should delete nightlife entry successfully', async () => {
      (prismaService.nightlifeEntry.findUnique as jest.Mock).mockResolvedValue(mockNightlifeEntry);
      (prismaService.nightlifeEntry.delete as jest.Mock).mockResolvedValue(mockNightlifeEntry);

      const result = await service.deleteEntry('nightlife-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).message).toBe('Entry deleted successfully');
    });

    it('should throw NotFoundException if entry not found', async () => {
      (prismaService.nightlifeEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteEntry('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});
