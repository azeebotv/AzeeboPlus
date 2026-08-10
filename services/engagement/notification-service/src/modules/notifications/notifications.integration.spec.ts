jest.mock('axios');
jest.mock('@azeebo/shared-services', () => ({
  FirebaseService: 'FirebaseService',
  EmailService: 'EmailService',
  SmsService: 'SmsService',
  CacheService: 'CacheService',
  cacheKey: (...args: unknown[]) => args.join(':'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { FirebaseService, EmailService, SmsService, CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';

describe('NotificationsService Integration', () => {
  let service: NotificationsService;

  const mockPrismaService = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    pushToken: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    invalidate: jest.fn().mockResolvedValue(1),
    delete: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                USER_SERVICE_URL: 'http://user-service:3001',
                INTERNAL_API_KEY: 'test-api-key',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: FirebaseService,
          useValue: {
            sendMulticastNotification: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(true),
            sendCustomEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendSms: jest.fn().mockResolvedValue(true),
            sendSmsWithTemplate: jest.fn().mockResolvedValue(true),
          },
        },
        { provide: CacheService, useValue: mockCacheService },
        {
          provide: FeatureFlagService,
          useValue: { isEnabled: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return paginated notifications for a user', async () => {
      const mockNotifications = [
        { id: 'notif-1', userId: 'user-1', title: 'Welcome', readAt: null },
        { id: 'notif-2', userId: 'user-1', title: 'Update', readAt: new Date() },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.notification.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

      const result = await service.getNotifications('user-1', 1, 20);

      expect(result.success).toBe(true);
      const data = result.data as {
        notifications: unknown[];
        unreadCount: number;
        pagination: { total: number };
      };
      expect(data.notifications).toHaveLength(2);
      expect(data.unreadCount).toBe(1);
      expect(data.pagination.total).toBe(2);
    });

    it('should handle empty notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      const result = await service.getNotifications('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { notifications: unknown[]; unreadCount: number };
      expect(data.notifications).toHaveLength(0);
      expect(data.unreadCount).toBe(0);
    });

    it('should limit page size to 100', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      await service.getNotifications('user-1', 1, 200);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        readAt: null,
      });
      mockPrismaService.notification.update.mockResolvedValue({});

      const result = await service.markAsRead('user-1', 'notif-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when notification belongs to another user', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-2',
        readAt: null,
      });

      await expect(service.markAsRead('user-1', 'notif-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('notification:unread:user-1*');
    });
  });

  describe('updatePreferences', () => {
    it('should create new notification preferences', async () => {
      mockPrismaService.notificationPreference.findUnique.mockResolvedValue(null);
      mockPrismaService.notificationPreference.upsert.mockResolvedValue({});

      const result = await service.updatePreferences('user-1', {
        email: true,
        push: false,
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: { categoryOverrides: { email: true, push: false } },
        create: {
          userId: 'user-1',
          categoryOverrides: { email: true, push: false },
        },
      });
    });

    it('should merge with existing preferences', async () => {
      mockPrismaService.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        categoryOverrides: { email: true, sms: true },
      });
      mockPrismaService.notificationPreference.upsert.mockResolvedValue({});

      const result = await service.updatePreferences('user-1', {
        push: false,
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: { categoryOverrides: { email: true, sms: true, push: false } },
        create: expect.any(Object),
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { unreadCount: number };
      expect(data.unreadCount).toBe(5);
    });

    it('should return cached result when available', async () => {
      mockCacheService.get.mockResolvedValueOnce({
        success: true,
        data: { unreadCount: 10 },
      });

      const result = await service.getUnreadCount('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { unreadCount: number };
      expect(data.unreadCount).toBe(10);
      expect(mockPrismaService.notification.count).not.toHaveBeenCalled();
    });
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
        type: 'system',
        title: 'Welcome',
        message: 'Welcome to Azeebo+!',
      });

      const result = await service.createNotification(
        'user-1',
        'system',
        'Welcome',
        'Welcome to Azeebo+!'
      );

      expect(result).toMatchObject({
        id: 'notif-1',
        userId: 'user-1',
        title: 'Welcome',
      });
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('notification:unread:user-1*');
    });
  });

  describe('savePushToken', () => {
    it('should save a new push token', async () => {
      mockPrismaService.pushToken.findUnique.mockResolvedValue(null);
      mockPrismaService.pushToken.upsert.mockResolvedValue({});

      const result = await service.savePushToken('user-1', 'token-abc', 'ios');

      expect(result.success).toBe(true);
      expect(mockPrismaService.pushToken.upsert).toHaveBeenCalledWith({
        where: { token: 'token-abc' },
        update: { userId: 'user-1', deviceType: 'ios', updatedAt: expect.any(Date) },
        create: { userId: 'user-1', token: 'token-abc', deviceType: 'ios' },
      });
    });

    it('should throw ConflictException when token belongs to another user', async () => {
      mockPrismaService.pushToken.findUnique.mockResolvedValue({
        id: 'token-1',
        token: 'token-abc',
        userId: 'user-2',
      });

      await expect(service.savePushToken('user-1', 'token-abc', 'ios')).rejects.toThrow(
        'This push token is registered to another device'
      );
    });
  });

  describe('getPushTokens', () => {
    it('should return all push tokens for a user', async () => {
      mockPrismaService.pushToken.findMany.mockResolvedValue([
        { id: 'token-1', userId: 'user-1', token: 'abc', deviceType: 'ios' },
        { id: 'token-2', userId: 'user-1', token: 'def', deviceType: 'android' },
      ]);

      const result = await service.getPushTokens('user-1');

      expect(result.success).toBe(true);
      const data = result.data as { pushTokens: unknown[] };
      expect(data.pushTokens).toHaveLength(2);
    });
  });

  describe('deletePushTokenById', () => {
    it('should delete a push token', async () => {
      mockPrismaService.pushToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
      });
      mockPrismaService.pushToken.delete.mockResolvedValue({});

      const result = await service.deletePushTokenById('user-1', 'token-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.pushToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-1' },
      });
    });

    it('should throw NotFoundException when token does not exist', async () => {
      mockPrismaService.pushToken.findUnique.mockResolvedValue(null);

      await expect(service.deletePushTokenById('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when token belongs to another user', async () => {
      mockPrismaService.pushToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-2',
      });

      await expect(service.deletePushTokenById('user-1', 'token-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
