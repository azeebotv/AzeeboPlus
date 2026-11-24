'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function LiveDetailError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <RouteErrorFallback
      title="Live Stream Unavailable"
      description="This live broadcast may have ended or encountered a connection error."
      retryLabel="Retry"
      secondary={{ label: 'All Streams', href: '/live' }}
      reset={reset}
    />
  );
}
