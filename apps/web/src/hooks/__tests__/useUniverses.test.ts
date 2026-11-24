/**
 * Unit tests for useUniverses hook.
 *
 * Requires: vitest, @testing-library/react-hooks (or @testing-library/react)
 * Run: npx vitest run src/hooks/__tests__/useUniverses.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUniverses, useUniversesQuery } from '../useUniverses';

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

// Mock the API module
vi.mock('../../lib/api', () => ({
  api: {
    universe: {
      getUniverses: vi.fn(),
    },
  },
}));

// Flag state used by the hook's sentinel visibility filter. Default:
// bootstrap ready, every universe enabled (unless a test overrides).
const flagState = {
  ready: true,
  universeEnabled: vi.fn((_name: string) => true),
};
vi.mock('../../context/FlagsContext', () => ({
  useFlags: () => ({
    ready: flagState.ready,
    universeEnabled: flagState.universeEnabled,
  }),
}));

import { api } from '../../lib/api';

const mockGetUniverses = vi.mocked(api.universe.getUniverses);

const MOCK_UNIVERSES = [
  { id: 'movie', name: 'Movies', description: 'Films', icon: '\uD83C\uDFAC', contentCount: 100 },
  { id: 'music', name: 'Music', description: 'Audio', icon: '\uD83C\uDFB5', contentCount: 50 },
  { id: 'comedy', name: 'Comedy', description: 'Laughs', icon: '\uD83D\uDE02', contentCount: 30 },
];

describe('useUniverses', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    flagState.ready = true;
    flagState.universeEnabled = vi.fn((_name: string) => true);
    mockGetUniverses.mockResolvedValue({
      success: true,
      data: MOCK_UNIVERSES,
    });
  });

  describe('universe visibility sentinels', () => {
    it('hides a universe whose sentinel evaluates disabled', async () => {
      flagState.universeEnabled = vi.fn((name: string) => name !== 'comedy');
      const { result } = renderHook(() => useUniverses());
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.universes.map((u) => u.id)).toEqual(['movie', 'music']);
      expect(flagState.universeEnabled).toHaveBeenCalledWith('comedy');
      expect(flagState.universeEnabled).toHaveBeenCalledWith('movie');
    });

    it('shows everything before bootstrap is ready (never blank on load)', async () => {
      flagState.ready = false;
      flagState.universeEnabled = vi.fn(() => false);
      const { result } = renderHook(() => useUniverses());
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.universes).toHaveLength(3);
      expect(flagState.universeEnabled).not.toHaveBeenCalled();
    });

    it('re-filters when the sentinel flips off without a refetch', async () => {
      const { result, rerender } = renderHook(() => useUniverses());
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      expect(result.current.universes).toHaveLength(3);

      // FlagsContext hands a new universeEnabled callback whenever the flag
      // map updates — the memo re-runs and comedy disappears.
      flagState.universeEnabled = vi.fn((name: string) => name !== 'comedy');
      rerender();
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.universes.map((u) => u.id)).toEqual(['movie', 'music']);
    });

    it('isUniverseEnabled and getUniverse respect the sentinel filter', async () => {
      flagState.universeEnabled = vi.fn((name: string) => name !== 'comedy');
      const { result } = renderHook(() => useUniverses());
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.isUniverseEnabled('comedy')).toBe(false);
      expect(result.current.getUniverse('movie')).toBeDefined();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial loading', () => {
    it('starts in loading state', () => {
      // Make the API call hang
      mockGetUniverses.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useUniverses());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.universes).toEqual([]);
      expect(result.current.selected).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('loads universes from API and selects the first by default', async () => {
      const { result } = renderHook(() => useUniverses());

      await act(async () => {
        // Wait for the promise to resolve
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.universes).toHaveLength(3);
      expect(result.current.selected?.id).toBe('movie');
    });

    it('restores previously selected universe from localStorage', async () => {
      localStorage.setItem('azeebo:selected_universe', 'music');

      const { result } = renderHook(() => useUniverses());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.selected?.id).toBe('music');
    });

    it('ignores invalid stored id and defaults to first', async () => {
      localStorage.setItem('azeebo:selected_universe', 'nonexistent');

      const { result } = renderHook(() => useUniverses());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.selected?.id).toBe('movie');
    });
  });

  describe('caching', () => {
    it('uses cached data on subsequent calls', async () => {
      const { result: _result } = renderHook(() => useUniverses());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockGetUniverses).toHaveBeenCalledTimes(1);

      // Render again — should hit cache
      const { result: result2 } = renderHook(() => useUniverses());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockGetUniverses).toHaveBeenCalledTimes(1);
      expect(result2.current.universes).toHaveLength(3);
    });

    it('ignores expired cache', async () => {
      // Manually set expired cache
      const expiredCache = {
        data: MOCK_UNIVERSES,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      };
      localStorage.setItem('azeebo:universes_cache', JSON.stringify(expiredCache));

      const { result } = renderHook(() => useUniverses());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Should have called API since cache expired
      expect(mockGetUniverses).toHaveBeenCalledTimes(1);
      expect(result.current.universes).toHaveLength(3);
    });
  });

  describe('select', () => {
    it('changes selection and persists to localStorage', async () => {
      const { result } = renderHook(() => useUniverses());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.selected?.id).toBe('movie');

      act(() => {
        result.current.select('music');
      });

      expect(result.current.selected?.id).toBe('music');
      expect(localStorage.getItem('azeebo:selected_universe')).toBe('music');
    });
  });

  describe('error handling', () => {
    it('uses fallback universes when API fails', async () => {
      mockGetUniverses.mockResolvedValue({
        success: false,
        data: [],
        message: 'Server error',
      });

      const { result } = renderHook(() => useUniverses());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.error).toBe('Server error');
      expect(result.current.universes.length).toBeGreaterThan(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('uses fallback universes on network error', async () => {
      mockGetUniverses.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUniverses());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(result.current.error).toBe('Network error. Showing default list.');
      expect(result.current.universes.length).toBeGreaterThan(0);
    });
  });

  describe('refetch', () => {
    it('clears cache and re-fetches from API', async () => {
      const { result } = renderHook(() => useUniverses());

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockGetUniverses).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.current.refetch();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockGetUniverses).toHaveBeenCalledTimes(2);
      // Cache should have been cleared
      expect(localStorage.getItem('azeebo:universes_cache')).not.toBeNull();
    });
  });
});

// ============================================================================
// useUniversesQuery — non-array payload regression guard
//
// Regression: universe landing pages (`/sports`, `/comedy`, `/games`, …) call
// `_universesQuery_data.find(...)`. When the API returned a non-array payload
// (`{success:true, data:{…}}`), React Query exposed that object as `data` and
// `.find` threw, crashing the page into the error boundary. The hook must
// convert ANY non-array payload into a query *error* instead.
// ============================================================================
describe('useUniversesQuery non-array payload guard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  it('passes array payloads through unchanged (guard does not over-fire)', async () => {
    mockGetUniverses.mockResolvedValue({ success: true, data: MOCK_UNIVERSES });

    const { result } = renderHook(() => useUniversesQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(3);
    // The exact call shape the landing pages make — must be safe
    expect(result.current.data?.find((u) => u.id === 'movie')?.name).toBe('Movies');
  });

  it.each([
    ['a plain object', { success: true, data: { id: 'movie', name: 'Movies' } }],
    ['a string', { success: true, data: 'unexpected' }],
    ['null', { success: true, data: null }],
  ])('treats %s as a query error, never as .find-callable data', async (_label, payload) => {
    mockGetUniverses.mockResolvedValue(payload as never);

    const { result } = renderHook(() => useUniversesQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isSuccess).toBe(false);
    // The regression assertion: while in error state, `data` must be
    // undefined so `_universesQuery_data?.find(...)` short-circuits safely
    // instead of invoking .find on a non-array.
    expect(result.current.data).toBeUndefined();
  });

  it('uses the default error message when the payload carries none', async () => {
    mockGetUniverses.mockResolvedValue({ success: true, data: {} } as never);

    const { result } = renderHook(() => useUniversesQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Failed to load universes');
    expect(result.current.data).toBeUndefined();
  });

  it('surfaces the API message when one is present', async () => {
    mockGetUniverses.mockResolvedValue({ success: false, message: 'upstream exploded' });

    const { result } = renderHook(() => useUniversesQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect((result.current.error as Error).message).toBe('upstream exploded');
    expect(result.current.data).toBeUndefined();
  });
});
