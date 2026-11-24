import { Test, TestingModule } from '@nestjs/testing';
import { ContentFeedService } from './content-feed.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../../cache/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService, contentFlags } from '@azeebo/feature-flags';

describe('ContentFeedService (content_recommended_rail + universe bridge)', () => {
  let service: ContentFeedService;

  const mockPrismaService = {
    contentItem: {
      findMany: jest.fn(),
    },
    watchHistory: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    universe: {
      findMany: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(300),
  };

  const mockFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false),
    // Batched bridge lookup: resolves a Map of ONLY the stored keys (a key
    // missing from the map means "no row" → default-enabled, unchanged bridge
    // semantics).
    getFlags: jest.fn().mockResolvedValue(new Map()),
  };

  /** Fake `getFlags` over a record of explicitly-stored flag rows. */
  const stored = (rows: Record<string, boolean>) =>
    Promise.resolve(new Map(Object.entries(rows).map(([key, enabled]) => [key, { key, enabled }])));

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentFeedService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: FeatureFlagService, useValue: mockFlagService },
      ],
    }).compile();

    service = module.get<ContentFeedService>(ContentFeedService);

    mockPrismaService.watchHistory.findMany.mockResolvedValue([]);
    mockRedisService.get.mockResolvedValue(null);
    mockRedisService.set.mockResolvedValue('OK');
    mockFlagService.isEnabled.mockResolvedValue(false);
    mockFlagService.getFlags.mockResolvedValue(new Map());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecommended (content_recommended_rail)', () => {
    it('returns an empty rail while the flag is off', async () => {
      mockFlagService.isEnabled.mockResolvedValue(false);

      const result = await service.getRecommended('user-1');

      expect(result.data).toEqual([]);
      expect(mockPrismaService.watchHistory.findMany).not.toHaveBeenCalled();
    });

    it('fetches recommendations when the flag is on', async () => {
      mockFlagService.isEnabled.mockResolvedValue(true);
      mockPrismaService.watchHistory.findMany.mockResolvedValue([
        { contentId: 'c1', watchedAt: new Date() },
      ]);
      mockPrismaService.contentItem.findMany.mockResolvedValue([{ id: 'c2' }]);
      mockPrismaService.universe.findMany.mockResolvedValue([
        { id: 'u-1', name: 'reality' },
        { id: 'u-2', name: 'games' },
      ]);

      const result = await service.getRecommended('user-1');

      expect(result.data).toHaveLength(1);
      // The discovery-universe filter ran against the cached universe set.
      expect(mockPrismaService.universe.findMany).toHaveBeenCalled();
    });
  });

  describe('per-universe flag bridge (universe.{name}.{feature})', () => {
    it('returns universe ids where the feature is unset or explicitly enabled', async () => {
      mockPrismaService.universe.findMany.mockResolvedValue([
        { id: 'u-1', name: 'reality' },
        { id: 'u-2', name: 'games' },
      ]);
      // No stored rows in the Redis bridge → both default-enabled.
      mockFlagService.getFlags.mockResolvedValue(new Map());

      const ids = await service.getEnabledUniverseIds('discovery_enabled');

      expect(ids).toEqual(['u-1', 'u-2']);
      // Queries universes with names (needed for the Redis key convention).
      expect(mockPrismaService.universe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: { id: true, name: true } })
      );
      // ONE batched lookup containing the canonical key per universe — both the
      // feature bridge row and the visibility sentinel.
      expect(mockFlagService.getFlags).toHaveBeenCalledTimes(1);
      const requestedKeys = mockFlagService.getFlags.mock.calls[0][0] as string[];
      expect(requestedKeys).toEqual(
        expect.arrayContaining([
          'universe.reality.discovery_enabled',
          'universe.games.discovery_enabled',
          'universe.reality.enabled',
          'universe.games.enabled',
        ])
      );
    });

    it('caches the universe set by feature key', async () => {
      jest.clearAllMocks();
      mockPrismaService.universe.findMany.mockResolvedValue([{ id: 'u-1', name: 'reality' }]);
      // Stateful cache: a write makes the next read hit.
      const storedCache = new Map<string, string>();
      mockRedisService.get.mockImplementation((key: string) =>
        Promise.resolve(storedCache.get(key) ?? null)
      );
      mockRedisService.set.mockImplementation((key: string, value: string) => {
        storedCache.set(key, String(value));
        return Promise.resolve('OK');
      });
      mockFlagService.getFlags.mockResolvedValue(new Map());

      await service.getEnabledUniverseIds('discovery_enabled');
      await service.getEnabledUniverseIds('discovery_enabled');

      expect(mockPrismaService.universe.findMany).toHaveBeenCalledTimes(1);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'universe-features:discovery_enabled',
        expect.any(String),
        300
      );
    });

    it('excludes a universe whose bridge flag is explicitly disabled', async () => {
      mockPrismaService.universe.findMany.mockResolvedValue([
        { id: 'u-1', name: 'reality' },
        { id: 'u-2', name: 'games' },
      ]);
      // games has an explicitly-disabled row in the Redis bridge.
      mockFlagService.getFlags.mockImplementation(() =>
        stored({ 'universe.games.discovery_enabled': false })
      );

      const ids = await service.getEnabledUniverseIds('discovery_enabled');

      expect(ids).toEqual(['u-1']);
      expect(ids).not.toContain('u-2');
    });

    it('excludes a universe whose visibility sentinel is disabled even when the feature bridge is enabled', async () => {
      mockPrismaService.universe.findMany.mockResolvedValue([
        { id: 'u-1', name: 'reality' },
        { id: 'u-2', name: 'comedy' },
      ]);
      // comedy is DISABLED at the universe level (admin toggle) — nothing it
      // carries may surface, regardless of per-feature rows.
      mockFlagService.getFlags.mockImplementation(() =>
        stored({ 'universe.comedy.enabled': false, 'universe.comedy.discovery_enabled': true })
      );

      const ids = await service.getEnabledUniverseIds('discovery_enabled');

      expect(ids).toEqual(['u-1']);
    });

    it('treats a missing sentinel row as visible (default-open like the gateway)', async () => {
      mockPrismaService.universe.findMany.mockResolvedValue([{ id: 'u-1', name: 'reality' }]);
      mockFlagService.getFlags.mockResolvedValue(new Map());

      const ids = await service.getEnabledUniverseIds('discovery_enabled');
      expect(ids).toEqual(['u-1']);
    });

    it('applies the discovery filter to the home feed rails', async () => {
      mockFlagService.isEnabled.mockResolvedValue(false); // recommended rail off
      mockPrismaService.universe.findMany.mockResolvedValue([{ id: 'u-1', name: 'reality' }]);
      mockPrismaService.contentItem.findMany.mockResolvedValue([]);

      await service.getHomeFeed('user-1');

      // Every rail query constrained to discovery-enabled universes.
      expect(mockPrismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ universeId: { in: ['u-1'] } }),
        })
      );
      expect(contentFlags.recommendedRail).toBe('content_recommended_rail');
    });

    it.each([
      ['getFeatured', () => service.getFeatured()],
      ['getFeaturedSlides', () => service.getFeaturedSlides()],
      ['getPopularInRegion', () => service.getPopularInRegion()],
    ])('applies the universe filter to %s (main + fallback queries)', async (_name, call) => {
      mockPrismaService.universe.findMany.mockResolvedValue([
        { id: 'u-1', name: 'reality' },
        { id: 'u-2', name: 'comedy' },
      ]);
      mockFlagService.getFlags.mockImplementation(() =>
        stored({ 'universe.comedy.enabled': false })
      );
      mockPrismaService.contentItem.findMany.mockResolvedValue([]); // empty → fallback also runs

      await call();

      expect(mockPrismaService.contentItem.findMany).toHaveBeenCalled();
      for (const callArgs of mockPrismaService.contentItem.findMany.mock.calls) {
        expect(callArgs[0].where).toEqual(expect.objectContaining({ universeId: { in: ['u-1'] } }));
      }
    });

    it('getVisibleUniverseIds consults only the sentinel (no discovery bridge)', async () => {
      mockPrismaService.universe.findMany.mockResolvedValue([
        { id: 'u-1', name: 'reality' },
        { id: 'u-2', name: 'comedy' },
      ]);
      mockFlagService.getFlags.mockImplementation(() =>
        stored({ 'universe.comedy.enabled': false })
      );

      const ids = await service.getVisibleUniverseIds();

      expect(ids).toEqual(['u-1']);
      const requestedKeys = mockFlagService.getFlags.mock.calls[0][0] as string[];
      expect(requestedKeys).toContain('universe.reality.enabled');
      expect(requestedKeys).not.toContain('universe.reality.discovery_enabled');
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'universe-features:enabled',
        expect.any(String),
        300
      );
    });
  });
});
