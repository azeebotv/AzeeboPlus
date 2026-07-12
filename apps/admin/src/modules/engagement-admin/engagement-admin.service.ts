import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class EngagementAdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getEngagementMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalViews, totalContent, activeUsers, newUsersThisWeek, totalTransactions] =
      await Promise.all([
        this.prisma.contentItem.aggregate({ _sum: { viewCount: true } }),
        this.prisma.contentItem.count({ where: { status: 'published' } }),
        this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        this.prisma.walletTransaction.count({
          where: { createdAt: { gte: today }, status: 'completed' },
        }),
      ]);

    return {
      totalViews: totalViews._sum.viewCount || 0,
      totalContent,
      activeUsers,
      newUsersThisWeek,
      dailyTransactions: totalTransactions,
    };
  }

  async getEngagementTrends(range: '7d' | '30d' | '90d' = '30d') {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    const content = await this.prisma.contentItem.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true },
    });

    const userByDate = users.reduce(
      (acc, u) => {
        const date = u.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const contentByDate = content.reduce(
      (acc, c) => {
        const date = c.createdAt.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { published: 0, drafts: 0 };
        if (c.status === 'published') acc[date].published++;
        else acc[date].drafts++;
        return acc;
      },
      {} as Record<string, { published: number; drafts: number }>
    );

    const allDates = [
      ...new Set([...Object.keys(userByDate), ...Object.keys(contentByDate)]),
    ].sort();

    return allDates.map((date) => ({
      date,
      newUsers: userByDate[date] || 0,
      publishedContent: contentByDate[date]?.published || 0,
      draftContent: contentByDate[date]?.drafts || 0,
    }));
  }
}
