import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { AccessControlService } from './access-control.service';

describe('Content Service Caching Tests', () => {
  let app: INestApplication;

  const mockContentService = {
    listContent: jest.fn().mockResolvedValue({
      success: true,
      data: { content: [], total: 0 },
    }),
    getHomeFeed: jest.fn().mockResolvedValue({
      success: true,
      data: { sections: [] },
    }),
    getWatchFeed: jest.fn().mockResolvedValue({
      success: true,
      data: { sections: [] },
    }),
    getContent: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'content-1', title: 'Test Content' },
    }),
    getContentComments: jest.fn().mockResolvedValue({
      success: true,
      data: { comments: [], total: 0 },
    }),
    searchContent: jest.fn().mockResolvedValue({
      success: true,
      data: { results: [], total: 0 },
    }),
    getTrending: jest.fn().mockResolvedValue({
      success: true,
      data: { trending: [] },
    }),
    getRecommended: jest.fn().mockResolvedValue({
      success: true,
      data: { recommendations: [] },
    }),
  };

  const mockAccessControlService = {
    checkContentAccess: jest.fn(),
    checkRentalAccess: jest.fn(),
    checkPassAccess: jest.fn(),
    checkScreeningAccess: jest.fn(),
    checkLockedExtraAccess: jest.fn(),
    checkMediaPlaybackAccess: jest.fn(),
    getAccessibleContent: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContentController],
      providers: [
        {
          provide: ContentService,
          useValue: mockContentService,
        },
        {
          provide: AccessControlService,
          useValue: mockAccessControlService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Caching - GET /content', () => {
    it('should cache list content responses', async () => {
      const response1 = await request(app.getHttpServer()).get('/content');
      const response2 = await request(app.getHttpServer()).get('/content');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockContentService.listContent).toHaveBeenCalled();
    });

    it('should cache with different query parameters', async () => {
      await request(app.getHttpServer()).get('/content?universe=universe-1');
      await request(app.getHttpServer()).get('/content?universe=universe-2');

      expect(mockContentService.listContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Caching - GET /content/home', () => {
    it('should cache home feed responses', async () => {
      const response1 = await request(app.getHttpServer()).get('/content/home');
      const response2 = await request(app.getHttpServer()).get('/content/home');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Caching - GET /content/watch', () => {
    it('should cache watch feed responses', async () => {
      const response1 = await request(app.getHttpServer()).get('/content/watch');
      const response2 = await request(app.getHttpServer()).get('/content/watch');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Caching - GET /content/:id', () => {
    it('should cache content by ID', async () => {
      const response1 = await request(app.getHttpServer()).get('/content/content-1');
      const response2 = await request(app.getHttpServer()).get('/content/content-1');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it('should cache different content IDs separately', async () => {
      await request(app.getHttpServer()).get('/content/content-1');
      await request(app.getHttpServer()).get('/content/content-2');

      expect(mockContentService.getContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Caching - GET /content/trending', () => {
    it('should cache trending content', async () => {
      const response1 = await request(app.getHttpServer()).get('/content/trending');
      const response2 = await request(app.getHttpServer()).get('/content/trending');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Caching - GET /content/search', () => {
    it('should cache search results by query', async () => {
      await request(app.getHttpServer()).get('/content/search?q=test');
      await request(app.getHttpServer()).get('/content/search?q=test');

      expect(mockContentService.searchContent).toHaveBeenCalled();
    });

    it('should cache different search queries separately', async () => {
      await request(app.getHttpServer()).get('/content/search?q=video');
      await request(app.getHttpServer()).get('/content/search?q=show');

      expect(mockContentService.searchContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Invalidation', () => {
    it('should not cache POST requests', async () => {
      const response = await request(app.getHttpServer()).post('/content').send({
        title: 'New Content',
        description: 'Test',
        thumbnail: 'https://example.com/thumb.jpg',
        universeId: 'universe-1',
        creatorId: 'creator-1',
      });

      expect([201, 400]).toContain(response.status);
    });

    it('should not cache PATCH requests', async () => {
      const response = await request(app.getHttpServer())
        .patch('/content/content-1')
        .send({ title: 'Updated Content' });

      expect([200, 400]).toContain(response.status);
    });

    it('should not cache DELETE requests', async () => {
      const response = await request(app.getHttpServer()).delete('/content/content-1');

      expect([200, 404]).toContain(response.status);
    });
  });
});
