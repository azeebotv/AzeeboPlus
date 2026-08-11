'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useFlags } from './FlagsContext';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function resolveTheme(t: Theme): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  if (t === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return t;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isEnabled } = useFlags();
  // web_dark_mode (on by default): when disabled, dark mode is unavailable and
  // the app is forced to light regardless of stored/system preference.
  const darkModeEnabled = isEnabled('web_dark_mode');

  const [theme, setThemeState] = useState<Theme>(() => {
    if (darkModeEnabled) return getInitialTheme();
    return 'light';
  });
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    darkModeEnabled ? resolveTheme(getInitialTheme()) : 'light'
  );
  const themeRef = useRef<Theme>(darkModeEnabled ? getInitialTheme() : 'light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const initialTheme = stored || 'system';
    setThemeState(initialTheme);
    themeRef.current = initialTheme;

    setResolvedTheme(resolveTheme(initialTheme));

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (themeRef.current === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Keep light-only when the dark-mode flag is off, even mid-session.
    if (!darkModeEnabled) {
      themeRef.current = 'light';
      setThemeState('light');
      setResolvedTheme('light');
      document.documentElement.classList.remove('dark');
      return;
    }

    const newResolved = resolveTheme(theme);
    setResolvedTheme(newResolved);

    if (newResolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme, darkModeEnabled]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'system') {
        return resolvedTheme === 'dark' ? 'light' : 'dark';
      }
      return prev === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
