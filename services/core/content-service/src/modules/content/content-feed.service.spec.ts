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
    getFlag: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
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
      mockFlagService.getFlag.mockResolvedValue(null);

      const ids = await service.getEnabledUniverseIds('discovery_enabled');

      expect(ids).toEqual(['u-1', 'u-2']);
      // Queries universes with names (needed for the Redis key convention).
      expect(mockPrismaService.universe.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: { id: true, name: true } })
      );
      // The bridge looks up the canonical Redis key per universe.
      expect(mockFlagService.getFlag).toHaveBeenCalledWith('universe.reality.discovery_enabled');
      expect(mockFlagService.getFlag).toHaveBeenCalledWith('universe.games.discovery_enabled');
    });

    it('caches the universe set by feature key', async () => {
      jest.clearAllMocks();
      mockPrismaService.universe.findMany.mockResolvedValue([{ id: 'u-1', name: 'reality' }]);
      // Stateful cache: a write makes the next read hit.
      const stored = new Map<string, string>();
      mockRedisService.get.mockImplementation((key: string) =>
        Promise.resolve(stored.get(key) ?? null)
      );
      mockRedisService.set.mockImplementation((key: string, value: string) => {
        stored.set(key, String(value));
        return Promise.resolve('OK');
      });

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
      mockFlagService.getFlag.mockImplementation((key: string) =>
        Promise.resolve(key === 'universe.games.discovery_enabled' ? { key, enabled: false } : null)
      );

      const ids = await service.getEnabledUniverseIds('discovery_enabled');

      expect(ids).toEqual(['u-1']);
      expect(ids).not.toContain('u-2');
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
  });
});
