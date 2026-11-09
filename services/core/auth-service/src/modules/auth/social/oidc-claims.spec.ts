import { UnauthorizedException } from '@nestjs/common';

import { assertIssuedFor, assertOidcClaims, type OidcProvider } from './oidc-claims.js';

const PROVIDER: OidcProvider = {
  name: 'Example',
  issuers: ['https://issuer.example.com', 'issuer.example.com'],
  clientId: 'our-client-id',
};

describe('OIDC claim validator', () => {
  describe('assertOidcClaims', () => {
    it('accepts a token from a listed issuer, issued for our client', () => {
      expect(() =>
        assertOidcClaims({ iss: 'https://issuer.example.com', aud: 'our-client-id' }, PROVIDER)
      ).not.toThrow();
    });

    it('accepts any listed issuer form', () => {
      expect(() =>
        assertOidcClaims({ iss: 'issuer.example.com', aud: 'our-client-id' }, PROVIDER)
      ).not.toThrow();
    });

    it('rejects an issuer the provider does not list', () => {
      expect(() =>
        assertOidcClaims({ iss: 'https://evil.example.com', aud: 'our-client-id' }, PROVIDER)
      ).toThrow(new UnauthorizedException('Example token was not issued by Example'));
    });

    it('rejects a token with no issuer', () => {
      expect(() => assertOidcClaims({ aud: 'our-client-id' }, PROVIDER)).toThrow(
        UnauthorizedException
      );
    });

    it('rejects a non-string issuer', () => {
      expect(() =>
        assertOidcClaims({ iss: ['https://issuer.example.com'], aud: 'our-client-id' }, PROVIDER)
      ).toThrow(UnauthorizedException);
    });

    it('rejects a token issued for a different client, even from the right issuer', () => {
      expect(() =>
        assertOidcClaims({ iss: 'https://issuer.example.com', aud: 'other-client' }, PROVIDER)
      ).toThrow(new UnauthorizedException('Example token was issued for a different client'));
    });

    it('checks the issuer before the audience', () => {
      expect(() =>
        assertOidcClaims({ iss: 'https://evil.example.com', aud: 'other-client' }, PROVIDER)
      ).toThrow('not issued by Example');
    });
  });

  describe('assertIssuedFor', () => {
    it('accepts an audience array that contains our client', () => {
      expect(() =>
        assertIssuedFor({ aud: ['other-client', 'our-client-id'] }, PROVIDER)
      ).not.toThrow();
    });

    it('rejects an audience array without our client', () => {
      expect(() => assertIssuedFor({ aud: ['other-client'] }, PROVIDER)).toThrow(
        'issued for a different client'
      );
    });

    it('rejects a missing audience', () => {
      expect(() => assertIssuedFor({}, PROVIDER)).toThrow(UnauthorizedException);
    });

    it('does not require an issuer, so access-token callers can use it alone', () => {
      expect(() => assertIssuedFor({ aud: 'our-client-id' }, PROVIDER)).not.toThrow();
    });
  });
});
