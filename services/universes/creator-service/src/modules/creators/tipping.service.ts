import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreatorResponse } from './interfaces/creator-response.interface.js';
import { CreatorsService } from './creators.service.js';

interface TipEntry {
  id: string;
  creatorId: string;
  creatorName: string;
  amount: number;
  tier: string | null;
  message: string | null;
  createdAt: Date;
}

interface TipStats {
  totalTips: number;
  totalAmount: number;
  topTier: string | null;
}

@Injectable()
export class TippingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CreatorsService) private readonly creatorsService: CreatorsService,
  ) {}

  /**
   * Get the current user's own tipping stats (totalTips, totalAmount, topTier).
   */
  async getUserTipStats(userId: string): Promise<CreatorResponse> {
    const [totalTips, totalAmount, topEntry] = await Promise.all([
      this.prisma.tip.count({ where: { fromUserId: userId } }),
      this.prisma.tip.aggregate({
        where: { fromUserId: userId },
        _sum: { amount: true },
      }),
      this.prisma.tipLeaderboard.findFirst({
        where: { userId },
        orderBy: { totalAmount: 'desc' },
        select: { tier: true },
      }),
    ]);

    const stats: TipStats = {
      totalTips,
      totalAmount: Number(totalAmount._sum.amount ?? 0),
      topTier: topEntry?.tier ?? null,
    };

    return { success: true, data: stats };
  }

  /**
   * Get the current user's tipping history with pagination.
   */
  async getUserTipHistory(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<CreatorResponse> {
    const skip = (page - 1) * limit;

    const [tips, total] = await Promise.all([
      this.prisma.tip.findMany({
        where: { fromUserId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tip.count({ where: { fromUserId: userId } }),
    ]);

    // Resolve creator display names and tiers in batch
    const creatorIds = [...new Set(tips.map((t) => t.toUserId))];
    const [creatorProfiles, leaderboardEntries] = await Promise.all(
      creatorIds.length > 0
        ? [
            this.prisma.creatorProfile.findMany({
              where: { userId: { in: creatorIds } },
              select: { userId: true, displayName: true },
            }),
            this.prisma.tipLeaderboard.findMany({
              where: { userId, creatorId: { in: creatorIds } },
              select: { creatorId: true, tier: true },
            }),
          ]
        : [[], []],
    );

    const nameMap = new Map(
      creatorProfiles.map((p) => [p.userId, p.displayName ?? 'Creator']),
    );
    const tierMap = new Map(
      leaderboardEntries.map((e) => [e.creatorId, e.tier]),
    );

    const items: TipEntry[] = tips.map((tip) => ({
      id: tip.id,
      creatorId: tip.toUserId,
      creatorName: nameMap.get(tip.toUserId) ?? 'Creator',
      amount: Number(tip.amount),
      tier: tierMap.get(tip.toUserId) ?? null,
      message: tip.message ?? null,
      createdAt: tip.createdAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: { items, total, totalPages },
    };
  }

  /**
   * Send a tip to a creator. Delegates to the existing CreatorsService.sendTip.
   */
  async sendTip(
    userId: string,
    creatorId: string,
    amount: number,
    message?: string,
  ): Promise<CreatorResponse> {
    return this.creatorsService.sendTip(userId, creatorId, amount, message);
  }
}
