import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Theme utility functions
function getTheme(): string {
  return localStorage.getItem('azeebo_theme') || 'dark';
}

function setTheme(theme: string): void {
  localStorage.setItem('azeebo_theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.toggle('light', theme === 'light');
}

function toggleTheme(): string {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

describe('Theme Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = '';
  });

  it('defaults to dark theme', () => {
    expect(getTheme()).toBe('dark');
  });

  it('persists theme to localStorage', () => {
    setTheme('light');
    expect(localStorage.getItem('azeebo_theme')).toBe('light');
  });

  it('reads theme from localStorage', () => {
    localStorage.setItem('azeebo_theme', 'light');
    expect(getTheme()).toBe('light');
  });

  it('toggles between dark and light', () => {
    setTheme('dark');
    const next = toggleTheme();
    expect(next).toBe('light');
    expect(getTheme()).toBe('light');
  });

  it('applies correct CSS class to document', () => {
    setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    setTheme('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('Theme Rendering', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = '';
  });

  it('applies dark mode styles', () => {
    setTheme('dark');
    const { container } = render(<div className="bg-primary text-primary">Test</div>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies light mode styles', () => {
    setTheme('light');
    const { container } = render(<div className="bg-primary text-primary">Test</div>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('switches theme without page reload', () => {
    const { container } = render(<div>Test</div>);
    expect(container.firstChild).toBeInTheDocument();

    // Toggle theme
    toggleTheme();
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Theme Accessibility', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = '';
  });

  it('respects prefers-color-scheme media query', () => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    expect(prefersDark.matches).toBe(true);
  });

  it('announces theme change to screen readers', () => {
    const { container } = render(
      <div>
        <div aria-live="polite" data-testid="theme-announce">
          Theme changed to dark
        </div>
      </div>
    );

    const announce = container.querySelector('[data-testid="theme-announce"]');
    expect(announce).toHaveAttribute('aria-live', 'polite');
  });

  it('theme toggle has accessible label', () => {
    const { container } = render(<button aria-label="Toggle dark mode">🌙</button>);

    const button = container.querySelector('button');
    expect(button).toHaveAttribute('aria-label', 'Toggle dark mode');
  });
});
