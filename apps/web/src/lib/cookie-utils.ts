/**
 * HttpOnly Cookie Management Utilities
 * S-001: Client-side helpers for cookie-based auth
 */

const API_BASE = '';

/**
 * Set auth token in HttpOnly cookie via server API
 */
export async function setAuthCookie(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/set-cookie`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
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
export async function refreshAuthCookie(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh-cookie`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
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
 * Check if user is authenticated by reading the auth cookie
 * (This reads the non-HttpOnly auth cookie which contains just the user ID)
 */
export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  const match = document.cookie.match(/(?:^|;\s*)auth=([^;]*)/);
  return Boolean(match && match[1] && match[1].length > 0 && match[1] !== 'authenticated');
}
