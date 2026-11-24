import type { NextResponse } from 'next/server';
import { AUTH_COOKIE, LEGACY_AUTH_CLEAR_HEADER } from './cookie-names';

/**
 * Writes the web app's auth cookie jar onto a response.
 *
 * Extracted from `/api/auth/set-cookie` so the password path and the OAuth
 * callback path cannot drift apart: both must produce a byte-identical jar or
 * one of them silently logs users out after a page load.
 */

/** Access-token cookie lifetime, matching `/api/auth/set-cookie`. */
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
/** Refresh-token lifetime, matching `/api/auth/set-cookie` (AUD-47). */
const REFRESH_TOKEN_MAX_AGE = 24 * 60 * 60;

export interface AuthCookieTokens {
  token: string;
  refreshToken?: string;
}

export interface AuthCookieOptions {
  /**
   * Defaults to `strict`, which is correct when the cookie is set from a
   * same-site XHR (the password login path).
   *
   * The OAuth callback must pass `lax`: the browser arrives there via a
   * cross-site redirect chain started at the provider, and `strict` cookies are
   * withheld on a navigation from another site — the user would land back on
   * the app already looking signed out.
   */
  sameSite?: 'strict' | 'lax';
}

/**
 * Returns false when the token is not a three-part JWT, in which case nothing
 * is written and the caller should treat the login as failed.
 */
export function applyAuthCookies(
  response: NextResponse,
  { token, refreshToken }: AuthCookieTokens,
  { sameSite = 'strict' }: AuthCookieOptions = {}
): boolean {
  if (!token || token.split('.').length !== 3) {
    return false;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const baseOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: '/',
  } as const;

  response.cookies.set('access_token', token, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  if (refreshToken) {
    response.cookies.set('refresh_token', refreshToken, {
      ...baseOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  // Non-HttpOnly namespaced marker for the middleware auth check. The bare
  // `auth` name is deliberately avoided — see lib/cookie-names.ts.
  let marker = 'authenticated';
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    marker = payload.sub || payload.userId || 'authenticated';
  } catch {
    // Falls back to the sentinel above.
  }
  response.cookies.set(AUTH_COOKIE, marker, {
    httpOnly: false,
    secure: isProduction,
    sameSite,
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  // Self-heal: expire any legacy/foreign bare `auth` cookie riding along in the
  // shared localhost jar so it can't masquerade as a session.
  response.headers.append('Set-Cookie', LEGACY_AUTH_CLEAR_HEADER);

  return true;
}
