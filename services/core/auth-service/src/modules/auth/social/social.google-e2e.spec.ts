import { INestApplication, CanActivate, ExecutionContext, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { FeatureFlagGuard, FeatureFlagService } from '@azeebo/feature-flags';
import { RedisService } from '@azeebo/shared-services';
import axios from 'axios';
import request from 'supertest';

import { AuthRepository } from '../auth.repository.js';
import { AuthService } from '../auth.service.js';
import { RateLimitGuard } from '../../../common/guards/rate-limit.guard.js';
import { AppleClientSecretService } from './apple-client-secret.service.js';
import { SocialAuthController } from './social.controller.js';
import { SocialAuthService } from './social.service.js';

jest.mock('axios');

/**
 * End-to-end Google sign-in: authorize → provider redirect → callback → verify → login.
 *
 * Real: the controller, the service, and the claim checks (issuer and audience).
 * Stubbed: Google's HTTP endpoints (axios), Redis (an in-memory map), the
 * account repository, and session issuance.
 */

const GOOGLE_CLIENT_ID = 'azeebo-google-web.apps.googleusercontent.com';
const REDIRECT_URI = 'https://api.example.com/auth/social/google/callback';

class AllowRateLimit implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('Google sign-in end to end (authorize → callback)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let store: Map<string, string>;

  const config: Record<string, string> = {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    GOOGLE_REDIRECT_URI: REDIRECT_URI,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SocialAuthController],
      providers: [
        SocialAuthService,
        { provide: JwtService, useValue: new JwtService({}) },
        { provide: ConfigService, useValue: { get: (key: string) => config[key] } },
        {
          provide: RedisService,
          useValue: {
            set: async (key: string, value: string) => void store.set(key, value),
            get: async (key: string) => store.get(key) ?? null,
            del: async (key: string) => void store.delete(key),
          },
        },
        {
          provide: AppleClientSecretService,
          useValue: { getClientId: () => '', getClientSecret: () => '' },
        },
        { provide: AuthRepository, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: FeatureFlagService, useValue: { isEnabled: jest.fn().mockResolvedValue(true) } },
        { provide: Reflector, useValue: new Reflector() },
        FeatureFlagGuard,
      ],
    })
      .overrideGuard(RateLimitGuard)
      .useClass(AllowRateLimit)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    await app.listen(0);
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    store = new Map();
    jest.restoreAllMocks();
    jest.spyOn(SocialAuthService.prototype, 'socialLogin').mockResolvedValue({
      success: true,
      data: {
        user: { id: 'u-1', email: 'google@example.com', displayName: 'G', role: 'user' },
        access_token: 'z.z.z',
        refresh_token: 'z.z.z',
      },
    } as never);
    (axios.get as jest.Mock).mockReset();
    (axios.post as jest.Mock).mockReset();
    // Google's token exchange returns an ID token. Tokeninfo is what vouches
    // for its claims, so the mocked tokeninfo response carries them.
    (axios.post as jest.Mock).mockResolvedValue({
      data: { id_token: 'google-id-token', access_token: 'google-access' },
    });
    (axios.get as jest.Mock).mockResolvedValue({ data: validTokenInfo() });
  });

  const validTokenInfo = (): Record<string, unknown> => ({
    iss: 'https://accounts.google.com',
    aud: GOOGLE_CLIENT_ID,
    sub: 'google-user-1',
    email: 'google@example.com',
    email_verified: 'true',
    name: 'Google User',
  });

  async function authorizeAndGetState(): Promise<string> {
    const res = await request(baseUrl).get('/auth/social/google/authorize?format=json').expect(200);
    const url = new URL(res.body.authorizeUrl);
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe(GOOGLE_CLIENT_ID);
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(url.searchParams.get('state')).toBe(res.body.state);
    return res.body.state as string;
  }

  it('signs a user in when Google returns a token issued to this client', async () => {
    const state = await authorizeAndGetState();

    const res = await request(baseUrl)
      .post('/auth/social/callback')
      .send({ state, code: 'google-code' })
      .expect(201);

    expect(axios.post).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.stringContaining('code=google-code'),
      expect.any(Object)
    );
    expect(SocialAuthService.prototype.socialLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'google@example.com',
        provider: 'google',
        socialId: 'google-user-1',
      })
    );
    expect(res.body.success).toBe(true);
  });

  it('rejects a token Google issued to another client, and never logs in', async () => {
    const state = await authorizeAndGetState();
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: { ...validTokenInfo(), aud: 'some-other-app.apps.googleusercontent.com' },
    });

    await request(baseUrl)
      .post('/auth/social/callback')
      .send({ state, code: 'google-code' })
      .expect(401);

    expect(SocialAuthService.prototype.socialLogin).not.toHaveBeenCalled();
  });
});
