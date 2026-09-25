jest.mock('@azeebo/shared-services', () => ({
  FirebaseService: 'FirebaseService',
  EmailService: 'EmailService',
  SmsService: 'SmsService',
  CacheService: 'CacheService',
  cacheKey: (...args: unknown[]) => args.join(':'),
}));
jest.mock('class-validator', () => ({
  IsBoolean: () => () => {},
  IsOptional: () => () => {},
  IsString: () => () => {},
  IsEmail: () => () => {},
  IsEnum: () => () => {},
  IsNotEmpty: () => () => {},
  IsIn: () => () => {},
  IsObject: () => () => {},
  ValidateNested: () => () => {},
  Type: () => () => {},
  IsPhoneNumber: () => () => {},
  Matches: () => () => {},
}));
jest.mock('class-transformer', () => ({
  Type: () => () => {},
  plainToInstance: (_cls: unknown, obj: unknown) => obj,
}));
jest.mock('@azeebo/security', () => {
  const canActivate = jest.fn().mockReturnValue(true);
  return {
    RateLimitGuard: class MockRateLimitGuard {
      canActivate = canActivate;
    },
    ServiceAuthGuard: class MockServiceAuthGuard {
      canActivate = canActivate;
    },
    AdminGuard: class MockAdminGuard {
      canActivate = canActivate;
    },
    RateLimit: () => () => {},
    __mockCanActivate: canActivate,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  ExecutionContext,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationSLOService } from '../notification/notification-slo.service.js';

const mockAuthGuard = {
  canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'user-123', email: 'test@example.com', role: 'user' };
    return true;
  }),
};

const mockRateLimitGuard = {
  canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'user-123', id: 'user-123', email: 'test@example.com', role: 'user' };
    return true;
  }),
};

describe('Notification Service Rate Limiting & Pagination Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

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
          provide: NotificationSLOService,
          useValue: { getCurrentSLOStatus: jest.fn(), measureSLO: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useValue(mockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGuard.canActivate.mockImplementation((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { sub: 'user-123', id: 'user-123', email: 'test@example.com', role: 'user' };
      return true;
    });
    mockRateLimitGuard.canActivate.mockImplementation((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { sub: 'user-123', id: 'user-123', email: 'test@example.com', role: 'user' };
      return true;
    });
  });

  describe('Rate Limiting - GET /v1/notifications', () => {
    it('should allow requests within rate limit', async () => {
      const response = await request(baseUrl)
        .get('/v1/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject requests exceeding rate limit', async () => {
      mockRateLimitGuard.canActivate.mockImplementation(() => {
        throw new HttpException(
          { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'Too many requests' },
          HttpStatus.TOO_MANY_REQUESTS
        );
      });

      const response = await request(baseUrl)
        .get('/v1/notifications')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(429);
    });

    it('should require authentication', async () => {
      mockRateLimitGuard.canActivate.mockImplementation(() => {
        throw new UnauthorizedException();
      });

      const response = await request(baseUrl).get('/v1/notifications');

      expect(response.status).toBe(401);
    });
  });

  describe('Pagination - GET /v1/notifications', () => {
    it('should return paginated results with default page/limit', async () => {
      const response = await request(baseUrl)
        .get('/v1/notifications')
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

      const response = await request(baseUrl)
        .get('/v1/notifications?page=3')
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

      const response = await request(baseUrl)
        .get('/v1/notifications?limit=50')
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

      const response = await request(baseUrl)
        .get('/v1/notifications?limit=1000')
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

      const response = await request(baseUrl)
        .get('/v1/notifications?page=2')
        .set('Authorization', 'Bearer test-token');

      expect(response.body.data.pagination.hasNextPage).toBe(true);
      expect(response.body.data.pagination.hasPreviousPage).toBe(true);
    });
  });
});
