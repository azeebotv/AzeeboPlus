import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { UsersModule } from './users.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { RateLimitGuard } from '@azeebo/security';
import { AuthGuard } from '@nestjs/passport';

describe('Users Controller Contract Tests', () => {
  let app: INestApplication;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    userPreferences: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    following: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    watchHistory: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    savedItem: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      if (request.headers.authorization) {
        request.user = { sub: 'user-123' };
        return true;
      }
      throw new UnauthorizedException();
    },
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(JwtService)
      .useValue({
        verify: jest.fn(),
        sign: jest.fn(),
      })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
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

  describe('GET /v1/users/me', () => {
    it('should return current user profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatar: null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me')
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
      const response = await request(app.getHttpServer()).get('/v1/users/me');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/users/me', () => {
    it('should update user profile', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      });

      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Updated Name',
        avatar: null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .patch('/v1/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({
          displayName: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          displayName: 'Updated Name',
        }),
      });
    });
  });

  describe('GET /v1/users/me/preferences', () => {
    it('should return user preferences', async () => {
      mockPrismaService.userPreferences.findUnique.mockResolvedValue({
        userId: 'user-123',
        darkMode: true,
        notifications: { email: true, push: false },
        contentPreferences: ['sports', 'comedy'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/preferences')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        darkMode: true,
        notifications: { email: true, push: false },
        contentPreferences: ['sports', 'comedy'],
      });
    });
  });

  describe('GET /v1/users/:id', () => {
    it('should return user by ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-456',
        displayName: 'Other User',
        avatar: null,
        role: 'user',
        createdAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/user-456')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'user-456',
          displayName: 'Other User',
        }),
      });
    });

    it('should return not found for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/v1/users/nonexistent')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /v1/users/:id/follow', () => {
    it('should follow a user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-456',
        displayName: 'Other User',
      });

      mockPrismaService.following.findUnique.mockResolvedValue(null);
      mockPrismaService.following.create.mockResolvedValue({
        followerId: 'user-123',
        followingId: 'user-456',
        createdAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/v1/users/user-456/follow')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: { message: 'User followed successfully' },
      });
    });
  });

  describe('DELETE /v1/users/:id/follow', () => {
    it('should unfollow a user', async () => {
      mockPrismaService.following.findUnique.mockResolvedValue({
        followerId: 'user-123',
        followingId: 'user-456',
      });

      mockPrismaService.following.delete.mockResolvedValue({
        followerId: 'user-123',
        followingId: 'user-456',
      });

      const response = await request(app.getHttpServer())
        .delete('/v1/users/user-456/follow')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { message: 'User unfollowed successfully' },
      });
    });
  });
});
