import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CronTasksService {
  private readonly logger = new Logger(CronTasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanupStalePaymentIntents(): Promise<void> {
    this.logger.log('Running stale payment intent cleanup...');

    try {
      const staleThreshold = new Date(Date.now() - 30 * 60 * 1000);

      const result = await this.prisma.paymentIntent.updateMany({
        where: {
          status: 'pending',
          createdAt: { lt: staleThreshold },
        },
        data: {
          status: 'expired',
          metadata: {
            expiredBy: 'cron',
            expiredAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`Expired ${result.count} stale payment intents`);
    } catch (error) {
      this.logger.error('Failed to cleanup stale payment intents', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupStalePromoBalances(): Promise<void> {
    this.logger.log('Running stale promo balance cleanup...');

    try {
      const expiredThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await this.prisma.promoBalance.updateMany({
        where: {
          status: 'active',
          expiresAt: { lt: expiredThreshold },
        },
        data: {
          status: 'expired',
        },
      });

      this.logger.log(`Expired ${result.count} stale promo balances`);
    } catch (error) {
      this.logger.error('Failed to cleanup stale promo balances', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async archiveOldAuditLogs(): Promise<void> {
    this.logger.log('Running old audit log archival...');

    try {
      const retentionThreshold = new Date();
      retentionThreshold.setFullYear(retentionThreshold.getFullYear() - 1);

      const archivedCount = await this.archiveAuditLogs(retentionThreshold);
      this.logger.log(`Archived ${archivedCount} old audit logs`);
    } catch (error) {
      this.logger.error('Failed to archive old audit logs', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async invalidateExpiredCacheKeys(): Promise<void> {
    this.logger.log('Running expired cache key invalidation...');

    try {
      const result = await this.prisma.cacheKey.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      this.logger.log(`Invalidated ${result.count} expired cache keys`);
    } catch (error) {
      this.logger.error('Failed to invalidate expired cache keys', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEKLY)
  async generateWeeklyReports(): Promise<void> {
    this.logger.log('Running weekly report generation...');

    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const report = await this.generateWeeklyMetrics(weekAgo);

      await this.prisma.report.upsert({
        where: {
          id: `weekly-${this.getWeekIdentifier()}`,
        },
        create: {
          id: `weekly-${this.getWeekIdentifier()}`,
          type: 'weekly_summary',
          data: report,
          createdAt: new Date(),
        },
        update: {
          data: report,
          createdAt: new Date(),
        },
      });

      this.logger.log('Weekly report generated successfully');
    } catch (error) {
      this.logger.error('Failed to generate weekly reports', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanedMedia(): Promise<void> {
    this.logger.log('Running orphaned media cleanup...');

    try {
      const orphanedThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const orphanedMedia = await this.prisma.media.findMany({
        where: {
          createdAt: { lt: orphanedThreshold },
          contentId: null,
        },
        select: { id: true, url: true },
      });

      if (orphanedMedia.length > 0) {
        this.logger.warn(`Found ${orphanedMedia.length} orphaned media files that may need manual review`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup orphaned media', error);
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async syncUserWallets(): Promise<void> {
    this.logger.log('Running user wallet sync...');

    try {
      const result = await this.prisma.wallet.updateMany({
        where: {
          lastSyncedAt: {
            lt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          },
        },
        data: {
          lastSyncedAt: new Date(),
        },
      });

      this.logger.log(`Synced ${result.count} user wallets`);
    } catch (error) {
      this.logger.error('Failed to sync user wallets', error);
    }
  }

  private async archiveAuditLogs(retentionThreshold: Date): Promise<number> {
    try {
      const logsToArchive = await this.prisma.auditLog.findMany({
        where: {
          createdAt: { lt: retentionThreshold },
          archived: false,
        },
        take: 1000,
        orderBy: { createdAt: 'asc' },
      });

      if (logsToArchive.length === 0) {
        return 0;
      }

      const archivedData = logsToArchive.map((log) => ({
        ...log,
        archived: true,
        archivedAt: new Date(),
      }));

      await this.prisma.auditLogArchive.createMany({
        data: archivedData,
      });

      await this.prisma.auditLog.deleteMany({
        where: {
          id: { in: logsToArchive.map((log) => log.id) },
        },
      });

      return logsToArchive.length;
    } catch (error) {
      this.logger.error('Error archiving audit logs', error);
      return 0;
    }
  }

  private async generateWeeklyMetrics(weekAgo: Date): Promise<object> {
    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      newUsers,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.paymentIntent.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      this.prisma.paymentIntent.count({
        where: { createdAt: { gte: weekAgo }, status: 'completed' },
      }),
      this.prisma.paymentIntent.count({
        where: { createdAt: { gte: weekAgo }, status: 'failed' },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      this.prisma.paymentIntent.aggregate({
        where: { createdAt: { gte: weekAgo }, status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    return {
      period: {
        start: weekAgo.toISOString(),
        end: new Date().toISOString(),
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        failed: failedPayments,
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
      },
      users: {
        new: newUsers,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        currency: 'NGN',
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private getWeekIdentifier(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = Math.ceil(
      (now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }
}