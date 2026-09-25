'use client';

import React, { useState } from 'react';
import { Icon, IconName } from './Icon';
import { Pagination } from './Navigation';

// Table
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  getRowKey?: (row: T) => string | number;
}

export function Table<T>({
  columns,
  data = [],
  className = '',
  striped = false,
  hoverable = false,
  compact = false,
  pagination,
  onRowClick,
  emptyState,
  getRowKey,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(
    null
  );

  const handleSort = (key: keyof T) => {
    if (sortConfig?.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const sortedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null || bVal == null) return 0;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const getSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;
    if (sortConfig?.key === column.key) {
      return sortConfig.direction === 'asc' ? (
        <Icon name="ChevronUp" size="sm" />
      ) : (
        <Icon name="ChevronDown" size="sm" />
      );
    }
    return <Icon name="ChevronsUpDown" size="sm" />;
  };

  const getKey = (row: T, index: number): React.Key => {
    if (getRowKey) return getRowKey(row);
    const id = (row as Record<string, unknown>)?.id;
    if (id != null) return String(id);
    return index;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`bg-bg-secondary rounded-xl border border-border-default ${className}`}>
        {emptyState || (
          <div className="py-12 text-center text-text-tertiary">
            <Icon name="Inbox" size="xl" className="mx-auto mb-3 opacity-50" />
            <p>No data available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-bg-secondary rounded-xl border border-border-default overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className={`w-full ${compact ? 'text-sm' : ''}`}>
          <thead>
            <tr className="border-b border-border-default bg-bg-tertiary">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`
                    px-4 py-3 text-left text-sm font-medium text-text-secondary
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                    ${column.width ? column.width : ''}
                  `}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-text-primary transition-colors w-full"
                    >
                      {column.label}
                      {getSortIcon(column)}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => {
              const key = getKey(row, rowIndex);
              return (
                <tr
                  key={key}
                  className={`
                    border-b border-border-default/50 last:border-b-0
                    ${striped && rowIndex % 2 === 0 ? 'bg-bg-primary' : ''}
                    ${hoverable ? 'hover:bg-bg-tertiary/50 cursor-pointer' : ''}
                    transition-colors
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => {
                    const cellValue = row[column.key];
                    return (
                      <td
                        key={String(column.key)}
                        className={`
                          px-4 py-3 text-sm text-text-primary
                          ${column.align === 'center' ? 'text-center' : ''}
                          ${column.align === 'right' ? 'text-right' : ''}
                          ${column.width ? column.width : ''}
                        `}
                      >
                        {column.render
                          ? column.render(cellValue, row)
                          : ((cellValue as React.ReactNode) ?? '-')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="border-t border-border-default px-4 py-3 flex justify-center">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

// List
export interface ListItemProps {
  icon?: IconName | React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function ListItem({
  icon,
  title,
  description,
  actions,
  onClick,
  active,
  disabled,
}: ListItemProps) {
  const getIcon = (icon: IconName | React.ReactNode) => {
    if (typeof icon === 'string') {
      return <Icon name={icon as IconName} size="md" />;
    }
    return icon;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg
        transition-all duration-200 text-left
        ${active ? 'bg-primary-500/10 text-primary-400' : ''}
        ${!active && !disabled ? 'hover:bg-bg-tertiary text-text-secondary' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {icon && (
        <div
          className={`
          flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
          ${active ? 'bg-primary-500/20' : 'bg-bg-tertiary'}
        `}
        >
          {getIcon(icon)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        {description && <p className="text-sm text-text-tertiary truncate">{description}</p>}
      </div>
      {actions}
    </button>
  );
}

export interface ListProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export function List({ children, className = '', bordered = false }: ListProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={bordered ? 'border-b border-border-default/50 last:border-b-0' : ''}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Card List
export interface CardListItemProps {
  icon?: IconName | React.ReactNode;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  image?: string;
  onClick?: () => void;
}

export function CardListItem({
  icon,
  title,
  description,
  meta,
  image,
  onClick,
}: CardListItemProps) {
  const getIcon = (icon: IconName | React.ReactNode) => {
    if (typeof icon === 'string') {
      return <Icon name={icon as IconName} size="lg" />;
    }
    return icon;
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-bg-secondary border border-border-default rounded-xl p-4 text-left hover:border-primary-500/30 hover:shadow-md transition-all duration-200"
    >
      <div className="flex gap-4">
        {image ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-bg-tertiary">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : icon ? (
          <div className="w-16 h-16 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
            {getIcon(icon)}
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary truncate">{title}</p>
          {description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{description}</p>
          )}
          {meta && (
            <div className="mt-2 flex items-center gap-2 text-xs text-text-tertiary">{meta}</div>
          )}
        </div>
        <Icon name="ChevronRight" size="md" className="text-text-tertiary flex-shrink-0" />
      </div>
    </button>
  );
}

// DisplayBadge
export interface DisplayBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function DisplayBadge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: DisplayBadgeProps) {
  const variantStyles = {
    default: 'bg-bg-tertiary text-text-secondary',
    primary: 'bg-primary-500/10 text-primary-400',
    success: 'bg-success-500/10 text-success-400',
    warning: 'bg-warning-500/10 text-warning-400',
    error: 'bg-error-500/10 text-error-400',
    info: 'bg-secondary-500/10 text-secondary-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Tag
export interface TagProps extends DisplayBadgeProps {
  closable?: boolean;
  onClose?: () => void;
}

export function Tag({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  closable = false,
  onClose,
}: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${variant === 'default' ? 'bg-bg-tertiary text-text-secondary' : ''}
        ${variant === 'primary' ? 'bg-primary-500/10 text-primary-400' : ''}
        ${variant === 'success' ? 'bg-success-500/10 text-success-400' : ''}
        ${variant === 'warning' ? 'bg-warning-500/10 text-warning-400' : ''}
        ${variant === 'error' ? 'bg-error-500/10 text-error-400' : ''}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        ${className}
      `}
    >
      {children}
      {closable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="ml-1 hover:opacity-70 transition-opacity"
          aria-label="Remove tag"
        >
          <Icon name="X" size="xs" />
        </button>
      )}
    </span>
  );
}

// Progress Ring
export interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  label,
  className = '',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-bg-tertiary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-primary-500 transition-all duration-500"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-text-primary">{progress}%</span>
        {label && <span className="text-xs text-text-tertiary">{label}</span>}
      </div>
    </div>
  );
}

