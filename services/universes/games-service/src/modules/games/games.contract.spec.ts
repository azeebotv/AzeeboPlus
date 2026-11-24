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
import { GamesModule } from './games.module.js';
import { GamesService } from './games.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '@azeebo/security';
import { AuthGuard } from '@nestjs/passport';

jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
  JwtConfigModule: jest.fn(),
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

const mockAuthGuard = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canActivate: (context: any) => {
    const req = context.switchToHttp().getRequest();
    if (!req.headers.authorization) {
      throw new UnauthorizedException();
    }
    req.user = { sub: 'user-123', role: 'user' };
    return true;
  },
};

describe('Games Controller Contract Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  const mockGamesService = {
    getHome: jest.fn(),
    submitDailyChallenge: jest.fn(),
    getDailyChallenge: jest.fn(),
    startSession: jest.fn(),
    submitAnswer: jest.fn(),
    getLeaderboard: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GamesModule],
      providers: [
        {
          provide: APP_GUARD,
          useFactory: () => ({
            canActivate: (context: ExecutionContext) => {
              const req = context.switchToHttp().getRequest();
              if (!req.headers.authorization) {
                throw new UnauthorizedException();
              }
              req.user = { sub: 'user-123', role: 'user' };
              return true;
            },
          }),
        },
      ],
    })
      .overrideProvider(GamesService)
      .useValue(mockGamesService)
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('test-value'),
        getOrThrow: jest.fn().mockReturnValue('test-value'),
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
    jest.clearAllMocks();
  });

  describe('/v1/games/home (GET)', () => {
    it('should return games home data', () => {
      mockGamesService.getHome.mockResolvedValue({
        success: true,
        data: { featured: [], trending: [] },
      });

      return request(baseUrl)
        .get('/v1/games/home')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });
  });

  describe('/v1/games/daily-challenge (GET)', () => {
    it('should return daily challenge', () => {
      mockGamesService.getDailyChallenge.mockResolvedValue({
        success: true,
        data: { id: 'challenge-1', question: 'What is 2+2?' },
      });

      return request(baseUrl)
        .get('/v1/games/daily-challenge')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should return 401 without authorization', () => {
      return request(baseUrl).get('/v1/games/daily-challenge').expect(401);
    });
  });

  describe('/v1/games/daily-challenge/submit (POST)', () => {
    it('should submit daily challenge answer', () => {
      mockGamesService.submitDailyChallenge.mockResolvedValue({
        success: true,
        data: { correct: true, points: 10 },
      });

      return request(baseUrl)
        .post('/v1/games/daily-challenge/submit')
        .set('Authorization', 'Bearer valid-token')
        .send({ answer: '4' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/games/sessions (POST)', () => {
    it('should start a game session', () => {
      mockGamesService.startSession.mockResolvedValue({
        success: true,
        data: { sessionId: 'session-1', status: 'active' },
      });

      return request(baseUrl)
        .post('/v1/games/sessions')
        .set('Authorization', 'Bearer valid-token')
        .send({ challengeId: 'challenge-1' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.sessionId).toBe('session-1');
        });
    });
  });

  describe('/v1/games/sessions/:sessionId/submit (POST)', () => {
    it('should submit answer for session', () => {
      mockGamesService.submitAnswer.mockResolvedValue({
        success: true,
        data: { correct: false, points: 0 },
      });

      return request(baseUrl)
        .post('/v1/games/sessions/session-1/submit')
        .set('Authorization', 'Bearer valid-token')
        .send({ answer: 'wrong-answer' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/games/leaderboard (GET)', () => {
    it('should return games leaderboard', () => {
      mockGamesService.getLeaderboard.mockResolvedValue({
        success: true,
        data: { rankings: [] },
      });

      return request(baseUrl)
        .get('/v1/games/leaderboard')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('request/response schemas', () => {
    it('should return consistent success response format', () => {
      mockGamesService.getHome.mockResolvedValue({
        success: true,
        data: {},
      });

      return request(baseUrl)
        .get('/v1/games/home')
        .set('Authorization', 'Bearer valid-token')
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('error responses', () => {
    it('should return 401 for protected endpoints without token', () => {
      return request(baseUrl)
        .post('/v1/games/sessions')
        .send({ challengeId: 'challenge-1' })
        .expect(401);
    });
  });
});
