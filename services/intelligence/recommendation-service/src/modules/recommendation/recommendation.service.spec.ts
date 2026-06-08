import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../database/prisma.service';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test User',
    preferences: {},
  };

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
            watchHistory: {
              findMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            rewardAccount: {
              findUnique: jest.fn(),
            },
            contentItem: {
              findMany: jest.fn(),
            },
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
      (prismaService.watchHistory.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.rewardAccount.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);

      const result = await service.getContentRecommendations({ userId: 'user-1', limit: 10 });

      expect(result.success).toBe(true);
    });
  });

  describe('getCreatorRecommendations', () => {
    it('should return creator recommendations', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);

      const result = await service.getCreatorRecommendations('user-1', 10);

      expect(result.success).toBe(true);
    });

    it('should return empty array when no creators found', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getCreatorRecommendations('user-1', 10);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getCrossUniverseRecommendations', () => {
    it('should return cross-universe recommendations', async () => {
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);

      const result = await service.getCrossUniverseRecommendations('user-1', 10);

      expect(result.success).toBe(true);
    });

    it('should return recommendations even without user preferences', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, preferences: {} });
      (prismaService.contentItem.findMany as jest.Mock).mockResolvedValue([mockContentItem]);

      const result = await service.getCrossUniverseRecommendations('user-1', 10);

      expect(result.success).toBe(true);
    });
  });
});