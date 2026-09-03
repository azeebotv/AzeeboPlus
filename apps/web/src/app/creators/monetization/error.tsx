'use client';
import { webLogger } from '@/lib/logger';
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    webLogger.error(String(error.message || error));
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <h2 className="mb-2 text-xl font-semibold text-[var(--brand-near-black)] dark:text-white">
        Something went wrong
      </h2>
      <p className="mb-4 text-sm text-[var(--brand-mid-brown)]">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-[var(--brand-orange)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
