import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from './auth.module.js';
import { AuthRepository } from './auth.repository.js';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../common/services/redis.service.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { RateLimitGuard } from '@azeebo/security';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { User } from '@azeebo/shared-types';

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
      avatar: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    return true;
  }
}

class MockRateLimitGuard {
  canActivate() {
    return true;
  }
}

describe('Auth Controller Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-token-secret';
    process.env.JWT_EXPIRES_IN = '60s';
    process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
    process.env.JWT_AUDIENCE = 'test-audience';
    process.env.JWT_ISSUER = 'test-issuer';
    (process.env as Record<string, string>).NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        user: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        session: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      })
      .overrideProvider(AuthRepository)
      .useValue({
        findByEmail: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        createSession: jest.fn(),
        findSessionByUserId: jest.fn(),
        deleteSessionByUserId: jest.fn(),
        linkSocialAccount: jest.fn(),
        findBySocialId: jest.fn(),
        update: jest.fn(),
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
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/signup', () => {
    it('should return valid success response with user and tokens', async () => {
      const authRepository = app.get(AuthRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(authRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(authRepository, 'create').mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
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
      jest.spyOn(authRepository, 'createSession').mockResolvedValue({
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
  });

  describe('POST /auth/login', () => {
    it('should return success response with user and tokens', async () => {
      const authRepository = app.get(AuthRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(authRepository, 'findByEmail').mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
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
      jest.spyOn(authRepository, 'createSession').mockResolvedValue({
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

  describe('POST /auth/refresh', () => {
    it('should return new access token', async () => {
      const authRepository = app.get(AuthRepository);
      const jwtService = app.get(JwtService);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(jwtService, 'verify').mockImplementation((_token: string, _options?: any) => {
        return { sub: 'user-123' };
      });
      jest.spyOn(authRepository, 'findById').mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
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
      jest.spyOn(authRepository, 'findSessionByUserId').mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'hashed-refresh-token',
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
      const authRepository = app.get(AuthRepository);

      jest.spyOn(authRepository, 'deleteSessionByUserId').mockResolvedValue(1);

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
      const authRepository = app.get(AuthRepository);

      jest.spyOn(authRepository, 'findById').mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
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
          displayName: 'Test User',
        }),
      });
    });

    it('should return error for missing authorization', async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [ConfigModule.forRoot(), AuthModule],
      })
        .overrideProvider(PrismaService)
        .useValue({})
        .overrideProvider(AuthRepository)
        .useValue({})
        .overrideProvider(RedisService)
        .useValue({})
        .overrideGuard(RateLimitGuard)
        .useClass(MockRateLimitGuard)
        .compile();

      const testApp = moduleFixture.createNestApplication();
      await testApp.init();

      const response = await request(testApp.getHttpServer()).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBeDefined();

      await testApp.close();
    });
  });
});
