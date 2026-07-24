import { Test, TestingModule } from '@nestjs/testing';
import { EngagementService } from './engagement.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';

describe('EngagementService', () => {
  let service: EngagementService;
  let prisma: {
    leaderboardEntry: { findMany: jest.Mock; count: jest.Mock };
    prediction: { findMany: jest.Mock; count: jest.Mock };
    ranking: { findMany: jest.Mock; count: jest.Mock };
  };
  let cache: { get: jest.Mock; set: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    prisma = {
      leaderboardEntry: { findMany: jest.fn(), count: jest.fn() },
      prediction: { findMany: jest.fn(), count: jest.fn() },
      ranking: { findMany: jest.fn(), count: jest.fn() },
    };
    cache = { get: jest.fn().mockResolvedValue(null), set: jest.fn(), delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngagementService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, defaultValue: unknown) => defaultValue) },
        },
      ],
    }).compile();

    service = module.get<EngagementService>(EngagementService);
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries', async () => {
      const mockEntries = [
        {
          id: '1',
          userId: 'user-1',
          displayName: 'User 1',
          avatar: null,
          score: 100,
          rank: 1,
          category: 'all',
          timePeriod: 'allTime',
        },
      ];
      prisma.leaderboardEntry.findMany.mockResolvedValue(mockEntries);
      prisma.leaderboardEntry.count.mockResolvedValue(1);

      const result = await service.getLeaderboard('weekly', 'all', 10);
      expect(result).toBeDefined();
    });

    it('should handle empty leaderboard', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([]);
      prisma.leaderboardEntry.count.mockResolvedValue(0);

      const result = await service.getLeaderboard('weekly', 'all', 10);
      expect(result).toBeDefined();
    });
  });

  describe('getRankings', () => {
    it('should return rankings', async () => {
      const mockRankings = [
        {
          id: '1',
          userId: 'user-1',
          displayName: 'User 1',
          avatar: null,
          score: 100,
          rank: 1,
          category: 'all',
        },
      ];
      prisma.ranking.findMany.mockResolvedValue(mockRankings);
      prisma.ranking.count.mockResolvedValue(1);

      const result = await service.getRankings();
      expect(result).toBeDefined();
    });
  });

  describe('getPredictionResults', () => {
    it('should return prediction results', async () => {
      const mockPredictions = [
        {
          id: '1',
          userId: 'user-1',
          contentId: 'content-1',
          prediction: 'yes',
          points: 10,
          isCorrect: true,
          result: 'yes',
          createdAt: new Date(),
        },
      ];
      prisma.prediction.findMany.mockResolvedValue(mockPredictions);
      prisma.prediction.count.mockResolvedValue(1);

      const result = await service.getPredictionResults('user-1', 'content-1');
      expect(result).toBeDefined();
    });
  });
});
