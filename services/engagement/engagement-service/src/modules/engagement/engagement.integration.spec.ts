import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EngagementService } from './engagement.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService } from '@azeebo/shared-services';

describe('EngagementService Integration', () => {
  let service: EngagementService;

  const mockPrismaService = {
    leaderboardEntry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ranking: {
      findMany: jest.fn(),
    },
    prediction: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngagementService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<EngagementService>(EngagementService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries ranked by score', async () => {
      const mockEntries = [
        { id: '1', userId: 'user-a', displayName: 'Alice', avatar: null, score: 1500, category: 'all', timePeriod: 'weekly' },
        { id: '2', userId: 'user-b', displayName: 'Bob', avatar: null, score: 1200, category: 'all', timePeriod: 'weekly' },
        { id: '3', userId: 'user-c', displayName: 'Charlie', avatar: null, score: 900, category: 'all', timePeriod: 'weekly' },
      ];

      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.leaderboardEntry.findMany.mockResolvedValue(mockEntries);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getLeaderboard('weekly', 'all', 50);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0].rank).toBe(1);
      expect(result.data[0].userId).toBe('user-a');
      expect(result.data[0].score).toBe(1500);
      expect(result.data[1].rank).toBe(2);
      expect(result.data[2].rank).toBe(3);
    });

    it('should return cached leaderboard when available', async () => {
      const cached = {
        success: true,
        data: [{ id: '1', userId: 'user-a', rank: 1, score: 1500 }],
      };
      mockCacheService.get.mockResolvedValue(cached);

      const result = await service.getLeaderboard('weekly', 'all');

      expect(result).toEqual(cached);
      expect(mockPrismaService.leaderboardEntry.findMany).not.toHaveBeenCalled();
    });

    it('should handle empty leaderboard', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.leaderboardEntry.findMany.mockResolvedValue([]);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getLeaderboard('weekly', 'all');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should throw BadRequestException for invalid timePeriod', async () => {
      await expect(service.getLeaderboard('invalid', 'all')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid category', async () => {
      await expect(service.getLeaderboard('weekly', 'invalid')).rejects.toThrow(BadRequestException);
    });

    it('should support all valid timePeriods', async () => {
      for (const period of ['daily', 'weekly', 'monthly', 'allTime']) {
        mockCacheService.get.mockResolvedValue(null);
        mockPrismaService.leaderboardEntry.findMany.mockResolvedValue([]);
        mockCacheService.set.mockResolvedValue(undefined);

        const result = await service.getLeaderboard(period, 'all');
        expect(result.success).toBe(true);
      }
    });

    it('should support all valid categories', async () => {
      for (const category of ['all', 'gaming', 'content', 'social', 'predictions']) {
        mockCacheService.get.mockResolvedValue(null);
        mockPrismaService.leaderboardEntry.findMany.mockResolvedValue([]);
        mockCacheService.set.mockResolvedValue(undefined);

        const result = await service.getLeaderboard('weekly', category);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('getRankings', () => {
    it('should return rankings grouped by category', async () => {
      const mockEntries = [
        { id: '1', userId: 'user-a', displayName: 'Alice', avatar: null, score: 1000, category: 'gaming' },
        { id: '2', userId: 'user-b', displayName: 'Bob', avatar: null, score: 800, category: 'gaming' },
        { id: '3', userId: 'user-c', displayName: 'Charlie', avatar: null, score: 500, category: 'content' },
      ];

      mockPrismaService.ranking.findMany.mockResolvedValue(mockEntries);

      const result = await service.getRankings();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
      const gaming = result.data.find((r: { category: string }) => r.category === 'gaming');
      expect(gaming.rankings).toHaveLength(2);
      expect(gaming.rankings[0].rank).toBe(1);
      expect(gaming.rankings[1].rank).toBe(2);
      const content = result.data.find((r: { category: string }) => r.category === 'content');
      expect(content.rankings).toHaveLength(1);
    });

    it('should limit each category to 10 entries', async () => {
      const mockEntries = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        userId: `user-${i}`,
        displayName: `User ${i}`,
        avatar: null,
        score: 1000 - i * 10,
        category: 'gaming',
      }));

      mockPrismaService.ranking.findMany.mockResolvedValue(mockEntries);

      const result = await service.getRankings();

      const gaming = result.data.find((r: { category: string }) => r.category === 'gaming');
      expect(gaming.rankings).toHaveLength(10);
    });

    it('should return empty rankings for categories with no data', async () => {
      mockPrismaService.ranking.findMany.mockResolvedValue([]);

      const result = await service.getRankings();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
      for (const category of result.data) {
        expect(category.rankings).toEqual([]);
      }
    });
  });

  describe('submitPrediction', () => {
    it('should submit a new prediction', async () => {
      mockPrismaService.prediction.findFirst.mockResolvedValue(null);
      mockPrismaService.prediction.create.mockResolvedValue({
        id: 'pred-1',
        userId: 'user-1',
        contentId: 'content-1',
        prediction: 'winner-A',
        points: 10,
        createdAt: new Date(),
      });
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.submitPrediction('user-1', 'content-1', 'winner-A');

      expect(result.success).toBe(true);
      expect(result.data.prediction).toBe('winner-A');
      expect(result.data.points).toBe(10);
      expect(result.data.id).toBe('pred-1');
    });

    it('should throw BadRequestException for duplicate prediction', async () => {
      mockPrismaService.prediction.findFirst.mockResolvedValue({
        id: 'pred-existing',
        userId: 'user-1',
        contentId: 'content-1',
      });

      await expect(
        service.submitPrediction('user-1', 'content-1', 'winner-B')
      ).rejects.toThrow(BadRequestException);
    });

    it('should assign 10 points for each prediction', async () => {
      mockPrismaService.prediction.findFirst.mockResolvedValue(null);
      mockPrismaService.prediction.create.mockResolvedValue({
        id: 'pred-2',
        userId: 'user-1',
        contentId: 'content-2',
        prediction: 'draw',
        points: 10,
        createdAt: new Date(),
      });
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.submitPrediction('user-1', 'content-2', 'draw');

      expect(result.data.points).toBe(10);
      expect(mockPrismaService.prediction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ points: 10 }),
      });
    });
  });

  describe('getPredictionResults', () => {
    it('should return prediction results with accuracy summary', async () => {
      const mockPredictions = [
        { id: '1', prediction: 'winner-A', points: 10, isCorrect: true, result: 'winner-A', createdAt: new Date() },
        { id: '2', prediction: 'winner-B', points: 10, isCorrect: false, result: 'winner-A', createdAt: new Date() },
        { id: '3', prediction: 'draw', points: 10, isCorrect: null, result: null, createdAt: new Date() },
      ];

      mockPrismaService.prediction.findMany.mockResolvedValue(mockPredictions);

      const result = await service.getPredictionResults('user-1', 'content-1');

      expect(result.success).toBe(true);
      expect(result.data.predictions).toHaveLength(3);
      expect(result.data.summary.totalPredictions).toBe(3);
      expect(result.data.summary.correctPredictions).toBe(1);
      expect(result.data.summary.totalPoints).toBe(30);
      expect(result.data.summary.accuracy).toBeCloseTo(33.33, 1);
    });

    it('should handle zero predictions', async () => {
      mockPrismaService.prediction.findMany.mockResolvedValue([]);

      const result = await service.getPredictionResults('user-1', 'content-new');

      expect(result.success).toBe(true);
      expect(result.data.predictions).toEqual([]);
      expect(result.data.summary.totalPredictions).toBe(0);
      expect(result.data.summary.accuracy).toBe(0);
    });
  });

  describe('updateLeaderboard', () => {
    it('should create new leaderboard entry when none exists', async () => {
      mockPrismaService.leaderboardEntry.findUnique.mockResolvedValue(null);
      mockPrismaService.leaderboardEntry.create.mockResolvedValue({
        id: 'lb-new',
        userId: 'user-1',
        displayName: 'Alice',
        avatar: null,
        score: 100,
        category: 'gaming',
        timePeriod: 'weekly',
      });
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.updateLeaderboard(
        'user-1',
        'Alice',
        null,
        100,
        'gaming',
        'weekly'
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Leaderboard updated');
      expect(mockPrismaService.leaderboardEntry.create).toHaveBeenCalled();
    });

    it('should increment score when entry already exists', async () => {
      mockPrismaService.leaderboardEntry.findUnique.mockResolvedValue({
        id: 'lb-existing',
        userId: 'user-1',
        score: 100,
      });
      mockPrismaService.leaderboardEntry.update.mockResolvedValue({});
      mockCacheService.invalidate.mockResolvedValue(undefined);

      const result = await service.updateLeaderboard(
        'user-1',
        'Alice',
        null,
        50,
        'gaming',
        'weekly'
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.leaderboardEntry.update).toHaveBeenCalledWith({
        where: { id: 'lb-existing' },
        data: {
          score: { increment: 50 },
          displayName: 'Alice',
          avatar: null,
        },
      });
    });
  });
});
