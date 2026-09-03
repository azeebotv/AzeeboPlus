// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import StaleFlagSummary, { type StaleGlobalRow, type StaleUniverseRow } from './StaleFlagSummary';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const globalRows: StaleGlobalRow[] = [
  { key: 'payment_failover_enabled', staleAfter: '2026-01-15T00:00:00Z' },
  { key: 'search_typo_tolerance', staleAfter: '2026-02-01T00:00:00Z' },
];

const universeRows: StaleUniverseRow[] = [
  {
    key: 'voting_enabled',
    universeId: 'u_reality',
    universe: 'Reality',
    staleAfter: '2026-01-20T00:00:00Z',
  },
];

// Matches both the singular and plural chip label ("1 stale flag" vs
// "3 stale flags").
const openMenu = () => fireEvent.click(screen.getByRole('button', { name: /stale flag/i }));

describe('StaleFlagSummary', () => {
  beforeEach(() => navigateMock.mockReset());
  // RTL auto-cleanup relies on a global afterEach; vitest globals are off
  // here, so unmount explicitly between tests.
  afterEach(cleanup);

  it('renders nothing when there are no stale flags', () => {
    const { container } = render(<StaleFlagSummary staleGlobal={[]} staleUniverse={[]} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/stale flag/i)).toBeNull();
  });

  it('shows the combined count and the auto-off pill on the chip', () => {
    render(
      <StaleFlagSummary
        staleGlobal={globalRows}
        staleUniverse={universeRows}
        autoDisabledKeys={new Set(['payment_failover_enabled'])}
      />
    );
    expect(screen.getByText('3 stale flags')).toBeTruthy();
    expect(screen.getByText('1 auto-off')).toBeTruthy();
  });

  it('uses the singular form for a single stale flag', () => {
    render(<StaleFlagSummary staleGlobal={[globalRows[0]!]} staleUniverse={[]} />);
    expect(screen.getByText('1 stale flag')).toBeTruthy();
    expect(screen.queryByText('auto-off')).toBeNull();
  });

  it('builds the full list: both sections, rows, and footer links', () => {
    render(<StaleFlagSummary staleGlobal={globalRows} staleUniverse={universeRows} />);
    // Menu is closed by default.
    expect(screen.queryByText('Stale flags — removal candidates')).toBeNull();

    openMenu();

    // Section headers.
    expect(screen.getByText('Global (2)')).toBeTruthy();
    expect(screen.getByText('Universe (1)')).toBeTruthy();
    // Rows.
    expect(screen.getByText('payment_failover_enabled')).toBeTruthy();
    expect(screen.getByText('search_typo_tolerance')).toBeTruthy();
    expect(screen.getByText('Reality.voting_enabled')).toBeTruthy();
    // Footer quick links.
    expect(screen.getByText('Global candidates →')).toBeTruthy();
    expect(screen.getByText('Universe backlog →')).toBeTruthy();
  });

  it('toggles on chip click and closes on Escape', () => {
    render(<StaleFlagSummary staleGlobal={globalRows} staleUniverse={[]} />);
    const chip = screen.getByRole('button', { name: /stale flags/i });

    fireEvent.click(chip);
    expect(screen.getByText('Stale flags — removal candidates')).toBeTruthy();

    fireEvent.click(chip);
    expect(screen.queryByText('Stale flags — removal candidates')).toBeNull();

    fireEvent.click(chip);
    expect(screen.getByText('Stale flags — removal candidates')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Stale flags — removal candidates')).toBeNull();
  });

  it('closes on outside mousedown', () => {
    render(<StaleFlagSummary staleGlobal={globalRows} staleUniverse={[]} />);
    openMenu();
    expect(screen.getByText('Stale flags — removal candidates')).toBeTruthy();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Stale flags — removal candidates')).toBeNull();
  });

  it('clicks inside the menu do not close it', () => {
    render(<StaleFlagSummary staleGlobal={globalRows} staleUniverse={[]} />);
    openMenu();
    // A click on the dropdown header (inside the menu) must keep it open.
    fireEvent.mouseDown(screen.getByText('Stale flags — removal candidates'));
    expect(screen.getByText('Stale flags — removal candidates')).toBeTruthy();
  });

  it('deep-links to the specific global flag and closes the menu', () => {
    render(<StaleFlagSummary staleGlobal={globalRows} staleUniverse={[]} />);
    openMenu();
    fireEvent.click(screen.getByText('payment_failover_enabled'));

    expect(navigateMock).toHaveBeenCalledWith(
      '/feature-flags/global?stale=1&flag=payment_failover_enabled'
    );
    expect(screen.queryByText('Stale flags — removal candidates')).toBeNull();
  });

  it('deep-links to the specific universe flag (with universe id) and closes', () => {
    render(<StaleFlagSummary staleGlobal={[]} staleUniverse={universeRows} />);
    openMenu();
    fireEvent.click(screen.getByText('Reality.voting_enabled'));

    expect(navigateMock).toHaveBeenCalledWith(
      '/feature-flags?stale=1&flag=voting_enabled&universe=u_reality'
    );
    expect(screen.queryByText('Stale flags — removal candidates')).toBeNull();
  });

  it('footer links navigate to the stale-filtered lists', () => {
    render(<StaleFlagSummary staleGlobal={globalRows} staleUniverse={universeRows} />);
    openMenu();
    fireEvent.click(screen.getByText('Global candidates →'));
    expect(navigateMock).toHaveBeenCalledWith('/feature-flags/global?stale=1#stale');

    openMenu();
    fireEvent.click(screen.getByText('Universe backlog →'));
    expect(navigateMock).toHaveBeenCalledWith('/feature-flags?stale=1#stale');
  });

  it('marks only auto-disabled rows with the auto-off tag', () => {
    render(
      <StaleFlagSummary
        staleGlobal={globalRows}
        staleUniverse={[]}
        autoDisabledKeys={new Set(['search_typo_tolerance'])}
      />
    );
    openMenu();

    expect(screen.getAllByText('auto-off')).toHaveLength(1);
    const autoRow = screen.getByText('search_typo_tolerance').closest('button');
    const cleanRow = screen.getByText('payment_failover_enabled').closest('button');
    expect(autoRow?.textContent).toContain('auto-off');
    expect(cleanRow?.textContent).not.toContain('auto-off');
  });
});
