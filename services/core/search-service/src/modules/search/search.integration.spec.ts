import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../database/prisma.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchRepository } from './search.repository';
import { RateLimitGuard } from '@azeebo/security';

describe('Search Service Integration Tests', () => {
  let app: INestApplication;
  const mockPrismaService = {
    contentItem: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    creatorProfile: {
      findMany: jest.fn(),
    },
    universe: {
      findMany: jest.fn(),
    },
    searchQueryLog: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        SearchService,
        SearchRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /search', () => {
    it('should return search results with content', async () => {
      const mockContent = [
        {
          id: 'content-1',
          title: 'Test Video',
          description: 'A test video description',
          contentType: 'video',
          status: 'published',
          viewCount: 100,
          averageRating: 4.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.contentItem.findMany.mockResolvedValue(mockContent);
      mockPrismaService.contentItem.count.mockResolvedValue(1);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue([]);
      mockPrismaService.universe.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get('/v1/search?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results.content).toHaveLength(1);
      expect(response.body.data.results.content[0].title).toBe('Test Video');
    });

    it('should return empty results for no matches', async () => {
      mockPrismaService.contentItem.findMany.mockResolvedValue([]);
      mockPrismaService.contentItem.count.mockResolvedValue(0);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue([]);
      mockPrismaService.universe.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get('/v1/search?q=nonexistent');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results.content).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });

    it('should apply category filter correctly', async () => {
      const mockContent = [
        {
          id: 'content-2',
          title: 'Filtered Content',
          description: 'Content with category filter',
          contentType: 'video',
          status: 'published',
          viewCount: 50,
          averageRating: 4.0,
          createdAt: new Date(),
          updatedAt: new Date(),
          categories: [{ id: 'cat-1', name: 'Action' }],
        },
      ];

      mockPrismaService.contentItem.findMany.mockResolvedValue(mockContent);
      mockPrismaService.contentItem.count.mockResolvedValue(1);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue([]);
      mockPrismaService.universe.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/v1/search?q=test')
        .query({ categories: 'cat-1' });

      expect(response.status).toBe(200);
      expect(mockPrismaService.contentItem.findMany).toHaveBeenCalled();
    });

    it('should reject queries shorter than 2 characters', async () => {
      const response = await request(app.getHttpServer()).get('/v1/search?q=a');

      expect(response.status).toBe(400);
    });

    it('should sort by newest first by default', async () => {
      mockPrismaService.contentItem.findMany.mockResolvedValue([]);
      mockPrismaService.contentItem.count.mockResolvedValue(0);

      await request(app.getHttpServer()).get('/v1/search?q=test');

      expect(mockPrismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should sort by popularity when requested', async () => {
      mockPrismaService.contentItem.findMany.mockResolvedValue([]);
      mockPrismaService.contentItem.count.mockResolvedValue(0);

      await request(app.getHttpServer()).get('/v1/search?q=test').query({ sort: 'popular' });

      expect(mockPrismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: 'desc' },
        })
      );
    });

    it('should support pagination parameters', async () => {
      const mockContent = [
        {
          id: 'content-1',
          title: 'Page 1 Content',
          description: 'Content on page 1',
          contentType: 'video',
          status: 'published',
          viewCount: 100,
          averageRating: 4.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.contentItem.findMany.mockResolvedValue(mockContent);
      mockPrismaService.contentItem.count.mockResolvedValue(10);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue([]);
      mockPrismaService.universe.findMany.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/v1/search?q=test')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.total).toBe(10);
    });

    it('should use default pagination when not specified', async () => {
      mockPrismaService.contentItem.findMany.mockResolvedValue([]);
      mockPrismaService.contentItem.count.mockResolvedValue(0);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue([]);
      mockPrismaService.universe.findMany.mockResolvedValue([]);

      await request(app.getHttpServer()).get('/v1/search?q=test');

      expect(mockPrismaService.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });
  });

  describe('GET /search/suggestions', () => {
    it('should return autocomplete suggestions', async () => {
      const mockSuggestions = [
        { query: 'test video', count: 10 },
        { query: 'test content', count: 5 },
      ];

      mockPrismaService.searchQueryLog.findMany.mockResolvedValue(mockSuggestions);

      const response = await request(app.getHttpServer()).get('/v1/search/suggestions?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toBeDefined();
    });
  });

  describe('GET /search/trending', () => {
    it('should return trending content', async () => {
      const mockTrending = [
        { query: 'popular video', count: 10000 },
        { query: 'trending show', count: 5000 },
      ];

      mockPrismaService.searchQueryLog.findMany.mockResolvedValue(mockTrending);

      const response = await request(app.getHttpServer()).get('/v1/search/trending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trending).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.contentItem.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app.getHttpServer()).get('/v1/search?q=test');

      expect(response.status).toBe(500);
    });

    it('should handle concurrent requests safely', async () => {
      mockPrismaService.contentItem.findMany.mockResolvedValue([]);
      mockPrismaService.contentItem.count.mockResolvedValue(0);
      mockPrismaService.creatorProfile.findMany.mockResolvedValue([]);
      mockPrismaService.universe.findMany.mockResolvedValue([]);

      const promises = Array(3)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/v1/search?q=test'));

      const results = await Promise.all(promises);

      results.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
