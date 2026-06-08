/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ContentModule } from './content.module';
import { ContentRepository } from './content.repository';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MediaService } from '../media/media.service';
import { TranscodingService } from '../media/transcoding.service';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

class MockAuthGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { sub: 'user-123' };
    return true;
  }
}

describe('Content Controller Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ContentModule],
    })
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
          data: [
            { id: 'content-1', title: 'Test Content', universe: 'reality', type: 'video' },
          ],
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
          data: [
            { id: 'content-1', title: 'Test Content', universe: 'reality', type: 'video' },
          ],
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
      })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
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
        data: expect.any(Array),
        pagination: expect.any(Object),
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
      const response = await request(app.getHttpServer())
        .post('/content')
        .send({
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
        .patch('/content/content-1')
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
      const response = await request(app.getHttpServer()).delete('/content/content-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Object),
      });
    });
  });

  describe('GET /content/:id/comments', () => {
    it('should get content comments', async () => {
      const response = await request(app.getHttpServer()).get('/content/content-1/comments');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array),
        pagination: expect.any(Object),
      });
    });
  });

  describe('POST /content/:id/comments', () => {
    it('should add comment', async () => {
      const response = await request(app.getHttpServer())
        .post('/content/content-1/comments')
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