import { useEffect, useState } from 'react';
import { webLogger } from '@/lib/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

/**
 * Hook for PWA functionality
 * - Service worker registration
 * - Install prompt handling
 * - Online/offline detection
 */
export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    // Always default to true to avoid SSR hydration mismatch
    // (navigator.onLine is false during SSR but true on client)
    isOnline: true,
    deferredPrompt: null,
  });

  useEffect(() => {
    // Sync actual online status after hydration
    setState((prev) => ({ ...prev, isOnline: navigator.onLine }));

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            webLogger.log('SW registered', registration.scope);
          })
          .catch((error) => {
            webLogger.log('SW registration failed', error);
          });
      });
    }

    // Listen for online/offline events
    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for install prompt (store handler for cleanup)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState((prev) => ({ ...prev, deferredPrompt: e as BeforeInstallPromptEvent }));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setState((prev) => ({ ...prev, isInstalled: true }));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  /**
   * Trigger install prompt
   */
  const install = async () => {
    if (!state.deferredPrompt) {
      return false;
    }

    state.deferredPrompt.prompt();
    const { outcome } = await state.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setState((prev) => ({ ...prev, isInstalled: true, deferredPrompt: null }));
    }

    return outcome === 'accepted';
  };

  return {
    ...state,
    install,
    isPWAEnabled: 'serviceWorker' in navigator,
  };
}
