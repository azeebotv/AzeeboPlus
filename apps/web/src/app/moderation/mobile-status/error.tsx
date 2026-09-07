'use client';

export default function MobileStatusError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--brand-near-black)' }}
    >
      <div className="text-center max-w-sm mx-auto">
        <div className="text-4xl mb-3"></div>
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-white/60 mb-4 text-xs">Failed to load status.</p>
        <button
          onClick={reset}
          className="min-h-[44px] px-5 py-2.5 rounded-full font-semibold text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-orange)]"
          style={{
            background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
