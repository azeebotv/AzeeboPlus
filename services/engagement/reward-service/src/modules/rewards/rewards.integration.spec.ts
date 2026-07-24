import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RewardsService } from './rewards.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';

describe('RewardsService Integration', () => {
  let service: RewardsService;

  const mockPrismaService = {
    rewardAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    mission: {
      findMany: jest.fn(),
    },
    missionCompletion: {
      findMany: jest.fn(),
    },
    badge: {
      findMany: jest.fn(),
    },
    reward: {
      findUnique: jest.fn(),
    },
    rewardRedemption: {
      create: jest.fn(),
    },
    pointsLedger: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    level: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    delete: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                DEFAULT_PAGINATION_LIMIT: 100,
                CHECK_IN_POINTS: 10,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    jest.clearAllMocks();
  });

  describe('getRewardAccount', () => {
    it('should return existing reward account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        points: 500,
        levelId: 'level-2',
        streak: 5,
        lastLoginAt: new Date(),
        lastCheckInAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        badges: [],
        level: { id: 'level-2', name: 'Silver', rank: 2 },
      });

      const result = await service.getRewardAccount('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { rewardAccount: { points: number } };
      expect(data.rewardAccount.points).toBe(500);
    });

    it('should create new reward account if not exists', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);
      mockPrismaService.rewardAccount.create.mockResolvedValue({
        id: 'account-new',
        userId: 'user-1',
        points: 0,
        levelId: 'level-1',
        streak: 0,
        lastLoginAt: new Date(),
        lastCheckInAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        badges: [],
        level: { id: 'level-1', name: 'Bronze', rank: 1 },
      });

      const result = await service.getRewardAccount('user-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.rewardAccount.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          points: 0,
          levelId: 'level-1',
          streak: 0,
          lastLoginAt: expect.any(Date),
        },
        include: { badges: true, level: true },
      });
    });
  });

  describe('getMissions', () => {
    it('should return missions with completion status', async () => {
      mockPrismaService.mission.findMany.mockResolvedValue([
        { id: 'mission-1', title: 'Daily Login', points: 10, type: 'daily', isActive: true, description: null },
        { id: 'mission-2', title: 'Share Content', points: 25, type: 'one-time', isActive: true, description: 'Share once' },
      ]);
      mockPrismaService.missionCompletion.findMany.mockResolvedValue([
        { missionId: 'mission-1' },
      ]);

      const result = await service.getMissions('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { missions: { id: string; isCompleted: boolean }[] };
      expect(data.missions).toHaveLength(2);
      expect(data.missions[0].isCompleted).toBe(true);
      expect(data.missions[1].isCompleted).toBe(false);
    });

    it('should return cached missions when available', async () => {
      const cachedResult = {
        success: true,
        data: { missions: [{ id: 'mission-1', isCompleted: false }] },
      };
      mockCacheService.get.mockResolvedValueOnce(cachedResult);

      const result = await service.getMissions('user-1');

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.mission.findMany).not.toHaveBeenCalled();
    });
  });

  describe('earnPoints', () => {
    it('should earn points for a known activity', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        points: 100,
      });
      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'account-1', points: 105 },
        { id: 'ledger-1' },
      ]);

      const result = await service.earnPoints('user-1', 'daily_login');

      expect(result.success).toBe(true);
      const data = result.data as { pointsEarned: number; newBalance: number };
      expect(data.pointsEarned).toBe(5);
      expect(data.newBalance).toBe(105);
    });

    it('should throw NotFoundException when reward account does not exist', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      const result = await service.earnPoints('user-1', 'daily_login');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should throw BadRequestException for unknown activity', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        points: 100,
      });

      const result = await service.earnPoints('user-1', 'unknown_activity');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('redeemReward', () => {
    it('should redeem a reward successfully', async () => {
      mockPrismaService.reward.findUnique.mockResolvedValue({
        id: 'reward-1',
        cost: 100,
      });
      mockPrismaService.$queryRaw.mockResolvedValue([{ points: 500 }]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          rewardAccount: {
            update: jest.fn().mockResolvedValue({
              id: 'account-1',
              userId: 'user-1',
              points: 400,
            }),
          },
          rewardRedemption: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.redeemReward('user-1', 'reward-1');

      expect(result.success).toBe(true);
      const data = result.data as { rewardAccount: { points: number } };
      expect(data.rewardAccount.points).toBe(400);
    });

    it('should throw NotFoundException when reward does not exist', async () => {
      mockPrismaService.reward.findUnique.mockResolvedValue(null);

      const result = await service.redeemReward('user-1', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when insufficient points', async () => {
      mockPrismaService.reward.findUnique.mockResolvedValue({
        id: 'reward-1',
        cost: 100,
      });
      mockPrismaService.$queryRaw.mockResolvedValue([{ points: 50 }]);
      mockPrismaService.$transaction.mockImplementation(async () => {
        throw new BadRequestException('Insufficient points');
      });

      const result = await service.redeemReward('user-1', 'reward-1');

      expect(result.success).toBe(false);
    });
  });

  describe('getStreak', () => {
    it('should return current streak', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        streak: 5,
        lastLoginAt: yesterday,
        lastCheckInAt: yesterday,
      });

      const result = await service.getStreak('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { streak: { current: number } };
      expect(data.streak.current).toBe(6);
    });

    it('should reset streak when more than 1 day gap', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        streak: 10,
        lastLoginAt: threeDaysAgo,
        lastCheckInAt: threeDaysAgo,
      });

      const result = await service.getStreak('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { streak: { current: number } };
      expect(data.streak.current).toBe(0);
    });

    it('should keep streak same when login today', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        streak: 5,
        lastLoginAt: new Date(),
        lastCheckInAt: new Date(),
      });

      const result = await service.getStreak('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { streak: { current: number } };
      expect(data.streak.current).toBe(5);
    });

    it('should return error when reward account not found', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      const result = await service.getStreak('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('addPoints', () => {
    it('should add points and create ledger entry', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        points: 100,
      });
      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'account-1', points: 150 },
        { id: 'ledger-1' },
      ]);

      const result = await service.addPoints('user-1', 50, 'Bonus reward');

      expect(result.success).toBe(true);
      const data = result.data as { rewardAccount: { points: number } };
      expect(data.rewardAccount.points).toBe(150);
    });

    it('should reject zero or negative points', async () => {
      const result = await service.addPoints('user-1', 0, 'Bonus');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when account not found', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      const result = await service.addPoints('user-1', 50, 'Bonus');

      expect(result.success).toBe(false);
    });
  });

  describe('getBalance', () => {
    it('should return points balance', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'account-1',
        userId: 'user-1',
        points: 750,
        level: { id: 'level-3', name: 'Gold', rank: 3 },
      });

      const result = await service.getBalance('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { balance: number };
      expect(data.balance).toBe(750);
    });

    it('should return cached balance when available', async () => {
      const cachedResult = { success: true, data: { balance: 999 } };
      mockCacheService.get.mockResolvedValueOnce(cachedResult);

      const result = await service.getBalance('user-1');

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.rewardAccount.findUnique).not.toHaveBeenCalled();
    });

    it('should return error when account not found', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      const result = await service.getBalance('user-1');

      expect(result.success).toBe(false);
    });
  });
});
