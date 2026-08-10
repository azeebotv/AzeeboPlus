jest.mock('@azeebo/shared-services', () => ({
  FirebaseService: 'FirebaseService',
  EmailService: 'EmailService',
  SmsService: 'SmsService',
  CacheService: 'CacheService',
  cacheKey: (...args: unknown[]) => args.join(':'),
}));
jest.mock('@azeebo/security', () => ({
  RateLimitGuard: class MockRateLimitGuard {
    canActivate = jest.fn().mockReturnValue(true);
  },
  ServiceAuthGuard: class MockServiceAuthGuard {
    canActivate = jest.fn().mockReturnValue(true);
  },
  RateLimit: () => () => {},
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
}));
jest.mock('class-transformer', () => ({
  Type: () => () => {},
  plainToInstance: (_cls: unknown, obj: unknown) => obj,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { PrismaService } from '../database/prisma.service.js';

describe('Notifications Controller Contract Tests', () => {
  let app: INestApplication;

  const mockNotificationsService = {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
    savePushToken: jest.fn(),
    getPushTokens: jest.fn(),
    deletePushToken: jest.fn(),
    sendTemplatedEmail: jest.fn(),
  };

  const createMockAuthGuard = (canActivate: boolean) => ({
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      if (canActivate) {
        const request = context.switchToHttp().getRequest();
        request.user = { sub: 'user-123', id: 'user-123' };
      }
      return canActivate;
    }),
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(true))
      .overrideGuard(RateLimitGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = { sub: 'user-123', id: 'user-123' };
          return true;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/notifications', () => {
    it('should get user notifications', async () => {
      mockNotificationsService.getNotifications.mockResolvedValue({
        success: true,
        data: {
          notifications: [
            {
              id: 'notif-1',
              userId: 'user-123',
              type: 'content',
              title: 'New Content',
              message: 'New content available',
              read: false,
              createdAt: new Date(),
            },
          ],
          unreadCount: 1,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/notifications')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      mockNotificationsService.markAsRead.mockResolvedValue({
        success: true,
        data: { message: 'Notification marked as read' },
      });

      const response = await request(app.getHttpServer())
        .patch('/v1/notifications/550e8400-e29b-41d4-a716-446655440000/read')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /v1/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue({
        success: true,
        data: { message: 'All notifications marked as read' },
      });

      const response = await request(app.getHttpServer())
        .patch('/v1/notifications/read-all')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /v1/notifications/unread-count', () => {
    it('should get unread count', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue({
        success: true,
        data: { unreadCount: 5 },
      });

      const response = await request(app.getHttpServer())
        .get('/v1/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.unreadCount).toBe(5);
    });
  });

  describe('POST /v1/notifications/email', () => {
    it('should send a templated transactional email', async () => {
      mockNotificationsService.sendTemplatedEmail.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/v1/notifications/email')
        .set('Authorization', 'Bearer valid-token')
        .send({
          to: 'test@example.com',
          template: 'email-verification',
          data: { displayName: 'Test User', verificationUrl: 'https://azeebo.plus/verify' },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockNotificationsService.sendTemplatedEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        template: 'email-verification',
        data: { displayName: 'Test User', verificationUrl: 'https://azeebo.plus/verify' },
      });
    });
  });
});
