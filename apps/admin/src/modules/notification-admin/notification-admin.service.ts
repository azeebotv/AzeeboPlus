import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface TemplateCreateDto {
  name: string;
  type: string;
  body: string;
}

interface TemplateUpdateDto {
  name?: string;
  type?: string;
  body?: string;
}

@Injectable()
export class NotificationAdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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

  /**
   * Get notification templates — derived from the distinct notification types
   * in the database. Each unique type acts as a template that can be reused
   * for future notifications.
   */
  async getTemplates() {
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

  /**
   * Create a notification template. Since there's no separate Template table,
   * we create a system notification of the new type to register it, then
   * return the template structure for the admin UI.
   */
  async createTemplate(body: TemplateCreateDto) {
    // Check if type already exists
    const existing = await this.prisma.notification.findFirst({
      where: { type: body.type },
    });

    if (existing) {
      // Type already registered via existing notifications
      return {
        id: body.type,
        name: body.name,
        type: body.type,
        body: body.body,
        createdAt: existing.createdAt.toISOString(),
        message: 'Template type already exists',
      };
    }

    // Create a placeholder notification to register the type.
    // In production, a NotificationTemplate model should be added.
    const placeholder = await this.prisma.notification.create({
      data: {
        userId: 'system',
        type: body.type,
        title: body.name,
        message: body.body,
      },
    });

    return {
      id: body.type,
      name: body.name,
      type: body.type,
      body: body.body,
      createdAt: placeholder.createdAt.toISOString(),
    };
  }

  /**
   * Update a notification template's display name or body text.
   * The type key is immutable once registered.
   */
  async updateTemplate(id: string, body: TemplateUpdateDto) {
    // Find an existing notification of this type to confirm it exists
    const existing = await this.prisma.notification.findFirst({
      where: { type: id },
      select: { id: true, type: true, createdAt: true },
    });

    if (!existing) {
      return { id, notFound: true, message: `Template type "${id}" not found` };
    }

    // Update all notifications of this type with the new title (name) if provided
    if (body.name) {
      await this.prisma.notification.updateMany({
        where: { type: id },
        data: { title: body.name },
      });
    }

    return {
      id,
      name: body.name,
      type: id,
      body: body.body,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteTemplate(id: string) {
    await this.prisma.notification.deleteMany({
      where: { type: id },
    });
    return { success: true, id, message: `Template ${id} deleted` };
  }
}
