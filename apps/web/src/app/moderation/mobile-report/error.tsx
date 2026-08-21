'use client';

export default function MobileReportError({
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
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-white/60 mb-4 text-xs">Failed to load report form.</p>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-full font-semibold text-xs text-white"
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
