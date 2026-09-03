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

let liveRegion: HTMLElement | null = null;

function getLiveRegion(): HTMLElement {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  return liveRegion;
}

export function announceToScreenReader(message: string): void {
  const region = getLiveRegion();
  region.textContent = message;
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: '/',
    handler: () => {
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], input[placeholder*="search" i]'
      );
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

      const dialog = document.createElement('div');
      dialog.className =
        'bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', 'Keyboard shortcuts');

      const header = document.createElement('div');
      header.className = 'flex justify-between items-center mb-4';

      const title = document.createElement('h2');
      title.className = 'text-xl font-bold';
      title.textContent = 'Keyboard Shortcuts';

      const closeBtn = document.createElement('button');
      closeBtn.id = 'close-shortcuts-help';
      closeBtn.className =
        'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.textContent = 'X';

      header.appendChild(title);
      header.appendChild(closeBtn);

      const shortcutsList = document.createElement('div');
      shortcutsList.className = 'space-y-2';

      DEFAULT_SHORTCUTS.filter((s) => s.description).forEach((shortcut) => {
        const keys: string[] = [];
        if (shortcut.ctrlKey) keys.push('Ctrl');
        if (shortcut.altKey) keys.push('Alt');
        if (shortcut.shiftKey) keys.push('Shift');
        if (shortcut.metaKey) keys.push('Cmd');
        keys.push(shortcut.key.toUpperCase());

        const row = document.createElement('div');
        row.className =
          'flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700';

        const desc = document.createElement('span');
        desc.className = 'text-sm';
        desc.textContent = shortcut.description ?? '';

        const kbd = document.createElement('kbd');
        kbd.className = 'px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono';
        kbd.textContent = keys.join(' + ');

        row.appendChild(desc);
        row.appendChild(kbd);
        shortcutsList.appendChild(row);
      });

      dialog.appendChild(header);
      dialog.appendChild(shortcutsList);
      modal.appendChild(dialog);

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
