import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FanContestsModule } from './fan-contests.module';
import { FanContestsService } from './fan-contests.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../common/services/redis.service';

describe('Fan Contests Controller Contract Tests', () => {
  let app: INestApplication;
  let fanContestsService: FanContestsService;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';

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
      .overrideProvider(RedisService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
        exists: jest.fn().mockResolvedValue(0),
      })
      .overrideProvider(JwtService)
      .useValue({
        sign: jest.fn().mockReturnValue('access-token-123'),
        verify: jest.fn().mockReturnValue({ sub: 'user-123', role: 'admin' }),
      })
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

      const response = await request(app.getHttpServer()).get('/v1/contests');

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

  describe('GET /v1/contests/:id', () => {
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

      const response = await request(app.getHttpServer()).get('/v1/contests/contest-1');

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
      });

      const response = await request(app.getHttpServer()).get('/v1/contests/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'CONTEST_NOT_FOUND',
        }),
      });
    });
  });

  describe('POST /v1/contests/:id/enter', () => {
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
      });

      const response = await request(app.getHttpServer())
        .post('/v1/contests/contest-1/enter')
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

  describe('GET /v1/contests/:id/leaderboard', () => {
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

      const response = await request(app.getHttpServer()).get('/v1/contests/contest-1/leaderboard');

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

  describe('GET /v1/contests/:id/rank/:userId', () => {
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

      const response = await request(app.getHttpServer()).get('/v1/contests/contest-1/rank/user-123');

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