/**
 * Reduced Motion Support
 * A-013: Respect prefers-reduced-motion media query
 */
import { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * CSS classes for reduced motion
 */
export const REDUCED_MOTION_CLASSES = {
  fade: 'motion-safe:transition-opacity motion-reduce:transition-none',
  slide: 'motion-safe:transition-transform motion-reduce:transition-none',
  scale: 'motion-safe:transition-transform motion-reduce:transition-none',
  full: 'motion-safe:transition-all motion-reduce:transition-none',
} as const;

/**
 * Animation durations that respect user preference
 */
export function getAnimationDuration(
  prefersReducedMotion: boolean,
  normalMs: number = 300
): number {
  return prefersReducedMotion ? 0 : normalMs;
}

/**
 * Style object that disables animations when reduced motion is preferred
 */
export function getReducedMotionStyle(
  prefersReducedMotion: boolean,
  normalStyle: React.CSSProperties
): React.CSSProperties {
  if (prefersReducedMotion) {
    return {
      ...normalStyle,
      animation: 'none',
      transition: 'none',
    };
  }
  return normalStyle;
}

/**
 * Wrapper for framer-motion-like animation configs
 */
export function getReducedMotionAnimation(
  prefersReducedMotion: boolean,
  normalAnimation: Record<string, unknown>
): Record<string, unknown> {
  if (prefersReducedMotion) {
    return { duration: 0, ease: 'linear' };
  }
  return normalAnimation;
}
