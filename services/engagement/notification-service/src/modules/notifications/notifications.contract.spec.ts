import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../database/prisma.service';

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
  };

  const createMockAuthGuard = (canActivate: boolean) => ({
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      if (canActivate) {
        const request = context.switchToHttp().getRequest();
        request.user = { sub: 'user-123' };
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
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
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
        .patch('/v1/notifications/notif-1/read')
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
});
