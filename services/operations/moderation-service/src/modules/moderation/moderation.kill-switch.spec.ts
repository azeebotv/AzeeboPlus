import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { ModerationController } from './moderation.controller.js';
import { ModerationService } from './moderation.service.js';
import { FeatureFlagGuard, FeatureFlagService, moderationFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  AdminGuard: jest.fn(),
}));

import { RateLimitGuard, AdminGuard } from '@azeebo/security';

class MockAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'admin-1', role: 'admin' };
    return true;
  }
}
class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const mockModerationService = {
  scanContentMedia: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getScanById: jest.fn().mockResolvedValue({ success: true, data: {} }),
  reportContent: jest.fn().mockResolvedValue({ success: true, data: {} }),
};

/**
 * Kill-switch simulation: boots the moderation controller with the REAL
 * FeatureFlagGuard so @FeatureFlag(moderationFlags.aiScans) gates the
 * third-party scan endpoint. With moderation_ai_scans off, POST /moderation/scan
 * must 403 before the scanning service runs.
 */
describe('Moderation kill-switch (moderation_* flags)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all moderation flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ModerationController],
      providers: [
        { provide: ModerationService, useValue: mockModerationService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useClass(MockRateLimitGuard)
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

  it('403s POST /moderation/scan when moderation_ai_scans is off', async () => {
    const res = await request(baseUrl)
      .post('/moderation/scan')
      .set('Authorization', 'Bearer test')
      .send({ contentId: 'c1', mediaUrl: 'https://cdn.example.com/video.mp4' });

    expect(res.status).toBe(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(moderationFlags.aiScans);
    expect(mockModerationService.scanContentMedia).not.toHaveBeenCalled();
  });

  it('passes the scan route through when moderation_ai_scans is on', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    const res = await request(baseUrl)
      .post('/moderation/scan')
      .set('Authorization', 'Bearer test')
      .send({ contentId: 'c1', mediaUrl: 'https://cdn.example.com/video.mp4' });

    expect(res.status).not.toBe(403);
    expect(mockModerationService.scanContentMedia).toHaveBeenCalled();
  });
});
