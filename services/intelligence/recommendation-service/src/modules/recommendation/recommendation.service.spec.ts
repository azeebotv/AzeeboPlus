import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '@azeebo/shared-services';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockContentItem = {
    id: 'content-1',
    title: 'Test Content',
    description: 'Test description',
    thumbnail: 'https://example.com/thumb.jpg',
    creator: {
      id: 'creator-1',
      displayName: 'Test Creator',
      avatar: 'https://example.com/avatar.jpg',
    },
    universe: {
      id: 'universe-1',
      name: 'Test Universe',
      slug: 'test-universe',
    },
    categories: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        {
          provide: PrismaService,
          useValue: {
            contentItem: {
              findMany: jest.fn(),
            },
            userSegment: {
              findFirst: jest.fn(),
            },
            creatorProfile: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getContentRecommendations', () => {
    it('should return fallback recommendations when no userId provided', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);

      const result = await service.getContentRecommendations({ limit: 10 });

      expect(result.success).toBe(true);
    });

    it('should return recommendations for authenticated user', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);
      (prismaService.userSegment.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getContentRecommendations({ userId: 'user-1', limit: 10 });

      expect(result.success).toBe(true);
    });
  });

  describe('getCreatorRecommendations', () => {
    it('should return creator recommendations', async () => {
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'creator-1',
          bio: 'Test bio',
          user: {
            id: 'user-1',
            displayName: 'Test Creator',
            avatar: 'https://example.com/avatar.jpg',
          },
        },
      ]);

      const result = await service.getCreatorRecommendations('user-1', 10);

      expect(result.success).toBe(true);
    });

    it('should return empty array when no creators found', async () => {
      (prismaService.creatorProfile.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getCreatorRecommendations('user-1', 10);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getCrossUniverseRecommendations', () => {
    it('should return cross-universe recommendations', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getCrossUniverseRecommendations('user-1', 10);

      expect(result.success).toBe(true);
    });

    it('should return recommendations even without user preferences', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getCrossUniverseRecommendations('user-1', 10);

      expect(result.success).toBe(true);
    });
  });
});
