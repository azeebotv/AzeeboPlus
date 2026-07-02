import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AnalyticsModule } from './analytics.module';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
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
  canActivate() {
    return true;
  }
}

describe('Analytics Controller Contract Tests', () => {
  let app: INestApplication;

  const mockPrismaService = {
    productEvent: { create: jest.fn(), count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn(), aggregate: jest.fn() },
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
      })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/analytics/events', () => {
    it('should track an event', async () => {
      const analyticsService = app.get(AnalyticsService);

      jest.spyOn(analyticsService, 'ingestEvents').mockResolvedValue({ success: true } as any);

      const response = await request(app.getHttpServer()).post('/v1/analytics/events').send({
        events: [{ type: 'content_view', userId: 'user-123', metadata: { session_id: 's1', platform: 'web', timestamp: '2026-01-01T00:00:00Z' } }],
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

      const response = await request(app.getHttpServer()).post('/v1/analytics/track').send({
        type: 'content_view',
        userId: 'user-123',
        contentId: 'content-1',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
      });
    });
  });

  describe('POST /v1/analytics/track-batch', () => {
    it('should track batch events', async () => {
      const analyticsService = app.get(AnalyticsService);

      jest.spyOn(analyticsService, 'trackBatch').mockResolvedValue({ success: true });

      const response = await request(app.getHttpServer())
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

      const response = await request(app.getHttpServer())
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

      const response = await request(app.getHttpServer())
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
