'use client';

import React, { useEffect, useRef } from 'react';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

export function KeyboardNavigationProvider({ children }: { children: React.ReactNode }) {
  useKeyboardNavigation();

  const mainRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      *:focus-visible {
        outline: 2px solid #7c3aed;
        outline-offset: 2px;
        border-radius: 2px;
      }

      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: #7c3aed;
        color: white;
        padding: 8px 16px;
        z-index: 100;
        transition: top 0.2s;
      }

      .skip-link:focus {
        top: 0;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      button:focus-visible,
      a:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible,
      [tabindex]:focus-visible {
        outline: 2px solid #7c3aed;
        outline-offset: 2px;
      }

      [role="button"]:focus-visible,
      [role="tab"]:focus-visible,
      [role="menuitem"]:focus-visible {
        outline: 2px solid #7c3aed;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <>{children}</>;
}
