import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ReferralService } from './referral.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '@azeebo/shared-services';

describe('ReferralService Integration', () => {
  let service: ReferralService;

  const mockPrismaService = {
    referralCode: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    referral: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    referralReward: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    referralConfig: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    invalidate: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                DEFAULT_PAGINATION_LIMIT: 20,
                DEFAULT_REFERRAL_REWARD: 50,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    jest.clearAllMocks();
  });

  describe('getReferralCode', () => {
    it('should return existing active referral code', async () => {
      mockPrismaService.referralCode.findFirst.mockResolvedValue({
        id: 'code-1',
        userId: 'user-1',
        code: 'AZB-ABCDEF12',
        isActive: true,
        maxUses: 10,
        currentUses: 3,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getReferralCode('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { referralCode: { code: string } };
      expect(data.referralCode.code).toBe('AZB-ABCDEF12');
    });

    it('should return null when no active code exists', async () => {
      mockPrismaService.referralCode.findFirst.mockResolvedValue(null);

      const result = await service.getReferralCode('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { referralCode: null };
      expect(data.referralCode).toBeNull();
    });

    it('should return cached result when available', async () => {
      const cachedResult = {
        success: true,
        data: { referralCode: { code: 'AZB-CACHED' } },
      };
      mockCacheService.get.mockResolvedValueOnce(cachedResult);

      const result = await service.getReferralCode('user-1');

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.referralCode.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('generateReferralCode', () => {
    it('should return existing active code if user already has one', async () => {
      mockPrismaService.referralCode.findFirst.mockResolvedValue({
        id: 'code-1',
        userId: 'user-1',
        code: 'AZB-EXISTING',
        isActive: true,
        maxUses: null,
        currentUses: 0,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.generateReferralCode('user-1', {});

      expect(result.success).toBe(true);
      const data = result.data as { referralCode: { code: string } };
      expect(data.referralCode.code).toBe('AZB-EXISTING');
      expect(mockPrismaService.referralCode.create).not.toHaveBeenCalled();
    });

    it('should create new referral code when none exists', async () => {
      mockPrismaService.referralCode.findFirst.mockResolvedValue(null);
      mockPrismaService.referralCode.create.mockResolvedValue({
        id: 'code-new',
        userId: 'user-1',
        code: 'AZB-NEWCODE12',
        isActive: true,
        maxUses: 5,
        currentUses: 0,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.generateReferralCode('user-1', { maxUses: 5 });

      expect(result.success).toBe(true);
      expect(mockPrismaService.referralCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          maxUses: 5,
          expiresAt: null,
        }),
      });
    });

    it('should retry on unique constraint violation', async () => {
      mockPrismaService.referralCode.findFirst.mockResolvedValue(null);
      mockPrismaService.referralCode.create
        .mockRejectedValueOnce(
          Object.assign(new Error('Unique constraint'), {
            code: 'P2002',
            name: 'PrismaClientKnownRequestError',
          })
        )
        .mockResolvedValueOnce({
          id: 'code-retry',
          userId: 'user-1',
          code: 'AZB-RETRY123',
          isActive: true,
          maxUses: null,
          currentUses: 0,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const result = await service.generateReferralCode('user-1', {});

      expect(result.success).toBe(true);
      expect(mockPrismaService.referralCode.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('applyReferralCode', () => {
    it('should apply referral code successfully', async () => {
      mockPrismaService.referralCode.findUnique.mockResolvedValue({
        id: 'code-1',
        userId: 'referrer-1',
        code: 'AZB-VALID123',
        isActive: true,
        maxUses: 10,
        currentUses: 2,
        expiresAt: null,
      });
      mockPrismaService.referral.findFirst.mockResolvedValue(null);
      mockPrismaService.$executeRaw.mockResolvedValue(1);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          referral: {
            create: jest.fn().mockResolvedValue({
              id: 'referral-1',
              referrerId: 'referrer-1',
              referredId: 'new-user-1',
              status: 'pending',
              createdAt: new Date(),
            }),
          },
          $executeRaw: jest.fn().mockResolvedValue(1),
        });
      });

      const result = await service.applyReferralCode('new-user-1', { code: 'AZB-VALID123' });

      expect(result.success).toBe(true);
      const data = result.data as { referral: { status: string } };
      expect(data.referral.status).toBe('pending');
    });

    it('should throw NotFoundException for invalid code', async () => {
      mockPrismaService.referralCode.findUnique.mockResolvedValue(null);

      await expect(
        service.applyReferralCode('user-1', { code: 'INVALID' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for inactive code', async () => {
      mockPrismaService.referralCode.findUnique.mockResolvedValue({
        id: 'code-1',
        userId: 'referrer-1',
        code: 'AZB-INACTIVE',
        isActive: false,
        maxUses: null,
        currentUses: 0,
        expiresAt: null,
      });

      await expect(
        service.applyReferralCode('user-1', { code: 'AZB-INACTIVE' })
      ).rejects.toThrow('Referral code is no longer active');
    });

    it('should throw BadRequestException for expired code', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockPrismaService.referralCode.findUnique.mockResolvedValue({
        id: 'code-1',
        userId: 'referrer-1',
        code: 'AZB-EXPIRED',
        isActive: true,
        maxUses: null,
        currentUses: 0,
        expiresAt: pastDate,
      });

      await expect(
        service.applyReferralCode('user-1', { code: 'AZB-EXPIRED' })
      ).rejects.toThrow('Referral code has expired');
    });

    it('should throw BadRequestException when max uses reached', async () => {
      mockPrismaService.referralCode.findUnique.mockResolvedValue({
        id: 'code-1',
        userId: 'referrer-1',
        code: 'AZB-FULL',
        isActive: true,
        maxUses: 5,
        currentUses: 5,
        expiresAt: null,
      });

      await expect(
        service.applyReferralCode('user-1', { code: 'AZB-FULL' })
      ).rejects.toThrow('Referral code has reached maximum uses');
    });

    it('should throw BadRequestException for self-referral', async () => {
      mockPrismaService.referralCode.findUnique.mockResolvedValue({
        id: 'code-1',
        userId: 'user-1',
        code: 'AZB-SELF',
        isActive: true,
        maxUses: null,
        currentUses: 0,
        expiresAt: null,
      });

      await expect(
        service.applyReferralCode('user-1', { code: 'AZB-SELF' })
      ).rejects.toThrow('Cannot use your own referral code');
    });

    it('should throw ConflictException when user already used a referral', async () => {
      mockPrismaService.referralCode.findUnique.mockResolvedValue({
        id: 'code-1',
        userId: 'referrer-1',
        code: 'AZB-USED',
        isActive: true,
        maxUses: null,
        currentUses: 0,
        expiresAt: null,
      });
      mockPrismaService.referral.findFirst.mockResolvedValue({
        id: 'existing-referral',
        referredId: 'user-1',
      });

      await expect(
        service.applyReferralCode('user-1', { code: 'AZB-USED' })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getStats', () => {
    it('should return referral stats', async () => {
      mockPrismaService.referral.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(3);
      mockPrismaService.referralReward.aggregate.mockResolvedValue({
        _sum: { amount: 350 },
      });
      mockPrismaService.referralCode.findFirst.mockResolvedValue({
        code: 'AZB-USER123',
      });

      const result = await service.getStats('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { stats: { totalReferrals: number; completedReferrals: number; pendingReferrals?: number; totalRewards: number } };
      expect(data.stats.totalReferrals).toBe(10);
      expect(data.stats.completedReferrals).toBe(7);
      expect(data.stats.pendingReferrals).toBe(3);
      expect(data.stats.totalRewards).toBe(350);
    });

    it('should return cached stats when available', async () => {
      const cachedResult = {
        success: true,
        data: { stats: { totalReferrals: 99 } },
      };
      mockCacheService.get.mockResolvedValueOnce(cachedResult);

      const result = await service.getStats('user-1');

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.referral.count).not.toHaveBeenCalled();
    });
  });

  describe('getReferrals', () => {
    it('should return paginated referrals', async () => {
      mockPrismaService.referral.findMany.mockResolvedValue([
        {
          id: 'ref-1',
          referrerId: 'user-1',
          referredId: 'new-user-1',
          status: 'completed',
          rewardAmount: 50,
          rewardStatus: 'credited',
          completedAt: new Date(),
          createdAt: new Date(),
        },
      ]);
      mockPrismaService.referral.count.mockResolvedValue(1);

      const result = await service.getReferrals('user-1', 1, 20);

      expect(result.success).toBe(true);
      const data = result.data as { referrals: unknown[]; pagination: { total: number } };
      expect(data.referrals).toHaveLength(1);
      expect(data.pagination.total).toBe(1);
    });
  });

  describe('completeReferral', () => {
    it('should complete a referral and create reward', async () => {
      mockPrismaService.referral.findUnique.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
        referredId: 'new-user-1',
        status: 'pending',
      });
      mockPrismaService.referralConfig.findUnique.mockResolvedValue({
        key: 'signup_reward',
        value: '75',
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          referral: {
            update: jest.fn().mockResolvedValue({}),
          },
          referralReward: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.completeReferral('ref-1', 'referrer-1');

      expect(result.success).toBe(true);
      const data = result.data as { rewardAmount: number };
      expect(data.rewardAmount).toBe(75);
    });

    it('should throw NotFoundException when referral does not exist', async () => {
      mockPrismaService.referral.findUnique.mockResolvedValue(null);

      const result = await service.completeReferral('nonexistent', 'user-1');

      expect(result.success).toBe(false);
    });

    it('should throw NotFoundException when not the referrer', async () => {
      mockPrismaService.referral.findUnique.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'other-user',
        referredId: 'new-user',
        status: 'pending',
      });

      const result = await service.completeReferral('ref-1', 'user-1');

      expect(result.success).toBe(false);
    });

    it('should throw BadRequestException for self-referral', async () => {
      mockPrismaService.referral.findUnique.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'user-1',
        referredId: 'user-1',
        status: 'pending',
      });

      const result = await service.completeReferral('ref-1', 'user-1');

      expect(result.success).toBe(false);
    });

    it('should throw BadRequestException when already completed', async () => {
      mockPrismaService.referral.findUnique.mockResolvedValue({
        id: 'ref-1',
        referrerId: 'referrer-1',
        referredId: 'new-user',
        status: 'completed',
      });

      const result = await service.completeReferral('ref-1', 'referrer-1');

      expect(result.success).toBe(false);
    });
  });
});
