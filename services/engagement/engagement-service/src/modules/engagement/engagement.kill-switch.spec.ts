import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { EngagementController } from './engagement.controller.js';
import { EngagementService } from './engagement.service.js';
import { FeatureFlagGuard, FeatureFlagService, engagementFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  AdminGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));
jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

import { RateLimitGuard } from '@azeebo/security';

class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const mockEngagementService = {
  getLeaderboard: jest.fn().mockResolvedValue({ success: true, data: {} }),
  exportLeaderboard: jest.fn().mockResolvedValue({ success: true, data: {} }),
  deleteRanking: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getRankings: jest.fn().mockResolvedValue({ success: true, data: {} }),
  createOrUpdateRanking: jest.fn().mockResolvedValue({ success: true, data: {} }),
  batchUpdateRankings: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getRankingHistory: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getPredictionResults: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getPredictionHistory: jest.fn().mockResolvedValue({ success: true, data: {} }),
  submitPrediction: jest.fn().mockResolvedValue({ success: true, data: {} }),
  updatePrediction: jest.fn().mockResolvedValue({ success: true, data: {} }),
  deletePrediction: jest.fn().mockResolvedValue({ success: true, data: {} }),
  bulkSubmitPredictions: jest.fn().mockResolvedValue({ success: true, data: {} }),
  updateLeaderboard: jest.fn().mockResolvedValue({ success: true, data: {} }),
};

/**
 * Kill-switch simulation: boots the engagement controller with the REAL
 * FeatureFlagGuard so @FeatureFlag(engagementFlags.*) actually gate the routes.
 * With every flag off, leaderboard + rankings + predictions must 403 before the service runs.
 */
describe('Engagement kill-switch (engagement_* flags)', () => {
  let app: INestApplication;
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all engagement flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EngagementController],
      providers: [
        { provide: EngagementService, useValue: mockEngagementService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);
  });

  it('blocks GET /engagement/leaderboard with 403 when engagement_leaderboards is off', async () => {
    await request(app.getHttpServer()).get('/engagement/leaderboard').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(
      engagementFlags.leaderboards
    );
    expect(mockEngagementService.getLeaderboard).not.toHaveBeenCalled();
  });

  it('blocks GET /engagement/rankings with 403 when engagement_rankings is off', async () => {
    await request(app.getHttpServer()).get('/engagement/rankings').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(
      engagementFlags.rankings
    );
    expect(mockEngagementService.getRankings).not.toHaveBeenCalled();
  });

  it('blocks POST /engagement/predictions with 403 when engagement_predictions is off', async () => {
    await request(app.getHttpServer())
      .post('/engagement/predictions')
      .send({ contentId: 'content-1', prediction: 'home_win' })
      .expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(
      engagementFlags.predictions
    );
    expect(mockEngagementService.submitPrediction).not.toHaveBeenCalled();
  });
});
