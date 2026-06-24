'use client';

import React from 'react';
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
  reality: 'rgba(204,28,28,0.25)',
  creators: 'rgba(232,66,10,0.25)',
  lifestyle: 'rgba(13,59,46,0.25)',
  vertical: 'rgba(139,92,246,0.25)',
  movies: 'rgba(245,158,11,0.25)',
  games: 'rgba(59,130,246,0.25)',
  comedy: 'rgba(34,197,94,0.25)',
  sports: 'rgba(239,68,68,0.25)',
};

const universeBorders: Record<string, string> = {
  reality: 'rgba(204,28,28,0.3)',
  creators: 'rgba(232,66,10,0.3)',
  lifestyle: 'rgba(13,59,46,0.3)',
  vertical: 'rgba(139,92,246,0.3)',
  movies: 'rgba(245,158,11,0.3)',
  games: 'rgba(59,130,246,0.3)',
  comedy: 'rgba(34,197,94,0.3)',
  sports: 'rgba(239,68,68,0.3)',
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
  const glowColor = universe ? universeGlows[universe] : 'rgba(255,255,255,0.08)';
  const borderColor = universe ? universeBorders[universe] : 'rgba(255,255,255,0.15)';

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
