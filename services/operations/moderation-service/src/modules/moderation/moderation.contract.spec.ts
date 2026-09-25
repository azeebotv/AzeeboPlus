jest.mock('class-validator', () => ({
  IsString: () => () => {},
  IsEnum: () => () => {},
  IsOptional: () => () => {},
  IsBoolean: () => () => {},
  IsObject: () => () => {},
  IsArray: () => () => {},
  ValidateNested: () => () => {},
  IsPhoneNumber: () => () => {},
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

jest.mock('@azeebo/security', () => {
  const Guard = class {
    canActivate(context: {
      switchToHttp: () => { getRequest: () => { user?: Record<string, string> } };
    }) {
      const request = context.switchToHttp().getRequest();
      request.user = request.user || { sub: 'user-123', id: 'user-123' };
      return true;
    }
  };
  return {
    RateLimitGuard: Guard,
    AdminGuard: Guard,
    RateLimit: () => (_target: object, _propertyKey?: string, descriptor?: PropertyDescriptor) =>
      descriptor,
  };
});

jest.mock('@azeebo/shared-services', () => ({
  CacheService: class {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn().mockResolvedValue(undefined);
    invalidate = jest.fn().mockResolvedValue(undefined);
  },
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { FeatureFlagGuard } from '@azeebo/feature-flags';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 'user-123', id: 'user-123' };
    return true;
  }
}

describe('Moderation Controller Contract Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

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
      controllers: [ModerationController],
      providers: [
        {
          provide: ModerationService,
          useValue: mockModerationService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(FeatureFlagGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
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

      return request(baseUrl)
        .post('/v1/moderation/report')
        .set('Authorization', 'Bearer valid-token')
        .send({
          type: 'inappropriate',
          reason: 'This content violates community guidelines',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('reportId');
        });
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

      return request(baseUrl)
        .get('/v1/moderation/report-types')
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

      return request(baseUrl)
        .post('/v1/moderation/appeal')
        .set('Authorization', 'Bearer valid-token')
        .send({
          caseId: 'case-1',
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

      return request(baseUrl)
        .get('/v1/moderation/queue')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/moderation/trust-score/:userId (GET)', () => {
    it('should return user trust score', () => {
      mockModerationService.getTrustScore.mockResolvedValue(85);

      return request(baseUrl)
        .get('/v1/moderation/trust-score/user-123')
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

      return request(baseUrl)
        .post('/v1/moderation/safety-action')
        .set('Authorization', 'Bearer valid-token')
        .send({
          type: 'warning',
          targetId: 'user-456',
          targetType: 'user',
          reason: 'Repeated violations',
        })
        .expect(201)
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

      return request(baseUrl)
        .get('/v1/moderation/report-types')
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('error responses', () => {
    it('should return 404 for non-existent trust score', () => {
      mockModerationService.getTrustScore.mockRejectedValue(new Error('User not found'));

      return request(baseUrl)
        .get('/v1/moderation/trust-score/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });
});
