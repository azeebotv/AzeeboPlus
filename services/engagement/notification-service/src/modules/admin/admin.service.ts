import {Inject,  Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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

      // Without a User model in this service, broadcast to all users is not supported.
      // Use the user-service to fetch user IDs and send targeted notifications.
      this.logger.warn('Broadcast notification without userIds is not supported — use targeted notifications');
      return { sentCount: 0, userIds: [] };
    } catch (error) {
      this.logger.error(
        `sendSystemNotification failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }
}
