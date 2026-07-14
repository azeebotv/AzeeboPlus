import {Inject,  Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
// Prisma client types available via PrismaService
import { SearchResponse } from './interfaces/search-response.interface.js';

interface FacetedFilters {
  universe?: string;
  categories?: string[];
  tags?: string[];
  contentType?: string[];
  dateRange?: { start?: string; end?: string };
  rating?: { min?: number; max?: number };
  sort?: string;
  page?: number;
  limit?: number;
}

interface Facet {
  id: string;
  name: string;
  count: number;
}

interface Facets {
  universes: Facet[];
  categories: Facet[];
  tags: Facet[];
  contentTypes: Facet[];
  dateRanges: Facet[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService
  ) {}

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async search(query: string, filters?: FacetedFilters): Promise<SearchResponse> {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    // Check cache
    const filterKey = JSON.stringify(filters || {});
    const cacheK = cacheKey('search', `results:${query}:${page}:${filterKey}`);
    const cached = await this.cache.get<SearchResponse>(cacheK);
    if (cached) return cached;

    const skip = (page - 1) * limit;

    const escapedQuery = this.escapeRegex(query);

    const whereCondition: Record<string, unknown> = {
      OR: [
        { title: { contains: escapedQuery, mode: 'insensitive' } },
        { description: { contains: escapedQuery, mode: 'insensitive' } },
      ],
      status: 'published',
      ...(filters?.universe ? { universeId: filters.universe } : {}),
      ...(filters?.categories && filters.categories.length > 0
        ? {
            categories: {
              some: {
                id: {
                  in: filters.categories,
                },
              },
            },
          }
        : {}),
      ...(filters?.tags && filters.tags.length > 0
        ? {
            tags: {
              some: {
                id: {
                  in: filters.tags,
                },
              },
            },
          }
        : {}),

      ...(filters?.dateRange
        ? {
            createdAt: {
              ...(filters.dateRange.start ? { gte: new Date(filters.dateRange.start) } : {}),
              ...(filters.dateRange.end ? { lte: new Date(filters.dateRange.end) } : {}),
            },
          }
        : {}),
    };

    let orderBy: {
      createdAt?: 'asc' | 'desc';
      viewCount?: 'asc' | 'desc';
      title?: 'asc' | 'desc';
    } = { createdAt: 'desc' };
    if (filters?.sort) {
      switch (filters.sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'popular':
          orderBy = { viewCount: 'desc' };
          break;
        case 'alphabetical':
          orderBy = { title: 'asc' };
          break;
        case 'rating':
          orderBy = { viewCount: 'desc' };
          break;
      }
    }

    try {
      const [contentItems, contentTotal, creators, universes] = await Promise.all([
        this.prisma.contentItem.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.contentItem.count({ where: whereCondition }),
        this.prisma.creatorProfile.findMany({
          where: {
            bio: { contains: escapedQuery, mode: 'insensitive' },
          },
          take: Math.min(limit, 20),
        }),
        this.prisma.universe.findMany({
          where: {
            OR: [
              { name: { contains: escapedQuery, mode: 'insensitive' } },
              { displayName: { contains: escapedQuery, mode: 'insensitive' } },
            ],
          },
          take: Math.min(limit, 10),
        }),
      ]);

      const result: SearchResponse = {
        success: true,
        data: {
          query,
          results: {
            content: contentItems.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              status: item.status,
              viewCount: item.viewCount || 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            })),
            creators: creators.map((creator) => ({
              id: creator.id,
              bio: creator.bio,
              user: {
                id: creator.userId,
                username: creator.displayName || '',
                email: creator.email || '',
              },
            })),
            universes: universes.map((uni) => ({
              id: uni.id,
              name: uni.name,
              displayName: uni.displayName,
            })),
          },
          total: contentTotal + creators.length + universes.length,
          pagination: {
            page,
            limit,
            total: contentTotal,
            totalPages: Math.ceil(contentTotal / limit),
          },
        },
      };

      await this.cache.set(cacheK, result, 600);
      return result;
    } catch (error: unknown) {
      this.logger.error('Failed to perform search', error);
      throw new BadRequestException('Failed to perform search');
    }
  }

  async searchWithFacets(query: string, filters?: FacetedFilters): Promise<SearchResponse> {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const escapedQuery = this.escapeRegex(query);

    const baseCondition: Record<string, unknown> = {
      OR: [
        { title: { contains: escapedQuery, mode: 'insensitive' } },
        { description: { contains: escapedQuery, mode: 'insensitive' } },
      ],
      status: 'published',
    };

    try {
      const [contentItems, facets] = await Promise.all([
        this.prisma.contentItem.findMany({
          where: {
            ...baseCondition,
            ...(filters?.universe ? { universeId: filters.universe } : {}),
            ...(filters?.categories && filters.categories.length > 0
              ? {
                  categories: { some: { id: { in: filters.categories } } },
                }
              : {}),
            ...(filters?.tags && filters.tags.length > 0
              ? {
                  tags: { some: { id: { in: filters.tags } } },
                }
              : {}),
          },
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
        this.computeFacets(query),
      ]);

      const creators = await this.prisma.creatorProfile.findMany({
        where: { bio: { contains: escapedQuery, mode: 'insensitive' } },
        take: 20,
      });

      const universes = await this.prisma.universe.findMany({
        where: {
          OR: [
            { name: { contains: escapedQuery, mode: 'insensitive' } },
            { displayName: { contains: escapedQuery, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });

      return {
        success: true,
        data: {
          query,
          results: {
            content: contentItems.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              status: item.status,
              viewCount: item.viewCount || 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            })),
            creators: creators.map((creator) => ({
              id: creator.id,
              bio: creator.bio,
              user: {
                id: creator.userId,
                username: creator.displayName || '',
                email: creator.email || '',
              },
            })),
            universes: universes.map((uni) => ({
              id: uni.id,
              name: uni.name,
              displayName: uni.displayName,
            })),
          },
          total: contentItems.length + creators.length + universes.length,
          facets,
        },
      };
    } catch (error: unknown) {
      this.logger.error('Failed to search with facets', error);
      throw new BadRequestException('Failed to perform faceted search');
    }
  }

  private async computeFacets(query: string): Promise<Facets> {
    const escapedQuery = this.escapeRegex(query);

    const baseCondition: Record<string, unknown> = {
      OR: [
        { title: { contains: escapedQuery, mode: 'insensitive' } },
        { description: { contains: escapedQuery, mode: 'insensitive' } },
      ],
      status: 'published',
    };

    const [universeCounts, contentTypeCounts, dateCounts] = await Promise.all([
      this.prisma.contentItem.groupBy({
        by: ['universeId'],
        where: baseCondition,
        _count: { id: true },
      }),
      this.prisma.contentItem.groupBy({
        by: ['contentType'],
        where: baseCondition,
        _count: { id: true },
      }),
      this.getDateRangeFacets(baseCondition),
    ]);

    const universes = await this.prisma.universe.findMany({
      where: { id: { in: universeCounts.map((u) => u.universeId) } },
    });

    type UniverseCount = (typeof universeCounts)[number];
    type ContentTypeCount = (typeof contentTypeCounts)[number];

    return {
      universes: universeCounts.map((u: UniverseCount) => ({
        id: u.universeId ?? 'unknown',
        name: universes.find((univ) => univ.id === u.universeId)?.name || 'Unknown',
        count: u._count.id,
      })),
      categories: [],
      tags: [],
      contentTypes: contentTypeCounts.map((ct: ContentTypeCount) => ({
        id: ct.contentType,
        name: ct.contentType,
        count: ct._count.id,
      })),
      dateRanges: dateCounts,
    };
  }

  private async getDateRangeFacets(baseCondition: Record<string, unknown>): Promise<Facet[]> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oneMonthAgo = new Date(startOfToday);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneYearAgo = new Date(startOfToday);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const ranges = [
      { label: 'Today', start: startOfToday },
      { label: 'This Week', start: sevenDaysAgo },
      { label: 'This Month', start: oneMonthAgo },
      { label: 'This Year', start: oneYearAgo },
      { label: 'Older', start: new Date(0), end: oneYearAgo },
    ];

    const dateFacets: Facet[] = [];
    for (const range of ranges) {
      const count = await this.prisma.contentItem.count({
        where: {
          ...baseCondition,
          createdAt: {
            ...(range.end ? { lt: range.end } : {}),
            gte: range.start,
          },
        },
      });
      dateFacets.push({ id: range.label, name: range.label, count });
    }

    return dateFacets;
  }

  async getSuggestions(query: string): Promise<SearchResponse> {
    if (!query || query.length < 1) {
      throw new BadRequestException('Search query must be at least 1 character');
    }

    const cacheK = cacheKey('search', `suggestions:${query}`);
    const cached = await this.cache.get<SearchResponse>(cacheK);
    if (cached) return cached;

    try {
      const suggestions = await this.prisma.searchQueryLog.findMany({
        where: {
          query: { contains: this.escapeRegex(query), mode: 'insensitive' },
        },
        select: { query: true, resultCount: true },
        orderBy: { resultCount: 'desc' },
        take: 10,
      });

      const result: SearchResponse = {
        success: true,
        data: {
          suggestions: suggestions.map((s) => s.query),
        },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error: unknown) {
      this.logger.error('Failed to fetch search suggestions', error);
      throw new BadRequestException('Failed to fetch search suggestions');
    }
  }

  async getTrending(): Promise<SearchResponse> {
    try {
      const trending = await this.prisma.searchQueryLog.findMany({
        orderBy: { resultCount: 'desc' },
        take: 20,
      });

      return {
        success: true,
        data: {
          trending: trending.map((t) => ({ query: t.query, count: t.resultCount })),
        },
      };
    } catch (error: unknown) {
      this.logger.error('Failed to fetch trending searches', error);
      throw new BadRequestException('Failed to fetch trending searches');
    }
  }

  async getFacets(_query?: string, _universe?: string): Promise<SearchResponse> {
    try {
      const universes = await this.prisma.universe.findMany({
        select: { id: true, name: true, displayName: true },
        where: { isEnabled: true },
      });

      return {
        success: true,
        data: {
          facets: {
            universes: universes.map((u) => ({ id: u.id, name: u.name, count: 0 })),
            categories: [],
            tags: [],
            contentTypes: [],
            dateRanges: [],
          },
        },
      };
    } catch (error: unknown) {
      this.logger.error('Failed to fetch facets', error);
      throw new BadRequestException('Failed to fetch facets');
    }
  }

    async logSearch(userId: string, query: string, resultCount: number): Promise<SearchResponse> {
    try {
      await this.prisma.searchQueryLog.create({
        data: { query, userId, resultCount },
      });

      await this.prisma.userSearch.create({
        data: { userId, query, resultCount },
      });

      // Invalidate suggestions cache since search log affects trending
      await this.cache.delete(cacheKey('search', `suggestions:${query}`));

      return {
        success: true,
        data: { message: 'Search logged' },
      };
    } catch (error: unknown) {
      this.logger.error('Failed to log search', error);
      throw new BadRequestException('Failed to log search');
    }
  }
}
