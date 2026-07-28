jest.mock('axios');
jest.mock('@azeebo/shared-services', () => ({
  FirebaseService: 'FirebaseService',
  EmailService: 'EmailService',
  SmsService: 'SmsService',
  CacheService: 'CacheService',
  cacheKey: (...args: unknown[]) => args.join(':'),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { FirebaseService, EmailService, SmsService, CacheService } from '@azeebo/shared-services';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrismaService = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    pushToken: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockFirebaseService = {
    sendMulticastNotification: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
    sendCustomEmail: jest.fn(),
  };

  const mockSmsService = {
    sendSms: jest.fn(),
    sendSmsWithTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FirebaseService, useValue: mockFirebaseService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SmsService, useValue: mockSmsService },
        {
          provide: CacheService,
          useValue: { get: jest.fn(), set: jest.fn(), invalidate: jest.fn() },
        },
        { provide: ConfigService, useValue: { get: jest.fn(), getOrThrow: jest.fn() } },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        { id: '1', userId: 'user-1', title: 'Test 1', readAt: null },
        { id: '2', userId: 'user-1', title: 'Test 2', readAt: new Date() },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.notification.count.mockResolvedValueOnce(50);
      mockPrismaService.notification.count.mockResolvedValue(2);

      const result = await service.getNotifications('user-1', 1, 20);

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.notifications).toEqual(mockNotifications);
      const pagination = data.pagination as Record<string, unknown>;
      expect(pagination.total).toBe(50);
      expect(pagination.page).toBe(1);
      expect(pagination.hasNextPage).toBe(true);
    });

    it('should return empty notifications for user with none', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(0);

      const result = await service.getNotifications('user-new', 1, 20);

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.notifications).toEqual([]);
      expect(data.unreadCount).toBe(0);
    });

    it('should enforce max limit of 100', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(0);

      await service.getNotifications('user-1', 1, 200);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = { id: 'notif-1', userId: 'user-1', readAt: null };
      mockPrismaService.notification.findUnique.mockResolvedValue(notification);
      mockPrismaService.notification.update.mockResolvedValue({
        ...notification,
        readAt: new Date(),
      });

      const result = await service.markAsRead('user-1', 'notif-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if notification not found', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('user-1', 'notif-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if notification belongs to different user', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({
        id: 'notif-1',
        userId: 'other-user',
      });

      await expect(service.markAsRead('user-1', 'notif-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(result.success).toBe(true);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      mockPrismaService.notificationPreference.findUnique.mockResolvedValue(null);
      mockPrismaService.notificationPreference.upsert.mockResolvedValue({ id: 'pref-1' });

      const result = await service.updatePreferences('user-1', { email: true, sms: false });

      expect(result.success).toBe(true);
      expect(mockPrismaService.notificationPreference.upsert).toHaveBeenCalled();
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      mockPrismaService.notificationPreference.findUnique.mockResolvedValue({
        categoryOverrides: { email: true, push: false },
      });

      const result = await service.getPreferences('user-1');

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.settings).toEqual({ email: true, push: false });
    });

    it('should return empty object if no preferences set', async () => {
      mockPrismaService.notificationPreference.findUnique.mockResolvedValue(null);

      const result = await service.getPreferences('user-1');

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.settings).toEqual({});
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrismaService.notification.count.mockResolvedValue(7);

      const result = await service.getUnreadCount('user-1');

      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data.unreadCount).toBe(7);
    });
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const notification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'payment',
        title: 'Payment Received',
        message: 'You received $50',
        metadata: { amount: 50 },
      };
      mockPrismaService.notification.create.mockResolvedValue(notification);

      const result = await service.createNotification(
        'user-1',
        'payment',
        'Payment Received',
        'You received $50',
        { amount: 50 }
      );

      expect(result).toEqual(notification);
    });
  });

  describe('pushTokens', () => {
    const mockTokens = [
      { id: '1', userId: 'user-1', token: 'token-abc', deviceType: 'ios' },
      { id: '2', userId: 'user-1', token: 'token-def', deviceType: 'android' },
    ];

    describe('savePushToken', () => {
      it('should save new push token', async () => {
        mockPrismaService.pushToken.findUnique.mockResolvedValue(null);
        mockPrismaService.pushToken.upsert.mockResolvedValue(mockTokens[0]);

        const result = await service.savePushToken('user-1', 'token-abc', 'ios');

        expect(result.success).toBe(true);
        expect(mockPrismaService.pushToken.upsert).toHaveBeenCalled();
      });

      it('should update existing token for same user', async () => {
        mockPrismaService.pushToken.findUnique.mockResolvedValue({
          id: '1',
          userId: 'user-1',
          token: 'token-abc',
          deviceType: 'android',
        });
        mockPrismaService.pushToken.upsert.mockResolvedValue(mockTokens[0]);

        const result = await service.savePushToken('user-1', 'token-abc', 'ios');

        expect(result.success).toBe(true);
        expect(mockPrismaService.pushToken.upsert).toHaveBeenCalled();
      });

      it('should throw ConflictException if token belongs to another user', async () => {
        mockPrismaService.pushToken.findUnique.mockResolvedValue({
          id: '1',
          userId: 'old-user',
          token: 'token-abc',
          deviceType: 'android',
        });

        await expect(service.savePushToken('user-1', 'token-abc', 'ios')).rejects.toThrow();
      });
    });

    describe('getPushTokens', () => {
      it('should return all push tokens for user', async () => {
        mockPrismaService.pushToken.findMany.mockResolvedValue(mockTokens);

        const result = await service.getPushTokens('user-1');

        expect(result.success).toBe(true);
        const data = result.data as Record<string, unknown>;
        expect(data.pushTokens).toEqual(mockTokens);
      });
    });

    describe('deletePushTokenById', () => {
      it('should delete push token', async () => {
        mockPrismaService.pushToken.findUnique.mockResolvedValue(mockTokens[0]);
        mockPrismaService.pushToken.delete.mockResolvedValue(mockTokens[0]);

        const result = await service.deletePushTokenById('user-1', 'token-abc');

        expect(result.success).toBe(true);
        expect(mockPrismaService.pushToken.delete).toHaveBeenCalledWith({
          where: { id: 'token-abc' },
        });
      });

      it('should throw NotFoundException if token not found', async () => {
        mockPrismaService.pushToken.findUnique.mockResolvedValue(null);

        await expect(service.deletePushTokenById('user-1', 'invalid')).rejects.toThrow(
          NotFoundException
        );
      });

      it('should throw NotFoundException if token belongs to different user', async () => {
        mockPrismaService.pushToken.findUnique.mockResolvedValue({
          ...mockTokens[0],
          userId: 'other-user',
        });

        await expect(service.deletePushTokenById('user-1', 'token-abc')).rejects.toThrow(
          NotFoundException
        );
      });
    });
  });

  describe('sendPushNotification', () => {
    it('should send push notification to all user tokens', async () => {
      const tokens = [{ token: 'token-1' }, { token: 'token-2' }];
      mockPrismaService.pushToken.findMany.mockResolvedValue(tokens);
      mockFirebaseService.sendMulticastNotification.mockResolvedValue(true);

      const result = await service.sendPushNotification('user-1', 'Title', 'Body', {
        key: 'value',
      });

      expect(result).toBe(true);
      expect(mockFirebaseService.sendMulticastNotification).toHaveBeenCalledWith(
        ['token-1', 'token-2'],
        'Title',
        'Body',
        { key: 'value' }
      );
    });

    it('should return false if no tokens found', async () => {
      mockPrismaService.pushToken.findMany.mockResolvedValue([]);

      const result = await service.sendPushNotification('user-1', 'Title', 'Body');

      expect(result).toBe(false);
      expect(mockFirebaseService.sendMulticastNotification).not.toHaveBeenCalled();
    });
  });

  describe('email notifications', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      phone: '+1234567890',
    };

    describe('sendEmailNotification', () => {
      it('should send custom email notification', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: mockUser });
        mockEmailService.sendCustomEmail.mockResolvedValue(true);

        const result = await service.sendEmailNotification('user-1', 'Subject', 'Body');

        expect(result).toBe(true);
        expect(mockEmailService.sendCustomEmail).toHaveBeenCalledWith(
          'test@example.com',
          'Subject',
          '<p>Body</p>'
        );
      });

      it('should return false if user not found', async () => {
        (axios.get as jest.Mock).mockRejectedValue(new Error('Not found'));

        const result = await service.sendEmailNotification('user-1', 'Subject', 'Body');

        expect(result).toBe(false);
      });
    });

    describe('sendWelcomeEmail', () => {
      it('should send welcome email', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: mockUser });
        mockEmailService.sendEmail.mockResolvedValue(true);

        const result = await service.sendWelcomeEmail('user-1');

        expect(result).toBe(true);
        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
          'test@example.com',
          'Welcome to Azeebo+!',
          'welcome',
          { displayName: 'Test User' }
        );
      });
    });

    describe('sendPasswordResetEmail', () => {
      it('should send password reset email', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: mockUser });
        mockEmailService.sendEmail.mockResolvedValue(true);

        const result = await service.sendPasswordResetEmail('user-1', 'https://reset.link');

        expect(result).toBe(true);
        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
          'test@example.com',
          'Password Reset Request',
          'password-reset',
          { displayName: 'Test User', resetLink: 'https://reset.link' }
        );
      });
    });

    describe('sendPaymentConfirmationEmail', () => {
      it('should send payment confirmation email', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: mockUser });
        mockEmailService.sendEmail.mockResolvedValue(true);

        const result = await service.sendPaymentConfirmationEmail(
          'user-1',
          'txn-123',
          50.0,
          'USD',
          'Subscription payment'
        );

        expect(result).toBe(true);
        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
          'test@example.com',
          'Payment Confirmation',
          'payment-confirmation',
          expect.objectContaining({
            transactionId: 'txn-123',
            amount: 50.0,
            currency: 'USD',
          })
        );
      });
    });
  });

  describe('sms notifications', () => {
    const mockUserWithPhone = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      phone: '+1234567890',
    };

    describe('sendSmsNotification', () => {
      it('should send SMS notification', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: mockUserWithPhone });
        mockSmsService.sendSms.mockResolvedValue(true);

        const result = await service.sendSmsNotification('user-1', 'Hello via SMS');

        expect(result).toBe(true);
        expect(mockSmsService.sendSms).toHaveBeenCalledWith('+1234567890', 'Hello via SMS');
      });

      it('should return false if user has no phone', async () => {
        (axios.get as jest.Mock).mockResolvedValue({
          data: { ...mockUserWithPhone, phone: null },
        });

        const result = await service.sendSmsNotification('user-1', 'Hello');

        expect(result).toBe(false);
      });

      it('should return false if user not found', async () => {
        (axios.get as jest.Mock).mockRejectedValue(new Error('Not found'));

        const result = await service.sendSmsNotification('user-1', 'Hello');

        expect(result).toBe(false);
      });
    });

    describe('sendWelcomeSms', () => {
      it('should send welcome SMS', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: mockUserWithPhone });
        mockSmsService.sendSmsWithTemplate.mockResolvedValue(true);

        const result = await service.sendWelcomeSms('user-1');

        expect(result).toBe(true);
        expect(mockSmsService.sendSmsWithTemplate).toHaveBeenCalledWith('+1234567890', 'welcome', {
          displayName: 'Test User',
        });
      });
    });

    describe('sendPasswordResetSms', () => {
      it('should send password reset SMS', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: mockUserWithPhone });
        mockSmsService.sendSmsWithTemplate.mockResolvedValue(true);

        const result = await service.sendPasswordResetSms('user-1', '123456');

        expect(result).toBe(true);
        expect(mockSmsService.sendSmsWithTemplate).toHaveBeenCalledWith(
          '+1234567890',
          'password-reset',
          { resetCode: '123456' }
        );
      });
    });

    describe('sendAccountVerificationSms', () => {
      it('should send verification code SMS', async () => {
        (axios.get as jest.Mock).mockResolvedValue({ data: mockUserWithPhone });
        mockSmsService.sendSmsWithTemplate.mockResolvedValue(true);

        const result = await service.sendAccountVerificationSms('user-1', '789012');

        expect(result).toBe(true);
        expect(mockSmsService.sendSmsWithTemplate).toHaveBeenCalledWith(
          '+1234567890',
          'account-verification',
          { verificationCode: '789012' }
        );
      });
    });
  });
});
