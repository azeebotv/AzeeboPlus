// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FlagGate } from './FlagGate';
import * as creatorFlags from '@/hooks/useCreatorFlags';

vi.mock('@/hooks/useCreatorFlags');

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('FlagGate', () => {
  afterEach(cleanup);

  it('renders children when flag is enabled', () => {
    vi.mocked(creatorFlags.useCreatorFlags).mockReturnValue({
      isEnabled: (key: string) => key === 'test-flag',
      isLoading: false,
      flags: [],
    });

    renderWithRouter(
      <FlagGate flag="test-flag">
        <div>Creator content</div>
      </FlagGate>
    );

    expect(screen.getByText('Creator content')).toBeTruthy();
  });

  it('redirects when flag is disabled', () => {
    vi.mocked(creatorFlags.useCreatorFlags).mockReturnValue({
      isEnabled: () => false,
      isLoading: false,
      flags: [],
    });

    renderWithRouter(
      <FlagGate flag="disabled-flag">
        <div>Creator content</div>
      </FlagGate>
    );

    expect(screen.queryByText('Creator content')).toBeNull();
  });

  it('renders nothing while loading', () => {
    vi.mocked(creatorFlags.useCreatorFlags).mockReturnValue({
      isEnabled: () => true,
      isLoading: true,
      flags: [],
    });

    const { container } = renderWithRouter(
      <FlagGate flag="any-flag">
        <div>Creator content</div>
      </FlagGate>
    );

    expect(container.textContent).toBe('');
  });
});
