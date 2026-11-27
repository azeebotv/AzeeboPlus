'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function PredictionsError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <RouteErrorFallback
      title="Predictions Unavailable"
      description="Failed to load prediction markets. Please try again in a few moments."
      reset={reset}
    />
  );
}
