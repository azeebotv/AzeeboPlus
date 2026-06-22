import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationsModule } from './notifications.module';
import { NotificationsRepository } from './notifications.repository';
import { JwtService } from '@nestjs/jwt';

describe('Notifications Controller Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotificationsModule],
    })
      .overrideProvider(NotificationsRepository)
      .useValue({
        getNotifications: jest.fn(),
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        delete: jest.fn(),
        getUnreadCount: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /notifications', () => {
    it('should get user notifications', async () => {
      const notificationsRepository = app.get(NotificationsRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsRepository, 'getNotifications').mockResolvedValue({
        data: [
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
        page: 1,
        limit: 20,
        total: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({
          page: 1,
          total: 1,
        }),
      });
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notificationsRepository = app.get(NotificationsRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsRepository, 'markAsRead').mockResolvedValue({
        id: 'notif-1',
        read: true,
      });

      const response = await request(app.getHttpServer())
        .patch('/notifications/notif-1/read')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          read: true,
        }),
      });
    });
  });

  describe('PATCH /notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const notificationsRepository = app.get(NotificationsRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsRepository, 'markAllAsRead').mockResolvedValue(5);

      const response = await request(app.getHttpServer())
        .patch('/notifications/read-all')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete notification', async () => {
      const notificationsRepository = app.get(NotificationsRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsRepository, 'delete').mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .delete('/notifications/notif-1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('should get unread count', async () => {
      const notificationsRepository = app.get(NotificationsRepository);
      const jwtService = app.get(JwtService);

      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsRepository, 'getUnreadCount').mockResolvedValue(5);

      const response = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          count: 5,
        }),
      });
    });
  });
});
