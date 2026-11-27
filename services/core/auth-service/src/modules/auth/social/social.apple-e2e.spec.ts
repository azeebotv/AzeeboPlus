import { generateKeyPairSync } from 'crypto';
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
 * End-to-end Apple sign-in: authorize → provider redirect → callback → verify → login.
 *
 * Real: the controller, the service, the JWT signature check against a JWKS
 * built from a real RSA key, and the claim checks. Stubbed: Apple's HTTP
 * endpoints (axios), Redis (an in-memory map), the account repository, and
 * session issuance.
 */

const KID = 'apple-e2e-kid';
const CLIENT_ID = 'com.azeebo.servicesid';
const REDIRECT_URI = 'https://api.example.com/auth/social/apple/callback';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PRIVATE_PEM = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
const PUBLIC_JWK = publicKey.export({ format: 'jwk' }) as Record<string, unknown>;

const jwt = new JwtService({});

function appleIdToken(claims: Record<string, unknown>): string {
  return jwt.sign(claims, { algorithm: 'RS256', privateKey: PRIVATE_PEM, keyid: KID });
}

class AllowRateLimit implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('Apple sign-in end to end (authorize → callback)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let store: Map<string, string>;

  const config: Record<string, string> = {
    APPLE_CLIENT_ID: CLIENT_ID,
    APPLE_REDIRECT_URI: REDIRECT_URI,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SocialAuthController],
      providers: [
        SocialAuthService,
        { provide: JwtService, useValue: jwt },
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
          useValue: { getClientId: () => CLIENT_ID, getClientSecret: () => 'client-secret' },
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
        user: { id: 'u-1', email: 'apple@example.com', displayName: 'A', role: 'user' },
        access_token: 'z.z.z',
        refresh_token: 'z.z.z',
      },
    } as never);
    (axios.get as jest.Mock).mockReset();
    (axios.post as jest.Mock).mockReset();
    (axios.get as jest.Mock).mockResolvedValue({
      data: { keys: [{ ...PUBLIC_JWK, kid: KID, alg: 'RS256', use: 'sig' }] },
    });
    (axios.post as jest.Mock).mockImplementation(async () => ({
      data: { id_token: appleIdToken(validClaims()), access_token: 'apple-access' },
    }));
  });

  const validClaims = (): Record<string, unknown> => ({
    iss: 'https://appleid.apple.com',
    aud: CLIENT_ID,
    sub: 'apple-user-1',
    email: 'apple@example.com',
  });

  async function authorizeAndGetState(): Promise<string> {
    const res = await request(baseUrl).get('/auth/social/apple/authorize?format=json').expect(200);
    const url = new URL(res.body.authorizeUrl);
    expect(url.origin + url.pathname).toBe('https://appleid.apple.com/auth/authorize');
    expect(url.searchParams.get('client_id')).toBe(CLIENT_ID);
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(url.searchParams.get('state')).toBe(res.body.state);
    return res.body.state as string;
  }

  it('signs a user in when Apple returns a token issued to this Services ID', async () => {
    const state = await authorizeAndGetState();

    const res = await request(baseUrl)
      .post('/auth/social/callback')
      .send({ state, code: 'apple-code' })
      .expect(201);

    expect(axios.post).toHaveBeenCalledWith(
      'https://appleid.apple.com/auth/token',
      expect.stringContaining('code=apple-code'),
      expect.any(Object)
    );
    expect(SocialAuthService.prototype.socialLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'apple@example.com',
        provider: 'apple',
        socialId: 'apple-user-1',
      })
    );
    expect(res.body.success).toBe(true);
  });

  it('rejects a token Apple issued to another client, and never logs in', async () => {
    const state = await authorizeAndGetState();
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: { id_token: appleIdToken({ ...validClaims(), aud: 'com.attacker.client' }) },
    });

    await request(baseUrl)
      .post('/auth/social/callback')
      .send({ state, code: 'apple-code' })
      .expect(401);

    expect(SocialAuthService.prototype.socialLogin).not.toHaveBeenCalled();
  });

  it('rejects a state that was already consumed (replayed callback)', async () => {
    const state = await authorizeAndGetState();
    await request(baseUrl)
      .post('/auth/social/callback')
      .send({ state, code: 'apple-code' })
      .expect(201);

    await request(baseUrl)
      .post('/auth/social/callback')
      .send({ state, code: 'apple-code' })
      .expect(400);
  });
});
