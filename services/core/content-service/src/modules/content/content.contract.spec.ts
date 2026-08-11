/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ContentModule } from './content.module.js';
import { ContentRepository } from './content.repository.js';
import { PrismaService } from '../database/prisma.service.js';
import { RedisService } from '../../cache/redis.service.js';
import { MediaService } from '../media/media.service.js';
import { TranscodingService } from '../media/transcoding.service.js';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, AdminGuard } from '@azeebo/security';
import { CacheInterceptor } from '../../cache/index.js';
import { ConfigModule } from '@nestjs/config';

jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    disconnect: jest.fn(),
  }));
  return { Redis };
});

import { FeatureFlagService } from '@azeebo/feature-flags';

jest.mock('@azeebo/feature-flags', () => {
  const svc = {
    getFlag: jest.fn().mockResolvedValue(false),
    setFlag: jest.fn().mockResolvedValue(undefined),
    getAllFlags: jest.fn().mockResolvedValue([]),
    isEnabled: jest.fn().mockResolvedValue(false),
  };
  class MockFeatureFlagService {}
  const mockProvider = { provide: MockFeatureFlagService, useValue: svc };
  class MockFeatureFlagModule {
    static register() {
      return {
        module: MockFeatureFlagModule,
        providers: [mockProvider],
        exports: [MockFeatureFlagService],
      };
    }
  }
  return {
    FeatureFlagModule: MockFeatureFlagModule,
    FeatureFlagService: MockFeatureFlagService,
    FeatureFlagGuard: class {},
    contentFlags: {
      moderationEnabled: 'content_moderation_enabled',
      transcodingNew: 'content_transcoding_new',
      aiTags: 'content_ai_tags',
      clipIngestion: 'content_clip_ingestion',
      commentsV2: 'content_comments_v2',
      windowingEnabled: 'content_windowing_enabled',
      premiumGate: 'content_premium_gate',
      recommendedRail: 'content_recommended_rail',
    },
  };
});

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'user-123', sub: 'user-123', role: 'admin' };
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

describe('Content Controller Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), ContentModule],
    })
      .overrideProvider(FeatureFlagService)
      .useValue({ isEnabled: jest.fn().mockResolvedValue(false) })
      .overrideProvider(PrismaService)
      .useValue({
        contentItem: {
          findMany: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          count: jest.fn(),
        },
        comment: {
          findMany: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
        },
        watchHistory: {
          findMany: jest.fn(),
        },
      })
      .overrideProvider(ContentRepository)
      .useValue({
        findAll: jest.fn().mockResolvedValue({
          data: [{ id: 'content-1', title: 'Test Content', universe: 'reality', type: 'video' }],
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        }),
        findById: jest.fn().mockResolvedValue({
          id: 'content-1',
          title: 'Test Content',
          universe: { id: 'universe-1', name: 'Reality' },
          mediaAsset: { originalUrl: 'https://example.com/video.mp4' },
          categories: [],
          tags: [],
          creatorId: 'user-123',
          userId: 'user-123',
          universeId: 'universe-1',
          status: 'published',
          viewCount: 100,
        }),
        create: jest.fn().mockResolvedValue({
          id: 'content-1',
          title: 'Test Content',
          universe: { id: 'universe-1', name: 'Reality' },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'content-1',
          title: 'Updated Content',
          universe: { id: 'universe-1', name: 'Reality' },
        }),
        delete: jest.fn().mockResolvedValue(1),
        getComments: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'comment-1',
              contentId: 'content-1',
              userId: 'user-123',
              text: 'Great content!',
              createdAt: new Date(),
            },
          ],
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        }),
        addComment: jest.fn().mockResolvedValue({
          id: 'comment-2',
          contentId: 'content-1',
          userId: 'user-123',
          text: 'New comment',
          createdAt: new Date(),
        }),
        getAnalytics: jest.fn().mockResolvedValue({
          contentId: 'content-1',
          viewCount: 1000,
          likeCount: 50,
          commentCount: 10,
          watchTime: 3600,
        }),
        search: jest.fn().mockResolvedValue({
          data: [{ id: 'content-1', title: 'Test Content', universe: 'reality', type: 'video' }],
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        }),
      })
      .overrideProvider(MediaService)
      .useValue({
        getMediaUrl: jest.fn().mockResolvedValue('https://example.com/media.jpg'),
        generateThumbnail: jest.fn().mockResolvedValue('https://example.com/thumb.jpg'),
      })
      .overrideProvider(TranscodingService)
      .useValue({
        transcode: jest.fn().mockResolvedValue({ id: 'transcode-1', status: 'completed' }),
        startTranscodingJob: jest.fn().mockResolvedValue({ jobId: 'job-1', status: 'completed' }),
        getTranscodingJobStatus: jest.fn().mockResolvedValue({ status: 'completed' }),
        getTranscodedMediaUrl: jest.fn().mockResolvedValue('https://example.com/transcoded.mp4'),
      })
      .overrideProvider(RedisService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        del: jest.fn().mockResolvedValue(undefined),
        delPattern: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider('CacheService')
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(0),
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
        req.user = { id: 'user-123', sub: 'user-123', role: 'admin' };
      }
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /content', () => {
    it('should list content with filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/content')
        .query({ universe: 'reality' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe('GET /content/:id', () => {
    it('should get content by ID', async () => {
      const response = await request(app.getHttpServer()).get('/content/content-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'content-1',
          title: 'Test Content',
        }),
      });
    });
  });

  describe('POST /content', () => {
    it('should create content', async () => {
      const response = await request(app.getHttpServer()).post('/content').send({
        title: 'New Content',
        description: 'Test description',
        type: 'video',
        universeId: 'universe-1',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          title: 'Test Content',
        }),
      });
    });
  });

  describe('PATCH /content/:id', () => {
    it('should update content', async () => {
      const response = await request(app.getHttpServer())
        .patch('/content/550e8400-e29b-41d4-a716-446655440000')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          title: 'Updated Content',
        }),
      });
    });
  });

  describe('DELETE /content/:id', () => {
    it('should delete content', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/content/550e8400-e29b-41d4-a716-446655440000'
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe('GET /content/:id/comments', () => {
    it('should get content comments', async () => {
      const response = await request(app.getHttpServer()).get(
        '/content/550e8400-e29b-41d4-a716-446655440000/comments'
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array),
      });
    });
  });

  describe('POST /content/:id/comments', () => {
    it('should add comment', async () => {
      const response = await request(app.getHttpServer())
        .post('/content/550e8400-e29b-41d4-a716-446655440000/comments')
        .send({ text: 'New comment' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          text: 'New comment',
        }),
      });
    });
  });

  describe('GET /content/:id/analytics', () => {
    it('should get content analytics', async () => {
      const response = await request(app.getHttpServer()).get('/content/content-1/analytics');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          viewCount: 1000,
          likeCount: 50,
        }),
      });
    });
  });
});
