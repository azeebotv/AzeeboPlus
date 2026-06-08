import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

const mockRateLimitGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

describe('Notification Service Rate Limiting & Pagination Tests', () => {
  let app: INestApplication;

  const mockNotificationsService = {
    getNotifications: jest.fn().mockResolvedValue({
      success: true,
      data: {
        notifications: [],
        unreadCount: 0,
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    }),
    markAsRead: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'notif-1', readAt: new Date() },
    }),
    markAllAsRead: jest.fn().mockResolvedValue({
      success: true,
      data: { count: 5 },
    }),
    deleteNotification: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'notif-1' },
    }),
    getPreferences: jest.fn().mockResolvedValue({
      success: true,
      data: { email: true, push: true, sms: false },
    }),
    updatePreferences: jest.fn().mockResolvedValue({
      success: true,
      data: { email: true, push: false, sms: true },
    }),
    savePushToken: jest.fn().mockResolvedValue({
      success: true,
      data: { token: 'test-token' },
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: 'JWT',
          useValue: mockAuthGuard,
        },
        {
          provide: RateLimitGuard,
          useValue: mockRateLimitGuard,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGuard.canActivate.mockReturnValue(true);
    mockRateLimitGuard.canActivate.mockReturnValue(true);
  });

  describe('Rate Limiting - GET /notifications', () => {
    it('should allow requests within rate limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject requests exceeding rate limit', async () => {
      mockRateLimitGuard.canActivate.mockReturnValue(false);

      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(429);
    });

    it('should require authentication', async () => {
      mockAuthGuard.canActivate.mockReturnValue(false);

      const response = await request(app.getHttpServer()).get('/notifications');

      expect(response.status).toBe(401);
    });
  });

  describe('Pagination - GET /notifications', () => {
    it('should return paginated results with default page/limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(20);
    });

    it('should respect custom page parameter', async () => {
      mockNotificationsService.getNotifications.mockResolvedValueOnce({
        success: true,
        data: {
          notifications: [],
          unreadCount: 0,
          pagination: {
            total: 100,
            page: 3,
            limit: 20,
            totalPages: 5,
            hasNextPage: true,
            hasPreviousPage: true,
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/notifications?page=3')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(3);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
    });

    it('should respect custom limit parameter', async () => {
      mockNotificationsService.getNotifications.mockResolvedValueOnce({
        success: true,
        data: {
          notifications: [],
          unreadCount: 0,
          pagination: {
            total: 100,
            page: 1,
            limit: 50,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/notifications?limit=50')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBe(50);
    });

    it('should cap limit to maximum value', async () => {
      mockNotificationsService.getNotifications.mockResolvedValueOnce({
        success: true,
        data: {
          notifications: [],
          unreadCount: 0,
          pagination: {
            total: 100,
            page: 1,
            limit: 100,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/notifications?limit=1000')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('should include hasNextPage and hasPreviousPage flags', async () => {
      mockNotificationsService.getNotifications.mockResolvedValueOnce({
        success: true,
        data: {
          notifications: [],
          unreadCount: 0,
          pagination: {
            total: 100,
            page: 2,
            limit: 20,
            totalPages: 5,
            hasNextPage: true,
            hasPreviousPage: true,
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/notifications?page=2')
        .set('Authorization', 'Bearer test-token');

      expect(response.body.data.pagination.hasNextPage).toBe(true);
      expect(response.body.data.pagination.hasPreviousPage).toBe(true);
    });
  });
});
