jest.mock('libphonenumber-js/max', () => ({}));
jest.mock('@nestjs/swagger', () => ({
  ApiTags: () => () => {},
  ApiOperation: () => () => {},
  ApiResponse: () => () => {},
  ApiBearerAuth: () => () => {},
  ApiProperty: () => () => {},
  ApiPropertyOptional: () => () => {},
  PartialType: (t: unknown) => t,
}));
jest.mock('socket.io', () => ({}));
jest.mock('@nestjs/websockets', () => ({
  WebSocketGateway: () => () => {},
  WebSocketServer: () => () => {},
  SubscribeMessage: () => () => {},
  ConnectedSocket: () => () => {},
  MessageBody: () => () => {},
}));
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { RealityModule } from './reality.module.js';
import { RealityService } from './reality.service.js';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from '@azeebo/shared-services';
import { PrismaService } from '../database/prisma.service.js';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';

jest.mock('@azeebo/shared-services', () => {
  const { Module } = require('@nestjs/common');
  @Module({})
  class MockRedisModule {}
  @Module({})
  class MockJwtConfigModule {}
  return {
    CacheService: jest.fn(),
    RedisModule: MockRedisModule,
    JwtConfigModule: MockJwtConfigModule,
    cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
  };
});
jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  AdminGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));

const mockAuthGuard = {
  canActivate: (context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'user-123', sub: 'user-123', role: 'user' };
    return true;
  },
};

