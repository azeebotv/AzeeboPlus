/**
 * Auth cookie names for the web app.
 *
 * Cookie names are host-scoped, not port-scoped: every localhost dev app
 * (web :4000, admin :4100, creator :4104, other projects, ...) shares one
 * browser jar. Any app that writes an unprefixed `auth` cookie clobbers
 * every other app's session marker, so web namespaces its middleware
 * marker. (The httpOnly access/refresh token cookies are gateway-minted
 * and shared by design across the platform's own SPA panels.)
 */
export const AUTH_COOKIE = 'azeebo_web_auth';

/**
 * The legacy bare `auth` cookie name. Third-party/dev tooling has been
 * observed planting email-valued `auth` cookies into the shared localhost
 * jar (clobbering real sessions' routing marker). Web no longer reads it —
 * and every write path actively expires it so the jar self-heals.
 */
export const LEGACY_AUTH_COOKIE = 'auth';

/** Set-Cookie header string that expires the legacy bare `auth` cookie. */
export const LEGACY_AUTH_CLEAR_HEADER =
  `${LEGACY_AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;

/** True when a middleware marker value represents an authenticated session. */
export function isAuthMarkerValid(value: string | undefined | null): boolean {
  return Boolean(value && value.length > 0 && value !== 'authenticated');
}

/**
 * Client-side best-effort expiry of the legacy `auth` cookie. Only
 * non-httpOnly variants can be removed this way; server routes clear both.
 */
export function clearLegacyAuthCookie(): void {
  if (typeof document === 'undefined') return;
  for (const sameSite of ['Lax', 'Strict', 'None']) {
    document.cookie = `${LEGACY_AUTH_COOKIE}=; Max-Age=0; path=/; SameSite=${sameSite}`;
  }
}
