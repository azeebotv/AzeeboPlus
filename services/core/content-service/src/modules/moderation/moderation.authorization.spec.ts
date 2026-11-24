import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { RolesGuard } from '@azeebo/security';
import { Reflector } from '@nestjs/core';

describe('Moderation Authorization Tests', () => {
  let app: INestApplication;
  let baseUrl: string;
  let mockModerationService: Record<string, jest.Mock>;

  beforeAll(async () => {
    mockModerationService = {
      scanContent: jest
        .fn()
        .mockResolvedValue({ success: true, data: { contentId: 'content-1', status: 'scanning' } }),
      getRiskAssessment: jest.fn().mockResolvedValue({ success: true, data: { riskScore: 0.2 } }),
      getContentScans: jest.fn().mockResolvedValue({ success: true, data: [] }),
      createCase: jest.fn().mockResolvedValue({ success: true, data: { caseId: 'case-1' } }),
      getCases: jest.fn().mockResolvedValue({ success: true, data: [], pagination: {} }),
      getCaseById: jest.fn().mockResolvedValue({ success: true, data: { id: 'case-1' } }),
      resolveCase: jest
        .fn()
        .mockResolvedValue({ success: true, data: { caseId: 'case-1', status: 'resolved' } }),
      assignCase: jest.fn().mockResolvedValue({ success: true, data: { caseId: 'case-1' } }),
      getModerationStats: jest.fn().mockResolvedValue({ success: true, data: {} }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ModerationController],
      providers: [
        {
          provide: ModerationService,
          useValue: mockModerationService,
        },
        Reflector,
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn((context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const role = req.user?.role;
          if (!role) return false;
          if (role === 'admin' || role === 'moderator') return true;
          return false;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    // Mock ServiceAuthGuard behavior: set req.user from X-User-Role header
    app.use(
      (
        req: { headers: Record<string, string | undefined>; user?: unknown },
        _res: unknown,
        next: () => void
      ) => {
        if (!req.user) {
          const role = req.headers['x-user-role'] || 'user';
          req.user = { id: 'user-1', sub: 'user-1', role };
        }
        next();
      }
    );
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /moderation/cases - Moderator/Admin Only', () => {
    it('should allow admin to create moderation case', async () => {
      const response = await request(baseUrl)
        .post('/moderation/cases')
        .send({
          contentId: 'content-1',
          type: 'content',
          severity: 'medium',
          priority: 'high',
          policyCategory: 'nsfw',
          description: 'Inappropriate content',
        })
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(201);
    });

    it('should allow moderator to create moderation case', async () => {
      const response = await request(baseUrl)
        .post('/moderation/cases')
        .send({
          contentId: 'content-1',
          type: 'content',
          severity: 'medium',
          priority: 'high',
          policyCategory: 'nsfw',
          description: 'Inappropriate content',
        })
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Role', 'moderator');

      expect(response.status).toBe(201);
    });

    it('should deny user access to create moderation case', async () => {
      const response = await request(baseUrl)
        .post('/moderation/cases')
        .send({
          contentId: 'content-1',
          type: 'content',
          severity: 'medium',
          priority: 'high',
          policyCategory: 'nsfw',
          description: 'Inappropriate content',
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /moderation/cases - Moderator/Admin Only', () => {
    it('should allow admin to list moderation cases', async () => {
      const response = await request(baseUrl)
        .get('/moderation/cases')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
    });

    it('should deny user access to list moderation cases', async () => {
      const response = await request(baseUrl)
        .get('/moderation/cases')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /moderation/cases/:id/resolve - Moderator/Admin Only', () => {
    it('should allow admin to resolve moderation case', async () => {
      const response = await request(baseUrl)
        .patch('/moderation/cases/case-1/resolve')
        .send({ resolution: 'resolved', notes: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
    });

    it('should deny creator access to resolve moderation case', async () => {
      const response = await request(baseUrl)
        .patch('/moderation/cases/case-1/resolve')
        .send({ resolution: 'resolved', notes: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });
  });
});
