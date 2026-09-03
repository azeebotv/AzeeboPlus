'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';

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

  return (
    <OfflineContext.Provider value={sw}>
      {children}
      {/* Update available banner */}
      {sw.updateAvailable && (
        <div
          className="fixed bottom-4 right-4 z-50 az-glass p-4 rounded-xl shadow-lg max-w-sm"
          style={{ border: '1px solid rgba(232,66,10,0.3)' }}
        >
          <p className="text-sm text-white mb-3">
            A new version of Azeebo+ is available.
          </p>
          <div className="flex gap-2">
            <button
              onClick={sw.skipWaiting}
              className="flex-1 text-xs font-medium py-2 px-3 rounded-lg text-white"
              style={{ background: 'var(--brand-orange, #E8420A)' }}
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
      {/* Offline indicator */}
      {!sw.isOnline && (
        <div
          className="fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-xs font-medium"
          style={{ background: 'rgba(239,68,68,0.9)', color: 'white' }}
        >
          You&apos;re offline — some features may be limited
        </div>
      )}
      {/* Queue indicator */}
      {sw.offlineQueueCount > 0 && sw.isOnline && (
        <div
          className="fixed bottom-4 left-4 z-50 az-glass p-3 rounded-xl shadow-lg text-xs text-white/80"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-pulse" />
          Syncing {sw.offlineQueueCount} queued action{sw.offlineQueueCount > 1 ? 's' : ''}...
        </div>
      )}
    </OfflineContext.Provider>
  );
}

export const useOffline = () => useContext(OfflineContext);
