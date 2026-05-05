/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto';
import { UpdateMediaAssetDto } from './dto/update-media-asset.dto';
import { MediaService } from '../media/media.service';
import { TranscodingService } from '../media/transcoding.service';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private readonly moderationServiceUrl: string;
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly transcodingService: TranscodingService,
    private readonly configService: ConfigService
  ) {
    this.moderationServiceUrl = this.configService.get<string>(
      'MODERATION_SERVICE_URL',
      'http://localhost:3004'
    );
  }

  async getHomeFeed(userId?: string) {
    const [trending, recommended, latest] = await Promise.all([
      this.prisma.contentItem.findMany({
        orderBy: { viewCount: 'desc' },
        take: 10,
        include: { creator: true, universe: true },
      }),
      userId
        ? await this.prisma.contentItem.findMany({
            where: {
              id: {
                notIn: (
                  await this.prisma.watchHistory.findMany({
                    where: { userId },
                    select: { contentId: true },
                  })
                ).map((h) => h.contentId),
              },
            },
            orderBy: { viewCount: 'desc' },
            take: 10,
            include: { creator: true, universe: true },
          })
        : [],
      this.prisma.contentItem.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { creator: true, universe: true },
      }),
    ]);

    return {
      success: true,
      data: {
        trending,
        recommended,
        latest,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getWatchFeed(_userId?: string) {
    const content = await this.prisma.contentItem.findMany({
      where: { status: 'published' },
      orderBy: { viewCount: 'desc' },
      take: 50,
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: content,
    };
  }

  async getContent(id: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
      include: {
        creator: true,
        universe: true,
        mediaAsset: true,
        categories: true,
        tags: true,
      },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    // Increment view count
    await this.prisma.contentItem.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      success: true,
      data: content,
    };
  }

  async searchContent(query: string) {
    const content = await this.prisma.contentItem.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        status: 'published',
      },
      orderBy: { viewCount: 'desc' },
      take: 50,
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: content,
    };
  }

  async getTrending() {
    const content = await this.prisma.contentItem.findMany({
      where: { status: 'published' },
      orderBy: { viewCount: 'desc' },
      take: 20,
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: content,
    };
  }

  async getRecommended(userId: string) {
    // Get user's watched content IDs and their universe
    const watchedContent = await this.prisma.watchHistory.findMany({
      where: { userId },
    });

    const watchedContentIds = watchedContent.map((h) => h.contentId);

    // Get the content items to find their universe IDs
    const watchedContentItems = await this.prisma.contentItem.findMany({
      where: { id: { in: watchedContentIds } },
      select: { id: true, universeId: true },
    });

    const watchedUniverseIds = watchedContentItems.map((c) => c.universeId).filter((id) => id);

    const content = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        universeId: { in: watchedUniverseIds.length ? watchedUniverseIds : undefined },
        id: {
          notIn: watchedContentIds,
        },
      },
      orderBy: { viewCount: 'desc' },
      take: 20,
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: content,
    };
  }

  async createContent(userId: string, createContentDto: CreateContentDto) {
    const content = await this.prisma.contentItem.create({
      data: {
        ...createContentDto,
        creatorId: userId,
        status: 'draft',
      },
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: content,
    };
  }

  async updateContent(userId: string, id: string, updateContentDto: UpdateContentDto) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to update this content');
    }

    const updatedContent = await this.prisma.contentItem.update({
      where: { id },
      data: {
        ...updateContentDto,
        updatedAt: new Date(),
      },
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: updatedContent,
    };
  }

  async deleteContent(userId: string, id: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to delete this content');
    }

    await this.prisma.contentItem.update({
      where: { id },
      data: { status: 'deleted', updatedAt: new Date() },
    });
    return {
      success: true,
      data: { message: 'Content soft deleted successfully' },
    };
  }

  async publishContent(userId: string, id: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to publish this content');
    }

    if (content.status !== 'draft') {
      throw new BadRequestException('Content is already published or pending');
    }

    const publishedContent = await this.prisma.contentItem.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: publishedContent,
    };
  }

  async unpublishContent(userId: string, id: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to unpublish this content');
    }

    if (content.status !== 'published') {
      throw new BadRequestException('Content is not published');
    }

    const unpublishedContent = await this.prisma.contentItem.update({
      where: { id },
      data: {
        status: 'draft',
        publishedAt: null,
        updatedAt: new Date(),
      },
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: unpublishedContent,
    };
  }

  async createMediaAsset(
    userId: string,
    contentId: string,
    createMediaAssetDto: CreateMediaAssetDto
  ) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to add media asset to this content');
    }

    const existingMediaAsset = await this.prisma.mediaAsset.findUnique({
      where: { contentItemId: contentId },
    });

    if (existingMediaAsset) {
      throw new BadRequestException('Content already has a media asset');
    }

    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        ...createMediaAssetDto,
        contentItemId: contentId,
      },
      include: { contentItem: true },
    });

    return {
      success: true,
      data: mediaAsset,
    };
  }

  async updateMediaAsset(
    userId: string,
    contentId: string,
    updateMediaAssetDto: UpdateMediaAssetDto
  ) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to update media asset for this content');
    }

    const mediaAsset = await this.prisma.mediaAsset.findUnique({
      where: { contentItemId: contentId },
    });

    if (!mediaAsset) {
      throw new NotFoundException(`Media asset not found`);
    }

    const updatedMediaAsset = await this.prisma.mediaAsset.update({
      where: { id: mediaAsset.id },
      data: {
        ...updateMediaAssetDto,
        updatedAt: new Date(),
      },
      include: { contentItem: true },
    });

    return {
      success: true,
      data: updatedMediaAsset,
    };
  }

  async deleteMediaAsset(userId: string, contentId: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to delete media asset for this content');
    }

    const mediaAsset = await this.prisma.mediaAsset.findUnique({
      where: { contentItemId: contentId },
    });

    if (!mediaAsset) {
      throw new NotFoundException(`Media asset not found`);
    }

    await this.prisma.mediaAsset.delete({
      where: { id: mediaAsset.id },
    });

    return {
      success: true,
      data: { message: 'Media asset deleted successfully' },
    };
  }

  async getMediaAsset(contentId: string) {
    const mediaAsset = await this.prisma.mediaAsset.findUnique({
      where: { contentItemId: contentId },
      include: { contentItem: true },
    });

    if (!mediaAsset) {
      throw new NotFoundException(`Media asset not found`);
    }

    // Generate signed URLs for media assets
    const signedOriginalUrl = await this.mediaService.getMediaUrl(mediaAsset.originalUrl);
    const signedThumbnailUrl = mediaAsset.thumbnailUrl
      ? await this.mediaService.getMediaUrl(mediaAsset.thumbnailUrl)
      : null;

    return {
      success: true,
      data: {
        ...mediaAsset,
        originalUrl: signedOriginalUrl,
        thumbnailUrl: signedThumbnailUrl,
      },
    };
  }

  async getSignedMediaUrl(contentId: string, expiresIn: number = 3600) {
    const mediaAsset = await this.prisma.mediaAsset.findUnique({
      where: { contentItemId: contentId },
    });

    if (!mediaAsset) {
      throw new NotFoundException(`Media asset not found`);
    }

    const signedUrl = await this.mediaService.getMediaUrl(mediaAsset.originalUrl, expiresIn);

    return {
      success: true,
      data: {
        signedUrl,
        expiresIn,
        mediaAssetId: mediaAsset.id,
      },
    };
  }

  async generateThumbnail(
    contentId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ) {
    const mediaAsset = await this.prisma.mediaAsset.findUnique({
      where: { contentItemId: contentId },
    });

    if (!mediaAsset) {
      throw new NotFoundException(`Media asset not found`);
    }

    const thumbnailUrl = await this.mediaService.generateThumbnail(mediaAsset.originalUrl, {
      width: options?.width || 300,
      height: options?.height || 200,
      quality: options?.quality,
    });

    // Update the media asset with the new thumbnail URL
    await this.prisma.mediaAsset.update({
      where: { id: mediaAsset.id },
      data: {
        thumbnailUrl,
      },
    });

    return {
      success: true,
      data: {
        thumbnailUrl,
        mediaAssetId: mediaAsset.id,
      },
    };
  }

  async reportContent(
    userId: string,
    contentId: string,
    reportData: {
      type: string;
      reason: string;
    }
  ) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    try {
      const response = await fetch(`${this.moderationServiceUrl}/moderation/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportingUserId: userId,
          type: reportData.type,
          contentId,
          reason: reportData.reason,
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Moderation service returned ${response.status} for content report`);
      }

      const result = await response.json();
      return {
        success: true,
        data: {
          reportId: result.data?.reportId || `report_${Date.now()}`,
          message: 'Content reported successfully',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to report content to moderation service: ${(error as Error).message}`
      );
      throw new BadRequestException('Failed to submit report. Please try again later.');
    }
  }

  async getContentModerationStatus(contentId: string) {
    try {
      const response = await fetch(
        `${this.moderationServiceUrl}/moderation/content/${contentId}/status`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: {
              reports: 0,
              openReports: 0,
              moderationCases: 0,
              currentStatus: 'none',
            },
          };
        }
        this.logger.warn(`Moderation service returned ${response.status} for status check`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      this.logger.error(`Failed to get moderation status: ${(error as Error).message}`);
      return {
        success: true,
        data: {
          reports: 0,
          openReports: 0,
          moderationCases: 0,
          currentStatus: 'unknown',
        },
      };
    }
  }

  // Category management
  async createCategory(
    name: string,
    slug: string,
    description?: string,
    icon?: string,
    color?: string
  ) {
    const category = await this.prisma.category.create({
      data: {
        name,
        slug,
        description,
        icon,
        color,
      },
    });

    return {
      success: true,
      data: category,
    };
  }

  async updateCategory(
    id: string,
    name?: string,
    slug?: string,
    description?: string,
    icon?: string,
    color?: string
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category not found`);
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name: name || category.name,
        slug: slug || category.slug,
        description: description !== undefined ? description : category.description,
        icon: icon !== undefined ? icon : category.icon,
        color: color !== undefined ? color : category.color,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: updatedCategory,
    };
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category not found`);
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      success: true,
      data: { message: 'Category deleted successfully' },
    };
  }

  async getCategories() {
    const categories = await this.prisma.category.findMany();

    return {
      success: true,
      data: categories,
    };
  }

  // Tag management
  async createTag(name: string, description?: string) {
    const tag = await this.prisma.tag.create({
      data: {
        name,
        description,
      },
    });

    return {
      success: true,
      data: tag,
    };
  }

  async updateTag(id: string, name?: string, description?: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag not found`);
    }

    const updatedTag = await this.prisma.tag.update({
      where: { id },
      data: {
        name: name || tag.name,
        description: description !== undefined ? description : tag.description,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: updatedTag,
    };
  }

  async deleteTag(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag not found`);
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    return {
      success: true,
      data: { message: 'Tag deleted successfully' },
    };
  }

  async getTags() {
    const tags = await this.prisma.tag.findMany();

    return {
      success: true,
      data: tags,
    };
  }

  // Content categorization
  async addCategoryToContent(userId: string, contentId: string, categoryId: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to modify this content');
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category not found`);
    }

    await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        categories: {
          connect: { id: categoryId },
        },
      },
    });

    return {
      success: true,
      data: { message: 'Category added to content successfully' },
    };
  }

  async removeCategoryFromContent(userId: string, contentId: string, categoryId: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to modify this content');
    }

    await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        categories: {
          disconnect: { id: categoryId },
        },
      },
    });

    return {
      success: true,
      data: { message: 'Category removed from content successfully' },
    };
  }

  async addTagToContent(userId: string, contentId: string, tagId: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to modify this content');
    }

    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException(`Tag not found`);
    }

    await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        tags: {
          connect: { id: tagId },
        },
      },
    });

    return {
      success: true,
      data: { message: 'Tag added to content successfully' },
    };
  }

  async removeTagFromContent(userId: string, contentId: string, tagId: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to modify this content');
    }

    await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
    });

    return {
      success: true,
      data: { message: 'Tag removed from content successfully' },
    };
  }

  // Get content by category or tag
  async getContentByCategory(categoryId: string) {
    const content = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        categories: {
          some: {
            id: categoryId,
          },
        },
      },
      include: { creator: true, universe: true, categories: true },
    });

    return {
      success: true,
      data: content,
    };
  }

  async getContentByTag(tagId: string) {
    const content = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        tags: {
          some: {
            id: tagId,
          },
        },
      },
      include: { creator: true, universe: true, tags: true },
    });

    return {
      success: true,
      data: content,
    };
  }

  // Content relationships
  async addContentRelationship(
    userId: string,
    contentId: string,
    relatedContentId: string,
    relationshipType: string
  ) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to modify this content');
    }

    const relatedContent = await this.prisma.contentItem.findUnique({
      where: { id: relatedContentId },
    });

    if (!relatedContent) {
      throw new NotFoundException(`Related content not found`);
    }

    const existingRelationship = await this.prisma.contentRelationship.findUnique({
      where: { contentId_relatedContentId: { contentId, relatedContentId } },
    });

    if (existingRelationship) {
      throw new BadRequestException('Relationship already exists');
    }

    const relationship = await this.prisma.contentRelationship.create({
      data: {
        contentId,
        relatedContentId,
        type: relationshipType,
      },
      include: {
        content: true,
        relatedContent: true,
      },
    });

    return {
      success: true,
      data: relationship,
    };
  }

  async removeContentRelationship(userId: string, contentId: string, relatedContentId: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId && content.universeId !== userId) {
      throw new BadRequestException('Not authorized to modify this content');
    }

    const relationship = await this.prisma.contentRelationship.findUnique({
      where: { contentId_relatedContentId: { contentId, relatedContentId } },
    });

    if (!relationship) {
      throw new NotFoundException(`Relationship not found`);
    }

    await this.prisma.contentRelationship.delete({
      where: { id: relationship.id },
    });

    return {
      success: true,
      data: { message: 'Relationship removed successfully' },
    };
  }

  async getContentRelationships(contentId: string) {
    const relationships = await this.prisma.contentRelationship.findMany({
      where: {
        contentId,
      },
      include: {
        relatedContent: {
          include: {
            creator: true,
            universe: true,
          },
        },
      },
    });

    return {
      success: true,
      data: relationships,
    };
  }

  async getContentByRelationship(contentId: string, relationshipType?: string) {
    const where: Prisma.ContentRelationshipWhereInput = {
      contentId,
    };

    if (relationshipType) {
      where.type = relationshipType;
    }

    const relationships = await this.prisma.contentRelationship.findMany({
      where,
      include: {
        relatedContent: {
          include: {
            creator: true,
            universe: true,
            mediaAsset: true,
          },
        },
      },
    });

    const relatedContent = relationships.map((r) => r.relatedContent);

    return {
      success: true,
      data: relatedContent,
    };
  }

  // Media transcoding
  async startTranscoding(
    contentId: string,
    options?: {
      formats?: string[];
      resolutions?: string[];
      bitrates?: number[];
    }
  ) {
    const mediaAsset = await this.prisma.mediaAsset.findUnique({
      where: { contentItemId: contentId },
    });

    if (!mediaAsset) {
      throw new NotFoundException(`Media asset not found`);
    }

    const job = await this.transcodingService.startTranscodingJob(
      mediaAsset.id,
      mediaAsset.originalUrl,
      options
    );

    // In a real implementation, we would save the job ID to the media asset
    // await this.prisma.mediaAsset.update({
    //   where: { id: mediaAsset.id },
    //   data: { transcodingJobId: job.jobId },
    // });

    return {
      success: true,
      data: job,
    };
  }

  async getTranscodingStatus(contentId: string, jobId: string) {
    const mediaAsset = await this.prisma.mediaAsset.findUnique({
      where: { contentItemId: contentId },
    });

    if (!mediaAsset) {
      throw new NotFoundException(`Media asset not found`);
    }

    const status = await this.transcodingService.getTranscodingJobStatus(jobId);

    return {
      success: true,
      data: status,
    };
  }

  async getTranscodedMediaUrl(
    contentId: string,
    jobId: string,
    format: string,
    resolution: string,
    expiresIn: number = 3600
  ) {
    const mediaAsset = await this.prisma.mediaAsset.findUnique({
      where: { contentItemId: contentId },
    });

    if (!mediaAsset) {
      throw new NotFoundException(`Media asset not found`);
    }

    const url = await this.transcodingService.getTranscodedMediaUrl(
      jobId,
      format,
      resolution,
      expiresIn
    );

    return {
      success: true,
      data: {
        url,
        expiresIn,
        format,
        resolution,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkContentAvailability(contentId: string, _userId?: string) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
      include: { universe: true },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    const now = new Date();
    const availability = {
      isAvailable: false,
      reason: '',
      windowType: content.windowType,
      releaseDate: content.releaseDate,
      streamingReleaseDate: content.streamingReleaseDate,
      windowEndDate: content.windowEndDate,
      isExclusive: content.isExclusive,
      isPremiere: content.isPremiere,
    };

    if (content.status !== 'published') {
      availability.reason = 'Content is not published';
      return { success: true, data: availability };
    }

    if (content.windowEndDate && now > content.windowEndDate) {
      availability.reason = 'Content window has expired';
      return { success: true, data: availability };
    }

    if (content.streamingReleaseDate && now < content.streamingReleaseDate) {
      availability.reason = `Content streaming begins on ${content.streamingReleaseDate.toISOString()}`;
      return { success: true, data: availability };
    }

    if (content.windowEndDate) {
      const daysRemaining = Math.ceil(
        (content.windowEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      availability.reason = `Content available for ${daysRemaining} more days`;
    } else {
      availability.reason = 'Content is available';
    }

    availability.isAvailable = true;
    return { success: true, data: availability };
  }

  async getContentByWindow(windowType?: string, includeExpired = false) {
    const now = new Date();

    const where: Prisma.ContentItemWhereInput = {
      status: 'published',
    };

    if (!includeExpired) {
      where.OR = [{ windowEndDate: null }, { windowEndDate: { gt: now } }];
    }

    if (windowType) {
      where.windowType = windowType;
    }

    const content = await this.prisma.contentItem.findMany({
      where,
      include: { creator: true, universe: true },
      orderBy: { streamingReleaseDate: 'desc' },
    });

    const windows: Record<string, typeof content> = {
      premium: content.filter((c) => c.windowType === 'premium'),
      standard: content.filter((c) => c.windowType === 'standard'),
      basic: content.filter((c) => c.windowType === 'basic'),
      all: content,
    };

    return {
      success: true,
      data: windowType ? windows[windowType] || [] : windows,
    };
  }

  async getPremieres() {
    const now = new Date();

    const content = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        isPremiere: true,
        OR: [{ windowEndDate: null }, { windowEndDate: { gt: now } }],
      },
      include: { creator: true, universe: true },
      orderBy: { streamingReleaseDate: 'desc' },
    });

    return {
      success: true,
      data: content,
    };
  }

  async getExclusiveContent() {
    const now = new Date();

    const content = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        isExclusive: true,
        OR: [{ windowEndDate: null }, { windowEndDate: { gt: now } }],
      },
      include: { creator: true, universe: true },
      orderBy: { streamingReleaseDate: 'desc' },
    });

    return {
      success: true,
      data: content,
    };
  }

  async updateContentWindow(
    userId: string,
    contentId: string,
    windowData: {
      releaseDate?: Date;
      theatricalReleaseDate?: Date;
      streamingReleaseDate?: Date;
      windowEndDate?: Date;
      windowType?: string;
      isExclusive?: boolean;
      isPremiere?: boolean;
    }
  ) {
    const content = await this.prisma.contentItem.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content not found`);
    }

    if (content.creatorId !== userId) {
      throw new BadRequestException('Not authorized to update this content');
    }

    const updatedContent = await this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        ...windowData,
        updatedAt: new Date(),
      },
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: updatedContent,
    };
  }
}
