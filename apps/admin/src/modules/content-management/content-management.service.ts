import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface ContentStats {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  pendingContent: number;
  archivedContent: number;
}

@Injectable()
export class ContentManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async getContent(
    page = 1,
    limit = 20,
    status?: string,
    universe?: string,
    search?: string
  ): Promise<unknown> {
    const where: Prisma.ContentItemWhereInput = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (universe && universe !== 'all') {
      where.universeId = universe;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [content, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, displayName: true, email: true } },
          universe: { select: { name: true, displayName: true } },
          _count: { select: { categories: true, tags: true } },
        },
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return {
      content: content.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail,
        status: c.status,
        viewCount: c.viewCount,
        createdAt: c.createdAt,
        publishedAt: c.publishedAt,
        creator: c.creator,
        universe: c.universe,
        categoryCount: c._count.categories,
        tagCount: c._count.tags,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getContentById(id: string): Promise<unknown> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, displayName: true, email: true, avatar: true } },
        universe: true,
        categories: true,
        tags: true,
        mediaAsset: true,
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async updateContentStatus(contentId: string, status: string): Promise<unknown> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const updated = await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        status,
        publishedAt: status === 'published' ? new Date() : undefined,
      },
    });

    return {
      success: true,
      data: updated,
    };
  }

  async deleteContent(contentId: string): Promise<unknown> {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    await this.prisma.contentItem.update({
      where: { id: contentId },
      data: { status: 'archived' },
    });

    return {
      success: true,
      message: 'Content archived successfully',
    };
  }

  async getContentStats(): Promise<ContentStats> {
    const [totalContent, publishedContent, draftContent, pendingContent, archivedContent] =
      await Promise.all([
        this.prisma.contentItem.count(),
        this.prisma.contentItem.count({ where: { status: 'published' } }),
        this.prisma.contentItem.count({ where: { status: 'draft' } }),
        this.prisma.contentItem.count({ where: { status: 'pending' } }),
        this.prisma.contentItem.count({ where: { status: 'archived' } }),
      ]);

    return {
      totalContent,
      publishedContent,
      draftContent,
      pendingContent,
      archivedContent,
    };
  }

  async getUniverses(): Promise<unknown> {
    const universes = await this.prisma.universe.findMany({
      include: {
        _count: { select: { contentItems: true } },
      },
    });

    return universes.map((u) => ({
      id: u.id,
      name: u.name,
      displayName: u.displayName,
      description: u.description,
      contentCount: u._count.contentItems,
    }));
  }
}
