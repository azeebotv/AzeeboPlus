'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function MobileStatusError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return <RouteErrorFallback description="Failed to load status." reset={reset} />;
}
