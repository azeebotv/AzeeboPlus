import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useKeyboardNavigation());
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isNavigating).toBe(false);
  });

  it('handles arrow key navigation', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5 }));

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.currentIndex).toBe(1);

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.currentIndex).toBe(2);
  });

  it('handles left arrow navigation', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5, initialIndex: 2 }));

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it('does not go below 0', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5 }));

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it('does not go above itemCount - 1', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3 }));

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(result.current.currentIndex).toBe(2);
  });

  it('calls onSelect when Enter is pressed', () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5, onSelect }));

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn();
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5, onEscape }));

    act(() => {
      result.current.handleKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onEscape).toHaveBeenCalled();
  });

  it('can set index programmatically', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5 }));

    act(() => {
      result.current.setIndex(3);
    });
    expect(result.current.currentIndex).toBe(3);
  });
});
