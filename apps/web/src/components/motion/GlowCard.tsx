'use client';

import { motion } from 'framer-motion';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  universe?: string;
  delay?: number;
  onClick?: () => void;
  role?: string;
  ariaLabel?: string;
}

const universeGlows: Record<string, string> = {
  reality: 'color-mix(in srgb, var(--color-az-scarlet) 25%, transparent)',
  creators: 'color-mix(in srgb, var(--color-az-scarlet) 25%, transparent)',
  lifestyle: 'color-mix(in srgb, rgb(13, 59, 46) 25%, transparent)',
  vertical: 'color-mix(in srgb, rgb(139, 92, 246) 25%, transparent)',
  movies: 'color-mix(in srgb, var(--color-az-warning-500) 25%, transparent)',
  games: 'color-mix(in srgb, var(--color-az-secondary-500) 25%, transparent)',
  comedy: 'color-mix(in srgb, var(--color-az-success-500) 25%, transparent)',
  sports: 'color-mix(in srgb, var(--color-az-error-500) 25%, transparent)',
};

const universeBorders: Record<string, string> = {
  reality: 'color-mix(in srgb, var(--color-az-scarlet) 30%, transparent)',
  creators: 'color-mix(in srgb, var(--color-az-scarlet) 30%, transparent)',
  lifestyle: 'color-mix(in srgb, rgb(13, 59, 46) 30%, transparent)',
  vertical: 'color-mix(in srgb, rgb(139, 92, 246) 30%, transparent)',
  movies: 'color-mix(in srgb, var(--color-az-warning-500) 30%, transparent)',
  games: 'color-mix(in srgb, var(--color-az-secondary-500) 30%, transparent)',
  comedy: 'color-mix(in srgb, var(--color-az-success-500) 30%, transparent)',
  sports: 'color-mix(in srgb, var(--color-az-error-500) 30%, transparent)',
};

export function GlowCard({
  children,
  className = '',
  universe,
  delay = 0,
  onClick,
  role,
  ariaLabel,
}: GlowCardProps): React.JSX.Element {
  const glowColor = universe
    ? universeGlows[universe]
    : 'color-mix(in srgb, var(--color-az-ink) 8%, transparent)';
  const borderColor = universe
    ? universeBorders[universe]
    : 'color-mix(in srgb, var(--color-az-ink) 15%, transparent)';

  return (
    <motion.div
      className={`az-glass ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}`,
        borderColor: borderColor,
        transition: { duration: 0.3 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </motion.div>
  );
}
