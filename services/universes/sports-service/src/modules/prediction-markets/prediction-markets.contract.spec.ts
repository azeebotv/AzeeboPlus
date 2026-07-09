import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { PredictionMarketsModule } from './prediction-markets.module';
import { PredictionMarketsService } from './prediction-markets.service';
import { PrismaService } from '../database/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';

const mockAuthGuard = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    if (!req.headers.authorization) {
      return false;
    }
    req.user = { sub: 'user-123', role: 'ADMIN' };
    return true;
  },
};

describe('Prediction Markets Controller Contract Tests', () => {
  let app: INestApplication;
  let predictionMarketsService: PredictionMarketsService;

  beforeAll(async () => {
    // Set test environment variables
    process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-for-testing-only';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PredictionMarketsModule],
    })
      .overrideProvider(PredictionMarketsService)
      .useValue({
        getPredictionMarkets: jest.fn(),
        getLeaderboard: jest.fn(),
        getUserPredictions: jest.fn(),
        getMarketById: jest.fn(),
        createPredictionMarket: jest.fn(),
        placePrediction: jest.fn(),
        settleMarket: jest.fn(),
      })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    predictionMarketsService = moduleFixture.get(PredictionMarketsService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    // Clean up test environment variables
    delete process.env.JWT_ACCESS_SECRET;
  });

  describe('GET /v1/sports/predictions', () => {
    it('should return valid success response with markets list', async () => {
      jest.spyOn(predictionMarketsService, 'getPredictionMarkets').mockResolvedValue({
        success: true,
        data: {
          markets: [
            {
              id: 'market-1',
              fixtureId: 'fixture-1',
              title: 'Match Prediction',
              options: ['Team A', 'Team B'],
              status: 'active',
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

      const response = await request(app.getHttpServer()).get('/v1/sports/predictions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          markets: expect.arrayContaining([
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

  describe('GET /v1/sports/predictions/:id', () => {
    it('should return valid success response with market detail', async () => {
      jest.spyOn(predictionMarketsService, 'getMarketById').mockResolvedValue({
        success: true,
        data: {
          id: 'market-1',
          fixtureId: 'fixture-1',
          title: 'Match Prediction',
          options: ['Team A', 'Team B'],
          odds: [1.5, 2.0],
          status: 'active',
          createdAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer()).get('/v1/sports/predictions/market-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'market-1',
          title: 'Match Prediction',
        }),
      });
    });

    it('should return error for non-existent market', async () => {
      jest.spyOn(predictionMarketsService, 'getMarketById').mockResolvedValue({
        success: false,
        error: {
          code: 'MARKET_NOT_FOUND',
          message: 'Market not found',
        },
      } as any);

      const response = await request(app.getHttpServer()).get('/v1/sports/predictions/nonexistent');

      expect([404, 200]).toContain(response.status);
      expect(response.body).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'MARKET_NOT_FOUND',
        }),
      });
    });
  });

  describe('POST /v1/sports/predictions/:id/predict', () => {
    it('should return valid success response for placing prediction', async () => {
      jest.spyOn(predictionMarketsService, 'placePrediction').mockResolvedValue({
        success: true,
        data: {
          predictionId: 'prediction-123',
          marketId: 'market-1',
          userId: 'user-123',
          selectedOption: 'Team A',
          stake: 100,
          timestamp: new Date(),
        },
      } as any);

      const response = await request(app.getHttpServer())
        .post('/v1/sports/predictions/market-1/predict')
        .send({
          userId: 'user-123',
          selectedOption: 'Team A',
          stake: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          predictionId: expect.any(String),
          marketId: 'market-1',
          stake: 100,
        }),
      });
    });
  });

  describe('GET /v1/sports/predictions/leaderboard', () => {
    it('should return valid success response with leaderboard', async () => {
      jest.spyOn(predictionMarketsService, 'getLeaderboard').mockResolvedValue({
        success: true,
        data: {
          leaderboard: [
            { userId: 'user-1', displayName: 'User 1', points: 1000, rank: 1 },
            { userId: 'user-2', displayName: 'User 2', points: 800, rank: 2 },
          ],
        },
      });

      const response = await request(app.getHttpServer()).get('/v1/sports/predictions/leaderboard');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          leaderboard: expect.arrayContaining([
            expect.objectContaining({
              userId: expect.any(String),
              displayName: expect.any(String),
              points: expect.any(Number),
              rank: expect.any(Number),
            }),
          ]),
        }),
      });
    });
  });

  describe('POST /v1/sports/predictions/create', () => {
    it('should return valid success response for creating market (admin)', async () => {
      jest.spyOn(predictionMarketsService, 'createPredictionMarket').mockResolvedValue({
        success: true,
        data: {
          id: 'market-1',
          fixtureId: 'fixture-1',
          title: 'New Market',
          options: ['Option A', 'Option B'],
          status: 'active',
          createdAt: new Date(),
        },
      } as any);

      const response = await request(app.getHttpServer())
        .post('/v1/sports/predictions/create')
        .set('Authorization', 'Bearer valid-token')
        .send({
          fixtureId: 'fixture-1',
          selectedOption: 'Option A',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          title: 'New Market',
        }),
      });
    });
  });
});
