import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
jest.mock('../database/prisma.service');

describe('SearchService', () => {
  let service: SearchService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;

  const mockContentItem = {
    id: 'content-1',
    title: 'Test Content',
    description: 'A test description',
    status: 'published',
    viewCount: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    universeId: 'universe-1',
    contentType: 'video',
    universe: 'reality',
  };

  const mockCreatorProfile = {
    id: 'creator-1',
    userId: 'user-1',
    displayName: 'Test Creator',
    email: 'creator@test.com',
    bio: 'Test bio',
  };

  const mockUniverse = {
    id: 'universe-1',
    name: 'reality',
    displayName: 'Reality Universe',
    isEnabled: true,
  };

  const mockSearchQueryLog = {
    id: 'log-1',
    query: 'test query',
    userId: 'user-1',
    resultCount: 5,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: {
            contentItem: {
              findMany: jest.fn(),
              count: jest.fn(),
              groupBy: jest.fn(),
            },
            creatorProfile: {
              findMany: jest.fn(),
            },
            universe: {
              findMany: jest.fn(),
            },
            searchQueryLog: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            userSearch: {
              create: jest.fn(),
            },
            tag: {
              findMany: jest.fn(),
            },
            contentTag: undefined,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
            getOrThrow: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(0),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(CacheService);

    jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should throw BadRequestException for query shorter than 2 chars', async () => {
      await expect(service.search('a')).rejects.toThrow(BadRequestException);
      await expect(service.search('')).rejects.toThrow(BadRequestException);
      await expect(service.search(null as unknown as string)).rejects.toThrow(BadRequestException);
    });

    it('should return cached results if available', async () => {
      const cachedResponse = {
        success: true,
        data: { results: { content: [], creators: [], universes: [] }, total: 0 },
      };
      (cacheService.get as jest.Mock).mockResolvedValue(cachedResponse);

      const result = await service.search('test');
      expect(result).toEqual(cachedResponse);
      expect(prismaService.contentItem.findMany).not.toHaveBeenCalled();
    });

    it('should perform search and cache results', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(1);
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.search('test query');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('results');
      expect(result.data).toHaveProperty('pagination');
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(0);
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([]);

      await service.search('test', {
        universe: 'universe-1',
        categories: ['cat-1'],
        tags: ['tag-1'],
        sort: 'popular',
        page: 2,
        limit: 10,
      });

      expect(prismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          orderBy: { viewCount: 'desc' },
        })
      );
    });

    it('should handle all sort options', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(0);
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([]);

      const sortOptions = ['newest', 'oldest', 'popular', 'alphabetical', 'rating'] as const;

      for (const sort of sortOptions) {
        await service.search('test', { sort });
        expect(prismaService.contentItem.findMany).toHaveBeenCalled();
      }
    });

    it('should throw BadRequestException on Prisma error', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.contentItem.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.search('test query')).rejects.toThrow(BadRequestException);
    });
  });

  describe('searchWithFacets', () => {
    it('should throw BadRequestException for query shorter than 2 chars', async () => {
      await expect(service.searchWithFacets('a')).rejects.toThrow(BadRequestException);
    });

    it('should return search results with facets', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.findMany as jest.Mock)
        .mockResolvedValueOnce([mockUniverse])
        .mockResolvedValueOnce([]);
      (prismaService.contentItem.groupBy as jest.Mock)
        .mockResolvedValueOnce([{ universeId: 'universe-1', _count: { id: 5 } }])
        .mockResolvedValueOnce([{ contentType: 'video', _count: { id: 3 } }]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(1);

      const result = await service.searchWithFacets('test query');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('results');
      expect(result.data).toHaveProperty('facets');
    });

    it('should throw BadRequestException on error', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.searchWithFacets('test query')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSuggestions', () => {
    it('should throw BadRequestException for query shorter than 1 char', async () => {
      await expect(service.getSuggestions('')).rejects.toThrow(BadRequestException);
    });

    it('should return cached suggestions if available', async () => {
      const cached = { success: true, data: { suggestions: ['cached query'] } };
      (cacheService.get as jest.Mock).mockResolvedValue(cached);

      const result = await service.getSuggestions('test');
      expect(result).toEqual(cached);
    });

    it('should fetch suggestions from DB and cache', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.searchQueryLog.findMany as jest.Mock).mockResolvedValue([
        { query: 'test query 1', resultCount: 10 },
        { query: 'test query 2', resultCount: 5 },
      ]);

      const result = await service.getSuggestions('test');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('suggestions');
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should throw BadRequestException on error', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.searchQueryLog.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.getSuggestions('test')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTrending', () => {
    it('should return trending searches', async () => {
      (prismaService.searchQueryLog.findMany as jest.Mock).mockResolvedValue([
        { query: 'popular search', resultCount: 50 },
        { query: 'another search', resultCount: 30 },
      ]);

      const result = await service.getTrending();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('trending');
    });

    it('should throw BadRequestException on error', async () => {
      (prismaService.searchQueryLog.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.getTrending()).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFacets', () => {
    it('should return facets data', async () => {
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([mockUniverse]);
      (prismaService.contentItem.groupBy as jest.Mock)
        .mockResolvedValueOnce([{ universeId: 'universe-1', _count: { id: 10 } }])
        .mockResolvedValueOnce([{ universe: 'reality', _count: { id: 10 } }])
        .mockResolvedValueOnce([{ universe: 'reality', _count: { id: 10 } }]);
      (prismaService.tag.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.contentItem.count as jest.Mock)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(100);

      const result = await service.getFacets();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('facets');
    });

    it('should throw BadRequestException on error', async () => {
      (prismaService.universe.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.getFacets()).rejects.toThrow(BadRequestException);
    });
  });

  describe('logSearch', () => {
    it('should log search and invalidate cache', async () => {
      (prismaService.searchQueryLog.create as jest.Mock).mockResolvedValue(mockSearchQueryLog);
      (prismaService.userSearch.create as jest.Mock).mockResolvedValue({});

      const result = await service.logSearch('user-1', 'test query', 5);

      expect(result.success).toBe(true);
      expect(prismaService.searchQueryLog.create).toHaveBeenCalled();
      expect(prismaService.userSearch.create).toHaveBeenCalled();
      expect(cacheService.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException on error', async () => {
      (prismaService.searchQueryLog.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.logSearch('user-1', 'test', 5)).rejects.toThrow(BadRequestException);
    });
  });
});
