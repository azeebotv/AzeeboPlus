'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">💥</div>
            <h1 className="text-2xl font-bold text-white mb-4">Critical Error</h1>
            <p className="text-white/60 mb-4">
              A critical error occurred. Please refresh the page or try again later.
            </p>
            {error.digest && <p className="text-white/40 text-sm mb-8 font-mono">{error.digest}</p>}
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#E8420A] text-white rounded-lg font-semibold hover:bg-[#D03A08] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
