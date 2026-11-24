import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { UsersController } from './users.controller.js';
import { UserDeletionController } from '../user/user-deletion.controller.js';
import { UsersService } from './users.service.js';
import { AvatarService } from './avatar.service.js';
import { FeatureFlagGuard, FeatureFlagService } from '@azeebo/feature-flags';

jest.mock('@azeebo/security', () => ({
  RateLimitGuard: jest.fn(),
  RateLimit: () => () => {},
  Public: () => () => {},
  ServiceAuthGuard: jest.fn(),
}));
jest.mock('@azeebo/shared-services', () => ({
  CacheService: jest.fn(),
  cacheKey: jest.fn((...parts: string[]) => parts.join(':')),
}));

import { RateLimitGuard } from '@azeebo/security';

class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const mockUsersService = {
  getMe: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getProfile: jest.fn().mockResolvedValue({ success: true, data: {} }),
  updateProfile: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getUserById: jest.fn().mockResolvedValue({ success: true, data: {} }),
  followUser: jest.fn().mockResolvedValue({ success: true, data: {} }),
  unfollowUser: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getFollowers: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getFollowing: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getPreferences: jest.fn().mockResolvedValue({ success: true, data: {} }),
  updatePreferences: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getWatchHistory: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getSavedItems: jest.fn().mockResolvedValue({ success: true, data: {} }),
  saveItem: jest.fn().mockResolvedValue({ success: true, data: {} }),
  removeSavedItem: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getUniverseAffinity: jest.fn().mockResolvedValue({ success: true, data: {} }),
  updateUniverseAffinity: jest.fn().mockResolvedValue({ success: true, data: {} }),
  completeProfile: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getPrivacySettings: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getContinueWatching: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getFavoriteUniverses: jest.fn().mockResolvedValue({ success: true, data: {} }),
  updatePrivacySettings: jest.fn().mockResolvedValue({ success: true, data: {} }),
  requestDeletion: jest.fn().mockResolvedValue({ success: true, data: {} }),
  deleteUserData: jest.fn().mockResolvedValue({ success: true, data: {} }),
  exportUserData: jest.fn().mockResolvedValue({ success: true, data: {} }),
  getDeletionStatus: jest.fn().mockResolvedValue({ success: true, data: {} }),
};

/**
 * Kill-switch simulation: boots the user controllers with the REAL
 * FeatureFlagGuard so @FeatureFlag(userFlags.*) actually gate the routes.
 * With every flag off, follow / universe-affinity / continue-watching /
 * privacy-settings-v2 / deletion-soft endpoints must 403 before the service runs.
 * Non-gated routes (me, preferences, history, saved, privacy GET) stay reachable.
 */
describe('Users kill-switch (user_* flags)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all user flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController, UserDeletionController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: AvatarService, useValue: { uploadAvatar: jest.fn(), deleteAvatar: jest.fn() } },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
        { provide: RateLimitGuard, useValue: new MockRateLimitGuard() },
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useValue(new MockRateLimitGuard())
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    app.use(
      (
        req: { headers: { authorization?: string }; user?: unknown },
        _res: unknown,
        next: () => void
      ) => {
        req.user = { id: 'user-123', sub: 'user-123', role: 'user' };
        next();
      }
    );
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('follow_system off', () => {
    beforeAll(() => jest.clearAllMocks());

    it('POST /v1/users/:id/follow → 403', async () => {
      const res = await request(baseUrl).post(
        '/v1/users/550e8400-e29b-41d4-a716-446655440000/follow'
      );
      expect(res.status).toBe(403);
    });
    it('DELETE /v1/users/:id/follow → 403', async () => {
      const res = await request(baseUrl).delete(
        '/v1/users/550e8400-e29b-41d4-a716-446655440000/follow'
      );
      expect(res.status).toBe(403);
    });
    it('GET /v1/users/:id/followers → 403', async () => {
      const res = await request(baseUrl).get(
        '/v1/users/550e8400-e29b-41d4-a716-446655440000/followers'
      );
      expect(res.status).toBe(403);
    });
    it('GET /v1/users/:id/following → 403', async () => {
      const res = await request(baseUrl).get(
        '/v1/users/550e8400-e29b-41d4-a716-446655440000/following'
      );
      expect(res.status).toBe(403);
    });
  });

  describe('universe_affinity off', () => {
    beforeAll(() => jest.clearAllMocks());

    it('GET /v1/users/me/universe-affinity → 403', async () => {
      const res = await request(baseUrl).get('/v1/users/me/universe-affinity');
      expect(res.status).toBe(403);
      expect(mockUsersService.getUniverseAffinity).not.toHaveBeenCalled();
    });
    it('PATCH /v1/users/me/universe-affinity → 403', async () => {
      const res = await request(baseUrl)
        .patch('/v1/users/me/universe-affinity')
        .send({ universeId: 'universe-1', score: 5 });
      expect(res.status).toBe(403);
    });
  });

  describe('continue_watching off', () => {
    it('GET /v1/users/me/continue-watching → 403', async () => {
      const res = await request(baseUrl).get('/v1/users/me/continue-watching');
      expect(res.status).toBe(403);
      expect(mockUsersService.getContinueWatching).not.toHaveBeenCalled();
    });
  });

  describe('privacy_settings_v2 off', () => {
    it('PUT /v1/users/me/privacy-settings → 403', async () => {
      const res = await request(baseUrl)
        .put('/v1/users/me/privacy-settings')
        .send({ profileVisibility: 'private' });
      expect(res.status).toBe(403);
      expect(mockUsersService.updatePrivacySettings).not.toHaveBeenCalled();
    });
  });

  describe('deletion_soft off', () => {
    beforeAll(() => jest.clearAllMocks());

    it('POST /v1/privacy/deletion-request → 403', async () => {
      const res = await request(baseUrl)
        .post('/v1/privacy/deletion-request')
        .send({ reason: 'test' });
      expect(res.status).toBe(403);
      expect(mockUsersService.requestDeletion).not.toHaveBeenCalled();
    });
    it('DELETE /v1/privacy/data/:userId → 403', async () => {
      const res = await request(baseUrl).delete('/v1/privacy/data/user-123');
      expect(res.status).toBe(403);
      expect(mockUsersService.deleteUserData).not.toHaveBeenCalled();
    });
  });

  describe('non-gated routes stay reachable with flags off', () => {
    it('GET /v1/users/me → 200', async () => {
      const res = await request(baseUrl).get('/v1/users/me');
      expect(res.status).toBe(200);
    });
    it('GET /v1/users/me/preferences → 200', async () => {
      const res = await request(baseUrl).get('/v1/users/me/preferences');
      expect(res.status).toBe(200);
    });
    it('GET /v1/users/me/history → 200', async () => {
      const res = await request(baseUrl).get('/v1/users/me/history');
      expect(res.status).toBe(200);
    });
    it('GET /v1/users/me/privacy-settings → 200', async () => {
      const res = await request(baseUrl).get('/v1/users/me/privacy-settings');
      expect(res.status).toBe(200);
    });
    it('GET /v1/privacy/deletion-status/:userId → 200', async () => {
      const res = await request(baseUrl).get('/v1/privacy/deletion-status/user-123');
      expect(res.status).toBe(200);
    });
  });
});
