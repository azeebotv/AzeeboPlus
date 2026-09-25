'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isRateLimited: boolean;
  retryAfterSeconds: number | null;
  setRateLimited: (limited: boolean, retryAfter?: number | null) => void;
}

const NetworkStatusContext = createContext<NetworkStatus>({
  isOnline: true,
  isRateLimited: false,
  retryAfterSeconds: null,
  setRateLimited: () => {},
});

export function useNetworkStatus() {
  return useContext(NetworkStatusContext);
}

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setRateLimited = useCallback((limited: boolean, retryAfter?: number | null) => {
    setIsRateLimited(limited);
    setRetryAfterSeconds(retryAfter ?? null);
  }, []);

  return (
    <NetworkStatusContext.Provider
      value={{ isOnline, isRateLimited, retryAfterSeconds, setRateLimited }}
    >
      {children}
    </NetworkStatusContext.Provider>
  );
}

/** Banner shown when rate limited or offline */
export function NetworkStatusBanner() {
  const { isOnline, isRateLimited, retryAfterSeconds } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white px-4 py-2 text-center text-sm font-medium">
        You are offline. Some features may be unavailable.
      </div>
    );
  }

  if (isRateLimited && retryAfterSeconds) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white px-4 py-2 text-center text-sm font-medium">
        Too many requests. Retrying in {retryAfterSeconds}s...
      </div>
    );
  }

  return null;
}
