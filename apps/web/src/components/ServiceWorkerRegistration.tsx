'use client';

import { useEffect } from 'react';

// SyncManager type for background sync
interface SyncManagerCompat {
  register(tag: string): Promise<void>;
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let onlineHandler: (() => void) | null = null;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Check for updates on visibility change
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });

        // Process offline queue when coming back online
        onlineHandler = () => {
          if (registration.active) {
            registration.active.postMessage({ type: 'PROCESS_QUEUE' });
            // Trigger background sync if available
            const sync = (registration as unknown as { sync?: SyncManagerCompat }).sync;
            if (sync) {
              sync.register('process-mutations').catch(() => {});
            }
          }
        };

        window.addEventListener('online', onlineHandler);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[SW] Registration failed:', err);
        }
      });

    return () => {
      if (onlineHandler) {
        window.removeEventListener('online', onlineHandler);
      }
    };
  }, []);

  return null;
}
