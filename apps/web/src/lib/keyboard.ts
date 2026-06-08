export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  element?: string;
}

const registeredShortcuts: Map<string, KeyboardShortcut> = new Map();

export function registerKeyboardShortcut(shortcut: KeyboardShortcut): () => void {
  const id = `${shortcut.key}-${shortcut.ctrlKey}-${shortcut.altKey}-${shortcut.shiftKey}-${shortcut.metaKey}`;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      event.key === shortcut.key &&
      event.ctrlKey === (shortcut.ctrlKey || false) &&
      event.altKey === (shortcut.altKey || false) &&
      event.shiftKey === (shortcut.shiftKey || false) &&
      event.metaKey === (shortcut.metaKey || false)
    ) {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isInput =
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox';

      if (isInput && !shortcut.ctrlKey && !shortcut.altKey && !shortcut.metaKey) {
        return;
      }

      event.preventDefault();
      shortcut.handler(event);
    }
  };

  registeredShortcuts.set(id, shortcut);
  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    registeredShortcuts.delete(id);
  };
}

export function focusElement(selector: string): void {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    element.focus();
  }
}

export function focusNextElement(currentElement: HTMLElement, direction: 'next' | 'previous' = 'next'): void {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  const focusableElements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelectors));
  const currentIndex = focusableElements.indexOf(currentElement);

  if (currentIndex === -1) return;

  let nextIndex: number;
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % focusableElements.length;
  } else {
    nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
  }

  focusableElements[nextIndex]?.focus();
}

export function trapFocus(container: HTMLElement): () => void {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    if (event.key === 'Escape') {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  firstFocusable?.focus();

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

export function makeFocusable(element: HTMLElement, tabIndex: number = 0): void {
  element.setAttribute('tabindex', tabIndex.toString());
}

export function addKeyboardRole(element: HTMLElement, role: string): void {
  element.setAttribute('role', role);
}

export function addKeyboardLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

export function addKeyboardDescription(element: HTMLElement, description: string): void {
  element.setAttribute('aria-describedby', description);
}

export function announceToScreenReader(message: string): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: '/',
    handler: () => {
      const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="search" i]');
      searchInput?.focus();
    },
    description: 'Focus search input',
  },
  {
    key: 'Escape',
    handler: () => {
      const activeElement = document.activeElement as HTMLElement;
      activeElement?.blur();
    },
    description: 'Blur current element',
  },
  {
    key: 'g',
    altKey: true,
    handler: () => {
      window.location.href = '/';
    },
    description: 'Go to home page',
  },
  {
    key: 'h',
    handler: () => {
      window.location.href = '/';
    },
    description: 'Navigate to home',
  },
  {
    key: 'b',
    handler: () => {
      window.location.href = '/browse';
    },
    description: 'Navigate to browse',
  },
  {
    key: 'l',
    handler: () => {
      window.location.href = '/library';
    },
    description: 'Navigate to library',
  },
  {
    key: 'w',
    handler: () => {
      window.location.href = '/wallet';
    },
    description: 'Navigate to wallet',
  },
  {
    key: 's',
    handler: () => {
      window.location.href = '/settings';
    },
    description: 'Navigate to settings',
  },
  {
    key: '?',
    shiftKey: true,
    handler: () => {
      const existing = document.getElementById('keyboard-shortcuts-help');
      if (existing) {
        existing.remove();
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'keyboard-shortcuts-help';
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Keyboard Shortcuts</h2>
            <button id="close-shortcuts-help" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close">
              ✕
            </button>
          </div>
          <div class="space-y-2">
            ${DEFAULT_SHORTCUTS.filter(s => s.description).map(shortcut => {
              const keys = [];
              if (shortcut.ctrlKey) keys.push('Ctrl');
              if (shortcut.altKey) keys.push('Alt');
              if (shortcut.shiftKey) keys.push('Shift');
              if (shortcut.metaKey) keys.push('Cmd');
              keys.push(shortcut.key.toUpperCase());
              return `
                <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span class="text-sm">${shortcut.description}</span>
                  <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">${keys.join(' + ')}</kbd>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#close-shortcuts-help')?.addEventListener('click', () => {
        modal.remove();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    },
    description: 'Show keyboard shortcuts help',
  },
];
