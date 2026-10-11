'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function PredictionDetailError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <RouteErrorFallback
      title="Prediction Market Not Found"
      description="This prediction may have closed or encountered an issue."
      retryLabel="Retry"
      secondary={{ label: 'All Predictions', href: '/predictions' }}
      reset={reset}
    />
  );
}
