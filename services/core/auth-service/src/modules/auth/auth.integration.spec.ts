import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from './auth.module.js';
import { RedisService } from '../../common/services/redis.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RateLimitGuard } from '@azeebo/security';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';

jest.mock('ioredis', () => {
  const mockRedisInstance = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockRedisInstance),
    Redis: jest.fn().mockImplementation(() => mockRedisInstance),
  };
});

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'user',
      avatar: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return true;
  }
}

class MockRateLimitGuard {
  canActivate() {
    return true;
  }
}

describe('AuthService - Refresh Token Rotation (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
    quit: jest.fn(),
  };

  const mockPrismaService = {
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
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    otp: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    socialAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret-for-integration';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-token-secret-for-integration';
    process.env.JWT_ISSUER = 'test-issuer';
    process.env.JWT_AUDIENCE = 'test-audience';
    (process.env as Record<string, string>).NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
    displayName: 'Test User',
    role: 'user',
    avatar: null,
    isVerified: false,
    mfaEnabled: false,
    mfaSecret: null,
    mfaBackupCodes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const generateTokens = () => {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = jwtService.sign(
      {
        iss: 'test-issuer',
        aud: 'test-audience',
        jti: 'access-jti',
        sub: testUser.id,
        email: testUser.email,
        role: testUser.role,
        iat: now,
      },
      {
        expiresIn: '15m',
        secret: process.env.JWT_ACCESS_SECRET,
      }
    );

    const refreshToken = jwtService.sign(
      {
        iss: 'test-issuer',
        aud: 'test-audience',
        jti: 'refresh-jti',
        sub: testUser.id,
        type: 'refresh',
        iat: now,
      },
      {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET,
      }
    );

    return { accessToken, refreshToken };
  };

  describe('Refresh Token Rotation Tests', () => {
    it('should rotate refresh tokens on successful refresh', async () => {
      const { refreshToken } = generateTokens();

      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      mockPrismaService.session.findFirst.mockResolvedValue({
        id: 'session-123',
        userId: testUser.id,
        refreshToken: bcrypt.hashSync(refreshToken, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.session.create.mockResolvedValue({
        id: 'new-session-123',
        userId: testUser.id,
        refreshToken: 'new-hashed-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
      expect(response.body.data.refresh_token).not.toBe(refreshToken);
    });

    it('should reject replay of old refresh token after rotation', async () => {
      const { refreshToken } = generateTokens();

      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      mockPrismaService.session.findFirst.mockResolvedValue({
        id: 'session-123',
        userId: testUser.id,
        refreshToken: bcrypt.hashSync(refreshToken, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.session.create.mockResolvedValue({
        id: 'new-session-123',
        userId: testUser.id,
        refreshToken: 'new-hashed-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      mockPrismaService.session.findFirst.mockResolvedValue(null);

      const secondRefreshResponse = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(secondRefreshResponse.body.statusCode).toBe(401);
    });

    it('should reject expired refresh token', async () => {
      const expiredToken = jwtService.sign(
        {
          iss: 'test-issuer',
          sub: testUser.id,
          type: 'refresh',
        },
        {
          expiresIn: '-1s',
          secret: process.env.JWT_REFRESH_SECRET,
        }
      );

      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should reject refresh token for non-existent user', async () => {
      const { refreshToken } = generateTokens();

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should handle concurrent refresh token requests', async () => {
      const { refreshToken } = generateTokens();

      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      mockPrismaService.session.findFirst.mockResolvedValue({
        id: 'session-123',
        userId: testUser.id,
        refreshToken: bcrypt.hashSync(refreshToken, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.session.create.mockResolvedValue({
        id: 'new-session-123',
        userId: testUser.id,
        refreshToken: 'new-hashed-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const promises = [
        request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken }),
        request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken }),
        request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken }),
      ];

      const results = await Promise.allSettled(promises);

      const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
      const rejectedCount = results.filter((r) => r.status === 'rejected').length;

      expect(fulfilledCount + rejectedCount).toBe(3);
      expect(fulfilledCount).toBeGreaterThanOrEqual(1);
    });

    it('should successfully logout and invalidate tokens', async () => {
      const { accessToken } = generateTokens();

      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should return user profile for valid token', async () => {
      const { accessToken } = generateTokens();

      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testUser.id);
    });
  });

  describe('Login Flow Tests', () => {
    it('should successfully login with valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(testUser);
      mockPrismaService.session.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.session.create.mockResolvedValue({
        id: 'session-123',
        userId: testUser.id,
        refreshToken: 'hashed-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should handle account lockout after max failed attempts', async () => {
      const email = 'lockout@example.com';
      const lockoutUser = {
        ...testUser,
        email,
        id: 'lockout-user-id',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(lockoutUser);

      let failCount = 0;
      mockRedisService.get.mockImplementation((key: string) => {
        if (key.startsWith('failed_login:')) {
          return failCount >= 5 ? String(failCount) : null;
        }
        return null;
      });
      mockRedisService.incr.mockImplementation((key: string) => {
        if (key.startsWith('failed_login:')) {
          failCount++;
          return failCount;
        }
        return 1;
      });

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/v1/auth/login')
          .send({
            email,
            password: 'wrongpassword',
          })
          .expect(401);
      }

      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email,
          password: 'password123',
        })
        .expect(401);

      expect(response.body.message).toContain('locked');
    });
  });
});
