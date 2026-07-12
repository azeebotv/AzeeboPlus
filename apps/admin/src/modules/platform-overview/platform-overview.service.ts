import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PlatformOverviewService {
  private readonly logger = new Logger(PlatformOverviewService.name);
  private readonly subscriptionServiceUrl =
    process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3026';

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

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
      this.getActiveSubscriptions(),
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

  private async getActiveSubscriptions(): Promise<number> {
    try {
      const response = await fetch(`${this.subscriptionServiceUrl}/v1/subscriptions/stats/active`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = (await response.json()) as { data?: { count?: number } };
        return data.data?.count ?? 0;
      }
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to fetch active subscriptions: ${(error as Error).message}`);
      return 0;
    }
  }
}
