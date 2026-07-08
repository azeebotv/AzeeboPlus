import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PlatformOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      newUsersToday,
      totalContent,
      publishedContent,
      totalWallets,
      totalBalance,
      activeSubscriptions,
      pendingReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.contentItem.count(),
      this.prisma.contentItem.count({ where: { status: 'published' } }),
      this.prisma.wallet.count(),
      this.prisma.wallet.aggregate({ _sum: { balance: true } }),
      this.prisma.contentItem.count({ where: { status: 'published' } }),
      this.prisma.report.count({ where: { status: 'pending' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
      },
      content: {
        total: totalContent,
        published: publishedContent,
      },
      wallet: {
        totalWallets,
        totalBalance: Number(totalBalance._sum.balance) || 0,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
      moderation: {
        pendingReports,
      },
    };
  }
}
