'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function DownloadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return <RouteErrorFallback error={error} title="Downloads Error" reset={reset} />;
}
