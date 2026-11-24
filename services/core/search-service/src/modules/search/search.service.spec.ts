import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { MetricsService } from '../metrics/metrics.service.js';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
jest.mock('../database/prisma.service');

describe('SearchService', () => {
  let service: SearchService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;

  // Everything ON except search_typo_tolerance, so the default search() tests
  // exercise the exact path; fuzzy tests override per-test.
  const mockFeatureFlagService = {
    isEnabled: jest
      .fn()
      .mockImplementation((key: string) => Promise.resolve(key !== 'search_typo_tolerance')),
    // Numeric flags: the shipped default trigram weight (0.4 = 60/40 blend).
    getValue: jest.fn().mockResolvedValue(0.4),
    // Universe visibility sentinels: nothing stored → everything visible.
    getFlags: jest.fn().mockResolvedValue(new Map()),
  };

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
    categories: ['Action', 'Comedy'],
    creatorName: 'Demo Creator',
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
            // Fuzzy (search_typo_tolerance) retrieval runs through raw SQL.
            $queryRaw: jest.fn(),
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
            userSearch: {
              create: jest.fn(),
            },
            searchTypoCorrection: {
              upsert: jest.fn(),
              findMany: jest.fn(),
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
        {
          provide: FeatureFlagService,
          useValue: mockFeatureFlagService,
        },
        {
          provide: MetricsService,
          useValue: { setFuzzyStatus: jest.fn() },
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
    // clearAllMocks wipes implementations; restore the base flag routing so
    // later describes (and the universe-visibility memo) start from defaults.
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key !== 'search_typo_tolerance')
    );
    (mockFeatureFlagService.getValue as jest.Mock).mockResolvedValue(0.4);
    mockFeatureFlagService.getFlags.mockResolvedValue(new Map());
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
      (prismaService.creatorProfile.count as jest.Mock).mockResolvedValue(0);
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.count as jest.Mock).mockResolvedValue(0);

      const result = await service.search('test query');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('results');
      expect(result.data).toHaveProperty('pagination');
      // Per-surface pagination: creators/universes get their own page/limit +
      // exact totals alongside the content pagination object.
      expect(result.data).toHaveProperty('creatorsPagination');
      expect(result.data).toHaveProperty('universesPagination');
      expect(result.data?.creatorsPagination).toEqual(
        expect.objectContaining({ page: 1, limit: 20, total: 0, totalPages: 0 })
      );
      expect(result.data?.universesPagination).toEqual(
        expect.objectContaining({ page: 1, limit: 10, total: 0, totalPages: 0 })
      );
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(0);
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.creatorProfile.count as jest.Mock).mockResolvedValue(0);
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.count as jest.Mock).mockResolvedValue(0);

      await service.search('test', {
        universe: 'universe-1',
        categories: ['cat-1'],
        tags: ['tag-1'],
        sort: 'popular',
        page: 2,
        limit: 10,
        creatorsPage: 2,
        creatorsLimit: 5,
        universesPage: 3,
        universesLimit: 4,
      });

      expect(prismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          orderBy: { viewCount: 'desc' },
        })
      );
      // Creators and universes page independently with their own skip/take.
      expect(prismaService.creatorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 })
      );
      expect(prismaService.universe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 8, take: 4 })
      );
    });

    it('should handle all sort options', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(0);
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.creatorProfile.count as jest.Mock).mockResolvedValue(0);
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.count as jest.Mock).mockResolvedValue(0);

      const sortOptions = ['newest', 'oldest', 'popular', 'alphabetical', 'rating'] as const;

      for (const sort of sortOptions) {
        await service.search('test', { sort });
        expect(prismaService.contentItem.findMany).toHaveBeenCalled();
      }
    });

    it('should surface a Prisma failure as InternalServerErrorException', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.contentItem.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.search('test query')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('universe visibility gating (universe.<slug>.enabled sentinels)', () => {
    const seedExactSearch = () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(0);
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.creatorProfile.count as jest.Mock).mockResolvedValue(0);
      (prismaService.universe.count as jest.Mock).mockResolvedValue(0);
      // The visibility lookup and the universe search surface share
      // universe.findMany — distinguish by the lookup's select-only args.
      (prismaService.universe.findMany as jest.Mock).mockImplementation((args?: unknown) => {
        const a = args as { select?: unknown } | undefined;
        return Promise.resolve(a?.select ? [{ id: 'u-comedy' }] : []);
      });
    };

    afterEach(() => {
      mockFeatureFlagService.getFlags.mockResolvedValue(new Map());
      // jest.clearAllMocks wipes implementations; later describes assume the
      // base everything-on-except-typo flag routing.
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== 'search_typo_tolerance')
      );
    });

    it('excludes a universe whose sentinel is stored disabled from content and universe rows', async () => {
      mockFeatureFlagService.getFlags.mockResolvedValue(
        new Map([['universe.comedy.enabled', { key: 'universe.comedy.enabled', enabled: false }]])
      );
      seedExactSearch();

      await service.search('test');

      expect(mockFeatureFlagService.getFlags).toHaveBeenCalledWith(
        expect.arrayContaining(['universe.comedy.enabled', 'universe.reality.enabled'])
      );
      expect(prismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { universe: { notIn: ['comedy'] } },
              { universeId: { notIn: ['u-comedy'] } },
            ]),
          }),
        })
      );
      const universeCall = (prismaService.universe.findMany as jest.Mock).mock.calls.find(
        ([args]) => !(args as { select?: unknown })?.select
      );
      expect(universeCall?.[0]).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              expect.any(Object),
              { AND: [{ name: { notIn: ['comedy'] } }, { id: { notIn: ['u-comedy'] } }] },
            ],
          }),
        })
      );
    });

    it('leaves results unfiltered when no sentinel is stored (default visible)', async () => {
      mockFeatureFlagService.getFlags.mockResolvedValue(new Map());
      seedExactSearch();

      await service.search('test');

      expect(prismaService.universe.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({ select: expect.anything() })
      );
      expect(prismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ AND: expect.anything() }),
        })
      );
    });

    it('an explicitly enabled sentinel changes nothing', async () => {
      mockFeatureFlagService.getFlags.mockResolvedValue(
        new Map([['universe.comedy.enabled', { key: 'universe.comedy.enabled', enabled: true }]])
      );
      seedExactSearch();

      await service.search('test');

      expect(prismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ AND: expect.anything() }),
        })
      );
    });

    it('memoizes the visibility lookup across searches (60s window)', async () => {
      mockFeatureFlagService.getFlags.mockResolvedValue(
        new Map([['universe.comedy.enabled', { key: 'universe.comedy.enabled', enabled: false }]])
      );
      seedExactSearch();

      await service.search('alpha');
      await service.search('beta');

      // One batched flag call for both searches; different queries → no
      // shared response cache entry short-circuiting the second lookup.
      expect(mockFeatureFlagService.getFlags).toHaveBeenCalledTimes(1);
    });

    it('fail-opens to visible when the flag lookup errors (no cached state)', async () => {
      mockFeatureFlagService.getFlags.mockRejectedValue(new Error('redis down'));
      seedExactSearch();

      await service.search('test');

      expect(prismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ AND: expect.anything() }),
        })
      );
    });

    it('injects NOT IN predicates into the fuzzy (pg_trgm) SQL paths', async () => {
      mockFeatureFlagService.getFlags.mockResolvedValue(
        new Map([['universe.comedy.enabled', { key: 'universe.comedy.enabled', enabled: false }]])
      );
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { available: true, indexesPresent: true },
      ]);
      await service.onModuleInit();
      // Reset so probe calls don't shift the once-chain indices of the six
      // search queries (a lazy re-probe would also consume a once value).
      (prismaService.$queryRaw as jest.Mock).mockReset();
      (prismaService.universe.findMany as jest.Mock).mockImplementation((args?: unknown) => {
        const a = args as { select?: unknown } | undefined;
        return Promise.resolve(a?.select ? [{ id: 'u-comedy' }] : []);
      });
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([]) // content pool
        .mockResolvedValueOnce([{ count: 0 }]) // content count
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      await service.search('avngers');

      // Prisma renders NOT IN members as ? placeholders — assert the clause
      // shape on the SQL and the membership on the params.
      const rawCalls = (prismaService.$queryRaw as jest.Mock).mock.calls.map(
        ([q]) => q as { sql: string; values: unknown[] }
      );
      expect(rawCalls[0].sql).toContain('ci.universe NOT IN (?)');
      expect(rawCalls[0].sql).toContain('ci."universeId" NOT IN (?)');
      expect(rawCalls[0].values).toContain('comedy');
      expect(rawCalls[0].values).toContain('u-comedy');
      expect(rawCalls[1].sql).toContain('ci."universeId" NOT IN');
      expect(rawCalls[1].values).toContain('comedy');
      expect(rawCalls[4].sql).toContain('u.id NOT IN');
      expect(rawCalls[4].values).toContain('u-comedy');
      expect(rawCalls[5].sql).toContain('u.id NOT IN');
      expect(rawCalls[5].values).toContain('u-comedy');
      expect(rawCalls[0].sql).not.toContain('FALSE');
    });

    it('a fuzzy filter on a disabled universe renders an always-false predicate', async () => {
      mockFeatureFlagService.getFlags.mockResolvedValue(
        new Map([['universe.comedy.enabled', { key: 'universe.comedy.enabled', enabled: false }]])
      );
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { available: true, indexesPresent: true },
      ]);
      await service.onModuleInit();
      (prismaService.$queryRaw as jest.Mock).mockClear();
      (mockFeatureFlagService.getFlags as jest.Mock).mockClear();
      (prismaService.universe.findMany as jest.Mock).mockImplementation((args?: unknown) => {
        const a = args as { select?: unknown } | undefined;
        return Promise.resolve(a?.select ? [{ id: 'u-comedy' }] : []);
      });
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }]);

      await service.search('avngers', { universe: 'u-comedy' });

      const contentPoolSql = (prismaService.$queryRaw as jest.Mock).mock.calls[0][0] as {
        sql: string;
      };
      expect(contentPoolSql.sql).toContain('AND FALSE');
    });

    it('getFacets drops disabled universes alongside the local isEnabled column', async () => {
      mockFeatureFlagService.getFlags.mockResolvedValue(
        new Map([['universe.comedy.enabled', { key: 'universe.comedy.enabled', enabled: false }]])
      );
      (prismaService.contentItem.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaService.tag.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(0);
      (prismaService.universe.findMany as jest.Mock).mockImplementation((args?: unknown) => {
        const a = args as { select?: unknown; where?: { AND?: unknown[] } } | undefined;
        if (a?.select) return Promise.resolve([{ id: 'u-comedy' }]);
        expect(a?.where?.AND?.[0]).toEqual({ isEnabled: true });
        expect(a?.where?.AND?.[1]).toEqual({
          AND: [{ name: { notIn: ['comedy'] } }, { id: { notIn: ['u-comedy'] } }],
        });
        return Promise.resolve([]);
      });

      await service.getFacets();

      expect(prismaService.universe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: expect.anything() })
      );
    });

    it('searchWithFacets excludes disabled universes from content, rows and facets', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_faceted')
      );
      mockFeatureFlagService.getFlags.mockResolvedValue(
        new Map([['universe.comedy.enabled', { key: 'universe.comedy.enabled', enabled: false }]])
      );
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.contentItem.groupBy as jest.Mock).mockResolvedValue([]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(0);
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.findMany as jest.Mock).mockImplementation((args?: unknown) => {
        const a = args as { select?: unknown } | undefined;
        return Promise.resolve(a?.select ? [{ id: 'u-comedy' }] : []);
      });

      await service.searchWithFacets('test');

      // Content query carries the visibility AND fragment (same helper as the
      // exact path, and computeFacets reuses it for the groupBy predicate).
      expect(prismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { universe: { notIn: ['comedy'] } },
              { universeId: { notIn: ['u-comedy'] } },
            ]),
          }),
        })
      );
      const rowCalls = (prismaService.universe.findMany as jest.Mock).mock.calls
        .map(([args]) => args as { where?: { AND?: unknown[] } })
        .filter((a) => a?.where?.AND && !('id' in ((a.where as Record<string, unknown>) ?? {})));
      expect(rowCalls.length).toBeGreaterThan(0);
      expect(rowCalls[0].where?.AND?.[1]).toEqual({
        AND: [{ name: { notIn: ['comedy'] } }, { id: { notIn: ['u-comedy'] } }],
      });
    });
  });

  describe('search with typo tolerance (search_typo_tolerance)', () => {
    beforeEach(async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== 'search_typo_tolerance')
      );
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      // Defaults for both paths: the exact path uses the typed ORM for
      // creators/universes; the fuzzy path calls $queryRaw four times
      // (content pool, SQL count, creators, universes). Content rows are set
      // per test.
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([]);
      // pg_trgm startup probe — consumed by onModuleInit below via the base
      // mock, before any per-test mockResolvedValueOnce chains. Healthy by
      // default (extension + GIN indexes); guard tests override per-test.
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { available: true, indexesPresent: true },
      ]);
      await (service as SearchService).onModuleInit();
    });

    // These tests override isEnabled/getValue per-test; jest.clearAllMocks
    // doesn't restore implementations, so restore the defaults here or later
    // describes (searchWithFacets / logSearch) inherit the overrides.
    afterEach(() => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== 'search_typo_tolerance')
      );
      (mockFeatureFlagService.getValue as jest.Mock).mockResolvedValue(0.4);
    });

    it('should rank typo matches via fuzzy scoring when the flag is on', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      const typoItem = {
        ...mockContentItem,
        id: 'content-typo',
        title: 'Avengers Endgame',
        viewCount: 500,
        // pg_trgm similarity() values the SQL SELECT aliases.
        titleSim: 0.47,
        descSim: 0,
      };
      const exactItem = {
        ...mockContentItem,
        id: 'content-exact',
        title: 'Avengers',
        viewCount: 10,
        titleSim: 0.7,
        descSim: 0,
      };
      // $queryRaw order: content pool, SQL count, creators, universes.
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([typoItem, exactItem])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      const result = await service.search('avngers');

      const content = result.data?.results?.content ?? [];
      expect(content.map((c) => c.id)).toEqual(['content-exact', 'content-typo']);
      expect(result.data?.pagination?.total).toBe(2);
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('results:fuzzy:'),
        expect.anything(),
        600
      );
    });

    it('should surface per-item fuzzy relevance scores', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      const typoItem = {
        ...mockContentItem,
        id: 'content-typo',
        title: 'Avengers Endgame',
        viewCount: 500,
        titleSim: 0.47,
        descSim: 0,
      };
      const exactItem = {
        ...mockContentItem,
        id: 'content-exact',
        title: 'Avengers',
        viewCount: 10,
        titleSim: 0.7,
        descSim: 0,
      };
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([typoItem, exactItem])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      const result = await service.search('avngers');

      const content = result.data?.results?.content ?? [];
      const exact = content.find((c) => c.id === 'content-exact');
      const typo = content.find((c) => c.id === 'content-typo');
      // Every fuzzy result carries a 0–1 blended relevance score: the clean
      // match keeps its decisive fuzzy score (>= 0.85); the typo-correction
      // blends in its trigram similarity and lands below it.
      expect(exact?.score).toBeGreaterThanOrEqual(0.85);
      expect(typo?.score).toBeGreaterThanOrEqual(0.5);
      expect(typo?.score).toBeLessThan(1);
      // The cleaner match ranks higher than the typo-correction.
      expect(typo?.score ?? 0).toBeLessThan(exact?.score ?? 1);
      // The blend is explainable: the typo score sits between its raw fuzzy
      // component and a pure trigram signal, tilted by the row's similarity.
      expect(typo?.score ?? 0).toBeLessThan(0.7875); // pure fuzzy token match
      expect(typo?.score ?? 0).toBeGreaterThan(0.47); // pure trigram signal
      // Top match is decisive ('Avengers' >= 0.85) → no 'did you mean' hint.
      expect(result.data?.suggestedQuery).toBeUndefined();
      // Denormalized categories + creator displayName ride along so clients
      // can filter by category and render the creator chip without a join.
      expect(exact?.categories).toEqual(['Action', 'Comedy']);
      expect(exact?.creatorName).toBe('Demo Creator');
      // The explainable components ride along: fuzzyScore is the Levenshtein
      // signal, trigramScore the pg_trgm one.
      expect(exact?.fuzzyScore).toBeCloseTo(0.875);
      expect(exact?.trigramScore).toBe(0.7);
      expect(typo?.fuzzyScore).toBeCloseTo(0.7875);
      expect(typo?.trigramScore).toBe(0.47);
    });

    it('tunes the blend at runtime via the trigram-weight flag', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );
      // Ops rebalances toward trigram: 0.8 trigram / 0.2 Levenshtein.
      (mockFeatureFlagService.getValue as jest.Mock).mockResolvedValue(0.8);

      const typoItem = {
        ...mockContentItem,
        id: 'content-typo',
        title: 'Avengers Endgame',
        titleSim: 0.47,
        descSim: 0,
      };
      const exactItem = {
        ...mockContentItem,
        id: 'content-exact',
        title: 'Avengers',
        titleSim: 0.7,
        descSim: 0,
      };
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([typoItem, exactItem])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      const result = await service.search('avngers');

      const content = result.data?.results?.content ?? [];
      const exact = content.find((c) => c.id === 'content-exact');
      const typo = content.find((c) => c.id === 'content-typo');
      // 0.2 * 0.7875 + 0.8 * 0.47 — trigram now dominates the correction.
      expect(typo?.score).toBeCloseTo(0.5335);
      // Decisive matches are untouched by the weight (anchor keeps its score).
      expect(exact?.score).toBeCloseTo(0.875);
      // The cleaner match still ranks first.
      expect(content[0]?.id).toBe('content-exact');
      expect(mockFeatureFlagService.getValue).toHaveBeenCalledWith('search_fuzzy_trigram_weight');
    });

    it('offers a suggestedQuery when the top match is a typo-correction', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      // Both rows are token-level 'avengers' matches (fuzzy 0.7875); neither
      // reaches the decisive anchor, so the best one becomes the hint.
      const endgame = {
        ...mockContentItem,
        id: 'content-endgame',
        title: 'Avengers Endgame',
        titleSim: 0.47,
        descSim: 0,
      };
      const infinityWar = {
        ...mockContentItem,
        id: 'content-infinity-war',
        title: 'Avengers Infinity War',
        titleSim: 0.3,
        descSim: 0,
      };
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([infinityWar, endgame])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      const result = await service.search('avngers');

      // Best match is still a correction (0.6605 < 0.85) → suggest its title
      // as a one-click re-search.
      expect(result.data?.suggestedQuery).toBe('Avengers Endgame');
      const content = result.data?.results?.content ?? [];
      expect(content[0]?.id).toBe('content-endgame');
    });

    it('prefers a learned correction from the typo dictionary over the raw best match', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance' || key === 'search_typo_dictionary')
      );

      // Users have repeatedly accepted 'Avengers Infinity War' for 'avngers'
      // even though 'Avengers Endgame' scores slightly higher this time.
      (prismaService.searchTypoCorrection.findMany as jest.Mock).mockResolvedValue([
        {
          id: 't1',
          originalQuery: 'avngers',
          correctedQuery: 'Avengers Infinity War',
          count: 12,
          lastAcceptedAt: new Date(),
          createdAt: new Date(),
        },
      ]);

      const endgame = {
        ...mockContentItem,
        id: 'content-endgame',
        title: 'Avengers Endgame',
        titleSim: 0.47,
        descSim: 0,
      };
      const infinityWar = {
        ...mockContentItem,
        id: 'content-infinity-war',
        title: 'Avengers Infinity War',
        titleSim: 0.3,
        descSim: 0,
      };
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([infinityWar, endgame])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      const result = await service.search('avngers');

      // The dictionary overrides the raw best match with the most-accepted
      // correction (still only when the top match is a non-decisive typo).
      expect(result.data?.suggestedQuery).toBe('Avengers Infinity War');
    });

    it('blends trigram similarity into ranking when fuzzy scores tie', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      // Identical fuzzy component (token match 'avengers') — only the row's
      // pg_trgm similarity differs. The higher-similarity row must rank first
      // and score above the pure fuzzy value, proving trigram is a real signal.
      const strongNgram = {
        ...mockContentItem,
        id: 'content-ngram-strong',
        title: 'Avengers Endgame',
        titleSim: 0.9,
        descSim: 0,
      };
      const weakNgram = {
        ...mockContentItem,
        id: 'content-ngram-weak',
        title: 'Avengers Endgame',
        titleSim: 0.3,
        descSim: 0,
      };
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([weakNgram, strongNgram])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      const result = await service.search('avngers');

      const content = result.data?.results?.content ?? [];
      expect(content.map((c) => c.id)).toEqual(['content-ngram-strong', 'content-ngram-weak']);
      const strong = content.find((c) => c.id === 'content-ngram-strong');
      const weak = content.find((c) => c.id === 'content-ngram-weak');
      // 0.6 * 0.7875 + 0.4 * 0.9 vs 0.6 * 0.7875 + 0.4 * 0.3
      expect(strong?.score).toBeCloseTo(0.8325);
      expect(weak?.score).toBeCloseTo(0.5925);
      // Strong n-gram overlap lifts the near-miss above its raw fuzzy score.
      expect(strong?.score ?? 0).toBeGreaterThan(0.7875);
    });

    it('reports one comparable scale across content, creators, and universes', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      // The same matched text with the same trigram similarity — carried by a
      // content title, a creator displayName, and a universe name — must score
      // identically, so clients can compare relevance across result types.
      const contentRow = {
        ...mockContentItem,
        id: 'c1',
        title: 'Avengers Endgame',
        titleSim: 0.47,
        descSim: 0,
      };
      const creatorRow = {
        id: 'cr1',
        userId: 'u1',
        displayName: 'Avengers Endgame',
        bio: null,
        email: null,
        displayNameSim: 0.47,
        bioSim: 0,
      };
      const universeRow = {
        id: 'un1',
        name: 'Avengers Endgame',
        displayName: null,
        nameSim: 0.47,
        displayNameSim: 0,
      };
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([contentRow])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([creatorRow])
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([universeRow])
        .mockResolvedValueOnce([{ count: 1 }]);

      const result = await service.search('avngers');

      const content = result.data?.results?.content ?? [];
      const creators = result.data?.results?.creators ?? [];
      const universes = result.data?.results?.universes ?? [];
      expect(content[0]?.score).toBeCloseTo(0.6605);
      expect(creators[0]?.score).toBeCloseTo(0.6605);
      expect(universes[0]?.score).toBeCloseTo(0.6605);
      // Components are comparable across types too.
      expect(content[0]?.fuzzyScore).toBeCloseTo(0.7875);
      expect(creators[0]?.fuzzyScore).toBeCloseTo(0.7875);
      expect(universes[0]?.fuzzyScore).toBeCloseTo(0.7875);
      expect(content[0]?.trigramScore).toBe(0.47);
      expect(creators[0]?.trigramScore).toBe(0.47);
      expect(universes[0]?.trigramScore).toBe(0.47);
    });

    it('admits creators and universes on the same Levenshtein rule as content', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      // Strong Levenshtein (token match 'avengers') with no trigram overlap:
      // blended score 0.4725 < 0.5 — the old per-type rule would have dropped
      // it; the shared rule admits it, exactly like content.
      const admitted = {
        id: 'cr1',
        userId: 'u1',
        displayName: 'Avengers Endgame',
        bio: null,
        email: null,
        displayNameSim: 0,
        bioSim: 0,
      };
      // Weak Levenshtein with high trigram similarity: dropped — Levenshtein
      // is the admission signal for every type.
      const weakFuzzy = {
        id: 'cr2',
        userId: 'u2',
        displayName: 'Zebra Finance Report',
        bio: null,
        email: null,
        displayNameSim: 0.9,
        bioSim: 0,
      };
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }])
        .mockResolvedValueOnce([admitted, weakFuzzy])
        .mockResolvedValueOnce([{ count: 2 }]) // both rows matched the predicate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.search('avngers');

      const creators = result.data?.results?.creators ?? [];
      expect(creators.map((c) => c.id)).toEqual(['cr1']);
      expect(creators[0]?.score).toBeCloseTo(0.4725);
      expect(creators[0]?.fuzzyScore).toBeCloseTo(0.7875); // Levenshtein admission
      expect(creators[0]?.trigramScore).toBe(0); // no trigram overlap
    });

    it('pages creators and universes independently with exact totals', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      // Same Levenshtein token match (fuzzy 0.7875) for all three; trigram
      // similarity differentiates the ranking.
      const creatorsPool = [
        {
          id: 'cr1',
          userId: 'u1',
          displayName: 'Avengers Endgame',
          bio: null,
          email: null,
          displayNameSim: 0.47,
          bioSim: 0,
        },
        {
          id: 'cr2',
          userId: 'u2',
          displayName: 'Avengers Infinity War',
          bio: null,
          email: null,
          displayNameSim: 0.4,
          bioSim: 0,
        },
        {
          id: 'cr3',
          userId: 'u3',
          displayName: 'Avengers Assemble',
          bio: null,
          email: null,
          displayNameSim: 0.3,
          bioSim: 0,
        },
      ];
      const universesPool = [
        {
          id: 'un1',
          name: 'Avengers',
          displayName: 'Avengers Universe',
          nameSim: 0.47,
          displayNameSim: 0,
        },
        { id: 'un2', name: 'Avengers Hub', displayName: null, nameSim: 0.3, displayNameSim: 0 },
      ];
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([]) // content pool
        .mockResolvedValueOnce([{ count: 0 }]) // content count
        .mockResolvedValueOnce(creatorsPool)
        .mockResolvedValueOnce([{ count: creatorsPool.length }])
        .mockResolvedValueOnce(universesPool)
        .mockResolvedValueOnce([{ count: universesPool.length }]);

      const result = await service.search('avngers', {
        creatorsPage: 2,
        creatorsLimit: 2,
        universesPage: 2,
        universesLimit: 1,
      });

      const creators = result.data?.results?.creators ?? [];
      const universes = result.data?.results?.universes ?? [];
      // Page 2 of 3 creators (2 per page) → the third-ranked one.
      expect(creators.map((c) => c.id)).toEqual(['cr3']);
      expect(result.data?.creatorsPagination).toEqual(
        expect.objectContaining({ page: 2, limit: 2, total: 3, totalPages: 2 })
      );
      // Page 2 of 2 universes (1 per page) → the second-ranked one.
      expect(universes.map((u) => u.id)).toEqual(['un2']);
      expect(result.data?.universesPagination).toEqual(
        expect.objectContaining({ page: 2, limit: 1, total: 2, totalPages: 2 })
      );
    });

    it('should drop low-similarity candidates below the threshold', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([
          { ...mockContentItem, id: 'content-unrelated', title: 'Zebra Finance Report' },
        ])
        // The row entered the SQL retrieval pool (trigram ≥ 0.3) but the
        // in-process score filter drops it — total reflects the pool.
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      const result = await service.search('avngers');

      expect(result.data?.results?.content).toHaveLength(0);
      expect(result.data?.pagination?.total).toBe(1);
      // No matches → no correction hint.
      expect(result.data?.suggestedQuery).toBeUndefined();
    });

    it('reports the exact SQL total beyond the retrieved pool cap', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      // The pool fetch returns a small slice, but the SQL count over the same
      // predicate sees the full catalog — total is no longer pool-capped.
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([
          { ...mockContentItem, id: 'content-top', title: 'Avengers', viewCount: 999 },
        ])
        .mockResolvedValueOnce([{ count: 5000 }])
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      const result = await service.search('avngers');

      expect(result.data?.results?.content).toHaveLength(1);
      expect(result.data?.pagination?.total).toBe(5000);
      expect(result.data?.pagination?.totalPages).toBe(250);
    });

    it('reports exact creator and universe totals beyond their pool caps', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );

      // The creator/universe pools return small slices, but the SQL counts
      // over the same predicate see the full catalog — total is exact, not
      // capped at the 200-row pool or the 20/10 response limits.
      const creatorRow = {
        id: 'cr1',
        userId: 'u1',
        displayName: 'Avengers Endgame',
        bio: null,
        email: null,
        displayNameSim: 0.47,
        bioSim: 0,
      };
      const universeRow = {
        id: 'un1',
        name: 'Avengers Endgame',
        displayName: null,
        nameSim: 0.47,
        displayNameSim: 0,
      };
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([
          {
            ...mockContentItem,
            id: 'c1',
            title: 'Avengers Endgame',
            titleSim: 0.47,
            descSim: 0,
          },
        ])
        .mockResolvedValueOnce([{ count: 12 }])
        .mockResolvedValueOnce([creatorRow])
        .mockResolvedValueOnce([{ count: 340 }])
        .mockResolvedValueOnce([universeRow])
        .mockResolvedValueOnce([{ count: 58 }]);

      const result = await service.search('avngers');

      // content 12 + creators 340 + universes 58 — uncapped and exact.
      expect(result.data?.total).toBe(410);
      expect(result.data?.results?.creators).toHaveLength(1);
      expect(result.data?.results?.universes).toHaveLength(1);
    });

    it('should keep the exact path when the flag is off', async () => {
      // Default mock already returns false for search_typo_tolerance.
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(1);

      const result = await service.search('test');

      expect(result.data?.results?.content).toHaveLength(1);
      expect(result.data?.results?.content[0]?.score).toBeUndefined();
      expect(result.data?.results?.content[0]?.fuzzyScore).toBeUndefined();
      expect(result.data?.results?.content[0]?.trigramScore).toBeUndefined();
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('results:exact:'),
        expect.anything(),
        600
      );
    });

    it('falls back to the exact path and warns when pg_trgm is unavailable', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );
      // Simulate a startup where the extension is missing: the startup probe
      // reports unavailable, so search_typo_tolerance is effectively disabled.
      (prismaService.$queryRaw as jest.Mock).mockReset();
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { available: false, indexesPresent: false },
      ]);
      (service as unknown as { pgTrgmAvailable: boolean | null }).pgTrgmAvailable = null;
      (service as unknown as { pgTrgmLastProbeMs: number }).pgTrgmLastProbeMs = 0;
      await (service as SearchService).onModuleInit();

      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);
      (prismaService.contentItem.count as jest.Mock).mockResolvedValue(1);
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.creatorProfile.count as jest.Mock).mockResolvedValue(0);
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.universe.count as jest.Mock).mockResolvedValue(0);

      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

      const result = await service.search('avngers');

      // Exact path served: no fuzzy score on results, exact cache key, warned.
      expect(result.data?.results?.content[0]?.score).toBeUndefined();
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('results:exact:'),
        expect.anything(),
        600
      );
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('pg_trgm'));
      warnSpy.mockRestore();
    });

    it('re-probes lazily after an inconclusive startup probe', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );
      // Startup probe failed (DB down at boot) → state unknown. Forcing the
      // stale window so the next fuzzy search re-probes instead of assuming.
      (service as unknown as { pgTrgmAvailable: boolean | null }).pgTrgmAvailable = null;
      (service as unknown as { pgTrgmLastProbeMs: number }).pgTrgmLastProbeMs = 0;

      const typoItem = {
        ...mockContentItem,
        id: 'content-typo',
        title: 'Avengers Endgame',
        titleSim: 0.47,
        descSim: 0,
      };
      const exactItem = {
        ...mockContentItem,
        id: 'content-exact',
        title: 'Avengers',
        titleSim: 0.7,
        descSim: 0,
      };
      // First $queryRaw call of the search is the lazy re-probe (now
      // succeeds), then the fuzzy pipeline: content pool, SQL count, creators,
      // universes.
      (prismaService.$queryRaw as jest.Mock).mockReset();
      (prismaService.$queryRaw as jest.Mock)
        .mockResolvedValueOnce([{ available: true, indexesPresent: true }])
        .mockResolvedValueOnce([typoItem, exactItem])
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([]) // creators pool
        .mockResolvedValueOnce([{ count: 0 }]) // creators count
        .mockResolvedValueOnce([]) // universes pool
        .mockResolvedValueOnce([{ count: 0 }]); // universes count

      const result = await service.search('avngers');

      const content = result.data?.results?.content ?? [];
      expect(content.map((c) => c.id)).toEqual(['content-exact', 'content-typo']);
      expect(cacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('results:fuzzy:'),
        expect.anything(),
        600
      );
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

    it('should surface a Prisma failure as InternalServerErrorException', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.searchWithFacets('test query')).rejects.toThrow(
        InternalServerErrorException
      );
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

    it('should surface a Prisma failure as InternalServerErrorException', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      (prismaService.searchQueryLog.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.getSuggestions('test')).rejects.toThrow(InternalServerErrorException);
    });

    describe('search_suggestions_ai ranking', () => {
      beforeEach(() => {
        (cacheService.get as jest.Mock).mockResolvedValue(null);
        (prismaService.searchQueryLog.findMany as jest.Mock).mockResolvedValue([
          { query: 'test query 1', resultCount: 10 },
          { query: 'test query 2', resultCount: 5 },
          { query: 'test query 3', resultCount: 2 },
        ]);
      });

      // The overrides below leak into later describes (logSearch); restore the
      // suite default (everything on except search_typo_tolerance) after each.
      afterEach(() => {
        mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
          Promise.resolve(key !== 'search_typo_tolerance')
        );
      });

      it('flag off → keeps deterministic popularity ranking', async () => {
        mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
          Promise.resolve(key !== 'search_suggestions_ai')
        );

        const result = await service.getSuggestions('test');

        expect(result.data?.suggestions).toEqual(['test query 1', 'test query 2', 'test query 3']);
      });

      it('flag on but no ranker configured → fallback to popularity order', async () => {
        mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
          Promise.resolve(key === 'search_suggestions_ai')
        );

        const result = await service.getSuggestions('test');

        expect(result.data?.suggestions).toEqual(['test query 1', 'test query 2', 'test query 3']);
      });

      it('flag on with ranker → uses ranker order, appends dropped candidates', async () => {
        mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
          Promise.resolve(key === 'search_suggestions_ai')
        );
        (service as unknown as { suggestionsAiUrl?: string }).suggestionsAiUrl =
          'http://ai-ranker:9999';
        (axios.post as jest.Mock).mockResolvedValueOnce({
          data: { suggestions: ['test query 2', 'test query 3'] },
        });

        const result = await service.getSuggestions('test');

        expect(result.data?.suggestions).toEqual(['test query 2', 'test query 3', 'test query 1']);
        delete (service as unknown as { suggestionsAiUrl?: string }).suggestionsAiUrl;
      });

      it('flag on but ranker errors → fallback to popularity order', async () => {
        mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
          Promise.resolve(key === 'search_suggestions_ai')
        );
        (service as unknown as { suggestionsAiUrl?: string }).suggestionsAiUrl =
          'http://ai-ranker:9999';
        (axios.post as jest.Mock).mockRejectedValueOnce(new Error('ranker down'));

        const result = await service.getSuggestions('test');

        expect(result.data?.suggestions).toEqual(['test query 1', 'test query 2', 'test query 3']);
        delete (service as unknown as { suggestionsAiUrl?: string }).suggestionsAiUrl;
      });
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

    it('should surface a Prisma failure as InternalServerErrorException', async () => {
      (prismaService.searchQueryLog.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.getTrending()).rejects.toThrow(InternalServerErrorException);
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

    it('should surface a Prisma failure as InternalServerErrorException', async () => {
      (prismaService.universe.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.getFacets()).rejects.toThrow(InternalServerErrorException);
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

    it('should learn an accepted correction in the typo dictionary', async () => {
      (prismaService.searchQueryLog.create as jest.Mock).mockResolvedValue(mockSearchQueryLog);
      (prismaService.userSearch.create as jest.Mock).mockResolvedValue({});
      (prismaService.searchTypoCorrection.upsert as jest.Mock).mockResolvedValue({ id: 't1' });

      const result = await service.logSearch('user-1', 'avngers', 5, 'Avengers Endgame', true);

      expect(result.success).toBe(true);
      expect(prismaService.searchTypoCorrection.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            originalQuery_correctedQuery: {
              originalQuery: 'avngers',
              correctedQuery: 'Avengers Endgame',
            },
          },
          create: expect.objectContaining({ count: 1 }),
          update: expect.objectContaining({ count: { increment: 1 } }),
        })
      );
    });

    it('should not touch the typo dictionary without an accepted correction', async () => {
      (prismaService.searchQueryLog.create as jest.Mock).mockResolvedValue(mockSearchQueryLog);
      (prismaService.userSearch.create as jest.Mock).mockResolvedValue({});

      await service.logSearch('user-1', 'test query', 5);

      expect(prismaService.searchTypoCorrection.upsert).not.toHaveBeenCalled();
    });

    it('should surface a Prisma failure as InternalServerErrorException', async () => {
      (prismaService.searchQueryLog.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.logSearch('user-1', 'test', 5)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('getFuzzyStatus (ops /health)', () => {
    it('reports available when pg_trgm is present and the flag is on', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );
      (service as unknown as { pgTrgmAvailable: boolean | null }).pgTrgmAvailable = true;
      (service as unknown as { pgTrgmIndexesPresent: boolean | null }).pgTrgmIndexesPresent = true;
      (service as unknown as { pgTrgmLastProbeMs: number }).pgTrgmLastProbeMs = 1700000000000;

      const status = await service.getFuzzyStatus();

      expect(status).toEqual({
        enabled: true,
        pgTrgm: 'available',
        indexes: 'present',
        degraded: false,
        mode: 'fuzzy',
        lastProbeAt: '2023-11-14T22:13:20.000Z',
      });
    });

    it('reports degraded when the flag is on but pg_trgm is missing', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );
      (service as unknown as { pgTrgmAvailable: boolean | null }).pgTrgmAvailable = false;
      (service as unknown as { pgTrgmIndexesPresent: boolean | null }).pgTrgmIndexesPresent = false;
      (service as unknown as { pgTrgmLastProbeMs: number }).pgTrgmLastProbeMs = 1700000000000;

      const status = await service.getFuzzyStatus();

      expect(status.enabled).toBe(true);
      expect(status.pgTrgm).toBe('missing');
      expect(status.degraded).toBe(true);
      expect(status.mode).toBe('exact');
      expect(status.warning).toContain('pg_trgm is missing');
    });

    it('reports exact mode when the flag is off (by design, not degraded)', async () => {
      // Explicit default (mock implementations persist across tests).
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key !== 'search_typo_tolerance')
      );
      (service as unknown as { pgTrgmAvailable: boolean | null }).pgTrgmAvailable = false;
      (service as unknown as { pgTrgmIndexesPresent: boolean | null }).pgTrgmIndexesPresent = false;

      const status = await service.getFuzzyStatus();

      expect(status.enabled).toBe(false);
      expect(status.degraded).toBe(false);
      expect(status.mode).toBe('exact');
      expect(status.warning).toBeUndefined();
    });

    it('reports unknown before any probe and stays optimistic on uncertainty', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );
      (service as unknown as { pgTrgmAvailable: boolean | null }).pgTrgmAvailable = null;
      (service as unknown as { pgTrgmIndexesPresent: boolean | null }).pgTrgmIndexesPresent = null;
      (service as unknown as { pgTrgmLastProbeMs: number }).pgTrgmLastProbeMs = 0;

      const status = await service.getFuzzyStatus();

      expect(status.pgTrgm).toBe('unknown');
      expect(status.indexes).toBe('unknown');
      expect(status.lastProbeAt).toBeNull();
      // Unknown is optimistic (fuzzy attempted, guard re-probes lazily).
      expect(status.degraded).toBe(false);
      expect(status.mode).toBe('fuzzy');
    });

    it('warns and reports missing indexes when pg_trgm exists without the migration indexes', async () => {
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'search_typo_tolerance')
      );
      // Extension present, migration indexes absent — fuzzy still runs, just
      // unindexed: a warning, not degradation.
      (prismaService.$queryRaw as jest.Mock).mockReset();
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([
        { available: true, indexesPresent: false },
      ]);
      (service as unknown as { pgTrgmAvailable: boolean | null }).pgTrgmAvailable = null;
      (service as unknown as { pgTrgmLastProbeMs: number }).pgTrgmLastProbeMs = 0;

      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      await (service as SearchService).onModuleInit();
      const status = await service.getFuzzyStatus();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('trigram indexes'));
      expect(status.pgTrgm).toBe('available');
      expect(status.indexes).toBe('missing');
      expect(status.degraded).toBe(false); // still usable
      expect(status.mode).toBe('fuzzy');
      expect(status.warning).toContain('without index acceleration');
      warnSpy.mockRestore();
    });
  });
});
