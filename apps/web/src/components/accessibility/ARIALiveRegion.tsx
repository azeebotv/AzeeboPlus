/**
 * ARIA Live Region Component
 * A-003: Add aria-live="polite" to dynamic content areas
 */
import React, { createContext, useContext, useCallback, useRef } from 'react';

interface LiveRegionContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const LiveRegionContext = createContext<LiveRegionContextType>({ announce: () => {} });

export function useLiveRegion() {
  return useContext(LiveRegionContext);
}

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const ref = priority === 'assertive' ? assertiveRef : politeRef;
    if (ref.current) {
      // Clear then set to force re-announcement
      ref.current.textContent = '';
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.textContent = message;
        }
      });
    }
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {/* Visually hidden live regions for screen readers */}
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
      {children}
    </LiveRegionContext.Provider>
  );
}

/**
 * Hook for announcing status changes to screen readers
 */
export function useAnnounce() {
  const { announce } = useLiveRegion();
  return {
    announceSuccess: (msg: string) => announce(`${msg}`, 'polite'),
    announceError: (msg: string) => announce(`Error: ${msg}`, 'assertive'),
    announceLoading: (msg: string) => announce(`${msg}`, 'polite'),
  };
}
