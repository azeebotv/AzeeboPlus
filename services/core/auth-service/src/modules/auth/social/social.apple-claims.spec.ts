import { generateKeyPairSync } from 'crypto';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

import { SocialAuthService } from './social.service.js';

jest.mock('axios');

/**
 * Apple signs ID tokens for *every* client with the same JWKS, so a valid
 * signature says only "Apple issued this" — not "Apple issued this for us".
 * Without `aud`/`iss` checks, a token minted for another developer's Services
 * ID verifies here and signs its holder into whichever account its `email`
 * names.
 *
 * These sign with a real RSA key and serve its public half as Apple's JWKS, so
 * the signature path runs for real: a test that stubbed `verify` would pass
 * even when the token never verified.
 */

const KID = 'apple-test-kid';
const CLIENT_ID = 'com.azeebo.servicesid';

const { privateKey: SIGNING_KEY, publicKey: VERIFY_KEY } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const PRIVATE_PEM = SIGNING_KEY.export({ type: 'pkcs8', format: 'pem' }) as string;
// Apple publishes JWKs, so the fixture serves the public half the same way.
const PUBLIC_JWK = VERIFY_KEY.export({ format: 'jwk' }) as Record<string, unknown>;

const jwt = new JwtService({});

function signAppleToken(claims: Record<string, unknown>): string {
  return jwt.sign(claims, { algorithm: 'RS256', privateKey: PRIVATE_PEM, keyid: KID });
}

function build(clientId = CLIENT_ID): SocialAuthService {
  return new SocialAuthService(
    {} as never, // AuthRepository
    {} as never, // AuthService
    jwt,
    { get: jest.fn().mockReturnValue(12) } as never, // ConfigService
    {} as never, // RedisService
    { getClientId: () => clientId } as never // AppleClientSecretService
  );
}

const validClaims = (): Record<string, unknown> => ({
  iss: 'https://appleid.apple.com',
  aud: CLIENT_ID,
  sub: 'apple-user-1',
  email: 'apple@example.com',
});

describe('SocialAuthService.verifyAppleToken — issued-by and issued-for checks', () => {
  beforeEach(() => {
    (axios.get as jest.Mock).mockReset();
    (axios.get as jest.Mock).mockResolvedValue({
      data: { keys: [{ ...PUBLIC_JWK, kid: KID, alg: 'RS256', use: 'sig' }] },
    });
  });

  it('accepts a token Apple issued to this Services ID', async () => {
    const user = await build().verifyAppleToken(signAppleToken(validClaims()));

    expect(user).toEqual({ email: 'apple@example.com', sub: 'apple-user-1', name: undefined });
  });

  it('accepts an audience array that contains this Services ID', async () => {
    const token = signAppleToken({ ...validClaims(), aud: ['com.other.client', CLIENT_ID] });
    await expect(build().verifyAppleToken(token)).resolves.toMatchObject({
      email: 'apple@example.com',
    });
  });

  it('rejects a token issued to a different Apple client, even with a valid signature', async () => {
    // The account-takeover shape: another developer's Services ID, our email.
    const token = signAppleToken({ ...validClaims(), aud: 'com.other.client' });

    await expect(build().verifyAppleToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(build().verifyAppleToken(token)).rejects.toThrow('different client');
  });

  it('rejects an audience array that does not include this Services ID', async () => {
    const token = signAppleToken({ ...validClaims(), aud: ['com.other.client'] });

    await expect(build().verifyAppleToken(token)).rejects.toThrow('different client');
  });

  it('rejects a token whose issuer is not Apple', async () => {
    const token = signAppleToken({ ...validClaims(), iss: 'https://evil.example.com' });

    await expect(build().verifyAppleToken(token)).rejects.toThrow('not issued by Apple');
  });

  it('rejects a token with no issuer at all', async () => {
    const { iss: _iss, ...rest } = validClaims();
    const token = signAppleToken(rest);

    await expect(build().verifyAppleToken(token)).rejects.toThrow('not issued by Apple');
  });

  it('rejects a token with no audience at all', async () => {
    const { aud: _aud, ...rest } = validClaims();
    const token = signAppleToken(rest);

    await expect(build().verifyAppleToken(token)).rejects.toThrow('different client');
  });

  it('still rejects a token Apple did not sign, before any claim is read', async () => {
    const { privateKey: foreignKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const token = jwt.sign(validClaims(), {
      algorithm: 'RS256',
      privateKey: foreignKey.export({ type: 'pkcs8', format: 'pem' }) as string,
      keyid: KID,
    });

    await expect(build().verifyAppleToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails closed with 503 when the client id is not configured', async () => {
    // Skipping the audience check because config is missing would accept every
    // Apple client's tokens; the lookup throws instead.
    const service = new SocialAuthService(
      {} as never,
      {} as never,
      jwt,
      { get: jest.fn().mockReturnValue(12) } as never,
      {} as never,
      {
        getClientId: () => {
          throw new ServiceUnavailableException('Apple sign-in is not configured');
        },
      } as never
    );

    await expect(service.verifyAppleToken(signAppleToken(validClaims()))).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });
});
