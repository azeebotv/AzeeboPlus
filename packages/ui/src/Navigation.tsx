'use client';

import React, { useState, createContext, useContext, useCallback } from 'react';
import { Icon, IconName } from './Icon';

// Tabs
export interface Tab {
  id: string;
  label: string;
  icon?: IconName | React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabsContext(): TabsContextType {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within Tabs');
  }
  return context;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  className = '',
  children,
}: TabsProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab || tabs[0]?.id || '');

  const setActiveTab = useCallback(
    (id: string) => {
      setActiveTabState(id);
      onChange?.(id);
    },
    [onChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        <nav
          className={`
            flex ${fullWidth ? 'w-full' : ''}
            ${variant === 'pills' ? 'gap-1 p-1 bg-bg-tertiary rounded-lg' : ''}
            ${variant === 'underline' ? 'border-b border-border-default' : ''}
          `}
          role="tablist"
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} variant={variant} fullWidth={fullWidth} />
          ))}
        </nav>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabButton({ tab, variant, fullWidth }: { tab: Tab; variant: string; fullWidth: boolean }) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === tab.id;

  const baseStyles = `
    relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium
    transition-all duration-200 rounded-md
    focus:outline-none focus:ring-2 focus:ring-primary-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'flex-1 justify-center' : ''}
  `;

  const variantStyles = {
    default: isActive
      ? 'text-primary-400 bg-primary-500/10'
      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
    pills: isActive
      ? 'text-white bg-primary-500 shadow-sm'
      : 'text-text-secondary hover:text-text-primary',
    underline: isActive
      ? 'text-primary-400 border-b-2 border-primary-400'
      : 'text-text-secondary hover:text-text-primary border-b-2 border-transparent hover:border-border-default',
  };

  const getIcon = (icon: IconName | React.ReactNode) => {
    if (typeof icon === 'string') {
      return <Icon name={icon as IconName} size="sm" />;
    }
    return icon;
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      id={`tab-${tab.id}`}
      className={`${baseStyles} ${variantStyles[variant as keyof typeof variantStyles]}`}
      onClick={() => !tab.disabled && setActiveTab(tab.id)}
      disabled={tab.disabled}
    >
      {tab.icon && getIcon(tab.icon)}
      {tab.label}
      {tab.badge !== undefined && (
        <span
          className={`
          ml-1 px-2 py-0.5 text-xs rounded-full
          ${isActive ? 'bg-primary-400/20 text-primary-300' : 'bg-bg-hover text-text-tertiary'}
        `}
        >
          {String(tab.badge)}
        </span>
      )}
    </button>
  );
}

export interface TabPanelProps {
  tabId: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ tabId, children, className = '' }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== tabId) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      className={`mt-4 ${className}`}
    >
      {children}
    </div>
  );
}

// Breadcrumbs
export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: IconName | React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export function Breadcrumbs({ items, separator, className = '' }: BreadcrumbsProps) {
  const defaultSeparator = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-text-tertiary flex-shrink-0"
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (separator || defaultSeparator)}
              {isLast ? (
                <span className="text-text-primary font-medium" aria-current="page">
                  {item.icon && typeof item.icon === 'string' ? (
                    <>
                      <Icon name={item.icon as IconName} size="sm" className="inline mr-1" />
                      {item.label}
                    </>
                  ) : (
                    <>
                      {item.icon}
                      {item.label}
                    </>
                  )}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="text-text-secondary hover:text-text-primary transition-colors flex items-center"
                >
                  {item.icon && typeof item.icon === 'string' ? (
                    <>
                      <Icon name={item.icon as IconName} size="sm" className="inline mr-1" />
                      {item.label}
                    </>
                  ) : (
                    <>
                      {item.icon}
                      {item.label}
                    </>
                  )}
                </a>
              ) : (
                <button
                  onClick={item.onClick}
                  className="text-text-secondary hover:text-text-primary transition-colors flex items-center"
                >
                  {item.icon && typeof item.icon === 'string' ? (
                    <>
                      <Icon name={item.icon as IconName} size="sm" className="inline mr-1" />
                      {item.label}
                    </>
                  ) : (
                    <>
                      {item.icon}
                      {item.label}
                    </>
                  )}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Pagination
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  showFirstLast?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className = '',
  showFirstLast = false,
}: PaginationProps) {
  const pages = generatePagination(currentPage, totalPages, siblingCount);

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1 ${className}`}>
      {showFirstLast && currentPage > 2 && (
        <button
          onClick={() => onPageChange(1)}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          aria-label="Go to first page"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 15l-6-6-6 6" />
            <path d="M6 9h12" />
          </svg>
        </button>
      )}

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to previous page"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-text-tertiary">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`
              min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-colors
              ${
                page === currentPage
                  ? 'bg-primary-500 text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }
            `}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to next page"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {showFirstLast && currentPage < totalPages - 1 && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
          aria-label="Go to last page"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 15l6-6 6 6" />
            <path d="M6 9h12" />
          </svg>
        </button>
      )}
    </nav>
  );
}

function generatePagination(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | '...')[] {
  const totalNumbers = siblingCount * 2 + 3;
  const totalBlocks = totalNumbers + 2;

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, '...', totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, '...', ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, '...', ...middleRange, '...', totalPages];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

// Bottom Navigation (Mobile)
export interface BottomNavItem {
  id: string;
  label: string;
  icon: IconName | React.ReactNode;
  badge?: number | string;
  active?: boolean;
}

export interface BottomNavigationProps {
  items: BottomNavItem[];
  activeItem: string;
  onItemPress: (id: string) => void;
  className?: string;
}

export function BottomNavigation({
  items,
  activeItem,
  onItemPress,
  className = '',
}: BottomNavigationProps) {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-sticky bg-bg-secondary border-t border-border-default px-2 py-2 ${className}`}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="max-w-screen-lg mx-auto flex justify-around">
        {items.map((item) => {
          const isActive = activeItem === item.id;
          const getIcon = (icon: IconName | React.ReactNode) => {
            if (typeof icon === 'string') {
              return <Icon name={icon as IconName} size={isActive ? 'lg' : 'md'} />;
            }
            return icon;
          };

          return (
            <button
              key={item.id}
              onClick={() => onItemPress(item.id)}
              className={`
                relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                transition-all duration-200
                ${isActive ? 'text-primary-400' : 'text-text-tertiary hover:text-text-secondary'}
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              {item.badge !== undefined && (
                <span
                  className={`
                  absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 rounded-full text-xs font-medium flex items-center justify-center
                  ${isActive ? 'bg-primary-500 text-white' : 'bg-error-500 text-white'}
                `}
                >
                  {item.badge}
                </span>
              )}
              {getIcon(item.icon)}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Dropdown Menu
export interface DropdownItem {
  id: string;
  label: string;
  icon?: IconName | React.ReactNode;
  onClick?: () => void;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, className = '', align = 'left' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const getIcon = (icon: IconName | React.ReactNode) => {
    if (typeof icon === 'string') {
      return <Icon name={icon as IconName} size="sm" />;
    }
    return icon;
  };

  return (
    <div className={`relative inline-block ${className}`} data-dropdown>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`
            absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56
            bg-bg-secondary border border-border-default rounded-xl shadow-xl
            py-1 z-dropdown
          `}
          role="menu"
        >
          {items.map((item) => {
            if (item.divider) {
              return <div key={item.id} className="border-t border-border-default my-1" />;
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm
                  transition-colors duration-150
                  ${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed text-text-tertiary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }
                `}
                role="menuitem"
              >
                {item.icon && getIcon(item.icon)}
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-text-tertiary text-xs">{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
