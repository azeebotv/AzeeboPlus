'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Home, Download, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export default function OfflinePage(): React.JSX.Element {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

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

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center border border-az-glass-border relative overflow-hidden">
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--color-az-flame)]/15 blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-az-scarlet to-az-flame flex items-center justify-center text-az-ink mx-auto mb-6 shadow-az-glow">
            <WifiOff className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-az-error-500/10 border border-az-error-500/20 text-az-error-400 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-az-error-500 animate-pulse" />
            Connection Offline
          </div>

          <h1 className="az-headline text-2xl sm:text-3xl font-extrabold text-az-ink mb-3">
            You&apos;re Offline
          </h1>
          <p className="text-az-ink/60 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            It looks like your internet connection dropped. You can still access downloaded movies,
            audio tracks, and cached screens.
          </p>

          <div className="space-y-3 mb-8">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center justify-center gap-2 az-btn-primary tracking-wide shadow-lg hover:shadow-az-flame/20 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking Network...' : 'Reconnect Now'}
            </button>

            <Link
              href="/downloads"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-sm bg-az-glass-card hover:bg-az-ink/15 text-az-ink border border-az-glass-border transition-colors"
            >
              <Download className="w-4 h-4 text-az-flame" />
              Go to Offline Downloads
            </Link>

            <Link
              href="/home"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-2xl font-medium text-xs text-az-ink/50 hover:text-az-ink transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Return to Cached Home
            </Link>
          </div>

          {/* Offline Capabilities Card */}
          <div className="pt-6 border-t border-az-glass-border text-left">
            <h3 className="text-xs font-bold text-az-ink uppercase tracking-wider mb-3">
              Still Accessible Offline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-az-ink/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-az-success-400 flex-shrink-0" />
                <span>Downloaded Media</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-az-success-400 flex-shrink-0" />
                <span>Cached Watchlists</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-az-success-400 flex-shrink-0" />
                <span>Audio Pass Playlists</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-az-success-400 flex-shrink-0" />
                <span>Offline Wallet Pass</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
