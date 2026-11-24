import { describe, it, expect } from 'vitest';
import {
  SOCIAL_PROVIDER_FLAGS,
  socialAuthorizeUrl,
  type SocialProvider,
} from '../social-authorize';

describe('socialAuthorizeUrl', () => {
  it('builds a same-origin path the /auth rewrite forwards to the gateway', () => {
    for (const provider of ['google', 'apple'] as SocialProvider[]) {
      const url = socialAuthorizeUrl(provider);
      // Relative on purpose — an absolute URL would bypass the rewrite and
      // depend on a separately configured origin.
      expect(url.startsWith('/auth/social/')).toBe(true);
      expect(url).toBe(`/auth/social/${provider}/authorize`);
    }
  });

  it('carries the return target as an encoded query parameter', () => {
    expect(socialAuthorizeUrl('google', '/wallet')).toBe(
      '/auth/social/google/authorize?redirect=%2Fwallet'
    );
  });

  it('encodes a value that would otherwise break the query string', () => {
    const url = socialAuthorizeUrl('apple', 'https://admin.azeebo.com/x?a=1&b=2');
    expect(url).toContain('redirect=https%3A%2F%2Fadmin.azeebo.com%2Fx%3Fa%3D1%26b%3D2');
    // Exactly one `?` — the payload must not introduce its own.
    expect(url.split('?')).toHaveLength(2);
  });

  it('omits the query entirely when there is no target', () => {
    expect(socialAuthorizeUrl('google')).not.toContain('?');
  });
});

describe('SOCIAL_PROVIDER_FLAGS', () => {
  it('maps each provider to its kill switch', () => {
    expect(SOCIAL_PROVIDER_FLAGS).toEqual({
      google: 'auth_social_google',
      apple: 'auth_social_apple',
    });
  });
});
