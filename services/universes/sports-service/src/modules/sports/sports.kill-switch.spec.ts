import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { SportsController } from './sports.controller.js';
import { SportsService } from './sports.service.js';
import { FanContestsController } from '../fan-contests/fan-contests.controller.js';
import { FanContestsService } from '../fan-contests/fan-contests.service.js';
import { FeatureFlagGuard, FeatureFlagService, sportsFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  AdminGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));
jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
  RolesGuard: jest.fn(),
  Roles: () => () => {},
}));

import { RateLimitGuard } from '@azeebo/security';

class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const mockSportsService = {
  getHome: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getEvents: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getEventById: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getPredictions: jest.fn().mockResolvedValue({ success: true, data: {} }),
  submitPrediction: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getLeaderboard: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getContests: jest.fn().mockResolvedValue({ success: true, data: {} }),
  enterFanContest: jest.fn().mockResolvedValue({ success: true, data: {} }),
};

const mockFanContestsService = {
  getContests: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getContestById: jest.fn().mockResolvedValue({ success: true, data: {} }),
  enterContest: jest.fn().mockResolvedValue({ success: true, data: {} }),
  updateEntryScore: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getLeaderboard: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getUserRank: jest.fn().mockResolvedValue({ success: true, data: {} }),
  endContest: jest.fn().mockResolvedValue({ success: true, data: {} }),
};

/**
 * Kill-switch simulation: boots the sports controllers with the REAL
 * FeatureFlagGuard so @FeatureFlag(sportsFlags.*) actually gate the routes.
 * With every flag off, live scores + fan contests must 403 before the service runs.
 */
describe('Sports kill-switch (sports_* flags)', () => {
  let app: INestApplication;
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all sports flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SportsController, FanContestsController],
      providers: [
        { provide: SportsService, useValue: mockSportsService },
        { provide: FanContestsService, useValue: mockFanContestsService },
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

  it('blocks GET /sports/live/scores with 403 when sports_live_scores is off', async () => {
    await request(app.getHttpServer()).get('/sports/live/scores').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(
      sportsFlags.liveScores
    );
    expect(mockSportsService.getHome).not.toHaveBeenCalled();
  });

  it('serves GET /sports/live/scores when sports_live_scores is on', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    await request(app.getHttpServer()).get('/sports/live/scores').expect(200);
    expect(mockSportsService.getHome).toHaveBeenCalled();
  });

  it('blocks GET /sports/fan-contests with 403 when sports_fan_contests is off', async () => {
    await request(app.getHttpServer()).get('/sports/fan-contests').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(
      sportsFlags.fanContests
    );
    expect(mockFanContestsService.getContests).not.toHaveBeenCalled();
  });

  it('serves ungated catalog endpoints when the flags are off', async () => {
    await request(app.getHttpServer()).get('/sports/home').expect(200);
    expect(mockSportsService.getHome).toHaveBeenCalled();
  });
});
