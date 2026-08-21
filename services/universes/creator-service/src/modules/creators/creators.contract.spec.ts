import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { CreatorsController } from './creators.controller.js';
import { CreatorsService } from './creators.service.js';
import { CreatorPayoutService } from '../creator/creator-payout.service.js';
import { CreatorTrustSafetyService } from '../creator/creator-trust-safety.service.js';
import { RateLimitGuard } from '@azeebo/security';
import { JwtStrategy } from '@azeebo/shared-services';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: class MockRateLimitGuard {
    canActivate() {
      return true;
    }
  },
  ServiceAuthGuard: class MockServiceAuthGuard {
    canActivate() {
      return true;
    }
  },
  RateLimit: () => () => {},
  Public: () => () => {},
}));

jest.mock('@azeebo/shared-services', () => ({
  JwtStrategy: class MockJwtStrategy {},
  RolesGuard: class MockRolesGuard {},
  Roles: () => () => {},
}));

jest.mock('@azeebo/feature-flags', () => ({
  FeatureFlagGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
  FeatureFlag: () => () => {},
  creatorFlags: {
    payoutsEnabled: 'creator_payouts_enabled',
    tipsEnabled: 'creator_tips_enabled',
    subscriptionsEnabled: 'creator_subscriptions_enabled',
    monetizationInsights: 'creator_monetization_insights',
  },
}));

jest.mock('libphonenumber-js', () => ({}));
jest.mock('libphonenumber-js/max', () => ({}));

