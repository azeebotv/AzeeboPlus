import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UniverseService } from './universe.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';

describe('UniverseService Integration - Cross-Service Communication', () => {
  let service: UniverseService;

  const mockPrismaService = {
    universeMap: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    location: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniverseService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
            getOrThrow: jest.fn().mockReturnValue('test-value'),
          },
        },
      ],
    }).compile();

    service = module.get<UniverseService>(UniverseService);

    jest.clearAllMocks();
  });

  describe('getUniverses - Paginated Universe Listing', () => {
    it('should return paginated universes with counts', async () => {
      const mockUniverses = [
        {
          id: 'universe-1',
          name: 'Reality World',
          slug: 'reality-world',
          description: 'A reality universe',
          imageUrl: 'https://img.test/reality.jpg',
          status: 'active',
          _count: { characters: 5, locations: 3 },
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'universe-2',
          name: 'Sports Arena',
          slug: 'sports-arena',
          description: 'A sports universe',
          imageUrl: 'https://img.test/sports.jpg',
          status: 'active',
          _count: { characters: 10, locations: 8 },
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockPrismaService.universeMap.findMany.mockResolvedValue(mockUniverses);
      mockPrismaService.universeMap.count.mockResolvedValue(2);

      const result = await service.getUniverses(1, 20);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.totalPages).toBe(1);
      expect(result.data.items[0]).toMatchObject({
        id: 'universe-1',
        name: 'Reality World',
        slug: 'reality-world',
        characterCount: 5,
        locationCount: 3,
      });
    });

    it('should handle empty results', async () => {
      mockPrismaService.universeMap.findMany.mockResolvedValue([]);
      mockPrismaService.universeMap.count.mockResolvedValue(0);

      const result = await service.getUniverses(1, 20);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
      expect(result.data.totalPages).toBe(0);
    });

    it('should calculate pagination correctly', async () => {
      mockPrismaService.universeMap.findMany.mockResolvedValue([]);
      mockPrismaService.universeMap.count.mockResolvedValue(55);

      const result = await service.getUniverses(2, 20);

      expect(result.data.totalPages).toBe(3);
      expect(result.data.page).toBe(2);
    });

    it('should return failure response on error', async () => {
      mockPrismaService.universeMap.findMany.mockRejectedValue(new Error('DB error'));

      const result = await service.getUniverses(1, 20);

      expect(result.success).toBe(false);
    });
  });

  describe('getUniverseMap - Universe Detail with Locations', () => {
    it('should return universe with formatted locations', async () => {
      const mockUniverse = {
        id: 'universe-1',
        name: 'Reality World',
        slug: 'reality-world',
        description: 'A reality universe',
        imageUrl: 'https://img.test/reality.jpg',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        locations: [
          {
            id: 'loc-1',
            name: 'Villa',
            slug: 'villa',
            description: 'The main villa',
            imageUrl: 'https://img.test/villa.jpg',
            latitude: 40.7128,
            longitude: -74.006,
            universeId: 'universe-1',
            parentId: null,
            createdAt: new Date('2024-01-01'),
          },
          {
            id: 'loc-2',
            name: 'Beach',
            slug: 'beach',
            description: 'The beach area',
            imageUrl: '',
            latitude: 40.7129,
            longitude: -74.007,
            universeId: 'universe-1',
            parentId: 'loc-1',
            createdAt: new Date('2024-01-01'),
          },
        ],
      };

      mockPrismaService.universeMap.findUnique.mockResolvedValue(mockUniverse);

      const result = await service.getUniverseMap('reality-world');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('universe-1');
      expect(result.data.name).toBe('Reality World');
      expect(result.data.locationCount).toBe(2);
      expect(result.data.locations).toHaveLength(2);
      expect(result.data.locations![0]).toMatchObject({
        id: 'loc-1',
        name: 'Villa',
        slug: 'villa',
        universeId: 'universe-1',
      });
    });

    it('should throw NotFoundException for unknown slug', async () => {
      mockPrismaService.universeMap.findUnique.mockResolvedValue(null);

      await expect(service.getUniverseMap('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLocations - Location Listing', () => {
    it('should return all locations when no slug filter', async () => {
      const mockLocations = [
        {
          id: 'loc-1',
          name: 'Villa',
          slug: 'villa',
          description: 'The main villa',
          imageUrl: 'https://img.test/villa.jpg',
          latitude: 40.7128,
          longitude: -74.006,
          universeId: 'universe-1',
          parentId: null,
          createdAt: new Date('2024-01-01'),
          universe: { id: 'universe-1', name: 'Reality World' },
        },
        {
          id: 'loc-2',
          name: 'Studio',
          slug: 'studio',
          description: 'The studio',
          imageUrl: '',
          latitude: 40.713,
          longitude: -74.008,
          universeId: 'universe-2',
          parentId: null,
          createdAt: new Date('2024-01-02'),
          universe: { id: 'universe-2', name: 'Sports Arena' },
        },
      ];

      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);

      const result = await service.getLocations();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        id: 'loc-1',
        name: 'Villa',
        universeName: 'Reality World',
      });
    });

    it('should filter locations by universe slug', async () => {
      mockPrismaService.universeMap.findUnique.mockResolvedValue({
        id: 'universe-1',
        slug: 'reality-world',
      });

      const mockLocations = [
        {
          id: 'loc-1',
          name: 'Villa',
          slug: 'villa',
          description: 'The main villa',
          imageUrl: '',
          latitude: 40.7128,
          longitude: -74.006,
          universeId: 'universe-1',
          parentId: null,
          createdAt: new Date('2024-01-01'),
          universe: { id: 'universe-1', name: 'Reality World' },
        },
      ];

      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);

      const result = await service.getLocations('reality-world');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { universeId: 'universe-1' },
        })
      );
    });

    it('should return empty list when universe slug not found', async () => {
      mockPrismaService.universeMap.findUnique.mockResolvedValue(null);
      mockPrismaService.location.findMany.mockResolvedValue([]);

      const result = await service.getLocations('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getLocationBySlug - Single Location', () => {
    it('should return location with children', async () => {
      const mockLocation = {
        id: 'loc-1',
        name: 'Villa',
        slug: 'villa',
        description: 'The main villa',
        imageUrl: 'https://img.test/villa.jpg',
        latitude: 40.7128,
        longitude: -74.006,
        universeId: 'universe-1',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        universe: { id: 'universe-1', name: 'Reality World' },
        parent: null,
        children: [
          {
            id: 'loc-2',
            name: 'Beach',
            slug: 'beach',
            description: '',
            imageUrl: '',
            latitude: 40.7129,
            longitude: -74.007,
            universeId: 'universe-1',
            parentId: 'loc-1',
            createdAt: new Date('2024-01-01'),
          },
        ],
      };

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);

      const result = await service.getLocationBySlug('villa');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('loc-1');
      expect(result.data.childCount).toBe(1);
      expect(result.data.universeName).toBe('Reality World');
    });

    it('should throw NotFoundException for unknown slug', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(service.getLocationBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLocation - Location Creation', () => {
    it('should create a new location with auto-generated slug', async () => {
      mockPrismaService.universeMap.findUnique.mockResolvedValue({
        id: 'universe-1',
        name: 'Reality World',
      });

      const newLocation = {
        id: 'loc-new',
        name: 'New Room',
        slug: 'new-room',
        description: 'A new room',
        imageUrl: '',
        latitude: 40.714,
        longitude: -74.009,
        universeId: 'universe-1',
        parentId: null,
        createdAt: new Date('2024-01-03'),
        universe: { id: 'universe-1', name: 'Reality World' },
      };

      mockPrismaService.location.create.mockResolvedValue(newLocation);

      const result = await service.createLocation({
        name: 'New Room',
        description: 'A new room',
        universeId: 'universe-1',
        latitude: 40.714,
        longitude: -74.009,
      });

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('New Room');
      expect(result.data.slug).toBe('new-room');
      expect(mockPrismaService.location.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Room',
            slug: 'new-room',
          }),
        })
      );
    });

    it('should throw NotFoundException when universe does not exist', async () => {
      mockPrismaService.universeMap.findUnique.mockResolvedValue(null);

      await expect(
        service.createLocation({
          name: 'New Room',
          universeId: 'nonexistent',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCategories - Static Categories', () => {
    it('should return default categories', async () => {
      const result = await service.getCategories();

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ slug: 'sports' }),
          expect.objectContaining({ slug: 'reality' }),
          expect.objectContaining({ slug: 'games' }),
        ])
      );
    });
  });
});
