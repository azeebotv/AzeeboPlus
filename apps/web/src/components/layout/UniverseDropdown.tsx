'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useUniverses } from '../../hooks/useUniverses';

interface UniverseDropdownProps {
  /** Additional CSS class for the trigger button */
  className?: string;
  /** Compact mode for tight header layouts */
  compact?: boolean;
}

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
            <div className="w-6 h-6 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-white/10 rounded animate-pulse mb-1" />
              <div className="h-2.5 w-16 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </li>
      );
    }

    if (error && universes.length === 0) {
      return (
        <li className="px-3 py-4" role="option" aria-disabled="true">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-red-400 text-center">{error}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                refetch();
              }}
              className="text-xs text-[var(--brand-orange)] hover:text-[var(--brand-orange)]/80 font-medium"
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
          className={`
            px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100
            flex items-center gap-3 text-sm outline-none
            ${
              isHighlighted
                ? 'bg-white/10 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }
          `}
          onClick={() => handleSelect(u.id)}
          onMouseEnter={() => setHighlightedIndex(idx)}
        >
          <span className="text-base flex-shrink-0" aria-hidden="true">
            {u.icon || '\u{1F30D}'}
          </span>
          <span className="flex-1 min-w-0 truncate">{u.name}</span>
          {isSelected && (
            <svg
              className="w-4 h-4 flex-shrink-0"
              style={{ color: 'var(--brand-orange, #E8420A)' }}
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
          flex items-center gap-2 rounded-lg text-white/80 hover:text-white
          hover:bg-white/10 transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-forest)]
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
            <div
              className="w-4 h-4 rounded-full border-2 border-white/20 animate-spin"
              style={{ borderTopColor: 'var(--brand-orange, #E8420A)' }}
            />
            {!compact && <span className="text-white/50">Loading...</span>}
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
            {!compact && <span className="text-white/50">All</span>}
          </>
        )}
        <svg
          className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${
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
          className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 shadow-2xl py-1 z-50"
          style={{
            background: 'rgba(13,59,46,0.97)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Dropdown header */}
          <div className="px-3 pt-2.5 pb-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
              Universe
            </p>
          </div>

          {error && universes.length > 0 && (
            <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg text-[11px] text-amber-400 bg-amber-400/10 flex items-center gap-1.5">
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
