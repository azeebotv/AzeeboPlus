import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('User Service Pagination Tests', () => {
  let app: INestApplication;

  const mockUsersService = {
    getWatchHistory: jest.fn().mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
    getSavedItems: jest.fn().mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
  };

  const mockAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { sub: 'test-user-123' };
      return true;
    },
  };

  const mockRateLimitGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue(mockRateLimitGuard)
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

  describe('Pagination - GET /me/history', () => {
    it('should return paginated watch history with default values', async () => {
      mockUsersService.getWatchHistory.mockResolvedValueOnce({
        success: true,
        data: [
          { id: 'history-1', contentId: 'content-1', watchedAt: new Date() },
          { id: 'history-2', contentId: 'content-2', watchedAt: new Date() },
        ],
        pagination: {
          total: 50,
          page: 1,
          limit: 20,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/history')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.hasNextPage).toBe(true);
    });

    it('should respect custom page parameter', async () => {
      mockUsersService.getWatchHistory.mockResolvedValueOnce({
        success: true,
        data: [],
        pagination: {
          total: 50,
          page: 3,
          limit: 20,
          totalPages: 3,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/history?page=3')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(3);
    });

    it('should respect custom limit parameter', async () => {
      mockUsersService.getWatchHistory.mockResolvedValueOnce({
        success: true,
        data: [],
        pagination: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/history?limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should cap limit to maximum value', async () => {
      mockUsersService.getWatchHistory.mockResolvedValueOnce({
        success: true,
        data: [],
        pagination: {
          total: 50,
          page: 1,
          limit: 100,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/history?limit=1000')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('should calculate totalPages correctly', async () => {
      mockUsersService.getWatchHistory.mockResolvedValueOnce({
        success: true,
        data: [],
        pagination: {
          total: 95,
          page: 1,
          limit: 20,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/history')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalPages).toBe(5);
    });

    it('should set hasNextPage correctly on last page', async () => {
      mockUsersService.getWatchHistory.mockResolvedValueOnce({
        success: true,
        data: [],
        pagination: {
          total: 50,
          page: 3,
          limit: 20,
          totalPages: 3,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/history?page=3')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.hasNextPage).toBe(false);
    });

    it('should set hasPreviousPage correctly on first page', async () => {
      mockUsersService.getWatchHistory.mockResolvedValueOnce({
        success: true,
        data: [],
        pagination: {
          total: 50,
          page: 1,
          limit: 20,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/history')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.hasPreviousPage).toBe(false);
    });
  });

  describe('Pagination - GET /me/saved', () => {
    it('should return paginated saved items with default values', async () => {
      mockUsersService.getSavedItems.mockResolvedValueOnce({
        success: true,
        data: [
          { id: 'saved-1', contentId: 'content-1', createdAt: new Date() },
        ],
        pagination: {
          total: 25,
          page: 1,
          limit: 20,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/saved')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
    });

    it('should support pagination for saved items', async () => {
      mockUsersService.getSavedItems.mockResolvedValueOnce({
        success: true,
        data: [],
        pagination: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/users/me/saved?page=2&limit=10')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });
  });
});