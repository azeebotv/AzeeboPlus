import { generateKeyPairSync } from 'crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppleClientSecretService } from './apple-client-secret.service.js';

/**
 * These sign with a real EC P-256 key and verify with its public half, so the
 * assertions cover the actual cryptography rather than a mocked JWT library.
 * A test that stubbed `sign` would pass even if the token were unverifiable.
 */

const { privateKey: PRIVATE_PEM, publicKey: PUBLIC_PEM } = generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** Apple documents six months as the maximum client-secret lifetime. */
const APPLE_MAX_SECRET_LIFETIME_SECONDS = 15777000;

const BASE_CONFIG: Record<string, string> = {
  APPLE_CLIENT_ID: 'com.azeebo.servicesid',
  APPLE_TEAM_ID: 'TEAM123456',
  APPLE_KEY_ID: 'KEY1234567',
  APPLE_PRIVATE_KEY: PRIVATE_PEM,
};

function makeConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

function build(overrides: Record<string, string | undefined> = {}): {
  service: AppleClientSecretService;
  jwt: JwtService;
} {
  const jwt = new JwtService({});
  const service = new AppleClientSecretService(makeConfig({ ...BASE_CONFIG, ...overrides }), jwt);
  return { service, jwt };
}

function decodePart(token: string, index: 0 | 1): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split('.')[index], 'base64url').toString());
}

describe('AppleClientSecretService', () => {
  it('mints an ES256 JWT Apple will accept as a client secret', () => {
    const { service, jwt } = build();

    const token = service.getClientSecret();
    const header = decodePart(token, 0);
    const claims = decodePart(token, 1);

    expect(header.alg).toBe('ES256');
    expect(header.kid).toBe('KEY1234567');

    // Apple requires aud to be its own issuer, sub to be the Services ID, and
    // iss to be the team.
    expect(claims.aud).toBe('https://appleid.apple.com');
    expect(claims.sub).toBe('com.azeebo.servicesid');
    expect(claims.iss).toBe('TEAM123456');

    // The signature must actually verify against the team's public key.
    const verified = jwt.verify(token, {
      publicKey: PUBLIC_PEM,
      algorithms: ['ES256'],
      audience: 'https://appleid.apple.com',
      issuer: 'TEAM123456',
    }) as { sub: string };
    expect(verified.sub).toBe('com.azeebo.servicesid');
  });

  it('keeps the lifetime inside Apple’s six-month ceiling', () => {
    const { service } = build();
    const claims = decodePart(service.getClientSecret(), 1);

    const lifetime = Number(claims.exp) - Number(claims.iat);
    expect(lifetime).toBeGreaterThan(0);
    expect(lifetime).toBeLessThanOrEqual(APPLE_MAX_SECRET_LIFETIME_SECONDS);
  });

  it('rejects a token signed by a different key', () => {
    const { service } = build();
    const token = service.getClientSecret();
    const { publicKey: otherPublic } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    expect(() =>
      new JwtService({}).verify(token, { publicKey: otherPublic, algorithms: ['ES256'] })
    ).toThrow();
  });

  describe('caching', () => {
    it('signs once and reuses the token', () => {
      const { service, jwt } = build();
      const sign = jest.spyOn(jwt, 'sign');

      const first = service.getClientSecret();
      const second = service.getClientSecret();

      expect(second).toBe(first);
      expect(sign).toHaveBeenCalledTimes(1);
    });

    it('re-mints when the key id rotates', () => {
      const jwt = new JwtService({});
      const config = { ...BASE_CONFIG };
      const service = new AppleClientSecretService(
        {
          get: (key: string) => config[key],
        } as unknown as ConfigService,
        jwt
      );

      const first = service.getClientSecret();
      config.APPLE_KEY_ID = 'KEY_ROTATED';
      const second = service.getClientSecret();

      expect(second).not.toBe(first);
      expect(decodePart(second, 0).kid).toBe('KEY_ROTATED');
    });
  });

  describe('private key handling', () => {
    it('accepts a .p8 stored on one line with escaped newlines', () => {
      // This is how secret managers actually hold the value.
      const escaped = PRIVATE_PEM.replace(/\n/g, '\\n');
      const { service, jwt } = build({ APPLE_PRIVATE_KEY: escaped });

      const token = service.getClientSecret();
      const verified = jwt.verify(token, { publicKey: PUBLIC_PEM, algorithms: ['ES256'] });
      expect(verified).toBeTruthy();
    });

    it('tolerates a quoted value', () => {
      const quoted = `"${PRIVATE_PEM.replace(/\n/g, '\\n')}"`;
      const { service, jwt } = build({ APPLE_PRIVATE_KEY: quoted });

      const token = service.getClientSecret();
      expect(jwt.verify(token, { publicKey: PUBLIC_PEM, algorithms: ['ES256'] })).toBeTruthy();
    });
  });

  describe('misconfiguration', () => {
    it.each(['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'])(
      'refuses to mint without %s',
      (missingKey) => {
        const { service } = build({ [missingKey]: undefined });
        expect(() => service.getClientSecret()).toThrow(ServiceUnavailableException);
      }
    );

    it('reports a service-unavailable rather than a 500 when the key is unparseable', () => {
      const { service } = build({ APPLE_PRIVATE_KEY: 'not-a-private-key' });
      expect(() => service.getClientSecret()).toThrow(ServiceUnavailableException);
    });
  });
});
