import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PredictionMarketsModule } from './prediction-markets.module';
import { PredictionMarketsService } from './prediction-markets.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../common/services/redis.service';

describe('Prediction Markets Controller Contract Tests', () => {
  let app: INestApplication;
  let predictionMarketsService: PredictionMarketsService;

  beforeAll(async () => {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
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
    predictionMarketsService = moduleFixture.get(PredictionMarketsService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    // Clean up test environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_ACCESS_SECRET;
  });

  describe('GET /v1/predictions', () => {
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

      const response = await request(app.getHttpServer()).get('/v1/predictions');

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

  describe('GET /v1/predictions/:id', () => {
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

      const response = await request(app.getHttpServer()).get('/v1/predictions/market-1');

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
      });

      const response = await request(app.getHttpServer()).get('/v1/predictions/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'MARKET_NOT_FOUND',
        }),
      });
    });
  });

  describe('POST /v1/predictions/:id/predict', () => {
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
      });

      const response = await request(app.getHttpServer())
        .post('/v1/predictions/market-1/predict')
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

  describe('GET /v1/predictions/leaderboard', () => {
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

      const response = await request(app.getHttpServer()).get('/v1/predictions/leaderboard');

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

  describe('POST /v1/predictions/create', () => {
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
      });

      const response = await request(app.getHttpServer())
        .post('/v1/predictions/create')
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
