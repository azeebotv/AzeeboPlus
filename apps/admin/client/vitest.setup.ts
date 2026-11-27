import { vi } from 'vitest';

// Node 22+ does not expose localStorage, and this jsdom build doesn't provide
// it either, so tests that exercise persistence paths (ops window choice, the
// cookie/localStorage mirror in lib/api/base.ts) threw
// "Cannot read properties of undefined". Same shim apps/web uses, so the two
// suites behave alike.
if (typeof window !== 'undefined') {
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

  if (!globalThis.localStorage) {
    Object.defineProperty(globalThis, 'localStorage', {
      get: () => window.localStorage,
    });
  }

  Element.prototype.scrollIntoView = vi.fn();
}
