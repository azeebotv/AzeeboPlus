import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { FirebaseService } from '../firebase/firebase.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { CacheService, cacheKey } from '@azeebo/shared-services';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly cache: CacheService
  ) {}

  async getNotifications(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{ success: boolean; data: Record<string, unknown> }> {
    try {
      const skip = (page - 1) * limit;
      const take = Math.min(limit, 100);

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        this.prisma.notification.count({
          where: { userId },
        }),
      ]);

      const unreadCount = await this.prisma.notification.count({
        where: { userId, readAt: null },
      });

      const totalPages = Math.ceil(total / take);

      return {
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            total,
            page,
            limit: take,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        },
      };
    } catch (error) {
      this.logger.error(`getNotifications failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async markAsRead(
    userId: string,
    notificationId: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new NotFoundException(`Notification not found`);
      }

      if (notification.userId !== userId) {
        throw new NotFoundException(`Notification not found`);
      }

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          readAt: new Date(),
        },
      });

      await this.cache.invalidate(`notification:unread:${userId}*`);

      return {
        success: true,
        data: {
          message: 'Notification marked as read',
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`markAsRead failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; data: { message: string } }> {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: {
          readAt: new Date(),
        },
      });

      await this.cache.invalidate(`notification:unread:${userId}*`);

      return {
        success: true,
        data: {
          message: 'All notifications marked as read',
        },
      };
    } catch (error) {
      this.logger.error(`markAllAsRead failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  // NOTE: updatePreferences currently writes to the deprecated `notificationPreferences` JSON
  // field on the User model. This should be migrated to use the canonical
  // NotificationPreference model for proper relational storage and querying.
  async updatePreferences(
    userId: string,
    preferences: Record<string, boolean>
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      const existingPrefs = (user?.notificationPreferences as Record<string, boolean>) || {};

      const deepMerged = { ...existingPrefs, ...preferences };

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: deepMerged as Prisma.InputJsonValue,
        },
      });

      await this.cache.invalidate(`notification:preferences:${userId}*`);

      return {
        success: true,
        data: {
          message: 'Notification preferences updated',
        },
      };
    } catch (error) {
      this.logger.error(`updatePreferences failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getPreferences(
    userId: string
  ): Promise<{ success: boolean; data: Record<string, unknown> }> {
    try {
      const cacheK = cacheKey('notification', `preferences:${userId}`);
      const cached = await this.cache.get<{ success: boolean; data: Record<string, unknown> }>(cacheK);
      if (cached) return cached;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      const result = {
        success: true,
        data: {
          settings: user?.notificationPreferences || {},
        },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(`getPreferences failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getUnreadCount(
    userId: string
  ): Promise<{ success: boolean; data: Record<string, unknown> }> {
    try {
      const cacheK = cacheKey('notification', `unread:${userId}`);
      const cached = await this.cache.get<{ success: boolean; data: Record<string, unknown> }>(cacheK);
      if (cached) return cached;

      const count = await this.prisma.notification.count({
        where: { userId, readAt: null },
      });

      const result = {
        success: true,
        data: {
          unreadCount: count,
        },
      };

      await this.cache.set(cacheK, result, 60);
      return result;
    } catch (error) {
      this.logger.error(`getUnreadCount failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      const result = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          metadata: (metadata || {}) as Prisma.InputJsonValue,
        },
      });

      await this.cache.invalidate(`notification:unread:${userId}*`);

      return result;
    } catch (error) {
      this.logger.error(`createNotification failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async savePushToken(
    userId: string,
    token: string,
    deviceType: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const existing = await this.prisma.pushToken.findUnique({ where: { token } });
      if (existing && existing.userId !== userId) {
        throw new ConflictException('This push token is registered to another device');
      }

      await this.prisma.pushToken.upsert({
        where: { token },
        update: { userId, deviceType, updatedAt: new Date() },
        create: { userId, token, deviceType },
      });

      return {
        success: true,
        data: { message: 'Push token saved successfully' },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`savePushToken failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getPushTokens(
    userId: string
  ): Promise<{ success: boolean; data: Record<string, unknown> }> {
    try {
      const tokens = await this.prisma.pushToken.findMany({
        where: { userId },
      });

      return {
        success: true,
        data: {
          pushTokens: tokens,
        },
      };
    } catch (error) {
      this.logger.error(`getPushTokens failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async deletePushTokenById(
    userId: string,
    tokenId: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const existingToken = await this.prisma.pushToken.findUnique({
        where: { id: tokenId },
      });

      if (!existingToken) {
        throw new NotFoundException('Push token not found');
      }

      if (existingToken.userId !== userId) {
        throw new NotFoundException('Push token not found');
      }

      await this.prisma.pushToken.delete({
        where: { id: tokenId },
      });

      return {
        success: true,
        data: { message: 'Push token deleted successfully' },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`deletePushTokenById failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      // Get all push tokens for the user
      const tokens = await this.prisma.pushToken.findMany({
        where: { userId },
      });

      if (tokens.length === 0) {
        this.logger.log(`No push tokens found for user ${userId}`);
        return false;
      }

      const tokenValues = tokens.map((t) => t.token);

      // Send push notification using Firebase
      return this.firebaseService.sendMulticastNotification(tokenValues, title, body, data);
    } catch (error) {
      this.logger.error(`sendPushNotification failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendEmailNotification(userId: string, subject: string, body: string): Promise<boolean> {
    try {
      // Get user email
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      // NOTE: This regex-based strip is naive and will not handle nested/malformed tags.
      // For production use, replace with a proper sanitization library (e.g., DOMPurify, sanitize-html).
      const sanitizedBody = body.replace(/<[^>]*>/g, '');
      return this.emailService.sendCustomEmail(user.email, subject, sanitizedBody);
    } catch (error) {
      this.logger.error(`sendEmailNotification failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendWelcomeEmail(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      return this.emailService.sendEmail(user.email, 'Welcome to Azeebo+!', 'welcome', {
        displayName: user.displayName,
      });
    } catch (error) {
      this.logger.error(`sendWelcomeEmail failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendPasswordResetEmail(userId: string, resetLink: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      return this.emailService.sendEmail(user.email, 'Password Reset Request', 'password-reset', {
        displayName: user.displayName,
        resetLink,
      });
    } catch (error) {
      this.logger.error(`sendPasswordResetEmail failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendPaymentConfirmationEmail(
    userId: string,
    transactionId: string,
    amount: number,
    currency: string,
    description: string
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      return this.emailService.sendEmail(user.email, 'Payment Confirmation', 'payment-confirmation', {
        displayName: user.displayName,
        transactionId,
        amount,
        currency,
        description,
        date: new Date().toLocaleDateString(),
      });
    } catch (error) {
      this.logger.error(`sendPaymentConfirmationEmail failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendContentPublishedEmail(
    userId: string,
    contentTitle: string,
    contentLink: string
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      return this.emailService.sendEmail(
        user.email,
        'Your Content Has Been Published',
        'content-published',
        {
          displayName: user.displayName,
          contentTitle,
          contentLink,
        }
      );
    } catch (error) {
      this.logger.error(`sendContentPublishedEmail failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendContentFeaturedEmail(
    userId: string,
    contentTitle: string,
    contentLink: string
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      return this.emailService.sendEmail(
        user.email,
        'Your Content Has Been Featured!',
        'content-featured',
        {
          displayName: user.displayName,
          contentTitle,
          contentLink,
        }
      );
    } catch (error) {
      this.logger.error(`sendContentFeaturedEmail failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendSmsNotification(userId: string, message: string): Promise<boolean> {
    try {
      // Get user phone number (assuming user has a phone field)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      // Assuming user has a phone field
      if (!user.phone) {
        this.logger.error(`User ${userId} has no phone number`);
        return false;
      }

      return this.smsService.sendSms(user.phone, message);
    } catch (error) {
      this.logger.error(`sendSmsNotification failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendWelcomeSms(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'welcome', {
        displayName: user.displayName,
      });
    } catch (error) {
      this.logger.error(`sendWelcomeSms failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendPasswordResetSms(userId: string, resetCode: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'password-reset', {
        resetCode,
      });
    } catch (error) {
      this.logger.error(`sendPasswordResetSms failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendPaymentConfirmationSms(
    userId: string,
    transactionId: string,
    amount: number,
    currency: string
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'payment-confirmation', {
        transactionId,
        amount,
        currency,
      });
    } catch (error) {
      this.logger.error(`sendPaymentConfirmationSms failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendContentPublishedSms(userId: string, contentTitle: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'content-published', {
        contentTitle,
      });
    } catch (error) {
      this.logger.error(`sendContentPublishedSms failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendContentFeaturedSms(userId: string, contentTitle: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'content-featured', {
        contentTitle,
      });
    } catch (error) {
      this.logger.error(`sendContentFeaturedSms failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async sendAccountVerificationSms(userId: string, verificationCode: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'account-verification', {
        verificationCode,
      });
    } catch (error) {
      this.logger.error(`sendAccountVerificationSms failed: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }
}
