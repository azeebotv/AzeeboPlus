jest.mock('@azeebo/shared-services', () => ({
  CacheService: class {},
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
  JwtConfigModule: class {},
}));

jest.mock('@azeebo/shared-types', () => ({
  CircuitBreaker: class {
    execute = jest.fn();
    getStats = jest.fn();
  },
  CircuitBreakerOpenError: class extends Error {},
  ApiVersioningConfig: {},
  API_VERSION_HEADER: 'x-api-version',
  DEFAULT_API_VERSION: '1',
  environmentSchema: {},
  validateEnvironment: jest.fn(),
}));

jest.mock('@azeebo/security', () => {
  const Guard = class {
    canActivate() {
      return true;
    }
  };
  return {
    AdminGuard: Guard,
    RateLimitGuard: Guard,
    RateLimit: () => () => {},
    Public: () => () => {},
  };
});

jest.mock('class-validator', () => ({
  IsArray: () => () => {},
  IsString: () => () => {},
  IsOptional: () => () => {},
  ValidateNested: () => () => {},
  IsObject: () => () => {},
  IsPhoneNumber: () => () => {},
  IsEnum: () => () => {},
  IsBoolean: () => () => {},
  IsNumber: () => () => {},
  MinLength: () => () => {},
  MaxLength: () => () => {},
  ArrayMinSize: () => () => {},
  IsIn: () => () => {},
  IsInt: () => () => {},
  Min: () => () => {},
  Max: () => () => {},
  IsDateString: () => () => {},
  IsUUID: () => () => {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AnalyticsModule } from './analytics.module.js';
import { AnalyticsService } from './analytics.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'admin-1', id: 'admin-1', email: 'admin@example.com', role: 'admin' };
    return true;
  }
}

class MockRateLimitGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'admin-1', id: 'admin-1', email: 'admin@example.com', role: 'admin' };
    return true;
  }
}

describe('Analytics Controller Contract Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  const mockPrismaService = {
    productEvent: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    analyticsEvent: { count: jest.fn(), groupBy: jest.fn() },
    user: { count: jest.fn() },
    contentItem: { count: jest.fn() },
    universe: { findUnique: jest.fn(), findMany: jest.fn() },
    paymentIntent: { count: jest.fn(), aggregate: jest.fn() },
    subscription: { count: jest.fn() },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations as Promise<unknown>[])),
    $queryRaw: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AnalyticsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(AnalyticsService)
      .useValue({
        trackEvent: jest.fn(),
        trackBatch: jest.fn(),
        ingestEvents: jest.fn(),
        getUserSummary: jest.fn(),
        getDailyStats: jest.fn(),
        getContentAnalytics: jest.fn(),
        getCreatorAnalytics: jest.fn(),
        getUniverseAnalytics: jest.fn(),
        getDashboard: jest.fn(),
        getFunnels: jest.fn(),
        getCohorts: jest.fn(),
        getAllUniverseKpis: jest.fn(),
        getUniverseKpis: jest.fn(),
        getRetentionMetrics: jest.fn(),
        getRevenueMetrics: jest.fn(),
        getEngagementMetrics: jest.fn(),
        getDetailedDashboard: jest.fn(),
        getKpis: jest.fn(),
        getRealtime: jest.fn(),
        getClientSamplingConfig: jest.fn().mockResolvedValue({ enabled: false, samplingRate: 100 }),
      })
      .overrideProvider(FeatureFlagService)
      .useValue({
        isEnabled: jest.fn().mockResolvedValue(false),
        getValue: jest.fn().mockResolvedValue(100),
      })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/analytics/events', () => {
    it('should track an event', async () => {
      const analyticsService = app.get(AnalyticsService);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(analyticsService, 'ingestEvents').mockResolvedValue({ success: true } as any);

      const response = await request(baseUrl)
        .post('/v1/analytics/events')
        .send({
          events: [
            {
              type: 'content_view',
              userId: 'user-123',
              metadata: { session_id: 's1', platform: 'web', timestamp: '2026-01-01T00:00:00Z' },
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
      });
    });
  });

  describe('POST /v1/analytics/track', () => {
    it('should track an event', async () => {
      const analyticsService = app.get(AnalyticsService);

      jest.spyOn(analyticsService, 'trackEvent').mockResolvedValue({ success: true });

      const response = await request(baseUrl).post('/v1/analytics/track').send({
        type: 'content_view',
        userId: 'user-123',
        contentId: 'content-1',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
      });
    });

    it('accepts the canonical EventPayload shape ({ eventName }) emitted by services', async () => {
      const analyticsService = app.get(AnalyticsService);
      const trackEvent = jest
        .spyOn(analyticsService, 'trackEvent')
        .mockResolvedValue({ success: true });

      const response = await request(baseUrl)
        .post('/v1/analytics/track')
        .send({
          eventName: 'content_view',
          userId: 'user-123',
          metadata: { contentId: 'content-1' },
          timestamp: new Date().toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      expect(trackEvent).toHaveBeenCalledWith(
        'content_view',
        'user-123',
        expect.objectContaining({ contentId: 'content-1' })
      );
    });

    it('rejects a payload with neither eventName nor type', async () => {
      const response = await request(baseUrl).post('/v1/analytics/track').send({ metadata: {} });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/analytics/track-batch', () => {
    it('should track batch events', async () => {
      const analyticsService = app.get(AnalyticsService);

      jest.spyOn(analyticsService, 'trackBatch').mockResolvedValue({ success: true });

      const response = await request(baseUrl)
        .post('/v1/analytics/track-batch')
        .send({
          events: [
            { type: 'content_view', userId: 'user-123', contentId: 'content-1' },
            { type: 'play_start', userId: 'user-123', contentId: 'content-1' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
      });
    });

    it('accepts the canonical EventPayload shape ({ eventName }) in batches', async () => {
      const analyticsService = app.get(AnalyticsService);
      const trackBatch = jest
        .spyOn(analyticsService, 'trackBatch')
        .mockResolvedValue({ success: true });

      const response = await request(baseUrl)
        .post('/v1/analytics/track-batch')
        .send({
          events: [
            { eventName: 'content_view', metadata: { contentId: 'content-1' } },
            { eventName: 'play_start', metadata: { contentId: 'content-1' } },
          ],
        });

      expect(response.status).toBe(200);
      expect(trackBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'content_view' }),
          expect.objectContaining({ type: 'play_start' }),
        ])
      );
    });
  });

  describe('GET /v1/analytics/me/summary', () => {
    it('should get user analytics', async () => {
      const analyticsService = app.get(AnalyticsService);

      jest.spyOn(analyticsService, 'getUserSummary').mockResolvedValue({
        success: true,
        data: {
          userId: 'user-123',
          totalViews: 100,
          totalWatchTime: 3600,
          contentCompleted: 10,
        },
      });

      const response = await request(baseUrl)
        .get('/v1/analytics/me/summary')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          totalViews: 100,
        }),
      });
    });
  });

  describe('GET /v1/analytics/daily-stats', () => {
    it('should get daily stats', async () => {
      const analyticsService = app.get(AnalyticsService);

      jest.spyOn(analyticsService, 'getDailyStats').mockResolvedValue({
        success: true,
        data: {
          date: new Date(),
          totalUsers: 1000,
          totalViews: 10000,
          totalWatchTime: 36000,
        },
      });

      const response = await request(baseUrl)
        .get('/v1/analytics/daily-stats')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          totalUsers: 1000,
        }),
      });
    });
  });
});
