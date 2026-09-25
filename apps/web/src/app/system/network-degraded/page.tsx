'use client';

import { useState } from 'react';
import { Gauge, RefreshCw, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export default function NetworkDegradedPage(): React.JSX.Element {
  const [reloading, setReloading] = useState(false);

  const handleReload = () => {
    setReloading(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <PageShell glowColor="rgba(245,158,11,0.15)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/15 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white mx-auto mb-6 shadow-[0_8px_32px_rgba(245,158,11,0.3)]">
            <Gauge className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            Adaptive Data Saver Active
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Slow Connection Detected
          </h1>
          <p className="text-white/60 text-sm mb-6 leading-relaxed max-w-sm mx-auto">
            Your network latency is fluctuating. Azeebo+ has automatically switched into low-bandwidth mode so your video stream doesn&apos;t freeze.
          </p>

          <div className="az-glass p-4 rounded-2xl border border-white/10 text-left mb-8 max-w-xs mx-auto text-xs text-white/70 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Adaptive 720p/480p dynamic bitrate</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>On-demand thumbnail caching</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Background audio prioritizing</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleReload}
              disabled={reloading}
              className="w-full flex items-center justify-center gap-2 az-btn-primary py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
              {reloading ? 'Testing Connection...' : 'Re-test Connection Speed'}
            </button>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
