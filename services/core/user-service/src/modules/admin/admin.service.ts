import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

interface AuditLogEntry {
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private async logAudit(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: (entry.details || {}) as Prisma.InputJsonValue,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }

  async getAllSubscriptions(options?: { page?: number; limit?: number; status?: string }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where = options?.status ? { status: options.status } : {};

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      subscriptions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubscriptionById(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async updateSubscription(
    subscriptionId: string,
    updateData: Record<string, unknown>,
    actorId: string,
    actorRole: string
  ) {
    const existing = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    const result = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    await this.logAudit({
      actorId,
      actorRole,
      action: 'subscription.updated',
      targetType: 'subscription',
      targetId: subscriptionId,
      details: {
        previousStatus: existing.status,
        newStatus: updateData.status,
        changes: Object.keys(updateData),
      },
    });

    return result;
  }

  async deleteSubscription(subscriptionId: string, actorId: string, actorRole: string) {
    const existing = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.delete({
      where: { id: subscriptionId },
    });

    await this.logAudit({
      actorId,
      actorRole,
      action: 'subscription.deleted',
      targetType: 'subscription',
      targetId: subscriptionId,
      details: {
        userId: existing.userId,
        planType: existing.planType,
        status: existing.status,
      },
    });

    return { message: 'Subscription deleted successfully' };
  }

  async getUserPreferences(userId: string) {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      throw new NotFoundException('Preferences not found');
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    preferences: Record<string, unknown>,
    actorId: string,
    actorRole: string
  ) {
    const existing = await this.prisma.userPreferences.findUnique({ where: { userId } });
    if (!existing) {
      throw new NotFoundException('Preferences not found');
    }

    const result = await this.prisma.userPreferences.update({
      where: { userId },
      data: preferences,
    });

    await this.logAudit({
      actorId,
      actorRole,
      action: 'user.preferences.updated',
      targetType: 'user',
      targetId: userId,
      details: {
        changes: Object.keys(preferences),
      },
    });

    return result;
  }

  async getUserStats() {
    const [totalSubscriptions, activeSubscriptions, totalWatchHistory, totalSavedItems] =
      await Promise.all([
        this.prisma.subscription.count(),
        this.prisma.subscription.count({ where: { status: 'active' } }),
        this.prisma.watchHistory.count(),
        this.prisma.savedItem.count(),
      ]);

    const recentSubscriptions = await this.prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalSubscriptions,
      activeSubscriptions,
      totalWatchHistory,
      totalSavedItems,
      recentSubscriptions,
    };
  }

  async deleteWatchHistory(
    userId: string,
    contentId: string | undefined,
    actorId: string,
    actorRole: string
  ) {
    if (contentId) {
      const existing = await this.prisma.watchHistory.findUnique({
        where: { userId_contentId: { userId, contentId } },
      });
      if (!existing) {
        throw new NotFoundException('Watch history item not found');
      }

      await this.prisma.watchHistory.delete({
        where: { userId_contentId: { userId, contentId } },
      });

      await this.logAudit({
        actorId,
        actorRole,
        action: 'user.watch_history.item_deleted',
        targetType: 'watch_history',
        targetId: contentId,
        details: {
          userId,
          contentId,
        },
      });
    } else {
      const count = await this.prisma.watchHistory.count({ where: { userId } });

      await this.prisma.watchHistory.deleteMany({
        where: { userId },
      });

      await this.logAudit({
        actorId,
        actorRole,
        action: 'user.watch_history.deleted',
        targetType: 'user',
        targetId: userId,
        details: {
          deletedCount: count,
        },
      });
    }

    return { message: 'Watch history deleted successfully' };
  }

  async deleteSavedItems(
    userId: string,
    contentId: string | undefined,
    actorId: string,
    actorRole: string
  ) {
    if (contentId) {
      const existing = await this.prisma.savedItem.findUnique({
        where: { userId_contentId: { userId, contentId } },
      });
      if (!existing) {
        throw new NotFoundException('Saved item not found');
      }

      await this.prisma.savedItem.delete({
        where: { userId_contentId: { userId, contentId } },
      });

      await this.logAudit({
        actorId,
        actorRole,
        action: 'user.saved_items.item_deleted',
        targetType: 'saved_item',
        targetId: contentId,
        details: {
          userId,
          contentId,
        },
      });
    } else {
      const count = await this.prisma.savedItem.count({ where: { userId } });

      await this.prisma.savedItem.deleteMany({
        where: { userId },
      });

      await this.logAudit({
        actorId,
        actorRole,
        action: 'user.saved_items.deleted',
        targetType: 'user',
        targetId: userId,
        details: {
          deletedCount: count,
        },
      });
    }

    return { message: 'Saved items deleted successfully' };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followerCount = await this.prisma.following.count({ where: { followingId: userId } });
    const followingCount = await this.prisma.following.count({ where: { followerId: userId } });

    return {
      ...user,
      followerCount,
      followingCount,
    };
  }

  async updateUser(
    userId: string,
    updateData: Record<string, unknown>,
    actorId: string,
    actorRole: string
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await this.logAudit({
      actorId,
      actorRole,
      action: 'user.updated',
      targetType: 'user',
      targetId: userId,
      details: {
        previousRole: existing.role,
        newRole: updateData.role,
        changes: Object.keys(updateData),
      },
    });

    return result;
  }

  async suspendUser(userId: string, reason: string, actorId: string, actorRole: string) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'suspended',
      },
    });

    await this.logAudit({
      actorId,
      actorRole,
      action: 'user.suspended',
      targetType: 'user',
      targetId: userId,
      details: {
        previousRole: existing.role,
        reason,
      },
    });

    return result;
  }

  async moderateContent(
    contentId: string,
    action: string,
    reason: string,
    actorId: string,
    actorRole: string
  ) {
    // Content moderation is handled by content-service and moderation-service
    throw new NotFoundException(
      'Content moderation is handled by content-service. Use the content-service admin API instead.'
    );
  }

  async getModerationReports(page = 1, limit = 20, status?: string) {
    // Moderation reports are handled by moderation-service
    throw new NotFoundException(
      'Moderation reports are handled by moderation-service. Use the moderation-service admin API instead.'
    );
  }

  async resolveReport(reportId: string, resolution: string, actorId: string, actorRole: string) {
    // Report resolution is handled by moderation-service
    throw new NotFoundException(
      'Report resolution is handled by moderation-service. Use the moderation-service admin API instead.'
    );
  }

  async getAuditLogs(page = 1, limit = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const where = userId ? { actorId: userId } : {};

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVerificationRequests(page = 1, limit = 20, status?: string) {
    // Creator verification is handled by creator-service
    throw new NotFoundException(
      'Creator verification is handled by creator-service. Use the creator-service admin API instead.'
    );
  }

  async verifyCreator(
    creatorId: string,
    status: string,
    notes: string | undefined,
    actorId: string,
    actorRole: string
  ) {
    // Creator verification is handled by creator-service
    throw new NotFoundException(
      'Creator verification is handled by creator-service. Use the creator-service admin API instead.'
    );
  }
}
