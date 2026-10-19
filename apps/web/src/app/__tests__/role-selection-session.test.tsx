import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/lib/api';
import { refreshAuthCookie } from '@/lib/cookie-utils';
import RoleSelectionPage, { type SelectRoleResult } from '@/app/auth/role-selection/page';

const push = vi.fn();
const refreshUser = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }));
vi.mock('@/lib/cookie-utils', () => ({ refreshAuthCookie: vi.fn() }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ refreshUser }) }));
vi.mock('@/components/auth/AuthShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/auth/FormBits', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Spinner: () => null,
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const mockedFetch = vi.mocked(apiFetch);
const mockedCookie = vi.mocked(refreshAuthCookie);

const creatorCard = (): HTMLElement => screen.getByText('Creator').closest('button') as HTMLElement;

describe('role selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCookie.mockResolvedValue(true);
  });

  it('adopts the re-minted access token so the new role is live immediately', async () => {
    const tokenEnvelope: SelectRoleResult = {
      success: true,
      message: 'Role selected successfully',
      access_token: 'fresh-token',
    };
    mockedFetch.mockResolvedValue(tokenEnvelope);

    render(<RoleSelectionPage />);
    fireEvent.click(creatorCard());

    await waitFor(() => expect(push).toHaveBeenCalledWith('/auth/profile-setup'));
    expect(mockedCookie).toHaveBeenCalledWith('fresh-token');
    expect(refreshUser).toHaveBeenCalled();
  });

  it('still completes the step when the endpoint answers without a token', async () => {
    const tokenlessEnvelope: SelectRoleResult = {
      success: true,
      message: 'Role selected successfully',
    };
    mockedFetch.mockResolvedValue(tokenlessEnvelope);

    render(<RoleSelectionPage />);
    fireEvent.click(creatorCard());

    await waitFor(() => expect(push).toHaveBeenCalledWith('/auth/profile-setup'));
    expect(mockedCookie).not.toHaveBeenCalled();
    expect(refreshUser).not.toHaveBeenCalled();
  });

  it('offers two roles only — creator already includes the viewer privileges', () => {
    render(<RoleSelectionPage />);

    expect(screen.queryByText('Creator & User')).toBeNull();
    const cards = ['Regular User', 'Creator'].map((title) =>
      screen.getByText(title).closest('button')
    );
    expect(cards.every((card) => card !== null)).toBe(true);
    expect(cards[1]?.textContent).toMatch(/viewer access/);
    expect(screen.queryByText(/Consume content and create your journey/)).toBeNull();
  });

  it('surfaces a rejected role instead of navigating', async () => {
    mockedFetch.mockResolvedValue({ success: false, message: 'Invalid role selection' });

    render(<RoleSelectionPage />);
    fireEvent.click(creatorCard());

    await waitFor(() => expect(screen.getByText('Invalid role selection')).toBeTruthy());
    expect(push).not.toHaveBeenCalled();
  });
});
