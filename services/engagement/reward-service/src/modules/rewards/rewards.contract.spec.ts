jest.mock('@azeebo/shared-services', () => {
  const NestCommon = require('@nestjs/common');
  class MockJwtConfigModule {}
  NestCommon.Module({})(MockJwtConfigModule);
  return {
    CacheService: 'CacheService',
    cacheKey: (...args: unknown[]) => args.join(':'),
    JwtConfigModule: MockJwtConfigModule,
  };
});
jest.mock('@azeebo/security', () => ({
  RateLimitGuard: class MockRateLimitGuard {
    canActivate(context: any) {
      const request = context.switchToHttp().getRequest();
      request.user = { sub: 'user-123', id: 'user-123', email: 'test@example.com', role: 'user' };
      return true;
    }
  },
  ServiceAuthGuard: class MockServiceAuthGuard {
    canActivate = jest.fn().mockReturnValue(true);
  },
  RateLimit: () => () => {},
}));
jest.mock('class-validator', () => ({
  IsString: () => () => {},
  IsNotEmpty: () => () => {},
  IsNumber: () => () => {},
  IsOptional: () => () => {},
  IsEnum: () => () => {},
  Min: () => () => {},
  ValidateNested: () => () => {},
  IsArray: () => () => {},
  IsBoolean: () => () => {},
}));
jest.mock('class-transformer', () => ({
  Type: () => () => {},
  plainToInstance: (_cls: unknown, obj: unknown) => obj,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { RewardsModule } from './rewards.module.js';
import { RewardsService } from './rewards.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthGuard } from '@nestjs/passport';

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'user-123', id: 'user-123', email: 'test@example.com', role: 'user' };
    return true;
  }
}

describe('Rewards Controller Contract Tests', () => {
  let app: INestApplication;

  const mockPrismaService = {
    rewardAccount: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    mission: { findMany: jest.fn() },
    missionCompletion: { findMany: jest.fn() },
    badge: { findMany: jest.fn() },
    reward: { findUnique: jest.fn() },
    rewardRedemption: { create: jest.fn() },
    level: { findFirst: jest.fn() },
    pointsLedger: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations as Promise<unknown>[])),
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RewardsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RewardsService)
      .useValue({
        getRewardAccount: jest.fn(),
        getMissions: jest.fn(),
        getBadges: jest.fn(),
        getStreak: jest.fn(),
        redeemReward: jest.fn(),
        getLevel: jest.fn(),
        addPoints: jest.fn(),
        checkIn: jest.fn(),
        earnPoints: jest.fn(),
        getBalance: jest.fn(),
        getHistory: jest.fn(),
      })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/rewards', () => {
    it('should get available rewards', async () => {
      const rewardsService = app.get(RewardsService);

      jest.spyOn(rewardsService, 'getMissions').mockResolvedValue({
        success: true,
        data: {
          missions: [
            {
              id: 'm1',
              title: 'Daily Login',
              description: null,
              points: 10,
              type: 'daily',
              isActive: true,
              isCompleted: false,
            },
            {
              id: 'm2',
              title: 'Watch Video',
              description: null,
              points: 5,
              type: 'daily',
              isActive: true,
              isCompleted: false,
            },
          ],
        },
      });

      const response = await request(app.getHttpServer()).get('/v1/rewards/missions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe('POST /v1/rewards/redeem', () => {
    it('should claim a reward', async () => {
      const rewardsService = app.get(RewardsService);

      jest.spyOn(rewardsService, 'redeemReward').mockResolvedValue({
        success: true,
        data: {
          message: 'Reward redeemed successfully',
          rewardAccount: {
            id: 'ra-1',
            userId: 'user-123',
            points: 400,
            levelId: 'level-1',
            streak: 5,
            lastLoginAt: new Date(),
            lastCheckInAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      });

      const response = await request(app.getHttpServer())
        .post('/v1/rewards/redeem')
        .set('Authorization', 'Bearer valid-token')
        .send({ rewardId: 'reward-1' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          message: 'Reward redeemed successfully',
        }),
      });
    });
  });

  describe('GET /v1/rewards/balance', () => {
    it('should get user reward balance', async () => {
      const rewardsService = app.get(RewardsService);

      jest.spyOn(rewardsService, 'getBalance').mockResolvedValue({
        success: true,
        data: {
          balance: 500,
          level: {
            id: 'level-2',
            name: 'Intermediate',
            rank: 2,
            minPoints: 200,
            icon: null,
            color: null,
          },
          userId: 'user-123',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/rewards/balance')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          balance: 500,
        }),
      });
    });
  });
});
