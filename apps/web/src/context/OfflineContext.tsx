'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { useNetwork } from '../components/ui/OfflineIndicator';

interface OfflineContextValue {
  isOnline: boolean;
  isSupported: boolean;
  isRegistered: boolean;
  updateAvailable: boolean;
  offlineQueueCount: number;
  skipWaiting: () => void;
  clearCache: () => void;
  processQueue: () => void;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  isSupported: false,
  isRegistered: false,
  updateAvailable: false,
  offlineQueueCount: 0,
  skipWaiting: () => {},
  clearCache: () => {},
  processQueue: () => {},
});

export function OfflineProvider({ children }: { children: ReactNode }) {
  const sw = useServiceWorker();
  // AUD-62: NetworkProvider (mounted as this provider's parent in the root
  // layout) owns the single navigator.onLine listener for the whole app.
  const { isOnline } = useNetwork();

  return (
    <OfflineContext.Provider value={{ ...sw, isOnline }}>
      {children}
      {/* Update available banner */}
      {sw.updateAvailable && (
        <div
          className="fixed bottom-4 right-4 z-50 az-glass p-4 max-w-sm"
          style={{
            border: '1px solid color-mix(in srgb, var(--color-az-scarlet) 30%, transparent)',
          }}
        >
          <p className="text-sm text-white mb-3">A new version of Azeebo+ is available.</p>
          <div className="flex gap-2">
            <button
              onClick={sw.skipWaiting}
              className="flex-1 text-xs font-medium py-2 px-3 rounded-lg text-white"
              style={{ background: 'var(--color-az-flame)' }}
            >
              Update Now
            </button>
            <button
              onClick={sw.skipWaiting}
              className="text-xs py-2 px-3 rounded-lg text-white/60 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {/* Queue indicator */}
      {sw.offlineQueueCount > 0 && isOnline && (
        <div className="fixed bottom-4 left-4 z-50 az-glass p-3 text-xs text-white/80">
          <span className="inline-block w-2 h-2 rounded-full bg-az-warning-500 mr-2 animate-pulse" />
          Syncing {sw.offlineQueueCount} queued action{sw.offlineQueueCount > 1 ? 's' : ''}...
        </div>
      )}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);
