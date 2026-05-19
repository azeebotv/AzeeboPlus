import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';

interface CommentEntity {
  id: string;
  contentId: string;
  userId: string;
  text: string;
  createdAt: Date;
}

interface AnalyticsResult {
  contentId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  watchTime: number;
}

interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class ContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: { universe?: string }, page: number = 1, limit: number = 20): Promise<PaginatedResult<any>> {
    const where: any = { status: 'published' };
    
    if (filters?.universe) {
      where.universeId = filters.universe;
    }

    const [data, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { universe: true },
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.contentItem.findUnique({
      where: { id },
      include: { universe: true, mediaAsset: true, categories: true, tags: true },
    });
  }

  async create(data: CreateContentDto & { creatorId: string }): Promise<any> {
    return this.prisma.contentItem.create({
      data: {
        ...data,
        status: 'draft',
      },
      include: { universe: true },
    });
  }

  async update(id: string, data: Partial<any>): Promise<any> {
    return this.prisma.contentItem.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: { universe: true },
    });
  }

  async delete(id: string): Promise<number> {
    const result = await this.prisma.contentItem.update({
      where: { id },
      data: { status: 'deleted', updatedAt: new Date() },
    });
    return result ? 1 : 0;
  }

  async getComments(contentId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<CommentEntity>> {
    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { contentId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where: { contentId } }),
    ]);

    return {
      data: data as CommentEntity[],
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addComment(contentId: string, userId: string, text: string): Promise<CommentEntity> {
    return this.prisma.comment.create({
      data: {
        contentId,
        userId,
        text,
      },
    }) as Promise<CommentEntity>;
  }

  async getAnalytics(contentId: string): Promise<AnalyticsResult> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    const commentCount = await this.prisma.comment.count({ where: { contentId } });

    return {
      contentId,
      viewCount: content?.viewCount || 0,
      likeCount: 0,
      commentCount,
      watchTime: 0,
    };
  }

  async search(query: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<any>> {
    const where: any = {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
      status: 'published',
    };

    const [data, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { universe: true },
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}