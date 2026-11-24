'use client';

import { useEffect } from 'react';
import { webLogger } from '@/lib/logger';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

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

  return <RouteErrorFallback error={error} reset={reset} />;
}
