import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../database/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const contentCount = await this.prisma.contentItem.count({
      where: { creatorId: userId, status: { not: 'archived' } },
    });

    const totalViews = await this.prisma.contentItem.aggregate({
      where: { creatorId: userId },
      _sum: { viewCount: true },
    });

    const earnings = await this.prisma.walletTransaction.aggregate({
      where: {
        wallet: { userId },
        type: { in: ['earning', 'payout'] },
      },
      _sum: { amount: true },
    });

    const previousPeriodViews = await this.prisma.contentItem.aggregate({
      where: {
        creatorId: userId,
        createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      },
      _sum: { viewCount: true },
    });

    const currentViews = totalViews._sum.viewCount || 0;
    const prevViews = previousPeriodViews._sum.viewCount || 0;
    const viewsChangePercent =
      prevViews > 0 ? (((currentViews - prevViews) / prevViews) * 100).toFixed(1) : '0';

    return {
      totalViews: currentViews,
      subscribers: 0,
      totalEarnings: Number(earnings._sum.amount) || 0,
      contentCount,
      viewsChange: `${Number(viewsChangePercent) >= 0 ? '+' : ''}${viewsChangePercent}%`,
      subscribersChange: '+0%',
      earningsChange: '+0%',
      contentChange: '+0',
    };
  }

  async getContent(
    userId: string,
    page = 1,
    limit = 20,
    status?: string
  ): Promise<{ items: ContentItem[]; total: number }> {
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
    const universeId = data.universeId || '00000000-0000-0000-0000-000000000001'; // Default 'videos' universe

    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creatorProfile) {
      await this.prisma.creatorProfile.create({
        data: { userId },
      });
    }

    const content = await this.prisma.contentItem.create({
      data: {
        title: data.title,
        description: data.description,
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
        title: data.title,
        description: data.description,
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

    const _recentContentCount = await this.prisma.contentItem.count({
      where: { creatorId: userId, createdAt: { gte: startDate } },
    });

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
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const payoutAmount = amount || Number(wallet.balance);

    if (payoutAmount > Number(wallet.balance)) {
      throw new BadRequestException('Insufficient balance');
    }

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
