'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function BorrowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return <RouteErrorFallback error={error} title="Borrow is unavailable" reset={reset} />;
}
