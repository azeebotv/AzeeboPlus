import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { CrossoversController } from './crossovers.controller.js';
import { CrossoversService } from './crossovers.service.js';
import { TimelineController } from '../timeline/timeline.controller.js';
import { TimelineService } from '../timeline/timeline.service.js';
import { FeatureFlagGuard, FeatureFlagService, verticalFlags } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  ServiceAuthGuard: jest.fn(),
  AdminGuard: jest.fn(),
  RateLimitService: jest.fn(),
}));
jest.mock('@nestjs/swagger', () => ({
  ApiTags: () => () => {},
  ApiOperation: () => () => {},
  ApiResponse: () => () => {},
  ApiBearerAuth: () => () => {},
  ApiProperty: () => () => {},
  ApiPropertyOptional: () => () => {},
  PartialType: (t: unknown) => t,
}));

import { RateLimitGuard, AdminGuard } from '@azeebo/security';

class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
class MockAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'admin-1', sub: 'admin-1', role: 'admin' };
    return true;
  }
}

/**
 * Kill-switch simulation for the vertical feature gates. Boots the crossovers
 * controller (vertical_crossovers_enabled, off by default) and the timeline
 * controller (vertical_timeline_enabled, on by default) with the REAL
 * FeatureFlagGuard to prove the class-level gates fire in both directions.
 */
describe('Vertical controllers kill-switch (vertical_* flags)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const mockCrossoversService = {
    getAllCrossovers: jest.fn().mockResolvedValue({ success: true, data: { crossovers: [] } }),
    createCrossover: jest.fn().mockResolvedValue({ success: true, data: {} }),
  };
  const mockTimelineService = {
    getTimeline: jest.fn().mockResolvedValue({ success: true, data: { events: [] } }),
  };
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CrossoversController, TimelineController],
      providers: [
        { provide: CrossoversService, useValue: mockCrossoversService },
        { provide: TimelineService, useValue: mockTimelineService },
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

  it('blocks GET /vertical/crossovers with 403 when vertical_crossovers_enabled is off', async () => {
    await request(baseUrl).get('/vertical/crossovers').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(verticalFlags.crossoversEnabled);
    expect(mockCrossoversService.getAllCrossovers).not.toHaveBeenCalled();
  });

  it('serves the timeline when vertical_timeline_enabled is on', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === verticalFlags.timelineEnabled)
    );
    await request(baseUrl).get('/vertical/timeline').expect(200);
    expect(mockTimelineService.getTimeline).toHaveBeenCalled();
  });

  it('blocks the timeline with 403 when vertical_timeline_enabled is off', async () => {
    await request(baseUrl).get('/vertical/timeline').expect(403);
    expect(mockTimelineService.getTimeline).not.toHaveBeenCalled();
  });
});
