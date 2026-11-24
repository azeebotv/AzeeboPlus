'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function ShareError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <RouteErrorFallback
      title="Link not found"
      description="This share link may have expired or been removed."
      secondary={{ label: 'Go to Home', href: '/home' }}
      reset={reset}
    />
  );
}
