import { Test, TestingModule } from '@nestjs/testing';
import { ReferralService } from './referral.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { CacheService } from '@azeebo/shared-services';

jest.mock('axios');

describe('ReferralService', () => {
  let service: ReferralService;
  let prisma: {
    referral: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock; count: jest.Mock };
    referralConfig: { findFirst: jest.Mock };
    referralReward: { aggregate: jest.Mock };
    referralCode: { findFirst: jest.Mock; create: jest.Mock };
  };
  let cache: {
    get: jest.Mock;
    set: jest.Mock;
    delete: jest.Mock;
    deleteByPattern: jest.Mock;
    invalidate: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      referral: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), count: jest.fn() },
      referralConfig: { findFirst: jest.fn() },
      referralReward: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } }) },
      referralCode: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: '1',
          code: 'NEWCODE',
          userId: 'user-1',
          isActive: true,
          maxUses: null,
          currentUses: 0,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    };
    cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPattern: jest.fn(),
      invalidate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((_key: string, defaultValue: unknown) => defaultValue) },
        },
        {
          provide: FeatureFlagService,
          useValue: { isEnabled: jest.fn().mockResolvedValue(false) },
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
  });

  describe('getReferralCode', () => {
    it('should return existing referral code', async () => {
      prisma.referral.findFirst.mockResolvedValue({ id: '1', code: 'TEST123', userId: 'user-1' });
      const result = await service.getReferralCode('user-1');
      expect(result).toBeDefined();
    });

    it('should generate new code if none exists', async () => {
      prisma.referral.findFirst.mockResolvedValue(null);
      prisma.referral.create.mockResolvedValue({ id: '1', code: 'NEWCODE', userId: 'user-1' });
      const result = await service.generateReferralCode('user-1', {});
      expect(result).toBeDefined();
      expect(prisma.referralCode.create).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return referral stats', async () => {
      prisma.referral.count.mockResolvedValue(5);
      prisma.referral.findMany.mockResolvedValue([]);
      const result = await service.getStats('user-1');
      expect(result).toBeDefined();
    });
  });

  describe('getReferrals', () => {
    it('should return paginated referrals', async () => {
      prisma.referral.findMany.mockResolvedValue([]);
      prisma.referral.count.mockResolvedValue(0);
      const result = await service.getReferrals('user-1', 1);
      expect(result).toBeDefined();
    });
  });
});
