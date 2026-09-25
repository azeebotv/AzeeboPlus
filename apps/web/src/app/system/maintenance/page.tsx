'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wrench, RefreshCw, MessageSquare, Sparkles } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';

export default function MaintenancePage(): React.JSX.Element {
  const [checking, setChecking] = useState(false);

  const handleCheck = () => {
    setChecking(true);
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
            <Wrench className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            System Maintenance
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Platform Maintenance
          </h1>
          <p className="text-white/60 text-sm mb-4 leading-relaxed max-w-sm mx-auto">
            We are fine-tuning our streaming infrastructure and database servers to deliver ultra-low latency streams.
          </p>
          <p className="text-xs text-white/40 mb-8 max-w-xs mx-auto">
            No action required on your end — your account, active passes, and wallet balance are 100% secure.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="flex-1 flex items-center justify-center gap-2 az-btn-primary py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking Status...' : 'Check Again'}
            </button>
            <Link
              href="/support"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Support
            </Link>
          </div>

          <div className="pt-6 mt-8 border-t border-white/10 text-xs text-white/40 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Expected recovery within a few minutes</span>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
