import {Inject,  Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getContentStats() {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get content stats: ${error}`);
      return {
        success: false,
        error: { code: 'GET_CONTENT_STATS_FAILED', message: 'Failed to retrieve content stats' },
      };
    }
  }

  async getAllContent(options?: {
    page?: number;
    limit?: number;
    status?: string;
    universeId?: string;
  }) {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get all content: ${error}`);
      return {
        success: false,
        error: { code: 'GET_ALL_CONTENT_FAILED', message: 'Failed to retrieve content' },
      };
    }
  }

  async getContentById(contentId: string) {
    try {
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
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get content by id: ${error}`);
      return {
        success: false,
        error: { code: 'GET_CONTENT_FAILED', message: 'Failed to retrieve content' },
      };
    }
  }

  async updateContentStatus(contentId: string, status: string) {
    try {
      const allowedStatuses = ['draft', 'published', 'pending', 'deleted', 'removed'];
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestException(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
      }

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
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to update content status: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_STATUS_FAILED', message: 'Failed to update content status' },
      };
    }
  }

  async deleteContent(contentId: string) {
    try {
      const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
      if (!content) {
        throw new NotFoundException('Content not found');
      }

      return this.prisma.contentItem.delete({
        where: { id: contentId },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete content: ${error}`);
      return {
        success: false,
        error: { code: 'DELETE_CONTENT_FAILED', message: 'Failed to delete content' },
      };
    }
  }

  async getUniverses() {
    try {
      return this.prisma.universe.findMany({
        orderBy: { sortOrder: 'asc' },
      });
    } catch (error) {
      this.logger.error(`Failed to get universes: ${error}`);
      return {
        success: false,
        error: { code: 'GET_UNIVERSES_FAILED', message: 'Failed to retrieve universes' },
      };
    }
  }

  async getCommentsByContentId(contentId: string, options?: { page?: number; limit?: number }) {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get comments by content id: ${error}`);
      return {
        success: false,
        error: { code: 'GET_COMMENTS_FAILED', message: 'Failed to retrieve comments' },
      };
    }
  }
}
