import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ContentService } from './content.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { ContentRepository } from './content.repository.js';
import { MediaService } from '../media/media.service.js';
import { TranscodingService } from '../media/transcoding.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { ContentFeedService } from './content-feed.service.js';
import { ContentModerationService } from './content-moderation.service.js';
import { ContentRelationshipService } from './content-relationship.service.js';
import { ContentCategoryService } from './content-category.service.js';
import { ContentIngestionService } from './content-ingestion.service.js';
import { FeatureFlagService } from '@azeebo/feature-flags';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ContentService Integration', () => {
  let service: ContentService;

  const mockPrismaService = {
    contentItem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    mediaAsset: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockContentRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
    getComments: jest.fn(),
    addComment: jest.fn(),
    getAnalytics: jest.fn(),
  };

  const mockMediaService = {
    getMediaUrl: jest.fn(),
    generateThumbnail: jest.fn(),
  };

  const mockTranscodingService = {
    startTranscodingJob: jest.fn(),
    getTranscodingJobStatus: jest.fn(),
    getTranscodedMediaUrl: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    invalidate: jest.fn().mockResolvedValue(undefined),
    deleteByPattern: jest.fn().mockResolvedValue(0),
  };

  const mockContentFeedService = {
    getHomeFeed: jest.fn(),
    getWatchFeed: jest.fn(),
    getFeatured: jest.fn(),
    getTrending: jest.fn(),
    getNewReleases: jest.fn(),
    getFeaturedSlides: jest.fn(),
    getPopularInRegion: jest.fn(),
    getRecommended: jest.fn(),
  };

  const mockContentModerationService = {
    checkContentSafety: jest.fn(),
    scanContentForSafety: jest.fn(),
    reportContent: jest.fn(),
    getContentModerationStatus: jest.fn(),
  };

  const mockContentRelationshipService = {
    addContentRelationship: jest.fn(),
    removeContentRelationship: jest.fn(),
    getContentRelationships: jest.fn(),
    getContentByRelationship: jest.fn(),
  };

  const mockContentCategoryService = {
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    getCategories: jest.fn(),
    createTag: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
    getTags: jest.fn(),
    addCategoryToContent: jest.fn(),
    removeCategoryFromContent: jest.fn(),
    addTagToContent: jest.fn(),
    removeTagFromContent: jest.fn(),
    getContentByCategory: jest.fn(),
    getContentByTag: jest.fn(),
  };

  const mockContentIngestionService = {
    ingestShortFormContent: jest.fn(),
    ingestLongFormContent: jest.fn(),
    ingestClipContent: jest.fn(),
    ingestEpisodeContent: jest.fn(),
    ingestMovieContent: jest.fn(),
    ingestGameContent: jest.fn(),
    ingestSportsHighlightContent: jest.fn(),
    ingestCreatorUpload: jest.fn(),
  };

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ContentRepository, useValue: mockContentRepository },
        { provide: MediaService, useValue: mockMediaService },
        { provide: TranscodingService, useValue: mockTranscodingService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: ContentFeedService, useValue: mockContentFeedService },
        { provide: ContentModerationService, useValue: mockContentModerationService },
        { provide: ContentRelationshipService, useValue: mockContentRelationshipService },
        { provide: ContentCategoryService, useValue: mockContentCategoryService },
        { provide: ContentIngestionService, useValue: mockContentIngestionService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              if (key === 'ANALYTICS_SERVICE_URL') return 'http://analytics-service:3008';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    jest.clearAllMocks();

    mockedAxios.post.mockResolvedValue({ data: { success: true } });
  });

  describe('createContent', () => {
    it('should create a content item and track analytics', async () => {
      const userId = 'creator-1';
      const createDto = {
        title: 'New Video',
        type: 'video',
        universeId: 'universe-1',
        mediaUrl: 'https://storage.example.com/video.mp4',
        thumbnail: 'https://storage.example.com/thumb.jpg',
      };

      const createdContent = {
        id: 'content-1',
        title: 'New Video',
        type: 'video',
        creatorId: userId,
        universeId: 'universe-1',
        status: 'draft',
        createdAt: new Date(),
        universe: { id: 'universe-1', name: 'Comedy' },
      };

      mockContentRepository.create.mockResolvedValue(createdContent);

      const result = await service.createContent(userId, createDto);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('content-1');
      expect(result.data.title).toBe('New Video');

      expect(mockContentRepository.create).toHaveBeenCalledWith({
        ...createDto,
        creatorId: userId,
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://analytics-service:3008/analytics/track',
        expect.objectContaining({
          eventName: 'content_created',
          userId: 'creator-1',
          metadata: expect.objectContaining({ contentId: 'content-1' }),
        }),
        expect.objectContaining({ timeout: 10000 })
      );
    });
  });

  describe('updateContent', () => {
    it('should update content fields and invalidate cache', async () => {
      const userId = 'creator-1';
      const contentId = 'content-1';
      const updateDto = { title: 'Updated Title' };

      mockContentRepository.findById.mockResolvedValue({
        id: contentId,
        creatorId: userId,
        status: 'draft',
      });

      mockContentRepository.update.mockResolvedValue({
        id: contentId,
        title: 'Updated Title',
        creatorId: userId,
        universe: { id: 'universe-1', name: 'Comedy' },
      });

      const result = await service.updateContent(userId, contentId, updateDto);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
      expect(mockCacheService.delete).toHaveBeenCalledWith(cacheKey('content', contentId));
    });

    it('should throw NotFoundException when content does not exist', async () => {
      mockContentRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateContent('creator-1', 'content-nonexistent', { title: 'New' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the creator', async () => {
      mockContentRepository.findById.mockResolvedValue({
        id: 'content-1',
        creatorId: 'creator-other',
        status: 'draft',
      });

      await expect(
        service.updateContent('creator-1', 'content-1', { title: 'New' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to update any content', async () => {
      mockContentRepository.findById.mockResolvedValue({
        id: 'content-1',
        creatorId: 'creator-other',
        status: 'draft',
      });

      mockContentRepository.update.mockResolvedValue({
        id: 'content-1',
        title: 'Admin Updated',
        creatorId: 'creator-other',
        universe: { id: 'universe-1', name: 'Comedy' },
      });

      const result = await service.updateContent(
        'admin-1',
        'content-1',
        { title: 'Admin Updated' },
        'admin'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('deleteContent', () => {
    it('should soft delete content and invalidate cache', async () => {
      const userId = 'creator-1';
      const contentId = 'content-1';

      mockContentRepository.findById.mockResolvedValue({
        id: contentId,
        creatorId: userId,
      });

      mockContentRepository.delete.mockResolvedValue({});

      const result = await service.deleteContent(userId, contentId);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Content soft deleted successfully');
      expect(mockContentRepository.delete).toHaveBeenCalledWith(contentId);
      expect(mockCacheService.delete).toHaveBeenCalledWith(cacheKey('content', contentId));
    });

    it('should throw NotFoundException when content does not exist', async () => {
      mockContentRepository.findById.mockResolvedValue(null);

      await expect(service.deleteContent('creator-1', 'content-nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user is not the creator', async () => {
      mockContentRepository.findById.mockResolvedValue({
        id: 'content-1',
        creatorId: 'creator-other',
      });

      await expect(service.deleteContent('creator-1', 'content-1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow moderator to delete any content', async () => {
      mockContentRepository.findById.mockResolvedValue({
        id: 'content-1',
        creatorId: 'creator-other',
      });

      mockContentRepository.delete.mockResolvedValue({});

      const result = await service.deleteContent('mod-1', 'content-1', 'moderator');

      expect(result.success).toBe(true);
    });
  });

  describe('publishContent', () => {
    it('should change content status to published', async () => {
      const userId = 'creator-1';
      const contentId = 'content-1';

      mockPrismaService.contentItem.findUnique.mockResolvedValue({
        id: contentId,
        creatorId: userId,
        status: 'draft',
        type: 'video',
      });

      mockPrismaService.contentItem.update.mockResolvedValue({
        id: contentId,
        status: 'published',
        publishedAt: new Date(),
        type: 'video',
        universe: { id: 'universe-1', name: 'Comedy' },
      });

      const result = await service.publishContent(userId, contentId);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('published');

      expect(mockPrismaService.contentItem.update).toHaveBeenCalledWith({
        where: { id: contentId },
        data: {
          status: 'published',
          publishedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        include: { universe: true },
      });

      expect(mockCacheService.delete).toHaveBeenCalledWith(cacheKey('content', contentId));
    });

    it('should throw NotFoundException when content does not exist', async () => {
      mockPrismaService.contentItem.findUnique.mockResolvedValue(null);

      await expect(service.publishContent('creator-1', 'content-nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when content is already published', async () => {
      mockPrismaService.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        creatorId: 'creator-1',
        status: 'published',
        type: 'video',
      });

      await expect(service.publishContent('creator-1', 'content-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw ForbiddenException when user is not the creator', async () => {
      mockPrismaService.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        creatorId: 'creator-other',
        status: 'draft',
        type: 'video',
      });

      await expect(service.publishContent('creator-1', 'content-1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should run content moderation when feature flag is enabled', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockPrismaService.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        creatorId: 'creator-1',
        status: 'draft',
        type: 'video',
      });

      mockContentModerationService.checkContentSafety.mockResolvedValue({
        isSafe: true,
        issues: [],
      });

      mockPrismaService.contentItem.update.mockResolvedValue({
        id: 'content-1',
        status: 'published',
        publishedAt: new Date(),
        type: 'video',
        universe: { id: 'universe-1', name: 'Comedy' },
      });

      const result = await service.publishContent('creator-1', 'content-1');

      expect(result.success).toBe(true);
      expect(mockContentModerationService.checkContentSafety).toHaveBeenCalledWith('content-1');
    });

    it('should throw ForbiddenException when content fails safety scan', async () => {
      mockFeatureFlagService.isEnabled.mockResolvedValue(true);
      mockPrismaService.contentItem.findUnique.mockResolvedValue({
        id: 'content-1',
        creatorId: 'creator-1',
        status: 'draft',
        type: 'video',
      });

      mockContentModerationService.checkContentSafety.mockResolvedValue({
        isSafe: false,
        issues: ['Inappropriate content detected'],
        scanId: 'scan-1',
      });

      await expect(service.publishContent('creator-1', 'content-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('getContent', () => {
    it('should return content with relations from cache', async () => {
      const cachedContent = {
        id: 'content-1',
        title: 'My Video',
        type: 'video',
        universe: { id: 'universe-1', name: 'Comedy' },
        mediaAsset: null,
        categories: [],
        tags: [],
      };

      mockCacheService.get.mockResolvedValue(cachedContent);

      const result = await service.getContent('content-1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('content-1');
      expect(mockContentRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch content from repository when not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const content = {
        id: 'content-1',
        title: 'My Video',
        type: 'video',
        viewCount: 0,
        universe: { id: 'universe-1', name: 'Comedy' },
        mediaAsset: null,
        categories: [],
        tags: [],
      };

      mockContentRepository.findById.mockResolvedValue(content);

      const result = await service.getContent('content-1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('content-1');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        cacheKey('content', 'content-1'),
        content,
        120
      );
      expect(mockPrismaService.contentItem.update).toHaveBeenCalledWith({
        where: { id: 'content-1' },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when content does not exist', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockContentRepository.findById.mockResolvedValue(null);

      await expect(service.getContent('content-nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
