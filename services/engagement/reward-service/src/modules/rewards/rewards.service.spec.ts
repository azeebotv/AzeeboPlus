import { Test, TestingModule } from '@nestjs/testing';
import { RewardsService } from './rewards.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RewardsService', () => {
  let service: RewardsService;
  let prisma: PrismaService;

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
    level: {
      findFirst: jest.fn(),
    },
    pointsLedger: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations as Promise<unknown>[])),
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
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRewardAccount', () => {
    it('should return existing reward account', async () => {
      const mockAccount = {
        id: 'ra-1',
        userId: 'user-1',
        points: 500,
        levelId: 'level-1',
        streak: 5,
        lastLoginAt: new Date(),
        lastCheckInAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        badges: [],
        level: { id: 'level-1', name: 'Beginner', rank: 1, minPoints: 0 },
      };

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockAccount);

      const result = await service.getRewardAccount('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.rewardAccount!.points).toBe(500);
    });

    it('should create new reward account if not found', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);
      mockPrismaService.rewardAccount.create.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 0,
        levelId: 'level-1',
        streak: 0,
        lastLoginAt: new Date(),
        lastCheckInAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        badges: [],
        level: { id: 'level-1', name: 'Beginner', rank: 1, minPoints: 0 },
      });

      const result = await service.getRewardAccount('user-new');

      expect(result.success).toBe(true);
      expect(result.data!.rewardAccount!.points).toBe(0);
    });
  });

  describe('getMissions', () => {
    it('should return missions with completion status', async () => {
      const mockMissions = [
        { id: 'm1', title: 'Daily Login', points: 10, type: 'daily', isActive: true, rewards: [] },
        { id: 'm2', title: 'Watch Video', points: 5, type: 'daily', isActive: true, rewards: [] },
      ];

      mockPrismaService.mission.findMany.mockResolvedValue(mockMissions);
      mockPrismaService.missionCompletion.findMany.mockResolvedValue([{ missionId: 'm1' }]);

      const result = await service.getMissions('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.missions!).toHaveLength(2);
      expect(result.data!.missions![0].isCompleted).toBe(true);
      expect(result.data!.missions![1].isCompleted).toBe(false);
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.mission.findMany.mockResolvedValue([]);
      mockPrismaService.missionCompletion.findMany.mockResolvedValue([]);

      await service.getMissions('user-1', 10);

      expect(mockPrismaService.mission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('getBadges', () => {
    it('should return user badges', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        badges: [{ id: 'badge-1' }, { id: 'badge-2' }],
      });
      mockPrismaService.badge.findMany.mockResolvedValue([
        { id: 'badge-1', name: 'First Login', points: 10 },
        { id: 'badge-2', name: 'Streak Master', points: 50 },
      ]);

      const result = await service.getBadges('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.badges).toHaveLength(2);
    });

    it('should return empty badges if no reward account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);
      mockPrismaService.badge.findMany.mockResolvedValue([]);

      const result = await service.getBadges('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.badges).toEqual([]);
    });
  });

  describe('getStreak', () => {
    it('should return current streak', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        streak: 5,
        lastLoginAt: yesterday,
        lastCheckInAt: yesterday,
      });

      const result = await service.getStreak('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.streak).toBeDefined();
    });

    it('should throw NotFoundException if no reward account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(service.getStreak('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('redeemReward', () => {
    it('should redeem reward successfully', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 500,
        levelId: 'level-1',
        streak: 5,
      });
      mockPrismaService.reward.findUnique.mockResolvedValue({
        id: 'reward-1',
        name: 'Premium Badge',
        cost: 100,
      });
      mockPrismaService.rewardAccount.update.mockResolvedValue({ points: 400 });
      mockPrismaService.rewardRedemption.create.mockResolvedValue({ id: 'rr-1' });

      const result = await service.redeemReward('user-1', 'reward-1');

      expect(result.success).toBe(true);
      expect(result.data!.message).toBe('Reward redeemed successfully');
      expect(result.data!.rewardAccount!.points).toBe(400);
    });

    it('should throw NotFoundException if no reward account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if reward not found', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({ points: 500 });
      mockPrismaService.reward.findUnique.mockResolvedValue(null);

      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if insufficient points', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({ points: 50 });
      mockPrismaService.reward.findUnique.mockResolvedValue({ cost: 100 });

      await expect(service.redeemReward('user-1', 'reward-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLevel', () => {
    it('should return current level with progress', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 250,
        levelId: 'level-2',
        streak: 5,
        level: { id: 'level-2', name: 'Intermediate', rank: 2, minPoints: 200 },
      });
      mockPrismaService.level.findFirst.mockResolvedValue({
        id: 'level-3',
        name: 'Advanced',
        rank: 3,
        minPoints: 500,
      });

      const result = await service.getLevel('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.level!.name).toBe('Intermediate');
      expect(result.data!.message).toContain('points to next level');
    });

    it('should show max level reached', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 1000,
        levelId: 'level-5',
        level: { id: 'level-5', name: 'Legend', rank: 5, minPoints: 1000 },
      });
      mockPrismaService.level.findFirst.mockResolvedValue(null);

      const result = await service.getLevel('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.message).toBe('Max level reached');
    });

    it('should throw NotFoundException if no reward account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(service.getLevel('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addPoints', () => {
    it('should add points to account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 100,
        levelId: 'level-1',
        streak: 5,
      });
      mockPrismaService.rewardAccount.update.mockResolvedValue({ points: 150 });
      mockPrismaService.pointsLedger.create.mockResolvedValue({ id: 'pl-1' });

      const result = await service.addPoints('user-1', 50, 'Bonus');

      expect(result.success).toBe(true);
      expect(result.data!.message).toBe('Points added successfully');
      expect(result.data!.rewardAccount!.points).toBe(150);
    });

    it('should throw NotFoundException if no reward account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(service.addPoints('user-1', 50, 'Bonus')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkIn', () => {
    it('should complete daily check-in', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 100,
        levelId: 'level-1',
        streak: 5,
        lastCheckInAt: yesterday,
        lastLoginAt: yesterday,
      });
      mockPrismaService.rewardAccount.update.mockResolvedValue({});
      mockPrismaService.pointsLedger.create.mockResolvedValue({});

      const result = await service.checkIn('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.message).toBe('Check-in successful');
    });

    it('should throw BadRequestException if already checked in today', async () => {
      const today = new Date();

      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 100,
        lastCheckInAt: today,
        lastLoginAt: today,
      });

      await expect(service.checkIn('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if no reward account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(service.checkIn('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('earnPoints', () => {
    it('should earn points for activity', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 100,
        levelId: 'level-1',
        streak: 5,
      });
      mockPrismaService.rewardAccount.update.mockResolvedValue({});
      mockPrismaService.pointsLedger.create.mockResolvedValue({});

      const result = await service.earnPoints('user-1', 'content_view');

      expect(result.success).toBe(true);
      expect(result.data!.pointsEarned).toBe(1);
    });

    it('should earn custom amount of points', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 100,
        levelId: 'level-1',
        streak: 5,
      });
      mockPrismaService.rewardAccount.update.mockResolvedValue({});
      mockPrismaService.pointsLedger.create.mockResolvedValue({});

      const result = await service.earnPoints('user-1', 'custom', 25);

      expect(result.success).toBe(true);
      expect(result.data!.pointsEarned).toBe(25);
    });

    it('should throw NotFoundException if no reward account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(service.earnPoints('user-1', 'content_view')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBalance', () => {
    it('should return current balance', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({
        id: 'ra-1',
        userId: 'user-1',
        points: 500,
        level: { id: 'level-2', name: 'Intermediate', rank: 2 },
      });

      const result = await service.getBalance('user-1');

      expect(result.success).toBe(true);
      expect(result.data!.balance).toBe(500);
    });

    it('should throw NotFoundException if no reward account', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(service.getBalance('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistory', () => {
    it('should return paginated history', async () => {
      const mockLedger = [
        { id: 'pl-1', points: 10, type: 'credit', reason: 'Daily check-in', createdAt: new Date() },
        {
          id: 'pl-2',
          points: 50,
          type: 'debit',
          reason: 'Reward redemption',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.pointsLedger.findMany.mockResolvedValue(mockLedger);
      mockPrismaService.pointsLedger.count.mockResolvedValue(25);

      const result = await service.getHistory('user-1', 1, 20);

      expect(result.success).toBe(true);
      expect(result.data!.history).toHaveLength(2);
      expect(result.data!.pagination!.total).toBe(25);
      expect(result.data!.pagination!.totalPages).toBe(2);
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.pointsLedger.findMany.mockResolvedValue([]);
      mockPrismaService.pointsLedger.count.mockResolvedValue(50);

      const result = await service.getHistory('user-1', 2, 10);

      expect(result.data!.pagination!.page).toBe(2);
      expect(result.data!.pagination!.totalPages).toBe(5);
    });
  });
});
