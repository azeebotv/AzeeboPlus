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
      where: { creatorId: userId },
    });

    const totalViews = await this.prisma.contentItem.aggregate({
      where: { creatorId: userId },
      _sum: { viewCount: true },
    });

    const totalEarnings = 4892; // Will come from wallet/payment service
    const subscribers = 8421; // Will come from user service

    return {
      totalViews: totalViews._sum.viewCount || 0,
      subscribers,
      totalEarnings,
      contentCount,
      viewsChange: '+12.5%',
      subscribersChange: '+5.2%',
      earningsChange: '+18.3%',
      contentChange: '+3',
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
        type: 'video' as const,
        viewCount: item.viewCount,
      })),
      total,
    };
  }

  async createContent(
    userId: string,
    data: { title: string; description?: string; type: string; universeId?: string }
  ): Promise<ContentItem> {
    const universeId = data.universeId || 'creator';

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
        thumbnail: '', // Will be filled in via media service
        status: 'draft',
        creatorId: userId,
        universeId,
      },
    });

    return {
      ...content,
      type: data.type as 'video' | 'audio' | 'document',
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
      type: 'video',
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAnalytics(userId: string, _period = '30days'): Promise<AnalyticsData> {
    const totalViews = await this.prisma.contentItem.aggregate({
      where: { creatorId: userId },
      _sum: { viewCount: true },
    });

    return {
      totalViews: totalViews._sum.viewCount || 0,
      avgWatchTime: '4m 32s',
      engagementRate: 87.3,
      newSubscribers: 1247,
      viewsOverTime: [
        { date: 'Apr 1', views: 4200 },
        { date: 'Apr 8', views: 5100 },
        { date: 'Apr 15', views: 4800 },
        { date: 'Apr 22', views: 6200 },
      ],
      demographics: [
        { region: 'North America', percentage: 45 },
        { region: 'Europe', percentage: 30 },
        { region: 'Asia', percentage: 15 },
        { region: 'Other', percentage: 10 },
      ],
      topContent: (
        await this.prisma.contentItem.findMany({
          where: { creatorId: userId },
          orderBy: { viewCount: 'desc' },
          take: 3,
        })
      ).map((item) => ({
        title: item.title,
        views: item.viewCount,
        engagement: '90%',
      })),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getEarnings(userId: string, _period = 'this-month'): Promise<EarningsData> {
    const pendingPayouts = await this.prisma.payoutRequest.aggregate({
      where: { userId, status: 'pending' },
      _sum: { amount: true },
    });

    const pendingAmount = pendingPayouts._sum.amount;
    return {
      total: 1247.5,
      count: 47,
      pendingPayout: pendingAmount ? Number(pendingAmount) : 0,
      lifetimeEarnings: 48293.45,
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
        socialLinks: {
          ...data,
        },
      },
      create: {
        userId,
        socialLinks: data,
      },
    });

    return { success: true };
  }
}
