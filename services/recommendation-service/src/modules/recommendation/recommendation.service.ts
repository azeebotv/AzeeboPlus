import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

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

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async getContentRecommendations(
    input: RecommendationInput
  ): Promise<{ success: boolean; data?: RecommendationOutput[] }> {
    const { userId, limit = 20, universe, _contentType, freshnessDays = 7 } = input;

    if (!userId) {
      return this.getFallbackRecommendations(limit, universe, freshnessDays);
    }

    const [watchHistory, _userPrefs, rewardAccount] = await Promise.all([
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

    const watchedContentIds = watchHistory.map((h) => h.contentId);

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

    return { success: true, data: crossUniverseDiversity.slice(0, limit) };
  }

  private async getFallbackRecommendations(
    limit: number,
    universe?: string,
    freshnessDays = 7
  ): Promise<{ success: boolean; data?: RecommendationOutput[] }> {
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
    const followedCreators = await this.prisma.creatorProfile.findMany({
      where: { subscribers: { some: { subscriberId: userId } } },
      select: { id: true },
    });

    const followedIds = followedCreators.map((c) => c.id);

    const recommendedCreators = await this.prisma.creatorProfile.findMany({
      where: {
        id: { notIn: followedIds },
      },
      include: {
        user: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { subscribers: true, contentItems: true } },
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
        followerCount: creator._count.subscribers,
        contentCount: creator._count.contentItems,
        explainability: {
          factors: [{ name: 'not_followed', weight: 1 }],
          reason: 'Creators you might like',
        },
      })),
    };
  }

  async getCrossUniverseRecommendations(
    userId: string,
    limit = 10
  ): Promise<{ success: boolean; data?: RecommendationOutput[] }> {
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

    return {
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
  }
}
