import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client';
import { SearchResponse } from './interfaces/search-response.interface';

interface FacetedFilters {
  universe?: string;
  categories?: string[];
  tags?: string[];
  contentType?: string[];
  dateRange?: { start?: string; end?: string };
  rating?: { min?: number; max?: number };
  sort?: string;
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
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, filters?: FacetedFilters): Promise<SearchResponse> {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const whereCondition: Prisma.ContentItemWhereInput = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
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
      ...(filters?.contentType && filters.contentType.length > 0
        ? {
            contentType: { in: filters.contentType },
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
      averageRating?: 'asc' | 'desc';
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
          orderBy = { averageRating: 'desc' };
          break;
      }
    }

    const contentItems = await this.prisma.contentItem.findMany({
      where: whereCondition,
      take: 50,
      orderBy,
      include: {
        creator: true,
        universe: true,
        categories: true,
        tags: true,
      },
    });

    const creators = await this.prisma.creatorProfile.findMany({
      where: {
        bio: { contains: query, mode: 'insensitive' },
      },
      take: 20,
      include: { user: true },
    });

    const universes = await this.prisma.universe.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    return {
      success: true,
      data: {
        query,
        filters,
        results: {
          content: contentItems,
          creators,
          universes,
        },
        total: contentItems.length + creators.length + universes.length,
      },
    };
  }

  async searchWithFacets(query: string, filters?: FacetedFilters): Promise<SearchResponse> {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const baseCondition: Prisma.ContentItemWhereInput = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
      status: 'published',
    };

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
        include: { creator: true, universe: true, categories: true, tags: true },
      }),
      this.computeFacets(query),
    ]);

    const creators = await this.prisma.creatorProfile.findMany({
      where: { bio: { contains: query, mode: 'insensitive' } },
      take: 20,
      include: { user: true },
    });

    const universes = await this.prisma.universe.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    return {
      success: true,
      data: {
        query,
        filters,
        results: { content: contentItems, creators, universes },
        total: contentItems.length + creators.length + universes.length,
        facets,
      },
    };
  }

  private async computeFacets(query: string): Promise<Facets> {
    const baseCondition: Prisma.ContentItemWhereInput = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
      status: 'published',
    };

    const [universeCounts, categoryCounts, tagCounts, dateCounts] = await Promise.all([
      this.prisma.contentItem.groupBy({
        by: ['universeId'],
        where: baseCondition,
        _count: { id: true },
      }),
      this.prisma.category.findMany({
        where: { contentItems: { some: baseCondition } },
        include: { _count: { select: { contentItems: true } } },
      }),
      this.prisma.tag.findMany({
        where: { contentItems: { some: baseCondition } },
        include: { _count: { select: { contentItems: true } } },
      }),
      this.getDateRangeFacets(baseCondition),
    ]);

    const universes = await this.prisma.universe.findMany({
      where: { id: { in: universeCounts.map((u) => u.universeId) } },
    });

    type UniverseCount = (typeof universeCounts)[number];
    type CategoryCount = (typeof categoryCounts)[number];
    type TagCount = (typeof tagCounts)[number];

    return {
      universes: universeCounts.map((u: UniverseCount) => ({
        id: u.universeId ?? 'unknown',
        name: universes.find((univ) => univ.id === u.universeId)?.name || 'Unknown',
        count: u._count.id,
      })),
      categories: categoryCounts.map((c: CategoryCount) => ({
        id: c.id,
        name: c.name,
        count: c._count.contentItems,
      })),
      tags: tagCounts.map((t: TagCount) => ({
        id: t.id,
        name: t.name,
        count: t._count.contentItems,
      })),
      contentTypes: [],
      dateRanges: dateCounts,
    };
  }

  private async getDateRangeFacets(baseCondition: Prisma.ContentItemWhereInput): Promise<Facet[]> {
    const now = new Date();
    const ranges = [
      { label: 'Today', start: new Date(now.setHours(0, 0, 0, 0)) },
      { label: 'This Week', start: new Date(now.setDate(now.getDate() - 7)) },
      { label: 'This Month', start: new Date(now.setMonth(now.getMonth() - 1)) },
      { label: 'This Year', start: new Date(now.setFullYear(now.getFullYear() - 1)) },
      { label: 'Older', start: new Date(0), end: new Date(now.setFullYear(now.getFullYear() - 1)) },
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

    const suggestions = await this.prisma.searchQueryLog.findMany({
      where: {
        query: { contains: query, mode: 'insensitive' },
      },
      select: { query: true, count: true },
      orderBy: { count: 'desc' },
      take: 10,
    });

    return {
      success: true,
      data: suggestions.map((s) => s.query),
    };
  }

  async getTrending(): Promise<SearchResponse> {
    const trending = await this.prisma.searchQueryLog.findMany({
      orderBy: { count: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: trending,
    };
  }

  async getFacets(query?: string, universe?: string): Promise<SearchResponse> {
    const contentWhere: Prisma.ContentItemWhereInput = {
      status: 'published',
      ...(universe ? { universeId: universe } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [universes, categories, tags] = await Promise.all([
      this.prisma.universe.findMany({
        select: {
          id: true,
          name: true,
          displayName: true,
          _count: {
            select: {
              contentItems: {
                where: contentWhere,
              },
            },
          },
        },
      }),
      this.prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              contentItems: {
                where: contentWhere,
              },
            },
          },
        },
      }),
      this.prisma.tag.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              contentItems: {
                where: contentWhere,
              },
            },
          },
        },
        orderBy: {
          contentItems: {
            _count: 'desc',
          },
        },
        take: 50,
      }),
    ]);

    type UniverseWithCount = (typeof universes)[number];
    type CategoryWithCount = (typeof categories)[number];
    type TagWithCount = (typeof tags)[number];

    return {
      success: true,
      data: {
        universes: universes.filter((u: UniverseWithCount) => u._count.contentItems > 0),
        categories: categories.filter((c: CategoryWithCount) => c._count.contentItems > 0),
        tags: tags.filter((t: TagWithCount) => t._count.contentItems > 0),
      },
    };
  }

  async logSearch(userId: string, query: string, resultsCount: number): Promise<SearchResponse> {
    let searchQuery = await this.prisma.searchQueryLog.findUnique({
      where: { query },
    });

    if (searchQuery) {
      searchQuery = await this.prisma.searchQueryLog.update({
        where: { query },
        data: {
          count: { increment: 1 },
          lastSearchAt: new Date(),
        },
      });
    } else {
      searchQuery = await this.prisma.searchQueryLog.create({
        data: {
          query,
          count: 1,
          lastSearchAt: new Date(),
        },
      });
    }

    await this.prisma.userSearch.create({
      data: {
        userId,
        queryId: searchQuery.id,
        resultsCount,
      },
    });

    return {
      success: true,
      data: { message: 'Search logged' },
    };
  }
}
