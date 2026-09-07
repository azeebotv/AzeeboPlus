'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage(): React.JSX.Element {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
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

  useEffect(() => {
    if (isOnline) {
      window.location.href = '/';
    }
  }, [isOnline]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}
    >
      <div className="az-glass p-8 sm:p-12 max-w-md w-full text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(232,66,10,0.15)' }}
        >
          <WifiOff className="w-10 h-10" style={{ color: 'var(--brand-orange, #E8420A)' }} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">You&apos;re offline</h1>
        <p className="text-white/60 mb-8">
          It looks like you&apos;ve lost your internet connection. Some features may not be
          available right now.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 az-btn-primary py-3 px-6 rounded-xl font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/home"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium border text-white/70 hover:text-white transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h3 className="text-sm font-medium text-white/80 mb-3">Available offline</h3>
          <ul className="text-xs text-white/50 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Cached pages
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Saved content
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              Messages (will send when online)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
