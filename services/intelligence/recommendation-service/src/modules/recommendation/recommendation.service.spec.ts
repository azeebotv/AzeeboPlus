jest.mock('axios');

class MockCacheService {
  get = jest.fn().mockResolvedValue(null);
  set = jest.fn();
  delete = jest.fn();
}

jest.mock('@azeebo/shared-services', () => ({
  CacheService: MockCacheService,
  cacheKey: jest.fn((_prefix: string, key: string) => key),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let prisma: {
    contentItem: { findMany: jest.Mock; count: jest.Mock };
    userUniverseAffinity: { findMany: jest.Mock };
    watchHistory: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      contentItem: { findMany: jest.fn(), count: jest.fn() },
      userUniverseAffinity: { findMany: jest.fn() },
      watchHistory: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: PrismaService, useValue: prisma },
        { provide: MockCacheService, useValue: new MockCacheService() },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, defaultValue: unknown) => defaultValue) },
        },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
  });

  describe('getContentRecommendations', () => {
    it('should return content recommendations', async () => {
      const mockContent = [
        {
          id: '1',
          title: 'Test',
          description: 'Test',
          thumbnail: 't.jpg',
          status: 'published',
          viewCount: 100,
          createdAt: new Date(),
          universe: { id: 'u1', name: 'Reality', slug: 'reality' },
          creator: { id: 'c1', displayName: 'Creator', avatar: null },
        },
      ];
      prisma.contentItem.findMany.mockResolvedValue(mockContent);
      prisma.userUniverseAffinity.findMany.mockResolvedValue([]);
      const result = await service.getContentRecommendations({ limit: 10 });
      expect(result).toBeDefined();
    });

    it('should handle empty content', async () => {
      prisma.contentItem.findMany.mockResolvedValue([]);
      prisma.userUniverseAffinity.findMany.mockResolvedValue([]);
      const result = await service.getContentRecommendations({ limit: 10 });
      expect(result).toBeDefined();
    });
  });

  describe('getCreatorRecommendations', () => {
    it('should return creator recommendations', async () => {
      prisma.contentItem.findMany.mockResolvedValue([]);
      const result = await service.getCreatorRecommendations('user-1');
      expect(result).toBeDefined();
    });
  });
});
