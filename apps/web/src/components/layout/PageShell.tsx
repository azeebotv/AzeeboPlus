'use client';

import React from 'react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { PageTransition } from '@/components/motion/PageTransition';

export interface PageShellProps {
  children: React.ReactNode;
  activeNav?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  className?: string;
  glowColor?: string;
}

export function PageShell({
  children,
  activeNav,
  showHeader = true,
  showFooter = true,
  maxWidth = '7xl',
  className = '',
  glowColor = 'rgba(232, 66, 10, 0.15)',
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
      style={{ background: 'var(--hp-bg)', color: 'var(--text-primary)' }}
    >
      {/* Top Ambient Glow backdrop */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[160px] -z-0 opacity-80"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, rgba(204,28,28,0.04) 50%, transparent 80%)`,
        }}
        aria-hidden="true"
      />

      <div>
        {showHeader && <AppHeader active={activeNav} logoVariant="light" />}
        <main className={`relative z-10 ${maxWClass} px-4 sm:px-6 lg:px-8 py-8 sm:py-10 ${className}`}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {showFooter && <AppFooter />}
    </div>
  );
}

export default PageShell;
