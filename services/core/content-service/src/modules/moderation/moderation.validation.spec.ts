import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Reflector } from '@nestjs/core';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { userId: 'user-1', role: 'admin' };
    return true;
  }
}

describe('Moderation Validation Tests', () => {
  let app: INestApplication;

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

  beforeEach(async () => {
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
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(RolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/moderation/cases - Validation', () => {
    it('should create a case with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/cases')
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
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/cases')
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

  describe('PATCH /v1/moderation/cases/:id/resolve - Validation', () => {
    it('should return 400 for missing resolution', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/moderation/cases/case-1/resolve')
        .send({ notes: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should accept any resolution value', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/moderation/cases/case-1/resolve')
        .send({ resolution: 'invalid', notes: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });

    it('should resolve a case with valid data', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/moderation/cases/case-1/resolve')
        .send({ resolution: 'resolved', notes: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /v1/moderation/scan/:contentId - Validation', () => {
    it('should scan content with valid type', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/scan/content-1')
        .send({ type: 'nsfw' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(201);
    });

    it('should return 404 for empty contentId', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/scan/')
        .send({ type: 'nsfw' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });
});
