import { Test, TestingModule } from '@nestjs/testing';
import { LifestyleFeedService } from './feed.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

// Mock @azeebo/shared-services to avoid firebase-admin resolution issues
jest.mock('@azeebo/shared-services', () => {
  class MockRedisService {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn().mockResolvedValue('OK');
    del = jest.fn().mockResolvedValue(1);
  }
  return { RedisService: MockRedisService };
});

const { RedisService: MockRedisService } = require('@azeebo/shared-services');

describe('LifestyleFeedService', () => {
  let service: LifestyleFeedService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LifestyleFeedService,
        {
          provide: PrismaService,
          useValue: {
            cultureStory: { findMany: jest.fn() },
            event: { findMany: jest.fn() },
            cityGuideEntry: { findMany: jest.fn() },
            musicEntry: { findMany: jest.fn() },
            celebrityEntry: { findMany: jest.fn() },
            nightlifeEntry: { findMany: jest.fn() },
            influencerEntry: { findMany: jest.fn() },
          },
        },
        {
          provide: MockRedisService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
            del: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(300),
            getOrThrow: jest.fn().mockReturnValue('test-value'),
          },
        },
      ],
    }).compile();

    service = module.get<LifestyleFeedService>(LifestyleFeedService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFeed', () => {
    it('should return aggregated feed items (happy path)', async () => {
      const mockDate = new Date('2024-01-01');
      const mockStories = [
        {
          id: 'story-1',
          title: 'Story 1',
          slug: 'story-1',
          excerpt: 'Excerpt 1',
          coverImage: 'image1.jpg',
          author: { displayName: 'Author 1', username: 'author1' },
          category: { name: 'Culture' },
          viewCount: 100,
          publishedAt: mockDate,
          createdAt: mockDate,
          status: 'published',
          content: 'Full content',
        },
      ];
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          slug: 'event-1',
          description: 'Event description',
          coverImage: 'image2.jpg',
          creator: { displayName: 'Creator 1', username: 'creator1' },
          category: { name: 'Events' },
          viewCount: 200,
          publishedAt: mockDate,
          createdAt: mockDate,
          status: 'published',
        },
      ];

      (prismaService.cultureStory.findMany as jest.Mock).mockResolvedValue(mockStories);
      (prismaService.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFeed();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.items.length).toBe(2);
      expect(result.data?.total).toBe(2);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
    });

    it('should filter feed by category', async () => {
      const mockDate = new Date('2024-01-01');
      const mockStories = [
        {
          id: 'story-1',
          title: 'Culture Story',
          slug: 'story-1',
          excerpt: 'Excerpt',
          coverImage: '',
          author: { displayName: 'Author', username: 'author' },
          category: { name: 'Culture' },
          viewCount: 100,
          publishedAt: mockDate,
          createdAt: mockDate,
          status: 'published',
          content: 'Content',
        },
      ];
      const mockMusic = [
        {
          id: 'music-1',
          title: 'Music Item',
          slug: 'music-1',
          description: 'Music desc',
          coverImage: '',
          artistName: 'Artist',
          genre: 'Music',
          type: 'single',
          playCount: 50,
          publishedAt: mockDate,
          createdAt: mockDate,
          status: 'published',
        },
      ];

      (prismaService.cultureStory.findMany as jest.Mock).mockResolvedValue(mockStories);
      (prismaService.event.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue(mockMusic);
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFeed(1, 20, 'Culture');

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBe(1);
      expect(result.data?.items[0].type).toBe('story');
    });

    it('should paginate feed results', async () => {
      const mockDate = new Date('2024-01-01');
      const mockItems = [];
      for (let i = 1; i <= 30; i++) {
        mockItems.push({
          id: `story-${i}`,
          title: `Story ${i}`,
          slug: `story-${i}`,
          excerpt: `Excerpt ${i}`,
          coverImage: '',
          author: { displayName: 'Author', username: 'author' },
          category: { name: 'General' },
          viewCount: 100,
          publishedAt: mockDate,
          createdAt: mockDate,
          status: 'published',
          content: 'Content',
        });
      }

      (prismaService.cultureStory.findMany as jest.Mock).mockResolvedValue(mockItems);
      (prismaService.event.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFeed(2, 10);

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBe(10);
      expect(result.data?.page).toBe(2);
      expect(result.data?.totalPages).toBe(3);
    });

    it('should return empty feed when no content exists', async () => {
      (prismaService.cultureStory.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.event.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFeed();

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBe(0);
      expect(result.data?.total).toBe(0);
    });
  });

  describe('getTrending', () => {
    it('should return trending items sorted by view count', async () => {
      const mockDate = new Date('2024-01-01');
      const mockStories = [
        {
          id: 'story-1',
          title: 'Low Views',
          slug: 'story-1',
          excerpt: 'Excerpt',
          coverImage: '',
          author: { displayName: 'Author', username: 'author' },
          category: { name: 'General' },
          viewCount: 100,
          publishedAt: mockDate,
          createdAt: mockDate,
          status: 'published',
          content: 'Content',
        },
        {
          id: 'story-2',
          title: 'High Views',
          slug: 'story-2',
          excerpt: 'Excerpt',
          coverImage: '',
          author: { displayName: 'Author', username: 'author' },
          category: { name: 'General' },
          viewCount: 1000,
          publishedAt: mockDate,
          createdAt: mockDate,
          status: 'published',
          content: 'Content',
        },
        {
          id: 'story-3',
          title: 'Medium Views',
          slug: 'story-3',
          excerpt: 'Excerpt',
          coverImage: '',
          author: { displayName: 'Author', username: 'author' },
          category: { name: 'General' },
          viewCount: 500,
          publishedAt: mockDate,
          createdAt: mockDate,
          status: 'published',
          content: 'Content',
        },
      ];

      (prismaService.cultureStory.findMany as jest.Mock).mockResolvedValue(mockStories);
      (prismaService.event.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getTrending(2);

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBe(2);
      expect(result.data?.items[0].title).toBe('High Views');
      expect(result.data?.items[1].title).toBe('Medium Views');
    });

    it('should handle empty feed gracefully', async () => {
      (prismaService.cultureStory.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.event.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.cityGuideEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.musicEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.celebrityEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.nightlifeEntry.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.influencerEntry.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getTrending();

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBe(0);
    });
  });
});
