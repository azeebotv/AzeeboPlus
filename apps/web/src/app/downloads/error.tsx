'use client';

import { AlertTriangle } from 'lucide-react';

export default function DownloadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="az-glass p-8 max-w-md text-center">
        <AlertTriangle
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: 'var(--color-error-500, #EF4444)' }}
        />
        <h2 className="text-xl font-bold text-white mb-2">Downloads Error</h2>
        <p className="text-white/60 text-sm mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-orange)]"
          style={{ background: 'var(--brand-orange)' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
