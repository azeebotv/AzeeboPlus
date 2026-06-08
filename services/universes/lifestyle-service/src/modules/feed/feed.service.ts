import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

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
  constructor(private prisma: PrismaService) {}

  async getFeed(page = 1, limit = 20, category?: string): Promise<FeedResponse> {
    const offset = (page - 1) * limit;

    const stories = await this.prisma.cultureStory.findMany({
      where: { status: 'published' },
      include: { category: true, author: true },
    });

    const events = await this.prisma.event.findMany({
      where: { status: 'published' },
      include: { category: true, creator: true },
    });

    const cityGuides = await this.prisma.cityGuideEntry.findMany({
      where: { status: 'published' },
      include: { tags: true },
    });

    const music = await this.prisma.musicEntry.findMany({
      where: { status: 'published' },
    });

    const celebrities = await this.prisma.celebrityEntry.findMany({
      where: { status: 'published' },
    });

    const nightlife = await this.prisma.nightlifeEntry.findMany({
      where: { status: 'published' },
    });

    const influencers = await this.prisma.influencerEntry.findMany({
      where: { status: 'published' },
    });

    const allItems: FeedItem[] = [
      ...stories.map((s) => ({
        id: s.id,
        type: 'story',
        title: s.title,
        slug: s.slug,
        excerpt: s.excerpt || s.content.substring(0, 150),
        coverImage: s.coverImage || '',
        authorName: s.author.displayName || s.author.username,
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
        authorName: e.creator.displayName || e.creator.username,
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

    return {
      success: true,
      data: {
        items: paginatedItems,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTrending(limit = 10): Promise<FeedResponse> {
    const feed = await this.getFeed(1, limit * 3);
    if (!feed.data) {
      return { success: true, data: { items: [], total: 0, page: 1, limit, totalPages: 0 } };
    }

    const trending = feed.data.items.sort((a, b) => b.viewCount - a.viewCount).slice(0, limit);

    return {
      success: true,
      data: {
        items: trending,
        total: trending.length,
        page: 1,
        limit,
        totalPages: 1,
      },
    };
  }
}
