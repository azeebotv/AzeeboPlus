import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { StoriesController } from '../stories/stories.controller.js';
import { StoriesService } from '../stories/stories.service.js';
import { FeatureFlagGuard, FeatureFlagService, lifestyleFlags } from '@azeebo/feature-flags';

jest.mock('@nestjs/swagger', () => ({
  ApiTags: () => () => {},
  ApiOperation: () => () => {},
  ApiResponse: () => () => {},
  ApiBearerAuth: () => () => {},
  ApiProperty: () => () => {},
  ApiPropertyOptional: () => () => {},
  PartialType: (t: unknown) => t,
}));

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
  RolesGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
  Roles: () => (_target: unknown, _propertyKey?: string, descriptor?: PropertyDescriptor) =>
    descriptor,
}));

/**
 * Kill-switch simulation for the lifestyle feature gates. Boots the stories
 * controller (lifestyle_stories_enabled) with the REAL FeatureFlagGuard to
 * prove the class-level gate fires in both directions.
 */
describe('Lifestyle stories kill-switch (lifestyle_stories_enabled)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const mockStoriesService = {
    getStories: jest.fn().mockResolvedValue({ success: true, data: { stories: [] } }),
    getStoryBySlug: jest.fn().mockResolvedValue({ success: true, data: {} }),
    getCategories: jest.fn().mockResolvedValue({ success: true, data: { categories: [] } }),
  };
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StoriesController],
      providers: [
        { provide: StoriesService, useValue: mockStoriesService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    }).compile();

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

  it('blocks GET /lifestyle/stories with 403 when lifestyle_stories_enabled is off', async () => {
    await request(baseUrl).get('/lifestyle/stories').expect(403);
    expect(mockFeatureFlagService.isEnabled.mock.calls[0][0]).toBe(lifestyleFlags.storiesEnabled);
    expect(mockStoriesService.getStories).not.toHaveBeenCalled();
  });

  it('blocks GET /lifestyle/stories/:slug with 403 when lifestyle_stories_enabled is off', async () => {
    await request(baseUrl).get('/lifestyle/stories/my-story').expect(403);
    expect(mockStoriesService.getStoryBySlug).not.toHaveBeenCalled();
  });

  it('serves stories when lifestyle_stories_enabled is on', async () => {
    mockFeatureFlagService.isEnabled.mockResolvedValue(true);
    await request(baseUrl).get('/lifestyle/stories').expect(200);
    expect(mockStoriesService.getStories).toHaveBeenCalled();
  });
});
