import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ContentService } from '../src/modules/content/content.service';
import { AccessControlService } from '../src/modules/content/access-control.service';
import { PrismaService } from '../src/modules/database/prisma.service';

const AuthGuardPass: CanActivate = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = { sub: 'usr_creator01', role: 'creator', email: 'creator@example.com' };
    return true;
  },
};

describe('Content E2E', () => {
  let app: INestApplication;

  const mockContentService = {
    listContent: jest.fn(),
    getContent: jest.fn(),
    createContent: jest.fn(),
    searchContent: jest.fn(),
    getHomeFeed: jest.fn(),
    getFeatured: jest.fn(),
    getTrending: jest.fn(),
  };

  const mockAccessControlService = {
    checkContentAccess: jest.fn(),
    getAccessibleContent: jest.fn(),
  };

  const mockPrismaService = {
    contentItem: { findUnique: jest.fn(), update: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ContentService)
      .useValue(mockContentService)
      .overrideProvider(AccessControlService)
      .useValue(mockAccessControlService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalGuards(AuthGuardPass);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /v1/content ─────────────────────────────────────────────────

  describe('GET /v1/content', () => {
    it('should list content with default pagination', async () => {
      const listResult = {
        success: true,
        data: {
          items: [
            {
              id: 'content_001',
              title: 'First Episode',
              description: 'Pilot episode',
              status: 'published',
              creatorId: 'usr_creator01',
              universeId: 'univ_001',
              createdAt: '2026-01-15T10:00:00.000Z',
              universe: { id: 'univ_001', name: 'Reality' },
            },
            {
              id: 'content_002',
              title: 'Second Episode',
              description: 'Episode two',
              status: 'published',
              creatorId: 'usr_creator02',
              universeId: 'univ_001',
              createdAt: '2026-01-22T10:00:00.000Z',
              universe: { id: 'univ_001', name: 'Reality' },
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
        },
      };

      mockContentService.listContent.mockResolvedValue(listResult);

      const res = await request(app.getHttpServer())
        .get('/v1/content')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items[0].title).toBe('First Episode');
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.total).toBe(2);
      expect(mockContentService.listContent).toHaveBeenCalledWith(
        expect.objectContaining({}),
        undefined,
        undefined,
      );
    });

    it('should filter content by universe', async () => {
      mockContentService.listContent.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      });

      await request(app.getHttpServer())
        .get('/v1/content')
        .query({ universe: 'univ_001' })
        .expect(200);

      expect(mockContentService.listContent).toHaveBeenCalledWith(
        expect.objectContaining({ universe: 'univ_001' }),
        undefined,
        undefined,
      );
    });

    it('should support pagination parameters', async () => {
      mockContentService.listContent.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { page: 2, limit: 10, total: 50, totalPages: 5 } },
      });

      const res = await request(app.getHttpServer())
        .get('/v1/content')
        .query({ page: 2, limit: 10 })
        .expect(200);

      expect(res.body.data.pagination.page).toBe(2);
      expect(res.body.data.pagination.limit).toBe(10);
    });

    it('should return empty list when no content matches', async () => {
      mockContentService.listContent.mockResolvedValue({
        success: true,
        data: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      });

      const res = await request(app.getHttpServer())
        .get('/v1/content')
        .query({ universe: 'nonexistent_universe' })
        .expect(200);

      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.pagination.total).toBe(0);
    });
  });

  // ─── GET /v1/content/:id ─────────────────────────────────────────────

  describe('GET /v1/content/:id', () => {
    it('should return content by ID', async () => {
      const contentData = {
        id: 'content_001',
        title: 'First Episode',
        description: 'Pilot episode of the series',
        thumbnail: 'https://cdn.azeebo.com/thumbs/content_001.jpg',
        mediaUrl: 'https://cdn.azeebo.com/media/content_001.mp4',
        status: 'published',
        creatorId: 'usr_creator01',
        universeId: 'univ_001',
        viewCount: 1500,
        createdAt: '2026-01-15T10:00:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z',
        universe: { id: 'univ_001', name: 'Reality', slug: 'reality' },
        mediaAsset: null,
        categories: [],
        tags: [],
      };

      mockContentService.getContent.mockResolvedValue({
        success: true,
        data: contentData,
      });
      mockPrismaService.contentItem.update.mockResolvedValue({});

      const res = await request(app.getHttpServer())
        .get('/v1/content/content_001')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('content_001');
      expect(res.body.data.title).toBe('First Episode');
      expect(res.body.data.universe.name).toBe('Reality');
    });

    it('should return 404 for non-existent content', async () => {
      mockContentService.getContent.mockRejectedValue({
        status: 404,
        message: 'Content not found',
      });

      const res = await request(app.getHttpServer())
        .get('/v1/content/nonexistent_id')
        .expect(404);

      expect(res.body.message).toBe('Content not found');
    });
  });

  // ─── POST /v1/content ────────────────────────────────────────────────

  describe('POST /v1/content', () => {
    it('should create content successfully', async () => {
      const dto = {
        title: 'My New Show',
        description: 'A brand new show',
        thumbnail: 'https://cdn.azeebo.com/thumbs/new_show.jpg',
        universeId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const createdContent = {
        id: 'content_new_001',
        ...dto,
        creatorId: 'usr_creator01',
        status: 'draft',
        createdAt: '2026-07-07T10:00:00.000Z',
        updatedAt: '2026-07-07T10:00:00.000Z',
        universe: { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Reality' },
      };

      mockContentService.createContent.mockResolvedValue({
        success: true,
        data: createdContent,
      });

      const res = await request(app.getHttpServer())
        .post('/v1/content')
        .send(dto)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('My New Show');
      expect(res.body.data.creatorId).toBe('usr_creator01');
      expect(mockContentService.createContent).toHaveBeenCalledWith('usr_creator01', dto);
    });

    it('should create content with all optional fields', async () => {
      const dto = {
        title: 'Full Content',
        description: 'Complete content with all fields',
        thumbnail: 'https://cdn.azeebo.com/thumbs/full.jpg',
        mediaUrl: 'https://cdn.azeebo.com/media/full.mp4',
        universeId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'published' as const,
        metadata: { genre: 'comedy', duration: 120 },
      };

      mockContentService.createContent.mockResolvedValue({
        success: true,
        data: { id: 'content_full_001', ...dto, creatorId: 'usr_creator01' },
      });

      const res = await request(app.getHttpServer())
        .post('/v1/content')
        .send(dto)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Full Content');
    });

    it('should reject creation with missing title', async () => {
      const dto = {
        thumbnail: 'https://cdn.azeebo.com/thumbs/no_title.jpg',
        universeId: '550e8400-e29b-41d4-a716-446655440000',
      };

      await request(app.getHttpServer())
        .post('/v1/content')
        .send(dto)
        .expect(400);

      expect(mockContentService.createContent).not.toHaveBeenCalled();
    });

    it('should reject creation with missing thumbnail', async () => {
      const dto = {
        title: 'No Thumbnail',
        universeId: '550e8400-e29b-41d4-a716-446655440000',
      };

      await request(app.getHttpServer())
        .post('/v1/content')
        .send(dto)
        .expect(400);

      expect(mockContentService.createContent).not.toHaveBeenCalled();
    });

    it('should reject creation with invalid universeId format', async () => {
      const dto = {
        title: 'Bad UUID',
        thumbnail: 'https://cdn.azeebo.com/thumbs/bad.jpg',
        universeId: 'not-a-uuid',
      };

      await request(app.getHttpServer())
        .post('/v1/content')
        .send(dto)
        .expect(400);

      expect(mockContentService.createContent).not.toHaveBeenCalled();
    });

    it('should reject creation with empty body', async () => {
      await request(app.getHttpServer())
        .post('/v1/content')
        .send({})
        .expect(400);

      expect(mockContentService.createContent).not.toHaveBeenCalled();
    });

    it('should reject creation with invalid status enum value', async () => {
      const dto = {
        title: 'Bad Status',
        thumbnail: 'https://cdn.azeebo.com/thumbs/bad.jpg',
        universeId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'invalid_status',
      };

      await request(app.getHttpServer())
        .post('/v1/content')
        .send(dto)
        .expect(400);

      expect(mockContentService.createContent).not.toHaveBeenCalled();
    });
  });
});
