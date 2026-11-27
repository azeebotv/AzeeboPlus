/**
 * AuthContext session-restore tests.
 *
 * Both auth cookies are httpOnly, so after a hard reload JavaScript can read
 * neither token — only the cached user record and the API itself can tell
 * whether the browser still has a session. These tests pin that behaviour:
 * a valid cookie jar must restore the session, an expired access cookie must
 * rotate through the refresh cookie, and only an explicit rejection may log
 * the user out.
 *
 * Run: npx vitest run src/context/__tests__/AuthContext.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

const USER_FIXTURE = {
  id: 'user-1',
  email: 'kemi@azeeboplus.com',
  name: 'Kemi Watch',
  role: 'user',
};

const { apiMock, cookieMock } = vi.hoisted(() => ({
  apiMock: {
    setToken: vi.fn(),
    attemptRefresh: vi.fn(),
    user: { getProfile: vi.fn() },
    auth: { logout: vi.fn(), login: vi.fn(), register: vi.fn() },
    wallet: { getBalance: vi.fn() },
  },
  cookieMock: {
    setAuthCookie: vi.fn(),
    refreshAuthCookie: vi.fn(),
    clearAuthCookies: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({ api: apiMock }));
vi.mock('@/lib/cookie-utils', () => cookieMock);

import { AuthProvider, useAuth } from '../AuthContext';

function Probe() {
  const { isAuthenticated, user, isLoading } = useAuth();
  return (
    <div data-testid="probe">
      {JSON.stringify({ isAuthenticated, email: user?.email ?? null, isLoading })}
    </div>
  );
}

const readProbe = () => JSON.parse(screen.getByTestId('probe').textContent || '{}');

describe('AuthProvider session restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    cookieMock.setAuthCookie.mockResolvedValue(true);
    cookieMock.refreshAuthCookie.mockResolvedValue(true);
    cookieMock.clearAuthCookies.mockResolvedValue(true);
    cookieMock.isAuthenticated.mockReturnValue(false);
    apiMock.auth.logout.mockResolvedValue({ success: true });
  });

  it('authenticates a hard reload whose cookie jar still works', async () => {
    localStorage.setItem('azeebo_user', JSON.stringify(USER_FIXTURE));
    apiMock.user.getProfile.mockResolvedValue({ success: true, data: USER_FIXTURE });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(readProbe().isLoading).toBe(false));
    expect(readProbe()).toEqual({
      isAuthenticated: true,
      email: USER_FIXTURE.email,
      isLoading: false,
    });
    // the profile read must not trigger the client's hard redirect on failure
    expect(apiMock.user.getProfile).toHaveBeenCalledWith({ skipAuthRetry: true });
  });

  it('rotates through the refresh cookie when the access cookie has expired', async () => {
    localStorage.setItem('azeebo_user', JSON.stringify(USER_FIXTURE));
    apiMock.user.getProfile
      .mockResolvedValueOnce({ success: false, statusCode: 401 })
      .mockResolvedValueOnce({ success: true, data: USER_FIXTURE });
    apiMock.attemptRefresh.mockResolvedValue({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(readProbe().isLoading).toBe(false));
    expect(apiMock.attemptRefresh).toHaveBeenCalledTimes(1);
    expect(apiMock.user.getProfile).toHaveBeenCalledTimes(2);
    expect(readProbe().isAuthenticated).toBe(true);
  });

  it('clears the session when the API rejects even after a failed refresh', async () => {
    localStorage.setItem('azeebo_user', JSON.stringify(USER_FIXTURE));
    apiMock.user.getProfile.mockResolvedValue({ success: false, statusCode: 401 });
    apiMock.attemptRefresh.mockResolvedValue(null);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(readProbe().isLoading).toBe(false));
    expect(readProbe().isAuthenticated).toBe(false);
    expect(readProbe().email).toBeNull();
    expect(localStorage.getItem('azeebo_user')).toBeNull();
    expect(cookieMock.clearAuthCookies).toHaveBeenCalled();
  });

  it('keeps the cached user through a transport failure instead of logging out', async () => {
    localStorage.setItem('azeebo_user', JSON.stringify(USER_FIXTURE));
    apiMock.user.getProfile.mockResolvedValue({
      success: false,
      statusCode: 503,
      message: 'Upstream unavailable',
    });
    apiMock.attemptRefresh.mockResolvedValue(null);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(readProbe().isLoading).toBe(false));
    expect(readProbe().isAuthenticated).toBe(true);
    expect(cookieMock.clearAuthCookies).not.toHaveBeenCalled();
  });

  it('stays anonymous without probing for a browser that never signed in', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(readProbe().isLoading).toBe(false));
    expect(apiMock.user.getProfile).not.toHaveBeenCalled();
    expect(readProbe().isAuthenticated).toBe(false);
  });

  it('probes when only the session marker survives (cleared storage, live cookie jar)', async () => {
    cookieMock.isAuthenticated.mockReturnValue(true);
    apiMock.user.getProfile.mockResolvedValue({ success: true, data: USER_FIXTURE });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(readProbe().isLoading).toBe(false));
    expect(apiMock.user.getProfile).toHaveBeenCalledTimes(1);
    expect(readProbe().isAuthenticated).toBe(true);
  });

  it('revokes the server-side session on logout even with no JS-readable token', async () => {
    localStorage.setItem('azeebo_user', JSON.stringify(USER_FIXTURE));
    // The middleware session marker is JS-visible, so a leftover one is what a
    // later reload would probe with. Plant it before logging out.
    document.cookie = 'azeebo_web_auth=user-1; path=/; SameSite=Strict';
    apiMock.user.getProfile.mockResolvedValue({ success: true, data: USER_FIXTURE });

    const holder: { logout: (() => Promise<void>) | null } = { logout: null };
    function Capture() {
      holder.logout = useAuth().logout;
      return <Probe />;
    }

    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );
    await waitFor(() => expect(readProbe().isLoading).toBe(false));

    await act(async () => {
      await holder.logout!();
    });
    expect(apiMock.auth.logout).toHaveBeenCalled();
    expect(cookieMock.clearAuthCookies).toHaveBeenCalled();
    await waitFor(() => expect(readProbe().isAuthenticated).toBe(false));
    expect(readProbe().email).toBeNull();
    // A logout that leaves the marker in the jar lets the next reload's probe
    // sign the user straight back in.
    expect(document.cookie).not.toContain('azeebo_web_auth=');
  });
});
