import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthModule } from './auth.module';
import { RedisService } from '../../common/services/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

describe('AuthService - Refresh Token Rotation (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let redisService: RedisService;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
    quit: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-integration';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-for-integration';
    process.env.NODE_ENV = 'test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AuthModule,
      ],
    })
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
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
    redisService = moduleFixture.get<RedisService>(RedisService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Refresh Token Rotation Tests', () => {
    const testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      password: 'hashed-password',
      displayName: 'Test User',
      role: 'user',
      avatar: null,
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
          iss: 'azeebo-auth-service',
          aud: 'azeebo-api',
          jti: 'access-jti',
          sub: testUser.id,
          email: testUser.email,
          role: testUser.role,
          iat: now,
        },
        {
          expiresIn: '15m',
          secret: process.env.JWT_SECRET,
        }
      );

      const refreshToken = jwtService.sign(
        {
          iss: 'azeebo-auth-service',
          aud: 'azeebo-api',
          jti: 'refresh-jti',
          sub: testUser.id,
          type: 'refresh',
          iat: now,
        },
        {
          expiresIn: '7d',
          secret: process.env.REFRESH_TOKEN_SECRET,
        }
      );

      return { accessToken, refreshToken };
    };

    it('should rotate refresh tokens on successful refresh', async () => {
      const { accessToken, refreshToken } = generateTokens();

      mockJwtService.verify.mockReturnValue({ sub: testUser.id });
      mockRedisService.get.mockResolvedValue(null);

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
      const { accessToken, refreshToken } = generateTokens();

      mockJwtService.verify.mockReturnValue({ sub: testUser.id });
      mockRedisService.get.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      const secondRefreshResponse = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(secondRefreshResponse.body.success).toBe(false);
      expect(secondRefreshResponse.body.error.code).toBe('Unauthorized');
    });

    it('should reject expired refresh token', async () => {
      const expiredToken = jwtService.sign(
        {
          iss: 'azeebo-auth-service',
          sub: testUser.id,
          type: 'refresh',
        },
        {
          expiresIn: '-1s',
          secret: process.env.REFRESH_TOKEN_SECRET,
        }
      );

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject refresh token for non-existent user', async () => {
      const { refreshToken } = generateTokens();

      mockJwtService.verify.mockReturnValue({ sub: 'non-existent-user' });

      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle concurrent refresh token requests', async () => {
      const { refreshToken } = generateTokens();

      mockJwtService.verify.mockReturnValue({ sub: testUser.id });
      mockRedisService.get.mockResolvedValue(null);

      const promises = [
        request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken }),
        request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken }),
        request(app.getHttpServer()).post('/v1/auth/refresh').send({ refreshToken }),
      ];

      const results = await Promise.allSettled(promises);

      const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
      const rejectedCount = results.filter((r) => r.status === 'rejected').length;

      expect(fulfilledCount + rejectedCount).toBe(3);
      expect(rejectedCount).toBeGreaterThanOrEqual(2);
    });

    it('should successfully logout and invalidate tokens', async () => {
      const { accessToken, refreshToken } = generateTokens();

      mockJwtService.decode.mockReturnValue({
        jti: 'access-jti',
        exp: Math.floor(Date.now() / 1000) + 900,
      });

      const response = await request(app.getHttpServer())
        .delete('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should reject revoked access token', async () => {
      const { accessToken } = generateTokens();

      mockJwtService.verify.mockReturnValue({
        jti: 'revoked-jti',
        sub: testUser.id,
      });
      mockRedisService.get.mockResolvedValue('1');

      const response = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Login Flow Tests', () => {
    it('should successfully login with valid credentials', async () => {
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
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle account lockout after max failed attempts', async () => {
      const email = 'lockout@example.com';

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

      expect(response.body.error.message).toContain('locked');
    });
  });
});
