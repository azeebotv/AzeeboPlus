import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { RewardsController } from './rewards.controller.js';
import { RewardsService } from './rewards.service.js';
import { FeatureFlagGuard, FeatureFlagService, rewardFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  ServiceAuthGuard: jest.fn(),
}));

import { RateLimitGuard, ServiceAuthGuard } from '@azeebo/security';

class MockServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
    return true;
  }
}
class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const mockRewardsService = {
  getRewardAccount: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getMissions: jest.fn().mockResolvedValue({ success: true, data: [] }),
  getBadges: jest.fn().mockResolvedValue({ success: true, data: [] }),
  getStreak: jest.fn().mockResolvedValue({ success: true, data: {} }),
  redeemReward: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getLevel: jest.fn().mockResolvedValue({ success: true, data: {} }),
  earnPoints: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getBalance: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getHistory: jest.fn().mockResolvedValue({ success: true, data: [] }),
};

/**
 * Kill-switch simulation: boots the rewards controller with the REAL
 * FeatureFlagGuard so @FeatureFlag(rewardFlags.*) actually gate the routes.
 * With reward_points_enabled off the whole surface 403s; with points on but
 * streaks/badges/missions off, those sub-routes 403 individually.
 */
describe('Rewards kill-switch (reward_* flags)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all reward flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RewardsController],
      providers: [
        { provide: RewardsService, useValue: mockRewardsService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(ServiceAuthGuard)
      .useClass(MockServiceAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);
  });

  it('403s GET /rewards when reward_points_enabled is off', async () => {
    await request(baseUrl)
      .get('/rewards')
      .set('Authorization', 'Bearer test')
      .expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(rewardFlags.pointsEnabled);
    expect(mockRewardsService.getRewardAccount).not.toHaveBeenCalled();
  });

  it('403s GET /rewards/missions when reward_missions is off', async () => {
    // points on, missions off
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === rewardFlags.pointsEnabled)
    );

    await request(baseUrl)
      .get('/rewards/missions')
      .set('Authorization', 'Bearer test')
      .expect(403);
    expect(mockRewardsService.getMissions).not.toHaveBeenCalled();
  });

  it('passes the base routes through when reward_points_enabled is on', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === rewardFlags.pointsEnabled)
    );

    const res = await request(baseUrl)
      .get('/rewards')
      .set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(mockRewardsService.getRewardAccount).toHaveBeenCalled();
  });
});
