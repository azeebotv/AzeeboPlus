/**
 * WCAG 2.1 AA Accessibility Utilities
 *
 * Provides utilities for:
 * - Focus management
 * - Screen reader announcements
 * - Keyboard navigation
 * - Color contrast checking
 * - Touch target validation
 */

// ---------------------------------------------------------------------------
// Focus Management
// ---------------------------------------------------------------------------

/**
 * Trap focus within a container element (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to the previously focused element
 */
let previousFocus: HTMLElement | null = null;

export function saveFocus(): void {
  previousFocus = document.activeElement as HTMLElement;
}

export function restoreFocus(): void {
  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
    previousFocus = null;
  }
}

// ---------------------------------------------------------------------------
// Screen Reader Announcements
// ---------------------------------------------------------------------------

/**
 * Announce a message to screen readers via a live region
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return;

  const existing = document.getElementById(`sr-announce-${priority}`);
  if (existing) {
    existing.textContent = message;
    return;
  }

  const el = document.createElement('div');
  el.id = `sr-announce-${priority}`;
  el.setAttribute('aria-live', priority);
  el.setAttribute('aria-atomic', 'true');
  el.className = 'sr-only';
  el.textContent = message;

  document.body.appendChild(el);

  // Clean up after announcement is read
  setTimeout(() => {
    el.remove();
  }, 1000);
}

// ---------------------------------------------------------------------------
// Keyboard Navigation
// ---------------------------------------------------------------------------

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

/**
 * Register keyboard shortcuts
 */
export function registerKeyboardShortcuts(shortcuts: KeyboardShortcut[]): () => void {
  const handler = (e: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch &&
        shiftMatch &&
        altMatch
      ) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

// ---------------------------------------------------------------------------
// Color Contrast
// ---------------------------------------------------------------------------

/**
 * Calculate relative luminance of a color
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color pair meets WCAG AA contrast requirements
 * - Normal text: 4.5:1
 * - Large text: 3:1
 */
export function meetsContrastAA(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// ---------------------------------------------------------------------------
// Touch Targets
// ---------------------------------------------------------------------------

/**
 * Check if an element meets WCAG 2.1 AA minimum touch target size (44x44 CSS pixels)
 */
export function meetsTouchTargetSize(
  width: number,
  height: number,
  minWidth = 44,
  minHeight = 44
): boolean {
  return width >= minWidth && height >= minHeight;
}

// ---------------------------------------------------------------------------
// ARIA Helpers
// ---------------------------------------------------------------------------

/**
 * Generate accessible label for icon-only buttons
 */
export function iconButtonLabel(label: string, isPressed?: boolean): string {
  return isPressed ? `${label} (active)` : label;
}

/**
 * Generate accessible description for complex UI
 */
export function generateAriaDescription(parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join('. ');
}
