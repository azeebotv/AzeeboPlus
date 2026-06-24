'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  distance?: number;
  once?: boolean;
}

const directionOffsets: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
  none: {},
};

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  className = '',
  distance = 40,
  once = true,
}: ScrollRevealProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-60px' });

  const offset = directionOffsets[direction];
  const animateOffset =
    direction === 'none'
      ? {}
      : {
          x: offset.x ? (offset.x > 0 ? distance : -distance) : 0,
          y: offset.y ? (offset.y > 0 ? distance : -distance) : 0,
        };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...animateOffset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...animateOffset }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      }}
    >
      {children}
    </motion.div>
  );
}
