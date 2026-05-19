import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AnalyticsModule } from './analytics.module';
import { AnalyticsService } from './analytics.service';
import { JwtService } from '@nestjs/jwt';

describe('Analytics Controller Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AnalyticsModule],
    })
      .overrideProvider(AnalyticsService)
      .useValue({
        trackEvent: jest.fn(),
        trackBatch: jest.fn(),
        getUserSummary: jest.fn(),
        getDailyStats: jest.fn(),
        getContentAnalytics: jest.fn(),
        getCreatorAnalytics: jest.fn(),
        getUniverseAnalytics: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /analytics/track', () => {
    it('should track an event', async () => {
      const analyticsService = app.get(AnalyticsService);

      jest.spyOn(analyticsService, 'trackEvent').mockResolvedValue({ success: true });

      const response = await request(app.getHttpServer())
        .post('/analytics/track')
        .send({
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

  describe('POST /analytics/batch', () => {
    it('should track batch events', async () => {
      const analyticsService = app.get(AnalyticsService);

      jest.spyOn(analyticsService, 'trackBatch').mockResolvedValue({ success: true });

      const response = await request(app.getHttpServer())
        .post('/analytics/batch')
        .send([
          { type: 'content_view', userId: 'user-123', contentId: 'content-1' },
          { type: 'play_start', userId: 'user-123', contentId: 'content-1' },
        ]);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
      });
    });
  });

  describe('GET /analytics/user/:userId', () => {
    it('should get user analytics', async () => {
      const analyticsService = app.get(AnalyticsService);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'admin-1' });
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
        .get('/analytics/user/user-123')
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

  describe('GET /analytics/daily-stats', () => {
    it('should get daily stats', async () => {
      const analyticsService = app.get(AnalyticsService);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'admin-1' });
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
        .get('/analytics/daily-stats')
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