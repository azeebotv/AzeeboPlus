import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

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

interface TitleWithChapters {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  coverImage?: string;
  status: string;
  rating: number;
  viewCount: number;
  universeId: string;
  createdAt: Date;
  updatedAt: Date;
  chapters: Chapter[];
}

interface TitleResponse {
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

export interface CreateChapterData {
  titleId: string;
  number: number;
  name?: string;
  description?: string;
  coverImage?: string;
  content?: string;
}

@Injectable()
export class TitlesService {
  private readonly logger = new Logger(TitlesService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

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

  async getTitles(
    page = 1,
    limit = 20,
    universeSlug?: string,
    type?: string,
    status = 'published'
  ): Promise<TitleResponse> {
    try {
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

      const [items, total] = await Promise.all([
        this.prisma.title.findMany({
          where,
          include: { universe: true },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { releaseYear: 'desc' },
        }),
        this.prisma.title.count({ where }),
      ]);

      return {
        success: true,
        data: {
          items: items.map((t) => this.formatTitle(t)),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get titles: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get titles' },
      };
    }
  }

  async getTitleBySlug(slug: string): Promise<TitleResponse> {
    try {
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

      return {
        success: true,
        data: {
          ...this.formatTitle(title),
          chapters: title.chapters.map((c) => this.formatChapter(c)),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get title by slug: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get title' },
      };
    }
  }

  async getFeaturedTitles(limit = 10): Promise<TitleResponse> {
    try {
      const titles = await this.prisma.title.findMany({
        where: { status: 'published' },
        include: { universe: true },
        orderBy: { rating: 'desc' },
        take: limit,
      });
      return { success: true, data: titles.map((t) => this.formatTitle(t)) };
    } catch (error) {
      this.logger.error(`Failed to get featured titles: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get featured titles' },
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

      return { success: true, data: this.formatTitle(title) };
    } catch (error) {
      this.logger.error(`Failed to create title: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_FAILED', message: 'Failed to create title' },
      };
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

      return { success: true, data: this.formatTitle(updated) };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update title: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update title' },
      };
    }
  }

  async deleteTitle(id: string): Promise<TitleResponse> {
    try {
      const title = await this.prisma.title.findUnique({ where: { id } });
      if (!title) {
        throw new NotFoundException(`Title not found: ${id}`);
      }

      await this.prisma.title.delete({ where: { id } });
      return { success: true, data: { message: 'Title deleted' } };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete title: ${error}`);
      return {
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete title' },
      };
    }
  }

  async createChapter(data: CreateChapterData): Promise<{ success: boolean; data: Chapter }> {
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

      return { success: true, data: this.formatChapter(chapter) };
    } catch (error) {
      this.logger.error(`Failed to create chapter: ${error}`);
      throw error;
    }
  }

  async getChapter(
    titleId: string,
    chapterNumber: number
  ): Promise<{ success: boolean; data: Chapter }> {
    try {
      const chapter = await this.prisma.chapter.findFirst({
        where: { titleId, number: chapterNumber },
      });

      if (!chapter) {
        throw new NotFoundException(`Chapter not found: ${chapterNumber}`);
      }

      return { success: true, data: this.formatChapter(chapter) };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get chapter: ${error}`);
      throw error;
    }
  }
}
