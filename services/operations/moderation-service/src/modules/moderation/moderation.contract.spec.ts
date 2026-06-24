import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ModerationModule } from './moderation.module';

describe('Moderation Controller Contract Tests', () => {
  let app: INestApplication;

  const mockModerationService = {
    reportContent: jest.fn(),
    getReportTypes: jest.fn(),
    submitAppeal: jest.fn(),
    getQueue: jest.fn(),
    getTrustScore: jest.fn(),
    takeSafetyAction: jest.fn(),
    reviewReport: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ModerationModule],
    })
      .overrideProvider(ModerationModule)
      .useValue(mockModerationService)
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

  describe('/moderation/report (POST)', () => {
    it('should create a report', () => {
      mockModerationService.reportContent.mockResolvedValue({
        success: true,
        data: { reportId: 'report-1', status: 'pending' },
      });

      return request(app.getHttpServer())
        .post('/moderation/report')
        .set('Authorization', 'Bearer valid-token')
        .send({
          contentId: 'content-123',
          reason: 'inappropriate',
          description: 'This content violates community guidelines',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('reportId');
        });
    });

    it('should return 401 without authorization', () => {
      return request(app.getHttpServer())
        .post('/moderation/report')
        .send({ contentId: 'content-123', reason: 'spam' })
        .expect(401);
    });
  });

  describe('/moderation/report-types (GET)', () => {
    it('should return report types', () => {
      mockModerationService.getReportTypes.mockResolvedValue({
        success: true,
        data: [
          { id: 'spam', label: 'Spam' },
          { id: 'inappropriate', label: 'Inappropriate Content' },
          { id: 'harassment', label: 'Harassment' },
        ],
      });

      return request(app.getHttpServer())
        .get('/moderation/report-types')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/moderation/appeal (POST)', () => {
    it('should submit an appeal', () => {
      mockModerationService.submitAppeal.mockResolvedValue({
        success: true,
        data: { appealId: 'appeal-1', status: 'pending' },
      });

      return request(app.getHttpServer())
        .post('/moderation/appeal')
        .set('Authorization', 'Bearer valid-token')
        .send({
          reportId: 'report-1',
          reason: 'I believe this content was wrongly flagged',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/moderation/queue (GET)', () => {
    it('should return moderation queue', () => {
      mockModerationService.getQueue.mockResolvedValue({
        success: true,
        data: {
          items: [{ id: 'report-1', content: 'Sample content' }],
          page: 1,
          limit: 20,
          total: 1,
        },
      });

      return request(app.getHttpServer())
        .get('/moderation/queue')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/moderation/trust-score/:userId (GET)', () => {
    it('should return user trust score', () => {
      mockModerationService.getTrustScore.mockResolvedValue({
        success: true,
        data: { userId: 'user-123', trustScore: 85 },
      });

      return request(app.getHttpServer())
        .get('/moderation/trust-score/user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('trustScore');
        });
    });
  });

  describe('/moderation/safety-action (POST)', () => {
    it('should take safety action', () => {
      mockModerationService.takeSafetyAction.mockResolvedValue({
        success: true,
        data: { actionId: 'action-1', type: 'warning' },
      });

      return request(app.getHttpServer())
        .post('/moderation/safety-action')
        .set('Authorization', 'Bearer valid-token')
        .send({
          type: 'warning',
          targetId: 'user-456',
          targetType: 'user',
          reason: 'Repeated violations',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('request/response schemas', () => {
    it('should return consistent success response format', () => {
      mockModerationService.getReportTypes.mockResolvedValue({
        success: true,
        data: [],
      });

      return request(app.getHttpServer())
        .get('/moderation/report-types')
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('pagination metadata', () => {
    it('should include pagination in queue response', () => {
      mockModerationService.getQueue.mockResolvedValue({
        success: true,
        data: { items: [], page: 1, limit: 20, total: 0 },
      });

      return request(app.getHttpServer())
        .get('/moderation/queue')
        .set('Authorization', 'Bearer valid-token')
        .expect((res) => {
          expect(res.body.data).toHaveProperty('page');
          expect(res.body.data).toHaveProperty('limit');
          expect(res.body.data).toHaveProperty('total');
        });
    });
  });

  describe('error responses', () => {
    it('should return 401 for protected endpoints without token', () => {
      return request(app.getHttpServer())
        .post('/moderation/report')
        .send({ contentId: 'content-123', reason: 'spam' })
        .expect(401);
    });

    it('should return 404 for non-existent trust score', () => {
      mockModerationService.getTrustScore.mockRejectedValue(new Error('User not found'));

      return request(app.getHttpServer())
        .get('/moderation/trust-score/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });
});
