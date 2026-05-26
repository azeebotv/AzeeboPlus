'use client';

import React, { useState, useEffect } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number | string;
  children?: NavItem[];
}

export interface HeaderProps {
  logo: React.ReactNode;
  items: NavItem[];
  actions?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export function Header({
  logo,
  items,
  actions,
  className = '',
  sticky = true,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={`
        ${sticky ? 'sticky top-0 z-sticky' : ''}
        ${scrolled ? 'bg-bg-primary/95 backdrop-blur-md shadow-lg' : 'bg-bg-primary'}
        border-b border-border-default transition-all duration-200
        ${className}
      `}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">{logo}</div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {items.map((item) => (
              <NavItemDesktop key={item.href} item={item} />
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3">{actions}</div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {actions && <div className="flex items-center gap-2">{actions}</div>}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border-default bg-bg-primary">
          <nav className="px-4 py-4 space-y-1" aria-label="Mobile navigation">
            {items.map((item) => (
              <NavItemMobile key={item.href} item={item} onClose={() => setMobileMenuOpen(false)} />
            ))}
            {actions && <div className="pt-4 border-t border-border-default">{actions}</div>}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavItemDesktop({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);

  if (item.children && item.children.length > 0) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <button
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {item.icon}
          {item.label}
          {item.badge !== undefined && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
              {item.badge}
            </span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-bg-secondary border border-border-default rounded-lg shadow-xl py-1 z-dropdown">
            {item.children.map((child) => (
              <a
                key={child.href}
                href={child.href}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                {child.icon}
                {child.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={item.href}
      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
    >
      {item.icon}
      {item.label}
      {item.badge !== undefined && (
        <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
          {item.badge}
        </span>
      )}
    </a>
  );
}

function NavItemMobile({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  if (item.children && item.children.length > 0) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {isOpen && (
          <div className="ml-4 pl-4 border-l border-border-default space-y-1">
            {item.children.map((child) => (
              <a
                key={child.href}
                href={child.href}
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                {child.icon}
                {child.label}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={item.href}
      onClick={onClose}
      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
    >
      {item.icon}
      {item.label}
      {item.badge !== undefined && (
        <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
          {item.badge}
        </span>
      )}
    </a>
  );
}

// Sidebar
export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number | string;
  active?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  title?: string;
  footer?: React.ReactNode;
  className?: string;
  collapsible?: boolean;
}

export function Sidebar({
  items,
  title,
  footer,
  className = '',
  collapsible = false,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        ${collapsed ? 'w-16' : 'w-64'}
        h-full bg-bg-secondary border-r border-border-default
        flex flex-col transition-all duration-300
        ${className}
      `}
    >
      {title && (
        <div className="flex items-center justify-between p-4 border-b border-border-default">
          {!collapsed && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
          {collapsible && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Sidebar navigation">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${item.active
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
            aria-current={item.active ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.badge !== undefined && (
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </nav>

      {footer && !collapsed && <div className="p-4 border-t border-border-default">{footer}</div>}
    </aside>
  );
}
