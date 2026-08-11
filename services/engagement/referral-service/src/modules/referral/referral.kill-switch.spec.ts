import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { ReferralController } from './referral.controller.js';
import { ReferralService } from './referral.service.js';
import { FeatureFlagGuard, FeatureFlagService, referralFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  ServiceAuthGuard: jest.fn(),
}));

import { RateLimitGuard } from '@azeebo/security';

class MockRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
    return true;
  }
}

const mockReferralService = {
  getReferralCode: jest.fn().mockResolvedValue({ success: true, data: {} }),
  generateReferralCode: jest.fn().mockResolvedValue({ success: true, data: {} }),
  applyReferralCode: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getReferrals: jest.fn().mockResolvedValue({ success: true, data: [] }),
  getStats: jest.fn().mockResolvedValue({ success: true, data: {} }),
  completeReferral: jest.fn().mockResolvedValue({ success: true, data: {} }),
};

/**
 * Kill-switch simulation: boots the referral controller with the REAL
 * FeatureFlagGuard so @FeatureFlag(referralFlags.*) actually gate the routes.
 * With referral_program_enabled off, every referral route must 403 before the
 * service runs.
 */
describe('Referral kill-switch (referral_* flags)', () => {
  let app: INestApplication;
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all referral flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReferralController],
      providers: [
        { provide: ReferralService, useValue: mockReferralService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagService.isEnabled.mockResolvedValue(false);
  });

  it('403s GET /referrals/code when referral_program_enabled is off', async () => {
    await request(app.getHttpServer())
      .get('/referrals/code')
      .set('Authorization', 'Bearer test')
      .expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(
      referralFlags.programEnabled
    );
    expect(mockReferralService.getReferralCode).not.toHaveBeenCalled();
  });

  it('403s POST /referrals/apply when referral_program_enabled is off', async () => {
    await request(app.getHttpServer())
      .post('/referrals/apply')
      .set('Authorization', 'Bearer test')
      .send({ code: 'AZB-TEST' })
      .expect(403);
    expect(mockReferralService.applyReferralCode).not.toHaveBeenCalled();
  });

  it('passes the routes through when referral_program_enabled is on', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    const res = await request(app.getHttpServer())
      .get('/referrals/code')
      .set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(mockReferralService.getReferralCode).toHaveBeenCalled();
  });
});
