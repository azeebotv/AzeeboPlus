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
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Ambient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--brand-orange)]/15 blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#e8420a] to-[#cc1c1c] flex items-center justify-center text-white mx-auto mb-6 shadow-[0_8px_32px_rgba(232,66,10,0.35)]">
            <WifiOff className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Connection Offline
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            It looks like your internet connection dropped. You can still access downloaded movies, audio tracks, and cached screens.
          </p>

          <div className="space-y-3 mb-8">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center gap-2 az-btn-primary py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-500/20 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking Network...' : 'Reconnect Now'}
            </button>

            <Link
              href="/downloads"
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
            >
              <Download className="w-4 h-4 text-orange-400" />
              Go to Offline Downloads
            </Link>

            <Link
              href="/home"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-2xl font-medium text-xs text-white/50 hover:text-white transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Return to Cached Home
            </Link>
          </div>

          {/* Offline Capabilities Card */}
          <div className="pt-6 border-t border-white/10 text-left">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Still Accessible Offline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Downloaded Media</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Cached Watchlists</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Audio Pass Playlists</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Offline Wallet Pass</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