// Stat Card
export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: IconName | React.ReactNode;
  trend?: {
    value?: number;
    label?: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className = '' }: StatCardProps) {
  const getIcon = (icon: IconName | React.ReactNode) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <Icon name={icon as IconName} size="lg" />;
    }
    return icon;
  };

  const hasTrend = trend && trend.value != null && trend.label;

  return (
    <div className={`bg-bg-secondary border border-border-default rounded-xl p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value ?? '-'}</p>
          {hasTrend && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${trend?.positive ? 'text-success-400' : 'text-error-400'}`}
            >
              {trend?.positive ? (
                <Icon name="TrendingUp" size="sm" />
              ) : (
                <Icon name="TrendingDown" size="sm" />
              )}
              <span>{trend?.value}%</span>
              <span className="text-text-tertiary">{trend?.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
            {getIcon(icon)}
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State
export interface EmptyStateProps {
  icon?: IconName | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  const getIcon = (icon: IconName | React.ReactNode) => {
    if (typeof icon === 'string') {
      return <Icon name={icon as IconName} size="2xl" />;
    }
    return icon;
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {icon && <div className="text-text-tertiary opacity-50 mb-4">{getIcon(icon)}</div>}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && <p className="text-text-secondary mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// Timeline
export interface TimelineItemProps {
  title: string;
  description?: string;
  icon?: IconName | React.ReactNode;
  dotColor?: 'primary' | 'success' | 'warning' | 'error';
  time?: string;
}

export interface TimelineProps {
  items: TimelineItemProps[];
  className?: string;
  reversed?: boolean;
}

export function Timeline({ items, className = '', reversed = false }: TimelineProps) {
  const displayItems = reversed ? [...items].reverse() : items;

  const dotColors = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`absolute ${reversed ? 'right-4' : 'left-4'} top-0 bottom-0 w-px bg-border-default`}
      />
      <div className={`space-y-4 ${reversed ? 'pr-12' : 'pl-12'}`}>
        {displayItems.map((item, index) => {
          const getIcon = (icon: IconName | React.ReactNode) => {
            if (typeof icon === 'string') {
              return <Icon name={icon as IconName} size="sm" />;
            }
            return icon;
          };

          return (
            <div key={index} className={`relative ${reversed ? 'text-right' : ''}`}>
              <div
                className={`
                  absolute ${reversed ? 'right-[-28px]' : 'left-[-28px]'} top-1 w-7 h-7 rounded-full
                  ${dotColors[item.dotColor || 'primary']} flex items-center justify-center
                `}
              >
                {item.icon && (
                  <div className="w-5 h-5 rounded-full bg-bg-secondary flex items-center justify-center">
                    {getIcon(item.icon)}
                  </div>
                )}
              </div>
              <div>
                <div className={`flex items-center gap-2 ${reversed ? 'flex-row-reverse' : ''}`}>
                  <h4 className="font-medium text-text-primary">{item.title}</h4>
                  {item.time && <span className="text-xs text-text-tertiary">{item.time}</span>}
                </div>
                {item.description && (
                  <p className="text-sm text-text-secondary mt-1">{item.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
