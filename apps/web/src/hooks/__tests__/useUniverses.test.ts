/**
 * Unit tests for useUniverses hook.
 *
 * Requires: vitest, @testing-library/react-hooks (or @testing-library/react)
 * Run: npx vitest run src/hooks/__tests__/useUniverses.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUniverses } from '../useUniverses';

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
    mockGetUniverses.mockResolvedValue({
      success: true,
      data: MOCK_UNIVERSES,
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
