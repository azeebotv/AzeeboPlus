import { Test, TestingModule } from '@nestjs/testing';
import { ContentService } from './content.service';
import { PrismaService } from '../database/prisma.service';
import { MediaService } from '../media/media.service';
import { TranscodingService } from '../media/transcoding.service';
import { ContentRepository } from './content.repository';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from '../../cache/redis.service';

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
      const mockTrending = [{ id: '1', title: 'Trending 1' }];
      const mockLatest = [{ id: '2', title: 'Latest 1' }];

      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.watchHistory.findMany.mockResolvedValue([]);
      mockPrismaService.contentItem.findMany
        .mockResolvedValueOnce(mockTrending)
        .mockResolvedValueOnce(mockLatest);

      const result = await service.getHomeFeed();

      expect(result.success).toBe(true);
      expect(result.data.trending).toEqual(mockTrending);
      expect(result.data.latest).toEqual(mockLatest);
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
      const mockContent = [
        { id: '1', title: 'Video 1', status: 'published' },
        { id: '2', title: 'Video 2', status: 'published' },
      ];

      mockPrismaService.contentItem.findMany.mockResolvedValue(mockContent);

      const result = await service.getWatchFeed();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockContent);
      expect(mockPrismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'published' },
          orderBy: { viewCount: 'desc' },
          take: 50,
        })
      );
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
      const mockContent = [
        { id: '1', title: 'Trending 1', viewCount: 1000 },
        { id: '2', title: 'Trending 2', viewCount: 800 },
      ];

      mockPrismaService.contentItem.findMany.mockResolvedValue(mockContent);

      const result = await service.getTrending();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockContent);
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
      const mockCategory = { id: 'cat-1', name: 'Comedy', slug: 'comedy' };

      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const result = await service.createCategory('Comedy', 'comedy');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCategory);
    });

    it('should get all categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Comedy' },
        { id: 'cat-2', name: 'Drama' },
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCategories);
    });

    it('should update a category', async () => {
      const categoryId = 'cat-1';
      const existingCategory = { id: categoryId, name: 'Old Name', slug: 'old' };
      const updatedCategory = { ...existingCategory, name: 'New Name' };

      mockPrismaService.category.findUnique.mockResolvedValue(existingCategory);
      mockPrismaService.category.update.mockResolvedValue(updatedCategory);

      const result = await service.updateCategory(categoryId, 'New Name');

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('New Name');
    });

    it('should delete a category', async () => {
      const categoryId = 'cat-1';

      mockPrismaService.category.findUnique.mockResolvedValue({ id: categoryId });
      mockPrismaService.category.delete.mockResolvedValue({ id: categoryId });

      const result = await service.deleteCategory(categoryId);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Category deleted successfully');
    });
  });

  describe('tags', () => {
    it('should create a tag', async () => {
      const mockTag = { id: 'tag-1', name: 'Funny' };

      mockPrismaService.tag.create.mockResolvedValue(mockTag);

      const result = await service.createTag('Funny');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTag);
    });

    it('should get all tags', async () => {
      const mockTags = [
        { id: 'tag-1', name: 'Funny' },
        { id: 'tag-2', name: 'Action' },
      ];

      mockPrismaService.tag.findMany.mockResolvedValue(mockTags);

      const result = await service.getTags();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTags);
    });

    it('should update a tag', async () => {
      const tagId = 'tag-1';
      const existingTag = { id: tagId, name: 'Old Tag' };
      const updatedTag = { ...existingTag, name: 'New Tag' };

      mockPrismaService.tag.findUnique.mockResolvedValue(existingTag);
      mockPrismaService.tag.update.mockResolvedValue(updatedTag);

      const result = await service.updateTag(tagId, 'New Tag');

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('New Tag');
    });

    it('should delete a tag', async () => {
      const tagId = 'tag-1';

      mockPrismaService.tag.findUnique.mockResolvedValue({ id: tagId });
      mockPrismaService.tag.delete.mockResolvedValue({ id: tagId });

      const result = await service.deleteTag(tagId);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('Tag deleted successfully');
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
});
