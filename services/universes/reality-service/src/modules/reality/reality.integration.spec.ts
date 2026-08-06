import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { RealityService } from './reality.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';
import axios from 'axios';

jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RealityService Integration - Cross-Service Communication', () => {
  let service: RealityService;

  const mockPrismaService = {
    realityShow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    episode: {
      findMany: jest.fn(),
    },
    contestant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    vote: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    supervote: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
    },
    prediction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    season: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                SUPERVOTE_COST: 10,
                VOTE_COST: 1,
              };
              return config[key] ?? defaultValue;
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                WALLET_SERVICE_URL: 'http://wallet-service',
                ANALYTICS_SERVICE_URL: 'http://analytics-service',
              };
              return config[key];
            }),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
            del: jest.fn().mockResolvedValue(1),
            invalidate: jest.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compile();

    service = module.get<RealityService>(RealityService);

    jest.clearAllMocks();
    mockPrismaService.$transaction.mockReset();
  });

  describe('submitSupervote - Wallet Service Integration', () => {
    it('should successfully debit wallet and create supervote', async () => {
      const userId = 'user-1';
      const contestantId = 'contestant-1';
      const showId = 'show-1';

      mockPrismaService.supervote.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId,
        balance: 100,
      });

      mockedAxios.get.mockResolvedValue({
        data: {
          id: 'wallet-1',
          userId,
          balance: 100,
        },
      });

      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          balance: 90,
        },
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          supervote: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'supervote-1',
              userId,
              contestantId,
              showId,
              amount: 10,
            }),
          },
        });
      });

      const result = await service.submitSupervote(userId, {
        contestantId,
        showId,
      });

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/debit'),
        expect.objectContaining({
          amount: 10,
          description: expect.stringContaining(contestantId),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should throw NotFoundException when wallet does not exist', async () => {
      mockPrismaService.supervote.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      mockedAxios.get.mockResolvedValue({
        data: null,
      });

      await expect(
        service.submitSupervote('user-1', {
          contestantId: 'contestant-1',
          showId: 'show-1',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      mockPrismaService.supervote.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 5,
      });

      mockedAxios.get.mockResolvedValue({
        data: {
          id: 'wallet-1',
          userId: 'user-1',
          balance: 5,
        },
      });

      await expect(
        service.submitSupervote('user-1', {
          contestantId: 'contestant-1',
          showId: 'show-1',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when wallet service call fails', async () => {
      mockPrismaService.supervote.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 100,
      });

      mockedAxios.get.mockRejectedValue(new Error('Wallet service unavailable'));

      await expect(
        service.submitSupervote('user-1', {
          contestantId: 'contestant-1',
          showId: 'show-1',
        })
      ).rejects.toThrow();
    });

    it('should compensate wallet when supervote creation fails after debit', async () => {
      mockPrismaService.supervote.findUnique.mockResolvedValue(null);
      mockPrismaService.wallet.findUnique.mockResolvedValue({
        id: 'wallet-1',
        userId: 'user-1',
        balance: 100,
      });

      mockedAxios.get.mockResolvedValue({
        data: {
          id: 'wallet-1',
          userId: 'user-1',
          balance: 100,
        },
      });

      mockedAxios.post
        .mockResolvedValueOnce({
          data: { success: true, balance: 90 },
        })
        .mockResolvedValueOnce({
          data: { success: true },
        });

      mockPrismaService.$transaction.mockRejectedValue(new Error('Database error'));

      await expect(
        service.submitSupervote('user-1', {
          contestantId: 'contestant-1',
          showId: 'show-1',
        })
      ).rejects.toThrow();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/wallet/credit'),
        expect.objectContaining({
          description: expect.stringContaining('Compensation'),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should prevent duplicate supervotes', async () => {
      mockPrismaService.supervote.findUnique.mockResolvedValue({
        id: 'supervote-existing',
        userId: 'user-1',
        contestantId: 'contestant-1',
      });

      await expect(
        service.submitSupervote('user-1', {
          contestantId: 'contestant-1',
          showId: 'show-1',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('submitVote - Analytics Service Integration', () => {
    it('should track analytics event after vote submission', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue(null);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          vote: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'vote-1',
              userId: 'user-1',
              contestantId: 'contestant-1',
              showId: 'show-1',
            }),
          },
        };
        return callback(tx);
      });

      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await service.submitVote('user-1', {
        contestantId: 'contestant-1',
        showId: 'show-1',
      });

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/track'),
        expect.objectContaining({
          eventName: 'vote_submitted',
          userId: 'user-1',
          universe: 'reality',
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });

    it('should prevent duplicate votes', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue({
        id: 'vote-existing',
        userId: 'user-1',
        contestantId: 'contestant-1',
      });

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          vote: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'vote-existing',
              userId: 'user-1',
              contestantId: 'contestant-1',
            }),
          },
        };
        return callback(tx);
      });

      await expect(
        service.submitVote('user-1', {
          contestantId: 'contestant-1',
          showId: 'show-1',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('submitPrediction - Analytics Service Integration', () => {
    it('should track analytics event after prediction submission', async () => {
      mockPrismaService.prediction.create.mockResolvedValue({
        id: 'prediction-1',
        userId: 'user-1',
        showId: 'show-1',
      });

      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await service.submitPrediction('user-1', {
        showId: 'show-1',
        prediction: { winner: 'contestant-1' },
      });

      expect(result.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analytics/track'),
        expect.objectContaining({
          eventName: 'prediction_placed',
          userId: 'user-1',
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });
  });

  describe('getLeaderboard - Data Aggregation', () => {
    it('should calculate leaderboard with vote counts', async () => {
      const mockContestants = [
        {
          id: 'contestant-1',
          name: 'John',
          votes: [{ id: 'vote-1' }, { id: 'vote-2' }],
          supervotes: [{ id: 'supervote-1' }],
        },
        {
          id: 'contestant-2',
          name: 'Jane',
          votes: [{ id: 'vote-3' }],
          supervotes: [],
        },
      ];

      mockPrismaService.contestant.findMany.mockResolvedValue(mockContestants);

      const result = await service.getLeaderboard('show-1');

      expect(result.success).toBe(true);
      const data = result.data as { leaderboard: unknown[] };
      expect(data.leaderboard).toHaveLength(2);
      expect(data.leaderboard[0]).toMatchObject({
        rank: 1,
        contestantId: 'contestant-1',
        name: 'John',
        votes: 2,
        supervotes: 1,
        totalScore: 12,
      });
    });
  });

  describe('Error Handling - Service Resilience', () => {
    it('should handle analytics service failure gracefully', async () => {
      mockPrismaService.vote.findUnique.mockResolvedValue(null);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          vote: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'vote-1',
              userId: 'user-1',
              contestantId: 'contestant-1',
              showId: 'show-1',
            }),
          },
        };
        return callback(tx);
      });

      mockedAxios.post.mockRejectedValue(new Error('Analytics service down'));

      const result = await service.submitVote('user-1', {
        contestantId: 'contestant-1',
        showId: 'show-1',
      });

      expect(result.success).toBe(true);
    });
  });
});
