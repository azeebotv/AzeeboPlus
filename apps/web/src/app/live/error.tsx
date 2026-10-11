'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function LiveError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <RouteErrorFallback
      title="Live Stream Error"
      description="Failed to connect to live stream. Please check your connection and try again."
      reset={reset}
    />
  );
}
