import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../../common/services/redis.service';

interface FeedItem {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  authorName: string;
  categoryName: string;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
}

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

@Injectable()
export class LifestyleFeedService {
  private readonly logger = new Logger(LifestyleFeedService.name);
  private readonly cacheTTL: number;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private configService: ConfigService
  ) {
    this.cacheTTL = this.configService.get<number>('FEED_CACHE_TTL', 300); // 5 minutes default
  }

  async getFeed(page = 1, limit = 20, category?: string): Promise<FeedResponse> {
    const offset = (page - 1) * limit;
    const cacheKey = `lifestyle:feed:${page}:${limit}:${category || 'all'}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug('Feed cache hit');
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Cache read failed', error);
    }

    // Fetch only the records we need with database-level pagination
    // We need to fetch more than the limit to account for filtering and sorting
    const fetchLimit = limit * 2; // Fetch extra to ensure we have enough after filtering

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

    const allItems: FeedItem[] = [
      ...stories.map((s) => ({
        id: s.id,
        type: 'story',
        title: s.title,
        slug: s.slug,
        excerpt: s.excerpt || s.content.substring(0, 150),
        coverImage: s.coverImage || '',
        authorName: '',
        categoryName: s.category?.name || 'General',
        viewCount: s.viewCount,
        publishedAt: s.publishedAt?.toISOString() || s.createdAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      ...events.map((e) => ({
        id: e.id,
        type: 'event',
        title: e.title,
        slug: e.slug,
        excerpt: e.description.substring(0, 150),
        coverImage: e.coverImage || '',
        authorName: '',
        categoryName: e.category?.name || 'General',
        viewCount: e.viewCount,
        publishedAt: e.publishedAt?.toISOString() || e.createdAt.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
      ...cityGuides.map((c) => ({
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
      ...music.map((m) => ({
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
      ...celebrities.map((c) => ({
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
      ...nightlife.map((n) => ({
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
      ...influencers.map((i) => ({
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

    // Sort by published date
    const sortedItems = allItems.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Filter by category if provided
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

    // Cache the response
    try {
      await this.redisService.set(cacheKey, JSON.stringify(response), this.cacheTTL);
    } catch (error) {
      this.logger.warn('Cache write failed', error);
    }

    return response;
  }

  async getTrending(limit = 10): Promise<FeedResponse> {
    const cacheKey = `lifestyle:trending:${limit}`;

    // Try to get from cache first
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug('Trending cache hit');
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Cache read failed', error);
    }

    // Fetch only the most viewed items from each category
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

    const allItems: FeedItem[] = [
      ...stories.map((s) => ({
        id: s.id,
        type: 'story',
        title: s.title,
        slug: s.slug,
        excerpt: s.excerpt || s.content.substring(0, 150),
        coverImage: s.coverImage || '',
        authorName: '',
        categoryName: s.category?.name || 'General',
        viewCount: s.viewCount,
        publishedAt: s.publishedAt?.toISOString() || s.createdAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      ...events.map((e) => ({
        id: e.id,
        type: 'event',
        title: e.title,
        slug: e.slug,
        excerpt: e.description.substring(0, 150),
        coverImage: e.coverImage || '',
        authorName: '',
        categoryName: e.category?.name || 'General',
        viewCount: e.viewCount,
        publishedAt: e.publishedAt?.toISOString() || e.createdAt.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
      ...cityGuides.map((c) => ({
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
      ...music.map((m) => ({
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
      ...celebrities.map((c) => ({
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
      ...nightlife.map((n) => ({
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
      ...influencers.map((i) => ({
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

    // Sort by view count and take top items
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

    // Cache the response
    try {
      await this.redisService.set(cacheKey, JSON.stringify(response), this.cacheTTL);
    } catch (error) {
      this.logger.warn('Cache write failed', error);
    }

    return response;
  }
}
