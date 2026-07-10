'use client';

import { useEffect } from 'react';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

export function KeyboardNavigationProvider({ children }: { children: React.ReactNode }) {
  useKeyboardNavigation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const target = event.target as HTMLElement;
        const isInteractive =
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.getAttribute('role') === 'button' ||
          target.getAttribute('role') === 'tab';

        if (isInteractive) {
          event.preventDefault();
          const container = target.closest(
            '[role="tablist"], [role="listbox"], [role="menu"], .keyboard-navigable'
          );
          if (container) {
            const items = Array.from(
              container.querySelectorAll(
                'button, a, [role="button"], [role="tab"], [role="option"], [role="menuitem"]'
              )
            ) as HTMLElement[];
            const currentIndex = items.indexOf(target);
            const nextIndex =
              event.key === 'ArrowRight'
                ? (currentIndex + 1) % items.length
                : (currentIndex - 1 + items.length) % items.length;
            items[nextIndex]?.focus();
          }
        }
      }

      if (event.key === 'Enter' || event.key === ' ') {
        const target = event.target as HTMLElement;
        if (target.getAttribute('role') === 'button' || target.getAttribute('role') === 'tab') {
          event.preventDefault();
          target.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <>{children}</>;
}
