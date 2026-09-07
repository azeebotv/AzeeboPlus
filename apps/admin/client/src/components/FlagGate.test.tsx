// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FlagGate } from './FlagGate';
import * as adminFlags from '@/hooks/useAdminFlags';

vi.mock('@/hooks/useAdminFlags');

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('FlagGate', () => {
  afterEach(cleanup);

  it('renders children when flag is enabled', () => {
    vi.mocked(adminFlags.useAdminFlags).mockReturnValue({
      isEnabled: (key: string) => key === 'test-flag',
      isLoading: false,
      flags: [],
    });

    renderWithRouter(
      <FlagGate flag="test-flag">
        <div>Protected content</div>
      </FlagGate>
    );

    expect(screen.getByText('Protected content')).toBeTruthy();
  });

  it('redirects when flag is disabled', () => {
    vi.mocked(adminFlags.useAdminFlags).mockReturnValue({
      isEnabled: () => false,
      isLoading: false,
      flags: [],
    });

    renderWithRouter(
      <FlagGate flag="disabled-flag">
        <div>Protected content</div>
      </FlagGate>
    );

    expect(screen.queryByText('Protected content')).toBeNull();
  });

  it('renders nothing while loading', () => {
    vi.mocked(adminFlags.useAdminFlags).mockReturnValue({
      isEnabled: () => true,
      isLoading: true,
      flags: [],
    });

    const { container } = renderWithRouter(
      <FlagGate flag="any-flag">
        <div>Protected content</div>
      </FlagGate>
    );

    expect(container.textContent).toBe('');
  });

  it('renders nothing when flag key does not match', () => {
    vi.mocked(adminFlags.useAdminFlags).mockReturnValue({
      isEnabled: (key: string) => key === 'other-flag',
      isLoading: false,
      flags: [],
    });

    renderWithRouter(
      <FlagGate flag="this-flag">
        <div>Protected content</div>
      </FlagGate>
    );

    expect(screen.queryByText('Protected content')).toBeNull();
  });
});
