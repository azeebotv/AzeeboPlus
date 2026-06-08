import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

class MockAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}

class MockRolesGuard implements CanActivate {
  canActivate(_context: ExecutionContext) {
    return true;
  }
}

describe('Moderation Validation Tests', () => {
  let app: INestApplication;

  const mockModerationService = {
    scanContent: jest.fn().mockResolvedValue({ success: true }),
    assessContentRisk: jest.fn().mockResolvedValue({ success: true }),
    getContentScans: jest.fn().mockResolvedValue({ success: true }),
    createModerationCase: jest.fn().mockResolvedValue({ success: true }),
    getCases: jest.fn().mockResolvedValue({ success: true }),
    getCase: jest.fn().mockResolvedValue({ success: true }),
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
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .overrideGuard(MockRolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/moderation/cases - Validation', () => {
    it('should return 400 for missing contentId', async () => {
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

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid contentId format', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/cases')
        .send({
          contentId: '',
          type: 'content',
          severity: 'medium',
          priority: 'high',
          policyCategory: 'nsfw',
          description: 'Inappropriate content',
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid type', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/cases')
        .send({
          contentId: 'content-1',
          type: 'invalid_type',
          severity: 'medium',
          priority: 'high',
          policyCategory: 'nsfw',
          description: 'Inappropriate content',
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid severity', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/cases')
        .send({
          contentId: 'content-1',
          type: 'content',
          severity: 'invalid_severity',
          priority: 'high',
          policyCategory: 'nsfw',
          description: 'Inappropriate content',
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing description', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/cases')
        .send({
          contentId: 'content-1',
          type: 'content',
          severity: 'medium',
          priority: 'high',
          policyCategory: 'nsfw',
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty description', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/cases')
        .send({
          contentId: 'content-1',
          type: 'content',
          severity: 'medium',
          priority: 'high',
          policyCategory: 'nsfw',
          description: '',
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should return 400 for description too long', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/cases')
        .send({
          contentId: 'content-1',
          type: 'content',
          severity: 'medium',
          priority: 'high',
          policyCategory: 'nsfw',
          description: 'a'.repeat(5001),
        })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /v1/moderation/cases/:id/resolve - Validation', () => {
    it('should return 400 for missing decision', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/moderation/cases/case-1/resolve')
        .send({ note: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid decision value', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/moderation/cases/case-1/resolve')
        .send({ decision: 'invalid', note: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should return 400 for note too long', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/moderation/cases/case-1/resolve')
        .send({ decision: 'approve', note: 'a'.repeat(2001) })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/moderation/scan/:contentId - Validation', () => {
    it('should return 400 for invalid scan type', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/scan/content-1')
        .send({ type: 'invalid_type' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty contentId', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/moderation/scan/')
        .send({ type: 'nsfw' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });
});