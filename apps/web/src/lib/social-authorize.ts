import { authFlags } from '@azeebo/feature-flags/registries';

/**
 * Google/Apple sign-in entry points for the web login page.
 *
 * The provider kill switches are read from the gateway's public flag subset
 * (`GET /feature-flags/bootstrap`) rather than a build-time constant, so an
 * operator can turn a provider off without a deploy — and the button disappears
 * instead of leading to a 503 (prd-social-login.md FR-7).
 */

export type SocialProvider = 'google' | 'apple';

export const SOCIAL_PROVIDER_FLAGS: Record<SocialProvider, string> = {
  google: authFlags.socialGoogle,
  apple: authFlags.socialApple,
};

/**
 * Builds the browser entry point. Relative on purpose: next.config.js rewrites
 * `/auth/:path*` to the gateway, so this stays same-origin, inherits the
 * middleware's public-path allowance, and needs no CORS or CSP exception.
 *
 * `redirect` rides along as a query parameter but is only ever *stored*
 * server-side in the OAuth state record — the provider never sees it.
 */
export function socialAuthorizeUrl(provider: SocialProvider, redirect?: string): string {
  const params = new URLSearchParams();
  if (redirect) params.set('redirect', redirect);
  const query = params.toString();
  return `/auth/social/${provider}/authorize${query ? `?${query}` : ''}`;
}
