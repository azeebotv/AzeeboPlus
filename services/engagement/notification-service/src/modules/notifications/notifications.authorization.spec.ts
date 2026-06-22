import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../database/prisma.service';

describe('NotificationsController (Authorization)', () => {
  let app: INestApplication;
  let notificationsService: NotificationsService;

  const mockNotificationsService = {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
  };

  const mockPrismaService = {
    notification: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    notificationsService = module.get<NotificationsService>(NotificationsService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('should allow authenticated user to get their notifications', async () => {
    mockNotificationsService.getNotifications.mockResolvedValue({
      success: true,
      data: {
        notifications: [{ id: '1', title: 'Test' }],
        unreadCount: 1,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    const response = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should allow authenticated user to mark notification as read', async () => {
    mockNotificationsService.markAsRead.mockResolvedValue({
      success: true,
      data: { message: 'Notification marked as read' },
    });

    const response = await request(app.getHttpServer())
      .patch('/notifications/123/read')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should allow authenticated user to mark all as read', async () => {
    mockNotificationsService.markAllAsRead.mockResolvedValue({
      success: true,
      data: { message: 'All notifications marked as read' },
    });

    const response = await request(app.getHttpServer())
      .post('/notifications/read-all')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it('should allow authenticated user to get unread count', async () => {
    mockNotificationsService.getUnreadCount.mockResolvedValue({
      success: true,
      data: { unreadCount: 5 },
    });

    const response = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.data.unreadCount).toBe(5);
  });

  it('should allow authenticated user to get preferences', async () => {
    mockNotificationsService.getPreferences.mockResolvedValue({
      success: true,
      data: { settings: { email: true, push: false } },
    });

    const response = await request(app.getHttpServer())
      .get('/notifications/preferences')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.data.settings).toBeDefined();
  });

  it('should allow authenticated user to update preferences', async () => {
    mockNotificationsService.updatePreferences.mockResolvedValue({
      success: true,
      data: { message: 'Notification preferences updated' },
    });

    const response = await request(app.getHttpServer())
      .put('/notifications/preferences')
      .set('Authorization', 'Bearer valid-token')
      .send({ email: true, sms: false });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => false })
      .compile();

    const testApp = module.createNestApplication();
    await testApp.init();

    const response = await request(testApp.getHttpServer())
      .get('/notifications')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);

    await testApp.close();
  });
});
