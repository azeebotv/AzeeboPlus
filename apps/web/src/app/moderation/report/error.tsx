'use client';

export default function ReportError({
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
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Report Error</h2>
        <p className="text-white/60 mb-6 text-sm">
          Failed to load report interface. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-full font-semibold text-white"
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
