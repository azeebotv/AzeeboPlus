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
  ValidateNested: () => () => {},
  Type: () => () => {},
  IsPhoneNumber: () => () => {},
}));
jest.mock('class-transformer', () => ({
  Type: () => () => {},
  plainToInstance: (_cls: unknown, obj: unknown) => obj,
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ExecutionContext,
  UnauthorizedException,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard } from '@azeebo/security';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { PrismaService } from '../database/prisma.service.js';

describe('NotificationsController (Authorization)', () => {
  let app: INestApplication;

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

  const createMockAuthGuard = (canActivate: boolean) => ({
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      if (!canActivate) {
        throw new UnauthorizedException();
      }
      const request = context.switchToHttp().getRequest();
      request.user = { sub: 'user-123', id: 'user-123' };
      return true;
    }),
  });

  const buildModule = async (authGuardReturnValue: boolean) => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(createMockAuthGuard(authGuardReturnValue))
      .overrideGuard(RateLimitGuard)
      .useValue({
        canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          const auth = request.headers?.authorization;
          if (!auth || auth !== 'Bearer valid-token') {
            throw new UnauthorizedException();
          }
          request.user = { sub: 'user-123', id: 'user-123' };
          return true;
        }),
      })
      .compile();

    return module;
  };

  beforeEach(async () => {
    const module = await buildModule(true);

    app = module.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
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
      .get('/v1/notifications')
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
      .patch('/v1/notifications/550e8400-e29b-41d4-a716-446655440000/read')
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
      .patch('/v1/notifications/read-all')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should allow authenticated user to get unread count', async () => {
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

  it('should allow authenticated user to get preferences', async () => {
    mockNotificationsService.getPreferences.mockResolvedValue({
      success: true,
      data: { settings: { email: true, push: false } },
    });

    const response = await request(app.getHttpServer())
      .get('/v1/notifications/settings')
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
      .put('/v1/notifications/preferences')
      .set('Authorization', 'Bearer valid-token')
      .send({ email: true, sms: false });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should reject unauthenticated requests', async () => {
    await app.close();

    const module = await buildModule(false);

    const testApp = module.createNestApplication();
    testApp.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    await testApp.init();

    const response = await request(testApp.getHttpServer())
      .get('/v1/notifications')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);

    await testApp.close();
  });
});
