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

  const method = (options.method || 'GET').toUpperCase();
  if (STATE_CHANGING_METHODS.includes(method)) {
    const csrfToken = getCookie(CSRF_COOKIE);
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

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !options.skipAuthRetry) {
        // The refresh_token lives in an httpOnly cookie the browser sends
        // automatically. Single-flight so parallel 401s share one rotation.
        try {
          const refreshed = await refreshSession();

          if (refreshed) {
            // Retry original request — browser will send the new cookie
            const retryResponse = await fetch(endpoint, {
              ...options,
              headers,
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
    localStorage.setItem(USER_KEY + '_token', accessToken);
  }
}

export function setToken(token: string): void {
  // Tokens are now managed via httpOnly cookies — this is a no-op for backward compat
  localStorage.setItem(USER_KEY + '_token', token);
}

export function setRefreshToken(token: string): void {
  // Tokens are now managed via httpOnly cookies — this is a no-op for backward compat
  localStorage.setItem(USER_KEY + '_refresh_token', token);
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

export async function fetchCsrfToken(): Promise<void> {
  try {
    const res = await fetch('/api/v1/auth/csrf', { credentials: 'include' });
    // The gateway's CSRF middleware sets the _csrf cookie server-side and
    // exposes the token via the X-CSRF-Token response header (the cookie is
    // httpOnly, so JS cannot read it). Mirror that header onto the document
    // cookie jar under a non-httpOnly name that apiFetch's getCookie() can
    // read for subsequent state-changing requests.
    const headerToken = res.headers.get('X-CSRF-Token');
    const cookieToken = getCookie(CSRF_COOKIE);
    const token = headerToken || cookieToken;
    if (token && !cookieToken) {
      document.cookie = `${CSRF_COOKIE}_client=${token}; path=/; SameSite=Lax`;
    }
  } catch {
    // CSRF token fetch failed - the cookie may already exist from a prior request
  }
}
