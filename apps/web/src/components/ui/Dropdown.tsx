'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}
interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (id: string) => void;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, onSelect, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      )
        close();
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const enabledItems = items.filter((i) => !i.disabled && !i.divider);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, enabledItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(enabledItems.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0) {
          onSelect(enabledItems[activeIndex].id);
          close();
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  useEffect(() => {
    if (open && activeIndex >= 0) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
            setActiveIndex(0);
          }
        }}
        className="inline-flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] rounded-lg"
      >
        {trigger}
      </div>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={handleKeyDown}
          className={`absolute z-50 mt-1 w-48 bg-white dark:bg-[#1a0a0a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-1 backdrop-blur-md ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {items.map((item, i) => {
            if (item.divider)
              return (
                <div key={item.id} className="border-t border-gray-100 dark:border-white/10 my-1" />
              );
            const enabledIdx =
              items.slice(0, i + 1).filter((x) => !x.disabled && !x.divider).length - 1;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[enabledIdx] = el;
                }}
                role="menuitem"
                disabled={item.disabled}
                className={`min-h-[44px] w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)] focus-visible:ring-inset ${
                  item.disabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                } ${enabledIdx === activeIndex ? 'bg-gray-100 dark:bg-white/10' : ''}`}
                onClick={() => {
                  if (!item.disabled) {
                    onSelect(item.id);
                    close();
                  }
                }}
                onMouseEnter={() => setActiveIndex(enabledIdx)}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
