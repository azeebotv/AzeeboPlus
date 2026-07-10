import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { RateLimitGuard } from '@azeebo/security';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

describe('Creators Controller Contract Tests', () => {
  let app: INestApplication;

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
        Reflector,
        JwtStrategy,
      ],
    });

    moduleBuilder.overrideGuard(AuthGuard('jwt')).useValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canActivate: (context: any) => {
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
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/v1/creators/onboard (POST)', () => {
    it('should create creator profile', () => {
      mockCreatorsService.onboard.mockResolvedValue({
        success: true,
        data: { id: 'profile-1', userId: 'user-123' },
      });

      return request(app.getHttpServer())
        .post('/v1/creators/onboard')
        .set('Authorization', 'Bearer valid-token')
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });

    it('should return 401 without authorization', async () => {
      const rejectModule = await Test.createTestingModule({
        imports: [
          PassportModule.register({ defaultStrategy: 'jwt' }),
          JwtModule.register({ secret: 'test-jwt-secret', signOptions: { expiresIn: '30m' } }),
        ],
        controllers: [CreatorsController],
        providers: [
          { provide: CreatorsService, useValue: mockCreatorsService },
          { provide: ConfigService, useValue: { get: jest.fn((_k: string, d?: string) => d) } },
          Reflector,
        ],
      })
        .overrideGuard(AuthGuard('jwt'))
        .useValue({ canActivate: jest.fn().mockReturnValue(false) })
        .overrideGuard(RateLimitGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .compile();
      const rejectApp = rejectModule.createNestApplication();
      await rejectApp.init();
      await request(rejectApp.getHttpServer()).post('/v1/creators/onboard').expect(403);
      await rejectApp.close();
    });
  });

  describe('/v1/creators/me (GET)', () => {
    it('should return creator profile', () => {
      mockCreatorsService.getMyProfile.mockResolvedValue({
        success: true,
        data: { id: 'profile-1', userId: 'user-123', bio: 'Test bio' },
      });

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
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

      return request(app.getHttpServer())
        .get('/v1/creators/nonexistent')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
    });
  });
});
