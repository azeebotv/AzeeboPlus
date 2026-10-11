'use client';

import RouteErrorFallback from '@/components/ui/RouteErrorFallback';

export default function ModerationError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <RouteErrorFallback
      title="Moderation Portal Error"
      description="Failed to load moderation content. Please try again."
      reset={reset}
    />
  );
}
