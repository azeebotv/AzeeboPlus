import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SupportDashboardService {
  private readonly logger = new Logger(SupportDashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getStats() {
    try {
      const [
        openTickets,
        pendingRefunds,
        pendingChargebacks,
        pendingAppeals,
        pendingTakedowns,
        pendingDisputes,
        activeSuspensions,
      ] = await Promise.all([
        this.prisma.supportTicket.count({
          where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING_INFO', 'ESCALATED'] } },
        }),
        this.prisma.refund.count({ where: { status: 'PENDING' } }),
        this.prisma.chargeback.count({ where: { status: 'PENDING' } }),
        this.prisma.appeal.count({ where: { status: 'PENDING' } }),
        this.prisma.contentTakedown.count({ where: { status: 'PENDING' } }),
        this.prisma.payoutDispute.count({ where: { status: 'PENDING' } }),
        this.prisma.userSuspension.count({ where: { status: 'ACTIVE' } }),
      ]);

      return {
        openTickets,
        pendingRefunds,
        pendingChargebacks,
        pendingAppeals,
        pendingTakedowns,
        pendingDisputes,
        activeSuspensions,
      };
    } catch (error) {
      this.logger.error(`getStats failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getRecentActivity() {
    try {
      const recentTickets = await this.prisma.supportTicket.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          category: true,
          status: true,
          priority: true,
          subject: true,
          userId: true,
          createdAt: true,
        },
      });

      const recentRefunds = await this.prisma.refund.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          reason: true,
          userId: true,
          createdAt: true,
        },
      });

      const recentAppeals = await this.prisma.appeal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          appealType: true,
          status: true,
          reason: true,
          userId: true,
          createdAt: true,
        },
      });

      const activities = [
        ...recentTickets.map((t) => ({
          type: 'ticket' as const,
          id: t.id,
          category: t.category,
          status: t.status,
          priority: t.priority,
          summary: t.subject,
          userId: t.userId,
          createdAt: t.createdAt,
        })),
        ...recentRefunds.map((r) => ({
          type: 'refund' as const,
          id: r.id,
          category: 'REFUND' as const,
          status: r.status,
          priority: 'HIGH' as const,
          summary: r.reason,
          userId: r.userId,
          amount: r.amount,
          currency: r.currency,
          createdAt: r.createdAt,
        })),
        ...recentAppeals.map((a) => ({
          type: 'appeal' as const,
          id: a.id,
          category: 'ACCOUNT_APPEAL' as const,
          status: a.status,
          priority: 'MEDIUM' as const,
          summary: a.reason,
          userId: a.userId,
          createdAt: a.createdAt,
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);

      return { activities };
    } catch (error) {
      this.logger.error(
        `getRecentActivity failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async getSlaMetrics() {
    try {
      const resolvedTickets = await this.prisma.supportTicket.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      if (resolvedTickets.length === 0) {
        return { avgResponseTime: 0, avgResolutionTime: 0, slaCompliance: 0 };
      }

      let totalResponseMs = 0;
      let totalResolutionMs = 0;
      let withinSla = 0;
      const slaTargetMs = 24 * 60 * 60 * 1000; // 24 hours

      for (const ticket of resolvedTickets) {
        const resolutionMs = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
        totalResolutionMs += resolutionMs;
        totalResponseMs += resolutionMs; // Approximate response time as resolution time
        if (resolutionMs <= slaTargetMs) {
          withinSla++;
        }
      }

      const count = resolvedTickets.length;
      return {
        avgResponseTime: Math.round(totalResponseMs / count),
        avgResolutionTime: Math.round(totalResolutionMs / count),
        slaCompliance: Math.round((withinSla / count) * 100),
      };
    } catch (error) {
      this.logger.error(
        `getSlaMetrics failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }
}
