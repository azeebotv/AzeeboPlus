'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useUniverses } from '../../hooks/useUniverses';

interface UniverseDropdownProps {
  /** Additional CSS class for the trigger button */
  className?: string;
  /** Compact mode for tight header layouts */
  compact?: boolean;
}

// Token vocabulary for the listbox: the floating panel reuses the same
// near-black frost the header menus use (`--color-az-surface-root` at 97%),
// replacing the legacy forest-green fill, and the brand accent is `az-flame`.
const MENU_ROW_BASE_CLS =
  'px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100 flex items-center gap-3 text-sm outline-none';
const MENU_ROW_SELECTED_CLS = 'bg-az-glass-card text-az-ink';
const MENU_ROW_IDLE_CLS = 'text-az-ink/70 hover:bg-az-glass-card hover:text-az-ink';
const MENU_PANEL_CLS = 'bg-az-surface-root/97 backdrop-blur-[24px]';

export default function UniverseDropdown({
  className = '',
  compact = false,
}: UniverseDropdownProps): React.JSX.Element {
  const { universes, selected, isLoading, error, select, refetch } = useUniverses();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = 'universe-listbox';

  // Reset highlight when opening/closing
  useEffect(() => {
    if (isOpen && selected) {
      const idx = universes.findIndex((u) => u.id === selected.id);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [isOpen, universes, selected]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0) return;
    const item = listRef.current?.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  // Focus the highlighted item when navigating with keyboard
  useEffect(() => {
    if (highlightedIndex >= 0 && isOpen) {
      const item = listRef.current?.children[highlightedIndex] as HTMLElement | undefined;
      item?.focus();
    }
  }, [highlightedIndex, isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const closeAndFocus = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      select(id);
      closeAndFocus();
    },
    [select, closeAndFocus]
  );

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isLoading) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          setIsOpen((prev) => !prev);
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) => (prev < universes.length - 1 ? prev + 1 : 0));
          }
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : universes.length - 1));
          }
          break;
        default:
          break;
      }
    },
    [isLoading, isOpen, universes.length]
  );

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < universes.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : universes.length - 1));
          break;
        case 'Home':
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setHighlightedIndex(universes.length - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < universes.length) {
            handleSelect(universes[highlightedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeAndFocus();
          break;
        case 'Tab':
          setIsOpen(false);
          break;
        default:
          break;
      }
    },
    [highlightedIndex, universes, handleSelect, closeAndFocus]
  );

  // Type-ahead: first letter jumps to matching item
  const typeAheadRef = useRef('');
  const typeAheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleListTypeAhead = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      if (typeAheadTimer.current) clearTimeout(typeAheadTimer.current);
      typeAheadRef.current += e.key.toLowerCase();
      typeAheadTimer.current = setTimeout(() => {
        typeAheadRef.current = '';
      }, 500);

      const match = universes.findIndex((u) =>
        u.name.toLowerCase().startsWith(typeAheadRef.current)
      );
      if (match >= 0) {
        setHighlightedIndex(match);
      }
    },
    [universes]
  );

  const listboxChildren = useMemo(() => {
    if (isLoading) {
      return (
        <li className="px-3 py-4" role="option" aria-disabled="true">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-az-glass-card animate-pulse" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-az-glass-card rounded animate-pulse mb-1" />
              <div className="h-2.5 w-16 bg-az-glass-fill rounded animate-pulse" />
            </div>
          </div>
        </li>
      );
    }

    if (error && universes.length === 0) {
      return (
        <li className="px-3 py-4" role="option" aria-disabled="true">
          <div className="flex flex-col items-center gap-2">
            <p className="az-caption text-az-error-400 text-center">{error}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                refetch();
              }}
              className="text-xs text-az-flame hover:text-az-flame/80 font-medium"
            >
              Retry
            </button>
          </div>
        </li>
      );
    }

    return universes.map((u, idx) => {
      const isSelected = u.id === selected?.id;
      const isHighlighted = idx === highlightedIndex;
      return (
        <li
          key={u.id}
          role="option"
          aria-selected={isSelected}
          id={`universe-option-${u.id}`}
          tabIndex={-1}
          className={`${MENU_ROW_BASE_CLS} ${
            isHighlighted ? MENU_ROW_SELECTED_CLS : MENU_ROW_IDLE_CLS
          }`}
          onClick={() => handleSelect(u.id)}
          onMouseEnter={() => setHighlightedIndex(idx)}
        >
          <span className="text-base flex-shrink-0" aria-hidden="true">
            {u.icon || '\u{1F30D}'}
          </span>
          <span className="flex-1 min-w-0 truncate">{u.name}</span>
          {isSelected && (
            <svg
              className="w-4 h-4 flex-shrink-0 text-az-flame"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </li>
      );
    });
  }, [isLoading, error, universes, selected, highlightedIndex, handleSelect, refetch]);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isLoading) setIsOpen(!isOpen);
        }}
        onKeyDown={handleTriggerKeyDown}
        className={`
          flex items-center gap-2 rounded-lg text-az-ink/80 hover:text-az-ink
          hover:bg-az-glass-card transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-az-flame focus-visible:ring-offset-2 focus-visible:ring-offset-az-surface-root
          ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
        `}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-label="Select universe"
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 && universes[highlightedIndex]
            ? `universe-option-${universes[highlightedIndex].id}`
            : undefined
        }
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-az-ink/20 border-t-az-flame animate-spin" />
            {!compact && <span className="text-az-ink/50">Loading...</span>}
          </div>
        ) : selected ? (
          <>
            <span className="text-base" aria-hidden="true">
              {selected.icon || '\u{1F30D}'}
            </span>
            {!compact && <span className="font-medium">{selected.name}</span>}
          </>
        ) : (
          <>
            <span className="text-base" aria-hidden="true">
              {'\u{1F30D}'}
            </span>
            {!compact && <span className="text-az-ink/50">All</span>}
          </>
        )}
        <svg
          className={`w-3.5 h-3.5 text-az-ink/40 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Listbox */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-56 rounded-az-card border border-az-glass-border shadow-2xl py-1 z-50 ${MENU_PANEL_CLS}`}
        >
          {/* Dropdown header */}
          <div className="px-3 pt-2.5 pb-1.5">
            <p className="az-overline text-az-ink/40">Universe</p>
          </div>

          {error && universes.length > 0 && (
            <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg text-[11px] text-az-warning-400 bg-az-warning-400/10 flex items-center gap-1.5">
              <svg
                className="w-3 h-3 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="truncate">Using fallback data</span>
            </div>
          )}

          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Available universes"
            aria-multiselectable={false}
            tabIndex={-1}
            className="max-h-64 overflow-y-auto px-1.5 pb-1.5 space-y-0.5 focus:outline-none"
            onKeyDown={(e) => {
              handleListKeyDown(e);
              handleListTypeAhead(e);
            }}
          >
            {listboxChildren}
          </ul>
        </div>
      )}
    </div>
  );
}
