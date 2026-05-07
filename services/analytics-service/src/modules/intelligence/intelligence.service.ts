import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class IntelligenceService {
  constructor(private prisma: PrismaService) {}

  async getPersonalization(userId: string): Promise<{ success: boolean; data?: unknown }> {
    const [watchHistory, preferences, rewardAccount] = await Promise.all([
      this.prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        take: 100,
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true },
      }),
      this.prisma.rewardAccount.findUnique({
        where: { userId },
      }),
    ]);

    const contentIds = watchHistory.map((h) => h.contentId);
    const watchedContent = await this.prisma.contentItem.findMany({
      where: { id: { in: contentIds } },
      include: { universe: true },
    });

    const universePreferences = watchedContent.reduce(
      (acc, c) => {
        const universe = c.universe?.name || 'unknown';
        acc[universe] = (acc[universe] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topUniverses = Object.entries(universePreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    return {
      success: true,
      data: {
        userId,
        topUniverses,
        recentCategories: [],
        engagementLevel: rewardAccount ? 'active' : 'new',
        preferences: preferences?.preferences || {},
      },
    };
  }

  async getAudienceSegments(): Promise<{ success: boolean; data?: unknown }> {
    const segments = await this.prisma.audienceSegment.findMany();
    return { success: true, data: segments };
  }

  async createAudienceSegment(
    name: string,
    segmentType: 'behavioral' | 'demographic' | 'firmographic',
    criteria: Record<string, unknown>
  ): Promise<{ success: boolean; data?: { id: string } }> {
    const users = await this.prisma.user.findMany({
      where: criteria as Record<string, string>,
    });

    const segment = await this.prisma.audienceSegment.create({
      data: {
        name,
        segmentType,
        criteria: criteria as Record<string, string | number | boolean | null>,
        size: users.length,
      },
    });

    return { success: true, data: { id: segment.id } };
  }

  async getCreatorScores(universe?: string): Promise<{ success: boolean; data?: unknown }> {
    const where = universe
      ? { creator: { contentItems: { some: { universe: { name: universe } } } } }
      : {};

    const scores = await this.prisma.creatorScore.findMany({
      where,
      orderBy: { overallScore: 'desc' },
      take: 100,
    });

    const enrichedScores = await Promise.all(
      scores.map(async (score) => {
        const creator = await this.prisma.creatorProfile.findUnique({
          where: { id: score.creatorId },
          include: { user: { select: { displayName: true, avatar: true } } },
        });
        return {
          ...score,
          creatorName: creator?.user.displayName,
          creatorAvatar: creator?.user.avatar,
        };
      })
    );

    return { success: true, data: enrichedScores };
  }

  async calculateCreatorScore(creatorId: string): Promise<{ success: boolean; data?: unknown }> {
    const [contentItems, subscribers, earnings] = await Promise.all([
      this.prisma.contentItem.findMany({
        where: { creatorId },
      }),
      this.prisma.subscription.count({
        where: { creatorId },
      }),
      this.prisma.creatorEarning.aggregate({
        where: { creatorId },
        _sum: { amount: true },
      }),
    ]);

    const totalViews = contentItems.reduce((sum, c) => sum + c.viewCount, 0);
    const engagementScore = Math.min(100, (totalViews / 1000) * 10 + subscribers * 2);
    const growthScore = Math.min(100, contentItems.length * 5 + subscribers * 3);
    const monetizationScore = Math.min(100, Number(earnings._sum.amount || 0) / 1000);
    const overallScore = engagementScore * 0.4 + growthScore * 0.3 + monetizationScore * 0.3;

    const score = await this.prisma.creatorScore.upsert({
      where: { creatorId },
      create: {
        creatorId,
        engagementScore,
        growthScore,
        monetizationScore,
        overallScore,
        lastUpdated: new Date(),
      },
      update: {
        engagementScore,
        growthScore,
        monetizationScore,
        overallScore,
        lastUpdated: new Date(),
      },
    });

    return { success: true, data: score };
  }

  async getChurnRisks(threshold = 0.5): Promise<{ success: boolean; data?: unknown }> {
    const risks = await this.prisma.churnRisk.findMany({
      where: { churnProbability: { gte: threshold } },
      orderBy: { churnProbability: 'desc' },
      take: 100,
    });

    return { success: true, data: risks };
  }

  async calculateChurnRisk(userId: string): Promise<{ success: boolean; data?: unknown }> {
    const [user, rewardAccount, watchHistory] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.rewardAccount.findUnique({ where: { userId } }),
      this.prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        take: 30,
      }),
    ]);

    if (!user) {
      return { success: true, data: { error: 'User not found' } };
    }

    const lastActivity = watchHistory[0]?.watchedAt;
    const daysSinceActivity = lastActivity
      ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const factors: Record<string, number> = {};
    let riskScore = 0;

    if (daysSinceActivity > 30) {
      factors.daysSinceLastActivity = 0.5;
      riskScore += 0.5;
    } else if (daysSinceActivity > 14) {
      factors.daysSinceLastActivity = 0.3;
      riskScore += 0.3;
    } else if (daysSinceActivity > 7) {
      factors.daysSinceLastActivity = 0.1;
      riskScore += 0.1;
    }

    if (!rewardAccount) {
      factors.noRewardAccount = 0.2;
      riskScore += 0.2;
    }

    const watchFrequency = watchHistory.length;
    if (watchFrequency < 5) {
      factors.lowWatchFrequency = 0.3;
      riskScore += 0.3;
    }

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 0.7) riskLevel = 'critical';
    else if (riskScore >= 0.5) riskLevel = 'high';
    else if (riskScore >= 0.3) riskLevel = 'medium';
    else riskLevel = 'low';

    const predictedChurnAt =
      riskLevel === 'critical'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : riskLevel === 'high'
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          : null;

    const churnRisk = await this.prisma.churnRisk.upsert({
      where: { userId },
      create: {
        userId,
        riskLevel,
        churnProbability: riskScore,
        factors: factors as Record<string, string | number | boolean | null>,
        lastActivityAt: lastActivity || null,
        predictedChurnAt,
      },
      update: {
        riskLevel,
        churnProbability: riskScore,
        factors: factors as Record<string, string | number | boolean | null>,
        lastActivityAt: lastActivity || null,
        predictedChurnAt,
      },
    });

    return { success: true, data: churnRisk };
  }

  async getFraudDetections(status?: string): Promise<{ success: boolean; data?: unknown }> {
    const where = status ? { status } : {};
    const detections = await this.prisma.fraudDetection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { success: true, data: detections };
  }

  async detectFraud(
    userId: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, unknown>
  ): Promise<{ success: boolean; data?: { id: string } }> {
    const detection = await this.prisma.fraudDetection.create({
      data: {
        userId,
        eventType,
        severity,
        details: details as Record<string, string | number | boolean | null>,
      },
    });

    return { success: true, data: { id: detection.id } };
  }

  async reviewFraudDetection(
    detectionId: string,
    reviewedBy: string,
    status: 'confirmed' | 'cleared'
  ): Promise<{ success: boolean; data?: { message: string } }> {
    await this.prisma.fraudDetection.update({
      where: { id: detectionId },
      data: { status, reviewedBy, reviewedAt: new Date() },
    });

    return { success: true, data: { message: `Detection ${status}` } };
  }

  async getRetentionMetrics(dateRange?: {
    from: Date;
    to: Date;
  }): Promise<{ success: boolean; data?: unknown }> {
    const where = dateRange ? { createdAt: { gte: dateRange.from, lte: dateRange.to } } : {};

    const [totalUsers, activeUsers, retentionByWeek] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.productEvent.groupBy({
        by: ['userId'],
        where: { timestamp: dateRange ? { gte: dateRange.from, lte: dateRange.to } : undefined },
      }),
      this.prisma.$queryRaw<unknown[]>`
        SELECT
          DATE_TRUNC('week', "createdAt") as week,
          COUNT(*) FILTER (WHERE "lastLoginAt" >= NOW() - INTERVAL '7 days') as retained,
          COUNT(*) as total
        FROM "reward_accounts"
        GROUP BY DATE_TRUNC('week', "createdAt")
        ORDER BY week DESC
        LIMIT 12
      `,
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        activeUsers: activeUsers.length,
        retentionRate: totalUsers > 0 ? (activeUsers.length / totalUsers) * 100 : 0,
        retentionByWeek,
      },
    };
  }
}
