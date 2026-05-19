import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

class MockRolesGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const userRole = req.user?.role;
    if (!userRole) return false;
    if (userRole === 'admin') return true;
    return false;
  }
}

describe('Moderation Authorization Tests', () => {
  let app: INestApplication;
  let mockModerationService: Partial<ModerationService>;

  beforeEach(async () => {
    mockModerationService = {
      scanContent: jest.fn().mockResolvedValue({ success: true, data: { contentId: 'content-1', status: 'scanning' } }),
      assessContentRisk: jest.fn().mockResolvedValue({ success: true, data: { riskScore: 0.2 } }),
      getContentScans: jest.fn().mockResolvedValue({ success: true, data: [] }),
      createModerationCase: jest.fn().mockResolvedValue({ success: true, data: { caseId: 'case-1' } }),
      getCases: jest.fn().mockResolvedValue({ success: true, data: [], pagination: {} }),
      getCase: jest.fn().mockResolvedValue({ success: true, data: { id: 'case-1' } }),
      resolveCase: jest.fn().mockResolvedValue({ success: true, data: { caseId: 'case-1', status: 'resolved' } }),
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
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: jest.fn((context) => {
          const req = context.switchToHttp().getRequest();
          return !!req.user;
        }),
      })
      .overrideGuard(MockRolesGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          const req = context.switchToHttp().getRequest();
          const userRole = req.user?.role;
          if (!userRole) return false;
          if (userRole === 'admin') return true;
          return false;
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/moderation/cases - Moderator/Admin Only', () => {
    it('should allow admin to create moderation case', async () => {
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
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(201);
    });

    it('should allow moderator to create moderation case', async () => {
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
        .useValue({
          canActivate: jest.fn(() => true),
        })
        .overrideGuard(MockRolesGuard)
        .useValue({
          canActivate: jest.fn((context) => {
            const req = context.switchToHttp().getRequest();
            const userRole = req.user?.role;
            return userRole === 'moderator' || userRole === 'admin';
          }),
        })
        .compile();

      const modApp = moduleFixture.createNestApplication();
      await modApp.init();

      const response = await request(modApp.getHttpServer())
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
      await modApp.close();
    });

    it('should deny user access to create moderation case', async () => {
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

      expect(response.status).toBe(403);
    });
  });

  describe('GET /v1/moderation/cases - Moderator/Admin Only', () => {
    it('should allow admin to list moderation cases', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/moderation/cases')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
    });

    it('should deny user access to list moderation cases', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/moderation/cases')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /v1/moderation/cases/:id/resolve - Moderator/Admin Only', () => {
    it('should allow admin to resolve moderation case', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/moderation/cases/case-1/resolve')
        .send({ decision: 'approve', note: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Role', 'admin');

      expect(response.status).toBe(200);
    });

    it('should deny creator access to resolve moderation case', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/moderation/cases/case-1/resolve')
        .send({ decision: 'approve', note: 'Content is appropriate' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
    });
  });
});