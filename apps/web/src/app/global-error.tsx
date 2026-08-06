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
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: 'var(--brand-near-black)' }}
        >
          <div className="text-center max-w-md mx-auto px-6">
            <div className="text-6xl mb-6">💥</div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--brand-white)' }}>
              Critical Error
            </h1>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              A critical error occurred. Please refresh the page or try again later.
            </p>
            {error.digest && (
              <p className="text-sm mb-8 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: 'var(--brand-orange)', color: 'var(--brand-white)' }}
              aria-label="Reload page"
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
