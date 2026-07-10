/**
 * Unit tests for UniverseDropdown component.
 *
 * Requires: vitest, @testing-library/react, @testing-library/user-event
 * Run: npx vitest run src/components/layout/__tests__/UniverseDropdown.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import UniverseDropdown from '../UniverseDropdown';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock the hook
vi.mock('../../../hooks/useUniverses', () => ({
  useUniverses: vi.fn(),
}));

import { useUniverses } from '../../../hooks/useUniverses';
const mockUseUniverses = vi.mocked(useUniverses);

const MOCK_UNIVERSES = [
  { id: 'movie', name: 'Movies', icon: '\uD83C\uDFAC' },
  { id: 'music', name: 'Music', icon: '\uD83C\uDFB5' },
  { id: 'comedy', name: 'Comedy', icon: '\uD83D\uDE02' },
];

function setup(overrides = {}) {
  const defaults = {
    universes: MOCK_UNIVERSES,
    selected: MOCK_UNIVERSES[0],
    isLoading: false,
    error: null,
    select: vi.fn(),
    refetch: vi.fn(),
    getUniverse: vi.fn(),
    isUniverseEnabled: vi.fn().mockReturnValue(true),
    hasFeature: vi.fn().mockReturnValue(false),
  };
  mockUseUniverses.mockReturnValue({ ...defaults, ...overrides });
  return defaults;
}

describe('UniverseDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('shows loading spinner when loading', () => {
      setup({ isLoading: true, universes: [], selected: null });
      render(<UniverseDropdown />);

      // Should show the spinning border element
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('shows selected universe name and icon', () => {
      setup();
      render(<UniverseDropdown />);

      expect(screen.getByText('Movies')).toBeTruthy();
      expect(screen.getByText('\uD83C\uDFAC')).toBeTruthy();
    });

    it('shows "All" when no universe is selected', () => {
      setup({ selected: null });
      render(<UniverseDropdown />);

      expect(screen.getByText('All')).toBeTruthy();
    });

    it('shows error toast when using fallback data', async () => {
      setup({ error: 'Network error' });
      render(<UniverseDropdown />);

      // Open the dropdown so the error toast inside the listbox is visible
      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      expect(screen.getByText('Using fallback data')).toBeTruthy();
    });

    it('hides name in compact mode', () => {
      setup();
      render(<UniverseDropdown compact />);

      expect(screen.queryByText('Movies')).toBeNull();
    });

    it('disables trigger button when loading', () => {
      setup({ isLoading: true, universes: [], selected: null });
      render(<UniverseDropdown />);

      const button = screen.getByRole('combobox');
      expect(button).toBeDisabled();
    });
  });

  describe('opening and closing', () => {
    it('opens dropdown on click', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });
      expect(screen.getByText('Universe')).toBeTruthy(); // header
    });

    it('closes dropdown on second click', async () => {
      setup();
      render(<UniverseDropdown />);

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBeNull();
      });
    });

    it('closes on Escape key', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBeNull();
      });

      // Focus should return to trigger
      expect(document.activeElement).toBe(screen.getByRole('combobox'));
    });

    it('closes on outside click', async () => {
      setup();
      render(
        <div>
          <span data-testid="outside">Outside</span>
          <UniverseDropdown />
        </div>
      );

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      fireEvent.mouseDown(screen.getByTestId('outside'));
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBeNull();
      });
    });
  });

  describe('selection', () => {
    it('calls select with the chosen universe id', async () => {
      const select = vi.fn();
      setup({ select });
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const option = screen.getByText('Music').closest('[role="option"]');
      fireEvent.click(option!);

      expect(select).toHaveBeenCalledWith('music');
    });

    it('closes dropdown after selection', async () => {
      const select = vi.fn();
      setup({ select });
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const option = screen.getByText('Music').closest('[role="option"]');
      fireEvent.click(option!);

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBeNull();
      });
    });

    it('marks selected option with check icon', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const listbox = screen.getByRole('listbox');
      const movieOption = within(listbox).getByText('Movies').closest('[role="option"]');
      expect(movieOption?.getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('keyboard navigation', () => {
    it('opens on Enter key', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });
    });

    it('opens on Space key', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.keyDown(screen.getByRole('combobox'), { key: ' ' });
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });
    });

    it('opens on ArrowDown', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });
    });

    it('selects highlighted item on Enter in listbox', async () => {
      const select = vi.fn();
      setup({ select });
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // highlight second item
      fireEvent.keyDown(listbox, { key: 'Enter' }); // select it

      expect(select).toHaveBeenCalledWith('music');
    });

    it('navigates with ArrowUp past first item wraps to last', async () => {
      const select = vi.fn();
      setup({ select });
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const listbox = screen.getByRole('listbox');
      // ArrowDown from default (first item) → second
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      // ArrowUp from second → first
      fireEvent.keyDown(listbox, { key: 'ArrowUp' });
      // ArrowUp from first → should wrap to last
      fireEvent.keyDown(listbox, { key: 'ArrowUp' });
      fireEvent.keyDown(listbox, { key: 'Enter' });

      expect(select).toHaveBeenCalledWith('comedy');
    });

    it('Home key jumps to first item', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'ArrowDown' });
      fireEvent.keyDown(listbox, { key: 'Home' });

      const firstOption = within(listbox).getByText('Movies').closest('[role="option"]');
      expect(document.activeElement).toBe(firstOption);
    });

    it('End key jumps to last item', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'End' });

      const lastOption = screen.getByText('Comedy').closest('[role="option"]');
      expect(document.activeElement).toBe(lastOption);
    });

    it('Tab closes dropdown', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeTruthy();
      });

      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'Tab' });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).toBeNull();
      });
    });
  });

  describe('ARIA attributes', () => {
    it('trigger has correct combobox attributes', () => {
      setup();
      render(<UniverseDropdown />);

      const trigger = screen.getByRole('combobox');
      expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
      expect(trigger.getAttribute('aria-label')).toBe('Select universe');
    });

    it('trigger aria-expanded reflects open state', async () => {
      setup();
      render(<UniverseDropdown />);

      const trigger = screen.getByRole('combobox');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(trigger);
      await waitFor(() => {
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
      });
    });

    it('listbox has correct role and label', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeTruthy();
        expect(listbox.getAttribute('aria-label')).toBe('Available universes');
      });
    });

    it('options have role="option" and aria-selected', async () => {
      setup();
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBe(3);
        expect(options[0].getAttribute('aria-selected')).toBe('true');
        expect(options[1].getAttribute('aria-selected')).toBe('false');
      });
    });
  });

  describe('retry', () => {
    it('shows retry button when error and no universes', async () => {
      setup({ error: 'Failed', universes: [] });
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeTruthy();
      });

      const retryBtn = screen.getByText('Retry');
      expect(retryBtn).toBeTruthy();
    });

    it('retry button calls refetch', async () => {
      const refetch = vi.fn();
      setup({ error: 'Failed', universes: [], refetch });
      render(<UniverseDropdown />);

      fireEvent.click(screen.getByRole('combobox'));
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Retry'));
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });
});
