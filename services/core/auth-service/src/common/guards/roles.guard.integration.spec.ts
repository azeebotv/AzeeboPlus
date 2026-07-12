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

function createAuthMiddleware(
  userRole: string
): (req: MockRequest, res: MockResponse, next: MockNext) => void {
  return (req: MockRequest, _res: MockResponse, next: MockNext): void => {
    req.user = { id: 'test-user', role: userRole };
    next();
  };
}

describe('RolesGuard Integration Tests', () => {
  const createTestModule = (userRole: string): ReturnType<typeof Test.createTestingModule> => {
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
          useValue: userRole,
        },
      ],
    });
  };

  const setupApp = async (userRole: string): Promise<INestApplication> => {
    const moduleFixture = await createTestModule(userRole).compile();
    const app = moduleFixture.createNestApplication();

    app.use(createAuthMiddleware(userRole));

    await app.init();
    return app;
  };

  describe('Admin Routes - Access Control', () => {
    it('should allow admin access to admin dashboard', async () => {
      const app = await setupApp('admin');
      const response = await request(app.getHttpServer()).get('/admin/dashboard');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should allow admin access to admin users', async () => {
      const app = await setupApp('admin');
      const response = await request(app.getHttpServer()).get('/admin/users');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should deny non-admin access to admin dashboard', async () => {
      const app = await setupApp('user');
      const response = await request(app.getHttpServer()).get('/admin/dashboard');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      await app.close();
    });
  });

  describe('Creator Routes - Access Control', () => {
    it('should allow creator access to creator dashboard', async () => {
      const app = await setupApp('creator');
      const response = await request(app.getHttpServer()).get('/creator/dashboard');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should allow creator access to creator content', async () => {
      const app = await setupApp('creator');
      const response = await request(app.getHttpServer()).get('/creator/content');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should deny non-creator access to creator dashboard', async () => {
      const app = await setupApp('user');
      const response = await request(app.getHttpServer()).get('/creator/dashboard');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      await app.close();
    });
  });

  describe('Moderation Routes - Access Control', () => {
    it('should allow moderator access to moderation reports', async () => {
      const app = await setupApp('moderator');
      const response = await request(app.getHttpServer()).get('/moderation/reports');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should allow moderator access to moderation actions', async () => {
      const app = await setupApp('moderator');
      const response = await request(app.getHttpServer()).get('/moderation/actions');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should deny non-moderator access to moderation reports', async () => {
      const app = await setupApp('user');
      const response = await request(app.getHttpServer()).get('/moderation/reports');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      await app.close();
    });
  });

  describe('Wallet Audit Routes - Access Control', () => {
    it('should allow admin access to wallet audit', async () => {
      const app = await setupApp('admin');
      const response = await request(app.getHttpServer()).get('/wallet/audit');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should deny non-admin access to wallet audit', async () => {
      const app = await setupApp('user');
      const response = await request(app.getHttpServer()).get('/wallet/audit');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      await app.close();
    });
  });

  describe('Payout Routes - Access Control', () => {
    it('should allow admin access to payouts', async () => {
      const app = await setupApp('admin');
      const response = await request(app.getHttpServer()).get('/wallet/payouts');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should allow creator access to payouts', async () => {
      const app = await setupApp('creator');
      const response = await request(app.getHttpServer()).get('/wallet/payouts');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should deny user access to payouts', async () => {
      const app = await setupApp('user');
      const response = await request(app.getHttpServer()).get('/wallet/payouts');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      await app.close();
    });
  });

  describe('Content Management Routes - Access Control', () => {
    it('should allow admin access to content management', async () => {
      const app = await setupApp('admin');
      const response = await request(app.getHttpServer()).get('/content/manage');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should allow creator access to content management', async () => {
      const app = await setupApp('creator');
      const response = await request(app.getHttpServer()).get('/content/manage');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should allow admin access to content publish', async () => {
      const app = await setupApp('admin');
      const response = await request(app.getHttpServer()).get('/content/publish');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should allow creator access to content publish', async () => {
      const app = await setupApp('creator');
      const response = await request(app.getHttpServer()).get('/content/publish');
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      await app.close();
    });

    it('should deny user access to content management', async () => {
      const app = await setupApp('user');
      const response = await request(app.getHttpServer()).get('/content/manage');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      await app.close();
    });

    it('should deny user access to content publish', async () => {
      const app = await setupApp('user');
      const response = await request(app.getHttpServer()).get('/content/publish');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      await app.close();
    });
  });

  describe('Edge Cases', () => {
    it('should deny access when user has no role', async () => {
      const moduleFixture = await Test.createTestingModule({
        controllers: [AdminController],
        providers: [
          {
            provide: APP_GUARD,
            useClass: RolesGuard,
          },
        ],
      }).compile();

      const app = moduleFixture.createNestApplication();
      app.use((req: MockRequest, _res: MockResponse, next: MockNext) => {
        req.user = { id: 'test-user', role: '' };
        next();
      });
      await app.init();

      const response = await request(app.getHttpServer()).get('/admin/dashboard');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      await app.close();
    });

    it('should deny access when no user is present', async () => {
      const moduleFixture = await Test.createTestingModule({
        controllers: [AdminController],
        providers: [
          {
            provide: APP_GUARD,
            useClass: RolesGuard,
          },
        ],
      }).compile();

      const app = moduleFixture.createNestApplication();
      await app.init();

      const response = await request(app.getHttpServer()).get('/admin/dashboard');
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
      await app.close();
    });
  });
});
