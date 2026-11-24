'use client';

import React from 'react';
import { Icon, IconName } from './Icon';

export interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  as?: React.ElementType;
}

export function Container({
  children,
  size = 'lg',
  className = '',
  as: Component = 'div',
}: ContainerProps) {
  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <Component className={`${sizeStyles[size]} mx-auto px-4 sm:px-6 lg:px-8 w-full ${className}`}>
      {children}
    </Component>
  );
}

export interface GridProps {
  children: React.ReactNode;
  cols?: { base?: number; sm?: number; md?: number; lg?: number; xl?: number; '2xl'?: number };
  gap?: { base?: string; sm?: string; md?: string; lg?: string; xl?: string };
  className?: string;
  as?: React.ElementType;
}

export function Grid({
  children,
  cols = { base: 1, md: 2, lg: 3 },
  gap = { base: '4', md: '6' },
  className = '',
  as: Component = 'div',
}: GridProps) {
  const colsClass = `
    grid-cols-${cols.base}
    sm:grid-cols-${cols.sm ?? cols.base}
    md:grid-cols-${cols.md ?? cols.sm ?? cols.base}
    lg:grid-cols-${cols.lg ?? cols.md ?? cols.sm ?? cols.base}
    xl:grid-cols-${cols.xl ?? cols.lg ?? cols.md ?? cols.sm ?? cols.base}
    2xl:grid-cols-${cols['2xl'] ?? cols.xl ?? cols.lg ?? cols.md ?? cols.sm ?? cols.base}
  `;
  const gapClass = `
    gap-${gap.base}
    sm:gap-${gap.sm ?? gap.base}
    md:gap-${gap.md ?? gap.sm ?? gap.base}
    lg:gap-${gap.lg ?? gap.md ?? gap.sm ?? gap.base}
    xl:gap-${gap.xl ?? gap.lg ?? gap.md ?? gap.sm ?? gap.base}
  `;

  return <Component className={`grid ${colsClass} ${gapClass} ${className}`}>{children}</Component>;
}

export interface GridItemProps {
  children: React.ReactNode;
  span?: { base?: number; sm?: number; md?: number; lg?: number; xl?: number };
  className?: string;
}

export function GridItem({ children, span, className = '' }: GridItemProps) {
  const spanClass = span
    ? `
      ${span.base ? `col-span-${span.base}` : ''}
      ${span.sm ? `sm:col-span-${span.sm}` : ''}
      ${span.md ? `md:col-span-${span.md}` : ''}
      ${span.lg ? `lg:col-span-${span.lg}` : ''}
      ${span.xl ? `xl:col-span-${span.xl}` : ''}
    `
    : '';

  return <div className={`${spanClass} ${className}`}>{children}</div>;
}

export interface StackProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  gap?: { base?: string; sm?: string; md?: string; lg?: string };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
  as?: React.ElementType;
}

export function Stack({
  children,
  direction = 'vertical',
  gap = { base: '4' },
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  as: Component = 'div',
}: StackProps) {
  const directionClass = direction === 'horizontal' ? 'flex-row' : 'flex-col';
  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[align];
  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }[justify];
  const wrapClass = wrap ? 'flex-wrap' : '';
  const gapClass = `
    gap-${gap.base}
    sm:gap-${gap.sm ?? gap.base}
    md:gap-${gap.md ?? gap.sm ?? gap.base}
    lg:gap-${gap.lg ?? gap.md ?? gap.sm ?? gap.base}
  `;

  return (
    <Component
      className={`flex ${directionClass} ${alignClass} ${justifyClass} ${wrapClass} ${gapClass} ${className}`}
    >
      {children}
    </Component>
  );
}

export interface ResponsiveProps {
  children: React.ReactNode;
  hideOn?: ('sm' | 'md' | 'lg' | 'xl' | '2xl')[];
  showOnlyOn?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  as?: React.ElementType;
}

export function Responsive({
  children,
  hideOn,
  showOnlyOn,
  className = '',
  as: Component = 'div',
}: ResponsiveProps) {
  let visibilityClass = '';

  if (showOnlyOn) {
    const hideClasses: Record<string, string> = {
      sm: 'hidden sm:block',
      md: 'hidden sm:block md:hidden lg:block',
      lg: 'hidden md:block lg:hidden xl:block',
      xl: 'hidden lg:block xl:hidden 2xl:block',
      '2xl': 'hidden xl:block',
    };
    visibilityClass = hideClasses[showOnlyOn] || '';
  } else if (hideOn) {
    const hideClasses = hideOn
      .map((bp) => {
        const map: Record<string, string> = {
          sm: 'sm:hidden',
          md: 'md:hidden',
          lg: 'lg:hidden',
          xl: 'xl:hidden',
          '2xl': '2xl:hidden',
        };
        return map[bp];
      })
      .join(' ');
    visibilityClass = hideClasses;
  }

  return <Component className={`${visibilityClass} ${className}`}>{children}</Component>;
}

export interface AspectRatioProps {
  children: React.ReactNode;
  ratio?: 'square' | 'video' | 'portrait' | 'banner' | 'wide' | 'ultrawide';
  className?: string;
}

export function AspectRatio({ children, ratio = 'video', className = '' }: AspectRatioProps) {
  const ratios = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    banner: 'aspect-[21/9]',
    wide: 'aspect-[16/9]',
    ultrawide: 'aspect-[32/9]',
  };

  return <div className={`${ratios[ratio]} ${className}`}>{children}</div>;
}

