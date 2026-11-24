'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Download } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export default function OfflinePage(): React.JSX.Element {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center border border-az-glass-border relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--color-az-flame)]/15 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-az-scarlet to-az-flame flex items-center justify-center text-az-ink mx-auto mb-6 shadow-az-glow">
            <WifiOff className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-az-error-500/10 border border-az-error-500/20 text-az-error-400 text-xs font-semibold mb-4">
            No Active Network
          </div>

          <h1 className="az-headline text-2xl sm:text-3xl font-extrabold text-az-ink mb-3">
            You&apos;re Offline
          </h1>
          <p className="text-az-ink/60 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            It looks like your device lost connectivity. Reconnect to Wi-Fi or cellular, or continue
            enjoying titles saved in your offline vault.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex-1 flex items-center justify-center gap-2 az-btn-primary tracking-wide shadow-lg hover:shadow-az-flame/20"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Checking...' : 'Try Again'}
            </button>
            <Link
              href="/downloads"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm text-az-ink/70 hover:text-az-ink bg-az-glass-card hover:bg-az-ink/15 border border-az-glass-border transition-colors"
            >
              <Download className="w-4 h-4 text-az-flame" />
              Offline Vault
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
