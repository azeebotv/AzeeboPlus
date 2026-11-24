'use client';

import { Zap } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  /* Next.js bypasses the root layout for this route, so globals.css may never load.
     The surface is therefore styled with inline brand-token values instead of the
     shared `.az-*` classes every other page uses. */
  return (
    <html>
      <body style={{ backgroundColor: 'var(--color-az-surface-root)' }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="mb-6 flex items-center justify-center">
              <Zap size={56} color="var(--color-az-flame)" aria-hidden="true" />
            </div>
            <h1
              className="mb-4"
              style={{
                color: 'var(--color-az-ink)',
                fontSize: '1.75rem',
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              Critical Error
            </h1>
            <p className="mb-4" style={{ color: 'var(--color-az-ink-muted)' }}>
              A critical error occurred. Please refresh the page or try again later.
            </p>
            {error.digest && (
              <p
                className="mb-8 font-mono"
                style={{ color: 'var(--color-az-ink-dim)', fontSize: '0.8rem' }}
              >
                {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="rounded-full"
              style={{
                background: 'var(--gradient-az-cta)',
                color: 'var(--color-az-ink)',
                fontWeight: 700,
                padding: '0.9rem 2.25rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
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
