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
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--brand-orange)]/15 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#e8420a] to-[#cc1c1c] flex items-center justify-center text-white mx-auto mb-6 shadow-[0_8px_32px_rgba(232,66,10,0.35)]">
            <WifiOff className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-4">
            No Active Network
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            You&apos;re Offline
          </h1>
          <p className="text-white/60 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
            It looks like your device lost connectivity. Reconnect to Wi-Fi or cellular, or continue enjoying titles saved in your offline vault.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex-1 flex items-center justify-center gap-2 az-btn-primary py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Checking...' : 'Try Again'}
            </button>
            <Link
              href="/downloads"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
            >
              <Download className="w-4 h-4 text-orange-400" />
              Offline Vault
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
