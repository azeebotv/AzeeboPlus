import { generateKeyPairSync } from 'crypto';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

import { SocialAuthService } from './social.service.js';

jest.mock('axios');

/**
 * `POST /auth/social/login` is the legacy combined credential route. It used to
 * be served by a second controller whose Apple branch decoded the identity
 * token's payload and trusted it — a hand-built JWT signed its holder in as any
 * email (AUD-85 in audit.md). These pin the route onto the verified verifiers:
 * Google at tokeninfo, Apple against Apple's JWKS, before any account is read.
 */

const KID = 'apple-test-kid';
const CLIENT_ID = 'com.azeebo.servicesid';
const GOOGLE_CLIENT_ID = 'azeebo-google-web.apps.googleusercontent.com';

const { privateKey: SIGNING_KEY, publicKey: VERIFY_KEY } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const PRIVATE_PEM = SIGNING_KEY.export({ type: 'pkcs8', format: 'pem' }) as string;
const PUBLIC_JWK = VERIFY_KEY.export({ format: 'jwk' }) as Record<string, unknown>;
const jwt = new JwtService({});

function signAppleToken(claims: Record<string, unknown>): string {
  return jwt.sign(claims, { algorithm: 'RS256', privateKey: PRIVATE_PEM, keyid: KID });
}

/** An unsigned token of the shape the removed verifier happily decoded. */
function handBuiltAppleToken(payload: Record<string, unknown>): string {
  return `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
}

function build() {
  const authRepository = {
    findByEmail: jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'apple@example.com',
      displayName: 'Existing User',
      avatar: null,
      role: 'user',
    }),
    findBySocialId: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    linkSocialAccount: jest.fn().mockResolvedValue(undefined),
    findSocialAccount: jest.fn().mockResolvedValue({ id: 'social-1' }),
    listSocialAccounts: jest.fn().mockResolvedValue([]),
  };
  const authService = {
    generateTokens: jest
      .fn()
      .mockResolvedValue({ accessToken: 'access.jwt', refreshToken: 'refresh.jwt' }),
  };

  const service = new SocialAuthService(
    authRepository as never,
    authService as never,
    jwt,
    {
      get: jest.fn((key: string, fallback?: unknown) =>
        key === 'GOOGLE_CLIENT_ID' ? GOOGLE_CLIENT_ID : fallback
      ),
    } as never,
    {} as never,
    { getClientId: () => CLIENT_ID } as never
  );

  return { service, authRepository, authService };
}

describe('SocialAuthService.loginWithCredential — verified credentials only', () => {
  beforeEach(() => {
    (axios.get as jest.Mock).mockReset();
  });

  it('refuses a Google login with no access token instead of calling Google', async () => {
    const { service, authRepository } = build();

    await expect(service.loginWithCredential({ provider: 'google' })).rejects.toBeInstanceOf(
      UnauthorizedException
    );

    expect(axios.get).not.toHaveBeenCalled();
    expect(authRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('refuses an Apple login with no credential at all', async () => {
    const { service, authRepository } = build();

    await expect(service.loginWithCredential({ provider: 'apple' })).rejects.toThrow(
      'An Apple identity token is required'
    );
    expect(authRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('rejects a hand-built Apple token instead of trusting its payload', async () => {
    const { service, authRepository } = build();

    (axios.get as jest.Mock).mockResolvedValue({
      data: { keys: [{ ...PUBLIC_JWK, kid: KID, alg: 'RS256', use: 'sig' }] },
    });

    const forged = handBuiltAppleToken({ sub: 'attacker', email: 'victim@example.com' });

    await expect(
      service.loginWithCredential({ provider: 'apple', idToken: forged })
    ).rejects.toBeInstanceOf(UnauthorizedException);

    // The whole point of AUD-85: no session for an account nobody proved.
    expect(authRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('signs in an Apple client that presents a token Apple actually signed', async () => {
    const { service, authRepository, authService } = build();

    (axios.get as jest.Mock).mockResolvedValue({
      data: { keys: [{ ...PUBLIC_JWK, kid: KID, alg: 'RS256', use: 'sig' }] },
    });

    const token = signAppleToken({
      iss: 'https://appleid.apple.com',
      aud: CLIENT_ID,
      sub: 'apple-1',
      email: 'apple@example.com',
    });

    const result = await service.loginWithCredential({ provider: 'apple', idToken: token });

    expect(authRepository.findByEmail).toHaveBeenCalledWith('apple@example.com');
    expect(authService.generateTokens).toHaveBeenCalled();
    // The legacy wire shape older clients read, not the /callback contract.
    expect(result).toEqual({
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
      user: {
        id: 'user-1',
        email: 'apple@example.com',
        displayName: 'Existing User',
        avatar: null,
      },
    });
  });

  it('sends a Google access token to the tokeninfo endpoint', async () => {
    const { service } = build();

    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        sub: 'google-1',
        email: 'google@example.com',
        email_verified: 'true',
        name: 'Google User',
        picture: 'https://example.com/p.png',
        aud: GOOGLE_CLIENT_ID,
      },
    });

    const result = await service.loginWithCredential({
      provider: 'google',
      accessToken: 'ya29.token',
    });

    expect(axios.get).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/tokeninfo',
      expect.objectContaining({ params: { access_token: 'ya29.token' } })
    );
    expect(result.accessToken).toBe('access.jwt');
  });

  it('rejects a Google token issued to a different client, even with a valid email', async () => {
    const { service, authRepository } = build();

    // The account-takeover shape: another app's client id, our email.
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        sub: 'attacker-1',
        email: 'victim@example.com',
        email_verified: 'true',
        aud: 'some-other-app.apps.googleusercontent.com',
      },
    });

    await expect(
      service.loginWithCredential({ provider: 'google', accessToken: 'ya29.other-app' })
    ).rejects.toThrow('different client');
    expect(authRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('fails closed with 503 when GOOGLE_CLIENT_ID is not configured', async () => {
    const authRepository = { findByEmail: jest.fn() };
    const service = new SocialAuthService(
      authRepository as never,
      {} as never,
      jwt,
      { get: jest.fn().mockReturnValue(undefined) } as never,
      {} as never,
      { getClientId: () => CLIENT_ID } as never
    );

    await expect(
      service.loginWithCredential({ provider: 'google', accessToken: 'ya29.token' })
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('does not sign in a Google token Google declines to vouch for', async () => {
    const { service, authRepository } = build();

    (axios.get as jest.Mock).mockResolvedValue({ data: { error: 'invalid_token' } });

    await expect(
      service.loginWithCredential({ provider: 'google', accessToken: 'bogus' })
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authRepository.findByEmail).not.toHaveBeenCalled();
  });
});
