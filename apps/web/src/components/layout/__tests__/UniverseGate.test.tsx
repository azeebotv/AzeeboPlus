/**
 * Unit tests for UniverseGate (server-driven universe visibility).
 *
 * Run: npx vitest run src/components/layout/__tests__/UniverseGate.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UniverseGate } from '../UniverseGate';

const replace = vi.fn();
let pathname = '/comedy';
const flags = {
  ready: true,
  // Default: strict sentinel semantics provided by the context helper.
  universeEnabled: vi.fn((name: string) => name !== 'comedy'),
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => pathname,
}));

vi.mock('../../../context/FlagsContext', () => ({
  useFlags: () => flags,
}));

describe('UniverseGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = '/comedy';
    flags.ready = true;
    flags.universeEnabled = vi.fn((name: string) => name !== 'comedy');
  });

  it('redirects to home when the current universe sentinel is disabled', async () => {
    render(
      <UniverseGate>
        <div>comedy page</div>
      </UniverseGate>
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(flags.universeEnabled).toHaveBeenCalledWith('comedy');
  });

  it('renders children untouched for an enabled universe', async () => {
    pathname = '/reality';
    render(
      <UniverseGate>
        <div>reality page</div>
      </UniverseGate>
    );
    await waitFor(() => expect(flags.universeEnabled).toHaveBeenCalledWith('reality'));
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText('reality page')).toBeTruthy();
  });

  it('waits for bootstrap before deciding (ready=false never redirects)', async () => {
    flags.ready = false;
    render(
      <UniverseGate>
        <div>comedy page</div>
      </UniverseGate>
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText('comedy page')).toBeTruthy();
  });

  it('maps /movies to the movie universe slug', async () => {
    pathname = '/movies';
    flags.universeEnabled = vi.fn().mockReturnValue(false);
    render(
      <UniverseGate>
        <div>movies page</div>
      </UniverseGate>
    );
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(flags.universeEnabled).toHaveBeenCalledWith('movie');
  });

  it('ignores non-universe segments (/, /search, /creator)', async () => {
    for (const p of ['/', '/search', '/creator', '/creators/dashboard', '/live-events']) {
      pathname = p;
      render(
        <UniverseGate>
          <div>page {p}</div>
        </UniverseGate>
      );
      await new Promise((r) => setTimeout(r, 10));
      expect(flags.universeEnabled).not.toHaveBeenCalled();
    }
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects at most once per mount (no render loop)', async () => {
    const view = render(
      <UniverseGate>
        <div>a</div>
      </UniverseGate>
    );
    await waitFor(() => expect(replace).toHaveBeenCalled());
    // Re-render the same mount — the ref short-circuits a second redirect.
    view.rerender(
      <UniverseGate>
        <div>b</div>
      </UniverseGate>
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
