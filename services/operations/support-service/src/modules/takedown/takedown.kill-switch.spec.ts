import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { TakedownController } from './takedown.controller.js';
import { TakedownService } from './takedown.service.js';
import { FeatureFlagGuard, FeatureFlagService, supportFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  AdminGuard: jest.fn(),
  ServiceAuthGuard: jest.fn(),
}));

import { AdminGuard } from '@azeebo/security';
import { ServiceAuthGuard } from '@azeebo/security';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-123', role: 'user' };
    return true;
  }
}
class MockAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'admin-1', role: 'admin' };
    return true;
  }
}

const mockTakedownService = {
  createTakedown: jest.fn().mockResolvedValue({ id: 'tk-1' }),
  getTakedownById: jest.fn().mockResolvedValue({ id: 'tk-1' }),
  getPendingTakedowns: jest.fn().mockResolvedValue({ takedowns: [], meta: {} }),
  getTakedownsByContent: jest.fn().mockResolvedValue([]),
  decideTakedown: jest.fn().mockResolvedValue({ id: 'tk-1' }),
};

/**
 * Kill-switch simulation: boots the takedown controller with the REAL
 * FeatureFlagGuard so @FeatureFlag(supportFlags.takedownsAuto) gates the
 * whole automated DMCA pipeline. With the flag off, every takedown route
 * must 403 before the service runs.
 */
describe('Support takedown kill-switch (support_takedowns_auto)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all support flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TakedownController],
      providers: [
        { provide: TakedownService, useValue: mockTakedownService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(ServiceAuthGuard)
      .useClass(MockAuthGuard)
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);
  });

  it('403s POST /support/takedowns when support_takedowns_auto is off', async () => {
    const res = await request(baseUrl)
      .post('/support/takedowns')
      .set('Authorization', 'Bearer test')
      .send({ ticketId: 't1', contentId: 'c1', reason: 'DMCA' });

    expect(res.status).toBe(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(supportFlags.takedownsAuto);
    expect(mockTakedownService.createTakedown).not.toHaveBeenCalled();
  });

  it('passes the routes through when support_takedowns_auto is on', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    const res = await request(baseUrl)
      .post('/support/takedowns')
      .set('Authorization', 'Bearer test')
      .send({ ticketId: 't1', contentId: 'c1', reason: 'DMCA' });

    expect(res.status).not.toBe(403);
    expect(mockTakedownService.createTakedown).toHaveBeenCalled();
  });
});
