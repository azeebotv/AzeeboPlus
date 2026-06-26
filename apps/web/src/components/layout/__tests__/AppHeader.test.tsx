/**
 * Unit tests for AppHeader component.
 *
 * Validates conditional rendering rules:
 *  - Guest vs authenticated nav/universes visibility
 *  - Guest-only Sign up / Log in buttons
 *  - Creator Dashboard link visibility (creator vs non-creator)
 *  - Profile dropdown open/close
 *  - Logout confirmation flow
 *
 * Run: npx vitest run src/components/layout/__tests__/AppHeader.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

/* ─── Hoisted mock variables (accessible inside vi.mock factories) ─── */

const { mockUseAuth, mockPush } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockPush: vi.fn(),
}));

/* ─── Mocks ─── */

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('../../auth/BrandLogo', () => ({
  default: () => <div data-testid="brand-logo" />,
}));

vi.mock('../../../lib/api/base', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

/* ─── Import component AFTER mocks ─── */

import AppHeader from '../AppHeader';

/* ─── Helpers ─── */

function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-1',
    email: 'test@azeebo.com',
    name: 'Test User',
    displayName: 'Test User',
    role: 'user',
    ...overrides,
  };
}

function renderHeader(authOverrides: Record<string, any> = {}) {
  const defaults = {
    user: makeUser(),
    token: 'tok',
    refreshToken: 'ref',
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    updateUser: vi.fn(),
    refreshUser: vi.fn(),
  };
  mockUseAuth.mockReturnValue({ ...defaults, ...authOverrides });
  return render(<AppHeader />);
}

