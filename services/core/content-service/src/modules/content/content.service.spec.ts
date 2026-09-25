import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { MediaService } from '../media/media.service.js';
import { TranscodingService } from '../media/transcoding.service.js';
import { ContentRepository } from './content.repository.js';
import { ContentFeedService } from './content-feed.service.js';
import { ContentModerationService } from './content-moderation.service.js';
import { ContentRelationshipService } from './content-relationship.service.js';
import { ContentCategoryService } from './content-category.service.js';
import { ContentIngestionService } from './content-ingestion.service.js';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from '../../cache/redis.service.js';
import { CacheService } from '@azeebo/shared-services';
import { FeatureFlagService } from '@azeebo/feature-flags';

describe('ContentService', () => {
  let service: ContentService;

  const mockPrismaService = {
    contentItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    watchHistory: {
      findMany: jest.fn(),
    },
    mediaAsset: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockMediaService = {
    getMediaUrl: jest.fn(),
    generateThumbnail: jest.fn(),
    uploadMedia: jest.fn(),
  };

  const mockTranscodingService = {
    transcode: jest.fn(),
  };

  const mockFlagService = {
    isEnabled: jest.fn().mockResolvedValue(true),
    getFlag: jest.fn().mockResolvedValue(null),
    setFlag: jest.fn().mockResolvedValue(undefined),
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
    findCommentById: jest.fn(),
    getAnalytics: jest.fn(),
    findTrending: jest.fn(),
    findRecommended: jest.fn(),
    findLatest: jest.fn(),
    findByCategory: jest.fn(),
  };

  const mockConfigService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: jest.fn((key: string, defaultValue?: any) => {
      switch (key) {
        case 'MODERATION_SERVICE_URL':
          return 'http://localhost:3004';
        case 'SAFETY_SCAN_ENABLED':
          return false;
        case 'CONTENT_CACHE_TTL':
          return 300;
        default:
          return defaultValue;
      }
    }),
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delPattern: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        ContentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MediaService,
          useValue: mockMediaService,
        },
        {
          provide: TranscodingService,
          useValue: mockTranscodingService,
        },
        {
          provide: ContentRepository,
          useValue: mockContentRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
            deleteByPattern: jest.fn().mockResolvedValue(undefined),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: FeatureFlagService,
          useValue: mockFlagService,
        },
        {
          provide: ContentFeedService,
          useValue: {
            getHomeFeed: jest.fn().mockResolvedValue({
              success: true,
              data: { trending: [], latest: [], recommended: [] },
            }),
            getWatchFeed: jest.fn().mockResolvedValue({ success: true, data: [] }),
            getFeatured: jest.fn().mockResolvedValue({ success: true, data: [] }),
            getTrending: jest.fn().mockResolvedValue({ success: true, data: [] }),
            getNewReleases: jest.fn().mockResolvedValue({ success: true, data: [] }),
            getFeaturedSlides: jest.fn().mockResolvedValue({ success: true, data: [] }),
            getPopularInRegion: jest.fn().mockResolvedValue({ success: true, data: [] }),
            getRecommended: jest.fn().mockResolvedValue({ success: true, data: [] }),
          },
        },
        {
          provide: ContentModerationService,
          useValue: {
            moderateContent: jest.fn().mockResolvedValue({ approved: true }),
            checkContentSafety: jest.fn().mockResolvedValue({ isSafe: true }),
            scanContentForSafety: jest.fn().mockResolvedValue({ isSafe: true }),
            reportContent: jest.fn().mockResolvedValue({
              success: true,
              data: { message: 'Content reported successfully' },
            }),
            getContentModerationStatus: jest.fn().mockResolvedValue({ status: 'approved' }),
          },
        },
        {
          provide: ContentRelationshipService,
          useValue: {
            getRelatedContent: jest.fn().mockResolvedValue([]),
            getCollaborations: jest.fn().mockResolvedValue([]),
            addContentRelationship: jest.fn().mockResolvedValue({ success: true }),
            removeContentRelationship: jest.fn().mockResolvedValue({ success: true }),
            getContentRelationships: jest.fn().mockResolvedValue([]),
            getContentByRelationship: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ContentCategoryService,
          useValue: {
            getCategories: jest.fn().mockResolvedValue({ success: true, data: [] }),
            getCategoryById: jest.fn().mockResolvedValue(null),
            createCategory: jest.fn().mockResolvedValue({
              success: true,
              data: { id: 'cat-1', name: 'Comedy', slug: 'comedy' },
            }),
            updateCategory: jest.fn().mockResolvedValue({
              success: true,
              data: { id: 'cat-1', name: 'Updated', slug: 'updated' },
            }),
            deleteCategory: jest
              .fn()
              .mockResolvedValue({ success: true, data: { message: 'Deleted' } }),
            createTag: jest.fn().mockResolvedValue({
              success: true,
              data: { id: 'tag-1', name: 'Test', description: '' },
            }),
            updateTag: jest.fn().mockResolvedValue({
              success: true,
              data: { id: 'tag-1', name: 'Updated', description: '' },
            }),
            deleteTag: jest.fn().mockResolvedValue({ success: true, data: { message: 'Deleted' } }),
            getTags: jest.fn().mockResolvedValue({ success: true, data: [] }),
            addCategoryToContent: jest.fn().mockResolvedValue({ success: true }),
            removeCategoryFromContent: jest.fn().mockResolvedValue({ success: true }),
            addTagToContent: jest.fn().mockResolvedValue({ success: true }),
            removeTagFromContent: jest.fn().mockResolvedValue({ success: true }),
            getContentByCategory: jest.fn().mockResolvedValue([]),
            getContentByTag: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ContentIngestionService,
          useValue: {
            ingestContent: jest.fn().mockResolvedValue({ id: 'new-content' }),
          },
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHomeFeed', () => {
    it('should return home feed with trending, recommended, and latest content', async () => {
      const result = await service.getHomeFeed();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('trending');
      expect(result.data).toHaveProperty('latest');
      expect(result.data).toHaveProperty('recommended');
    });

    it('should return recommended content for logged-in user', async () => {
      const userId = 'user-123';
      const mockRecommended = [{ id: '3', title: 'Recommended 1' }];

      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.watchHistory.findMany.mockResolvedValue([{ contentId: '1' }]);
      mockPrismaService.contentItem.findMany
        .mockResolvedValueOnce([{ id: '1', universeId: 'univ-1' }])
        .mockResolvedValueOnce(mockRecommended)
        .mockResolvedValueOnce([]);

      const result = await service.getHomeFeed(userId);

      expect(result.success).toBe(true);
    });
  });

  describe('getWatchFeed', () => {
    it('should return published content for watch feed', async () => {
      const result = await service.getWatchFeed();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getContent', () => {
    it('should return content by id', async () => {
      const contentId = 'content-123';
      const mockContent = {
        id: contentId,
        title: 'Test Content',
        creator: { id: 'creator-1', displayName: 'Creator' },
        universe: { id: 'univ-1', name: 'Reality' },
      };

      mockContentRepository.findById.mockResolvedValue(mockContent);
      mockPrismaService.contentItem.update.mockResolvedValue(mockContent);

      const result = await service.getContent(contentId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockContent);
      expect(mockPrismaService.contentItem.update).toHaveBeenCalledWith({
        where: { id: contentId },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException if content not found', async () => {
      mockContentRepository.findById.mockResolvedValue(null);

      await expect(service.getContent('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchContent', () => {
    it('should return search results', async () => {
      const mockResults = {
        data: [{ id: '1', title: 'Search Result 1' }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      };

      mockContentRepository.search.mockResolvedValue(mockResults);

      const result = await service.searchContent('search term');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults.data);
    });
  });

  describe('getTrending', () => {
    it('should return trending content', async () => {
      const result = await service.getTrending();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('createContent', () => {
    it('should create content successfully', async () => {
      const userId = 'user-123';
      const createDto = {
        title: 'New Content',
        description: 'Content description',
        thumbnail: 'https://example.com/thumb.jpg',
        universeId: 'univ-1',
      };
      const mockContent = { id: 'content-1', ...createDto, creatorId: userId, status: 'draft' };

      mockContentRepository.create.mockResolvedValue(mockContent);

      const result = await service.createContent(userId, createDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockContent);
      expect(mockContentRepository.create).toHaveBeenCalledWith({
        ...createDto,
        creatorId: userId,
      });
    });
  });

  describe('updateContent', () => {
    it('should update content successfully', async () => {
      const userId = 'user-123';
      const contentId = 'content-1';
      const updateDto = { title: 'Updated Title' };
      const existingContent = { id: contentId, creatorId: userId, title: 'Old Title' };
      const updatedContent = { ...existingContent, ...updateDto };

      mockContentRepository.findById.mockResolvedValue(existingContent);
      mockContentRepository.update.mockResolvedValue(updatedContent);

      const result = await service.updateContent(userId, contentId, updateDto);

      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if content not found', async () => {
      mockContentRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateContent('user-1', 'nonexistent', { title: 'New' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not authorized', async () => {
      const content = { id: 'content-1', creatorId: 'other-user' };

      mockContentRepository.findById.mockResolvedValue(content);

      await expect(
        service.updateContent('user-123', 'content-1', { title: 'New' })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      const userId = 'user-123';
      const contentId = 'content-1';
      const content = { id: contentId, creatorId: userId };

      mockContentRepository.findById.mockResolvedValue(content);
      mockContentRepository.delete.mockResolvedValue(undefined);

      const result = await service.deleteContent(userId, contentId);

      expect(result.success).toBe(true);
      expect(result.data!.message).toBe('Content soft deleted successfully');
    });

    it('should throw NotFoundException if content not found', async () => {
      mockContentRepository.findById.mockResolvedValue(null);

      await expect(service.deleteContent('user-123', 'nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('publishContent', () => {
    it('should publish draft content successfully', async () => {
      const userId = 'user-123';
      const contentId = 'content-1';
      const content = { id: contentId, creatorId: userId, status: 'draft' };
      const publishedContent = { ...content, status: 'published', publishedAt: new Date() };

      mockPrismaService.contentItem.findUnique.mockResolvedValue(content);
      mockPrismaService.contentItem.update.mockResolvedValue(publishedContent);

      const result = await service.publishContent(userId, contentId);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('published');
    });

    it('should throw BadRequestException if content already published', async () => {
      const content = { id: 'content-1', creatorId: 'user-123', status: 'published' };

      mockPrismaService.contentItem.findUnique.mockResolvedValue(content);

      await expect(service.publishContent('user-123', 'content-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('unpublishContent', () => {
    it('should unpublish content successfully', async () => {
      const userId = 'user-123';
      const contentId = 'content-1';
      const content = { id: contentId, creatorId: userId, status: 'published' };
      const unpublishedContent = { ...content, status: 'draft', publishedAt: null };

      mockPrismaService.contentItem.findUnique.mockResolvedValue(content);
      mockPrismaService.contentItem.update.mockResolvedValue(unpublishedContent);

      const result = await service.unpublishContent(userId, contentId);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('draft');
    });

    it('should throw BadRequestException if content is not published', async () => {
      const content = { id: 'content-1', creatorId: 'user-123', status: 'draft' };

      mockPrismaService.contentItem.findUnique.mockResolvedValue(content);

      await expect(service.unpublishContent('user-123', 'content-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getMediaAsset', () => {
    it('should return media asset with signed URLs', async () => {
      const contentId = 'content-1';
      const mediaAsset = {
        id: 'media-1',
        contentItemId: contentId,
        originalUrl: 's3://bucket/video.mp4',
        thumbnailUrl: 's3://bucket/thumb.jpg',
      };

      mockPrismaService.mediaAsset.findUnique.mockResolvedValue(mediaAsset);
      mockMediaService.getMediaUrl
        .mockResolvedValue('https://cdn.example.com/video.mp4?signature=abc')
        .mockResolvedValue('https://cdn.example.com/thumb.jpg?signature=def');

      const result = await service.getMediaAsset(contentId);

      expect(result.success).toBe(true);
      expect(result.data.originalUrl).toContain('https://cdn.example.com');
    });

    it('should throw NotFoundException if media asset not found', async () => {
      mockPrismaService.mediaAsset.findUnique.mockResolvedValue(null);

      await expect(service.getMediaAsset('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reportContent', () => {
    it('should report content successfully', async () => {
      const userId = 'user-123';
      const contentId = 'content-1';
      const reportData = { type: 'spam', reason: 'This is spam' };

      mockPrismaService.contentItem.findUnique.mockResolvedValue({ id: contentId });

      const originalFetch = global.fetch;
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: { reportId: 'report-123' } }),
      });
      global.fetch = mockFetch;

      const result = await service.reportContent(userId, contentId, reportData);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Content reported successfully');

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe('categories', () => {
    it('should create a category', async () => {
      const result = await service.createCategory('Comedy', 'comedy');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'cat-1', name: 'Comedy', slug: 'comedy' });
    });

    it('should get all categories', async () => {
      const result = await service.getCategories();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should update a category', async () => {
      const result = await service.updateCategory('cat-1', 'New Name');

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated');
    });

    it('should delete a category', async () => {
      const result = await service.deleteCategory('cat-1');

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Deleted');
    });
  });

  describe('tags', () => {
    it('should create a tag', async () => {
      const result = await service.createTag('Funny');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'tag-1', name: 'Test', description: '' });
    });

    it('should get all tags', async () => {
      const result = await service.getTags();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should update a tag', async () => {
      const result = await service.updateTag('tag-1', 'New Tag');

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated');
    });

    it('should delete a tag', async () => {
      const result = await service.deleteTag('tag-1');

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Deleted');
    });
  });

  describe('getContentAnalytics', () => {
    it('should return content analytics', async () => {
      const contentId = 'content-1';
      const mockAnalytics = {
        contentId,
        viewCount: 1000,
        likeCount: 50,
        commentCount: 10,
        shareCount: 5,
        watchTime: 3600,
        averageWatchDuration: 180,
      };

      mockContentRepository.getAnalytics.mockResolvedValue(mockAnalytics);

      const result = await service.getContentAnalytics(contentId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAnalytics);
    });
  });

  describe('threaded comments (content_comments_v2)', () => {
    it('accepts a parentId and stores a reply while the flag is on', async () => {
      mockFlagService.isEnabled.mockResolvedValue(true);
      mockContentRepository.findCommentById.mockResolvedValue({
        id: 'comment-1',
        contentId: 'content-1',
        userId: 'user-a',
        text: 'parent',
      });
      mockContentRepository.addComment.mockResolvedValue({
        id: 'comment-2',
        contentId: 'content-1',
        userId: 'user-123',
        text: 'reply',
        parentId: 'comment-1',
      });

      const result = await service.addCommentToContent(
        'user-123',
        'content-1',
        'reply',
        'comment-1'
      );

      expect(mockContentRepository.addComment).toHaveBeenCalledWith(
        'content-1',
        'user-123',
        'reply',
        'comment-1'
      );
      expect(result.success).toBe(true);
    });

    it('rejects a parentId while the flag is off (threads unavailable)', async () => {
      mockFlagService.isEnabled.mockResolvedValue(false);

      await expect(
        service.addCommentToContent('user-123', 'content-1', 'reply', 'comment-1')
      ).rejects.toThrow(BadRequestException);
      expect(mockContentRepository.addComment).not.toHaveBeenCalled();
    });

    it('rejects a parent comment from a different content item', async () => {
      mockFlagService.isEnabled.mockResolvedValue(true);
      mockContentRepository.findCommentById.mockResolvedValue({
        id: 'comment-1',
        contentId: 'other-content',
        userId: 'user-a',
        text: 'parent',
      });

      await expect(
        service.addCommentToContent('user-123', 'content-1', 'reply', 'comment-1')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
