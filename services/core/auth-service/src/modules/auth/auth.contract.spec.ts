import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { OtpService } from './otp/otp.service.js';
import { JwtService } from '@nestjs/jwt';
import { RedisService, CacheService } from '@azeebo/shared-services';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '@azeebo/security';
import { FeatureFlagGuard, FeatureFlagService } from '@azeebo/feature-flags';
import { AuditLogService } from '../audit/audit.service.js';
import * as bcrypt from 'bcrypt';

class MockRateLimitGuard {
  canActivate() {
    return true;
  }
}

describe('Auth Controller Contract Tests', () => {
  let app: INestApplication;
  let hashedPassword: string;

  const mockAuthRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countSessionsByUserId: jest.fn().mockResolvedValue(0),
    deleteOldestSessions: jest.fn().mockResolvedValue(0),
    createSession: jest.fn(),
    findSessionByUserId: jest.fn(),
    deleteSessionByUserId: jest.fn(),
    linkSocialAccount: jest.fn(),
    findBySocialId: jest.fn(),
    update: jest.fn(),
    verifyEmail: jest.fn(),
    updateRole: jest.fn(),
    setOtp: jest.fn(),
    getOtp: jest.fn(),
    deleteOtp: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
  };

  // Flag-aware mock: guards pass (true) but the email-verification signup branch
  // stays OFF so the default contract flows issue tokens.
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockImplementation((key: string) =>
      Promise.resolve(key !== 'auth_email_verification_required')
    ),
  };

  beforeAll(async () => {
    hashedPassword = bcrypt.hashSync('password123', 10);

    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-token-secret';
    process.env.JWT_EXPIRES_IN = '60s';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
    process.env.JWT_AUDIENCE = 'test-audience';
    process.env.JWT_ISSUER = 'test-issuer';
    (process.env as Record<string, string>).NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: AuditLogService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: RedisService, useValue: mockRedisService },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), delete: jest.fn() } },
        {
          provide: OtpService,
          useValue: { generateOtp: jest.fn(), verifyOtp: jest.fn(), sendOtpToUser: jest.fn() },
        },
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                JWT_ACCESS_SECRET: 'test-jwt-secret',
                JWT_REFRESH_SECRET: 'test-refresh-token-secret',
                JWT_EXPIRES_IN: '60s',
                JWT_AUDIENCE: 'test-audience',
                JWT_ISSUER: 'test-issuer',
                REFRESH_TOKEN_EXPIRY_DAYS: 7,
                SALT_ROUNDS: 10,
              };
              return config[key] ?? defaultValue;
            }),
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, unknown> = {
                JWT_ACCESS_SECRET: 'test-jwt-secret',
                JWT_REFRESH_SECRET: 'test-refresh-token-secret',
                JWT_AUDIENCE: 'test-audience',
                JWT_ISSUER: 'test-issuer',
              };
              if (config[key] === undefined) throw new Error(`Missing config: ${key}`);
              return config[key];
            }),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: mockFeatureFlagService,
        },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(FeatureFlagGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    // Mock ServiceAuthGuard behavior: set req.user only when Authorization header present
    app.use(
      (
        req: { headers: { authorization?: string }; user?: unknown },
        _res: unknown,
        next: () => void
      ) => {
        if (
          req.headers.authorization &&
          req.headers.authorization.startsWith('Bearer ') &&
          !req.user
        ) {
          req.user = { id: 'user-123', sub: 'user-123', email: 'test@example.com', role: 'user' };
        }
        next();
      }
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/signup', () => {
    it('should return valid success response with user and tokens', async () => {
      const jwtService = app.get(JwtService);

      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        displayName: 'Test User',
        role: 'user',
        avatar: null,
        isVerified: false,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockAuthRepository.createSession.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(jwtService, 'sign').mockImplementation((payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return `token-${(payload as any).sub}`;
      });

      const response = await request(app.getHttpServer()).post('/auth/signup').send({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
    });

    it('should require email verification and issue no tokens when the flag is on', async () => {
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed',
        displayName: 'Test User',
        role: 'user',
        avatar: null,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
        Promise.resolve(key === 'auth_email_verification_required')
      );

      try {
        const response = await request(app.getHttpServer()).post('/auth/signup').send({
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User',
        });

        expect(response.status).toBe(201);
        expect(response.body.data.requiresEmailVerification).toBe(true);
        expect(response.body.data).not.toHaveProperty('access_token');
        expect(response.body.data).not.toHaveProperty('refresh_token');
      } finally {
        mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
          Promise.resolve(key !== 'auth_email_verification_required')
        );
      }
    });
  });

  describe('POST /auth/login', () => {
    it('should return success response with user and tokens', async () => {
      const jwtService = app.get(JwtService);

      mockAuthRepository.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        displayName: 'Test User',
        role: 'user',
        avatar: null,
        isVerified: false,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockAuthRepository.createSession.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(jwtService, 'sign').mockImplementation((payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return `token-${(payload as any).sub}`;
      });

      const response = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email and auto-login with fresh tokens', async () => {
      const jwtService = app.get(JwtService);

      mockRedisService.get.mockResolvedValue('user-123');
      mockRedisService.del.mockResolvedValue(1);
      mockRedisService.incr.mockResolvedValue(1);
      mockAuthRepository.findById.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        displayName: 'Test User',
        role: 'user',
        avatar: null,
        isVerified: false,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockAuthRepository.verifyEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        displayName: 'Test User',
        role: 'user',
        avatar: null,
        isVerified: true,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockAuthRepository.createSession.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(jwtService, 'sign').mockImplementation((payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return `token-${(payload as any).sub}`;
      });

      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: 'valid-verification-token' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('verified');
      // Post-verification auto-login: tokens are issued directly.
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data).toHaveProperty('user');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new access token', async () => {
      const jwtService = app.get(JwtService);
      const hashedRefreshToken = bcrypt.hashSync('valid-refresh-token', 10);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(jwtService, 'verify').mockImplementation((_token: string, _options?: any) => {
        return { sub: 'user-123' };
      });
      mockAuthRepository.findById.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        displayName: 'Test User',
        role: 'user',
        avatar: null,
        isVerified: false,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockAuthRepository.findSessionByUserId.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        refreshToken: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-access-token');

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('access_token');
    });

    it('should return error for invalid refresh token', async () => {
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    it('should return success response', async () => {
      mockAuthRepository.deleteSessionByUserId.mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user', async () => {
      mockAuthRepository.findById.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        displayName: 'Test User',
        role: 'user',
        avatar: null,
        isVerified: false,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
        }),
      });
    });

    it('should return error for missing authorization', async () => {
      // Without Authorization header, middleware won't set req.user
      // The service should handle missing user gracefully
      const response = await request(app.getHttpServer()).get('/auth/me');

      // Without the global ServiceAuthGuard, unauthenticated requests
      // may return 500 (no user) or be handled by the service
      expect([401, 500]).toContain(response.status);
    });
  });
});
