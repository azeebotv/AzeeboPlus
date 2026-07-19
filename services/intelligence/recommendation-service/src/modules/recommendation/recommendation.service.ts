import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import axios from 'axios';

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

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  private async getSubscriptionCount(userId: string): Promise<number> {
    try {
      const baseUrl = this.configService.get<string>('SUBSCRIPTION_SERVICE_URL');
      if (!baseUrl) return 0;
      const res = await axios.get<{ pagination?: { total?: number } }>(
        `${baseUrl}/v1/subscription/history`,
        {
          params: { userId, limit: 1 },
          timeout: 5000,
          headers: {
            'x-user-id': userId,
            'x-gateway-secret': this.configService.get<string>('INTERNAL_API_KEY', ''),
          },
        }
      );
      return res.data?.pagination?.total ?? 0;
    } catch {
      return 0;
    }
  }

  private async getFollowerCount(creatorId: string): Promise<number> {
    try {
      const baseUrl = this.configService.get<string>('CREATOR_SERVICE_URL');
      if (!baseUrl) return 0;
      const res = await axios.get<{ data?: { followerCount?: number } }>(
        `${baseUrl}/v1/creators/stats`,
        {
          timeout: 5000,
          headers: {
            'x-user-id': creatorId,
            'x-gateway-secret': this.configService.get<string>('INTERNAL_API_KEY', ''),
          },
        }
      );
      return res.data?.data?.followerCount ?? 0;
    } catch {
      return 0;
    }
  }

  private async getCreatorContentCount(creatorId: string): Promise<number> {
    try {
      const baseUrl = this.configService.get<string>('CREATOR_SERVICE_URL');
      if (!baseUrl) return 0;
      const res = await axios.get<{ data?: { contentCount?: number } }>(
        `${baseUrl}/v1/creators/stats`,
        {
          timeout: 5000,
          headers: {
            'x-user-id': creatorId,
            'x-gateway-secret': this.configService.get<string>('INTERNAL_API_KEY', ''),
          },
        }
      );
      return res.data?.data?.contentCount ?? 0;
    } catch {
      return 0;
    }
  }

  async getContentRecommendations(
    input: RecommendationInput
  ): Promise<{ success: boolean; data?: RecommendationOutput[] }> {
    try {
      const { userId, limit = 20, universe, freshnessDays = 7 } = input;

      if (!userId) {
        const cacheK = cacheKey('recommendation', `popular:${universe || 'all'}`);
        const cached = await this.cache.get<{ success: boolean; data?: RecommendationOutput[] }>(
          cacheK
        );
        if (cached) return cached;

        const result = await this.getFallbackRecommendations(limit, universe, freshnessDays);
        if (result.success && result.data) {
          await this.cache.set(cacheK, result, 3600);
        }
        return result;
      }

      const cacheK = cacheKey(
        'recommendation',
        `user:${userId}:${limit}:${universe || 'all'}:${freshnessDays}`
      );
      const cached = await this.cache.get<{ success: boolean; data?: RecommendationOutput[] }>(
        cacheK
      );
      if (cached) return cached;

      const [watchHistory, rewardAccount] = await Promise.all([
        this.prisma.contentItem.findMany({
          where: { userId },
          orderBy: { watchedAt: 'desc' },
          take: 100,
        }),
        this.prisma.userSegment.findFirst({
          where: { userId },
        }),
      ]);

      const watchedContentIds = watchHistory
        .map((h) => h.contentId)
        .filter((id): id is string => !!id);

      if (watchedContentIds.length === 0) {
        return this.getFallbackRecommendations(limit, universe, freshnessDays);
      }

      const watchedContent = await this.prisma.contentItem.findMany({
        where: { id: { in: watchedContentIds } },
      });

      const universeCounts = watchedContent.reduce(
        (acc, c) => {
          const name = c.universe || 'unknown';
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const categoryCounts = watchedContent.reduce(
        (acc, c) => {
          (Array.isArray(c.categories) ? c.categories : []).forEach((cat) => {
            if (cat) acc[cat] = (acc[cat] || 0) + 1;
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
          ...(universe && { universe }),
          ...(topUniverse && !universe && { universe: topUniverse }),
        },
        orderBy: { viewCount: 'desc' },
        take: limit * 3,
      });

      const creatorIds = [
        ...new Set(candidateContent.map((c) => c.creatorId).filter((id): id is string => !!id)),
      ];
      const creatorProfiles =
        creatorIds.length > 0
          ? await this.prisma.creatorProfile.findMany({ where: { userId: { in: creatorIds } } })
          : [];
      const creatorMap = new Map(creatorProfiles.map((cp) => [cp.userId, cp]));

      const scored = candidateContent.map((content) => {
        const factors: { name: string; weight: number }[] = [];
        let reason = '';

        let baseScore = content.viewCount * 0.3;

        if (content.universe === topUniverse) {
          baseScore += 30;
          factors.push({ name: 'universe_match', weight: 30 });
          reason = `You frequently watch ${topUniverse}`;
        }

        const contentCategories = (content.categories || []).filter((c): c is string => !!c);
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
          thumbnail: content.thumbnail ?? '',
          creator: {
            id: content.creatorId ?? '',
            displayName: creatorMap.get(content.creatorId ?? '')?.displayName ?? '',
            avatar: creatorMap.get(content.creatorId ?? '')?.avatar ?? '',
          },
          universe: {
            id: content.universeId,
            name: content.universe,
            slug: content.universe.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
    } catch (error) {
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
          ...(universe && { universe }),
        },
        orderBy: { viewCount: 'desc' },
        take: limit,
      });

      const fallbackCreatorIds = [
        ...new Set(trending.map((c) => c.creatorId).filter((id): id is string => !!id)),
      ];
      const fallbackCreators =
        fallbackCreatorIds.length > 0
          ? await this.prisma.creatorProfile.findMany({
              where: { userId: { in: fallbackCreatorIds } },
            })
          : [];
      const fallbackCreatorMap = new Map(fallbackCreators.map((cp) => [cp.userId, cp]));

      return {
        success: true,
        data: trending.map((content) => ({
          id: content.id,
          title: content.title,
          description: content.description || '',
          thumbnail: content.thumbnail ?? '',
          creator: {
            id: content.creatorId ?? '',
            displayName: fallbackCreatorMap.get(content.creatorId ?? '')?.displayName ?? '',
            avatar: fallbackCreatorMap.get(content.creatorId ?? '')?.avatar ?? '',
          },
          universe: {
            id: content.universeId,
            name: content.universe,
            slug: content.universe.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
                  Math.floor((Date.now() - content.publishedAt.getTime()) / (1000 * 60 * 60 * 24)) *
                    5
              )
            : 0,
        })),
      };
    } catch (error) {
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
        take: limit,
      });

      return {
        success: true,
        data: await Promise.all(
          recommendedCreators.map(async (creator) => ({
            id: creator.id,
            displayName: creator.displayName || '',
            bio: creator.bio || '',
            avatar: creator.avatar || '',
            followerCount: await this.getFollowerCount(creator.userId),
            contentCount: await this.getCreatorContentCount(creator.userId),
            explainability: {
              factors: [{ name: 'not_followed', weight: 1 }],
              reason: 'Creators you might like',
            },
          }))
        ),
      };
    } catch (error) {
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
      const cached = await this.cache.get<{ success: boolean; data?: RecommendationOutput[] }>(
        cacheK
      );
      if (cached) return cached;

      const watchHistory = await this.prisma.contentItem.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        take: 50,
      });

      const watchedContent = await this.prisma.contentItem.findMany({
        where: {
          id: { in: watchHistory.map((h) => h.contentId).filter((id): id is string => !!id) },
        },
        // universe is a string field
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
          id: { notIn: watchHistory.map((h) => h.contentId).filter((id): id is string => !!id) },
        },
        orderBy: { viewCount: 'desc' },
        take: limit,
      });

      const crossCreatorIds = [
        ...new Set(recommendations.map((c) => c.creatorId).filter((id): id is string => !!id)),
      ];
      const crossCreators =
        crossCreatorIds.length > 0
          ? await this.prisma.creatorProfile.findMany({
              where: { userId: { in: crossCreatorIds } },
            })
          : [];
      const crossCreatorMap = new Map(crossCreators.map((cp) => [cp.userId, cp]));

      const result = {
        success: true,
        data: recommendations.map((content) => ({
          id: content.id,
          title: content.title,
          description: content.description || '',
          thumbnail: content.thumbnail ?? '',
          creator: {
            id: content.creatorId ?? '',
            displayName: crossCreatorMap.get(content.creatorId ?? '')?.displayName ?? '',
            avatar: crossCreatorMap.get(content.creatorId ?? '')?.avatar ?? '',
          },
          universe: {
            id: content.universeId,
            name: content.universe,
            slug: content.universe.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
                  Math.floor((Date.now() - content.publishedAt.getTime()) / (1000 * 60 * 60 * 24)) *
                    5
              )
            : 0,
        })),
      };

      await this.cache.set(cacheK, result, 1800);
      return result;
    } catch (error) {
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
        this.prisma.contentItem.count({ where: { userId, watchedAt: { gte: thirtyDaysAgo } } }),
        this.prisma.paymentIntent.count({
          where: { userId, status: 'completed', createdAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.pointsLedger.aggregate({
          _sum: { points: true },
          where: { userId, type: 'credit', createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);
      const subscriptions = await this.getSubscriptionCount(userId);

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
    } catch (error) {
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
            eventName: 'content_view',
            metadata: { path: ['creatorId'], equals: creatorId },
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);
      const followers = await this.getFollowerCount(creatorId);
      const subscriptions = await this.getSubscriptionCount(creatorId);
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
    } catch (error) {
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
        this.prisma.productEvent.count({ where: { userId, createdAt: { gte: sevenDaysAgo } } }),
        this.prisma.productEvent.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
        this.prisma.paymentIntent.count({ where: { userId, status: 'completed' } }),
        this.prisma.pointsLedger.count({
          where: { userId, type: 'credit', createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);
      const subscriptions = await this.getSubscriptionCount(userId);

      const daysSinceLastActivity = lastActivity
        ? Math.floor((Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
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
      if (daysSinceLastActivity > 7)
        recommendations.push('Send personalized content recommendation');
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
    } catch (error) {
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
        this.prisma.contentItem.count({ where: { userId, watchedAt: { gte: thirtyDaysAgo } } }),
        this.prisma.pointsLedger.aggregate({
          _sum: { points: true },
          where: { userId, type: 'credit' },
        }),
        this.prisma.user.findUnique({ where: { id: userId } }),
      ]);
      const subscriptions = await this.getSubscriptionCount(userId);

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
    } catch (error) {
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
          // creator is a string field
        });
        if (content && content.createdAt && content.creatorId) {
          const hoursSinceUpload = Math.floor(
            (Date.now() - content.createdAt.getTime()) / (1000 * 60 * 60)
          );
          if (hoursSinceUpload < 1) {
            const viewCount = await this.prisma.productEvent.count({
              where: {
                eventName: 'content_view',
                metadata: { path: ['contentId'], equals: contentId },
              },
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
    } catch (error) {
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
    } catch (error) {
      this.logger.error(
        `Failed to get personalized feed for user ${userId}`,
        error instanceof Error ? (error as Error).message : String(error)
      );
      return { success: false };
    }
  }
}
