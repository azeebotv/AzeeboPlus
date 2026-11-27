'use client';

import { motion } from 'framer-motion';

interface AmbientGlowProps {
  color?: string;
  size?: number;
  className?: string;
  animate?: boolean;
}

export function AmbientGlow({
  color = 'rgba(227, 30, 36,0.35)',
  size = 400,
  className = '',
  animate = true,
}: AmbientGlowProps): React.JSX.Element {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(40px)',
        zIndex: 0,
      }}
      animate={
        animate
          ? {
              x: [0, 10, -8, 5, 0],
              y: [0, -12, 8, -5, 0],
              scale: [1, 1.08, 0.95, 1.03, 1],
              opacity: [0.7, 0.85, 0.65, 0.8, 0.7],
            }
          : undefined
      }
      transition={
        animate
          ? {
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
    />
  );
}
