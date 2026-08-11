import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { ComedyFeedController } from './comedy-feed.controller.js';
import { ComedyFeedService } from './comedy-feed.service.js';
import { FeatureFlagGuard, FeatureFlagService, comedyFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  ServiceAuthGuard: jest.fn(),
  AdminGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));
jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
  RedisModule: { module: jest.fn(), exports: [] },
  JwtConfigModule: { module: jest.fn(), exports: [] },
  RedisService: jest.fn(),
}));

import { ServiceAuthGuard, RateLimitGuard } from '@azeebo/security';

class MockServiceAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
    return true;
  }
}
class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

/**
 * Kill-switch simulation: boots the comedy feed controller with the REAL
 * FeatureFlagGuard so @FeatureFlag(comedyFlags.specialsGate) actually gates
 * the premium-specials routes. With the gate off, every specials entry point
 * (list, detail, like) must 403 before the service runs.
 */
describe('ComedyFeedController kill-switch (comedy_specials_gate)', () => {
  let app: INestApplication;
  const mockComedyFeedService = {
    getFeed: jest.fn().mockResolvedValue({ success: true, data: { items: [] } }),
    getTrending: jest.fn().mockResolvedValue({ success: true, data: { items: [] } }),
    getSpecials: jest.fn().mockResolvedValue({ success: true, data: { items: [] } }),
    getSpecialById: jest.fn().mockResolvedValue({ success: true, data: {} }),
    likeSpecial: jest.fn().mockResolvedValue({ success: true, data: { liked: true } }),
    getClipById: jest.fn().mockResolvedValue({ success: true, data: {} }),
  };

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // specials gate off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ComedyFeedController],
      providers: [
        { provide: ComedyFeedService, useValue: mockComedyFeedService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(ServiceAuthGuard)
      .useClass(MockServiceAuthGuard)
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

  it('blocks GET /comedy/specials with 403 when comedy_specials_gate is off', async () => {
    await request(app.getHttpServer()).get('/comedy/specials').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(
      comedyFlags.specialsGate
    );
    expect(mockComedyFeedService.getSpecials).not.toHaveBeenCalled();
  });

  it('blocks GET /comedy/specials/:id with 403 when comedy_specials_gate is off', async () => {
    await request(app.getHttpServer()).get('/comedy/specials/special-1').expect(403);
    expect(mockComedyFeedService.getSpecialById).not.toHaveBeenCalled();
  });

  it('blocks POST /comedy/specials/:id/like with 403 when comedy_specials_gate is off', async () => {
    await request(app.getHttpServer()).post('/comedy/specials/special-1/like').expect(403);
    expect(mockComedyFeedService.likeSpecial).not.toHaveBeenCalled();
  });

  it('serves ungated feed endpoints when the gate is off', async () => {
    await request(app.getHttpServer()).get('/comedy').expect(200);
    expect(mockComedyFeedService.getFeed).toHaveBeenCalled();
  });
});
