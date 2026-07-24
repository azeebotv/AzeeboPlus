import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);
  private readonly userServiceUrl: string;
  private readonly contentServiceUrl: string;

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(ConfigService) private configService: ConfigService
  ) {
    this.userServiceUrl = this.configService.get<string>('USER_SERVICE_URL', 'http://user-service:3001');
    this.contentServiceUrl = this.configService.get<string>('CONTENT_SERVICE_URL', 'http://content-service:3004');
  }

  private async getUserById(userId: string): Promise<{ id: string; displayName?: string; email?: string } | null> {
    try {
      const response = await axios.get<{ data?: { id: string; displayName?: string; email?: string } }>(
        `${this.userServiceUrl}/users/${userId}`,
        { timeout: 5000 }
      );
      return response.data?.data || null;
    } catch {
      return null;
    }
  }

  private async getContentByIds(ids: string[]): Promise<{ id: string; universe?: string }[]> {
    try {
      const response = await axios.get<{ data?: { items?: { id: string; universe?: string }[] } }>(
        `${this.contentServiceUrl}/content`,
        { params: { ids: ids.join(','), limit: 100 }, timeout: 5000 }
      );
      return response.data?.data?.items || [];
    } catch {
      return [];
    }
  }

  private async getContentByCreator(creatorId: string): Promise<{ id: string; viewCount: number }[]> {
    try {
      const response = await axios.get<{ data?: { items?: { id: string; viewCount: number }[] } }>(
        `${this.contentServiceUrl}/content/creator/${creatorId}`,
        { timeout: 5000 }
      );
      return response.data?.data?.items || [];
    } catch {
      return [];
    }
  }

  async getPersonalization(userId: string): Promise<{ success: boolean; data?: unknown }> {
    try {
      const [watchHistory, , rewardAccount] = await Promise.all([
        this.prisma.watchHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        this.getUserById(userId),
        this.prisma.rewardAccount.findUnique({
          where: { userId },
        }),
      ]);

      const contentIds = watchHistory.map((h) => h.contentId);
      const watchedContent = await this.getContentByIds(contentIds);

      const universePreferences = watchedContent.reduce(
        (acc, c) => {
          const universe = c.universe || 'unknown';
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
          preferences: {},
        },
      };
    } catch (error) {
      this.logger.error(
        `getPersonalization failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async getAudienceSegments(): Promise<{ success: boolean; data?: unknown }> {
    try {
      const segments = await this.prisma.audienceSegment.findMany();
      return { success: true, data: segments };
    } catch (error) {
      this.logger.error(
        `getAudienceSegments failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async createAudienceSegment(
    name: string,
    segmentType: 'behavioral' | 'demographic' | 'firmographic',
    criteria: Record<string, unknown>
  ): Promise<{ success: boolean; data?: { id: string } }> {
    try {
      const ALLOWED_CRITERIA_FIELDS = [
        'universe',
        'category',
        'minViewCount',
        'maxViewCount',
        'minWatchTime',
        'maxWatchTime',
        'engagementLevel',
        'signupDateFrom',
        'signupDateTo',
        'lastActiveFrom',
        'lastActiveTo',
        'platform',
      ];

      const criteriaKeys = Object.keys(criteria);
      const invalidKeys = criteriaKeys.filter((key) => !ALLOWED_CRITERIA_FIELDS.includes(key));
      if (invalidKeys.length > 0) {
        throw new BadRequestException(
          `Invalid criteria fields: ${invalidKeys.join(', ')}. Allowed: ${ALLOWED_CRITERIA_FIELDS.join(', ')}`
        );
      }

      // Map UI-facing criteria fields to Prisma User model fields
      // NOTE: 'universe', 'platform', and 'lastActiveAt' do not exist on the User model.
      // They are stored in the segment criteria JSON and evaluated at query time.
      const where: Record<string, unknown> = {};
      if (criteria.signupDateFrom || criteria.signupDateTo) {
        where.createdAt = {};
        if (criteria.signupDateFrom)
          (where.createdAt as Record<string, unknown>).gte = new Date(
            criteria.signupDateFrom as string
          );
        if (criteria.signupDateTo)
          (where.createdAt as Record<string, unknown>).lte = new Date(
            criteria.signupDateTo as string
          );
      }
      // Behavioral criteria (minViewCount, maxViewCount, minWatchTime, maxWatchTime, engagementLevel)
      // require joins on engagement tables and cannot be directly mapped to User model fields.
      // These are stored in the segment criteria JSON and evaluated at query time.

      const users = await this.prisma.user.findMany({
        where: where as Record<string, string>,
      });

      const segment = await this.prisma.audienceSegment.create({
        data: {
          name,
          segmentType,
          criteria: JSON.stringify(criteria),
          size: users.length,
        },
      });

      return { success: true, data: { id: segment.id } };
    } catch (error) {
      this.logger.error(
        `createAudienceSegment failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async getCreatorScores(_universe?: string): Promise<{ success: boolean; data?: unknown }> {
    try {
      const scores = await this.prisma.creatorScore.findMany({
        orderBy: { overallScore: 'desc' },
        take: 100,
      });

      return { success: true, data: scores };
    } catch (error) {
      this.logger.error(
        `getCreatorScores failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async calculateCreatorScore(creatorId: string): Promise<{ success: boolean; data?: unknown }> {
    try {
      const contentItems = await this.getContentByCreator(creatorId);

      const totalViews = contentItems.reduce(
        (sum: number, c: { viewCount: number }) => sum + c.viewCount,
        0
      );
      const engagementScore = Math.min(100, totalViews / 10);
      const growthScore = Math.min(100, contentItems.length * 5);
      const monetizationScore = 0;
      const overallScore = engagementScore * 0.5 + growthScore * 0.3 + monetizationScore * 0.2;

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
    } catch (error) {
      this.logger.error(
        `calculateCreatorScore failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async getChurnRisks(threshold = 0.5): Promise<{ success: boolean; data?: unknown }> {
    try {
      const risks = await this.prisma.churnRisk.findMany({
        where: { churnProbability: { gte: threshold } },
        orderBy: { churnProbability: 'desc' },
        take: 100,
      });

      return { success: true, data: risks };
    } catch (error) {
      this.logger.error(
        `getChurnRisks failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async calculateChurnRisk(userId: string): Promise<{ success: boolean; data?: unknown }> {
    try {
      const [user, rewardAccount, watchHistory] = await Promise.all([
        this.getUserById(userId),
        this.prisma.rewardAccount.findUnique({ where: { userId } }),
        this.prisma.watchHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
      ]);

      if (!user) {
        return { success: true, data: { error: 'User not found' } };
      }

      const lastActivity = watchHistory[0]?.createdAt;
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
          factors: JSON.stringify(factors),
          lastActivityAt: lastActivity || null,
          predictedChurnAt,
        },
        update: {
          riskLevel,
          churnProbability: riskScore,
          factors: JSON.stringify(factors),
          lastActivityAt: lastActivity || null,
          predictedChurnAt,
        },
      });

      return { success: true, data: churnRisk };
    } catch (error) {
      this.logger.error(
        `calculateChurnRisk failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async getFraudDetections(status?: string): Promise<{ success: boolean; data?: unknown }> {
    try {
      const where = status ? { status } : {};
      const detections = await this.prisma.fraudDetection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return { success: true, data: detections };
    } catch (error) {
      this.logger.error(
        `getFraudDetections failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async detectFraud(
    userId: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, unknown>
  ): Promise<{ success: boolean; data?: { id: string } }> {
    try {
      const detection = await this.prisma.fraudDetection.create({
        data: {
          userId,
          eventType,
          severity,
          details: JSON.stringify(details),
        },
      });

      return { success: true, data: { id: detection.id } };
    } catch (error) {
      this.logger.error(`detectFraud failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async reviewFraudDetection(
    detectionId: string,
    reviewedBy: string,
    status: 'confirmed' | 'cleared'
  ): Promise<{ success: boolean; data?: { message: string } }> {
    try {
      await this.prisma.fraudDetection.update({
        where: { id: detectionId },
        data: { status, reviewedBy, reviewedAt: new Date() },
      });

      return { success: true, data: { message: `Detection ${status}` } };
    } catch (error) {
      this.logger.error(
        `reviewFraudDetection failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async getRetentionMetrics(dateRange?: {
    from: Date;
    to: Date;
  }): Promise<{ success: boolean; data?: unknown }> {
    try {
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
    } catch (error) {
      this.logger.error(
        `getRetentionMetrics failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async getCrossUniverseRecommendations(
    userId: string
  ): Promise<{ success: boolean; data?: unknown }> {
    try {
      const [watchHistory, rewardAccount] = await Promise.all([
        this.prisma.watchHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        this.prisma.rewardAccount.findUnique({ where: { userId } }),
      ]);

      const contentIds = watchHistory.map((w) => w.contentId);

      const watchedContent = await this.prisma.contentItem.findMany({
        where: { id: { in: contentIds } },
        // universe is a string field, not a relation
      });

      const contentById = new Map(watchedContent.map((c) => [c.id, c]));

      const universePreferences: Record<string, number> = {};
      for (const history of watchHistory) {
        const content = contentById.get(history.contentId);
        if (content?.universe) {
          universePreferences[content.universe] = (universePreferences[content.universe] || 0) + 1;
        }
      }

      const topUniverses = Object.entries(universePreferences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      // Get all universes from database instead of hardcoding
      let allUniverses: string[];
      try {
        const universes = await this.prisma.universe.findMany({
          select: { name: true },
        });
        allUniverses = universes.map((u) => u.name);
      } catch {
        // Fall back to hardcoded list if universe table doesn't exist
        allUniverses = [
          'reality',
          'creator',
          'lifestyle',
          'games',
          'comedy',
          'sports',
          'movie',
          'vertical',
        ];
      }
      const unexploredUniverses = allUniverses.filter((u) => !topUniverses.includes(u));

      const recommendedContent: Record<string, unknown[]> = {};

      for (const universe of unexploredUniverses.slice(0, 3)) {
        const content = await this.prisma.contentItem.findMany({
          where: { universe: universe },
          orderBy: { viewCount: 'desc' },
          take: 5,
          // universe is a string field, not a relation
        });
        if (content.length > 0) {
          recommendedContent[universe] = content.map((c) => ({
            id: c.id,
            title: c.title,
            universe: c.universe,
            viewCount: c.viewCount,
          }));
        }
      }

      return {
        success: true,
        data: {
          userId,
          primaryUniverses: topUniverses,
          recommendedContent,
          engagementLevel: rewardAccount ? 'active' : 'new',
          recommendationReason: 'Based on your viewing patterns, you might enjoy these universes',
        },
      };
    } catch (error) {
      this.logger.error(
        `getCrossUniverseRecommendations failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async analyzeFraudPatterns(): Promise<{ success: boolean; data?: unknown }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const rapidVoteEvents = await this.prisma.productEvent.findMany({
        where: {
          eventName: { in: ['vote_submitted', 'supervote_submitted'] },
          timestamp: { gte: thirtyDaysAgo },
        },
        select: { userId: true, sessionId: true },
      });

      const voteByUserSession = new Map<string, number>();
      for (const event of rapidVoteEvents) {
        if (event.userId && event.sessionId) {
          const key = `${event.userId}-${event.sessionId}`;
          voteByUserSession.set(key, (voteByUserSession.get(key) || 0) + 1);
        }
      }
      const rapidVotes = Array.from(voteByUserSession.values()).filter(
        (count) => count > 20
      ).length;

      const rapidPredictionEvents = await this.prisma.productEvent.count({
        where: {
          eventName: 'prediction_placed',
          timestamp: { gte: thirtyDaysAgo },
        },
      });

      const failedPaymentCount = await this.prisma.paymentIntent.count({
        where: {
          status: 'failed',
          createdAt: { gte: thirtyDaysAgo },
        },
      });

      const suspiciousSessionCount = await this.prisma.productEvent
        .groupBy({
          by: ['sessionId'],
          where: { timestamp: { gte: thirtyDaysAgo } },
          _count: true,
        })
        .then((results) => results.filter((r) => r._count > 500).length);

      const patterns = [];

      if (rapidVotes > 0) {
        patterns.push({
          type: 'rapid_voting',
          severity: 'high',
          description: 'Users submitting unusually high number of votes in short sessions',
          affectedCount: rapidVotes,
        });
      }

      if (rapidPredictionEvents > 50) {
        patterns.push({
          type: 'rapid_predictions',
          severity: 'high',
          description: 'Users placing unusually high number of predictions',
          affectedCount: rapidPredictionEvents,
        });
      }

      if (failedPaymentCount > 3) {
        patterns.push({
          type: 'payment_abuse',
          severity: 'critical',
          description: 'Users with multiple failed payment attempts',
          affectedCount: failedPaymentCount,
        });
      }

      if (suspiciousSessionCount > 0) {
        patterns.push({
          type: 'session_manipulation',
          severity: 'medium',
          description: 'Sessions with unusually high event counts',
          affectedCount: suspiciousSessionCount,
        });
      }

      return {
        success: true,
        data: {
          analyzedPeriod: '30 days',
          patternsDetected: patterns.length,
          patterns,
          requiresReview: patterns.filter((p) => p.severity === 'critical' || p.severity === 'high')
            .length,
        },
      };
    } catch (error) {
      this.logger.error(
        `analyzeFraudPatterns failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }

  async getSegmentationInsights(): Promise<{ success: boolean; data?: unknown }> {
    try {
      const [userCount, activeUsers, contentInteractions] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.productEvent.groupBy({
          by: ['userId'],
          where: { timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        }),
        this.prisma.productEvent.groupBy({
          by: ['eventName'],
          where: { timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          _count: true,
        }),
      ]);

      const userEngagementScores = await this.prisma.productEvent.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _count: true,
      });

      const totalInteractions = userEngagementScores.reduce((sum, u) => sum + u._count, 0);
      const avgInteractionsPerUser = userCount > 0 ? totalInteractions / userCount : 0;

      const highlyEngaged = userEngagementScores.filter(
        (u) => u._count > avgInteractionsPerUser * 1.5
      ).length;
      const moderatelyEngaged = userEngagementScores.filter(
        (u) => u._count > avgInteractionsPerUser * 0.5 && u._count <= avgInteractionsPerUser * 1.5
      ).length;
      const lowEngagement = userCount - highlyEngaged - moderatelyEngaged;

      const engagementDistribution = {
        highlyEngaged,
        moderatelyEngaged,
        lowEngagement: Math.max(0, lowEngagement),
      };

      const topEvents = contentInteractions
        .sort((a, b) => b._count - a._count)
        .slice(0, 5)
        .map((e) => ({ event: e.eventName, count: e._count }));

      return {
        success: true,
        data: {
          totalUsers: userCount,
          activeUsers: activeUsers.length,
          engagementRate: userCount > 0 ? (activeUsers.length / userCount) * 100 : 0,
          engagementDistribution,
          topEvents,
          insights: [
            `Active users represent ${userCount > 0 ? ((activeUsers.length / userCount) * 100).toFixed(1) : 0}% of total users`,
            `Most popular interaction: ${topEvents[0]?.event || 'N/A'}`,
            `${engagementDistribution.highlyEngaged} users are highly engaged`,
          ],
        },
      };
    } catch (error) {
      this.logger.error(
        `getSegmentationInsights failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message } as never;
    }
  }
}
