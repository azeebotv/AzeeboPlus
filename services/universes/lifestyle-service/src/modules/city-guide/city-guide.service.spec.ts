import { Test, TestingModule } from '@nestjs/testing';
import { CityGuideService } from './city-guide.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CityGuideService', () => {
  let service: CityGuideService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockTag = {
    id: 'tag-1',
    name: 'Restaurant',
    slug: 'restaurant',
  };

  const mockCityGuideEntry = {
    id: 'city-guide-1',
    name: 'Test Restaurant',
    slug: 'test-restaurant',
    type: 'restaurant',
    description: 'Test description',
    coverImage: 'https://example.com/cover.jpg',
    address: '123 Test Street',
    city: 'New York',
    country: 'USA',
    latitude: 40.7128,
    longitude: -74.006,
    rating: 4.5,
    priceLevel: 2,
    hours: '10:00 AM - 10:00 PM',
    phone: '+1-212-123-4567',
    website: 'https://example.com',
    amenities: ['WiFi', 'Outdoor Seating'],
    status: 'published',
    viewCount: 150,
    createdById: 'user-123',
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    tags: [mockTag],
    createdBy: { id: 'user-123', displayName: 'User' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityGuideService,
        {
          provide: PrismaService,
          useValue: {
            cityGuideEntry: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            cityGuideTag: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CityGuideService>(CityGuideService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEntries', () => {
    it('should return paginated city guide entries', async () => {
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([mockCityGuideEntry]);
      (prismaService.cityGuideEntry.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getEntries();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should filter by type', async () => {
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([mockCityGuideEntry]);
      (prismaService.cityGuideEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, 'restaurant');

      expect((prismaService.cityGuideEntry.findMany as jest.Mock).mock.calls[0][0].where.type).toBe(
        'restaurant'
      );
    });

    it('should filter by city', async () => {
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([mockCityGuideEntry]);
      (prismaService.cityGuideEntry.count as jest.Mock).mockResolvedValue(1);

      await service.getEntries(1, 20, undefined, 'New York');

      expect((prismaService.cityGuideEntry.findMany as jest.Mock).mock.calls[0][0].where.city).toBe(
        'New York'
      );
    });
  });

  describe('getEntryBySlug', () => {
    it('should return city guide entry', async () => {
      (prismaService.cityGuideEntry.findUnique as jest.Mock).mockResolvedValue(mockCityGuideEntry);
      (prismaService.cityGuideEntry.update as jest.Mock).mockResolvedValue(mockCityGuideEntry);

      const result = await service.getEntryBySlug('test-restaurant');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).name).toBe('Test Restaurant');
    });

    it('should throw NotFoundException if entry not found', async () => {
      (prismaService.cityGuideEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getEntryBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFeaturedEntries', () => {
    it('should return featured entries', async () => {
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([mockCityGuideEntry]);

      const result = await service.getFeaturedEntries();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createEntry', () => {
    it('should create city guide entry successfully', async () => {
      (prismaService.cityGuideEntry.create as jest.Mock).mockResolvedValue(mockCityGuideEntry);

      const result = await service.createEntry({
        name: 'Test Restaurant',
        type: 'restaurant',
        description: 'Test description',
        city: 'New York',
        country: 'USA',
        createdById: 'user-123',
      });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).slug).toBe('test-restaurant');
    });
  });

  describe('updateEntry', () => {
    it('should update city guide entry successfully', async () => {
      (prismaService.cityGuideEntry.findUnique as jest.Mock).mockResolvedValue(mockCityGuideEntry);
      (prismaService.cityGuideEntry.update as jest.Mock).mockResolvedValue({
        ...mockCityGuideEntry,
        name: 'Updated Restaurant',
        slug: 'updated-restaurant',
      });

      const result = await service.updateEntry('city-guide-1', { name: 'Updated Restaurant' });

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).name).toBe('Updated Restaurant');
    });

    it('should throw NotFoundException if entry not found', async () => {
      (prismaService.cityGuideEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateEntry('not-found', { name: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('deleteEntry', () => {
    it('should delete city guide entry successfully', async () => {
      (prismaService.cityGuideEntry.findUnique as jest.Mock).mockResolvedValue(mockCityGuideEntry);
      (prismaService.cityGuideEntry.delete as jest.Mock).mockResolvedValue(mockCityGuideEntry);

      const result = await service.deleteEntry('city-guide-1');

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.data as any).message).toBe('Entry deleted successfully');
    });

    it('should throw NotFoundException if entry not found', async () => {
      (prismaService.cityGuideEntry.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteEntry('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTags', () => {
    it('should return all tags', async () => {
      (prismaService.cityGuideTag.findMany as jest.Mock).mockResolvedValue([mockTag]);

      const result = await service.getTags();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
