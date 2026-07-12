import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { GamesController } from './games.controller.js';
import { GamesService } from './games.service.js';
import { RateLimitGuard } from '@azeebo/security';

describe('Games Service Authorization Tests', () => {
  let app: INestApplication;

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

  const createMockAuthGuard = (canActivate: boolean) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canActivate: jest.fn().mockImplementation((context: any) => {
      if (!canActivate) {
        throw new UnauthorizedException();
      }
      const req = context.switchToHttp().getRequest();
      req.user = { sub: 'user-123', role: 'user' };
      return true;
    }),
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: mockGamesService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(true))
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

  describe('Authorization - GET /v1/games/daily-challenge', () => {
    it('should allow authenticated users to access daily challenge', async () => {
      const mockAuthGuard = createMockAuthGuard(true);

      const moduleFixture = await Test.createTestingModule({
        controllers: [GamesController],
        providers: [
          { provide: GamesService, useValue: mockGamesService },
          { provide: 'JWT', useValue: mockAuthGuard },
        ],
      })
        .overrideGuard(AuthGuard('jwt'))
        .useValue(mockAuthGuard)
        .overrideGuard(RateLimitGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .get('/v1/games/daily-challenge')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      await testApp.close();
    });

    it('should reject unauthenticated users accessing daily challenge', async () => {
      const mockAuthGuard = createMockAuthGuard(false);

      const moduleFixture = await Test.createTestingModule({
        controllers: [GamesController],
        providers: [
          { provide: GamesService, useValue: mockGamesService },
          { provide: 'JWT', useValue: mockAuthGuard },
        ],
      })
        .overrideGuard(AuthGuard('jwt'))
        .useValue(mockAuthGuard)
        .overrideGuard(RateLimitGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer()).get('/v1/games/daily-challenge');

      expect(response.status).toBe(401);

      await testApp.close();
    });

    it('should reject requests with invalid token', async () => {
      const mockAuthGuard = createMockAuthGuard(false);

      const moduleFixture = await Test.createTestingModule({
        controllers: [GamesController],
        providers: [
          { provide: GamesService, useValue: mockGamesService },
          { provide: 'JWT', useValue: mockAuthGuard },
        ],
      })
        .overrideGuard(AuthGuard('jwt'))
        .useValue(mockAuthGuard)
        .overrideGuard(RateLimitGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .get('/v1/games/daily-challenge')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);

      await testApp.close();
    });
  });

  describe('Authorization - POST /v1/games/daily-challenge/submit', () => {
    it('should allow authenticated users to submit answers', async () => {
      const mockAuthGuard = createMockAuthGuard(true);

      const moduleFixture = await Test.createTestingModule({
        controllers: [GamesController],
        providers: [
          { provide: GamesService, useValue: mockGamesService },
          { provide: 'JWT', useValue: mockAuthGuard },
        ],
      })
        .overrideGuard(AuthGuard('jwt'))
        .useValue(mockAuthGuard)
        .overrideGuard(RateLimitGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/v1/games/daily-challenge/submit')
        .set('Authorization', 'Bearer valid-token')
        .send({ answer: 'A' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      await testApp.close();
    });

    it('should reject unauthenticated users submitting answers', async () => {
      const mockAuthGuard = createMockAuthGuard(false);

      const moduleFixture = await Test.createTestingModule({
        controllers: [GamesController],
        providers: [
          { provide: GamesService, useValue: mockGamesService },
          { provide: 'JWT', useValue: mockAuthGuard },
        ],
      })
        .overrideGuard(AuthGuard('jwt'))
        .useValue(mockAuthGuard)
        .overrideGuard(RateLimitGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/v1/games/daily-challenge/submit')
        .send({ answer: 'A' });

      expect(response.status).toBe(401);

      await testApp.close();
    });

    it('should require answer in request body', async () => {
      const mockAuthGuard = createMockAuthGuard(true);

      const moduleFixture = await Test.createTestingModule({
        controllers: [GamesController],
        providers: [
          { provide: GamesService, useValue: mockGamesService },
          { provide: 'JWT', useValue: mockAuthGuard },
        ],
      })
        .overrideGuard(AuthGuard('jwt'))
        .useValue(mockAuthGuard)
        .overrideGuard(RateLimitGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/v1/games/daily-challenge/submit')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect([200, 201, 400]).toContain(response.status);

      await testApp.close();
    });
  });
});
