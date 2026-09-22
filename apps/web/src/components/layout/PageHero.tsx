'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AmbientGlow } from '@/components/motion/AmbientGlow';

export interface PageHeroProps {
  eyebrow?: string;
  eyebrowColor?: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  rightElement?: React.ReactNode;
  accentColor?: string;
  children?: React.ReactNode;
  glowColor?: string;
  glowSize?: number;
  className?: string;
}

export function PageHero({
  eyebrow,
  eyebrowColor = 'var(--brand-orange)',
  title,
  subtitle,
  description,
  badge,
  actions,
  rightElement,
  accentColor,
  children,
  glowColor = 'rgba(232, 66, 10, 0.18)',
  glowSize = 600,
  className = '',
}: PageHeroProps): React.JSX.Element {
  const displaySubtitle = subtitle || description;
  const displayActions = actions || rightElement;
  const effectiveEyebrowColor = accentColor ? `var(--brand-${accentColor}, ${accentColor})` : eyebrowColor;
  return (
    <div className={`relative mb-8 sm:mb-10 ${className}`}>
      {/* Background ambient lighting */}
      <AmbientGlow
        color={glowColor}
        size={glowSize}
        className="-top-28 left-1/3 -translate-x-1/2"
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div>
          {(eyebrow || badge) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/10 bg-white/5 backdrop-blur-md"
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: effectiveEyebrowColor }}
              />
              <span className="tracking-widest uppercase text-white/80 font-medium">
                {eyebrow || badge}
              </span>
              {badge && eyebrow && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/90">
                  {badge}
                </span>
              )}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.05 }}
            className="az-headline font-extrabold text-white text-3xl sm:text-4xl lg:text-5xl tracking-tight"
          >
            {title}
          </motion.h1>

          {displaySubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
              className="text-white/60 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed"
            >
              {displaySubtitle}
            </motion.p>
          )}
        </div>

        {displayActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center gap-3 flex-wrap"
          >
            {displayActions}
          </motion.div>
        )}
      </div>

      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export default PageHero;
