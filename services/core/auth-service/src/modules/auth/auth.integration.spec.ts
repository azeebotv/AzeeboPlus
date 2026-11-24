import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from './auth.module.js';
import { RedisService } from '@azeebo/shared-services';
import { CacheService } from '@azeebo/shared-services';
import { PrismaService } from '../database/prisma.service.js';
import { JwtService, JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { RateLimitGuard } from '@azeebo/security';
import { FeatureFlagModule, FeatureFlagService } from '@azeebo/feature-flags';
import { AuthGuard } from '@nestjs/passport';
import { EventBusModule, EVENT_BUS_SERVICE } from '@azeebo/event-bus';
import * as bcrypt from 'bcrypt';

// Boots a real Nest app and runs bcrypt on every credential check, so the 5s
// default is too tight when the test machine is loaded (the same reason
// roles.guard.integration.spec.ts sets it).
jest.setTimeout(30000);

jest.mock('@azeebo/shared-services', () => {
  const { JwtModule } = require('@nestjs/jwt');

  const { ConfigModule, ConfigService } = require('@nestjs/config');

  const mockCacheServiceInstance = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    delete: jest.fn().mockResolvedValue(1),
    invalidate: jest.fn().mockResolvedValue(1),
  };

  const mockRedisServiceInstance = {
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

  const MockCacheService = jest.fn().mockImplementation(() => mockCacheServiceInstance);
  const MockRedisService = jest.fn().mockImplementation(() => mockRedisServiceInstance);

  const MockSlowQueryLogger = jest.fn().mockImplementation(() => ({
    logQuery: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({
      totalQueries: 0,
      slowQueries: 0,
      criticalQueries: 0,
      n1PatternsDetected: 0,
      avgQueryDurationMs: 0,
      p95QueryDurationMs: 0,
      p99QueryDurationMs: 0,
      queriesByModel: new Map(),
    }),
    resetMetrics: jest.fn(),
    getRecentN1Patterns: jest.fn().mockReturnValue([]),
  }));

  return {
    CacheService: MockCacheService,
    RedisService: MockRedisService,
    SlowQueryLogger: MockSlowQueryLogger,
    cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
    CacheModule: {
      module: class {},
      providers: [{ provide: MockCacheService, useValue: mockCacheServiceInstance }],
      exports: [MockCacheService],
      global: true,
    },
    RedisModule: {
      module: class {},
      providers: [{ provide: MockRedisService, useValue: mockRedisServiceInstance }],
      exports: [MockRedisService],
      global: true,
    },
    JwtConfigModule: {
      module: class {},
      imports: [
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: { get: (key: string, defaultValue?: string) => string }) => ({
            secret: configService.get('JWT_ACCESS_SECRET') ?? '',
            signOptions: {
              expiresIn: configService.get('JWT_EXPIRES_IN', '30m'),
            },
          }),
          inject: [ConfigService],
        }),
      ],
      exports: [JwtModule],
      global: true,
    },
  };
});

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
  let baseUrl: string;
  let jwtService: JwtService;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn().mockResolvedValue(300),
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
      count: jest.fn().mockResolvedValue(0),
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
        JwtModule.register({
          secret: 'test-jwt-secret-for-integration',
          signOptions: { expiresIn: '15m' },
        }),
        // Provides the FeatureFlagService token (AuthService injects it); the
        // overrideProvider below swaps in the mock so no Redis is contacted.
        FeatureFlagModule.register({ global: true, defaultFlags: {} }),
        // AuthModule declares ErasureConsumerService, which injects the event
        // bus. In the real app EventBusModule is registered @Global() by
        // AppModule, so that dependency resolves without AuthModule importing
        // it — but this TestingModule imports AuthModule on its own, so it has
        // to register the module here or DI fails before a single test runs.
        // `enableEnhanced: false` keeps it to one provider and touches no Redis;
        // the override below replaces that provider with a stub regardless.
        EventBusModule.forRoot({ redisUrl: 'redis://localhost:6379' }, 'auth-service-test', {
          enableEnhanced: false,
        }),
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(CacheService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(0),
      })
      .overrideProvider(EVENT_BUS_SERVICE)
      .useValue({
        // ErasureConsumerService.onModuleInit calls subscribe().catch(), so the
        // stub has to return a promise; a bare jest.fn() returns undefined and
        // would throw on `.catch`.
        subscribe: jest.fn().mockResolvedValue(undefined),
        unsubscribe: jest.fn().mockResolvedValue(undefined),
        publish: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(FeatureFlagService)
      .useValue({
        // Guards pass for every flag except the email-verification signup
        // branch, which stays OFF so the default flows issue tokens.
        isEnabled: jest
          .fn()
          .mockImplementation((key: string) =>
            Promise.resolve(key !== 'auth_email_verification_required')
          ),
      })
      .overrideProvider(JwtService)
      .useValue(
        new JwtService({
          secret: 'test-jwt-secret-for-integration',
          signOptions: { expiresIn: '15m' },
        })
      )
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
    // Mock ServiceAuthGuard behavior: set req.user for authenticated routes
    app.use(
      (
        req: { headers: { authorization?: string }; user?: unknown },
        _res: unknown,
        next: () => void
      ) => {
        if (req.headers.authorization && !req.user) {
          req.user = {
            id: testUser.id,
            sub: testUser.id,
            email: testUser.email,
            role: testUser.role,
          };
        }
        next();
      }
    );
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;

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

      const response = await request(baseUrl)
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

      await request(baseUrl).post('/v1/auth/refresh').send({ refreshToken }).expect(201);

      mockPrismaService.session.findFirst.mockResolvedValue(null);

      const secondRefreshResponse = await request(baseUrl)
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

      const response = await request(baseUrl)
        .post('/v1/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(baseUrl)
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });

    it('should reject refresh token for non-existent user', async () => {
      const { refreshToken } = generateTokens();

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(baseUrl)
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
        request(baseUrl).post('/v1/auth/refresh').send({ refreshToken }),
        request(baseUrl).post('/v1/auth/refresh').send({ refreshToken }),
        request(baseUrl).post('/v1/auth/refresh').send({ refreshToken }),
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

      const response = await request(baseUrl)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should return user profile for valid token', async () => {
      const { accessToken } = generateTokens();

      const response = await request(baseUrl)
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

      const response = await request(baseUrl)
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

      const response = await request(baseUrl)
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

      // Track state per key so incr/get/ttl work coherently
      const store = new Map<string, string>();
      mockRedisService.get.mockImplementation((key: string) => {
        return Promise.resolve(store.get(key) ?? null);
      });
      mockRedisService.set.mockImplementation((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve('OK');
      });
      mockRedisService.incr.mockImplementation((key: string) => {
        const current = parseInt(store.get(key) ?? '0', 10);
        const next = current + 1;
        store.set(key, String(next));
        return Promise.resolve(next);
      });
      mockRedisService.del.mockImplementation((key: string) => {
        store.delete(key);
        return Promise.resolve(1);
      });
      mockRedisService.ttl.mockImplementation((key: string) => {
        return store.has(key) ? Promise.resolve(300) : Promise.resolve(-2);
      });

      for (let i = 0; i < 5; i++) {
        await request(baseUrl)
          .post('/v1/auth/login')
          .send({
            email,
            password: 'wrongpassword',
          })
          .expect(401);
      }

      const response = await request(baseUrl)
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
