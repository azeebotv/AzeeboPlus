import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CacheService, cacheKey } from '@azeebo/shared-services';

interface RecommendationInput {
  userId?: string;
  limit?: number;
  universe?: string;
  contentType?: string;
  freshnessDays?: number;
}

interface RecommendationOutput {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  creator: { id: string; displayName: string; avatar: string };
  universe: { id: string; name: string; slug: string };
  score: number;
  explainability: {
    factors: { name: string; weight: number }[];
    reason: string;
  };
  freshnessScore: number;
}

interface UserSegment {
  segmentId: string;
  name: string;
  description: string;
  characteristics: Record<string, unknown>;
}

interface CreatorScore {
  creatorId: string;
  score: number;
  factors: { name: string; weight: number; value: number }[];
  tier: 'elite' | 'growth' | 'emerging' | 'new';
}

interface ChurnRisk {
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: string[];
  recommendations: string[];
}

interface MonetizationInsight {
  userId: string;
  predictedLTV: number;
  optimalPricePoint: number;
  recommendedActions: string[];
  segment: string;
}

interface FraudRisk {
  userId?: string;
  contentId?: string;
  transactionId?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: { name: string; score: number; description: string }[];
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private prisma: PrismaService, private readonly cache: CacheService) {}

  async getContentRecommendations(
    input: RecommendationInput
  ): Promise<{ success: boolean; data?: RecommendationOutput[] }> {
    try {
      const { userId, limit = 20, universe, freshnessDays = 7 } = input;

      if (!userId) {
        const cacheK = cacheKey('recommendation', `popular:${universe || 'all'}`);
        const cached = await this.cache.get<{ success: boolean; data?: RecommendationOutput[] }>(cacheK);
        if (cached) return cached;

        const result = await this.getFallbackRecommendations(limit, universe, freshnessDays);
        if (result.success && result.data) {
          await this.cache.set(cacheK, result, 3600);
        }
        return result;
      }

      const cacheK = cacheKey('recommendation', `user:${userId}:${limit}:${universe || 'all'}:${freshnessDays}`);
      const cached = await this.cache.get<{ success: boolean; data?: RecommendationOutput[] }>(cacheK);
      if (cached) return cached;

      const [watchHistory, rewardAccount] = await Promise.all([
        this.prisma.watchHistory.findMany({
          where: { userId },
          orderBy: { watchedAt: 'desc' },
          take: 100,
        }),
        this.prisma.rewardAccount.findUnique({
          where: { userId },
        }),
      ]);

      const watchedContentIds = watchHistory.map((h) => h.contentId);

      if (watchedContentIds.length === 0) {
        return this.getFallbackRecommendations(limit, universe, freshnessDays);
      }

      const watchedContent = await this.prisma.contentItem.findMany({
        where: { id: { in: watchedContentIds } },
        include: { universe: true, categories: true },
      });

      const universeCounts = watchedContent.reduce(
        (acc, c) => {
          const name = c.universe?.name || 'unknown';
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const categoryCounts = watchedContent.reduce(
        (acc, c) => {
          c.categories?.forEach((cat) => {
            acc[cat.name] = (acc[cat.name] || 0) + 1;
          });
          return acc;
        },
        {} as Record<string, number>
      );

      const topUniverse = Object.entries(universeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const freshnessCutoff = new Date(Date.now() - freshnessDays * 24 * 60 * 60 * 1000);

      const candidateContent = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          id: { notIn: watchedContentIds },
          publishedAt: { gte: freshnessCutoff },
          ...(universe && { universe: { name: universe } }),
          ...(topUniverse && !universe && { universe: { name: topUniverse } }),
        },
        include: {
          creator: { select: { id: true, displayName: true, avatar: true } },
          universe: true,
          categories: true,
        },
        orderBy: { viewCount: 'desc' },
        take: limit * 3,
      });

      const scored = candidateContent.map((content) => {
        const factors: { name: string; weight: number }[] = [];
        let reason = '';

        let baseScore = content.viewCount * 0.3;

        if (content.universe?.name === topUniverse) {
          baseScore += 30;
          factors.push({ name: 'universe_match', weight: 30 });
          reason = `You frequently watch ${topUniverse}`;
        }

        const contentCategories = content.categories?.map((c) => c.name) || [];
        const categoryMatches = contentCategories.filter((c) => topCategories.includes(c));
        if (categoryMatches.length > 0) {
          baseScore += categoryMatches.length * 10;
          factors.push({ name: 'category_match', weight: categoryMatches.length * 10 });
        }

        const daysSincePublished = content.publishedAt
          ? Math.floor((Date.now() - content.publishedAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        const freshnessScore = Math.max(0, 100 - daysSincePublished * 5);
        baseScore += freshnessScore * 0.2;
        factors.push({ name: 'freshness', weight: freshnessScore * 0.2 });

        if (rewardAccount) {
          baseScore += 5;
          factors.push({ name: 'active_user', weight: 5 });
        }

        return {
          id: content.id,
          title: content.title,
          description: content.description || '',
          thumbnail: content.thumbnail,
          creator: {
            id: content.creator.id,
            displayName: content.creator.displayName || '',
            avatar: content.creator.avatar || '',
          },
          universe: {
            id: content.universe.id,
            name: content.universe.name,
            slug: content.universe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
          score: Math.round(baseScore * 100) / 100,
          explainability: {
            factors,
            reason,
          },
          freshnessScore,
        };
      });

      const sorted = scored.sort((a, b) => b.score - a.score);
      const crossUniverseDiversity = await this.ensureCrossUniverseDiversity(
        sorted,
        limit,
        watchedContentIds
      );

      const result = { success: true, data: crossUniverseDiversity.slice(0, limit) };
      await this.cache.set(cacheK, result, 1800);
      return result;
    } catch (_err) {
      this.logger.error(
        `Failed to get content recommendations for user ${input.userId}`,
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }

  private async getFallbackRecommendations(
    limit: number,
    universe?: string,
    freshnessDays = 7
  ): Promise<{ success: boolean; data?: RecommendationOutput[] }> {
    try {
      const freshnessCutoff = new Date(Date.now() - freshnessDays * 24 * 60 * 60 * 1000);

      const trending = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          publishedAt: { gte: freshnessCutoff },
          ...(universe && { universe: { name: universe } }),
        },
        include: {
          creator: { select: { id: true, displayName: true, avatar: true } },
          universe: true,
        },
        orderBy: { viewCount: 'desc' },
        take: limit,
      });

      return {
        success: true,
        data: trending.map((content) => ({
          id: content.id,
          title: content.title,
          description: content.description || '',
          thumbnail: content.thumbnail,
          creator: {
            id: content.creator.id,
            displayName: content.creator.displayName || '',
            avatar: content.creator.avatar || '',
          },
          universe: {
            id: content.universe.id,
            name: content.universe.name,
            slug: content.universe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
          score: content.viewCount,
          explainability: {
            factors: [{ name: 'trending', weight: content.viewCount }],
            reason: 'Popular content this week',
          },
          freshnessScore: content.publishedAt
            ? Math.max(
                0,
                100 -
                  Math.floor((Date.now() - content.publishedAt.getTime()) / (1000 * 60 * 60 * 24)) * 5
              )
            : 0,
        })),
      };
    } catch (_err) {
      this.logger.error(
        'Failed to get fallback recommendations',
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }

  private async ensureCrossUniverseDiversity(
    items: RecommendationOutput[],
    limit: number,
    excludeIds: string[]
  ): Promise<RecommendationOutput[]> {
    const universeCounts: Record<string, number> = {};
    const result: RecommendationOutput[] = [];
    const remaining = items.filter((item) => !excludeIds.includes(item.id));

    for (const item of remaining) {
      const universeName = item.universe.name;
      const currentCount = universeCounts[universeName] || 0;
      const maxPerUniverse = Math.ceil(limit / 8);

      if (currentCount < maxPerUniverse) {
        result.push(item);
        universeCounts[universeName] = currentCount + 1;
      }

      if (result.length >= limit) break;
    }

    if (result.length < limit) {
      const remainingItems = remaining.filter((item) => !result.includes(item));
      result.push(...remainingItems.slice(0, limit - result.length));
    }

    return result;
  }

  async getCreatorRecommendations(
    userId: string,
    limit = 10
  ): Promise<{ success: boolean; data?: unknown[] }> {
    try {
      const recommendedCreators = await this.prisma.creatorProfile.findMany({
        where: {
          userId: { not: userId },
        },
        include: {
          user: { select: { id: true, displayName: true, avatar: true } },
        },
        take: limit,
      });

      return {
        success: true,
        data: recommendedCreators.map((creator) => ({
          id: creator.id,
          displayName: creator.user.displayName || '',
          bio: creator.bio || '',
          avatar: creator.user.avatar || '',
          followerCount: 0,
          contentCount: 0,
          explainability: {
            factors: [{ name: 'not_followed', weight: 1 }],
            reason: 'Creators you might like',
          },
        })),
      };
    } catch (_err) {
      this.logger.error(
        `Failed to get creator recommendations for user ${userId}`,
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }

  async getCrossUniverseRecommendations(
    userId: string,
    limit = 10
  ): Promise<{ success: boolean; data?: RecommendationOutput[] }> {
    try {
      const cacheK = cacheKey('recommendation', `cross:${userId}:${limit}`);
      const cached = await this.cache.get<{ success: boolean; data?: RecommendationOutput[] }>(cacheK);
      if (cached) return cached;

      const watchHistory = await this.prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        take: 50,
      });

      const watchedContent = await this.prisma.contentItem.findMany({
        where: { id: { in: watchHistory.map((h) => h.contentId) } },
        include: { universe: true },
      });

      const watchedUniverseIds = watchedContent
        .map((c) => c.universeId)
        .filter((id): id is string => !!id);

      const freshnessCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const recommendations = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          universeId: { notIn: watchedUniverseIds },
          publishedAt: { gte: freshnessCutoff },
          id: { notIn: watchHistory.map((h) => h.contentId) },
        },
        include: {
          creator: { select: { id: true, displayName: true, avatar: true } },
          universe: true,
        },
        orderBy: { viewCount: 'desc' },
        take: limit,
      });

      const result = {
        success: true,
        data: recommendations.map((content) => ({
          id: content.id,
          title: content.title,
          description: content.description || '',
          thumbnail: content.thumbnail,
          creator: {
            id: content.creator.id,
            displayName: content.creator.displayName || '',
            avatar: content.creator.avatar || '',
          },
          universe: {
            id: content.universe.id,
            name: content.universe.name,
            slug: content.universe.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          },
          score: content.viewCount,
          explainability: {
            factors: [{ name: 'cross_universe_discovery', weight: content.viewCount }],
            reason: 'Explore content from other universes',
          },
          freshnessScore: content.publishedAt
            ? Math.max(
                0,
                100 -
                  Math.floor((Date.now() - content.publishedAt.getTime()) / (1000 * 60 * 60 * 24)) * 5
              )
            : 0,
        })),
      };

      await this.cache.set(cacheK, result, 1800);
      return result;
    } catch (_err) {
      this.logger.error(
        `Failed to get cross-universe recommendations for user ${userId}`,
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }

  async getUserSegment(userId: string): Promise<{ success: boolean; data?: UserSegment }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [user, watchHistory, payments, rewards] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.watchHistory.count({ where: { userId, watchedAt: { gte: thirtyDaysAgo } } }),
        this.prisma.paymentIntent.count({
          where: { userId, status: 'completed', createdAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.pointsLedger.aggregate({
          _sum: { points: true },
          where: { userId, type: 'credit', createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);
      const subscriptions = 0; // Subscription model not available in this service

      const totalPoints = rewards._sum.points || 0;
      const daysSinceSignup = Math.floor(
        (Date.now() - (user?.createdAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
      );

      let segment: UserSegment;

      if (payments >= 5 && subscriptions >= 1 && watchHistory >= 20) {
        segment = {
          segmentId: 'power_user',
          name: 'Power User',
          description: 'Highly engaged and monetized user',
          characteristics: {
            watchCount: watchHistory,
            paymentCount: payments,
            hasSubscription: subscriptions > 0,
            pointsEarned: totalPoints,
          },
        };
      } else if (watchHistory >= 10 && totalPoints >= 100) {
        segment = {
          segmentId: 'engaged',
          name: 'Engaged User',
          description: 'Regular active user with moderate engagement',
          characteristics: {
            watchCount: watchHistory,
            paymentCount: payments,
            hasSubscription: subscriptions > 0,
            pointsEarned: totalPoints,
          },
        };
      } else if (watchHistory >= 3 || payments >= 1) {
        segment = {
          segmentId: 'casual',
          name: 'Casual User',
          description: 'Occasional user with light engagement',
          characteristics: {
            watchCount: watchHistory,
            paymentCount: payments,
            hasSubscription: subscriptions > 0,
            pointsEarned: totalPoints,
          },
        };
      } else if (daysSinceSignup < 7) {
        segment = {
          segmentId: 'new',
          name: 'New User',
          description: 'Recently registered user',
          characteristics: {
            watchCount: watchHistory,
            paymentCount: payments,
            daysSinceSignup,
            pointsEarned: totalPoints,
          },
        };
      } else {
        segment = {
          segmentId: 'dormant',
          name: 'Dormant User',
          description: 'User with little to no recent activity',
          characteristics: {
            watchCount: watchHistory,
            paymentCount: payments,
            daysSinceSignup,
            pointsEarned: totalPoints,
          },
        };
      }

      return { success: true, data: segment };
    } catch (_err) {
      this.logger.error(
        `Failed to get user segment for user ${userId}`,
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }

  async getCreatorScore(creatorId: string): Promise<{ success: boolean; data?: CreatorScore }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [_creator, contentCount, views] = await Promise.all([
        this.prisma.creatorProfile.findUnique({ where: { userId: creatorId } }),
        this.prisma.contentItem.count({ where: { creatorId } }),
        this.prisma.productEvent.count({
          where: {
            type: 'content_view',
            metadata: { path: ['creatorId'], equals: creatorId },
            timestamp: { gte: thirtyDaysAgo },
          },
        }),
      ]);
      const followers = 0; // Follower model not available in this service
      const subscriptions = 0; // Subscription model not available in this service
      const tips = await this.prisma.paymentIntent.count({
        where: { userId: creatorId, status: 'completed', createdAt: { gte: thirtyDaysAgo } },
      });

      const factors = [
        { name: 'content_count', weight: 15, value: Math.min(contentCount, 50) },
        { name: 'views', weight: 30, value: Math.min(views, 10000) / 100 },
        { name: 'followers', weight: 25, value: Math.min(followers, 10000) / 100 },
        { name: 'subscriptions', weight: 20, value: subscriptions * 5 },
        { name: 'tips', weight: 10, value: tips * 2 },
      ];

      const score = factors.reduce((acc, f) => acc + (f.weight * f.value) / 100, 0);

      let tier: 'elite' | 'growth' | 'emerging' | 'new';
      if (score >= 80) tier = 'elite';
      else if (score >= 50) tier = 'growth';
      else if (score >= 25) tier = 'emerging';
      else tier = 'new';

      return {
        success: true,
        data: {
          creatorId,
          score: Math.round(score * 100) / 100,
          factors,
          tier,
        },
      };
    } catch (_err) {
      this.logger.error(
        `Failed to get creator score for creator ${creatorId}`,
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }

  async getChurnRisk(userId: string): Promise<{ success: boolean; data?: ChurnRisk }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [user, recentActivity, lastActivity, payments, rewards] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.productEvent.count({ where: { userId, timestamp: { gte: sevenDaysAgo } } }),
        this.prisma.productEvent.findFirst({ where: { userId }, orderBy: { timestamp: 'desc' } }),
        this.prisma.paymentIntent.count({ where: { userId, status: 'completed' } }),
        this.prisma.pointsLedger.count({
          where: { userId, type: 'credit', createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);
      const subscriptions = 0; // Subscription model not available in this service

      const daysSinceLastActivity = lastActivity
        ? Math.floor((Date.now() - lastActivity.timestamp.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const factors: string[] = [];
      let riskScore = 0;

      if (daysSinceLastActivity > 14) {
        riskScore += 30;
        factors.push('No activity in over 2 weeks');
      } else if (daysSinceLastActivity > 7) {
        riskScore += 15;
        factors.push('Reduced activity in the past week');
      }

      if (recentActivity < 3) {
        riskScore += 20;
        factors.push('Low recent engagement');
      }

      if (payments === 0) {
        riskScore += 15;
        factors.push('No purchase history');
      }

      if (subscriptions === 0) {
        riskScore += 15;
        factors.push('No active subscriptions');
      }

      if (rewards === 0) {
        riskScore += 10;
        factors.push('No rewards earned recently');
      }

      const daysSinceSignup = Math.floor(
        (Date.now() - (user?.createdAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceSignup < 7) {
        riskScore -= 10;
      }

      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore >= 70) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 30) riskLevel = 'medium';
      else riskLevel = 'low';

      const recommendations: string[] = [];
      if (daysSinceLastActivity > 7) recommendations.push('Send personalized content recommendation');
      if (payments === 0) recommendations.push('Offer a welcome discount');
      if (subscriptions === 0) recommendations.push('Promote subscription benefits');
      if (rewards === 0) recommendations.push('Highlight rewards program');

      return {
        success: true,
        data: {
          userId,
          riskScore: Math.min(100, Math.max(0, riskScore)),
          riskLevel,
          contributingFactors: factors,
          recommendations,
        },
      };
    } catch (_err) {
      this.logger.error(
        `Failed to get churn risk for user ${userId}`,
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }

  async getMonetizationInsights(
    userId: string
  ): Promise<{ success: boolean; data?: MonetizationInsight }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [payments, watchHistory, rewards, user] = await Promise.all([
        this.prisma.paymentIntent.aggregate({
          _sum: { amount: true },
          where: { userId, status: 'completed' },
        }),
        this.prisma.watchHistory.count({ where: { userId, watchedAt: { gte: thirtyDaysAgo } } }),
        this.prisma.pointsLedger.aggregate({
          _sum: { points: true },
          where: { userId, type: 'credit' },
        }),
        this.prisma.user.findUnique({ where: { id: userId } }),
      ]);
      const subscriptions = 0; // Subscription model not available in this service

      const totalSpent = Number(payments._sum.amount) || 0;
      const totalPoints = rewards._sum.points || 0;
      const daysSinceSignup = Math.floor(
        (Date.now() - (user?.createdAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
      );

      const avgMonthlySpend = totalSpent / Math.max(1, Math.ceil(daysSinceSignup / 30));
      const engagementRate = watchHistory / Math.max(1, daysSinceSignup);

      let predictedLTV: number;
      let optimalPricePoint: number;
      let recommendedActions: string[];
      let segment: string;

      if (avgMonthlySpend >= 5000 && engagementRate >= 2) {
        predictedLTV = avgMonthlySpend * 24;
        optimalPricePoint = 5000;
        recommendedActions = [
          'Offer premium subscriptions',
          'Promote exclusive content',
          'Suggest creator tips',
        ];
        segment = 'high_value';
      } else if (avgMonthlySpend >= 1000 || subscriptions >= 1) {
        predictedLTV = avgMonthlySpend * 18;
        optimalPricePoint = 2000;
        recommendedActions = [
          'Promote annual subscriptions',
          'Offer bundled passes',
          'Highlight loyalty rewards',
        ];
        segment = 'medium_value';
      } else if (watchHistory >= 10 || totalPoints >= 50) {
        predictedLTV = avgMonthlySpend * 12 + 5000;
        optimalPricePoint = 1000;
        recommendedActions = [
          'Offer introductory discounts',
          'Promote freemium features',
          'Suggest first purchase bonuses',
        ];
        segment = 'potential_value';
      } else {
        predictedLTV = avgMonthlySpend * 6;
        optimalPricePoint = 500;
        recommendedActions = [
          'Onboard with free content',
          'Highlight value proposition',
          'Send welcome offers',
        ];
        segment = 'new_user';
      }

      return {
        success: true,
        data: {
          userId,
          predictedLTV: Math.round(predictedLTV),
          optimalPricePoint,
          recommendedActions,
          segment,
        },
      };
    } catch (_err) {
      this.logger.error(
        `Failed to get monetization insights for user ${userId}`,
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }

  async assessFraudRisk(data: {
    userId?: string;
    contentId?: string;
    transactionId?: string;
    voteActivity?: unknown;
  }): Promise<{ success: boolean; data?: FraudRisk }> {
    try {
      const { userId, contentId, transactionId } = data;

      const indicators: { name: string; score: number; description: string }[] = [];
      let riskScore = 0;

      if (userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const daysSinceSignup = Math.floor(
          (Date.now() - (user?.createdAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceSignup < 1) {
          riskScore += 25;
          indicators.push({
            name: 'new_account',
            score: 25,
            description: 'Account created within last 24 hours',
          });
        }

        // Vote model not available in this service - skipping vote-based risk

        const paymentCount = await this.prisma.paymentIntent.count({
          where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        });
        if (paymentCount > 5) {
          riskScore += 15;
          indicators.push({
            name: 'rapid_payments',
            score: 15,
            description: 'Multiple payments in short period',
          });
        }
      }

      if (contentId) {
        const content = await this.prisma.contentItem.findUnique({
          where: { id: contentId },
          include: { creator: true },
        });
        if (content && content.createdAt && content.creator) {
          const hoursSinceUpload = Math.floor(
            (Date.now() - content.createdAt.getTime()) / (1000 * 60 * 60)
          );
          if (hoursSinceUpload < 1) {
            const viewCount = await this.prisma.productEvent.count({
              where: { type: 'content_view', metadata: { path: ['contentId'], equals: contentId } },
            });
            if (viewCount > 100) {
              riskScore += 30;
              indicators.push({
                name: 'rapid_views',
                score: 30,
                description: 'Abnormally high views for new content',
              });
            }
          }
        }
      }

      if (transactionId) {
        const transaction = await this.prisma.paymentIntent.findUnique({
          where: { id: transactionId },
        });
        if (transaction && transaction.amount && Number(transaction.amount) > 100000) {
          riskScore += 20;
          indicators.push({
            name: 'large_transaction',
            score: 20,
            description: 'Transaction amount exceeds normal limits',
          });
        }
      }

      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore >= 70) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 30) riskLevel = 'medium';
      else riskLevel = 'low';

      return {
        success: true,
        data: {
          userId,
          contentId,
          transactionId,
          riskScore: Math.min(100, riskScore),
          riskLevel,
          indicators,
        },
      };
    } catch (_err) {
      this.logger.error(
        'Failed to assess fraud risk',
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }

  async getPersonalizedFeed(
    userId: string,
    limit = 20
  ): Promise<{ success: boolean; data?: RecommendationOutput[] }> {
    try {
      const [segmentResult, churnResult] = await Promise.all([
        this.getUserSegment(userId),
        this.getChurnRisk(userId),
      ]);

      const baseInput: RecommendationInput = { userId, limit };

      if (churnResult.data?.riskLevel === 'high' || churnResult.data?.riskLevel === 'critical') {
        baseInput.freshnessDays = 3;
      }

      const recommendations = await this.getContentRecommendations(baseInput);

      if (segmentResult.data?.segmentId === 'power_user') {
        const crossUniverse = await this.getCrossUniverseRecommendations(
          userId,
          Math.floor(limit * 0.3)
        );
        if (crossUniverse.data) {
          recommendations.data = [
            ...(recommendations.data || []).slice(0, Math.floor(limit * 0.7)),
            ...crossUniverse.data,
          ];
        }
      }

      return recommendations;
    } catch (_err) {
      this.logger.error(
        `Failed to get personalized feed for user ${userId}`,
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }
}
