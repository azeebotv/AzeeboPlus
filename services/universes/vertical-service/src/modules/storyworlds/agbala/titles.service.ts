import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from './cache.service';
import { buildOffsetPagination } from './pagination.helper';

interface Title {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  coverImage: string;
  releaseYear: number;
  endYear: number;
  status: string;
  rating: number;
  universeId: string;
  universeName: string;
  viewCount: number;
  createdAt: string;
}

interface Chapter {
  id: string;
  titleId: string;
  number: number;
  name: string;
  description: string;
  coverImage: string;
  content: string;
  wordCount: number;
  status: string;
  publishedAt: string;
  createdAt: string;
}

interface TitleWithChapters extends Title {
  chapters: Chapter[];
}

export interface TitleResponse {
  success: boolean;
  data?:
    | Title
    | Title[]
    | Chapter[]
    | TitleWithChapters
    | { items: Title[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

export interface CreateTitleData {
  name: string;
  type: string;
  description?: string;
  coverImage?: string;
  releaseYear?: number;
  endYear?: number;
  status?: string;
  rating?: number;
  universeId: string;
}

interface UpdateTitleData {
  name?: string;
  type?: string;
  description?: string;
  coverImage?: string;
  releaseYear?: number;
  endYear?: number;
  status?: string;
  rating?: number;
}

@Injectable()
export class AgbalaTitlesService {
  private readonly logger = new Logger(AgbalaTitlesService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService
  ) {}

  private formatTitle(title: Record<string, unknown>): Title {
    return {
      id: title.id as string,
      name: title.name as string,
      slug: title.slug as string,
      type: title.type as string,
      description: (title.description as string) || '',
      coverImage: (title.coverImage as string) || '',
      releaseYear: (title.releaseYear as number) || 0,
      endYear: (title.endYear as number) || 0,
      status: title.status as string,
      rating: (title.rating as number) || 0,
      universeId: title.universeId as string,
      universeName: (title.universe as { name: string })?.name || '',
      viewCount: title.viewCount as number,
      createdAt: (title.createdAt as Date).toISOString(),
    };
  }

  private formatChapter(chapter: Record<string, unknown>): Chapter {
    return {
      id: chapter.id as string,
      titleId: chapter.titleId as string,
      number: chapter.number as number,
      name: (chapter.name as string) || '',
      description: (chapter.description as string) || '',
      coverImage: (chapter.coverImage as string) || '',
      content: (chapter.content as string) || '',
      wordCount: (chapter.wordCount as number) || 0,
      status: chapter.status as string,
      publishedAt: chapter.publishedAt ? (chapter.publishedAt as Date).toISOString() : '',
      createdAt: (chapter.createdAt as Date).toISOString(),
    };
  }

  async getStoryworlds(): Promise<unknown[]> {
    try {
      const storyworlds = await this.prisma.universeMap.findMany({
        where: { status: 'active' },
        include: {
          _count: { select: { titles: true, characters: true, locations: true } },
        },
        orderBy: { name: 'asc' },
      });
      return storyworlds.map((sw) => ({
        id: sw.id,
        name: sw.name,
        slug: sw.slug,
        description: sw.description,
        imageUrl: sw.imageUrl,
        status: sw.status,
        titleCount: sw._count.titles,
        characterCount: sw._count.characters,
        locationCount: sw._count.locations,
      }));
    } catch (error) {
      this.logger.error(`Failed to get storyworlds: ${(error as Error).message}`);
      return [];
    }
  }

  async getTitles(
    page = 1,
    limit = 20,
    universeSlug?: string,
    type?: string,
    status = 'published'
  ): Promise<TitleResponse> {
    try {
      const cacheKey = `titles:list:${universeSlug || 'all'}:${type || 'all'}:${status}:${page}:${limit}`;
      const cached = this.cache.get<TitleResponse>(cacheKey);
      if (cached) return cached;

      const where: Record<string, unknown> = {};
      if (status !== 'all') where.status = status;
      if (type) where.type = type;

      if (universeSlug) {
        const universe = await this.prisma.universeMap.findUnique({
          where: { slug: universeSlug },
        });
        if (universe) {
          where.universeId = universe.id;
        }
      }

      const pagination = buildOffsetPagination(page, limit);

      const [items, total] = await Promise.all([
        this.prisma.title.findMany({
          where,
          include: { universe: true },
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { releaseYear: 'desc' },
        }),
        this.prisma.title.count({ where }),
      ]);

      const response: TitleResponse = {
        success: true,
        data: {
          items: items.map((t) => this.formatTitle(t)),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.logger.error(`Failed to fetch titles: ${error}`);
      return { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch titles' } };
    }
  }

  async getTitleBySlug(slug: string): Promise<TitleResponse> {
    try {
      const cacheKey = `titles:detail:${slug}`;
      const cached = this.cache.get<TitleResponse>(cacheKey);
      if (cached) return cached;

      const title = await this.prisma.title.findUnique({
        where: { slug },
        include: { universe: true, chapters: { orderBy: { number: 'asc' } } },
      });

      if (!title) {
        throw new NotFoundException(`Title not found: ${slug}`);
      }

      await this.prisma.title.update({
        where: { id: title.id },
        data: { viewCount: title.viewCount + 1 },
      });

      const response: TitleResponse = {
        success: true,
        data: {
          ...this.formatTitle(title),
          chapters: title.chapters.map((c) => this.formatChapter(c)),
        },
      };

      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch title ${slug}: ${error}`);
      return { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch title' } };
    }
  }

  async getFeaturedTitles(limit = 10): Promise<TitleResponse> {
    try {
      const cacheKey = `titles:featured:${limit}`;
      const cached = this.cache.get<TitleResponse>(cacheKey);
      if (cached) return cached;

      const titles = await this.prisma.title.findMany({
        where: { status: 'published' },
        include: { universe: true },
        orderBy: { rating: 'desc' },
        take: limit,
      });

      const response: TitleResponse = {
        success: true,
        data: titles.map((t) => this.formatTitle(t)),
      };

      this.cache.set(cacheKey, response, 10 * 60 * 1000);
      return response;
    } catch (error) {
      this.logger.error(`Failed to fetch featured titles: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch featured titles' },
      };
    }
  }

  async createTitle(data: CreateTitleData): Promise<TitleResponse> {
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const title = await this.prisma.title.create({
        data: {
          name: data.name,
          slug,
          type: data.type,
          description: data.description,
          coverImage: data.coverImage,
          releaseYear: data.releaseYear,
          endYear: data.endYear,
          status: data.status || 'ongoing',
          rating: data.rating,
          universeId: data.universeId,
        },
        include: { universe: true },
      });

      this.cache.invalidate('titles:');
      return { success: true, data: this.formatTitle(title) };
    } catch (error) {
      this.logger.error(`Failed to create title: ${error}`);
      return { success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create title' } };
    }
  }

  async updateTitle(id: string, data: UpdateTitleData): Promise<TitleResponse> {
    try {
      const existing = await this.prisma.title.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Title not found: ${id}`);
      }

      const updateData: Record<string, unknown> = {};
      if (data.name) {
        updateData.name = data.name;
        updateData.slug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      if (data.type !== undefined) updateData.type = data.type;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
      if (data.releaseYear !== undefined) updateData.releaseYear = data.releaseYear;
      if (data.endYear !== undefined) updateData.endYear = data.endYear;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.rating !== undefined) updateData.rating = data.rating;

      const updated = await this.prisma.title.update({
        where: { id },
        data: updateData,
        include: { universe: true },
      });

      this.cache.invalidate('titles:');
      return { success: true, data: this.formatTitle(updated) };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update title ${id}: ${error}`);
      return { success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update title' } };
    }
  }

  async deleteTitle(id: string): Promise<TitleResponse> {
    try {
      const title = await this.prisma.title.findUnique({ where: { id } });
      if (!title) {
        throw new NotFoundException(`Title not found: ${id}`);
      }

      await this.prisma.title.delete({ where: { id } });
      this.cache.invalidate('titles:');
      return { success: true, data: { message: 'Title deleted' } };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete title ${id}: ${error}`);
      return { success: false, error: { code: 'DELETE_ERROR', message: 'Failed to delete title' } };
    }
  }

  async createChapter(data: {
    titleId: string;
    number: number;
    name?: string;
    description?: string;
    coverImage?: string;
    content?: string;
  }): Promise<{ success: boolean; data: Chapter }> {
    try {
      const chapter = await this.prisma.chapter.create({
        data: {
          titleId: data.titleId,
          number: data.number,
          name: data.name,
          description: data.description,
          coverImage: data.coverImage,
          content: data.content,
          wordCount: data.content ? data.content.split(' ').length : 0,
          status: 'published',
          publishedAt: new Date(),
        },
      });

      this.cache.invalidate('titles:');
      return { success: true, data: this.formatChapter(chapter) };
    } catch (error) {
      this.logger.error(`Failed to create chapter for title ${data.titleId}: ${error}`);
      throw error;
    }
  }

  async getChapter(
    titleId: string,
    chapterNumber: number
  ): Promise<{ success: boolean; data: Chapter }> {
    try {
      const cacheKey = `titles:chapter:${titleId}:${chapterNumber}`;
      const cached = this.cache.get<{ success: boolean; data: Chapter }>(cacheKey);
      if (cached) return cached;

      const chapter = await this.prisma.chapter.findFirst({
        where: { titleId, number: chapterNumber },
      });

      if (!chapter) {
        throw new NotFoundException(`Chapter not found: ${chapterNumber}`);
      }

      const response = { success: true, data: this.formatChapter(chapter) };
      this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to fetch chapter ${chapterNumber} for title ${titleId}: ${error}`);
      throw error;
    }
  }
}