describe('Reality Controller Contract Tests', () => {
  let app: INestApplication;
  let realityService: RealityService;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RealityModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        show: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        episode: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        season: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        contestant: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        vote: {
          findMany: jest.fn(),
          create: jest.fn(),
        },
        supervote: {
          findMany: jest.fn(),
          create: jest.fn(),
        },
        prediction: {
          findMany: jest.fn(),
          create: jest.fn(),
        },
        wallet: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
      })
      .overrideProvider(RealityService)
      .useValue({
        listShows: jest.fn(),
        getShow: jest.fn(),
        createShow: jest.fn(),
        updateShow: jest.fn(),
        deleteShow: jest.fn(),
        listEpisodes: jest.fn(),
        createEpisode: jest.fn(),
        updateEpisode: jest.fn(),
        deleteEpisode: jest.fn(),
        createSeason: jest.fn(),
        listContestants: jest.fn(),
        createContestant: jest.fn(),
        updateContestant: jest.fn(),
        deleteContestant: jest.fn(),
        getLeaderboard: jest.fn(),
        getShowAnalytics: jest.fn(),
        submitVote: jest.fn(),
        submitVotesWithQuantity: jest.fn(),
        submitSupervote: jest.fn(),
        submitPrediction: jest.fn(),
        getPredictionDashboard: jest.fn(),
        getClips: jest.fn(),
        getWalletBalance: jest.fn(),
        getPricing: jest.fn(),
        getPremiumExtras: jest.fn(),
        purchasePremiumExtra: jest.fn(),
        confirmReward: jest.fn(),
        getAdminDashboard: jest.fn(),
        detectVoteFraud: jest.fn(),
        detectSupervoteFraud: jest.fn(),
        detectPredictionFraud: jest.fn(),
        getOverallFraudAssessment: jest.fn(),
      })
      .overrideProvider(CacheService)
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
        verify: jest.fn().mockReturnValue({ sub: 'user-123', role: 'user' }),
      })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('test-value'),
        getOrThrow: jest.fn().mockReturnValue('test-value'),
      })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          if (!req.user) {
            req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
          }
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    realityService = moduleFixture.get(RealityService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /reality/shows', () => {
    it('should return valid success response with shows list', async () => {
      jest.spyOn(realityService, 'getShow').mockResolvedValue({
        success: true,
        data: {
          shows: [
            {
              id: 'show-1',
              title: 'Reality Show 1',
              description: 'Description',
              thumbnail: 'http://example.com/thumb.jpg',
              universeId: 'universe-1',
              status: 'active',
              createdAt: new Date(),
            },
          ],
        },
      });

      const response = await request(app.getHttpServer()).get('/reality/shows');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /reality/shows/:showId', () => {
    it('should return valid success response with show detail', async () => {
      jest.spyOn(realityService, 'getShow').mockResolvedValue({
        success: true,
        data: {
          id: 'show-1',
          title: 'Reality Show 1',
          description: 'Description',
          thumbnail: 'http://example.com/thumb.jpg',
          banner: 'http://example.com/banner.jpg',
          universeId: 'universe-1',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer()).get('/reality/shows/show-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'show-1',
          title: 'Reality Show 1',
        }),
      });
    });

    it('should return error for non-existent show', async () => {
      jest
        .spyOn(realityService, 'getShow')
        .mockRejectedValue(new (require('@nestjs/common').NotFoundException)('Show not found'));

      const response = await request(app.getHttpServer()).get('/reality/shows/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should return valid success response for vote submission', async () => {
      jest.spyOn(realityService, 'submitVote').mockResolvedValue({
        success: true,
        data: {
          voteId: 'vote-123',
          showId: 'show-1',
          contestantId: 'contestant-1',
          userId: 'user-123',
          quantity: 1,
          timestamp: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/reality/votes')
        .set('Authorization', 'Bearer valid-token')
        .send({
          showId: 'show-1',
          contestantId: 'contestant-1',
          quantity: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          voteId: expect.any(String),
          showId: 'show-1',
          contestantId: 'contestant-1',
        }),
      });
    });

    it('should require authorization for vote submission', async () => {
      jest.spyOn(realityService, 'submitVote').mockResolvedValue({
        success: true,
        data: {
          voteId: 'vote-123',
          showId: 'show-1',
          contestantId: 'contestant-1',
          userId: 'user-123',
          quantity: 1,
          timestamp: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/reality/votes')
        .set('Authorization', 'Bearer valid-token')
        .send({
          showId: 'show-1',
          contestantId: 'contestant-1',
          quantity: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /reality/predictions', () => {
    it('should return valid success response for prediction submission', async () => {
      jest.spyOn(realityService, 'submitPrediction').mockResolvedValue({
        success: true,
        data: {
          predictionId: 'prediction-123',
          showId: 'show-1',
          userId: 'user-123',
          contestantId: 'contestant-1',
          amount: 100,
          timestamp: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/reality/predictions')
        .set('Authorization', 'Bearer valid-token')
        .send({
          showId: 'show-1',
          contestantId: 'contestant-1',
          amount: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          predictionId: expect.any(String),
          showId: 'show-1',
          amount: 100,
        }),
      });
    });
  });

  describe('GET /reality/shows/:showId/leaderboard', () => {
    it('should return valid success response with leaderboard', async () => {
      jest.spyOn(realityService, 'getLeaderboard').mockResolvedValue({
        success: true,
        data: {
          showId: 'show-1',
          leaderboard: [
            { contestantId: 'contestant-1', name: 'Contestant 1', votes: 1000 },
            { contestantId: 'contestant-2', name: 'Contestant 2', votes: 800 },
          ],
          updatedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer()).get(
        '/reality/shows/show-1/leaderboard'
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          showId: 'show-1',
          leaderboard: expect.arrayContaining([
            expect.objectContaining({
              contestantId: expect.any(String),
              name: expect.any(String),
              votes: expect.any(Number),
            }),
          ]),
        }),
      });
    });
  });

  describe('GET /reality/pricing', () => {
    it('should return valid success response with pricing info', async () => {
      jest.spyOn(realityService, 'getPricing').mockResolvedValue({
        success: true,
        data: {
          votePrice: 10,
          supervotePrice: 100,
          currency: 'NGN',
        },
      });

      const response = await request(app.getHttpServer()).get('/reality/pricing');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          votePrice: expect.any(Number),
          supervotePrice: expect.any(Number),
          currency: expect.any(String),
        }),
      });
    });
  });
});
