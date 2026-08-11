import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../../prisma/client/index.js';
import { FirebaseService, EmailService, SmsService } from '@azeebo/shared-services';
import { CacheService, cacheKey, RedisService } from '@azeebo/shared-services';
import { FeatureFlagService, notificationFlags } from '@azeebo/feature-flags';
import { SendEmailDto } from './dto/send-email.dto.js';
import axios from 'axios';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly userServiceBaseUrl: string;
  private readonly analyticsServiceBaseUrl: string;

  // First-class transactional email templates: the template name maps to the
  // subject sent with it. Only templates listed here can be sent through the
  // internal POST /v1/notifications/email endpoint — anything else is a 400.
  // The HTML bodies live in EmailService.registerTemplates (shared-services).
  private static readonly EMAIL_SUBJECTS: Record<string, string> = {
    'email-verification': 'Verify Your Email Address',
    'password-reset': 'Password Reset Request',
    'magic-link': 'Your Azeebo+ Sign-In Link',
    'digest': 'Your Azeebo+ Daily Digest',
    'flag-stale': 'Action Required: Stale Feature Flag',
  };

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FirebaseService) private readonly firebaseService: FirebaseService,
    @Inject(EmailService) private readonly emailService: EmailService,
    @Inject(SmsService) private readonly smsService: SmsService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {
    this.userServiceBaseUrl = this.configService.get<string>(
      'USER_SERVICE_URL',
      'http://user-service:3001'
    );
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3040'
    );
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        { eventName, userId, metadata, timestamp: new Date().toISOString() },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }

  private async getUserData(userId: string): Promise<UserData | null> {
    try {
      const response = await axios.get(`${this.userServiceBaseUrl}/users/${userId}`, {
        timeout: 5000,
        headers: { 'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', '') },
      });
      return response.data?.data || response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch user data for ${userId}: ${error}`);
      return null;
    }
  }

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
      this.logger.error(
        `getNotifications failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
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
        throw new ForbiddenException('You do not have access to this notification');
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
      throw error;
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
      this.logger.error(
        `markAllAsRead failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  // updatePreferences writes to the canonical NotificationPreference model
  // for proper relational storage and querying. With notification_preferences_v2
  // ON the full model surface is honored (per-channel columns, quiet hours,
  // timezone, category overrides); OFF it preserves the legacy flat-map
  // behavior (categoryOverrides only) so the migration switch is real.
  async updatePreferences(
    userId: string,
    preferences: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
      inApp?: boolean;
      quietHoursStart?: string;
      quietHoursEnd?: string;
      timezone?: string;
      categoryOverrides?: Record<string, boolean>;
      [key: string]: unknown;
    }
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const v2Enabled = await this.featureFlagService.isEnabled(
        notificationFlags.preferencesV2
      );

      const existing = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });
      const existingPrefs = (existing?.categoryOverrides as Record<string, boolean>) || {};
      const {
        quietHoursStart: _quietHoursStart,
        quietHoursEnd: _quietHoursEnd,
        timezone: _timezone,
        categoryOverrides: _categoryOverrides,
        ...legacyFlatPrefs
      } = preferences;
      // Legacy path merges the flat channel map into categoryOverrides (the
      // pre-v2 shape); the v2 path keeps the per-channel columns + a separate
      // categoryOverrides map.
      const deepMerged = v2Enabled
        ? {
            ...existingPrefs,
            ...(preferences.categoryOverrides || {}),
          }
        : {
            ...existingPrefs,
            ...legacyFlatPrefs,
          };

      if (v2Enabled) {
        await this.prisma.notificationPreference.upsert({
          where: { userId },
          update: {
            pushEnabled: preferences.push ?? existing?.pushEnabled ?? true,
            emailEnabled: preferences.email ?? existing?.emailEnabled ?? true,
            smsEnabled: preferences.sms ?? existing?.smsEnabled ?? false,
            inAppEnabled: preferences.inApp ?? existing?.inAppEnabled ?? true,
            quietHoursStart: preferences.quietHoursStart ?? existing?.quietHoursStart ?? null,
            quietHoursEnd: preferences.quietHoursEnd ?? existing?.quietHoursEnd ?? null,
            timezone: preferences.timezone ?? existing?.timezone ?? null,
            categoryOverrides: deepMerged as Prisma.InputJsonValue,
          },
          create: {
            userId,
            pushEnabled: preferences.push ?? true,
            emailEnabled: preferences.email ?? true,
            smsEnabled: preferences.sms ?? false,
            inAppEnabled: preferences.inApp ?? true,
            quietHoursStart: preferences.quietHoursStart ?? null,
            quietHoursEnd: preferences.quietHoursEnd ?? null,
            timezone: preferences.timezone ?? null,
            categoryOverrides: deepMerged as Prisma.InputJsonValue,
          },
        });
      } else {
        // Legacy path: only the flat category override map is touched.
        await this.prisma.notificationPreference.upsert({
          where: { userId },
          update: { categoryOverrides: deepMerged as Prisma.InputJsonValue },
          create: {
            userId,
            categoryOverrides: deepMerged as Prisma.InputJsonValue,
          },
        });
      }

      await this.cache.invalidate(`notification:preferences:${userId}*`);

      return {
        success: true,
        data: {
          message: 'Notification preferences updated',
        },
      };
    } catch (error) {
      this.logger.error(
        `updatePreferences failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getPreferences(
    userId: string
  ): Promise<{ success: boolean; data: Record<string, unknown> }> {
    try {
      const cacheK = cacheKey('notification', `preferences:${userId}`);
      const cached = await this.cache.get<{ success: boolean; data: Record<string, unknown> }>(
        cacheK
      );
      if (cached) return cached;

      const pref = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      const v2Enabled = await this.featureFlagService.isEnabled(
        notificationFlags.preferencesV2
      );

      const result = {
        success: true,
        data: v2Enabled
          ? {
              push: pref?.pushEnabled ?? true,
              email: pref?.emailEnabled ?? true,
              sms: pref?.smsEnabled ?? false,
              inApp: pref?.inAppEnabled ?? true,
              quietHoursStart: pref?.quietHoursStart ?? null,
              quietHoursEnd: pref?.quietHoursEnd ?? null,
              timezone: pref?.timezone ?? null,
              categoryOverrides: pref?.categoryOverrides || {},
            }
          : {
              settings: pref?.categoryOverrides || {},
            },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(
        `getPreferences failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getUnreadCount(
    userId: string
  ): Promise<{ success: boolean; data: Record<string, unknown> }> {
    try {
      const cacheK = cacheKey('notification', `unread:${userId}`);
      const cached = await this.cache.get<{ success: boolean; data: Record<string, unknown> }>(
        cacheK
      );
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
      this.logger.error(
        `getUnreadCount failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
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
      this.logger.error(
        `createNotification failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
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
      this.logger.error(
        `savePushToken failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
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
      this.logger.error(
        `getPushTokens failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
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
      this.logger.error(
        `deletePushTokenById failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    // Channel kill-switch: push is enabled while either platform is on.
    const pushEnabled =
      (await this.featureFlagService.isEnabled(notificationFlags.pushIos)) ||
      (await this.featureFlagService.isEnabled(notificationFlags.pushAndroid));
    if (!pushEnabled) {
      this.logger.warn(`Push notifications disabled by flag; skipping user ${userId}`);
      return false;
    }
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
      const result = this.firebaseService.sendMulticastNotification(tokenValues, title, body, data);
      this.trackAnalyticsEvent('notification_push_sent', userId, { type: 'push' });
      return result;
    } catch (error) {
      this.logger.error(
        `sendPushNotification failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  /**
   * Sends a first-class transactional email (e.g. the verification link) by
   * template name through the shared EmailService. Used by internal services
   * via POST /v1/notifications/email. Subject and HTML live here/in the
   * shared template registry, so callers never assemble email content.
   */
  async sendTemplatedEmail(dto: SendEmailDto): Promise<boolean> {
    // Channel kill-switch: halt transactional email sends instantly.
    if (!(await this.featureFlagService.isEnabled(notificationFlags.emailEnabled))) {
      this.logger.warn(`Email sends disabled by flag; skipping ${dto.to}`);
      return false;
    }

    const subject = NotificationsService.EMAIL_SUBJECTS[dto.template];
    if (!subject) {
      throw new BadRequestException(`Unknown email template: ${dto.template}`);
    }

    try {
      const result = await this.emailService.sendEmail(dto.to, subject, dto.template, dto.data);
      if (result) {
        this.trackAnalyticsEvent('notification_email_sent', 'system', {
          type: 'email',
          template: dto.template,
        });
      }
      return result;
    } catch (error) {
      this.logger.error(
        `sendTemplatedEmail failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  /**
   * Daily digest (notification_digest): emails each user a summary of their
   * unread notifications since the last digest (24h default), tracked via a
   * per-user Redis marker so digests never duplicate. Flag off → 403.
   * Admin-triggered via POST /v1/notifications/admin/digest/send.
   */
  async sendDailyDigest(userId?: string): Promise<{
    success: boolean;
    data: { sent: number; skipped: number; users: number };
  }> {
    if (!(await this.featureFlagService.isEnabled(notificationFlags.digest))) {
      throw new ForbiddenException('Daily digests are not enabled');
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const targetUserIds: string[] = [];

    if (userId) {
      targetUserIds.push(userId);
    } else {
      const rows = await this.prisma.notification.findMany({
        where: { readAt: null, createdAt: { gte: cutoff } },
        select: { userId: true },
        distinct: ['userId'],
      });
      targetUserIds.push(...rows.map((r) => r.userId));
    }

    let sent = 0;
    let skipped = 0;

    for (const targetId of targetUserIds) {
      try {
        const marker = `notification:digest:last:${targetId}`;
        const lastSentRaw = await this.redisService.get(marker);
        const since = lastSentRaw ? new Date(parseInt(lastSentRaw, 10)) : cutoff;

        const items = await this.prisma.notification.findMany({
          where: { userId: targetId, readAt: null, createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            createdAt: true,
          },
        });

        if (items.length === 0) {
          skipped++;
          continue;
        }

        const user = await this.getUserData(targetId);
        if (!user?.email) {
          skipped++;
          continue;
        }

        const digestHtml = items
          .map(
            (item) =>
              `<li><strong>${item.title.replace(/</g, '&lt;')}</strong> — ${item.message.replace(/</g, '&lt;')}</li>`
          )
          .join('');

        const ok = await this.emailService.sendEmail(
          user.email,
          NotificationsService.EMAIL_SUBJECTS['digest'],
          'digest',
          { count: items.length, items: digestHtml, displayName: user.displayName || 'there' }
        );
        if (ok) {
          sent++;
          await this.redisService.set(marker, String(Date.now()), 7 * 24 * 3600);
          this.trackAnalyticsEvent('notification_digest_sent', targetId, {
            count: items.length,
          });
        } else {
          skipped++;
        }
      } catch (error) {
        this.logger.warn(`Digest failed for user ${targetId}: ${(error as Error).message}`);
        skipped++;
      }
    }

    return {
      success: true,
      data: { sent, skipped, users: targetUserIds.length },
    };
  }

  async sendEmailNotification(userId: string, subject: string, body: string): Promise<boolean> {
    // Channel kill-switch: halt transactional email sends instantly.
    if (!(await this.featureFlagService.isEnabled(notificationFlags.emailEnabled))) {
      this.logger.warn(`Email notifications disabled by flag; skipping user ${userId}`);
      return false;
    }
    try {
      const user = await this.getUserData(userId);
      if (!user?.email) {
        this.logger.error(`User ${userId} not found or has no email`);
        return false;
      }

      // Escape HTML entities to prevent XSS while preserving text content
      const sanitizedBody = body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      const result = this.emailService.sendCustomEmail(
        user.email,
        subject,
        `<p>${sanitizedBody}</p>`
      );
      this.trackAnalyticsEvent('notification_email_sent', userId, { type: 'email' });
      return result;
    } catch (error) {
      this.logger.error(
        `sendEmailNotification failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendWelcomeEmail(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserData(userId);
      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      return this.emailService.sendEmail(user.email, 'Welcome to Azeebo+!', 'welcome', {
        displayName: user.displayName,
      });
    } catch (error) {
      this.logger.error(
        `sendWelcomeEmail failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendPasswordResetEmail(userId: string, resetLink: string): Promise<boolean> {
    try {
      const user = await this.getUserData(userId);
      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      return this.emailService.sendEmail(user.email, 'Password Reset Request', 'password-reset', {
        displayName: user.displayName,
        resetLink,
      });
    } catch (error) {
      this.logger.error(
        `sendPasswordResetEmail failed: ${(error as Error).message}`,
        (error as Error).stack
      );
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
      const user = await this.getUserData(userId);
      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      return this.emailService.sendEmail(
        user.email,
        'Payment Confirmation',
        'payment-confirmation',
        {
          displayName: user.displayName,
          transactionId,
          amount,
          currency,
          description,
          date: new Date().toLocaleDateString(),
        }
      );
    } catch (error) {
      this.logger.error(
        `sendPaymentConfirmationEmail failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendContentPublishedEmail(
    userId: string,
    contentTitle: string,
    contentLink: string
  ): Promise<boolean> {
    try {
      const user = await this.getUserData(userId);
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
      this.logger.error(
        `sendContentPublishedEmail failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendContentFeaturedEmail(
    userId: string,
    contentTitle: string,
    contentLink: string
  ): Promise<boolean> {
    try {
      const user = await this.getUserData(userId);
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
      this.logger.error(
        `sendContentFeaturedEmail failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendSmsNotification(userId: string, message: string): Promise<boolean> {
    // Channel kill-switch: halt SMS sends instantly.
    if (!(await this.featureFlagService.isEnabled(notificationFlags.smsEnabled))) {
      this.logger.warn(`SMS notifications disabled by flag; skipping user ${userId}`);
      return false;
    }
    try {
      // Get user phone number via user-service
      const user = await this.getUserData(userId);

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return false;
      }

      // Assuming user has a phone field
      if (!user.phone) {
        this.logger.error(`User ${userId} has no phone number`);
        return false;
      }

      const result = this.smsService.sendSms(user.phone, message);
      this.trackAnalyticsEvent('notification_sms_sent', userId, { type: 'sms' });
      return result;
    } catch (error) {
      this.logger.error(
        `sendSmsNotification failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendWelcomeSms(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserData(userId);
      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'welcome', {
        displayName: user.displayName,
      });
    } catch (error) {
      this.logger.error(
        `sendWelcomeSms failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendPasswordResetSms(userId: string, resetCode: string): Promise<boolean> {
    try {
      const user = await this.getUserData(userId);
      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'password-reset', {
        resetCode,
      });
    } catch (error) {
      this.logger.error(
        `sendPasswordResetSms failed: ${(error as Error).message}`,
        (error as Error).stack
      );
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
      const user = await this.getUserData(userId);
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
      this.logger.error(
        `sendPaymentConfirmationSms failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendContentPublishedSms(userId: string, contentTitle: string): Promise<boolean> {
    try {
      const user = await this.getUserData(userId);
      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'content-published', {
        contentTitle,
      });
    } catch (error) {
      this.logger.error(
        `sendContentPublishedSms failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendContentFeaturedSms(userId: string, contentTitle: string): Promise<boolean> {
    try {
      const user = await this.getUserData(userId);
      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'content-featured', {
        contentTitle,
      });
    } catch (error) {
      this.logger.error(
        `sendContentFeaturedSms failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }

  async sendAccountVerificationSms(userId: string, verificationCode: string): Promise<boolean> {
    try {
      const user = await this.getUserData(userId);
      if (!user || !user.phone) {
        this.logger.error(`User ${userId} not found or has no phone number`);
        return false;
      }

      return this.smsService.sendSmsWithTemplate(user.phone, 'account-verification', {
        verificationCode,
      });
    } catch (error) {
      this.logger.error(
        `sendAccountVerificationSms failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return false;
    }
  }
}
