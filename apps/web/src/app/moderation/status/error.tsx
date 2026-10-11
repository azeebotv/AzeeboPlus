'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function StatusError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <RouteErrorFallback
      title="Failed to Load Status"
      description="Could not retrieve report status. Please try again."
      reset={reset}
    />
  );
}
