import { Test } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { RolesGuard } from './roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { APP_GUARD } from '@nestjs/core';
import { Controller, Get } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

jest.setTimeout(30000);

@Controller('admin')
class AdminController {
  @Get('dashboard')
  @Roles('admin')
  getAdminDashboard(): { success: boolean; data: string } {
    return { success: true, data: 'admin dashboard' };
  }

  @Get('users')
  @Roles('admin')
  getAdminUsers(): { success: boolean; data: string } {
    return { success: true, data: 'admin users' };
  }
}

@Controller('creator')
class CreatorController {
  @Get('dashboard')
  @Roles('creator')
  getCreatorDashboard(): { success: boolean; data: string } {
    return { success: true, data: 'creator dashboard' };
  }

  @Get('content')
  @Roles('creator')
  getCreatorContent(): { success: boolean; data: string } {
    return { success: true, data: 'creator content' };
  }
}

@Controller('moderation')
class ModerationController {
  @Get('reports')
  @Roles('moderator')
  getModerationReports(): { success: boolean; data: string } {
    return { success: true, data: 'moderation reports' };
  }

  @Get('actions')
  @Roles('moderator')
  getModerationActions(): { success: boolean; data: string } {
    return { success: true, data: 'moderation actions' };
  }
}

@Controller('wallet')
class WalletController {
  @Get('audit')
  @Roles('admin')
  getWalletAudit(): { success: boolean; data: string } {
    return { success: true, data: 'wallet audit' };
  }

  @Get('payouts')
  @Roles('admin', 'creator')
  getPayouts(): { success: boolean; data: string } {
    return { success: true, data: 'payouts' };
  }
}

@Controller('content')
class ContentController {
  @Get('manage')
  @Roles('admin', 'creator')
  manageContent(): { success: boolean; data: string } {
    return { success: true, data: 'manage content' };
  }

  @Get('publish')
  @Roles('admin', 'creator')
  publishContent(): { success: boolean; data: string } {
    return { success: true, data: 'publish content' };
  }
}

interface MockUser {
  id: string;
  role: string;
}

type MockRequest = Request & { user?: MockUser };
type MockResponse = Response;
type MockNext = NextFunction;

describe('RolesGuard Integration Tests', () => {
  let app: INestApplication;
  let baseUrl: string;

  // Mutable request context read at request time by the shared middleware —
  // every test runs against ONE bound app (no per-test listen/close churn).
  let currentRole: string;
  let attachUser: boolean;

  const createTestModule = (): ReturnType<typeof Test.createTestingModule> => {
    return Test.createTestingModule({
      controllers: [
        AdminController,
        CreatorController,
        ModerationController,
        WalletController,
        ContentController,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
        {
          provide: 'MOCK_USER_ROLE',
          useValue: 'admin',
        },
      ],
    });
  };

  beforeAll(async () => {
    const moduleFixture = await createTestModule().compile();
    app = moduleFixture.createNestApplication();

    app.use((req: MockRequest, _res: MockResponse, next: MockNext): void => {
      if (attachUser) {
        req.user = { id: 'test-user', role: currentRole };
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

  beforeEach(() => {
    currentRole = 'user';
    attachUser = true;
  });

  describe('Admin Routes - Access Control', () => {
    it('should allow admin access to admin dashboard', async () => {
      currentRole = 'admin';
      const response = await request(baseUrl).get('/admin/dashboard');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should allow admin access to admin users', async () => {
      currentRole = 'admin';
      const response = await request(baseUrl).get('/admin/users');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should deny non-admin access to admin dashboard', async () => {
      currentRole = 'user';
      const response = await request(baseUrl).get('/admin/dashboard');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('Creator Routes - Access Control', () => {
    it('should allow creator access to creator dashboard', async () => {
      currentRole = 'creator';
      const response = await request(baseUrl).get('/creator/dashboard');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should allow creator access to creator content', async () => {
      currentRole = 'creator';
      const response = await request(baseUrl).get('/creator/content');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should deny non-creator access to creator dashboard', async () => {
      currentRole = 'user';
      const response = await request(baseUrl).get('/creator/dashboard');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('Moderation Routes - Access Control', () => {
    it('should allow moderator access to moderation reports', async () => {
      currentRole = 'moderator';
      const response = await request(baseUrl).get('/moderation/reports');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should allow moderator access to moderation actions', async () => {
      currentRole = 'moderator';
      const response = await request(baseUrl).get('/moderation/actions');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should deny non-moderator access to moderation reports', async () => {
      currentRole = 'user';
      const response = await request(baseUrl).get('/moderation/reports');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('Wallet Audit Routes - Access Control', () => {
    it('should allow admin access to wallet audit', async () => {
      currentRole = 'admin';
      const response = await request(baseUrl).get('/wallet/audit');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should deny non-admin access to wallet audit', async () => {
      currentRole = 'user';
      const response = await request(baseUrl).get('/wallet/audit');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('Payout Routes - Access Control', () => {
    it('should allow admin access to payouts', async () => {
      currentRole = 'admin';
      const response = await request(baseUrl).get('/wallet/payouts');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should allow creator access to payouts', async () => {
      currentRole = 'creator';
      const response = await request(baseUrl).get('/wallet/payouts');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should deny user access to payouts', async () => {
      currentRole = 'user';
      const response = await request(baseUrl).get('/wallet/payouts');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('Content Management Routes - Access Control', () => {
    it('should allow admin access to content management', async () => {
      currentRole = 'admin';
      const response = await request(baseUrl).get('/content/manage');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should allow creator access to content management', async () => {
      currentRole = 'creator';
      const response = await request(baseUrl).get('/content/manage');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should allow admin access to content publish', async () => {
      currentRole = 'admin';
      const response = await request(baseUrl).get('/content/publish');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should allow creator access to content publish', async () => {
      currentRole = 'creator';
      const response = await request(baseUrl).get('/content/publish');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it('should deny user access to content management', async () => {
      currentRole = 'user';
      const response = await request(baseUrl).get('/content/manage');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('should deny user access to content publish', async () => {
      currentRole = 'user';
      const response = await request(baseUrl).get('/content/publish');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });

  describe('Edge Cases', () => {
    it('should deny access when user has no role', async () => {
      currentRole = '';
      const response = await request(baseUrl).get('/admin/dashboard');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('should deny access when no user is present', async () => {
      attachUser = false;
      const response = await request(baseUrl).get('/admin/dashboard');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