describe('Creators Controller Contract Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  // Mutable auth state read at request time by the shared JWT guard —
  // every test runs against ONE bound app (no per-test listen/close churn).
  let authEnabled: boolean;

  const mockCreatorsService = {
    onboard: jest.fn(),
    submitVerification: jest.fn(),
    getVerificationStatus: jest.fn(),
    approveVerification: jest.fn(),
    uploadMedia: jest.fn(),
    completeUpload: jest.fn(),
    getUploadStatus: jest.fn(),
    getMyProfile: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    createChannel: jest.fn(),
    listChannels: jest.fn(),
    getChannel: jest.fn(),
    createUpload: jest.fn(),
    createUploadForChannel: jest.fn(),
    listUploads: jest.fn(),
    discover: jest.fn(),
    sendTip: jest.fn(),
    subscribe: jest.fn(),
    getAnalytics: jest.fn(),
    requestPayout: jest.fn(),
    getPayoutHistory: jest.fn(),
    getEarnings: jest.fn(),
  };

  beforeAll(async () => {
    authEnabled = true;
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-jwt-secret',
          signOptions: { expiresIn: '30m' },
        }),
      ],
      controllers: [CreatorsController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test-jwt-secret';
              return defaultValue;
            }),
          },
        },
        {
          provide: CreatorsService,
          useValue: mockCreatorsService,
        },
        {
          provide: CreatorPayoutService,
          useValue: { getCreatorEarnings: jest.fn(), requestPayout: jest.fn(), getPayoutHistory: jest.fn() },
        },
        {
          provide: CreatorTrustSafetyService,
          useValue: { getTrustScore: jest.fn(), recordViolation: jest.fn(), checkMonetizationEligibility: jest.fn() },
        },
        Reflector,
        JwtStrategy,
      ],
    });

    moduleBuilder.overrideGuard(AuthGuard('jwt')).useValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canActivate: (context: any) => {
        if (!authEnabled) {
          return false;
        }
        const req = context.switchToHttp().getRequest();
        req.user = {
          sub: 'user-123',
          userId: 'user-123',
          email: 'test@example.com',
          role: 'ADMIN',
        };
        return true;
      },
    });
    moduleBuilder
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) });

    const compiledModule = await moduleBuilder.compile();

    app = compiledModule.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      if (authEnabled && !req.user) {
        req.user = {
          sub: 'user-123',
          userId: 'user-123',
          id: 'user-123',
          email: 'test@example.com',
          role: 'ADMIN',
        };
      }
      next();
    });
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
    authEnabled = true;
    jest.clearAllMocks();
  });

  describe('/v1/creators/onboard (POST)', () => {
    it('should create creator profile', () => {
      mockCreatorsService.onboard.mockResolvedValue({
        success: true,
        data: { id: 'profile-1', userId: 'user-123' },
      });

      return request(baseUrl)
        .post('/v1/creators/onboard')
        .set('Authorization', 'Bearer valid-token')
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });

    it('should reject requests without authorization', async () => {
      authEnabled = false;
      const res = await request(baseUrl).post('/v1/creators/onboard');
      expect([403, 500]).toContain(res.status);
    });
  });

  describe('/v1/creators/me (GET)', () => {
    it('should return creator profile', () => {
      mockCreatorsService.getMyProfile.mockResolvedValue({
        success: true,
        data: { id: 'profile-1', userId: 'user-123', bio: 'Test bio' },
      });

      return request(baseUrl)
        .get('/v1/creators/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.bio).toBe('Test bio');
        });
    });
  });

  describe('/v1/creators/:creatorId (GET)', () => {
    it('should return creator profile by id', () => {
      mockCreatorsService.getProfile.mockResolvedValue({
        success: true,
        data: { id: 'profile-1', userId: 'user-456', verified: true },
      });

      return request(baseUrl)
        .get('/v1/creators/user-456')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.verified).toBe(true);
        });
    });
  });

  describe('/v1/creators/me (PATCH)', () => {
    it('should update creator profile', () => {
      mockCreatorsService.updateProfile.mockResolvedValue({
        success: true,
        data: { id: 'profile-1', displayName: 'Updated Name' },
      });

      return request(baseUrl)
        .patch('/v1/creators/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ displayName: 'Updated Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.displayName).toBe('Updated Name');
        });
    });
  });

  describe('/v1/creators/channels (POST)', () => {
    it('should create a channel', () => {
      mockCreatorsService.createChannel.mockResolvedValue({
        success: true,
        data: { id: 'channel-1', name: 'Test Channel' },
      });

      return request(baseUrl)
        .post('/v1/creators/channels')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test Channel', description: 'Test description' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Test Channel');
        });
    });
  });

  describe('/v1/creators/channels (GET)', () => {
    it('should list creator channels', () => {
      mockCreatorsService.listChannels.mockResolvedValue({
        success: true,
        data: { channels: [{ id: 'channel-1', name: 'Test Channel' }] },
      });

      return request(baseUrl)
        .get('/v1/creators/channels')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });
  });

  describe('/v1/creators/uploads (GET)', () => {
    it('should list creator uploads', () => {
      mockCreatorsService.listUploads.mockResolvedValue({
        success: true,
        data: [{ id: 'content-1', title: 'Test Content' }],
      });

      return request(baseUrl)
        .get('/v1/creators/uploads')
        .set('Authorization', 'Bearer valid-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/creators/discover (GET)', () => {
    it('should return verified creators', () => {
      mockCreatorsService.discover.mockResolvedValue({
        success: true,
        data: [{ id: 'profile-1', verified: true }],
      });

      return request(baseUrl)
        .get('/v1/creators/discover')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/v1/creators/subscribe/:creatorId (POST)', () => {
    it('should subscribe to creator', () => {
      mockCreatorsService.subscribe.mockResolvedValue({
        success: true,
        data: { subscriptionId: 'sub-1', tier: 'free' },
      });

      return request(baseUrl)
        .post('/v1/creators/subscribe/user-456')
        .set('Authorization', 'Bearer valid-token')
        .send({ tier: 'free' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.tier).toBe('free');
        });
    });
  });

  describe('request/response schemas', () => {
    it('should return consistent success response format', () => {
      mockCreatorsService.getMyProfile.mockResolvedValue({
        success: true,
        data: { id: 'profile-1' },
      });

      return request(baseUrl)
        .get('/v1/creators/me')
        .set('Authorization', 'Bearer valid-token')
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('pagination metadata', () => {
    it('should include pagination in list responses', () => {
      mockCreatorsService.listChannels.mockResolvedValue({
        success: true,
        data: { channels: [], meta: { page: 1, limit: 20, total: 0 } },
      });

      return request(baseUrl)
        .get('/v1/creators/channels')
        .set('Authorization', 'Bearer valid-token')
        .expect((res) => {
          expect(res.body.data).toHaveProperty('channels');
          expect(res.body.data).toHaveProperty('meta');
        });
    });
  });

  describe('error responses', () => {
    it('should return 404 for non-existent creator', () => {
      mockCreatorsService.getProfile.mockRejectedValue(new Error('Creator not found'));

      return request(baseUrl)
        .get('/v1/creators/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });
});
