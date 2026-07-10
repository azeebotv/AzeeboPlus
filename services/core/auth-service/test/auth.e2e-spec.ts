import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { RedisService } from '../src/common/services/redis.service';
import { PrismaService } from '../src/modules/database/prisma.service';

describe('Auth E2E', () => {
  let app: INestApplication;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
  };

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /v1/auth/signup ────────────────────────────────────────────

  describe('POST /v1/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const dto = {
        email: 'newuser@example.com',
        password: 'StrongP@ssw0rd!',
        displayName: 'New User',
      };

      mockAuthService.register.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: 'usr_abc123',
            email: 'newuser@example.com',
            displayName: 'New User',
            role: 'user',
          },
          access_token: 'eyJhbGciOiJIUzI1NiJ9.access',
          refresh_token: 'eyJhbGciOiJIUzI1NiJ9.refresh',
        },
      });

      const res = await request(app.getHttpServer())
        .post('/v1/auth/signup')
        .send(dto)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('newuser@example.com');
      expect(res.body.data.user.displayName).toBe('New User');
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });

    it('should return 409 when email is already registered', async () => {
      const dto = {
        email: 'taken@example.com',
        password: 'StrongP@ssw0rd!',
        displayName: 'Taken User',
      };

      mockAuthService.register.mockRejectedValue({
        status: 409,
        message: 'Email already registered',
      });

      const res = await request(app.getHttpServer())
        .post('/v1/auth/signup')
        .send(dto)
        .expect(409);

      expect(res.body.message).toBe('Email already registered');
    });

    it('should reject registration with invalid email format', async () => {
      const dto = {
        email: 'not-an-email',
        password: 'StrongP@ssw0rd!',
        displayName: 'Bad Email',
      };

      await request(app.getHttpServer())
        .post('/v1/auth/signup')
        .send(dto)
        .expect(400);

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should reject registration with weak password', async () => {
      const dto = {
        email: 'test@example.com',
        password: '123',
        displayName: 'Weak Pass',
      };

      await request(app.getHttpServer())
        .post('/v1/auth/signup')
        .send(dto)
        .expect(400);

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should reject registration with missing displayName', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd!',
      };

      await request(app.getHttpServer())
        .post('/v1/auth/signup')
        .send(dto)
        .expect(400);

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should reject registration with empty body', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/signup')
        .send({})
        .expect(400);

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });

  // ─── POST /v1/auth/login ─────────────────────────────────────────────

  describe('POST /v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const dto = {
        email: 'user@example.com',
        password: 'ValidP@ss1!',
      };

      mockAuthService.login.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: 'usr_xyz789',
            email: 'user@example.com',
            displayName: 'Existing User',
            role: 'user',
          },
          access_token: 'eyJhbGciOiJIUzI1NiJ9.access_token',
          refresh_token: 'eyJhbGciOiJIUzI1NiJ9.refresh_token',
        },
      });

      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send(dto)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('user@example.com');
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('should return 401 for invalid credentials', async () => {
      const dto = {
        email: 'user@example.com',
        password: 'WrongPassword1!',
      };

      mockAuthService.login.mockRejectedValue({
        status: 401,
        message: 'Invalid email or password',
      });

      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send(dto)
        .expect(401);

      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login with invalid email format', async () => {
      const dto = {
        email: 'bad-email',
        password: 'ValidP@ss1!',
      };

      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send(dto)
        .expect(400);

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should reject login with missing password', async () => {
      const dto = {
        email: 'user@example.com',
      };

      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send(dto)
        .expect(400);

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should reject login with empty body', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({})
        .expect(400);

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  // ─── POST /v1/auth/refresh ───────────────────────────────────────────

  describe('POST /v1/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const dto = {
        refreshToken: 'eyJhbGciOiJIUzI1NiJ9.valid.refresh.token',
      };

      mockAuthService.refreshToken.mockResolvedValue({
        success: true,
        data: {
          access_token: 'eyJhbGciOiJIUzI1NiJ9.new.access',
          refresh_token: 'eyJhbGciOiJIUzI1NiJ9.new.refresh',
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        },
      });

      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send(dto)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.access_token).toBeDefined();
      expect(res.body.data.refresh_token).toBeDefined();
      expect(res.body.data.expiresAt).toBeDefined();
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(dto);
    });

    it('should return 401 for invalid refresh token', async () => {
      const dto = {
        refreshToken: 'invalid.token.value',
      };

      mockAuthService.refreshToken.mockRejectedValue({
        status: 401,
        message: 'Invalid refresh token',
      });

      const res = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send(dto)
        .expect(401);

      expect(res.body.message).toBe('Invalid refresh token');
    });

    it('should reject refresh with missing refreshToken field', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it('should reject refresh with non-string refreshToken', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: 12345 })
        .expect(400);

      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });
  });
});
