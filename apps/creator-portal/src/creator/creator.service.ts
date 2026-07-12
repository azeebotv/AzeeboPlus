import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../database/prisma.service';
import { WalletClientService } from '../api/clients/wallet-client.service';

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'audio' | 'document';
  status: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  thumbnail: string;
  mediaUrl: string | null;
  creatorId: string;
  universeId: string;
  isExclusive: boolean;
  isPremiere: boolean;
  metadata: unknown;
  publishedAt: Date | null;
  releaseDate: Date | null;
}

export interface DashboardStats {
  totalViews: number;
  subscribers: number;
  totalEarnings: number;
  contentCount: number;
  viewsChange: string;
  subscribersChange: string;
  earningsChange: string;
  contentChange: string;
}

export interface AnalyticsData {
  totalViews: number;
  avgWatchTime: string;
  engagementRate: number;
  newSubscribers: number;
  viewsOverTime: { date: string; views: number }[];
  demographics: { region: string; percentage: number }[];
  topContent: { title: string; views: number; engagement: string }[];
}

export interface EarningsData {
  total: number;
  count: number;
  pendingPayout: number;
  lifetimeEarnings: number;
}

@Injectable()
export class CreatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletClient: WalletClientService
  ) {}

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const contentCount = await this.prisma.contentItem.count({
      where: { creatorId: userId, status: { not: 'archived' } },
    });

    const earnings = await this.prisma.walletTransaction.aggregate({
      where: {
        wallet: { userId },
        type: { in: ['earning', 'payout'] },
      },
      _sum: { amount: true },
    });

    const now = Date.now();
    const periodMs = 30 * 24 * 60 * 60 * 1000;
    const currentPeriodStart = new Date(now - periodMs);
    const previousPeriodStart = new Date(now - 2 * periodMs);

    const [currentPeriodViews, previousPeriodViews] = await Promise.all([
      this.prisma.contentItem.aggregate({
        where: {
          creatorId: userId,
          createdAt: { gte: currentPeriodStart },
        },
        _sum: { viewCount: true },
      }),
      this.prisma.contentItem.aggregate({
        where: {
          creatorId: userId,
          createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
        },
        _sum: { viewCount: true },
      }),
    ]);

    const currentViews = currentPeriodViews._sum.viewCount || 0;
    const prevViews = previousPeriodViews._sum.viewCount || 0;
    const viewsChangePercent =
      prevViews > 0 ? (((currentViews - prevViews) / prevViews) * 100).toFixed(1) : '0';

    const [currentPeriodEarnings, previousPeriodEarnings] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where: {
          wallet: { userId },
          type: { in: ['earning', 'payout'] },
          createdAt: { gte: currentPeriodStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          wallet: { userId },
          type: { in: ['earning', 'payout'] },
          createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
        },
        _sum: { amount: true },
      }),
    ]);

    const currentEarnings = Number(currentPeriodEarnings._sum.amount) || 0;
    const prevEarnings = Number(previousPeriodEarnings._sum.amount) || 0;
    const earningsChangePercent =
      prevEarnings > 0 ? (((currentEarnings - prevEarnings) / prevEarnings) * 100).toFixed(1) : '0';

    const currentPeriodContentCount = await this.prisma.contentItem.count({
      where: {
        creatorId: userId,
        createdAt: { gte: currentPeriodStart },
      },
    });
    const previousPeriodContentCount = await this.prisma.contentItem.count({
      where: {
        creatorId: userId,
        createdAt: { gte: previousPeriodStart, lt: currentPeriodStart },
      },
    });
    const contentChange = currentPeriodContentCount - previousPeriodContentCount;

    // Get real subscriber count from following table
    let subscriberCount = 0;
    try {
      subscriberCount = await this.prisma
        .$queryRawUnsafe<
          { count: bigint }[]
        >('SELECT COUNT(*) as count FROM "following" WHERE "followingId" = $1', userId)
        .then((rows) => Number(rows[0]?.count ?? 0));
    } catch {
      // following table may not exist in this database
    }

    return {
      totalViews: currentViews,
      subscribers: subscriberCount,
      totalEarnings: Number(earnings._sum.amount) || 0,
      contentCount,
      viewsChange: `${Number(viewsChangePercent) >= 0 ? '+' : ''}${viewsChangePercent}%`,
      subscribersChange: `${subscriberCount >= 0 ? '+' : ''}0`,
      earningsChange: `${Number(earningsChangePercent) >= 0 ? '+' : ''}${earningsChangePercent}%`,
      contentChange: `${contentChange >= 0 ? '+' : ''}${contentChange}`,
    };
  }

  async getContent(
    userId: string,
    page = 1,
    limit = 20,
    status?: string
  ): Promise<{ items: ContentItem[]; total: number }> {
    const allowedStatuses = ['all', 'draft', 'published', 'archived'];
    if (status && !allowedStatuses.includes(status)) {
      status = 'all';
    }

    const where: Prisma.ContentItemWhereInput = { creatorId: userId };

    if (status && status !== 'all') {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        type: item.type as 'video' | 'audio' | 'document',
        viewCount: item.viewCount,
      })),
      total,
    };
  }

  async createContent(
    userId: string,
    data: { title: string; description?: string; type: string; universeId?: string }
  ): Promise<ContentItem> {
    // Look up default universe if not provided
    let universeId = data.universeId;
    if (!universeId) {
      const defaultUniverse = await this.prisma.universe.findFirst({
        where: { name: 'vertical' },
        select: { id: true },
      });
      universeId = defaultUniverse?.id;
      if (!universeId) {
        throw new Error('No universe specified and no default universe found');
      }
    }

    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creatorProfile) {
      await this.prisma.creatorProfile.create({
        data: { userId },
      });
    }

    const title = data.title.replace(/<[^>]*>/g, '');
    const description = data.description?.replace(/<[^>]*>/g, '');

    const content = await this.prisma.contentItem.create({
      data: {
        title,
        description,
        type: data.type || 'video',
        thumbnail: '', // Will be filled in via media service
        status: 'draft',
        creatorId: userId,
        universeId,
      },
    });

    return {
      ...content,
      type: content.type as 'video' | 'audio' | 'document',
    };
  }

  async updateContent(
    id: string,
    userId: string,
    data: Partial<ContentItem>
  ): Promise<ContentItem | null> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
    });

    if (!content || content.creatorId !== userId) {
      throw new NotFoundException('Content not found');
    }

    const updated = await this.prisma.contentItem.update({
      where: { id },
      data: {
        title: data.title?.replace(/<[^>]*>/g, ''),
        description: data.description?.replace(/<[^>]*>/g, ''),
        status: data.status,
      },
    });

    return {
      ...updated,
      type: (updated.type as 'video' | 'audio' | 'document') || 'video',
      viewCount: updated.viewCount,
    };
  }

  async deleteContent(id: string, userId: string): Promise<boolean> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
    });

    if (!content || content.creatorId !== userId) {
      throw new NotFoundException('Content not found');
    }

    await this.prisma.contentItem.update({
      where: { id },
      data: { status: 'archived' },
    });

    return true;
  }

  async getAnalytics(userId: string, period = '30days'): Promise<AnalyticsData> {
    const totalViews = await this.prisma.contentItem.aggregate({
      where: { creatorId: userId },
      _sum: { viewCount: true },
    });

    const days = period === '7days' ? 7 : period === '90days' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recentContent = await this.prisma.contentItem.findMany({
      where: { creatorId: userId, createdAt: { gte: startDate } },
      select: { viewCount: true, createdAt: true },
    });

    const recentViews = recentContent.reduce((sum, c) => sum + (c.viewCount || 0), 0);
    const engagementRate =
      recentViews > 0 && days > 0 ? Math.round((recentViews / days) * 10) / 10 : 0;

    const viewsOverTime = await this.prisma.$queryRaw<{ date: string; views: number }[]>`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        COALESCE(SUM("viewCount"), 0)::int as views
      FROM "content_items"
      WHERE "creatorId" = ${userId}
        AND "createdAt" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date
      LIMIT 30
    `;

    return {
      totalViews: totalViews._sum.viewCount || 0,
      avgWatchTime: '0m 0s',
      engagementRate,
      newSubscribers: 0,
      viewsOverTime: viewsOverTime.map((v) => ({ date: String(v.date), views: Number(v.views) })),
      demographics: [],
      topContent: (
        await this.prisma.contentItem.findMany({
          where: { creatorId: userId },
          orderBy: { viewCount: 'desc' },
          take: 3,
        })
      ).map((item) => ({
        title: item.title,
        views: item.viewCount,
        engagement:
          item.viewCount > 0
            ? `${((item.viewCount / (recentViews || 1)) * 100).toFixed(1)}%`
            : '0.0%',
      })),
    };
  }

  async getEarnings(userId: string, _period = 'this-month'): Promise<EarningsData> {
    const earningsAggregate = await this.prisma.walletTransaction.aggregate({
      where: {
        wallet: { userId },
        type: 'earning',
      },
      _sum: { amount: true },
      _count: true,
    });

    const allEarningsAggregate = await this.prisma.walletTransaction.aggregate({
      where: {
        wallet: { userId },
        type: 'earning',
      },
      _sum: { amount: true },
    });

    const pendingPayouts = await this.prisma.payoutRequest.aggregate({
      where: { userId, status: 'pending' },
      _sum: { amount: true },
    });

    const pendingAmount = pendingPayouts._sum.amount;
    return {
      total: Number(earningsAggregate._sum.amount) || 0,
      count: earningsAggregate._count || 0,
      pendingPayout: pendingAmount ? Number(pendingAmount) : 0,
      lifetimeEarnings: Number(allEarningsAggregate._sum.amount) || 0,
    };
  }

  async requestPayout(
    userId: string,
    amount?: number
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.payoutRequest.findFirst({
      where: { userId, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException('Pending payout already exists');
    }

    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creatorProfile) {
      throw new BadRequestException('Creator profile not found');
    }

    // Get wallet balance through wallet-service API
    const walletResponse = await this.walletClient.getWallet(userId);
    if (!walletResponse.success || !walletResponse.data) {
      throw new BadRequestException('Wallet not found');
    }

    const wallet = walletResponse.data;
    const payoutAmount = amount ? Number(amount) : wallet.balance;

    if (payoutAmount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (payoutAmount < Number(creatorProfile.minimumPayout)) {
      throw new BadRequestException(
        `Payout amount must be at least ${creatorProfile.minimumPayout}`
      );
    }

    if (payoutAmount > wallet.balance) {
      throw new BadRequestException('Insufficient balance');
    }

    // Debit wallet through wallet-service API
    const debitResult = await this.walletClient.debit(
      wallet.id,
      payoutAmount,
      'Payout request',
      `payout-${userId}-${Date.now()}`
    );

    if (!debitResult.success) {
      throw new BadRequestException('Failed to debit wallet for payout');
    }

    // Create payout request locally
    await this.prisma.payoutRequest.create({
      data: {
        userId,
        amount: payoutAmount,
        status: 'pending',
        method: 'bank',
      },
    });

    return {
      success: true,
      message: 'Payout request submitted successfully',
    };
  }

  async updatePayoutSettings(
    userId: string,
    data: { method?: string; minimum?: number }
  ): Promise<{ success: boolean }> {
    if (data.method) {
      const allowedMethods = ['bank_transfer', 'paypal', 'crypto'];
      if (!allowedMethods.includes(data.method)) {
        throw new BadRequestException('Invalid payout method');
      }
    }

    await this.prisma.creatorProfile.upsert({
      where: { userId },
      update: {
        payoutMethod: data.method,
        minimumPayout: data.minimum,
      },
      create: {
        userId,
        payoutMethod: data.method,
        minimumPayout: data.minimum,
      },
    });

    return { success: true };
  }
}
