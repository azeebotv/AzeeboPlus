import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '@azeebo/shared-services';
import { FeedItem } from './feed.helper';

export type { FeedItem } from './feed.helper';

interface FeedResponse {
  success: boolean;
  data?: {
    items: FeedItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface FeedStory {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  category?: { name: string } | null;
}

interface FeedEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  category?: { name: string } | null;
}

interface FeedCityGuide {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
  type: string;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
}

interface FeedMusic {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  artistName: string | null;
  genre: string | null;
  type: string;
  playCount: number;
  publishedAt: Date | null;
  createdAt: Date;
}

interface FeedCelebrity {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  coverImage: string | null;
  profession: string | null;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
}

interface FeedNightlife {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string | null;
  type: string;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
}

interface FeedInfluencer {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  coverImage: string | null;
  category: string | null;
  followerCount: number;
  createdAt: Date;
}

@Injectable()
export class LifestyleFeedService {
  private readonly logger = new Logger(LifestyleFeedService.name);
  private readonly cacheTTL: number;

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(RedisService) private redisService: RedisService,
    @Inject(ConfigService) private configService: ConfigService
  ) {
    this.cacheTTL = this.configService.get<number>('FEED_CACHE_TTL', 300); // 5 minutes default
  }

  private mapToFeedItems(data: {
    stories: FeedStory[];
    events: FeedEvent[];
    cityGuides: FeedCityGuide[];
    music: FeedMusic[];
    celebrities: FeedCelebrity[];
    nightlife: FeedNightlife[];
    influencers: FeedInfluencer[];
  }): FeedItem[] {
    return [
      ...data.stories.map((s) => ({
        id: s.id,
        type: 'story',
        title: s.title,
        slug: s.slug,
        excerpt: s.excerpt || s.content.substring(0, 150),
        coverImage: s.coverImage || '',
        authorName: (s as unknown as Record<string, unknown>).author
          ? (((s as unknown as Record<string, unknown>).author as Record<string, unknown>)
              .displayName as string) || ''
          : '',
        categoryName: s.category?.name || 'General',
        viewCount: s.viewCount,
        publishedAt: s.publishedAt?.toISOString() || s.createdAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      ...data.events.map((e) => ({
        id: e.id,
        type: 'event',
        title: e.title,
        slug: e.slug,
        excerpt: e.description.substring(0, 150),
        coverImage: e.coverImage || '',
        authorName: (e as unknown as Record<string, unknown>).organizer
          ? (((e as unknown as Record<string, unknown>).organizer as Record<string, unknown>)
              .displayName as string) || ''
          : '',
        categoryName: e.category?.name || 'General',
        viewCount: e.viewCount,
        publishedAt: e.publishedAt?.toISOString() || e.createdAt.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
      ...data.cityGuides.map((c) => ({
        id: c.id,
        type: 'city_guide',
        title: c.name,
        slug: c.slug,
        excerpt: c.description.substring(0, 150),
        coverImage: c.coverImage || '',
        authorName: 'City Guide',
        categoryName: c.type,
        viewCount: c.viewCount,
        publishedAt: c.publishedAt?.toISOString() || c.createdAt.toISOString(),
        createdAt: c.createdAt.toISOString(),
      })),
      ...data.music.map((m) => ({
        id: m.id,
        type: 'music',
        title: m.title,
        slug: m.slug,
        excerpt: m.description || `By ${m.artistName || 'Unknown Artist'}`,
        coverImage: m.coverImage || '',
        authorName: m.artistName || 'Unknown',
        categoryName: m.genre || m.type,
        viewCount: m.playCount,
        publishedAt: m.publishedAt?.toISOString() || m.createdAt.toISOString(),
        createdAt: m.createdAt.toISOString(),
      })),
      ...data.celebrities.map((c) => ({
        id: c.id,
        type: 'celebrity',
        title: c.name,
        slug: c.slug,
        excerpt: c.bio?.substring(0, 150) || '',
        coverImage: c.coverImage || '',
        authorName: c.profession || 'Celebrity',
        categoryName: c.profession || 'Celebrity',
        viewCount: c.viewCount,
        publishedAt: c.publishedAt?.toISOString() || c.createdAt.toISOString(),
        createdAt: c.createdAt.toISOString(),
      })),
      ...data.nightlife.map((n) => ({
        id: n.id,
        type: 'nightlife',
        title: n.name,
        slug: n.slug,
        excerpt: n.description.substring(0, 150),
        coverImage: n.coverImage || '',
        authorName: 'Nightlife',
        categoryName: n.type,
        viewCount: n.viewCount,
        publishedAt: n.publishedAt?.toISOString() || n.createdAt.toISOString(),
        createdAt: n.createdAt.toISOString(),
      })),
      ...data.influencers.map((i) => ({
        id: i.id,
        type: 'influencer',
        title: i.displayName,
        slug: i.slug,
        excerpt: i.bio?.substring(0, 150) || '',
        coverImage: i.coverImage || '',
        authorName: i.category || 'Influencer',
        categoryName: i.category || 'Influencer',
        viewCount: i.followerCount,
        publishedAt: i.createdAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
      })),
    ];
  }

  async getFeed(page = 1, limit = 20, category?: string): Promise<FeedResponse> {
    const offset = (page - 1) * limit;
    const cacheKey = `lifestyle:feed:${page}:${limit}:${category || 'all'}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug('Feed cache hit');
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Cache read failed', error);
    }

    const fetchLimit = Math.min(limit, 50);

    try {
      const [stories, events, cityGuides, music, celebrities, nightlife, influencers] =
        await Promise.all([
          this.prisma.cultureStory.findMany({
            where: { status: 'published' },
            include: { category: true },
            take: fetchLimit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.event.findMany({
            where: { status: 'published' },
            include: { category: true },
            take: fetchLimit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.cityGuideEntry.findMany({
            where: { status: 'published' },
            include: { tags: true },
            take: fetchLimit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.musicEntry.findMany({
            where: { status: 'published' },
            take: fetchLimit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.celebrityEntry.findMany({
            where: { status: 'published' },
            take: fetchLimit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.nightlifeEntry.findMany({
            where: { status: 'published' },
            take: fetchLimit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.influencerEntry.findMany({
            where: { status: 'published' },
            take: fetchLimit,
            orderBy: { createdAt: 'desc' },
          }),
        ]);

      const allItems = this.mapToFeedItems({
        stories,
        events,
        cityGuides,
        music,
        celebrities,
        nightlife,
        influencers,
      });

      const sortedItems = allItems.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      let filteredItems = sortedItems;
      if (category) {
        filteredItems = sortedItems.filter(
          (item) =>
            item.categoryName.toLowerCase() === category.toLowerCase() ||
            item.type.toLowerCase() === category.toLowerCase()
        );
      }

      const total = filteredItems.length;
      const paginatedItems = filteredItems.slice(offset, offset + limit);

      const response: FeedResponse = {
        success: true,
        data: {
          items: paginatedItems,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      try {
        await this.redisService.set(cacheKey, JSON.stringify(response), this.cacheTTL);
      } catch (error) {
        this.logger.warn('Cache write failed', error);
      }

      return response;
    } catch (error) {
      this.logger.error(`Failed to fetch feed: ${error}`);
      return { success: false, data: { items: [], total: 0, page, limit, totalPages: 0 } };
    }
  }

  async getTrending(limit = 10): Promise<FeedResponse> {
    const cacheKey = `lifestyle:trending:${limit}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug('Trending cache hit');
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Cache read failed', error);
    }

    try {
      const [stories, events, cityGuides, music, celebrities, nightlife, influencers] =
        await Promise.all([
          this.prisma.cultureStory.findMany({
            where: { status: 'published' },
            include: { category: true },
            take: limit * 2,
            orderBy: { viewCount: 'desc' },
          }),
          this.prisma.event.findMany({
            where: { status: 'published' },
            include: { category: true },
            take: limit * 2,
            orderBy: { viewCount: 'desc' },
          }),
          this.prisma.cityGuideEntry.findMany({
            where: { status: 'published' },
            include: { tags: true },
            take: limit * 2,
            orderBy: { viewCount: 'desc' },
          }),
          this.prisma.musicEntry.findMany({
            where: { status: 'published' },
            take: limit * 2,
            orderBy: { playCount: 'desc' },
          }),
          this.prisma.celebrityEntry.findMany({
            where: { status: 'published' },
            take: limit * 2,
            orderBy: { viewCount: 'desc' },
          }),
          this.prisma.nightlifeEntry.findMany({
            where: { status: 'published' },
            take: limit * 2,
            orderBy: { viewCount: 'desc' },
          }),
          this.prisma.influencerEntry.findMany({
            where: { status: 'published' },
            take: limit * 2,
            orderBy: { followerCount: 'desc' },
          }),
        ]);

      const allItems = this.mapToFeedItems({
        stories,
        events,
        cityGuides,
        music,
        celebrities,
        nightlife,
        influencers,
      });

      const trending = allItems.sort((a, b) => b.viewCount - a.viewCount).slice(0, limit);

      const response: FeedResponse = {
        success: true,
        data: {
          items: trending,
          total: trending.length,
          page: 1,
          limit,
          totalPages: 1,
        },
      };

      try {
        await this.redisService.set(cacheKey, JSON.stringify(response), this.cacheTTL);
      } catch (error) {
        this.logger.warn('Cache write failed', error);
      }

      return response;
    } catch (error) {
      this.logger.error(`Failed to fetch trending: ${error}`);
      return { success: false, data: { items: [], total: 0, page: 1, limit, totalPages: 0 } };
    }
  }
}
