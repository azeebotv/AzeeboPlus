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
  let baseUrl: string;
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
    // Bind IPv4 loopback EXPLICITLY: plain listen(0) binds `::` (IPv6 wildcard),
    // which can silently coexist with another process's 127.0.0.1 listener on the
    // same port — and the v4 socket then answers our requests, so a dev server's
    // guard (403) is served instead of this app's (isEnabled never called).
    await app.listen(0, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);
  });

  it('blocks GET /engagement/leaderboard with 403 when engagement_leaderboards is off', async () => {
    await request(baseUrl).get('/engagement/leaderboard').expect(403);
    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith(
      engagementFlags.leaderboards,
      undefined,
      undefined
    );
    expect(mockEngagementService.getLeaderboard).not.toHaveBeenCalled();
  });

  it('blocks GET /engagement/rankings with 403 when engagement_rankings is off', async () => {
    await request(baseUrl).get('/engagement/rankings').expect(403);
    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith(
      engagementFlags.rankings,
      undefined,
      undefined
    );
    expect(mockEngagementService.getRankings).not.toHaveBeenCalled();
  });

  it('blocks POST /engagement/predictions with 403 when engagement_predictions is off', async () => {
    await request(baseUrl)
      .post('/engagement/predictions')
      .send({ contentId: 'content-1', prediction: 'home_win' })
      .expect(403);
    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith(
      engagementFlags.predictions,
      undefined,
      undefined
    );
    expect(mockEngagementService.submitPrediction).not.toHaveBeenCalled();
  });
});
