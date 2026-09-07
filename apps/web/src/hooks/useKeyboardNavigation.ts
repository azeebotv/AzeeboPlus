'use client';

import { useEffect, useCallback, useState } from 'react';

export interface KeyboardNavigationOptions {
  itemCount?: number;
  initialIndex?: number;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    itemCount,
    initialIndex = 0,
    onSelect,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    enabled = true,
  } = options;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't handle keyboard events when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case 'Escape':
          onEscape?.();
          break;
        case 'Enter':
          onEnter?.();
          onSelect?.(currentIndex);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setIsNavigating(true);
          onArrowUp?.();
          if (itemCount !== undefined) {
            setCurrentIndex((prev) => Math.max(prev - 1, 0));
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          setIsNavigating(true);
          onArrowDown?.();
          if (itemCount !== undefined) {
            setCurrentIndex((prev) => Math.min(prev + 1, itemCount - 1));
          }
          break;
        case 'ArrowLeft':
          setIsNavigating(true);
          onArrowLeft?.();
          if (itemCount !== undefined) {
            setCurrentIndex((prev) => Math.max(prev - 1, 0));
          }
          break;
        case 'ArrowRight':
          setIsNavigating(true);
          onArrowRight?.();
          if (itemCount !== undefined) {
            setCurrentIndex((prev) => Math.min(prev + 1, itemCount - 1));
          }
          break;
        case 'Tab':
          onTab?.(event);
          break;
      }
    },
    [
      enabled,
      currentIndex,
      itemCount,
      onEscape,
      onEnter,
      onSelect,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    currentIndex,
    isNavigating,
    handleKeyDown,
    setIndex: setCurrentIndex,
  };
}

// Hook for managing focus within a list
export function useListNavigation(_itemCount: number, onSelect: (index: number) => void) {
  const getFocusableElements = useCallback(() => {
    return document.querySelectorAll('[data-list-item]');
  }, []);

  const handleArrowUp = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = Array.from(elements).findIndex((el) => el === document.activeElement);
    const newIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    (elements[newIndex] as HTMLElement)?.focus();
  }, [getFocusableElements]);

  const handleArrowDown = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = Array.from(elements).findIndex((el) => el === document.activeElement);
    const newIndex = currentIndex >= elements.length - 1 ? 0 : currentIndex + 1;
    (elements[newIndex] as HTMLElement)?.focus();
  }, [getFocusableElements]);

  const handleEnter = useCallback(() => {
    const elements = getFocusableElements();
    const currentIndex = Array.from(elements).findIndex((el) => el === document.activeElement);
    if (currentIndex >= 0) {
      onSelect(currentIndex);
    }
  }, [getFocusableElements, onSelect]);

  useKeyboardNavigation({
    onArrowUp: handleArrowUp,
    onArrowDown: handleArrowDown,
    onEnter: handleEnter,
  });

  return {
    getItemProps: (index: number) => ({
      'data-list-item': true,
      tabIndex: index === 0 ? 0 : -1,
    }),
  };
}
