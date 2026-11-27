'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function ReportError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <RouteErrorFallback
      title="Report Error"
      description="Failed to load report interface. Please try again."
      reset={reset}
    />
  );
}
