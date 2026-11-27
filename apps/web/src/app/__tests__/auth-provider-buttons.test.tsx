import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginPage from '@/app/auth/login/page';

/**
 * The provider buttons are flag-driven (prd-social-login.md FR-7/FR-8): a
 * provider appears only when its public kill switch evaluates on, and a click
 * locks the form into a visible in-flight state.
 *
 * The previous version of this spec pinned the buttons as permanently disabled
 * with a "not available yet" caption. That was correct while the OAuth round
 * trip had no callback route; both halves now exist, so the contract is the
 * opposite and this file pins it.
 */

const flagsState = vi.hoisted(() => ({ google: true, apple: true }));

vi.mock('@/context/FlagsContext', () => ({
  useFlags: () => ({
    isEnabled: (key: string) => {
      if (key === 'auth_social_google') return flagsState.google;
      if (key === 'auth_social_apple') return flagsState.apple;
      return false;
    },
  }),
}));

vi.mock('@/components/auth/AuthShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/auth/FormBits', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Spinner: () => <span data-testid="spinner" />,
  AuthField: ({ id, label }: { id: string; label: string }) => (
    <label htmlFor={id}>
      {label}
      <input id={id} name={id} />
    </label>
  ),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(''),
}));

const assignMock = vi.hoisted(() => vi.fn());

const providerButton = (provider: 'Google' | 'Apple'): HTMLButtonElement | null =>
  screen.queryByRole('button', { name: new RegExp(`Continue with ${provider}`, 'i') });

const passwordButton = (): HTMLButtonElement =>
  screen.getByRole('button', { name: /^log in/i }) as HTMLButtonElement;

describe('login page provider buttons', () => {
  beforeEach(() => {
    flagsState.google = true;
    flagsState.apple = true;
    assignMock.mockReset();
    // jsdom cannot navigate; the page only needs `assign`.
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        assign: assignMock,
        href: 'http://localhost:4000/auth/login',
      } as unknown as Location,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('flag-driven visibility', () => {
    it('offers both providers when both kill switches are on', () => {
      render(<LoginPage />);

      for (const provider of ['Google', 'Apple'] as const) {
        const button = providerButton(provider);
        expect(button).not.toBeNull();
        expect(button?.disabled).toBe(false);
      }
      // The old "coming soon" caption must be gone now that the flow works.
      expect(screen.queryByText(/aren't available yet/i)).toBeNull();
    });

    it('hides a provider whose flag is off and keeps the other usable', () => {
      flagsState.apple = false;
      render(<LoginPage />);

      expect(providerButton('Google')).not.toBeNull();
      expect(providerButton('Apple')).toBeNull();
    });

    it('renders no provider section at all when both are off', () => {
      flagsState.google = false;
      flagsState.apple = false;
      render(<LoginPage />);

      expect(providerButton('Google')).toBeNull();
      expect(providerButton('Apple')).toBeNull();
      expect(document.querySelector('[data-social-providers]')).toBeNull();
      // Password login is never gated by a provider flag.
      expect(passwordButton().disabled).toBe(false);
    });
  });

  describe('in-flight state', () => {
    it('shows progress and locks the form while handing off to Google', () => {
      render(<LoginPage />);

      fireEvent.click(providerButton('Google') as HTMLButtonElement);

      const pending = screen.getByRole('button', { name: /Redirecting to Google/i });
      expect(pending.getAttribute('aria-busy')).toBe('true');
      expect((pending as HTMLButtonElement).disabled).toBe(true);

      // The other provider is locked too — one hand-off at a time.
      const apple = screen.getByRole('button', { name: /Continue with Apple/i });
      expect((apple as HTMLButtonElement).disabled).toBe(true);

      expect(screen.getByTestId('spinner')).toBeTruthy();
    });

    it('navigates to the authorize entry point, carrying the return target', () => {
      render(<LoginPage />);

      fireEvent.click(providerButton('Apple') as HTMLButtonElement);

      expect(assignMock).toHaveBeenCalledTimes(1);
      expect(assignMock).toHaveBeenCalledWith('/auth/social/apple/authorize?redirect=%2Fhome');
    });
  });

  it('leaves the password path live alongside the providers', () => {
    render(<LoginPage />);
    expect(passwordButton().disabled).toBe(false);
  });
});
