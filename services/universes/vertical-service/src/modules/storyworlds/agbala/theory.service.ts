import { Inject, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from './cache.service';
import { SanitizationService, SpoilerLevel } from './sanitization.service';
import { buildOffsetPagination } from './pagination.helper';

interface Theory {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  authorName: string;
  spoilerLevel: SpoilerLevel;
  accessLevel: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  status: string;
  createdAt: string;
}

export interface TheoryResponse {
  success: boolean;
  data?:
    | Theory
    | Theory[]
    | { items: Theory[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string };
  error?: { code: string; message: string };
}

export interface CreateTheoryData {
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  spoilerLevel?: string;
  accessLevel?: string;
}

interface UpdateTheoryData {
  title?: string;
  content?: string;
  spoilerLevel?: string;
  accessLevel?: string;
}

@Injectable()
export class TheoryService {
  private readonly logger = new Logger(TheoryService.name);

  private readonly rateLimitConfig = {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  };

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CacheService) private cache: CacheService,
    @Inject(SanitizationService) private sanitization: SanitizationService
  ) {}

  private formatTheory(theory: Record<string, unknown>): Theory {
    return {
      id: theory.id as string,
      title: theory.title as string,
      slug: theory.slug as string,
      content: theory.content as string,
      authorId: theory.authorId as string,
      authorName: (theory.authorName as string) || '',
      spoilerLevel: (theory.spoilerLevel as SpoilerLevel) || SpoilerLevel.NONE,
      accessLevel: (theory.accessLevel as string) || 'public',
      viewCount: (theory.viewCount as number) || 0,
      likeCount: (theory.likeCount as number) || 0,
      commentCount: (theory.commentCount as number) || 0,
      status: theory.status as string,
      createdAt: (theory.createdAt as Date).toISOString(),
    };
  }

  async getTheories(
    page = 1,
    limit = 20,
    authorId?: string,
    status = 'published'
  ): Promise<TheoryResponse> {
    try {
      const cacheKey = `theories:list:${authorId || 'all'}:${status}:${page}:${limit}`;
      const cached = await this.cache.get<TheoryResponse>(cacheKey);
      if (cached) return cached;

      const where: Record<string, unknown> = {};
      if (status !== 'all') where.status = status;
      if (authorId) where.authorId = authorId;

      const pagination = buildOffsetPagination(page, limit);

      const [items, total] = await Promise.all([
        this.prisma.theory.findMany({
          where,
          skip: pagination.skip,
          take: pagination.take,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.theory.count({ where }),
      ]);

      const response: TheoryResponse = {
        success: true,
        data: {
          items: items.map((t) => this.formatTheory(t)),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.logger.error(`Failed to get theories: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get theories' },
      };
    }
  }

  async getTheoryBySlug(slug: string): Promise<TheoryResponse> {
    try {
      const cacheKey = `theories:detail:${slug}`;
      const cached = await this.cache.get<TheoryResponse>(cacheKey);
      if (cached) return cached;

      const theory = await this.prisma.theory.findUnique({
        where: { slug },
      });

      if (!theory) {
        throw new NotFoundException(`Theory not found: ${slug}`);
      }

      await this.prisma.theory.update({
        where: { id: theory.id },
        data: { viewCount: theory.viewCount + 1 },
      });

      const response: TheoryResponse = {
        success: true,
        data: this.formatTheory(theory),
      };

      await this.cache.set(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get theory by slug: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get theory' },
      };
    }
  }

  async createTheory(data: CreateTheoryData): Promise<TheoryResponse> {
    try {
      if (
        !this.sanitization.checkRateLimit(
          data.authorId,
          'create_theory',
          this.rateLimitConfig.maxRequests,
          this.rateLimitConfig.windowMs
        )
      ) {
        throw new ForbiddenException('Rate limit exceeded: max 5 theories per hour');
      }

      const sanitizedContent = this.sanitization.sanitizeContent(data.content);
      const spoilerLevel = this.sanitization.validateSpoilerLevel(data.spoilerLevel || 'none');

      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const theory = await this.prisma.theory.create({
        data: {
          title: data.title,
          slug,
          content: sanitizedContent,
          authorId: data.authorId,
          authorName: data.authorName,
          spoilerLevel,
          accessLevel: data.accessLevel || 'public',
          status: 'published',
        },
      });

      await this.cache.invalidate('theories:');
      return { success: true, data: this.formatTheory(theory) };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to create theory: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_FAILED', message: 'Failed to create theory' },
      };
    }
  }

  async updateTheory(id: string, userId: string, data: UpdateTheoryData): Promise<TheoryResponse> {
    try {
      const existing = await this.prisma.theory.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Theory not found: ${id}`);
      }

      if (existing.authorId !== userId) {
        throw new ForbiddenException('You can only edit your own theories');
      }

      const updateData: Record<string, unknown> = {};
      if (data.title) {
        updateData.title = data.title;
        updateData.slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      if (data.content !== undefined) {
        updateData.content = this.sanitization.sanitizeContent(data.content);
      }
      if (data.spoilerLevel !== undefined) {
        updateData.spoilerLevel = this.sanitization.validateSpoilerLevel(data.spoilerLevel);
      }
      if (data.accessLevel !== undefined) {
        updateData.accessLevel = this.sanitization.validateAccessLevel(data.accessLevel);
      }

      const updated = await this.prisma.theory.update({
        where: { id },
        data: updateData,
      });

      await this.cache.invalidate('theories:');
      return { success: true, data: this.formatTheory(updated) };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to update theory: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update theory' },
      };
    }
  }

  async deleteTheory(id: string, userId: string): Promise<TheoryResponse> {
    try {
      const existing = await this.prisma.theory.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Theory not found: ${id}`);
      }

      if (existing.authorId !== userId) {
        throw new ForbiddenException('You can only delete your own theories');
      }

      await this.prisma.theory.delete({ where: { id } });
      await this.cache.invalidate('theories:');
      return { success: true, data: { message: 'Theory deleted' } };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`Failed to delete theory: ${error}`);
      return {
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete theory' },
      };
    }
  }
}
