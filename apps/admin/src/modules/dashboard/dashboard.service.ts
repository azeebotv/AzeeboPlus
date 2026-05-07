import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface DashboardStats {
  totalUsers: number;
  totalContent: number;
  totalRevenue: number;
  pendingReports: number;
  activeCreators: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface ContentTrend {
  date: string;
  published: number;
  drafts: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, totalContent, pendingReports, activeCreators] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.contentItem.count(),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.user.count({ where: { role: 'creator' } }),
    ]);

    const totalRevenue = await this.prisma.walletTransaction.aggregate({
      where: { type: 'credit', status: 'completed' },
      _sum: { amount: true },
    });

    return {
      totalUsers,
      totalContent,
      totalRevenue: Number(totalRevenue._sum.amount) || 0,
      pendingReports,
      activeCreators,
    };
  }

  async getRevenueData(days = 30): Promise<RevenueData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.prisma.walletTransaction.findMany({
      where: {
        type: 'credit',
        status: 'completed',
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    const revenueByDate = transactions.reduce(
      (acc, tx) => {
        const date = tx.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + Number(tx.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  async getContentTrend(days = 30): Promise<ContentTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const content = await this.prisma.contentItem.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    const trendByDate = content.reduce(
      (acc, item) => {
        const date = item.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { published: 0, drafts: 0 };
        }
        if (item.status === 'published') {
          acc[date].published++;
        } else if (item.status === 'draft') {
          acc[date].drafts++;
        }
        return acc;
      },
      {} as Record<string, { published: number; drafts: number }>
    );

    return Object.entries(trendByDate).map(([date, trend]) => ({
      date,
      ...trend,
    }));
  }

  async getTopContent(limit = 10): Promise<unknown> {
    const content = await this.prisma.contentItem.findMany({
      where: { status: 'published' },
      orderBy: { viewCount: 'desc' },
      take: limit,
      include: {
        creator: { select: { displayName: true } },
        universe: { select: { displayName: true } },
      },
    });

    return content.map((c) => ({
      id: c.id,
      title: c.title,
      viewCount: c.viewCount,
      creator: c.creator.displayName,
      universe: c.universe.displayName,
    }));
  }

  async getTopCreators(limit = 10): Promise<unknown> {
    const creators = await this.prisma.user.findMany({
      where: { role: 'creator' },
      include: {
        _count: { select: { contentItems: true } },
        contentItems: {
          where: { status: 'published' },
          select: { viewCount: true },
        },
      },
      take: limit,
    });

    return creators
      .map((c) => ({
        id: c.id,
        displayName: c.displayName,
        avatar: c.avatar,
        contentCount: c._count.contentItems,
        totalViews: c.contentItems.reduce((sum, item) => sum + item.viewCount, 0),
      }))
      .sort((a, b) => b.totalViews - a.totalViews);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRecentActivity(_limit = 20): Promise<unknown> {
    const [recentUsers, recentContent, recentReports] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          displayName: true,
          email: true,
          createdAt: true,
          role: true,
        },
      }),
      this.prisma.contentItem.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          creator: { select: { displayName: true } },
        },
      }),
      this.prisma.report.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          reason: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      recentUsers,
      recentContent,
      recentReports,
    };
  }
}
