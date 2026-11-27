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
  eyebrowColor = 'var(--color-az-flame)',
  title,
  subtitle,
  description,
  badge,
  actions,
  rightElement,
  accentColor,
  children,
  glowColor = 'color-mix(in srgb, var(--color-az-scarlet) 18%, transparent)',
  glowSize = 600,
  className = '',
}: PageHeroProps): React.JSX.Element {
  const displaySubtitle = subtitle || description;
  const displayActions = actions || rightElement;
  /* `accentColor` predates the generated vocabulary: pages passed a bare hue word
     and this composed `var(--brand-<word>, <word>)`, which reached the retired
     alias layer through a template string — invisible to the alias rule, and with
     a keyword fallback that made an unmapped word render rather than fail. The
     prop is a CSS colour now, so each hero states which token it means and the
     alias layer stays reachable only from globals.css. */
  const effectiveEyebrowColor = accentColor ?? eyebrowColor;
  return (
    /* overflow-x-clip: the ambient glow below is deliberately larger than the
       hero and offset to one side. Without clipping, a 600px glow painted from
       a 33% offset pushed the document 218px wide on a 390px viewport, so every
       page using PageHero scrolled sideways on mobile. Clip on x only — the
       glow still bleeds above the hero, and `clip` (not `hidden`) avoids
       turning the hero into a scroll container. */
    <div className={`relative overflow-x-clip mb-8 sm:mb-10 ${className}`}>
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
              className="az-chip inline-flex items-center gap-2 px-3 py-1 mb-3"
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: effectiveEyebrowColor }}
              />
              <span className="az-overline text-az-ink-dim">{eyebrow || badge}</span>
              {badge && eyebrow && (
                <span className="ml-1 px-1.5 py-0.5 rounded-az-pill az-micro-label bg-az-glass-card text-az-ink-dim">
                  {badge}
                </span>
              )}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.05 }}
            className="az-headline az-hero-title text-az-ink"
          >
            {title}
          </motion.h1>

          {displaySubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
              className="az-lead text-az-ink-muted mt-2 max-w-2xl"
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
