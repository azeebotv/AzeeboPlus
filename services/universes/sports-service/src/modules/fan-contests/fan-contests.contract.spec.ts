import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FanContestsModule } from './fan-contests.module.js';
import { FanContestsService } from './fan-contests.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { RateLimitGuard } from '@azeebo/security';

describe('Fan Contests Controller Contract Tests', () => {
  let app: INestApplication;
  let fanContestsService: FanContestsService;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FanContestsModule],
    })
      .overrideProvider(FanContestsService)
      .useValue({
        getContests: jest.fn(),
        getContestById: jest.fn(),
        enterContest: jest.fn(),
        updateEntryScore: jest.fn(),
        getLeaderboard: jest.fn(),
        getUserRank: jest.fn(),
        endContest: jest.fn(),
      })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    fanContestsService = moduleFixture.get(FanContestsService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/contests', () => {
    it('should return valid success response with contests list', async () => {
      jest.spyOn(fanContestsService, 'getContests').mockResolvedValue({
        success: true,
        data: {
          contests: [
            {
              id: 'contest-1',
              title: 'Football Contest',
              eventId: 'event-1',
              status: 'active',
              entryFee: 50,
              prizePool: 1000,
              createdAt: new Date(),
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
          },
        },
      });

      const response = await request(app.getHttpServer()).get('/v1/sports/fan-contests');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          contests: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
            }),
          ]),
          pagination: expect.objectContaining({
            page: expect.any(Number),
            limit: expect.any(Number),
          }),
        }),
      });
    });
  });

  describe('GET /v1/sports/fan-contests/:id', () => {
    it('should return valid success response with contest detail', async () => {
      jest.spyOn(fanContestsService, 'getContestById').mockResolvedValue({
        success: true,
        data: {
          id: 'contest-1',
          title: 'Football Contest',
          eventId: 'event-1',
          status: 'active',
          entryFee: 50,
          prizePool: 1000,
          participants: 10,
          createdAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer()).get('/v1/sports/fan-contests/contest-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'contest-1',
          title: 'Football Contest',
        }),
      });
    });

    it('should return error for non-existent contest', async () => {
      jest.spyOn(fanContestsService, 'getContestById').mockResolvedValue({
        success: false,
        error: {
          code: 'CONTEST_NOT_FOUND',
          message: 'Contest not found',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const response = await request(app.getHttpServer()).get(
        '/v1/sports/fan-contests/nonexistent'
      );

      expect([404, 200]).toContain(response.status);
      expect(response.body).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'CONTEST_NOT_FOUND',
        }),
      });
    });
  });

  describe('POST /v1/sports/fan-contests/:id/enter', () => {
    it('should return valid success response for entering contest', async () => {
      jest.spyOn(fanContestsService, 'enterContest').mockResolvedValue({
        success: true,
        data: {
          entryId: 'entry-123',
          contestId: 'contest-1',
          userId: 'user-123',
          status: 'active',
          enteredAt: new Date(),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const response = await request(app.getHttpServer())
        .post('/v1/sports/fan-contests/contest-1/enter')
        .send({
          userId: 'user-123',
          entryData: { team: 'Team A' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          entryId: expect.any(String),
          contestId: 'contest-1',
          userId: 'user-123',
        }),
      });
    });
  });

  describe('GET /v1/sports/fan-contests/:id/leaderboard', () => {
    it('should return valid success response with leaderboard', async () => {
      jest.spyOn(fanContestsService, 'getLeaderboard').mockResolvedValue({
        success: true,
        data: {
          contestId: 'contest-1',
          leaderboard: [
            { entryId: 'entry-1', userId: 'user-1', score: 95, rank: 1 },
            { entryId: 'entry-2', userId: 'user-2', score: 90, rank: 2 },
          ],
          pagination: {
            page: 1,
            limit: 50,
            total: 2,
          },
        },
      });

      const response = await request(app.getHttpServer()).get(
        '/v1/sports/fan-contests/contest-1/leaderboard'
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          contestId: 'contest-1',
          leaderboard: expect.arrayContaining([
            expect.objectContaining({
              userId: expect.any(String),
              score: expect.any(Number),
              rank: expect.any(Number),
            }),
          ]),
        }),
      });
    });
  });

  describe('GET /v1/sports/fan-contests/:id/rank/:userId', () => {
    it('should return valid success response with user rank', async () => {
      jest.spyOn(fanContestsService, 'getUserRank').mockResolvedValue({
        success: true,
        data: {
          contestId: 'contest-1',
          userId: 'user-123',
          rank: 5,
          score: 85,
          totalParticipants: 100,
        },
      });

      const response = await request(app.getHttpServer()).get(
        '/v1/sports/fan-contests/contest-1/rank/user-123'
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          contestId: 'contest-1',
          userId: 'user-123',
          rank: expect.any(Number),
          score: expect.any(Number),
        }),
      });
    });
  });
});
