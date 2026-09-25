import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { GamesController } from './games.controller.js';
import { GamesService } from './games.service.js';
import { GameRealtimeService } from './game-realtime.service.js';
import { FeatureFlagGuard, FeatureFlagService, gamesFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  ServiceAuthGuard: jest.fn(),
  AdminGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));
jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

import { ServiceAuthGuard, RateLimitGuard } from '@azeebo/security';

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

/**
 * Kill-switch simulation: boots the games controller with the REAL
 * FeatureFlagGuard so @FeatureFlag(gamesFlags.*) actually gate the routes.
 * With every flag off, trivia + leaderboard must 403 before the service runs.
 */
describe('GamesController kill-switch (games_* flags)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const mockGamesService = {
    getHome: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getTrending: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getTrivia: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getStats: jest.fn().mockResolvedValue({ success: true, data: {} }),
    submitDailyChallenge: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getDailyChallenge: jest.fn().mockResolvedValue({ success: true, data: {} }),
    startSession: jest.fn().mockResolvedValue({ success: true, data: {} }),
    submitAnswer: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getLeaderboard: jest.fn().mockResolvedValue({ success: true, data: {} }),
    listTournaments: jest.fn().mockResolvedValue({ success: true, data: {} }),
    enterTournament: jest.fn().mockResolvedValue({ success: true, data: {} }),
  };

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all games flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        { provide: GamesService, useValue: mockGamesService },
        {
          provide: GameRealtimeService,
          useValue: {
            createSession: jest.fn(),
            joinSession: jest.fn(),
            startSession: jest.fn(),
            getPlayerSession: jest.fn(),
            getGameSessions: jest.fn(),
          },
        },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(ServiceAuthGuard)
      .useClass(MockServiceAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
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

  it('blocks GET /games/trivia with 403 when games_trivia_ai is off', async () => {
    await request(baseUrl).get('/games/trivia').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(gamesFlags.triviaAi);
    expect(mockGamesService.getTrivia).not.toHaveBeenCalled();
  });

  it('blocks POST /games/sessions with 403 when games_trivia_ai is off', async () => {
    await request(baseUrl).post('/games/sessions').send({ gameId: 'trivia-1' }).expect(403);
    expect(mockGamesService.startSession).not.toHaveBeenCalled();
  });

  it('blocks GET /games/leaderboard with 403 when games_leaderboards_seasonal is off', async () => {
    await request(baseUrl).get('/games/leaderboard').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(gamesFlags.leaderboardsSeasonal);
    expect(mockGamesService.getLeaderboard).not.toHaveBeenCalled();
  });

  it('serves ungated catalog endpoints when the flags are off', async () => {
    await request(baseUrl).get('/games/home').expect(200);
    expect(mockGamesService.getHome).toHaveBeenCalled();
  });
});