export interface SplitProps {
  left: React.ReactNode;
  right: React.ReactNode;
  ratio?: '50/50' | '60/40' | '40/60' | '70/30' | '30/70';
  reverseOnMobile?: boolean;
  className?: string;
}

export function Split({
  left,
  right,
  ratio = '50/50',
  reverseOnMobile = false,
  className = '',
}: SplitProps) {
  const ratios = {
    '50/50': 'lg:grid-cols-2',
    '60/40': 'lg:grid-cols-[60%_40%]',
    '40/60': 'lg:grid-cols-[40%_60%]',
    '70/30': 'lg:grid-cols-[70%_30%]',
    '30/70': 'lg:grid-cols-[30%_70%]',
  };

  return (
    <div className={`grid grid-cols-1 ${ratios[ratio]} gap-6 lg:gap-8 ${className}`}>
      <div className={reverseOnMobile ? 'order-2 lg:order-1' : 'order-1'}>{left}</div>
      <div className={reverseOnMobile ? 'order-1 lg:order-2' : 'order-2'}>{right}</div>
    </div>
  );
}

// Page Layouts

export interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  className?: string;
}

export function DashboardLayout({
  children,
  sidebar,
  header,
  footer,
  sidebarCollapsed = false,
  onSidebarToggle,
  className = '',
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-az-surface-root">
      <div className="flex">
        <aside
          className={`
            fixed left-0 top-0 h-screen bg-az-surface-raised border-r border-az-glass-border
            transition-all duration-300 z-40
            ${sidebarCollapsed ? 'w-16' : 'w-64'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-az-glass-border">
              {!sidebarCollapsed && (
                <span className="font-bold text-lg text-az-primary-400">Azeebo+</span>
              )}
              <button
                onClick={onSidebarToggle}
                className="p-2 rounded-lg hover:bg-az-surface-panel transition-colors"
                aria-label="Toggle sidebar"
              >
                <Icon name={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'} size="md" />
              </button>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">{sidebar}</nav>
          </div>
        </aside>
        <main
          className={`
            flex-1 min-h-screen transition-all duration-300
            ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
          `}
        >
          {header && (
            <header className="sticky top-0 z-30 bg-az-surface-raised border-b border-az-glass-border">
              {header}
            </header>
          )}
          <div className={`p-6 ${className}`}>{children}</div>
          {footer && (
            <footer className="bg-az-surface-raised border-t border-az-glass-border py-4 px-6">
              {footer}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}

export interface AuthLayoutProps {
  children: React.ReactNode;
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, logo, footer, className = '' }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-az-surface-root to-az-surface-raised flex items-center justify-center p-4">
      <div className={`w-full max-w-md ${className}`}>
        {logo && <div className="flex justify-center mb-8">{logo}</div>}
        <div className="bg-az-surface-raised rounded-2xl shadow-xl border border-az-glass-border p-8">
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-az-ink-muted">{footer}</div>}
      </div>
    </div>
  );
}

export interface ContentLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ContentLayout({
  children,
  header,
  sidebar,
  footer,
  className = '',
}: ContentLayoutProps) {
  return (
    <div className="min-h-screen bg-az-surface-root">
      {header && (
        <header className="sticky top-0 z-30 bg-az-surface-raised border-b border-az-glass-border">
          {header}
        </header>
      )}
      <div className="flex">
        {sidebar && (
          <aside className="hidden lg:block w-64 flex-shrink-0 bg-az-surface-raised border-r border-az-glass-border">
            <div className="p-4">{sidebar}</div>
          </aside>
        )}
        <main className={`flex-1 min-h-screen ${sidebar ? 'lg:ml-64' : ''}`}>
          <div className={`p-6 ${className}`}>{children}</div>
        </main>
      </div>
      {footer && (
        <footer className="bg-az-surface-raised border-t border-az-glass-border py-4 px-6">
          {footer}
        </footer>
      )}
    </div>
  );
}

export interface SettingsLayoutProps {
  children: React.ReactNode;
  navItems: { id: string; label: string; icon?: IconName }[];
  activeItem: string;
  onNavItemClick: (id: string) => void;
  header?: React.ReactNode;
  className?: string;
}

export function SettingsLayout({
  children,
  navItems,
  activeItem,
  onNavItemClick,
  header,
  className = '',
}: SettingsLayoutProps) {
  return (
    <div className="min-h-screen bg-az-surface-root">
      {header && (
        <header className="sticky top-0 z-30 bg-az-surface-raised border-b border-az-glass-border">
          {header}
        </header>
      )}
      <div className="flex">
        <aside className="hidden lg:block w-72 flex-shrink-0 bg-az-surface-raised border-r border-az-glass-border">
          <div className="p-4 border-b border-az-glass-border">
            <h2 className="text-lg font-semibold text-az-ink">Settings</h2>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavItemClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                  ${
                    activeItem === item.id
                      ? 'bg-az-primary-500/10 text-az-primary-400'
                      : 'text-az-ink-dim hover:text-az-ink hover:bg-az-surface-panel'
                  }
                `}
                aria-current={activeItem === item.id ? 'page' : undefined}
              >
                {item.icon && <Icon name={item.icon} size="md" />}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-h-screen lg:ml-72">
          <div className={`p-6 ${className}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <header className={`mb-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-az-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-az-ink-dim">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
