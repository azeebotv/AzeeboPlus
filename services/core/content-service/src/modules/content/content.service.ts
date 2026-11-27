import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../../prisma/client/index.js';
import { CreateContentDto } from './dto/create-content.dto.js';
import { UpdateContentDto } from './dto/update-content.dto.js';
import { CreateMediaAssetDto } from './dto/create-media-asset.dto.js';
import { UpdateMediaAssetDto } from './dto/update-media-asset.dto.js';
import { MediaService } from '../media/media.service.js';
import { TranscodingService } from '../media/transcoding.service.js';
import { ContentRepository } from './content.repository.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { ContentFeedService } from './content-feed.service.js';
import axios from 'axios';
import { ContentModerationService } from './content-moderation.service.js';
import { ContentRelationshipService } from './content-relationship.service.js';
import { ContentCategoryService } from './content-category.service.js';
import { ContentIngestionService } from './content-ingestion.service.js';
import { FeatureFlagService, contentFlags } from '@azeebo/feature-flags';
import { sanitizeFields, sanitizeInput } from '@azeebo/validation';

type ContentWithUniverse = Prisma.ContentItemGetPayload<{ include: { universe: true } }>;
type ContentWithUniverseCategories = Prisma.ContentItemGetPayload<{
  include: { universe: true; categories: true };
}>;
type ContentWithUniverseTags = Prisma.ContentItemGetPayload<{
  include: { universe: true; tags: true };
}>;
type ContentWithAll = Prisma.ContentItemGetPayload<{
  include: { universe: true; mediaAsset: true; categories: true; tags: true };
}>;
type ContentWithUniverseMediaAsset = Prisma.ContentItemGetPayload<{
  include: { universe: true; mediaAsset: true };
}>;
type MediaAssetWithContentItem = Prisma.MediaAssetGetPayload<{ include: { contentItem: true } }>;
type ContentRelationshipWithContent = Prisma.ContentRelationshipGetPayload<{
  include: { content: true; relatedContent: true };
}>;
type ContentRelationshipWithRelatedUniverse = Prisma.ContentRelationshipGetPayload<{
  include: { relatedContent: { include: { universe: true } } };
}>;
type CategoryModel = Prisma.CategoryGetPayload<{}>;
type TagModel = Prisma.TagGetPayload<{}>;
type TranscodingJobResult = { jobId: string; status: string; message: string };
type TranscodingStatusResult = { jobId: string; status: string; progress: number };
type ModerationStatusResult = {
  reports: number;
  openReports: number;
  moderationCases: number;
  currentStatus: string;
};
type ContentAvailabilityResult = {
  isAvailable: boolean;
  reason: string;
  windowType: string;
  releaseDate: Date | null;
  streamingReleaseDate: Date | null;
  windowEndDate: Date | null;
  isExclusive: boolean;
  isPremiere: boolean;
};

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private readonly analyticsServiceBaseUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ContentRepository) private readonly contentRepository: ContentRepository,
    @Inject(MediaService) private readonly mediaService: MediaService,
    @Inject(TranscodingService) private readonly transcodingService: TranscodingService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ContentFeedService) private readonly contentFeedService: ContentFeedService,
    @Inject(ContentModerationService)
    private readonly contentModerationService: ContentModerationService,
    @Inject(ContentRelationshipService)
    private readonly contentRelationshipService: ContentRelationshipService,
    @Inject(ContentCategoryService) private readonly contentCategoryService: ContentCategoryService,
    @Inject(ContentIngestionService)
    private readonly contentIngestionService: ContentIngestionService,
    @Inject(FeatureFlagService)
    private readonly featureFlagService: FeatureFlagService
  ) {
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3008'
    );
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        { eventName, userId, metadata, timestamp: new Date().toISOString() },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }

  private canModifyContent(
    userId: string,
    userRole: string | undefined,
    creatorId: string
  ): boolean {
    return creatorId === userId || userRole === 'admin' || userRole === 'moderator';
  }

  // Feed/Discovery methods - delegated to ContentFeedService

  async getHomeFeed(userId?: string): Promise<{
    success: boolean;
    data: {
      trending: ContentWithUniverse[];
      recommended: ContentWithUniverse[];
      latest: ContentWithUniverse[];
    };
  }> {
    return this.contentFeedService.getHomeFeed(userId);
  }

  async getWatchFeed(_userId?: string): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    return this.contentFeedService.getWatchFeed(_userId);
  }

  async getFeatured(): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    return this.contentFeedService.getFeatured();
  }

  async getTrending(): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    return this.contentFeedService.getTrending();
  }

  async getNewReleases(limit?: number): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    return this.contentFeedService.getNewReleases(limit);
  }

  async getFeaturedSlides(
    limit?: number
  ): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    return this.contentFeedService.getFeaturedSlides(limit);
  }

  async getPopularInRegion(
    limit?: number
  ): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    return this.contentFeedService.getPopularInRegion(limit);
  }

  async getRecommended(userId: string): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    return this.contentFeedService.getRecommended(userId);
  }

  // Moderation methods - delegated to ContentModerationService

  async checkContentSafety(
    contentId: string
  ): Promise<{ isSafe: boolean; issues: string[]; scanId?: string }> {
    return this.contentModerationService.checkContentSafety(contentId);
  }

  async scanContentForSafety(contentId: string): Promise<{
    success: boolean;
    data: { scanId: string; result: string; threatLevel?: string; categories?: string[] };
  }> {
    return this.contentModerationService.scanContentForSafety(contentId);
  }

  async reportContent(
    userId: string,
    contentId: string,
    reportData: {
      type: string;
      reason: string;
    }
  ): Promise<{ success: boolean; data: { reportId: string; message: string } }> {
    this.trackAnalyticsEvent('content_reported', userId, {
      contentId,
      reportType: reportData.type,
      reason: reportData.reason,
    });
    return this.contentModerationService.reportContent(userId, contentId, reportData);
  }

  async getContentModerationStatus(contentId: string): Promise<{
    success: boolean;
    data: ModerationStatusResult;
  }> {
    return this.contentModerationService.getContentModerationStatus(contentId);
  }

  // Relationship methods - delegated to ContentRelationshipService

  async addContentRelationship(
    userId: string,
    contentId: string,
    relatedContentId: string,
    relationshipType: string,
    userRole?: string
  ): Promise<{ success: boolean; data: ContentRelationshipWithContent }> {
    return this.contentRelationshipService.addContentRelationship(
      userId,
      contentId,
      relatedContentId,
      relationshipType,
      userRole
    );
  }

  async removeContentRelationship(
    userId: string,
    contentId: string,
    relatedContentId: string,
    userRole?: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    return this.contentRelationshipService.removeContentRelationship(
      userId,
      contentId,
      relatedContentId,
      userRole
    );
  }

  async getContentRelationships(contentId: string): Promise<{
    success: boolean;
    data: ContentRelationshipWithRelatedUniverse[];
  }> {
    return this.contentRelationshipService.getContentRelationships(contentId);
  }

  async getContentByRelationship(
    contentId: string,
    relationshipType?: string
  ): Promise<{ success: boolean; data: ContentWithUniverseMediaAsset[] }> {
    return this.contentRelationshipService.getContentByRelationship(contentId, relationshipType);
  }

  // Category/Tag methods - delegated to ContentCategoryService

  async createCategory(
    name: string,
    slug: string,
    description?: string,
    icon?: string,
    color?: string
  ): Promise<{ success: boolean; data: CategoryModel }> {
    return this.contentCategoryService.createCategory(name, slug, description, icon, color);
  }

  async updateCategory(
    id: string,
    name?: string,
    slug?: string,
    description?: string,
    icon?: string,
    color?: string
  ): Promise<{ success: boolean; data: CategoryModel }> {
    return this.contentCategoryService.updateCategory(id, name, slug, description, icon, color);
  }

  async deleteCategory(id: string): Promise<{ success: boolean; data: { message: string } }> {
    return this.contentCategoryService.deleteCategory(id);
  }

  async getCategories(): Promise<{ success: boolean; data: CategoryModel[] }> {
    return this.contentCategoryService.getCategories();
  }

  async createTag(
    name: string,
    description?: string
  ): Promise<{ success: boolean; data: TagModel }> {
    return this.contentCategoryService.createTag(name, description);
  }

  async updateTag(
    id: string,
    name?: string,
    description?: string
  ): Promise<{ success: boolean; data: TagModel }> {
    return this.contentCategoryService.updateTag(id, name, description);
  }

  async deleteTag(id: string): Promise<{ success: boolean; data: { message: string } }> {
    return this.contentCategoryService.deleteTag(id);
  }

  async getTags(): Promise<{ success: boolean; data: TagModel[] }> {
    return this.contentCategoryService.getTags();
  }

  async addCategoryToContent(
    userId: string,
    contentId: string,
    categoryId: string,
    userRole?: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    return this.contentCategoryService.addCategoryToContent(
      userId,
      contentId,
      categoryId,
      userRole
    );
  }

  async removeCategoryFromContent(
    userId: string,
    contentId: string,
    categoryId: string,
    userRole?: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    return this.contentCategoryService.removeCategoryFromContent(
      userId,
      contentId,
      categoryId,
      userRole
    );
  }

  async addTagToContent(
    userId: string,
    contentId: string,
    tagId: string,
    userRole?: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    return this.contentCategoryService.addTagToContent(userId, contentId, tagId, userRole);
  }

  async removeTagFromContent(
    userId: string,
    contentId: string,
    tagId: string,
    userRole?: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    return this.contentCategoryService.removeTagFromContent(userId, contentId, tagId, userRole);
  }

  async getContentByCategory(
    categoryId: string
  ): Promise<{ success: boolean; data: ContentWithUniverseCategories[] }> {
    return this.contentCategoryService.getContentByCategory(categoryId);
  }

  async getContentByTag(
    tagId: string
  ): Promise<{ success: boolean; data: ContentWithUniverseTags[] }> {
    return this.contentCategoryService.getContentByTag(tagId);
  }

  // Ingestion methods - delegated to ContentIngestionService

  async ingestShortFormContent(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { isExclusive?: boolean; windowType?: 'basic' | 'standard' | 'premium' }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.contentIngestionService.ingestShortFormContent(userId, createContentDto, options);
  }

  async ingestLongFormContent(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { isPremiere?: boolean; windowType?: 'standard' | 'premium' }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.contentIngestionService.ingestLongFormContent(userId, createContentDto, options);
  }

  async ingestClipContent(
    userId: string,
    createContentDto: CreateContentDto,
    parentContentId: string,
    clipStartTime: number,
    clipEndTime: number
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    // Kill-switch: clip ingestion stays OFF until the clip pipeline is stable.
    if (!(await this.featureFlagService.isEnabled(contentFlags.clipIngestion))) {
      throw new ForbiddenException('Clip ingestion is disabled');
    }
    return this.contentIngestionService.ingestClipContent(
      userId,
      createContentDto,
      parentContentId,
      clipStartTime,
      clipEndTime
    );
  }

  async ingestEpisodeContent(
    userId: string,
    createContentDto: CreateContentDto,
    seasonNumber: number,
    episodeNumber: number,
    seriesId?: string
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.contentIngestionService.ingestEpisodeContent(
      userId,
      createContentDto,
      seasonNumber,
      episodeNumber,
      seriesId
    );
  }

  async ingestMovieContent(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { isPremiere?: boolean; isExclusive?: boolean; windowType?: 'standard' | 'premium' }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.contentIngestionService.ingestMovieContent(userId, createContentDto, options);
  }

  async ingestGameContent(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { difficulty?: 'easy' | 'medium' | 'hard'; gameType?: string }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.contentIngestionService.ingestGameContent(userId, createContentDto, options);
  }

  async ingestSportsHighlightContent(
    userId: string,
    createContentDto: CreateContentDto,
    gameDate: Date,
    teams: string[],
    highlightType: string
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.contentIngestionService.ingestSportsHighlightContent(
      userId,
      createContentDto,
      gameDate,
      teams,
      highlightType
    );
  }

  async ingestCreatorUpload(
    userId: string,
    createContentDto: CreateContentDto,
    options?: { contentSubtype?: 'video' | 'audio' | 'image' | 'article' }
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    return this.contentIngestionService.ingestCreatorUpload(userId, createContentDto, options);
  }

  // Core content methods - kept in this service

  async listContent(
    filters?: { universe?: string; creatorId?: string; status?: string },
    page?: number,
    limit?: number
  ): Promise<{
    success: boolean;
    data: {
      items: ContentWithUniverse[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }> {
    try {
      const result = await this.contentRepository.findAll(filters, page || 1, limit || 20);

      return {
        success: true,
        data: {
          items: result.data as ContentWithUniverse[],
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to list content: ${error}`);
      mapAndThrow(error, 'listing content');
    }
  }

  async getContent(id: string): Promise<{ success: boolean; data: ContentWithAll }> {
    try {
      // Check cache first
      const cacheK = cacheKey('content', id);
      const cached = await this.cache.get<ContentWithAll>(cacheK);
      if (cached) {
        return { success: true, data: cached };
      }

      const content = (await this.contentRepository.findById(id)) as ContentWithAll | null;

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      // Cache for 2 minutes
      await this.cache.set(cacheK, content, 120);

      await this.prisma.contentItem.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`Failed to get content: ${error}`);
      mapAndThrow(error, 'retrieving content');
    }
  }

  async searchContent(query: string): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    try {
      const result = await this.contentRepository.search(query);

      return {
        success: true,
        data: result.data as ContentWithUniverse[],
      };
    } catch (error) {
      this.logger.error(`Failed to search content: ${error}`);
      mapAndThrow(error, 'searching content');
    }
  }

  async createContent(
    userId: string,
    createContentDto: CreateContentDto
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    try {
      const sanitized = sanitizeFields(createContentDto as unknown as Record<string, unknown>, [
        'title',
        'description',
        'name',
      ]) as unknown as CreateContentDto;
      const content = (await this.contentRepository.create({
        ...sanitized,
        creatorId: userId,
      })) as ContentWithUniverse;

      this.trackAnalyticsEvent('content_created', userId, {
        contentId: content.id,
        universeId: content.universeId,
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`Failed to create content: ${error}`);
      mapAndThrow(error, 'creating content');
    }
  }

  async updateContent(
    userId: string,
    id: string,
    updateContentDto: UpdateContentDto,
    userRole?: string
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    try {
      const content = await this.contentRepository.findById(id);

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId as string)) {
        throw new ForbiddenException('Not authorized to update this content');
      }

      const sanitized = sanitizeFields(updateContentDto as unknown as Record<string, unknown>, [
        'title',
        'description',
        'name',
      ]) as unknown as UpdateContentDto;
      const updatedContent = (await this.contentRepository.update(
        id,
        sanitized as Partial<Record<string, unknown>>
      )) as ContentWithUniverse;

      // Invalidate content cache
      await this.cache.delete(cacheKey('content', id));

      return {
        success: true,
        data: updatedContent,
      };
    } catch (error) {
      this.logger.error(`Failed to update content: ${error}`);
      mapAndThrow(error, 'updating content');
    }
  }

  async deleteContent(
    userId: string,
    id: string,
    userRole?: string
  ): Promise<{
    success: boolean;
    data?: { message: string };
    error?: { code: string; message: string };
  }> {
    try {
      const content = await this.contentRepository.findById(id);

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId as string)) {
        throw new ForbiddenException('Not authorized to delete this content');
      }

      await this.contentRepository.delete(id);

      // Invalidate content cache
      await this.cache.delete(cacheKey('content', id));

      return {
        success: true,
        data: { message: 'Content soft deleted successfully' },
      };
    } catch (error) {
      this.logger.error(`Failed to delete content: ${error}`);
      mapAndThrow(error, 'deleting content');
    }
  }

  async publishContent(
    userId: string,
    id: string,
    userRole?: string
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id },
      });

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to publish this content');
      }

      if (content.status !== 'draft') {
        throw new BadRequestException('Content is already published or pending');
      }

      const moderationEnabled = await this.featureFlagService.isEnabled(
        'content_moderation_enabled',
        userId
      );

      if (moderationEnabled) {
        const safetyResult = await this.checkContentSafety(id);

        if (!safetyResult.isSafe) {
          throw new ForbiddenException({
            message: 'Content failed safety scan',
            issues: safetyResult.issues,
            scanId: safetyResult.scanId,
          });
        }
      }

      const publishedContent = await this.prisma.contentItem.update({
        where: { id },
        data: {
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date(),
        },
        include: { universe: true },
      });

      // Invalidate content cache
      await this.cache.delete(cacheKey('content', id));

      this.trackAnalyticsEvent('content_published', userId, {
        contentId: id,
      });

      return {
        success: true,
        data: publishedContent,
      };
    } catch (error) {
      this.logger.error(`Failed to publish content: ${error}`);
      mapAndThrow(error, 'publishing content');
    }
  }

  async unpublishContent(
    userId: string,
    id: string,
    userRole?: string
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id },
      });

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to unpublish this content');
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
        include: { universe: true },
      });

      return {
        success: true,
        data: unpublishedContent,
      };
    } catch (error) {
      this.logger.error(`Failed to unpublish content: ${error}`);
      mapAndThrow(error, 'unpublishing content');
    }
  }

  async createMediaAsset(
    userId: string,
    contentId: string,
    createMediaAssetDto: CreateMediaAssetDto,
    userRole?: string
  ): Promise<{ success: boolean; data: MediaAssetWithContentItem }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
      });

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to add media asset to this content');
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
        } as unknown as Prisma.MediaAssetCreateInput,
        include: { contentItem: true },
      });

      return {
        success: true,
        data: mediaAsset as MediaAssetWithContentItem,
      };
    } catch (error) {
      this.logger.error(`Failed to create media asset: ${error}`);
      mapAndThrow(error, 'creating media asset');
    }
  }

  /**
   * POST /content/:id/media/upload-url — presign a direct-to-storage PUT for
   * the creator's browser. Returns { signedUrl, mediaAssetId }; the asset row
   * itself is only created by `completeMediaUpload` after the bytes land.
   */
  async createMediaUploadUrl(
    userId: string,
    contentId: string,
    file: { fileName: string; fileSize: number; contentType: string },
    userRole?: string
  ): Promise<{
    success: boolean;
    data: { signedUrl: string; mediaAssetId: string };
  }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
      });
      if (!content) {
        throw new NotFoundException(`Content not found`);
      }
      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to upload media for this content');
      }

      const existingMediaAsset = await this.prisma.mediaAsset.findUnique({
        where: { contentItemId: contentId },
      });
      if (existingMediaAsset) {
        throw new BadRequestException('Content already has a media asset');
      }

      const upload = await this.mediaService.createUploadUrl(
        contentId,
        file.fileName,
        file.contentType,
        file.fileSize
      );

      return {
        success: true,
        data: { signedUrl: upload.signedUrl, mediaAssetId: upload.mediaAssetId },
      };
    } catch (error) {
      this.logger.error(`Failed to create media upload URL: ${error}`);
      mapAndThrow(error, 'creating media upload URL');
    }
  }

  /**
   * POST /content/:id/media/complete — verify the upload reached storage and
   * register the MediaAsset. The size is taken from the stored object, not the
   * client, so the record reflects what was actually uploaded.
   */
  async completeMediaUpload(
    userId: string,
    contentId: string,
    mediaAssetId: string,
    userRole?: string
  ): Promise<{ success: boolean; data: MediaAssetWithContentItem }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
      });
      if (!content) {
        throw new NotFoundException(`Content not found`);
      }
      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to complete this upload');
      }
      if (!mediaAssetId) {
        throw new BadRequestException('mediaAssetId is required');
      }

      const existingMediaAsset = await this.prisma.mediaAsset.findUnique({
        where: { contentItemId: contentId },
      });
      if (existingMediaAsset) {
        throw new BadRequestException('Content already has a media asset');
      }

      // The object key is deterministic from the id we handed the client.
      const key = `uploads/${contentId}/${mediaAssetId}`;
      let stat: { size: number; contentType?: string };
      try {
        stat = await this.mediaService.statObject(key);
      } catch (error) {
        if (error instanceof NotFoundException) {
          // allowed-fabricated-4xx: statObject separates "the key is not in the
          // bucket" from "the bucket is not answering", so this branch only runs
          // when the object genuinely is missing — the creator's own problem, and
          // the message the upload screen already handles.
          throw new BadRequestException(
            'Upload not found in storage — the file may not have finished uploading'
          );
        }
        // Anything else (credentials refused, storage unreachable) is a server
        // failure; reporting it as a bad request tells the creator to retry
        // something that was never their fault.
        mapAndThrow(error, `confirming upload ${contentId}`);
      }
      if (!stat.size) {
        throw new BadRequestException('Uploaded object is empty');
      }

      const mediaAsset = await this.prisma.mediaAsset.create({
        data: {
          contentItemId: contentId,
          originalUrl: key,
          format: stat.contentType ?? 'application/octet-stream',
          size: stat.size,
        },
        include: { contentItem: true },
      });

      return {
        success: true,
        data: mediaAsset as MediaAssetWithContentItem,
      };
    } catch (error) {
      this.logger.error(`Failed to complete media upload: ${error}`);
      mapAndThrow(error, 'completing media upload');
    }
  }

  async updateMediaAsset(
    userId: string,
    contentId: string,
    updateMediaAssetDto: UpdateMediaAssetDto,
    userRole?: string
  ): Promise<{ success: boolean; data: MediaAssetWithContentItem }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
      });

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to update media asset for this content');
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
        } as Record<string, unknown>,
        include: { contentItem: true },
      });

      return {
        success: true,
        data: updatedMediaAsset,
      };
    } catch (error) {
      this.logger.error(`Failed to update media asset: ${error}`);
      mapAndThrow(error, 'updating media asset');
    }
  }

  async deleteMediaAsset(
    userId: string,
    contentId: string,
    userRole?: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
      });

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to delete media asset for this content');
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
    } catch (error) {
      this.logger.error(`Failed to delete media asset: ${error}`);
      mapAndThrow(error, 'deleting media asset');
    }
  }

  async getMediaAsset(
    contentId: string,
    userId?: string
  ): Promise<{
    success: boolean;
    data: MediaAssetWithContentItem & { originalUrl: string; thumbnailUrl: string | null };
  }> {
    try {
      const mediaAsset = await this.prisma.mediaAsset.findUnique({
        where: { contentItemId: contentId },
        include: { contentItem: true },
      });

      if (!mediaAsset) {
        throw new NotFoundException(`Media asset not found`);
      }

      if (userId && mediaAsset.contentItem.creatorId !== userId) {
        throw new ForbiddenException('You do not have access to this media asset');
      }

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
    } catch (error) {
      this.logger.error(`Failed to get media asset: ${error}`);
      mapAndThrow(error, 'retrieving media asset');
    }
  }

  async getSignedMediaUrl(
    _userId: string,
    contentId: string,
    expiresIn: number = 3600
  ): Promise<{
    success: boolean;
    data: { signedUrl: string; expiresIn: number; mediaAssetId: string };
  }> {
    try {
      const mediaAsset = await this.prisma.mediaAsset.findUnique({
        where: { contentItemId: contentId },
      });

      // Fallback to ContentItem.mediaUrl if no MediaAsset exists
      if (!mediaAsset) {
        const content = await this.prisma.contentItem.findUnique({
          where: { id: contentId },
          select: { mediaUrl: true },
        });

        if (!content?.mediaUrl) {
          throw new NotFoundException(`Media asset not found`);
        }

        const signedUrl = await this.mediaService.getMediaUrl(content.mediaUrl, expiresIn);
        return {
          success: true,
          data: {
            signedUrl,
            expiresIn,
            mediaAssetId: '',
          },
        };
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
    } catch (error) {
      this.logger.error(`Failed to get signed media url: ${error}`);
      mapAndThrow(error, 'getting signed media URL');
    }
  }

  async generateThumbnail(
    contentId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  ): Promise<{ success: boolean; data: { thumbnailUrl: string; mediaAssetId: string } }> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail: ${error}`);
      mapAndThrow(error, 'generating thumbnail');
    }
  }

  async getContentComments(
    contentId: string,
    page?: number,
    limit?: number,
    userId?: string
  ): Promise<{
    success: boolean;
    data: {
      id: string;
      userId: string;
      userName: string;
      content: string;
      timestamp: Date;
      likes: number;
      likedByCurrentUser: boolean;
    }[];
  }> {
    try {
      const result = await this.contentRepository.getComments(contentId, page || 1, limit || 20);

      // Check which comments the current user has liked
      let likedCommentIds = new Set<string>();
      if (userId && result.data.length > 0) {
        try {
          const commentIds = result.data.map((c: { id: string }) => c.id);
          // Use raw query since commentLike may not be in Prisma schema
          const userLikes = await this.prisma.$queryRaw<Array<{ commentId: string }>>`
            SELECT "commentId" FROM "comment_likes" WHERE "commentId" IN (${Prisma.join(commentIds)}) AND "userId" = ${userId}
          `;
          likedCommentIds = new Set(userLikes.map((l) => l.commentId));
        } catch {
          // comment_likes table may not exist — default to no likes
        }
      }

      const items = result.data.map(
        (c: {
          id: string;
          userId: string;
          text: string;
          createdAt: Date;
          userName?: string;
          content?: string;
          likes?: number;
        }) => ({
          id: c.id,
          userId: c.userId,
          userName: c.userName || 'Anonymous',
          content: c.text || c.content || '',
          timestamp: c.createdAt,
          likes: c.likes || 0,
          likedByCurrentUser: likedCommentIds.has(c.id),
        })
      );

      return {
        success: true,
        data: items,
      };
    } catch (error) {
      this.logger.error(`Failed to get content comments: ${error}`);
      mapAndThrow(error, 'retrieving content comments');
    }
  }

  async addCommentToContent(
    userId: string,
    contentId: string,
    text: string,
    parentId?: string
  ): Promise<{
    success: boolean;
    data: { id: string; contentId: string; userId: string; text: string; createdAt: Date };
  }> {
    try {
      // content_comments_v2: threaded replies are only accepted while the flag
      // is on — off, a parentId is rejected so clients can't depend on threads.
      if (parentId) {
        if (!(await this.featureFlagService.isEnabled(contentFlags.commentsV2))) {
          throw new BadRequestException('Threaded comments are not enabled');
        }
        const parent = await this.contentRepository.findCommentById(parentId);
        if (!parent || parent.contentId !== contentId) {
          throw new BadRequestException('Parent comment not found on this content');
        }
      }

      const sanitizedText = sanitizeInput(text) as string;
      const comment = await this.contentRepository.addComment(
        contentId,
        userId,
        sanitizedText,
        parentId
      );

      // Invalidate comments cache
      await this.cache.delete(`content:${contentId}:comments`).catch(() => {});
      await this.cache.delete(cacheKey('content', `${contentId}:comments`)).catch(() => {});
      await this.cache.deleteByPattern(`*${contentId}*comments*`).catch(() => {});

      return {
        success: true,
        data: comment,
      };
    } catch (error) {
      this.logger.error(`Failed to add comment to content: ${error}`);
      mapAndThrow(error, 'adding comment');
    }
  }

  async getContentAnalytics(contentId: string): Promise<{
    success: boolean;
    data: {
      contentId: string;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      watchTime: number;
    };
  }> {
    try {
      const analytics = await this.contentRepository.getAnalytics(contentId);

      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      this.logger.error(`Failed to get content analytics: ${error}`);
      mapAndThrow(error, 'retrieving content analytics');
    }
  }

  // Media transcoding

  async startTranscoding(
    contentId: string,
    options?: {
      formats?: string[];
      resolutions?: string[];
      bitrates?: number[];
    }
  ): Promise<{ success: boolean; data: TranscodingJobResult }> {
    // Kill-switch: new transcoding pipeline is opt-in.
    if (!(await this.featureFlagService.isEnabled(contentFlags.transcodingNew))) {
      throw new ForbiddenException('Transcoding is disabled');
    }
    try {
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

      return {
        success: true,
        data: job,
      };
    } catch (error) {
      this.logger.error(`Failed to start transcoding: ${error}`);
      mapAndThrow(error, 'starting transcoding');
    }
  }

  async getTranscodingStatus(
    contentId: string,
    jobId: string,
    userId?: string
  ): Promise<{ success: boolean; data: TranscodingStatusResult }> {
    try {
      const mediaAsset = await this.prisma.mediaAsset.findUnique({
        where: { contentItemId: contentId },
        include: { contentItem: true },
      });

      if (!mediaAsset) {
        throw new NotFoundException(`Media asset not found`);
      }

      if (userId && mediaAsset.contentItem.creatorId !== userId) {
        throw new ForbiddenException('You do not have access to this transcoding job');
      }

      const status = (await this.transcodingService.getTranscodingJobStatus(
        jobId
      )) as TranscodingStatusResult;

      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error(`Failed to get transcoding status: ${error}`);
      mapAndThrow(error, 'getting transcoding status');
    }
  }

  async getTranscodedMediaUrl(
    contentId: string,
    jobId: string,
    format: string,
    resolution: string,
    expiresIn: number = 3600,
    userId?: string
  ): Promise<{
    success: boolean;
    data: { url: string; expiresIn: number; format: string; resolution: string };
  }> {
    try {
      const mediaAsset = await this.prisma.mediaAsset.findUnique({
        where: { contentItemId: contentId },
        include: { contentItem: true },
      });

      if (!mediaAsset) {
        throw new NotFoundException(`Media asset not found`);
      }

      if (userId && mediaAsset.contentItem.creatorId !== userId) {
        throw new ForbiddenException('You do not have access to this transcoded media');
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
    } catch (error) {
      this.logger.error(`Failed to get transcoded media url: ${error}`);
      mapAndThrow(error, 'getting transcoded media URL');
    }
  }

  // Content windowing

  async checkContentAvailability(
    contentId: string,
    _userId?: string
  ): Promise<{ success: boolean; data: ContentAvailabilityResult }> {
    // Kill-switch: if windowing is disabled, treat all content as available.
    if (!(await this.featureFlagService.isEnabled(contentFlags.windowingEnabled))) {
      return {
        success: true,
        data: {
          isAvailable: true,
          reason: 'windowing disabled',
        } as unknown as ContentAvailabilityResult,
      };
    }
    try {
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
    } catch (error) {
      this.logger.error(`Failed to check content availability: ${error}`);
      mapAndThrow(error, 'checking content availability');
    }
  }

  async getContentByWindow(
    windowType?: string,
    includeExpired = false
  ): Promise<{
    success: boolean;
    data: ContentWithUniverse[] | Record<string, ContentWithUniverse[]>;
  }> {
    try {
      const now = new Date();

      const where: Record<string, unknown> = {
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
        include: { universe: true },
        orderBy: { streamingReleaseDate: 'desc' },
        take: 100,
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
    } catch (error) {
      this.logger.error(`Failed to get content by window: ${error}`);
      mapAndThrow(error, 'getting content by window');
    }
  }

  async getPremieres(): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    try {
      const now = new Date();

      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          isPremiere: true,
          OR: [{ windowEndDate: null }, { windowEndDate: { gt: now } }],
        },
        include: { universe: true },
        orderBy: { streamingReleaseDate: 'desc' },
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`Failed to get premieres: ${error}`);
      mapAndThrow(error, 'getting premieres');
    }
  }

  async getExclusiveContent(): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    try {
      const now = new Date();

      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          isExclusive: true,
          OR: [{ windowEndDate: null }, { windowEndDate: { gt: now } }],
        },
        include: { universe: true },
        orderBy: { streamingReleaseDate: 'desc' },
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`Failed to get exclusive content: ${error}`);
      mapAndThrow(error, 'getting exclusive content');
    }
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
    },
    userRole?: string
  ): Promise<{ success: boolean; data: ContentWithUniverse }> {
    try {
      const content = await this.prisma.contentItem.findUnique({
        where: { id: contentId },
      });

      if (!content) {
        throw new NotFoundException(`Content not found`);
      }

      if (!this.canModifyContent(userId, userRole, content.creatorId)) {
        throw new ForbiddenException('Not authorized to update this content');
      }

      const updatedContent = await this.prisma.contentItem.update({
        where: { id: contentId },
        data: {
          ...windowData,
          updatedAt: new Date(),
        },
        include: { universe: true },
      });

      return {
        success: true,
        data: updatedContent,
      };
    } catch (error) {
      this.logger.error(`Failed to update content window: ${error}`);
      mapAndThrow(error, 'updating content window');
    }
  }
}
