import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
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
  }

  async getNotifications(options?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) {
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
        include: {
          user: {
            select: { id: true, displayName: true, email: true },
          },
        },
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
  }

  async sendSystemNotification(body: {
    title: string;
    message: string;
    type?: string;
    userIds?: string[];
  }) {
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
          }),
        ),
      );

      this.logger.log(`Sent system notification to ${notifications.length} users`);
      return { sentCount: notifications.length, userIds };
    }

    const allUsers = await this.prisma.user.findMany({
      select: { id: true },
    });

    const batchSize = 100;
    let sentCount = 0;

    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      await this.prisma.$transaction(
        batch.map((user) =>
          this.prisma.notification.create({
            data: {
              userId: user.id,
              title,
              message,
              type: type || 'system',
            },
          }),
        ),
      );
      sentCount += batch.length;
    }

    this.logger.log(`Sent system notification to all ${sentCount} users`);
    return { sentCount, broadcast: true };
  }
}
