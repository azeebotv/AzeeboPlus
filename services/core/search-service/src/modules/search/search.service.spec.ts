import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { BadRequestException, Logger } from '@nestjs/common';
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
    isEnabled: jest.fn().mockImplementation((key: string) =>
      Promise.resolve(key !== 'search_typo_tolerance')
    ),
    // Numeric flags: the shipped default trigram weight (0.4 = 60/40 blend).
    getValue: jest.fn().mockResolvedValue(0.4),
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
        {
          provide: FeatureFlagService,
          useValue: mockFeatureFlagService,
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
      expect(mockFeatureFlagService.getValue).toHaveBeenCalledWith(
        'search_fuzzy_trigram_weight'
      );
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
      (prismaService.universe.findMany as jest.Mock).mockResolvedValue([]);

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
