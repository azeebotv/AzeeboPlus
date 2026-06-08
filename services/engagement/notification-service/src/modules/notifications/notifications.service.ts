/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService
  ) {}

  async getNotifications(userId: string, page = 1, limit = 20) {
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
  }

  async markAsRead(userId: string, notificationId: string) {
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

    return {
      success: true,
      data: {
        message: 'Notification marked as read',
      },
    };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: {
        readAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        message: 'All notifications marked as read',
      },
    };
  }

  async updatePreferences(userId: string, preferences: Record<string, boolean>) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: {
          ...preferences,
        },
      },
    });

    return {
      success: true,
      data: {
        message: 'Notification preferences updated',
      },
    };
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    return {
      success: true,
      data: {
        settings: user?.notificationPreferences || {},
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });

    return {
      success: true,
      data: {
        unreadCount: count,
      },
    };
  }

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata || {},
      },
    });
  }

  async savePushToken(userId: string, token: string, deviceType: string) {
    // Check if token already exists
    const existingToken = await this.prisma.pushToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      // Update existing token if user changed
      if (existingToken.userId !== userId) {
        await this.prisma.pushToken.update({
          where: { token },
          data: { userId, deviceType, updatedAt: new Date() },
        });
      }
      return {
        success: true,
        data: { message: 'Push token already exists' },
      };
    }

    // Create new token
    await this.prisma.pushToken.create({
      data: {
        userId,
        token,
        deviceType,
      },
    });

    return {
      success: true,
      data: { message: 'Push token saved successfully' },
    };
  }

  async getPushTokens(userId: string) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { userId },
    });

    return {
      success: true,
      data: {
        pushTokens: tokens,
      },
    };
  }

  async deletePushToken(userId: string, token: string) {
    const existingToken = await this.prisma.pushToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      throw new NotFoundException('Push token not found');
    }

    if (existingToken.userId !== userId) {
      throw new NotFoundException('Push token not found');
    }

    await this.prisma.pushToken.delete({
      where: { token },
    });

    return {
      success: true,
      data: { message: 'Push token deleted successfully' },
    };
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
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
  }

  async sendEmailNotification(userId: string, subject: string, body: string) {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(`User ${userId} not found`);
      return false;
    }

    return this.emailService.sendCustomEmail(user.email, subject, body);
  }

  async sendWelcomeEmail(userId: string) {
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
  }

  async sendPasswordResetEmail(userId: string, resetLink: string) {
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
  }

  async sendPaymentConfirmationEmail(
    userId: string,
    transactionId: string,
    amount: number,
    currency: string,
    description: string
  ) {
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
  }

  async sendContentPublishedEmail(userId: string, contentTitle: string, contentLink: string) {
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
  }

  async sendContentFeaturedEmail(userId: string, contentTitle: string, contentLink: string) {
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
  }

  async sendSmsNotification(userId: string, message: string) {
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
  }

  async sendWelcomeSms(userId: string) {
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
  }

  async sendPasswordResetSms(userId: string, resetCode: string) {
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
  }

  async sendPaymentConfirmationSms(
    userId: string,
    transactionId: string,
    amount: number,
    currency: string
  ) {
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
  }

  async sendContentPublishedSms(userId: string, contentTitle: string) {
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
  }

  async sendContentFeaturedSms(userId: string, contentTitle: string) {
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
  }

  async sendAccountVerificationSms(userId: string, verificationCode: string) {
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
  }
}
