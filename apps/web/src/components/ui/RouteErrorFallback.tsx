'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

type RouteErrorFallbackProps = {
  error?: (Error & { digest?: string }) | null;
  reset: () => void;
  /** Route-specific headline; the generic boundary leaves it at the default. */
  title?: string;
  /** Fixed guidance for a known failure. Omit to surface `error.message`. */
  description?: string;
  retryLabel?: string;
  /** Escape hatch beside the retry CTA, e.g. "All Streams". */
  secondary?: { label: string; href: string };
};

/**
 * The one error treatment every `app/**\/error.tsx` boundary renders.
 *
 * Before this existed each boundary carried its own hand-styled card, which is
 * how the shadcn placeholder vars (`bg-primary`, `text-muted-foreground`),
 * Tailwind palette colors and the retired `--brand-orange` gradient survived on
 * public routes.
 */
export default function RouteErrorFallback({
  error,
  reset,
  title = 'Something went wrong',
  description,
  retryLabel = 'Try again',
  secondary,
}: RouteErrorFallbackProps): React.JSX.Element {
  const ctas = (
    <>
      <button type="button" onClick={reset} className="az-btn-primary az-btn-primary--inline">
        {retryLabel}
      </button>
      {secondary && (
        <Link
          href={secondary.href}
          className="az-body inline-flex items-center rounded-az-pill border border-az-ink/20 px-6 py-2.5 font-medium text-az-ink-dim transition-colors hover:bg-az-glass-card hover:text-az-ink"
        >
          {secondary.label}
        </Link>
      )}
    </>
  );

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="az-glass w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-az-error-500/30 bg-az-error-500/12">
          <AlertTriangle
            className="size-8 text-az-error-500"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </div>

        <h2 className="az-title mb-2 text-az-ink">{title}</h2>

        <p className="az-body mb-6 leading-relaxed text-az-ink-muted">
          {description ?? error?.message ?? 'An unexpected error occurred.'}
        </p>

        {error?.digest && (
          <p className="az-micro-label mb-6 font-mono text-az-ink-dim">Ref: {error.digest}</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">{ctas}</div>
      </div>
    </div>
  );
}
