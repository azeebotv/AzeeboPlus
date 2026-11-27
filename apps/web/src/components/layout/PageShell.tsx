'use client';

import React from 'react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { ExploreUniversesDock } from './ExploreUniversesDock';
import { PageTransition } from '@/components/motion/PageTransition';

export interface PageShellProps {
  children: React.ReactNode;
  activeNav?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showUniverseDock?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  className?: string;
  glowColor?: string;
}

export function PageShell({
  children,
  activeNav,
  showHeader = true,
  showFooter = true,
  showUniverseDock = true,
  maxWidth = '7xl',
  className = '',
  glowColor = 'color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)',
}: PageShellProps): React.JSX.Element {
  const maxWClass =
    maxWidth === 'full'
      ? 'w-full'
      : maxWidth === 'sm'
        ? 'max-w-2xl mx-auto'
        : maxWidth === 'md'
          ? 'max-w-3xl mx-auto'
          : maxWidth === 'lg'
            ? 'max-w-4xl mx-auto'
            : maxWidth === 'xl'
              ? 'max-w-5xl mx-auto'
              : maxWidth === '2xl'
                ? 'max-w-6xl mx-auto'
                : 'max-w-7xl mx-auto';

  return (
    <div
      className="min-h-screen relative overflow-x-hidden flex flex-col justify-between"
      style={{ background: 'var(--color-az-surface-root)', color: 'var(--color-az-ink)' }}
    >
      {/* Top Ambient Glow backdrop */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[160px] -z-0 opacity-80"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, color-mix(in srgb, var(--color-az-scarlet) 4%, transparent) 50%, transparent 80%)`,
        }}
        aria-hidden="true"
      />

      <div>
        {showHeader && <AppHeader active={activeNav} logoVariant="light" />}
        <main
          className={`relative z-10 ${maxWClass} px-4 sm:px-6 lg:px-8 ${
            showHeader ? 'pt-24 sm:pt-28' : 'pt-8 sm:pt-10'
          } pb-8 sm:pb-10 ${className}`}
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {showUniverseDock && <ExploreUniversesDock currentUniverse={activeNav} />}

      {showFooter && <AppFooter />}
    </div>
  );
}

export default PageShell;
