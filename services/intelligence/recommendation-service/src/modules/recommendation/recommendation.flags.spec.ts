import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService } from '@azeebo/feature-flags';

jest.mock('@azeebo/shared-services', () => ({
  CacheService: class MockCacheService {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn();
    delete = jest.fn();
  },
  cacheKey: jest.fn((_prefix: string, key: string) => key),
}));

import { CacheService } from '@azeebo/shared-services';

describe('RecommendationService flags', () => {
  let service: RecommendationService;
  let flags: { isEnabled: jest.Mock };
  let prisma: {
    contentItem: {
      findMany: jest.Mock;
      count: jest.Mock;
      aggregate: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
    creatorProfile: { findMany: jest.Mock; findUnique: jest.Mock };
    userSegment: { findFirst: jest.Mock };
    productEvent: { count: jest.Mock; findFirst: jest.Mock };
    paymentIntent: { count: jest.Mock; aggregate: jest.Mock; findUnique: jest.Mock };
    pointsLedger: { count: jest.Mock; aggregate: jest.Mock };
    user: { findUnique: jest.Mock };
  };

  const mockPrisma = () => ({
    contentItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    creatorProfile: { findMany: jest.fn(), findUnique: jest.fn() },
    userSegment: { findFirst: jest.fn() },
    productEvent: { count: jest.fn(), findFirst: jest.fn() },
    paymentIntent: { count: jest.fn(), aggregate: jest.fn(), findUnique: jest.fn() },
    pointsLedger: { count: jest.fn(), aggregate: jest.fn() },
    user: { findUnique: jest.fn() },
  });

  const compile = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CacheService,
          useValue: { get: jest.fn().mockResolvedValue(null), set: jest.fn(), delete: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, defaultValue: unknown) => defaultValue) },
        },
        { provide: FeatureFlagService, useValue: flags },
      ],
    }).compile();
    return module.get<RecommendationService>(RecommendationService);
  };

  const publishedContent = (id: string, universe = 'Reality', viewCount = 100) => ({
    id,
    title: `Content ${id}`,
    description: '',
    thumbnail: '',
    status: 'published',
    viewCount,
    createdAt: new Date(),
    publishedAt: new Date(),
    categories: ['comedy'],
    universe,
    universeId: `u-${universe}`,
    creatorId: 'c1',
    userId: 'u1',
    contentId: id,
    watchedAt: new Date(),
  });

  /** Sets up the prisma call sequence for a user-scored recommendations run. */
  const seedUserPath = (candidates: ReturnType<typeof publishedContent>[]) => {
    prisma.contentItem.findMany
      .mockResolvedValueOnce(candidates) // watch history rows
      .mockResolvedValueOnce(candidates) // watched content lookup
      .mockResolvedValueOnce(candidates); // candidate content pool
    prisma.creatorProfile.findMany.mockResolvedValue([]);
    prisma.userSegment.findFirst.mockResolvedValue(null);
  };

  beforeEach(() => {
    prisma = mockPrisma();
    flags = { isEnabled: jest.fn() };
  });

  describe('A/B algorithm bucketing', () => {
    it('picks collaborative when only that flag is on', async () => {
      flags.isEnabled.mockImplementation((key: string) => key === 'recommendation_collaborative');
      service = await compile();
      seedUserPath([publishedContent('1')]);

      const result = await service.getContentRecommendations({ userId: 'u1', limit: 10 });
      expect(result.success).toBe(true);
      expect(result.data?.[0]?.algorithm).toBe('collaborative');
    });

    it('picks content_based when only that flag is on', async () => {
      flags.isEnabled.mockImplementation((key: string) => key === 'recommendation_content_based');
      service = await compile();
      seedUserPath([publishedContent('1')]);

      const result = await service.getContentRecommendations({ userId: 'u1', limit: 10 });
      expect(result.data?.[0]?.algorithm).toBe('content_based');
    });

    it('picks hybrid by default (registered default)', async () => {
      flags.isEnabled.mockImplementation((key: string) => key === 'recommendation_hybrid');
      service = await compile();
      seedUserPath([publishedContent('1')]);

      const result = await service.getContentRecommendations({ userId: 'u1', limit: 10 });
      expect(result.data?.[0]?.algorithm).toBe('hybrid');
    });

    it('buckets the same user to the same algorithm across calls (consistency)', async () => {
      // Two algorithms enabled → hash-bucket per user
      flags.isEnabled.mockImplementation(
        (key: string) =>
          key === 'recommendation_collaborative' || key === 'recommendation_content_based'
      );
      service = await compile();
      seedUserPath([publishedContent('1')]);

      const first = await service.getContentRecommendations({ userId: 'stable-user', limit: 10 });
      seedUserPath([publishedContent('1')]);
      const second = await service.getContentRecommendations({ userId: 'stable-user', limit: 10 });
      expect(first.data?.[0]?.algorithm).toBe(second.data?.[0]?.algorithm);
    });

    it('may bucket different users to different algorithms when both are on', async () => {
      flags.isEnabled.mockImplementation(
        (key: string) =>
          key === 'recommendation_collaborative' || key === 'recommendation_content_based'
      );
      service = await compile();

      const seen = new Set<string>();
      for (let i = 0; i < 20; i++) {
        seedUserPath([publishedContent('1')]);
        const result = await service.getContentRecommendations({ userId: `user-${i}`, limit: 10 });
        seen.add(result.data?.[0]?.algorithm ?? 'none');
      }
      expect(seen.size).toBeGreaterThan(1);
    });
  });

  describe('kill-switch gates', () => {
    it('cross-universe returns empty when the flag is off', async () => {
      flags.isEnabled.mockResolvedValue(false);
      service = await compile();
      const result = await service.getCrossUniverseRecommendations('u1');
      expect(result).toEqual({ success: true, data: [] });
    });

    it('churn model returns zeroed risk when off', async () => {
      flags.isEnabled.mockResolvedValue(false);
      service = await compile();
      const result = await service.getChurnRisk('u1');
      expect(result.data?.riskScore).toBe(0);
      expect(result.data?.riskLevel).toBe('low');
    });

    it('fraud model returns zeroed risk when off', async () => {
      flags.isEnabled.mockResolvedValue(false);
      service = await compile();
      const result = await service.assessFraudRisk({ userId: 'u1' });
      expect(result.data?.riskScore).toBe(0);
      expect(result.data?.riskLevel).toBe('low');
    });

    it('creator score returns zeroed score when off', async () => {
      flags.isEnabled.mockResolvedValue(false);
      service = await compile();
      const result = await service.getCreatorScore('c1');
      expect(result.data?.score).toBe(0);
      expect(result.data?.tier).toBe('new');
    });

    it('personalized feed falls back to plain content recs when off', async () => {
      flags.isEnabled.mockImplementation((key: string) => key === 'recommendation_hybrid');
      service = await compile();
      seedUserPath([publishedContent('1')]);

      const result = await service.getPersonalizedFeed('u1', 10);
      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });
  });

  describe('caching kill-switch', () => {
    it('skips cache read+write when recommendation_caching is off', async () => {
      flags.isEnabled.mockImplementation((key: string) => key === 'recommendation_hybrid');
      service = await compile();
      const cache = (service as unknown as { cache: { get: jest.Mock; set: jest.Mock } }).cache;
      seedUserPath([publishedContent('1')]);

      const result = await service.getContentRecommendations({ userId: 'u1', limit: 10 });
      expect(result.success).toBe(true);
      expect(cache.get).not.toHaveBeenCalled();
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('uses cache when recommendation_caching is on', async () => {
      flags.isEnabled.mockImplementation(
        (key: string) => key === 'recommendation_hybrid' || key === 'recommendation_caching'
      );
      service = await compile();
      const cache = (service as unknown as { cache: { get: jest.Mock; set: jest.Mock } }).cache;
      seedUserPath([publishedContent('1')]);

      const result = await service.getContentRecommendations({ userId: 'u1', limit: 10 });
      expect(result.success).toBe(true);
      expect(cache.get).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });
  });
});
