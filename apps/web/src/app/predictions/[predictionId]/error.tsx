'use client';

import Link from 'next/link';

export default function PredictionDetailError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--brand-near-black)' }}
    >
      <div className="text-center max-w-md mx-auto">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold text-white mb-2">Prediction Market Not Found</h2>
        <p className="text-white/60 mb-6 text-sm">
          This prediction may have closed or encountered an issue.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-full font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
            }}
          >
            Retry
          </button>
          <Link
            href="/predictions"
            className="px-6 py-2.5 rounded-full font-medium text-white/80 border border-white/20 hover:bg-white/10 transition-colors"
          >
            All Predictions
          </Link>
        </div>
      </div>
    </div>
  );
}
