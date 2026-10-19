import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '@/app/auth/login/page';

vi.mock('@/components/auth/AuthShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/auth/FormBits', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Spinner: () => null,
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

const providerButton = (provider: 'Google' | 'Apple'): HTMLButtonElement =>
  screen.getByRole('button', {
    name: new RegExp(`Continue with ${provider}`, 'i'),
  }) as HTMLButtonElement;

const buttonNamed = (name: RegExp): HTMLButtonElement =>
  screen.getByRole('button', { name }) as HTMLButtonElement;

describe('login page provider buttons', () => {
  it('disables both providers with a visible reason and leaves the password path live', () => {
    render(<LoginPage />);

    for (const provider of ['Google', 'Apple'] as const) {
      const button = providerButton(provider);
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-disabled')).toBe('true');
    }

    expect(screen.getByText(/aren't available yet/i)).toBeTruthy();
    expect(buttonNamed(/log in/i).disabled).toBe(false);
  });
});
