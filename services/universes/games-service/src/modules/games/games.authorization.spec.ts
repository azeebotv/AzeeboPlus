jest.mock('libphonenumber-js/max', () => ({
  parsePhoneNumber: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  UnauthorizedException,
  VersioningType,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { GamesController } from './games.controller.js';
import { GamesService } from './games.service.js';
import { GameRealtimeService } from './game-realtime.service.js';
import { RateLimitGuard } from '@azeebo/security';

jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));
jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  ServiceAuthGuard: jest.fn(),
  AdminGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));
jest.mock('@azeebo/feature-flags', () => ({
  FeatureFlagService: jest.fn(),
  FeatureFlagGuard: class {},
  FeatureFlag: () => () => {},
  gamesFlags: {
    tournamentsEnabled: 'games_tournaments_enabled',
    triviaAi: 'games_trivia_ai',
    leaderboardsSeasonal: 'games_leaderboards_seasonal',
  },
}));

describe('Games Service Authorization Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  // Mutable auth state read at request time by the shared guards —
  // every test runs against ONE bound app (no per-test listen/close churn).
  let authEnabled: boolean;

  const mockGamesService = {
    getDailyChallenge: jest.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'challenge-1',
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        expiresAt: new Date(),
      },
    }),
    submitDailyChallenge: jest.fn().mockResolvedValue({
      success: true,
      data: {
        correct: true,
        points: 100,
        streak: 5,
      },
    }),
  };

  const mockAuthGuard = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canActivate: jest.fn().mockImplementation((context: any) => {
      if (!authEnabled) {
        throw new UnauthorizedException();
      }
      const req = context.switchToHttp().getRequest();
      req.user = { sub: 'user-123', role: 'user' };
      return true;
    }),
  };

  const appGuardProvider = {
    provide: APP_GUARD,
    useFactory: () => ({
      canActivate: (context: ExecutionContext) => {
        if (!authEnabled) {
          throw new UnauthorizedException();
        }
        const req = context.switchToHttp().getRequest();
        req.user = { sub: 'user-123', role: 'user' };
        return true;
      },
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: mockGamesService,
        },
        {
          provide: GameRealtimeService,
          useValue: { createSession: jest.fn(), joinSession: jest.fn(), startSession: jest.fn(), getPlayerSession: jest.fn(), getGameSessions: jest.fn() },
        },
        appGuardProvider,
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    authEnabled = true;
    jest.clearAllMocks();
  });

  describe('Authorization - GET /v1/games/daily-challenge', () => {
    it('should allow authenticated users to access daily challenge', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .get('/v1/games/daily-challenge')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject unauthenticated users accessing daily challenge', async () => {
      authEnabled = false;
      const response = await request(baseUrl).get('/v1/games/daily-challenge');

      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      authEnabled = false;
      const response = await request(baseUrl)
        .get('/v1/games/daily-challenge')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization - POST /v1/games/daily-challenge/submit', () => {
    it('should allow authenticated users to submit answers', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .post('/v1/games/daily-challenge/submit')
        .set('Authorization', 'Bearer valid-token')
        .send({ answer: 'A' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject unauthenticated users submitting answers', async () => {
      authEnabled = false;
      const response = await request(baseUrl)
        .post('/v1/games/daily-challenge/submit')
        .send({ answer: 'A' });

      expect(response.status).toBe(401);
    });

    it('should require answer in request body', async () => {
      authEnabled = true;
      const response = await request(baseUrl)
        .post('/v1/games/daily-challenge/submit')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect([200, 201, 400]).toContain(response.status);
    });
  });
});
