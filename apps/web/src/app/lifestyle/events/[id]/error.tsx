'use client';

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-muted-foreground">Something went wrong</p>
      <button
        onClick={reset}
        className="min-h-[44px] px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-orange)]"
        aria-label="Try again"
      >
        Try again
      </button>
    </div>
  );
}
