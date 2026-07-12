import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

interface SearchContentResult {
  id: string;
  title: string;
  universe: string;
  score: number;
}

interface SearchCreatorsResult {
  id: string;
  displayName: string;
  score: number;
}

interface UniversalSearchResult {
  content: Array<{ id: string; title: string; universe: string }>;
  creators: Array<{ id: string; displayName: string }>;
  totalResults: number;
}

interface TrendingResult {
  id: string;
  title: string;
  viewCount: number;
}

interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchContent(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<SearchContentResult>> {
    const skip = (page - 1) * limit;

    const contentItems = await this.prisma.contentItem.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        status: 'published',
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.contentItem.count({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        status: 'published',
      },
    });

    return {
      data: contentItems.map((item) => ({
        id: item.id,
        title: item.title,
        universe: item.universeId || 'unknown',
        score: 0.95,
      })),
      page,
      limit,
      total,
    };
  }

  async searchCreators(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<SearchCreatorsResult>> {
    const skip = (page - 1) * limit;

    const creators = await this.prisma.creatorProfile.findMany({
      where: {
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.creatorProfile.count({
      where: {
        OR: [
          { displayName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return {
      data: creators.map((creator) => ({
        id: creator.id,
        displayName: creator.displayName || '',
        score: 0.85,
      })),
      page,
      limit,
      total,
    };
  }

  async searchUniversal(query: string): Promise<UniversalSearchResult> {
    const [contentItems, creators] = await Promise.all([
      this.prisma.contentItem.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          status: 'published',
        },
        take: 10,
      }),
      this.prisma.creatorProfile.findMany({
        where: {
          OR: [
            { displayName: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
    ]);

    return {
      content: contentItems.map((item) => ({
        id: item.id,
        title: item.title,
        universe: item.universeId || 'unknown',
      })),
      creators: creators.map((creator) => ({
        id: creator.id,
        displayName: creator.displayName || '',
      })),
      totalResults: contentItems.length + creators.length,
    };
  }

  async autocomplete(query: string): Promise<string[]> {
    const suggestions = await this.prisma.searchQueryLog.findMany({
      where: { query: { contains: query, mode: 'insensitive' } },
      select: { query: true },
      take: 10,
    });

    return suggestions.map((s) => s.query);
  }

  async getTrending(): Promise<TrendingResult[]> {
    const trending = await this.prisma.searchQueryLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return trending.map((item) => ({
      id: item.id,
      title: item.query,
      viewCount: item.resultCount,
    }));
  }
}
