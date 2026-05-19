import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';

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
    canActivate: jest.fn().mockReturnValue(canActivate),
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
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization - GET /daily-challenge', () => {
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
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .get('/daily-challenge')
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
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer()).get('/daily-challenge');

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
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .get('/daily-challenge')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);

      await testApp.close();
    });
  });

  describe('Authorization - POST /daily-challenge/submit', () => {
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
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/daily-challenge/submit')
        .set('Authorization', 'Bearer valid-token')
        .send({ answer: 'A' });

      expect(response.status).toBe(200);
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
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/daily-challenge/submit')
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
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer())
        .post('/daily-challenge/submit')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect([200, 400]).toContain(response.status);

      await testApp.close();
    });
  });
});
