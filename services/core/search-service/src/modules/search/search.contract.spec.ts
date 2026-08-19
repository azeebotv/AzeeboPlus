import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { RateLimitGuard, ServiceAuthGuard, AdminGuard } from '@azeebo/security';

describe('Search Controller Contract Tests', () => {
  let app: INestApplication;
  let baseUrl: string;
  let searchService: jest.Mocked<SearchService>;

  beforeAll(async () => {
    searchService = {
      search: jest.fn(),
      searchWithFacets: jest.fn(),
      getSuggestions: jest.fn(),
      getTrending: jest.fn(),
      getFacets: jest.fn(),
      logSearch: jest.fn(),
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: searchService,
        },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ServiceAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /search', () => {
    it('should search content', async () => {
      searchService.search.mockResolvedValue({
        success: true,
        data: {
          query: 'test',
          results: {
            content: [
              {
                id: 'content-1',
                title: 'Test Content',
                description: 'Test description',
                status: 'published',
                viewCount: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
                categories: [],
              },
            ],
            creators: [],
            universes: [],
          },
          total: 1,
        },
      });

      const response = await request(baseUrl).get('/search?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.results).toBeDefined();
      expect(response.body.data.results.content).toBeInstanceOf(Array);
    });

    it('should return validation error for missing query', async () => {
      searchService.search.mockRejectedValue(
        new BadRequestException('Search query must be at least 2 characters')
      );

      const response = await request(baseUrl).get('/search');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /search/suggestions', () => {
    it('should return autocomplete suggestions', async () => {
      searchService.getSuggestions.mockResolvedValue({
        success: true,
        data: {
          suggestions: ['test content', 'test creator', 'test video'],
        },
      });

      const response = await request(baseUrl).get('/search/suggestions?q=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toBeInstanceOf(Array);
    });
  });

  describe('GET /search/trending', () => {
    it('should return trending searches', async () => {
      searchService.getTrending.mockResolvedValue({
        success: true,
        data: {
          trending: [
            { query: 'test content', count: 100 },
            { query: 'popular', count: 80 },
          ],
        },
      });

      const response = await request(baseUrl).get('/search/trending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.trending).toBeInstanceOf(Array);
    });
  });

  describe('GET /search/facets', () => {
    it('should return search facets', async () => {
      searchService.getFacets.mockResolvedValue({
        success: true,
        data: {
          facets: {
            universes: [{ id: 'reality', name: 'Reality', count: 10 }],
            categories: [{ id: 'cat1', name: 'Category 1', count: 5 }],
            tags: [{ id: 'tag1', name: 'tag1', count: 3 }],
            contentTypes: [],
            dateRanges: [],
          },
        },
      });

      const response = await request(baseUrl).get('/search/facets');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.facets).toBeDefined();
    });
  });
});
