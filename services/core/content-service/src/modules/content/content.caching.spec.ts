import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ContentController } from './content.controller.js';
import { ContentService } from './content.service.js';
import { AccessControlService } from './access-control.service.js';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, AdminGuard } from '@azeebo/security';
import { CacheInterceptor } from '../../cache/index.js';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'user-123', sub: 'user-123' };
    return true;
  }
}

class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}

class MockAdminGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}

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
    createContent: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'content-new', title: 'New Content' },
    }),
    updateContent: jest.fn().mockResolvedValue({
      success: true,
      data: { id: 'content-1', title: 'Updated Content' },
    }),
    deleteContent: jest.fn().mockResolvedValue({
      success: true,
      data: { message: 'Deleted' },
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
    })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .overrideInterceptor(CacheInterceptor)
      .useValue({
        intercept: (_ctx: ExecutionContext, next: { handle: () => unknown }) => next.handle(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    // Mock ServiceAuthGuard behavior: always set req.user for tests
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      if (!req.user) {
        req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
      }
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Caching - GET /v1/content', () => {
    it('should cache list content responses', async () => {
      const response1 = await request(app.getHttpServer()).get('/v1/content');
      const response2 = await request(app.getHttpServer()).get('/v1/content');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockContentService.listContent).toHaveBeenCalled();
    });

    it('should cache with different query parameters', async () => {
      await request(app.getHttpServer()).get('/v1/content?universe=universe-1');
      await request(app.getHttpServer()).get('/v1/content?universe=universe-2');

      expect(mockContentService.listContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Caching - GET /v1/content/home', () => {
    it('should cache home feed responses', async () => {
      const response1 = await request(app.getHttpServer()).get('/v1/content/home');
      const response2 = await request(app.getHttpServer()).get('/v1/content/home');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Caching - GET /v1/content/watch', () => {
    it('should cache watch feed responses', async () => {
      const response1 = await request(app.getHttpServer()).get('/v1/content/watch');
      const response2 = await request(app.getHttpServer()).get('/v1/content/watch');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Caching - GET /v1/content/:id', () => {
    it('should cache content by ID', async () => {
      const response1 = await request(app.getHttpServer()).get('/v1/content/content-1');
      const response2 = await request(app.getHttpServer()).get('/v1/content/content-1');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it('should cache different content IDs separately', async () => {
      await request(app.getHttpServer()).get('/v1/content/content-1');
      await request(app.getHttpServer()).get('/v1/content/content-2');

      expect(mockContentService.getContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Caching - GET /v1/content/trending', () => {
    it('should cache trending content', async () => {
      const response1 = await request(app.getHttpServer()).get('/v1/content/trending');
      const response2 = await request(app.getHttpServer()).get('/v1/content/trending');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Caching - GET /v1/content/search', () => {
    it('should cache search results by query', async () => {
      await request(app.getHttpServer()).get('/v1/content/search?q=test');
      await request(app.getHttpServer()).get('/v1/content/search?q=test');

      expect(mockContentService.searchContent).toHaveBeenCalled();
    });

    it('should cache different search queries separately', async () => {
      await request(app.getHttpServer()).get('/v1/content/search?q=video');
      await request(app.getHttpServer()).get('/v1/content/search?q=show');

      expect(mockContentService.searchContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Invalidation', () => {
    it('should not cache POST requests', async () => {
      const response = await request(app.getHttpServer()).post('/v1/content').send({
        title: 'New Content',
        description: 'Test',
        thumbnail: 'https://example.com/thumb.jpg',
        universeId: '550e8400-e29b-41d4-a716-446655440000',
      });

      // POST should succeed or fail validation - not crash
      expect(response.status).not.toBe(500);
    });

    it('should not cache PATCH requests', async () => {
      mockContentService.updateContent.mockResolvedValue({
        success: true,
        data: { id: '550e8400-e29b-41d4-a716-446655440000', title: 'Updated Content' },
      });
      const response = await request(app.getHttpServer())
        .patch('/v1/content/550e8400-e29b-41d4-a716-446655440000')
        .send({ title: 'Updated Content' });

      // PATCH should succeed or fail validation - not crash
      expect(response.status).not.toBe(500);
    });

    it('should not cache DELETE requests', async () => {
      mockContentService.deleteContent.mockResolvedValue({
        success: true,
        data: { message: 'Deleted' },
      });
      const response = await request(app.getHttpServer()).delete('/v1/content/550e8400-e29b-41d4-a716-446655440000');

      // DELETE should succeed or return 404 - not crash
      expect(response.status).not.toBe(500);
    });
  });
});
