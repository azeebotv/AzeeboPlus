import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../../prisma/client/index.js';

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

      // Soft delete: set status to 'deleted' instead of hard delete
      // This preserves referential integrity with comments, rentals, and media
      return this.prisma.contentItem.update({
        where: { id: contentId },
        data: { status: 'deleted' },
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

  // --- Feature Flags ---

  async listFeatureFlags() {
    try {
      const flags = await this.prisma.universeFeatureFlag.findMany({
        include: { universe: { select: { name: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: flags.map((f) => ({
          key: f.featureKey,
          enabled: f.isEnabled,
          universe: f.universe.name,
          universeDisplayName: f.universe.displayName,
          metadata: f.metadata,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to list feature flags: ${error}`);
      return {
        success: false,
        error: { code: 'LIST_FLAGS_FAILED', message: 'Failed to list feature flags' },
      };
    }
  }

  async createFeatureFlag(data: {
    key: string;
    enabled?: boolean;
    description?: string;
    rolloutPercentage?: number;
    userIds?: string[];
  }) {
    try {
      const existing = await this.prisma.universeFeatureFlag.findFirst({
        where: { featureKey: data.key },
      });
      if (existing) {
        return {
          success: false,
          error: { code: 'FLAG_EXISTS', message: 'Feature flag already exists' },
        };
      }

      const universe = await this.prisma.universe.findFirst({ where: { isEnabled: true } });
      if (!universe) {
        return {
          success: false,
          error: { code: 'NO_UNIVERSE', message: 'No active universe found' },
        };
      }

      const flag = await this.prisma.universeFeatureFlag.create({
        data: {
          universeId: universe.id,
          featureKey: data.key,
          isEnabled: data.enabled ?? true,
          metadata: {
            ...(data.description !== undefined && { description: data.description }),
            ...(data.rolloutPercentage !== undefined && {
              rolloutPercentage: data.rolloutPercentage,
            }),
            ...(data.userIds !== undefined && { userIds: data.userIds }),
          },
        },
      });

      return { success: true, data: { key: flag.featureKey, enabled: flag.isEnabled } };
    } catch (error) {
      this.logger.error(`Failed to create feature flag: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_FLAG_FAILED', message: 'Failed to create feature flag' },
      };
    }
  }

  async updateFeatureFlag(
    key: string,
    data: {
      enabled?: boolean;
      description?: string;
      rolloutPercentage?: number;
      userIds?: string[];
    }
  ) {
    try {
      const flag = await this.prisma.universeFeatureFlag.findFirst({ where: { featureKey: key } });
      if (!flag) {
        return {
          success: false,
          error: { code: 'FLAG_NOT_FOUND', message: 'Feature flag not found' },
        };
      }

      const updated = await this.prisma.universeFeatureFlag.update({
        where: { id: flag.id },
        data: {
          isEnabled: data.enabled ?? flag.isEnabled,
          metadata: {
            ...(flag.metadata as Record<string, unknown>),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.rolloutPercentage !== undefined && {
              rolloutPercentage: data.rolloutPercentage,
            }),
            ...(data.userIds !== undefined && { userIds: data.userIds }),
          },
        },
      });

      return { success: true, data: { key: updated.featureKey, enabled: updated.isEnabled } };
    } catch (error) {
      this.logger.error(`Failed to update feature flag: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_FLAG_FAILED', message: 'Failed to update feature flag' },
      };
    }
  }

  async deleteFeatureFlag(key: string) {
    try {
      const flag = await this.prisma.universeFeatureFlag.findFirst({ where: { featureKey: key } });
      if (!flag) {
        return {
          success: false,
          error: { code: 'FLAG_NOT_FOUND', message: 'Feature flag not found' },
        };
      }

      await this.prisma.universeFeatureFlag.delete({ where: { id: flag.id } });
      return { success: true, data: { key } };
    } catch (error) {
      this.logger.error(`Failed to delete feature flag: ${error}`);
      return {
        success: false,
        error: { code: 'DELETE_FLAG_FAILED', message: 'Failed to delete feature flag' },
      };
    }
  }

  async toggleFeatureFlag(key: string) {
    try {
      const flag = await this.prisma.universeFeatureFlag.findFirst({ where: { featureKey: key } });
      if (!flag) {
        return {
          success: false,
          error: { code: 'FLAG_NOT_FOUND', message: 'Feature flag not found' },
        };
      }

      const updated = await this.prisma.universeFeatureFlag.update({
        where: { id: flag.id },
        data: { isEnabled: !flag.isEnabled },
      });

      return { success: true, data: { key: updated.featureKey, enabled: updated.isEnabled } };
    } catch (error) {
      this.logger.error(`Failed to toggle feature flag: ${error}`);
      return {
        success: false,
        error: { code: 'TOGGLE_FLAG_FAILED', message: 'Failed to toggle feature flag' },
      };
    }
  }

  async getUniverseFlags(universeId: string) {
    try {
      const flags = await this.prisma.universeFeatureFlag.findMany({
        where: { universeId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: flags.map((f) => ({
          key: f.featureKey,
          enabled: f.isEnabled,
          metadata: f.metadata,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get universe flags: ${error}`);
      return {
        success: false,
        error: { code: 'GET_UNIVERSE_FLAGS_FAILED', message: 'Failed to get universe flags' },
      };
    }
  }

  async updateUniverseFlag(
    universeId: string,
    featureKey: string,
    data: { isEnabled?: boolean; metadata?: Record<string, unknown> }
  ) {
    try {
      const flag = await this.prisma.universeFeatureFlag.findFirst({
        where: { universeId, featureKey },
      });

      if (flag) {
        const updated = await this.prisma.universeFeatureFlag.update({
          where: { id: flag.id },
          data: {
            isEnabled: data.isEnabled ?? flag.isEnabled,
            metadata: (data.metadata as Prisma.InputJsonValue) ?? flag.metadata,
          },
        });
        return { success: true, data: { key: updated.featureKey, enabled: updated.isEnabled } };
      }

      const created = await this.prisma.universeFeatureFlag.create({
        data: {
          universeId,
          featureKey,
          isEnabled: data.isEnabled ?? true,
          metadata: data.metadata as Prisma.InputJsonValue,
        },
      });
      return { success: true, data: { key: created.featureKey, enabled: created.isEnabled } };
    } catch (error) {
      this.logger.error(`Failed to update universe flag: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_UNIVERSE_FLAG_FAILED', message: 'Failed to update universe flag' },
      };
    }
  }

  // --- Geo Restrictions ---

  async listGeoRestrictions() {
    try {
      const restrictions = await this.prisma.geoRestriction.findMany({
        orderBy: { countryName: 'asc' },
      });
      return { success: true, data: restrictions };
    } catch (error) {
      this.logger.error(`Failed to list geo restrictions: ${error}`);
      return {
        success: false,
        error: { code: 'LIST_GEO_FAILED', message: 'Failed to list geo restrictions' },
      };
    }
  }

  async createGeoRestriction(data: {
    countryCode: string;
    countryName: string;
    blockedContent?: string[];
    notes?: string;
  }) {
    try {
      const existing = await this.prisma.geoRestriction.findFirst({
        where: { countryCode: data.countryCode },
      });
      if (existing) {
        return {
          success: false,
          error: { code: 'GEO_EXISTS', message: 'Geo restriction already exists for this country' },
        };
      }

      const restriction = await this.prisma.geoRestriction.create({
        data: {
          countryCode: data.countryCode.toUpperCase(),
          countryName: data.countryName,
          blockedContent: data.blockedContent || [],
          notes: data.notes,
        },
      });
      return { success: true, data: restriction };
    } catch (error) {
      this.logger.error(`Failed to create geo restriction: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_GEO_FAILED', message: 'Failed to create geo restriction' },
      };
    }
  }

  async updateGeoRestriction(
    id: string,
    data: { isActive?: boolean; blockedContent?: string[]; notes?: string }
  ) {
    try {
      const restriction = await this.prisma.geoRestriction.findUnique({ where: { id } });
      if (!restriction) {
        return {
          success: false,
          error: { code: 'GEO_NOT_FOUND', message: 'Geo restriction not found' },
        };
      }

      const updated = await this.prisma.geoRestriction.update({
        where: { id },
        data: {
          isActive: data.isActive ?? restriction.isActive,
          blockedContent: data.blockedContent ?? restriction.blockedContent,
          notes: data.notes ?? restriction.notes,
        },
      });
      return { success: true, data: updated };
    } catch (error) {
      this.logger.error(`Failed to update geo restriction: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_GEO_FAILED', message: 'Failed to update geo restriction' },
      };
    }
  }

  async deleteGeoRestriction(id: string) {
    try {
      const restriction = await this.prisma.geoRestriction.findUnique({ where: { id } });
      if (!restriction) {
        return {
          success: false,
          error: { code: 'GEO_NOT_FOUND', message: 'Geo restriction not found' },
        };
      }
      await this.prisma.geoRestriction.delete({ where: { id } });
      return { success: true, data: { id } };
    } catch (error) {
      this.logger.error(`Failed to delete geo restriction: ${error}`);
      return {
        success: false,
        error: { code: 'DELETE_GEO_FAILED', message: 'Failed to delete geo restriction' },
      };
    }
  }

  async updateContentGeo(
    contentId: string,
    data: {
      allowedCountries?: string[];
      blockedCountries?: string[];
      contentRating?: string;
      minAge?: number;
    }
  ) {
    try {
      const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
      if (!content) {
        return {
          success: false,
          error: { code: 'CONTENT_NOT_FOUND', message: 'Content not found' },
        };
      }

      const updated = await this.prisma.contentItem.update({
        where: { id: contentId },
        data: {
          allowedCountries: data.allowedCountries ?? content.allowedCountries,
          blockedCountries: data.blockedCountries ?? content.blockedCountries,
          contentRating: data.contentRating ?? content.contentRating,
          minAge: data.minAge ?? content.minAge,
        },
      });
      return {
        success: true,
        data: {
          id: updated.id,
          allowedCountries: updated.allowedCountries,
          blockedCountries: updated.blockedCountries,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to update content geo: ${error}`);
      return {
        success: false,
        error: {
          code: 'UPDATE_CONTENT_GEO_FAILED',
          message: 'Failed to update content geo restrictions',
        },
      };
    }
  }
}
