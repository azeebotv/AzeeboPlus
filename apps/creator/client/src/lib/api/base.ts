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

const USER_KEY = 'azeebo_creator_user';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match?.[1] ?? '') : null;
}

const CSRF_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE = '_csrf';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Single-flight refresh: N parallel 401s must trigger ONE refresh, not N.
 * Concurrent refreshes race the server-side token rotation — the losers
 * 401/429 and force a bogus logout (seen as logout-on-reload when the page
 * fires several queries at boot).
 */
let refreshInFlight: Promise<boolean> | null = null;
let cachedCsrfToken: string | null = null;

function refreshSession(): Promise<boolean> {
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

export function resolveCsrfToken(): string | null {
  return cachedCsrfToken || getCookie(CSRF_COOKIE);
}

/**
 * XHR upload with real progress events. fetch() has no upload progress, so
 * multipart uploads use XMLHttpRequest.upload.onprogress to drive the UI's
 * percentage bar. Mirrors apiFetch's auth (httpOnly cookies via
 * credentials) and CSRF handling for state-changing methods.
 */
export function xhrUpload<T>(
  url: string,
  body: FormData,
  onProgress?: (percent: number) => void
): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const method = 'POST';
    const headers: Record<string, string> = {};
    // Never set a JSON Content-Type — the browser must generate the multipart
    // boundary or multer rejects the request with 400.
    let csrfToken = resolveCsrfToken();
    if (csrfToken) {
      headers[CSRF_HEADER] = csrfToken;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.withCredentials = true;
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Cap at 99: the tail is server-side (pipeline forward + DB write),
        // which only completes when the response arrives.
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    };

    xhr.onload = async () => {
      // XHR fires onprogress=100 just before onload; the response has now
      // arrived so the whole flow (bytes + server work) is done.
      if (onProgress) onProgress(100);
      let json: ApiResponse<T>;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error(`Upload failed: invalid response (${xhr.status})`));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        // Capture a rotated CSRF token if the response carries one.
        const responseCsrf = xhr.getResponseHeader(CSRF_HEADER);
        if (responseCsrf) cachedCsrfToken = responseCsrf;
        resolve(json);
      } else if (xhr.status === 403 && /csrf/i.test(json.message || json.error || '')) {
        // CSRF recovery, mirroring apiFetch: re-bootstrap once and retry.
        try {
          const fresh = await fetchCsrfToken();
          if (!fresh) {
            reject(new Error(json.message || 'Upload rejected (CSRF)'));
            return;
          }
          const retry = new XMLHttpRequest();
          retry.open(method, url, true);
          retry.withCredentials = true;
          retry.setRequestHeader(CSRF_HEADER, fresh);
          retry.onload = () => {
            try {
              const retryJson = JSON.parse(retry.responseText) as ApiResponse<T>;
              if (retry.status >= 200 && retry.status < 300) resolve(retryJson);
              else reject(new Error(retryJson.message || `Upload failed (${retry.status})`));
            } catch {
              reject(new Error(`Upload failed: invalid response (${retry.status})`));
            }
          };
          retry.onerror = () => reject(new Error('Network error during upload'));
          retry.send(body);
        } catch {
          reject(new Error(json.message || 'Upload rejected (CSRF)'));
        }
      } else {
        reject(new Error(json.message || json.error || `Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    xhr.send(body);
  });
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

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { skipAuthRetry?: boolean } = {}
): Promise<ApiResponse<T>> {
  // Tokens are sent automatically via httpOnly cookies (credentials: 'include')
  // No need to read from localStorage

  const method = (options.method || 'GET').toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    // Never set a JSON Content-Type on FormData — the browser must generate
    // the multipart boundary or multer rejects the request with 400.
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (STATE_CHANGING_METHODS.includes(method)) {
    // Bootstrap when no token is cached: the gateway only mints the _csrf
    // cookie on bootstrap, so a cold page would otherwise send cookieless
    // mutations that the backend must reject.
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

    // Capture a fresh CSRF token if the response carries one (the gateway
    // rotates it alongside the auth cookies).
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
        // Refresh via the httpOnly refresh_token cookie — the browser sends it
        // automatically and the backend rotates + resets the cookies itself.
        // Single-flight so parallel 401s share one rotation.
        const refreshed = await refreshSession();

        if (refreshed) {
          // Retry the original request with a fresh CSRF header — the rotation
          // may have replaced the old one, and reusing it would 403 the retry.
          const retryCsrf = resolveCsrfToken() || (await fetchCsrfToken());
          const retryHeaders: Record<string, string> = {
            ...headers,
            ...(retryCsrf ? { [CSRF_HEADER]: retryCsrf } : {}),
          };
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
  try {
    await fetch('/api/v1/auth/cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
      credentials: 'include',
    });
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

export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/v1/auth/csrf', { credentials: 'include' });
    const headerToken = res.headers.get(CSRF_HEADER) || res.headers.get('x-csrf-token');
    const cookieToken = getCookie(CSRF_COOKIE);
    const token = headerToken || cookieToken;
    if (token) {
      cachedCsrfToken = token;
      if (typeof document !== 'undefined') {
        document.cookie = `${CSRF_COOKIE}_client=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
      }
    }
    return token;
  } catch {
    // CSRF token fetch failed - the cookie may already exist from a prior request
    return null;
  }
}
