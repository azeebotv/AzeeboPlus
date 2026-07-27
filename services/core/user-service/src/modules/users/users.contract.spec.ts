import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  UnauthorizedException,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { UsersController } from './users.controller.js';
import { InteractionsController } from './interactions.controller.js';
import { UserDeletionController } from '../user/user-deletion.controller.js';
import { UsersService } from './users.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { RateLimitGuard, ServiceAuthGuard } from '@azeebo/security';
import { CacheService } from '@azeebo/shared-services';

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
        request.user = { sub: 'user-123', id: 'user-123' };
        return true;
      }
      throw new UnauthorizedException();
    },
  };

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController, InteractionsController, UserDeletionController],
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(0),
            deleteByPattern: jest.fn().mockResolvedValue(0),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_k: string, d?: unknown) => d),
            getOrThrow: jest.fn((_k: string) => undefined),
          },
        },
      ],
    })
      .overrideGuard(ServiceAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    // Mock ServiceAuthGuard behavior
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
          req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
        }
        next();
      }
    );
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
        .post('/v1/users/550e8400-e29b-41d4-a716-446655440000/follow')
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
        followingId: '550e8400-e29b-41d4-a716-446655440000',
      });

      mockPrismaService.following.delete.mockResolvedValue({
        followerId: 'user-123',
        followingId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const response = await request(app.getHttpServer())
        .delete('/v1/users/550e8400-e29b-41d4-a716-446655440000/follow')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { message: 'User unfollowed successfully' },
      });
    });
  });
});
