/**
 * HttpOnly Cookie Management Utilities
 * S-001: Client-side helpers for cookie-based auth
 */

import { AUTH_COOKIE, clearLegacyAuthCookie, isAuthMarkerValid } from './cookie-names';

const API_BASE = '';

/**
 * Set auth tokens in HttpOnly cookies via server API.
 * The refresh token rides along so the cookie-first recovery path in
 * lib/api/base.ts (POST /auth/refresh with no body) can rotate sessions —
 * without it, apiFetch pages 401 forever once the 15-min access cookie dies.
 */
export async function setAuthCookie(token: string, refreshToken?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/set-cookie`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, refresh_token: refreshToken }),
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Refresh auth cookie with new token
 */
export async function refreshAuthCookie(token: string, refreshToken?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh-cookie`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, refresh_token: refreshToken }),
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clear all auth cookies via server API
 */
export async function clearAuthCookies(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/clear-cookie`, {
      method: 'POST',
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated by reading the namespaced auth marker
 * cookie (contains just the user ID). Any legacy bare `auth` cookie in the
 * jar is expired on read — external tooling on localhost has been observed
 * planting email-valued `auth` cookies that clobbered real sessions.
 */
export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + AUTH_COOKIE + '=([^;]*)'));
  if (!isAuthMarkerValid(match?.[1] ? decodeURIComponent(match[1]) : null)) {
    // Nothing valid under the namespaced name — also expire any legacy
    // bare `auth` cookie so a stale/foreign marker can't confuse anything.
    clearLegacyAuthCookie();
    return false;
  }
  return true;
}
