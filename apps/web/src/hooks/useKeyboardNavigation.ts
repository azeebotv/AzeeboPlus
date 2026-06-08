'use client';

import { useEffect, useCallback } from 'react';
import { registerKeyboardShortcut, KeyboardShortcut, DEFAULT_SHORTCUTS } from '../lib/keyboard';

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[] = []) {
  const registerDefaults = useCallback(() => {
    const cleanups: Array<() => void> = [];

    DEFAULT_SHORTCUTS.forEach((shortcut) => {
      const cleanup = registerKeyboardShortcut(shortcut);
      cleanups.push(cleanup);
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  const registerCustom = useCallback(
    (customShortcuts: KeyboardShortcut[]) => {
      const cleanups: Array<() => void> = [];

      customShortcuts.forEach((shortcut) => {
        const cleanup = registerKeyboardShortcut(shortcut);
        cleanups.push(cleanup);
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    },
    []
  );

  useEffect(() => {
    const defaultCleanup = registerDefaults();
    const customCleanup = registerCustom(shortcuts);

    return () => {
      defaultCleanup();
      customCleanup();
    };
  }, [registerDefaults, registerCustom, shortcuts]);
}
