// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './login';
import { useAuth } from '@/context/AuthContext';
import { goToWebLogin, WEB_APP_URL } from '@/lib/web-auth';

/**
 * The Creator Studio has no credential form: an unauthenticated visitor is
 * handed to the main web app with an absolute return target and comes back to
 * the page they originally asked for. A signed-in account without the creator
 * role gets an explanation plus the role-application path, never a redirect
 * back into the web login (which would return it here in a loop).
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
        <Route path="/" element={<div>Studio overview</div>} />
        <Route path="/submissions" element={<div>My submissions</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('creator login hand-off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuth();
  });

  afterEach(() => {
    cleanup();
  });

  it('hands an anonymous visitor to the web app, returning them to the page they wanted', () => {
    open('/submissions?status=pending');

    expect(mockGoToWebLogin).toHaveBeenCalledWith('/submissions?status=pending');
    const link = screen.getByRole('link', { name: /continue to azeebo\+ sign in/i });
    expect(link.getAttribute('href')).toBe(handoffHref('/submissions?status=pending'));
  });

  it('navigates back to the intended page once the web session exists', () => {
    setAuth({
      isAuthenticated: true,
      user: { id: '1', email: 'c@d.e', name: 'C', role: 'creator' },
    });
    open('/submissions');

    expect(screen.getByText('My submissions')).toBeTruthy();
    expect(mockGoToWebLogin).not.toHaveBeenCalled();
  });

  it('drops a hostile ?next back on the overview instead of leaving the origin', () => {
    setAuth({
      isAuthenticated: true,
      user: { id: '1', email: 'c@d.e', name: 'C', role: 'creator' },
    });
    open('//evil.example/submissions');

    expect(screen.getByText('Studio overview')).toBeTruthy();
  });

  it('offers the role-application path to a signed-in non-creator without redirecting', () => {
    setAuth({ roleDenied: true });
    open('/submissions');

    expect(mockGoToWebLogin).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /can't open the studio/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /apply for creator access/i })).toHaveProperty(
      'href',
      `${WEB_APP_URL}/auth/role-selection`
    );
  });
});
