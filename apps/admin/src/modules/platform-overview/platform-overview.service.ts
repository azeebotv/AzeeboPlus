import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { buildServiceStampHeaders } from '../../common/upstream-auth.middleware';

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
      const response = await fetch(`${this.subscriptionServiceUrl}/v1/admin/stats`, {
        // The endpoint sits behind subscription-service's global
        // ServiceAuthGuard: a bare fetch 401s and this method silently
        // degrades to a fabricated 0. Forward the caller's identity when
        // handling a request; use a service stamp for background calls.
        headers: buildServiceStampHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = (await response.json()) as { data?: { activeSubscriptions?: number } };
        return data.data?.activeSubscriptions ?? 0;
      }
      // A refused upstream is a real outage, not "zero subscriptions" — log
      // loudly so the gap is visible instead of silently fake.
      this.logger.warn(
        `subscription-service /admin/stats returned ${response.status}; reporting activeSubscriptions as 0`
      );
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to fetch active subscriptions: ${(error as Error).message}`);
      return 0;
    }
  }
}
