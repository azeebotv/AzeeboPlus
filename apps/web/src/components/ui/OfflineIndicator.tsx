'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

/**
 * Offline-safe UX patterns (TAA §6)
 * - Network state awareness
 * - Offline indicators
 * - Retry mechanisms
 * - Graceful degradation
 */

interface NetworkContextType {
  isOnline: boolean;
  wasOffline: boolean;
  retryCount: number;
  queueAction: (action: () => Promise<void>) => Promise<void>;
  flushQueue: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  wasOffline: false,
  retryCount: 0,
  queueAction: async () => {},
  flushQueue: async () => {},
});

export function useNetwork() {
  return useContext(NetworkContext);
}

interface QueuedAction {
  id: string;
  action: () => Promise<void>;
  retries: number;
  timestamp: number;
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [, setQueue] = useState<QueuedAction[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (!navigator.onLine) return;
      setWasOffline(true);
      setRetryCount(0);
      // Auto-flush queue when coming back online
      setTimeout(() => flushQueue(), 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueAction = useCallback(async (action: () => Promise<void>) => {
    const id = Math.random().toString(36).substring(7);
    setQueue((prev) => [...prev, { id, action, retries: 0, timestamp: Date.now() }]);
  }, []);

  const flushQueue = useCallback(async () => {
    setQueue((prev) => {
      const failed: QueuedAction[] = [];

      for (const item of prev) {
        item.action().catch(() => {
          if (item.retries < 3) {
            failed.push({ ...item, retries: item.retries + 1 });
          }
        });
      }

      return failed;
    });
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, wasOffline, retryCount, queueAction, flushQueue }}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * Offline indicator banner
 */
export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetwork();

  if (isOnline && !wasOffline) return null;

  if (!isOnline) {
    return (
      <div
        role="alert"
        className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white px-4 py-2 text-center text-sm font-medium"
      >
        <span className="mr-2">📡</span>
        You are offline. Some features may be unavailable.
      </div>
    );
  }

  return null;
}

/**
 * Retry button component with exponential backoff
 */
export function RetryButton({
  onRetry,
  maxRetries = 3,
}: {
  onRetry: () => Promise<void>;
  maxRetries?: number;
}) {
  const [retries, setRetries] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (retries >= maxRetries) return;

    setIsRetrying(true);
    setRetries((r) => r + 1);

    try {
      await onRetry();
    } catch {
      // Will be retried by parent
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retries, maxRetries]);

  if (retries >= maxRetries) {
    return (
      <span className="text-sm text-muted-foreground">
        Maximum retries reached. Please try again later.
      </span>
    );
  }

  return (
    <button
      onClick={handleRetry}
      disabled={isRetrying}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
    >
      {isRetrying ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Retrying...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Retry ({retries}/{maxRetries})
        </>
      )}
    </button>
  );
}

/**
 * Graceful degradation wrapper
 */
export function GracefulDegradation({
  children,
  fallback,
  onError,
}: {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      onError?.(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
