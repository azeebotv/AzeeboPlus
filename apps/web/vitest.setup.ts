import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Ensure localStorage is available (Node.js 22+ disabled it by default)
if (typeof window !== 'undefined') {
  // jsdom doesn't always provide localStorage
  if (!window.localStorage) {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => [...store.keys()][index] ?? null,
    };
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
  }

  // Expose to globalThis for Node.js 22+ where localStorage isn't global
  if (!globalThis.localStorage) {
    Object.defineProperty(globalThis, 'localStorage', {
      get: () => window.localStorage,
    });
  }

  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
}
