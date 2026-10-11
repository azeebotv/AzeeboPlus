'use client';

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  updateAvailable: boolean;
  offlineQueueCount: number;
}

export function useServiceWorker(): ServiceWorkerState & {
  register: () => Promise<void>;
  skipWaiting: () => void;
  clearCache: () => void;
  processQueue: () => void;
} {
  const [isSupported] = useState(
    () => typeof window !== 'undefined' && 'serviceWorker' in navigator
  );
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const register = useCallback(async () => {
    if (!isSupported) return;

    if (process.env.NODE_ENV !== 'production') {
      // In development mode, unregister any active service worker to prevent HMR chunk caching desync
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      } catch {
        // Ignore unregister errors in development
      }
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      setRegistration(reg);
      setIsRegistered(true);

      // Check for updates periodically
      const checkUpdate = () => reg.update();
      setInterval(checkUpdate, 60 * 60 * 1000); // Every hour

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'MUTATION_QUEUED') {
          setOfflineQueueCount((prev) => prev + 1);
        }
        if (event.data.type === 'QUEUE_PROCESSED') {
          setOfflineQueueCount(0);
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[SW] Registration failed:', err);
    }
  }, [isSupported]);

  const skipWaiting = useCallback(() => {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    setUpdateAvailable(false);
  }, [registration]);

  const clearCache = useCallback(() => {
    registration?.active?.postMessage({ type: 'CLEAR_CACHE' });
  }, [registration]);

  const processQueue = useCallback(() => {
    if (!registration?.active) return;
    registration.active.postMessage({ type: 'PROCESS_QUEUE' });
    // Trigger background sync if available
    const sync = (registration as unknown as { sync?: { register(tag: string): Promise<void> } })
      .sync;
    if (sync) {
      sync.register('process-mutations').catch(() => {});
    }
  }, [registration]);

  useEffect(() => {
    register();
  }, [register]);

  return {
    isSupported,
    isRegistered,
    updateAvailable,
    offlineQueueCount,
    register,
    skipWaiting,
    clearCache,
    processQueue,
  };
}
