import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { SocialAuthController } from './social.controller.js';
import { SocialAuthService } from './social.service.js';
import { FeatureFlagGuard, FeatureFlagService, authFlags } from '@azeebo/feature-flags';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard.js';

class MockRateLimitGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

/**
 * Provider kill-switch simulation: boots the social controller with the REAL
 * FeatureFlagGuard (not overridden) so @FeatureFlag(authFlags.socialGoogle) /
 * @FeatureFlag(authFlags.socialApple) actually gate the endpoints. With the
 * flag off, every Google/Apple entry point must 403 before the service runs.
 */
describe('SocialAuthController provider kill-switch (auth_social_google/apple)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const mockSocialAuthService = {
    generateState: jest.fn().mockResolvedValue('state-123'),
    buildAuthorizeUrl: jest
      .fn()
      .mockReturnValue('https://accounts.google.com/o/oauth2/auth?state=state-123'),
    verifyGoogleToken: jest
      .fn()
      .mockResolvedValue({ email: 'g@example.com', sub: 'g-1', name: 'G User' }),
    verifyAppleToken: jest.fn().mockResolvedValue({ email: 'a@example.com', sub: 'a-1' }),
    loginWithCredential: jest.fn().mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
      user: { id: 'u-1', email: 'g@example.com', displayName: 'G User', avatar: null },
    }),
    socialLogin: jest.fn().mockResolvedValue({
      success: true,
      data: {
        user: { id: 'u-1', email: 'g@example.com', displayName: 'G User', role: 'user' },
        access_token: 'at',
        refresh_token: 'rt',
      },
    }),
  };

  const mockFeatureFlagService = {
    isEnabled: jest.fn().mockResolvedValue(false), // all provider flags off
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SocialAuthController],
      providers: [
        { provide: SocialAuthService, useValue: mockSocialAuthService },
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

  it('blocks GET /auth/social/google/authorize with 403 when the flag is off', async () => {
    await request(baseUrl).get('/auth/social/google/authorize').expect(403);
    expect(mockSocialAuthService.generateState).not.toHaveBeenCalled();
  });

  it('blocks legacy POST /auth/social/google with 403 when the flag is off', async () => {
    await request(baseUrl)
      .post('/auth/social/google')
      .send({ idToken: 'id-token', email: 'g@example.com' })
      .expect(403);
    expect(mockSocialAuthService.verifyGoogleToken).not.toHaveBeenCalled();
  });

  it('allows the Google flow when the flag is on', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === authFlags.socialGoogle)
    );

    // A browser navigation now gets a 302 to the provider, not a JSON body.
    await request(baseUrl)
      .get('/auth/social/google/authorize')
      .expect(302)
      .expect((res: { headers: Record<string, string> }) => {
        expect(res.headers.location).toContain('accounts.google.com');
      });
    expect(mockSocialAuthService.generateState).toHaveBeenCalledWith('google', undefined);
  });

  it('still returns the JSON shape for non-browser callers under ?format=json', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === authFlags.socialGoogle)
    );

    await request(baseUrl)
      .get('/auth/social/google/authorize?format=json')
      .expect(200)
      .expect((res: { body: { state?: string; authorizeUrl?: string } }) => {
        expect(res.body.state).toBe('state-123');
        expect(res.body.authorizeUrl).toContain('accounts.google.com');
      });
  });

  it('carries the post-login redirect into the state record', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === authFlags.socialGoogle)
    );

    await request(baseUrl).get('/auth/social/google/authorize?redirect=%2Fwallet').expect(302);
    expect(mockSocialAuthService.generateState).toHaveBeenCalledWith('google', '/wallet');
  });

  it('blocks Apple authorize while Google is enabled (independent kill switches)', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === authFlags.socialGoogle)
    );

    await request(baseUrl).get('/auth/social/apple/authorize').expect(403);
  });

  // The combined legacy route carries the provider in its body, so a single
  // `@FeatureFlag` cannot gate it; the provider named in the request decides.
  it('blocks a legacy Apple login when only Google is enabled', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === authFlags.socialGoogle)
    );

    await request(baseUrl)
      .post('/auth/social/login')
      .send({ provider: 'apple', idToken: 'header.payload.signature' })
      .expect(403);

    expect(mockSocialAuthService.loginWithCredential).not.toHaveBeenCalled();
  });

  it('blocks a legacy Google login when only Apple is enabled', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((key: string) =>
      Promise.resolve(key === authFlags.socialApple)
    );

    await request(baseUrl)
      .post('/auth/social/login')
      .send({ provider: 'google', accessToken: 'ya29.token' })
      .expect(403);

    expect(mockSocialAuthService.loginWithCredential).not.toHaveBeenCalled();
  });
});
