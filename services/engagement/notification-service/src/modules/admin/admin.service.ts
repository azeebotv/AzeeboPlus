import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../../prisma/client/index.js';
import axios from 'axios';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly userServiceUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.userServiceUrl = this.configService.get<string>(
      'USER_SERVICE_URL',
      'http://user-service:3001'
    );
  }

  async getStats() {
    try {
      const totalSent = await this.prisma.notification.count();
      const unread = await this.prisma.notification.count({
        where: { readAt: null },
      });
      const read = await this.prisma.notification.count({
        where: { readAt: { not: null } },
      });

      const typeBreakdown = await this.prisma.notification.groupBy({
        by: ['type'],
        _count: { id: true },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sentToday = await this.prisma.notification.count({
        where: { createdAt: { gte: today } },
      });

      return {
        totalSent,
        unread,
        read,
        sentToday,
        byType: typeBreakdown.map((t) => ({
          type: t.type,
          count: t._count.id,
        })),
      };
    } catch (error) {
      this.logger.error(`getStats failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getNotifications(options?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (options?.type) {
        where.type = options.type;
      }
      if (options?.status === 'read') {
        where.readAt = { not: null };
      } else if (options?.status === 'unread') {
        where.readAt = null;
      }

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.notification.count({ where }),
      ]);

      return {
        notifications,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `getNotifications failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async sendSystemNotification(body: {
    title: string;
    message: string;
    type?: string;
    userIds?: string[];
  }) {
    try {
      const { title, message, type, userIds } = body;

      if (userIds && userIds.length > 0) {
        const notifications = await this.prisma.$transaction(
          userIds.map((userId) =>
            this.prisma.notification.create({
              data: {
                userId,
                title,
                message,
                type: type || 'system',
              },
            })
          )
        );

        this.logger.log(`Sent system notification to ${notifications.length} users`);
        return { sentCount: notifications.length, userIds };
      }

      // Fetch user IDs from user-service for broadcast
      try {
        const usersResponse = await axios.get(`${this.userServiceUrl}/users`, {
          params: { limit: 10000 },
          timeout: 15000,
          headers: { 'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', '') },
        });
        const allUserIds: string[] = (usersResponse.data?.data || usersResponse.data || [])
          .map((u: { id: string }) => u.id)
          .filter(Boolean);

        if (allUserIds.length === 0) {
          this.logger.warn('No users found for broadcast notification');
          return { sentCount: 0, userIds: [] };
        }

        const notifications = await this.prisma.$transaction(
          allUserIds.map((userId) =>
            this.prisma.notification.create({
              data: {
                userId,
                title,
                message,
                type: type || 'system',
              },
            })
          )
        );

        this.logger.log(`Sent broadcast notification to ${notifications.length} users`);
        return { sentCount: notifications.length, userIds: allUserIds };
      } catch (fetchError) {
        this.logger.error(`Failed to fetch users for broadcast: ${(fetchError as Error).message}`);
        return { sentCount: 0, userIds: [], error: 'Failed to fetch user list for broadcast' };
      }
    } catch (error) {
      this.logger.error(
        `sendSystemNotification failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  // Template CRUD
  async getTemplates(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationTemplate.count(),
    ]);

    return { templates, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createTemplate(data: {
    key: string;
    channel: string;
    subject?: string;
    body: string;
    variables?: string[];
  }) {
    const template = await this.prisma.notificationTemplate.create({
      data: {
        key: data.key,
        channel: data.channel,
        subject: data.subject,
        body: data.body,
        variables: data.variables || [],
      },
    });
    return { success: true, template };
  }

  async updateTemplate(id: string, data: Record<string, unknown>) {
    const template = await this.prisma.notificationTemplate.update({ where: { id }, data });
    return { success: true, template };
  }

  async deleteTemplate(id: string) {
    await this.prisma.notificationTemplate.delete({ where: { id } });
    return { success: true };
  }

  // Campaign CRUD
  async getCampaigns(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.campaign.count(),
    ]);

    return { campaigns, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createCampaign(data: {
    name: string;
    templateKey: string;
    channel: string;
    audience?: Record<string, unknown>;
    scheduledAt?: string;
  }) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: data.name,
        templateKey: data.templateKey,
        channel: data.channel,
        audience: (data.audience || {}) as Prisma.InputJsonValue,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
    });
    return { success: true, campaign };
  }

  async sendCampaign(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    // Mark as sending
    await this.prisma.campaign.update({
      where: { id },
      data: { status: 'sending' },
    });

    try {
      // Resolve audience from campaign criteria
      let targetUserIds: string[] = [];

      const audience = (campaign.audience as Record<string, unknown>) || {};
      if (audience.userIds && Array.isArray(audience.userIds)) {
        targetUserIds = audience.userIds as string[];
      } else {
        // Fetch all users as default audience
        const usersResponse = await axios.get(`${this.userServiceUrl}/users`, {
          params: { limit: 10000 },
          timeout: 15000,
          headers: { 'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', '') },
        });
        targetUserIds = (usersResponse.data?.data || usersResponse.data || [])
          .map((u: { id: string }) => u.id)
          .filter(Boolean);
      }

      if (targetUserIds.length === 0) {
        await this.prisma.campaign.update({
          where: { id },
          data: { status: 'failed' },
        });
        return { success: false, error: 'No target users found for campaign' };
      }

      // Look up the template
      const template = await this.prisma.notificationTemplate.findUnique({
        where: { key: campaign.templateKey },
      });

      const title = template?.subject || campaign.name;
      const message = template?.body || `Campaign: ${campaign.name}`;

      // Create notifications for all target users
      await this.prisma.$transaction(
        targetUserIds.map((userId) =>
          this.prisma.notification.create({
            data: {
              userId,
              title,
              message,
              type: `campaign_${campaign.channel}`,
            },
          })
        )
      );

      // Mark campaign as sent
      await this.prisma.campaign.update({
        where: { id },
        data: { status: 'sent' },
      });

      this.logger.log(`Campaign ${id} sent to ${targetUserIds.length} users`);
      return { success: true, campaign, sentCount: targetUserIds.length };
    } catch (error) {
      await this.prisma.campaign.update({
        where: { id },
        data: { status: 'failed' },
      });
      this.logger.error(`Campaign ${id} failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }
}
