import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Reflector } from '@nestjs/core';

class MockRolesGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}

describe('Moderation Validation Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  const mockModerationService = {
    scanContent: jest.fn().mockResolvedValue({ success: true }),
    getRiskAssessment: jest.fn().mockResolvedValue({ success: true }),
    getContentScans: jest.fn().mockResolvedValue({ success: true }),
    createCase: jest.fn().mockResolvedValue({ id: 'case-1' }),
    getCases: jest.fn().mockResolvedValue({ success: true }),
    getCaseById: jest.fn().mockResolvedValue({ success: true }),
    resolveCase: jest.fn().mockResolvedValue({ success: true }),
    assignCase: jest.fn().mockResolvedValue({ success: true }),
    getModerationStats: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeAll(async () => {
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
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    // Mock ServiceAuthGuard behavior
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      if (!req.user) {
        req.user = { id: 'user-1', sub: 'user-1', role: 'admin' };
      }
      next();
    });
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

  describe('POST /moderation/cases - Validation', () => {
    it('should create a case with valid data', async () => {
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

      expect(response.status).toBe(201);
    });

    it('should create a case even without optional fields', async () => {
      const response = await request(baseUrl)
        .post('/moderation/cases')
        .send({
          type: 'content',
          severity: 'medium',
          priority: 'high',
          policyCategory: 'nsfw',
          description: 'Inappropriate content',
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(201);
    });
  });

  describe('PATCH /moderation/cases/:id/resolve - Validation', () => {
    it('should return 400 for missing resolution', async () => {
      const response = await request(baseUrl)
        .patch('/moderation/cases/case-1/resolve')
        .send({ notes: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should accept any resolution value', async () => {
      const response = await request(baseUrl)
        .patch('/moderation/cases/case-1/resolve')
        .send({ resolution: 'invalid', notes: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });

    it('should resolve a case with valid data', async () => {
      const response = await request(baseUrl)
        .patch('/moderation/cases/case-1/resolve')
        .send({ resolution: 'resolved', notes: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /moderation/scan/:contentId - Validation', () => {
    it('should scan content with valid type', async () => {
      const response = await request(baseUrl)
        .post('/moderation/scan/content-1')
        .send({ type: 'nsfw' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(201);
    });

    it('should return 404 for empty contentId', async () => {
      const response = await request(baseUrl)
        .post('/moderation/scan/')
        .send({ type: 'nsfw' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });
});
