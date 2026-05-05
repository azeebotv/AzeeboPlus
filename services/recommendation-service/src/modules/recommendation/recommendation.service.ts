import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async getContentRecommendations(userId: string) {
    // Get user's watched content
    const watchedHistory = await this.prisma.watchHistory.findMany({
      where: { userId },
      select: { contentId: true },
    });

    const watchedContentIds = watchedHistory.map((h) => h.contentId);

    // Get content from watched universes
    const watchedContent = await this.prisma.contentItem.findMany({
      where: { id: { in: watchedContentIds } },
      include: { universe: true },
    });

    const watchedUniverseIds = watchedContent
      .map((c) => c.universeId)
      .filter((id) => id);

    // Get content from same universes
    const content = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        universeId: { in: watchedUniverseIds.length ? watchedUniverseIds : undefined },
        id: { notIn: watchedContentIds },
      },
      orderBy: { viewCount: 'desc' },
      take: 20,
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: content,
    };
  }

  async getCreatorRecommendations(userId: string) {
    // Get user's followed creators
    const followedCreators = await this.prisma.creatorProfile.findMany({
      where: { userId },
      include: { user: true },
    });

    // Get creators with similar content
    const recommendedCreators = await this.prisma.creatorProfile.findMany({
      where: {
        id: { notIn: followedCreators.map((c) => c.id) },
      },
      include: { user: true },
      take: 10,
    });

    return {
      success: true,
      data: recommendedCreators,
    };
  }

  async getCrossUniverseRecommendations(userId: string) {
    // Get user's watched content
    const watchedHistory = await this.prisma.watchHistory.findMany({
      where: { userId },
      select: { contentId: true },
    });

    const watchedContentIds = watchedHistory.map((h) => h.contentId);

    // Get content details to find universes
    const watchedContent = await this.prisma.contentItem.findMany({
      where: { id: { in: watchedContentIds } },
      include: { universe: true },
    });

    const universeCounts = watchedContent.reduce((acc, c) => {
      const universeId = c.universeId;
      acc[universeId] = (acc[universeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUniverseId = Object.entries(universeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Get content from other universes
    const content = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        universeId: { not: topUniverseId },
        id: { notIn: watchedContentIds },
      },
      orderBy: { viewCount: 'desc' },
      take: 10,
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: content,
    };
  }

  async getPersonalizedFeed(userId: string) {
    // Combine content and creator recommendations
    const [content, creators] = await Promise.all([
      this.getContentRecommendations(userId),
      this.getCreatorRecommendations(userId),
    ]);

    return {
      success: true,
      data: {
        content: content.data,
        creators: creators.data,
      },
    };
  }
}
