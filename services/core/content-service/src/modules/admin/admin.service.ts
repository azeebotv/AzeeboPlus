import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getContentStats() {
    const [totalContent, publishedContent, pendingContent, draftContent] = await Promise.all([
      this.prisma.contentItem.count(),
      this.prisma.contentItem.count({ where: { status: 'published' } }),
      this.prisma.contentItem.count({ where: { status: 'pending' } }),
      this.prisma.contentItem.count({ where: { status: 'draft' } }),
    ]);

    return {
      totalContent,
      publishedContent,
      pendingContent,
      draftContent,
    };
  }

  async getAllContent(options?: { page?: number; limit?: number; status?: string; universeId?: string }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.universeId) {
      where.universeId = options.universeId;
    }

    const [content, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          universe: true,
        },
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return {
      content,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getContentById(contentId: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      include: {
        universe: true,
        mediaAsset: true,
        categories: true,
        tags: true,
        comments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async updateContentStatus(contentId: string, status: string) {
    const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'published') {
      updateData.publishedAt = new Date();
    }

    return this.prisma.contentItem.update({
      where: { id: contentId },
      data: updateData,
    });
  }

  async deleteContent(contentId: string) {
    const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return this.prisma.contentItem.delete({
      where: { id: contentId },
    });
  }

  async getUniverses() {
    return this.prisma.universe.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCommentsByContentId(contentId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { contentId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where: { contentId } }),
    ]);

    return {
      comments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
