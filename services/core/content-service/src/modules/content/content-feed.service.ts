import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { RedisService } from '../../cache/redis.service';
import { ConfigService } from '@nestjs/config';

type ContentWithUniverse = Prisma.ContentItemGetPayload<{ include: { universe: true } }>;

@Injectable()
export class ContentFeedService {
  private readonly logger = new Logger(ContentFeedService.name);
  private readonly cacheTTL: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {
    this.cacheTTL = this.configService.get<number>('CONTENT_CACHE_TTL', 300);
  }

  async getHomeFeed(userId?: string): Promise<{
    success: boolean;
    data: {
      trending: ContentWithUniverse[];
      recommended: ContentWithUniverse[];
      latest: ContentWithUniverse[];
    };
  }> {
    const cacheKey = `home-feed:${userId || 'anonymous'}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const contentSelect = {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      windowType: true,
      status: true,
      viewCount: true,
      createdAt: true,
      universe: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    };

    const watchedContentIds = userId
      ? (
          await this.prisma.watchHistory.findMany({
            where: { userId },
            select: { contentId: true },
          })
        ).map((h) => h.contentId)
      : [];

    const [trending, recommended, latest] = await Promise.all([
      this.prisma.contentItem.findMany({
        where: { status: 'published' },
        select: contentSelect,
        orderBy: { viewCount: 'desc' },
        take: 10,
      }),
      userId
        ? this.prisma.contentItem.findMany({
            where: {
              status: 'published',
              id: { notIn: watchedContentIds },
            },
            select: contentSelect,
            orderBy: { viewCount: 'desc' },
            take: 10,
          })
        : [],
      this.prisma.contentItem.findMany({
        where: { status: 'published' },
        select: contentSelect,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const result = {
      success: true,
      data: {
        trending: trending as unknown as ContentWithUniverse[],
        recommended: recommended as unknown as ContentWithUniverse[],
        latest: latest as unknown as ContentWithUniverse[],
      },
    };

    await this.redisService.set(cacheKey, JSON.stringify(result), this.cacheTTL);

    return result;
  }

  async getWatchFeed(_userId?: string): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    const content = await this.prisma.contentItem.findMany({
      where: { status: 'published' },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        status: true,
        viewCount: true,
        createdAt: true,
        universe: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: { viewCount: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: content as ContentWithUniverse[],
    };
  }

  async getFeatured(): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    try {
      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          OR: [{ isExclusive: true }, { isPremiere: true }],
        },
        orderBy: { viewCount: 'desc' },
        take: 20,
        include: { universe: true },
      });

      if (content.length === 0) {
        const fallback = await this.prisma.contentItem.findMany({
          where: { status: 'published' },
          orderBy: { viewCount: 'desc' },
          take: 6,
          include: { universe: true },
        });
        return { success: true, data: fallback };
      }

      return { success: true, data: content };
    } catch (error) {
      this.logger.error(`getFeatured failed: ${(error as Error).message}`);
      return { success: true, data: [] };
    }
  }

  async getTrending(): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    try {
      const content = await this.prisma.contentItem.findMany({
        where: { status: 'published' },
        orderBy: { viewCount: 'desc' },
        take: 20,
        include: { universe: true },
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`getTrending failed: ${(error as Error).message}`);
      return {
        success: true,
        data: [],
      };
    }
  }

  async getNewReleases(limit?: number): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    try {
      const take = Math.min(limit || 12, 50);
      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          releaseDate: { not: null },
        },
        orderBy: { releaseDate: 'desc' },
        take,
        include: { universe: true },
      });

      return { success: true, data: content };
    } catch (error) {
      this.logger.error(`getNewReleases failed: ${(error as Error).message}`);
      return { success: true, data: [] };
    }
  }

  async getFeaturedSlides(limit?: number): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    try {
      const take = Math.min(limit || 5, 10);
      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          OR: [{ isExclusive: true }, { isPremiere: true }],
        },
        orderBy: { viewCount: 'desc' },
        take,
        include: { universe: true },
      });

      if (content.length === 0) {
        const fallback = await this.prisma.contentItem.findMany({
          where: { status: 'published' },
          orderBy: { viewCount: 'desc' },
          take,
          include: { universe: true },
        });
        return { success: true, data: fallback };
      }

      return { success: true, data: content };
    } catch (error) {
      this.logger.error(`getFeaturedSlides failed: ${(error as Error).message}`);
      return { success: true, data: [] };
    }
  }

  async getPopularInRegion(limit?: number): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    try {
      const take = Math.min(limit || 12, 50);
      const content = await this.prisma.contentItem.findMany({
        where: { status: 'published' },
        orderBy: { viewCount: 'desc' },
        take,
        include: { universe: true },
      });

      return { success: true, data: content };
    } catch (error) {
      this.logger.error(`getPopularInRegion failed: ${(error as Error).message}`);
      return { success: true, data: [] };
    }
  }

  async getRecommended(userId: string): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    const watchedContent = await this.prisma.watchHistory.findMany({
      where: { userId },
      take: 100,
      orderBy: { watchedAt: 'desc' },
    });

    const watchedContentIds = watchedContent.map((h) => h.contentId);

    const watchedContentItems = await this.prisma.contentItem.findMany({
      where: { id: { in: watchedContentIds } },
      select: { id: true, universeId: true },
    });

    const watchedUniverseIds = watchedContentItems.map((c) => c.universeId).filter((id) => id);

    const content = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        universeId: { in: watchedUniverseIds.length ? watchedUniverseIds : undefined },
        id: {
          notIn: watchedContentIds,
        },
      },
      orderBy: { viewCount: 'desc' },
      take: 20,
      include: { universe: true },
    });

    return {
      success: true,
      data: content,
    };
  }
}
