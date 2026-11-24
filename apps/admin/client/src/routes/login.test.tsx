// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './login';
import { useAuth } from '@/context/AuthContext';
import { goToWebLogin, WEB_APP_URL } from '@/lib/web-auth';

/**
 * The Console has no credential form: an unauthenticated visitor is handed to
 * the main web app with an absolute return target, and comes back to the page
 * they originally asked for. These tests pin both halves of that contract —
 * including the guard that stops a signed-in non-admin from being bounced into
 * an endless web-login round trip.
 */

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/lib/web-auth', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/web-auth')>();
  return { ...mod, goToWebLogin: vi.fn() };
});

const mockUseAuth = vi.mocked(useAuth);
const mockGoToWebLogin = vi.mocked(goToWebLogin);

const setAuth = (overrides: Partial<ReturnType<typeof useAuth>> = {}): void => {
  mockUseAuth.mockReturnValue({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    roleDenied: false,
    logout: vi.fn(async () => {}),
    ...overrides,
  });
};

/** web-auth resolves ?next against this app's origin; in jsdom that is not the
 * dev port, so expectations are built from it rather than hardcoded. */
const handoffHref = (path: string): string =>
  `${WEB_APP_URL}/auth/login?redirect=${encodeURIComponent(window.location.origin + path)}`;

const open = (next: string): void => {
  render(
    <MemoryRouter initialEntries={[`/login?next=${encodeURIComponent(next)}`]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Console overview</div>} />
        <Route path="/wallets" element={<div>Partner wallets</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('admin login hand-off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuth();
  });

  afterEach(() => {
    cleanup();
  });

  it('hands an anonymous visitor to the web app, returning them to the page they wanted', () => {
    open('/wallets?tab=open');

    expect(mockGoToWebLogin).toHaveBeenCalledWith('/wallets?tab=open');
    // The anchor must carry the same absolute return target the redirect uses,
    // so the click-through path and the automatic one agree.
    const link = screen.getByRole('link', { name: /continue to azeebo\+ sign in/i });
    expect(link.getAttribute('href')).toBe(handoffHref('/wallets?tab=open'));
  });

  it('navigates back to the intended page once the web session exists', () => {
    setAuth({ isAuthenticated: true, user: { id: '1', email: 'a@b.c', name: 'A', role: 'admin' } });
    open('/wallets');

    expect(screen.getByText('Partner wallets')).toBeTruthy();
    expect(mockGoToWebLogin).not.toHaveBeenCalled();
  });

  it('drops a hostile ?next back on the overview instead of leaving the origin', () => {
    setAuth({ isAuthenticated: true, user: { id: '1', email: 'a@b.c', name: 'A', role: 'admin' } });
    open('//evil.example/wallets');

    expect(screen.getByText('Console overview')).toBeTruthy();
  });

  it('explains a signed-in non-admin instead of bouncing them into a login loop', () => {
    setAuth({ roleDenied: true });
    open('/wallets');

    expect(mockGoToWebLogin).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /can't open the console/i })).toBeTruthy();
    const link = screen.getByRole('link', { name: /sign in with an admin account/i });
    expect(link.getAttribute('href')).toBe(handoffHref('/wallets'));
  });
});
