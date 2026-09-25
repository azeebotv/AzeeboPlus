'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message || 'An unexpected error occurred'}</p>
      <button
        onClick={reset}
        className="min-h-[44px] px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand-orange)]"
        aria-label="Try again"
      >
        Try again
      </button>
    </div>
  );
}
