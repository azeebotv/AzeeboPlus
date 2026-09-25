export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  avatar?: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ApiError {
  success: false;
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  message: string;
  error?: string;
  statusCode?: number;
  details?: {
    fieldErrors?: Record<string, string[]>;
    [key: string]: unknown;
  };
  timestamp?: string;
  path?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

const USER_KEY = 'azeebo_admin_user';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

const CSRF_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE = '_csrf';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Single-flight refresh: N parallel 401s must trigger ONE refresh, not N.
 * Concurrent refreshes race the token rotation on the server — the losers
 * 401/429 and force a bogus logout (seen as logout-on-reload when the page
 * fires several queries at boot).
 */
let refreshInFlight: Promise<boolean> | null = null;
let cachedCsrfToken: string | null = null;

function resolveCsrfToken(): string | null {
  return cachedCsrfToken || getCookie(CSRF_COOKIE) || getCookie(`${CSRF_COOKIE}_client`);
}

/**
 * CSRF recovery: the gateway mints tokens with an in-memory secret, so its
 * secret rotates on restart and every cached token instantly goes stale. A
 * mutation then 403s ("CSRF token missing/mismatch") forever because the
 * cached token short-circuits re-bootstrap. On a CSRF-flavored 403, drop the
 * cache, expire the cookies, re-bootstrap once, and retry the mutation with
 * the fresh token. Single-flight so parallel mutations share one recovery.
 */
let csrfRecoveryInFlight: Promise<string | null> | null = null;

function recoverCsrfToken(): Promise<string | null> {
  if (!csrfRecoveryInFlight) {
    csrfRecoveryInFlight = (async () => {
      cachedCsrfToken = null;
      if (typeof document !== 'undefined') {
        document.cookie = `${CSRF_COOKIE}=; Max-Age=0; path=/`;
        document.cookie = `${CSRF_COOKIE}_client=; Max-Age=0; path=/`;
      }
      return fetchCsrfToken();
    })().finally(() => {
      setTimeout(() => {
        csrfRecoveryInFlight = null;
      }, 50);
    });
  }
  return csrfRecoveryInFlight;
}

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        setTimeout(() => {
          refreshInFlight = null;
        }, 50);
      });
  }
  return refreshInFlight;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { skipAuthRetry?: boolean } = {}
): Promise<ApiResponse<T>> {
  // Tokens are sent automatically via httpOnly cookies (credentials: 'include')
  // No need to read from localStorage

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Cookie-first auth for the admin SPA. The access token rotates on every
  // /auth/refresh, so the localStorage copy goes stale the first time the
  // cookie flow recovers a session — attaching that stale Bearer header then
  // makes the backend 401 the request even though the fresh cookie is also
  // being sent (Settings and other pages rendered empty despite live data).
  // Only a token readable from the cookie jar is fresh by construction, so
  // only that may be mirrored into the header; the localStorage fallback is
  // never safe to send.
  const cookieToken = getCookie('access_token');
  if (cookieToken) {
    headers['Authorization'] = `Bearer ${cookieToken}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  if (STATE_CHANGING_METHODS.includes(method)) {
    let csrfToken = resolveCsrfToken();
    if (!csrfToken) {
      csrfToken = await fetchCsrfToken();
    }
    if (csrfToken) {
      headers[CSRF_HEADER] = csrfToken;
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include',
    });

    const responseCsrf = response.headers.get(CSRF_HEADER);
    if (responseCsrf) {
      cachedCsrfToken = responseCsrf;
      if (typeof document !== 'undefined') {
        document.cookie = `${CSRF_COOKIE}_client=${encodeURIComponent(responseCsrf)}; path=/; SameSite=Lax`;
      }
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !options.skipAuthRetry) {
        // The refresh_token lives in an httpOnly cookie the browser sends
        // automatically. Single-flight so parallel 401s share one rotation.
        try {
          const refreshed = await refreshSession();

          if (refreshed) {
            // Retry original request — the browser will send the new cookie.
            // Mirror the header from the (now fresh) cookie token only; the
            // pre-refresh header, if any, is stale and must not be reused.
            const retryHeaders: Record<string, string> = { ...headers };
            const retryCookieToken = getCookie('access_token');
            if (retryCookieToken) {
              retryHeaders['Authorization'] = `Bearer ${retryCookieToken}`;
            } else {
              delete retryHeaders['Authorization'];
              delete retryHeaders['authorization'];
            }
            const retryResponse = await fetch(endpoint, {
              ...options,
              headers: retryHeaders,
              credentials: 'include',
            });
            const retryData = await retryResponse.json();
            if (!retryResponse.ok) {
              return {
                success: false,
                message: retryData.message || 'Request failed',
                statusCode: retryResponse.status,
              } as ApiError;
            }
            return {
              success: true,
              data: retryData.data !== undefined ? retryData.data : retryData,
              message: retryData.message,
            };
          }
        } catch {
          // Refresh failed
        }

        clearSession();
        return {
          success: false,
          message: 'Session expired. Please login again.',
          statusCode: 401,
        } as ApiError;
      }

      // CSRF-flavored 403: the gateway's in-memory secret rotated (restart)
      // and our cached token is dead. Re-bootstrap once and retry the
      // mutation with the fresh token instead of failing the user's action.
      if (
        response.status === 403 &&
        !options.skipAuthRetry &&
        /csrf/i.test(String(data?.error || data?.message || data?.title || ''))
      ) {
        const freshToken = await recoverCsrfToken();
        if (freshToken) {
          const retryResponse = await fetch(endpoint, {
            ...options,
            headers: { ...headers, [CSRF_HEADER]: freshToken },
            credentials: 'include',
          });
          const retryData = await retryResponse.json().catch(() => null);
          if (retryResponse.ok) {
            return {
              success: true,
              data: retryData && retryData.data !== undefined ? retryData.data : retryData,
              message: retryData?.message,
            };
          }
          return {
            success: false,
            message:
              (retryData && (retryData.message || retryData.detail)) ||
              data?.message ||
              'Request failed',
            statusCode: retryResponse.status,
          } as ApiError;
        }
      }

      return {
        success: false,
        type: data.type,
        title: data.title,
        status: response.status,
        detail: data.detail,
        code: data.code,
        message: data.message || data.detail || 'An error occurred',
        error: data.error,
        statusCode: response.status,
        details: data.details,
      } as ApiError;
    }

    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
      message: data.message,
    };
  } catch {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      statusCode: 0,
    } as ApiError;
  }
}

export function getToken(): string | null {
  // Check cookie first, fall back to localStorage for backward compat
  return (
    getCookie('access_token') ||
    (typeof window !== 'undefined' ? localStorage.getItem(USER_KEY + '_token') : null)
  );
}

export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY + '_token', accessToken);
  }
  try {
    const res = await fetch('/api/v1/auth/cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`cookie set failed: ${res.status}`);
  } catch {
    // Cookie set failed — fallback to localStorage for this session
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY + '_token', accessToken);
    }
  }
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY + '_token', token);
  }
}

export function setRefreshToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY + '_refresh_token', token);
  }
}

export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  // Clear httpOnly cookies via API
  try {
    await fetch('/api/v1/auth/cookie', {
      method: 'DELETE',
      credentials: 'include',
    });
  } catch {
    // Cookie clear failed
  }
  // Also clear localStorage fallback
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_KEY + '_token');
    localStorage.removeItem(USER_KEY + '_refresh_token');
  }
}

export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/v1/auth/csrf', { credentials: 'include' });
    const headerToken = res.headers.get(CSRF_HEADER) || res.headers.get('x-csrf-token');
    const cookieToken = getCookie(CSRF_COOKIE) || getCookie(`${CSRF_COOKIE}_client`);
    const token = headerToken || cookieToken;
    if (token) {
      cachedCsrfToken = token;
      if (typeof document !== 'undefined') {
        document.cookie = `${CSRF_COOKIE}_client=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
        document.cookie = `${CSRF_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
      }
    }
    return token;
  } catch {
    return null;
  }
}
