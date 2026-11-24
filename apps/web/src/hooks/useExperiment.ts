'use client';

import { useMemo } from 'react';
import { getVariant, trackExperimentEvent, type Variant } from '@/lib/ab-testing';

interface ExperimentResult {
  variant: Variant | null;
  variantId: string;
  config: Record<string, unknown>;
  trackEvent: (event: string, value?: number) => void;
  isControl: boolean;
}

export function useExperiment(experimentId: string): ExperimentResult {
  const variant = useMemo(() => getVariant(experimentId), [experimentId]);

  const result = useMemo(
    () => ({
      variant,
      variantId: variant?.id || 'control',
      config: variant?.config || {},
      trackEvent: (event: string, value?: number) =>
        trackExperimentEvent(experimentId, event, value),
      isControl: variant?.id === 'control' || !variant,
    }),
    [variant, experimentId]
  );

  return result;
}

// Hook for tracking page views in experiments
export function useExperimentPageView(experimentId: string) {
  const { trackEvent } = useExperiment(experimentId);

  useMemo(() => {
    trackEvent('page_view');
  }, [trackEvent]);
}

// Hook for tracking clicks in experiments
export function useExperimentClick(experimentId: string) {
  const { trackEvent } = useExperiment(experimentId);

  return (_element: string) => {
    trackEvent('click', undefined);
  };
}
