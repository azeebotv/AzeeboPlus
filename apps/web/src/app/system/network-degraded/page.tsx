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
    <PageShell glowColor="color-mix(in srgb, var(--color-az-warning-500) 15%, transparent)">
      <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="az-glass p-8 sm:p-12 max-w-lg w-full text-center border border-az-glass-border relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-az-warning-500/15 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-az-warning-500 to-az-flame flex items-center justify-center text-az-ink mx-auto mb-6 shadow-az-glow-warning">
            <Gauge className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-az-warning-500/10 border border-az-warning-500/20 text-az-warning-400 text-xs font-semibold mb-4">
            Adaptive Data Saver Active
          </div>

          <h1 className="az-headline text-2xl sm:text-3xl font-extrabold text-az-ink mb-3">
            Slow Connection Detected
          </h1>
          <p className="text-az-ink/60 text-sm mb-6 leading-relaxed max-w-sm mx-auto">
            Your network latency is fluctuating. Azeebo+ has automatically switched into
            low-bandwidth mode so your video stream doesn&apos;t freeze.
          </p>

          <div className="az-glass p-4 border border-az-glass-border text-left mb-8 max-w-xs mx-auto text-xs text-az-ink/70 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-az-success-400 flex-shrink-0" />
              <span>Adaptive 720p/480p dynamic bitrate</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-az-success-400 flex-shrink-0" />
              <span>On-demand thumbnail caching</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-az-success-400 flex-shrink-0" />
              <span>Background audio prioritizing</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleReload}
              disabled={reloading}
              className="flex items-center justify-center gap-2 az-btn-primary tracking-wide shadow-lg hover:shadow-az-flame/20"
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