/* ─── Tests ─── */

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ─── Brand Logo (always visible) ─── */

  describe('brand logo', () => {
    it('renders for guests', () => {
      renderHeader({ isAuthenticated: false, user: null });
      expect(screen.getByTestId('brand-logo')).toBeTruthy();
    });

    it('renders for authenticated users', () => {
      renderHeader();
      expect(screen.getByTestId('brand-logo')).toBeTruthy();
    });
  });

  /* ─── Navigation visibility ─── */

  describe('main navigation (Home, Browse, Library)', () => {
    it('is visible for authenticated users', () => {
      renderHeader();
      // Desktop nav exists with aria-label
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeTruthy();
      // Links appear in both desktop nav and mobile drawer — check at least 2 of each
      expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Browse').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('Library').length).toBeGreaterThanOrEqual(2);
    });

    it('is hidden for guest users', () => {
      renderHeader({ isAuthenticated: false, user: null });
      // No nav element with aria-label
      expect(screen.queryByRole('navigation', { name: /main navigation/i })).toBeNull();
      // No Home/Browse/Library links at all
      expect(screen.queryByText('Home')).toBeNull();
      expect(screen.queryByText('Browse')).toBeNull();
      expect(screen.queryByText('Library')).toBeNull();
    });
  });

  /* ─── Universes dropdown visibility ─── */

  describe('universes dropdown', () => {
    it('is visible for authenticated users', () => {
      renderHeader();
      expect(screen.getByRole('button', { name: /browse universes/i })).toBeTruthy();
    });

    it('is hidden for guest users', () => {
      renderHeader({ isAuthenticated: false, user: null });
      expect(screen.queryByRole('button', { name: /browse universes/i })).toBeNull();
    });

    it('opens on click and shows universe options', async () => {
      renderHeader();
      fireEvent.click(screen.getByRole('button', { name: /browse universes/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /universes/i })).toBeTruthy();
      });
      const menu = screen.getByRole('menu', { name: /universes/i });
      expect(within(menu).getByText('Reality')).toBeTruthy();
      expect(within(menu).getByText('Movies')).toBeTruthy();
      expect(within(menu).getByText('Sports')).toBeTruthy();
    });

    it('closes on second click', async () => {
      renderHeader();
      const btn = screen.getByRole('button', { name: /browse universes/i });
      fireEvent.click(btn);
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /universes/i })).toBeTruthy();
      });
      fireEvent.click(btn);
      await waitFor(() => {
        expect(screen.queryByRole('menu', { name: /universes/i })).toBeNull();
      });
    });

    it('closes on Escape key', async () => {
      renderHeader();
      fireEvent.click(screen.getByRole('button', { name: /browse universes/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /universes/i })).toBeTruthy();
      });
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('menu', { name: /universes/i })).toBeNull();
      });
    });
  });

  /* ─── Guest auth buttons ─── */

  describe('guest auth buttons', () => {
    it('shows Sign up and Log in for guests', () => {
      renderHeader({ isAuthenticated: false, user: null });
      // Both appear in desktop header and mobile drawer
      expect(screen.getAllByText('Log in').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Sign up').length).toBeGreaterThanOrEqual(1);
    });

    it('hides search, wallet, and profile for guests', () => {
      renderHeader({ isAuthenticated: false, user: null });
      expect(screen.queryByRole('button', { name: /^search$/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /profile menu/i })).toBeNull();
    });
  });

  /* ─── Profile dropdown ─── */

  describe('profile dropdown', () => {
    it('opens on profile icon click', async () => {
      renderHeader();
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      expect(screen.getByText('Test User')).toBeTruthy();
      expect(screen.getByText('test@azeebo.com')).toBeTruthy();
    });

    it('shows standard menu items', async () => {
      renderHeader();
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      const menu = screen.getByRole('menu', { name: /user menu/i });
      expect(within(menu).getByText('Profile')).toBeTruthy();
      expect(within(menu).getByText('Rewards')).toBeTruthy();
      expect(within(menu).getByText('Wallet')).toBeTruthy();
      expect(within(menu).getByText('Settings')).toBeTruthy();
      expect(within(menu).getByText('Sign out')).toBeTruthy();
    });

    it('closes on outside click', async () => {
      renderHeader();
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      fireEvent.mouseDown(document.body);
      await waitFor(() => {
        expect(screen.queryByRole('menu', { name: /user menu/i })).toBeNull();
      });
    });

    it('closes on Escape key', async () => {
      renderHeader();
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('menu', { name: /user menu/i })).toBeNull();
      });
    });
  });

  /* ─── Creator Dashboard conditional visibility ─── */

  describe('Creator Dashboard link', () => {
    it('shows for creator users', async () => {
      renderHeader({ user: makeUser({ role: 'creator' }) });
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      expect(screen.getByText('Creator Dashboard')).toBeTruthy();
    });

    it('shows for CREATOR role (uppercase)', async () => {
      renderHeader({ user: makeUser({ role: 'CREATOR' }) });
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      expect(screen.getByText('Creator Dashboard')).toBeTruthy();
    });

    it('hides for regular users', async () => {
      renderHeader({ user: makeUser({ role: 'user' }) });
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      expect(screen.queryByText('Creator Dashboard')).toBeNull();
    });

    it('hides for users with no role', async () => {
      renderHeader({ user: makeUser({ role: '' }) });
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      expect(screen.queryByText('Creator Dashboard')).toBeNull();
    });
  });

  /* ─── Logout confirmation flow ─── */

  describe('logout confirmation', () => {
    it('shows confirmation prompt on first click', async () => {
      const logout = vi.fn().mockResolvedValue(undefined);
      renderHeader({ logout });
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      const menu = screen.getByRole('menu', { name: /user menu/i });
      fireEvent.click(within(menu).getByText('Sign out'));
      expect(within(menu).getByText('Are you sure?')).toBeTruthy();
      expect(within(menu).getByText('Yes, sign out')).toBeTruthy();
      expect(within(menu).getByText('Cancel')).toBeTruthy();
      expect(logout).not.toHaveBeenCalled();
    });

    it('calls logout on confirm', async () => {
      const logout = vi.fn().mockResolvedValue(undefined);
      renderHeader({ logout });
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      const menu = screen.getByRole('menu', { name: /user menu/i });
      fireEvent.click(within(menu).getByText('Sign out'));
      fireEvent.click(within(menu).getByText('Yes, sign out'));
      expect(logout).toHaveBeenCalledTimes(1);
    });

    it('dismisses confirmation on Cancel', async () => {
      const logout = vi.fn().mockResolvedValue(undefined);
      renderHeader({ logout });
      fireEvent.click(screen.getByRole('button', { name: /profile menu/i }));
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /user menu/i })).toBeTruthy();
      });
      const menu = screen.getByRole('menu', { name: /user menu/i });
      fireEvent.click(within(menu).getByText('Sign out'));
      fireEvent.click(within(menu).getByText('Cancel'));
      expect(within(menu).queryByText('Are you sure?')).toBeNull();
      expect(within(menu).getByText('Sign out')).toBeTruthy();
      expect(logout).not.toHaveBeenCalled();
    });
  });

  /* ─── Wallet balance display ─── */

  describe('wallet balance', () => {
    it('formats large amounts with M suffix', () => {
      renderHeader({ user: makeUser({ balance: 1500000 }) });
      // Balance appears in desktop chip and mobile drawer
      expect(screen.getAllByText('₦1.5M').length).toBeGreaterThanOrEqual(1);
    });

    it('formats thousands with k suffix', () => {
      renderHeader({ user: makeUser({ balance: 4200 }) });
      expect(screen.getAllByText('₦4.2k').length).toBeGreaterThanOrEqual(1);
    });

    it('formats exact thousands without decimal', () => {
      renderHeader({ user: makeUser({ balance: 10000 }) });
      expect(screen.getAllByText('₦10k').length).toBeGreaterThanOrEqual(1);
    });

    it('formats small amounts normally', () => {
      renderHeader({ user: makeUser({ balance: 500 }) });
      expect(screen.getAllByText('₦500').length).toBeGreaterThanOrEqual(1);
    });
  });

  /* ─── Search overlay ─── */

  describe('search overlay', () => {
    it('toggles search overlay on icon click', async () => {
      renderHeader();
      const searchBtn = screen.getByRole('button', { name: /^search$/i });
      fireEvent.click(searchBtn);
      await waitFor(() => {
        expect(screen.getByRole('search')).toBeTruthy();
      });
      // Search input appears in overlay + mobile drawer — check at least one
      const inputs = screen.getAllByLabelText(/search azeebo/i);
      expect(inputs.length).toBeGreaterThanOrEqual(1);
    });

    it('submits search and navigates', async () => {
      renderHeader();
      const searchBtn = screen.getByRole('button', { name: /^search$/i });
      fireEvent.click(searchBtn);
      await waitFor(() => {
        expect(screen.getByRole('search')).toBeTruthy();
      });
      // Use the first search input (desktop overlay)
      const inputs = screen.getAllByLabelText(/search azeebo/i);
      const input = inputs[0];
      fireEvent.change(input, { target: { value: 'action movies' } });
      fireEvent.submit(input.closest('form')!);
      expect(mockPush).toHaveBeenCalledWith('/search?q=action%20movies');
    });
  });

  /* ─── Mobile hamburger ─── */

  describe('mobile hamburger', () => {
    it('toggles mobile drawer', async () => {
      renderHeader();
      const btn = screen.getByRole('button', { name: /open menu/i });
      fireEvent.click(btn);
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /navigation menu/i })).toBeTruthy();
      });
      expect(screen.getByRole('button', { name: /close menu/i })).toBeTruthy();
    });
  });
});
