import { Test, TestingModule } from '@nestjs/testing';
import { UniverseService } from './universe.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UniverseService', () => {
  let service: UniverseService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniverseService,
        {
          provide: PrismaService,
          useValue: {
            universeMap: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() },
            location: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UniverseService>(UniverseService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUniverses', () => {
    it('should return paginated universe list (happy path)', async () => {
      const mockDate = new Date('2024-01-01');
      const mockUniverses = [
        {
          id: 'universe-1',
          name: 'Universe 1',
          slug: 'universe-1',
          description: 'Description',
          imageUrl: '',
          status: 'active',
          createdAt: mockDate,
          _count: { characters: 10, locations: 5 },
        },
      ];
      (prismaService.universeMap.findMany as jest.Mock).mockResolvedValue(mockUniverses);
      (prismaService.universeMap.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getUniverses();

      expect(result.success).toBe(true);
      expect(result.data.items.length).toBe(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
    });

    it('should return empty list when no universes exist', async () => {
      (prismaService.universeMap.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universeMap.count as jest.Mock).mockResolvedValue(0);

      const result = await service.getUniverses();

      expect(result.success).toBe(true);
      expect(result.data.items.length).toBe(0);
    });
  });

  describe('getUniverseMap', () => {
    const slug = 'universe-1';

    it('should return universe with locations (happy path)', async () => {
      const mockDate = new Date('2024-01-01');
      const mockUniverse = {
        id: 'universe-1',
        name: 'Universe 1',
        slug,
        description: 'Description',
        imageUrl: '',
        status: 'active',
        createdAt: mockDate,
        locations: [
          {
            id: 'loc-1',
            name: 'Location 1',
            slug: 'loc-1',
            description: '',
            imageUrl: '',
            latitude: 0,
            longitude: 0,
            universeId: 'universe-1',
            parentId: null,
            createdAt: mockDate,
          },
        ],
      };
      (prismaService.universeMap.findUnique as jest.Mock).mockResolvedValue(mockUniverse);

      const result = await service.getUniverseMap(slug);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Universe 1');
      expect(result.data.locations?.length).toBe(1);
    });

    it('should throw NotFoundException when universe not found', async () => {
      (prismaService.universeMap.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getUniverseMap(slug)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLocations', () => {
    it('should return all locations when no filter', async () => {
      const mockDate = new Date('2024-01-01');
      const mockLocations = [
        {
          id: 'loc-1',
          name: 'Location 1',
          slug: 'loc-1',
          description: '',
          imageUrl: '',
          latitude: 0,
          longitude: 0,
          universeId: 'universe-1',
          parentId: null,
          createdAt: mockDate,
          universe: { name: 'Universe 1' },
        },
      ];
      (prismaService.location.findMany as jest.Mock).mockResolvedValue(mockLocations);

      const result = await service.getLocations();

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
    });

    it('should filter locations by universe', async () => {
      const mockDate = new Date('2024-01-01');
      const mockUniverse = { id: 'universe-1', slug: 'universe-1' };
      const mockLocations = [
        {
          id: 'loc-1',
          name: 'Location 1',
          slug: 'loc-1',
          description: '',
          imageUrl: '',
          latitude: 0,
          longitude: 0,
          universeId: 'universe-1',
          parentId: null,
          createdAt: mockDate,
          universe: { name: 'Universe 1' },
        },
      ];

      (prismaService.universeMap.findUnique as jest.Mock).mockResolvedValue(mockUniverse);
      (prismaService.location.findMany as jest.Mock).mockResolvedValue(mockLocations);

      const result = await service.getLocations('universe-1');

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
    });
  });

  describe('getLocationBySlug', () => {
    const slug = 'location-1';

    it('should return location with children (happy path)', async () => {
      const mockDate = new Date('2024-01-01');
      const mockLocation = {
        id: 'loc-1',
        name: 'Location 1',
        slug,
        description: 'Desc',
        imageUrl: '',
        latitude: 10,
        longitude: 20,
        universeId: 'universe-1',
        parentId: null,
        createdAt: mockDate,
        universe: { name: 'Universe 1' },
        parent: null,
        children: [
          {
            id: 'child-1',
            name: 'Child',
            slug: 'child',
            description: '',
            imageUrl: '',
            latitude: 0,
            longitude: 0,
            universeId: 'universe-1',
            parentId: 'loc-1',
            createdAt: mockDate,
          },
        ],
      };
      (prismaService.location.findUnique as jest.Mock).mockResolvedValue(mockLocation);

      const result = await service.getLocationBySlug(slug);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Location 1');
      expect(result.data.childCount).toBe(1);
      expect(result.data.children?.length).toBe(1);
    });

    it('should throw NotFoundException when location not found', async () => {
      (prismaService.location.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getLocationBySlug(slug)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createLocation', () => {
    const universeId = 'universe-1';
    const locationData = { name: 'New Location', universeId };

    it('should create location successfully (happy path)', async () => {
      const mockUniverse = { id: universeId, name: 'Universe 1' };
      const mockDate = new Date('2024-01-01');
      const mockLocation = {
        id: 'loc-1',
        name: 'New Location',
        slug: 'new-location',
        description: null,
        imageUrl: '',
        latitude: null,
        longitude: null,
        universeId,
        parentId: null,
        createdAt: mockDate,
        universe: { name: 'Universe 1' },
      };

      (prismaService.universeMap.findUnique as jest.Mock).mockResolvedValue(mockUniverse);
      (prismaService.location.create as jest.Mock).mockResolvedValue(mockLocation);

      const result = await service.createLocation(locationData);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('New Location');
      expect(result.data.slug).toBe('new-location');
    });

    it('should throw NotFoundException when universe not found', async () => {
      (prismaService.universeMap.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.createLocation(locationData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLocation', () => {
    const locationId = 'loc-1';

    it('should update location successfully (happy path)', async () => {
      const mockDate = new Date('2024-01-01');
      const mockLocation = {
        id: locationId,
        name: 'Location',
        slug: 'location',
        description: 'Old',
        imageUrl: '',
        latitude: 0,
        longitude: 0,
        universeId: 'universe-1',
        parentId: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        universe: { name: 'Universe 1' },
      };
      const updatedLocation = { ...mockLocation, description: 'Updated' };

      (prismaService.location.findUnique as jest.Mock).mockResolvedValue(mockLocation);
      (prismaService.location.update as jest.Mock).mockResolvedValue(updatedLocation);

      const result = await service.updateLocation(locationId, { description: 'Updated' });

      expect(result.success).toBe(true);
      expect(result.data.description).toBe('Updated');
    });

    it('should throw NotFoundException when location not found', async () => {
      (prismaService.location.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateLocation(locationId, { description: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getCategories', () => {
    it('should return vertical categories', async () => {
      const result = await service.getCategories();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
