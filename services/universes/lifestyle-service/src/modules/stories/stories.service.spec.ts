import { Test, TestingModule } from '@nestjs/testing';
import { StoriesService } from './stories.service';
import { PrismaService } from '../database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('StoriesService', () => {
  let service: StoriesService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockCategory = {
    id: 'cat-1',
    name: 'Culture',
    slug: 'culture',
    description: 'Culture stories',
  };

  const mockStory = {
    id: 'story-1',
    title: 'Test Story',
    slug: 'test-story',
    content: 'This is a test story content with enough words to calculate read time properly.',
    excerpt: 'A test story',
    coverImage: 'https://example.com/cover.jpg',
    categoryId: 'cat-1',
    category: mockCategory,
    authorId: 'user-123',
    status: 'published',
    viewCount: 100,
    readTime: 1,
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesService,
        {
          provide: PrismaService,
          useValue: {
            cultureStory: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            storyCategory: {
              findMany: jest.fn(),
            },
            $transaction: jest.fn((fn: unknown) => {
              const prismaMock = (service as unknown as { prisma: Record<string, unknown> })
                ?.prisma;
              return typeof fn === 'function'
                ? (fn as (tx: unknown) => unknown)(prismaMock ?? {})
                : Promise.all(fn as unknown[]);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
    prismaService = module.get(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStories', () => {
    it('should return paginated stories', async () => {
      (prismaService.cultureStory.findMany as jest.Mock).mockResolvedValue([mockStory]);
      (prismaService.cultureStory.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getStories();

      expect(result.success).toBe(true);
    });

    it('should filter by category', async () => {
      (prismaService.cultureStory.findMany as jest.Mock).mockResolvedValue([mockStory]);
      (prismaService.cultureStory.count as jest.Mock).mockResolvedValue(1);

      await service.getStories(1, 20, 'culture');

      expect(
        (prismaService.cultureStory.findMany as jest.Mock).mock.calls[0][0].where.category
      ).toEqual({ slug: 'culture' });
    });

    it('should handle errors gracefully', async () => {
      (prismaService.cultureStory.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.getStories();

      expect(result.success).toBe(false);
    });
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      (prismaService.storyCategory.findMany as jest.Mock).mockResolvedValue([mockCategory]);

      const result = await service.getCategories();

      expect(result.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      (prismaService.storyCategory.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await service.getCategories();

      expect(result.success).toBe(false);
    });
  });

  describe('getStoryBySlug', () => {
    it('should return story by slug', async () => {
      (prismaService.cultureStory.findUnique as jest.Mock).mockResolvedValue(mockStory);

      const result = await service.getStoryBySlug('test-story');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if story not found', async () => {
      (prismaService.cultureStory.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getStoryBySlug('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createStory', () => {
    it('should create story successfully', async () => {
      (prismaService.cultureStory.create as jest.Mock).mockResolvedValue(mockStory);

      const result = await service.createStory({
        title: 'Test Story',
        content: 'This is a test story.',
        authorId: 'user-123',
      });

      expect(result.success).toBe(true);
    });

    it('should generate slug from title', async () => {
      (prismaService.cultureStory.create as jest.Mock).mockResolvedValue(mockStory);

      await service.createStory({
        title: 'My Story!',
        content: 'Content',
        authorId: 'user-123',
      });

      const createCall = (prismaService.cultureStory.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.slug).toBe('my-story');
    });

    it('should calculate read time', async () => {
      (prismaService.cultureStory.create as jest.Mock).mockResolvedValue(mockStory);

      const longContent = Array(400).fill('word').join(' ');
      await service.createStory({
        title: 'Long Story',
        content: longContent,
        authorId: 'user-123',
      });

      const createCall = (prismaService.cultureStory.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.readTime).toBe(2);
    });
  });

  describe('updateStory', () => {
    it('should update story successfully', async () => {
      (prismaService.cultureStory.findUnique as jest.Mock).mockResolvedValue(mockStory);
      (prismaService.cultureStory.update as jest.Mock).mockResolvedValue({
        ...mockStory,
        title: 'Updated Story',
      });

      const result = await service.updateStory('story-1', { title: 'Updated Story' });

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if story not found', async () => {
      (prismaService.cultureStory.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateStory('not-found', { title: 'Updated' })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should set publishedAt when publishing', async () => {
      (prismaService.cultureStory.findUnique as jest.Mock).mockResolvedValue({
        ...mockStory,
        status: 'draft',
        publishedAt: null,
      });
      (prismaService.cultureStory.update as jest.Mock).mockResolvedValue({
        ...mockStory,
        status: 'published',
      });

      await service.updateStory('story-1', { status: 'published' });

      const updateCall = (prismaService.cultureStory.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.status).toBe('published');
      expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteStory', () => {
    it('should delete story successfully', async () => {
      (prismaService.cultureStory.findUnique as jest.Mock).mockResolvedValue(mockStory);
      (prismaService.cultureStory.delete as jest.Mock).mockResolvedValue(mockStory);

      const result = await service.deleteStory('story-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if story not found', async () => {
      (prismaService.cultureStory.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteStory('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', async () => {
      (prismaService.cultureStory.findUnique as jest.Mock).mockResolvedValue(mockStory);
      (prismaService.cultureStory.update as jest.Mock).mockResolvedValue({
        ...mockStory,
        viewCount: 101,
      });

      const result = await service.incrementViewCount('story-1');

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if story not found', async () => {
      (prismaService.cultureStory.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.incrementViewCount('not-found')).rejects.toThrow(NotFoundException);
    });
  });
});
