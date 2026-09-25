import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { MetricsService } from '../metrics/metrics.service.js';

describe('SearchService Integration', () => {
  let service: SearchService;

  const mockPrismaService = {
    // Fuzzy (search_typo_tolerance) retrieval runs through raw SQL.
    $queryRaw: jest.fn().mockResolvedValue([]),
    contentItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    creatorProfile: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    universe: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    searchQueryLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
    },
    userSearch: {
      create: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                ANALYTICS_SERVICE_URL: 'http://analytics-service',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        { provide: CacheService, useValue: mockCacheService },
        {
          provide: FeatureFlagService,
          useValue: {
            // Everything ON except search_typo_tolerance so the integration
            // search() tests exercise the exact path.
            isEnabled: jest
              .fn()
              .mockImplementation((key: string) =>
                Promise.resolve(key !== 'search_typo_tolerance')
              ),
          },
        },
        {
          provide: MetricsService,
          useValue: { setFuzzyStatus: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);

    jest.clearAllMocks();
    mockCacheService.get.mockResolvedValue(null);
  });

  describe('search', () => {
    it('should return results when content matches query', async () => {
      const mockContent = [
        {
          id: '1',
          title: 'Reality Show',
          description: 'A great show',
          status: 'published',
          viewCount: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockCreators = [
        {
          id: 'c1',
          bio: 'Creator bio',
          userId: 'u1',
          displayName: 'Creator',
          email: 'creator@test.com',
        },
      ];
      const mockUniverses = [{ id: 'uni1', name: 'Reality', displayName: 'Reality Universe' }];

      mockPrismaService.contentItem.findMany.mockResolvedValue(mockContent);
      mockPrismaService.contentItem.count.mockResolvedValue(1);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue(mockCreators);
      mockPrismaService.creatorProfile.count.mockResolvedValue(1);
      mockPrismaService.universe.findMany.mockResolvedValue(mockUniverses);
      mockPrismaService.universe.count.mockResolvedValue(1);

      const result = await service.search('reality');

      expect(result.success).toBe(true);
      expect(result.data?.results?.content).toHaveLength(1);
      expect(result.data?.results?.content?.[0]?.title).toBe('Reality Show');
      expect(result.data?.total).toBe(3);
      expect(result.data?.creatorsPagination?.total).toBe(1);
      expect(result.data?.universesPagination?.total).toBe(1);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return empty results when no content matches', async () => {
      mockPrismaService.contentItem.findMany.mockResolvedValue([]);
      mockPrismaService.contentItem.count.mockResolvedValue(0);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue([]);
      mockPrismaService.creatorProfile.count.mockResolvedValue(0);
      mockPrismaService.universe.findMany.mockResolvedValue([]);
      mockPrismaService.universe.count.mockResolvedValue(0);

      const result = await service.search('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data?.results?.content).toHaveLength(0);
      expect(result.data?.total).toBe(0);
      expect(result.data?.creatorsPagination?.total).toBe(0);
      expect(result.data?.universesPagination?.total).toBe(0);
    });

    it('should return cached results when available', async () => {
      const cachedResult = {
        success: true,
        data: {
          query: 'cached',
          results: { content: [{ id: '1', title: 'Cached' }], creators: [], universes: [] },
          total: 1,
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      };
      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.search('cached');

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.contentItem.findMany).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for short query', async () => {
      await expect(service.search('a')).rejects.toThrow(BadRequestException);
    });

    it('should respect pagination filters', async () => {
      mockPrismaService.contentItem.findMany.mockResolvedValue([]);
      mockPrismaService.contentItem.count.mockResolvedValue(0);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue([]);
      mockPrismaService.universe.findMany.mockResolvedValue([]);

      await service.search('test', { page: 2, limit: 10 });

      expect(mockPrismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });
  });

  describe('searchWithFacets', () => {
    it('should return results with facet data', async () => {
      const mockContent = [
        {
          id: '1',
          title: 'Show',
          description: 'Description',
          status: 'published',
          viewCount: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockGroupBy = [{ universeId: 'uni1', _count: { id: 5 } }];
      const mockContentTypeGroupBy = [{ contentType: 'video', _count: { id: 3 } }];

      mockPrismaService.contentItem.findMany.mockResolvedValue(mockContent);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue([]);
      mockPrismaService.universe.findMany.mockResolvedValue([
        { id: 'uni1', name: 'Reality', displayName: 'Reality' },
      ]);
      mockPrismaService.contentItem.groupBy
        .mockResolvedValueOnce(mockGroupBy)
        .mockResolvedValueOnce(mockContentTypeGroupBy);
      mockPrismaService.contentItem.count.mockResolvedValue(5);

      const result = await service.searchWithFacets('show');

      expect(result.success).toBe(true);
      expect(result.data?.facets).toBeDefined();
      expect(result.data?.facets?.universes).toHaveLength(1);
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions matching query', async () => {
      const mockSuggestions = [
        { query: 'reality show', resultCount: 100 },
        { query: 'reality tv', resultCount: 50 },
      ];

      mockPrismaService.searchQueryLog.findMany.mockResolvedValue(mockSuggestions);

      const result = await service.getSuggestions('real');

      expect(result.success).toBe(true);
      expect((result as { data?: { suggestions?: string[] } }).data?.suggestions).toEqual([
        'reality show',
        'reality tv',
      ]);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return cached suggestions when available', async () => {
      const cachedResult = {
        success: true,
        data: { suggestions: ['cached suggestion'] },
      };
      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.getSuggestions('cache');

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.searchQueryLog.findMany).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty query', async () => {
      await expect(service.getSuggestions('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTrending', () => {
    it('should return trending search queries', async () => {
      const mockTrending = [
        { query: 'popular show', resultCount: 500 },
        { query: 'viral video', resultCount: 300 },
      ];

      mockPrismaService.searchQueryLog.findMany.mockResolvedValue(mockTrending);

      const result = await service.getTrending();

      expect(result.success).toBe(true);
      expect((result as { data?: { trending?: unknown[] } }).data?.trending).toHaveLength(2);
      expect(
        (result as { data?: { trending?: Array<{ query: string; count: number }> } }).data
          ?.trending?.[0]
      ).toEqual({ query: 'popular show', count: 500 });
    });

    it('should return empty trending when no searches exist', async () => {
      mockPrismaService.searchQueryLog.findMany.mockResolvedValue([]);

      const result = await service.getTrending();

      expect(result.success).toBe(true);
      expect((result as { data?: { trending?: unknown[] } }).data?.trending).toHaveLength(0);
    });
  });

  describe('getFacets', () => {
    it('should return available facets', async () => {
      mockPrismaService.universe.findMany.mockResolvedValue([
        { id: 'uni1', name: 'Reality', displayName: 'Reality Universe' },
      ]);
      mockPrismaService.contentItem.groupBy.mockResolvedValue([
        { universe: 'reality', _count: { id: 10 } },
      ]);
      mockPrismaService.tag.findMany.mockResolvedValue([{ id: 'tag1', name: 'drama' }]);

      const result = await service.getFacets();

      expect(result.success).toBe(true);
      expect(result.data?.facets).toBeDefined();
      expect(result.data?.facets?.universes).toHaveLength(1);
      expect(
        (result as { data?: { facets?: { tags?: unknown[] } } }).data?.facets?.tags
      ).toHaveLength(1);
    });
  });

  describe('logSearch', () => {
    it('should log search and invalidate cache', async () => {
      mockPrismaService.searchQueryLog.create.mockResolvedValue({});
      mockPrismaService.userSearch.create.mockResolvedValue({});

      const result = await service.logSearch('user-1', 'test query', 5);

      expect(result.success).toBe(true);
      expect(mockPrismaService.searchQueryLog.create).toHaveBeenCalled();
      expect(mockPrismaService.userSearch.create).toHaveBeenCalled();
      expect(mockCacheService.delete).toHaveBeenCalled();
    });
  });
});
