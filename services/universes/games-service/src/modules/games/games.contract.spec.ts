import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { GamesModule } from './games.module.js';
import { GamesService } from './games.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '@azeebo/security';
import { AuthGuard } from '@nestjs/passport';

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
    await app.init();
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

      return request(app.getHttpServer())
        .get('/v1/games/home')
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

      return request(app.getHttpServer())
        .get('/v1/games/daily-challenge')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should return 401 without authorization', () => {
      return request(app.getHttpServer()).get('/v1/games/daily-challenge').expect(401);
    });
  });

  describe('/v1/games/daily-challenge/submit (POST)', () => {
    it('should submit daily challenge answer', () => {
      mockGamesService.submitDailyChallenge.mockResolvedValue({
        success: true,
        data: { correct: true, points: 10 },
      });

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
        .get('/v1/games/leaderboard')
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

      return request(app.getHttpServer())
        .get('/v1/games/home')
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('error responses', () => {
    it('should return 401 for protected endpoints without token', () => {
      return request(app.getHttpServer())
        .post('/v1/games/sessions')
        .send({ challengeId: 'challenge-1' })
        .expect(401);
    });
  });
});
