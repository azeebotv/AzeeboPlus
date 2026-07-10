import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotificationStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalNotifications, todayNotifications, unreadCount, thisWeek] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { createdAt: { gte: today } } }),
      this.prisma.notification.count({ where: { readAt: null } }),
      this.prisma.notification.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    return {
      totalNotifications,
      todayNotifications,
      unreadCount,
      thisWeekNotifications: thisWeek,
    };
  }

  async getNotifications(page = 1, limit = 20, type?: string) {
    const skip = (page - 1) * limit;
    const where = type ? { type } : {};
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: notifications,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async getTemplates() {
    // Get unique notification types from the database
    const types = await this.prisma.notification.findMany({
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' },
    });

    return types.map((t) => ({
      id: t.type,
      name: t.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      type: t.type,
    }));
  }
}
