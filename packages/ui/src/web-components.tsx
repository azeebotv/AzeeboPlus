'use client';

import React from 'react';
import { Icon, IconName } from './Icon';

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  children: React.ReactNode;
  leftIcon?: IconName | React.ReactNode;
  rightIcon?: IconName | React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  leftIcon,
  rightIcon,
  isLoading = false,
  loadingText = 'Loading...',
  disabled,
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}: ButtonProps): React.ReactElement {
  const baseStyles = `
    inline-flex items-center justify-center font-semibold transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    disabled:hover:transform-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
  `;

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    icon: 'p-2.5',
  };

  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 rounded-lg',
    secondary:
      'bg-bg-tertiary text-text-primary hover:bg-bg-hover focus:ring-bg-tertiary rounded-lg',
    ghost:
      'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary focus:ring-bg-tertiary rounded-lg',
    outline:
      'border-2 border-border-default text-text-primary hover:border-primary-500 hover:text-primary-400 focus:ring-primary-500 rounded-lg',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500 rounded-lg',
    success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 rounded-lg',
    warning: 'bg-warning-500 text-dark-900 hover:bg-warning-600 focus:ring-warning-500 rounded-lg',
  };

  const getIcon = (icon: IconName | React.ReactNode) => {
    if (typeof icon === 'string') {
      return <Icon name={icon as IconName} size={size === 'sm' ? 'sm' : 'md'} />;
    }
    return icon;
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" role="status">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {leftIcon && getIcon(leftIcon)}
          {children}
          {rightIcon && getIcon(rightIcon)}
        </>
      )}
    </button>
  );
}

// Card Component
export interface CardProps {
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  as?: React.ElementType;
  role?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function Card({
  className = '',
  padding = 'md',
  children,
  onClick,
  variant = 'default',
  as: Component = 'div',
  role,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
}: CardProps): React.ReactElement {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  const variantStyles = {
    default: 'bg-bg-secondary border border-border-default shadow-md',
    elevated: 'bg-bg-secondary border border-border-default shadow-xl hover:shadow-2xl',
    outlined: 'bg-transparent border border-border-default',
  };

  return (
    <Component
      className={`rounded-xl overflow-hidden transition-all duration-200 ${paddingStyles[padding]} ${variantStyles[variant]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </Component>
  );
}

// ContentCard Component
export interface ContentCardProps {
  title: string;
  description?: string;
  thumbnail: string;
  universe: string;
  isPremium?: boolean;
  onClick?: () => void;
}

export function ContentCard({
  title,
  description,
  thumbnail,
  universe,
  isPremium = false,
  onClick,
}: ContentCardProps): React.ReactElement {
  return (
    <Card padding="none" onClick={onClick} role="article" aria-label={title}>
      <div className="relative aspect-video bg-dark-800 overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isPremium && (
          <Badge variant="success" className="absolute top-2 right-2">
            <Icon name="Crown" size="xs" className="mr-1" />
            Premium
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-text-primary truncate">{title}</h3>
        {description && (
          <p className="text-text-secondary text-sm mt-1 line-clamp-2">{description}</p>
        )}
        <Badge variant="outline" className="mt-2">
          {universe.charAt(0).toUpperCase() + universe.slice(1)}
        </Badge>
      </div>
    </Card>
  );
}

// HeroCard Component
export interface HeroCardProps {
  title: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  universe: string;
  isLive?: boolean;
  isPremium?: boolean;
  onPlay?: () => void;
}

export function HeroCard({
  title,
  subtitle,
  description,
  thumbnail,
  universe,
  isLive = false,
  isPremium = false,
  onPlay,
}: HeroCardProps): React.ReactElement {
  return (
    <div className="relative rounded-2xl overflow-hidden" role="region" aria-label={title}>
      <div className="aspect-video relative">
        <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={onPlay}
            className="w-20 h-20 rounded-full bg-primary-500/90 flex items-center justify-center hover:scale-110 transition-transform duration-200 group"
            aria-label={`Play ${title}`}
          >
            <svg
              className="w-10 h-10 text-white ml-1 transition-transform group-hover:scale-110"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-2 mb-2">
          {isLive && (
            <Badge variant="error">
              <span
                className="w-2 h-2 rounded-full bg-error-400 mr-1.5 animate-pulse"
                role="status"
                aria-label="Live"
              />
              Live
            </Badge>
          )}
          {isPremium && (
            <Badge variant="success">
              <Icon name="Crown" size="xs" className="mr-1" />
              Premium
            </Badge>
          )}
          <Badge variant="outline">{universe.charAt(0).toUpperCase() + universe.slice(1)}</Badge>
        </div>
        <p className="text-text-secondary text-sm mb-1">{subtitle}</p>
        <h2 className="text-3xl font-bold text-text-primary mb-2">{title}</h2>
        <p className="text-text-secondary text-sm line-clamp-2">{description}</p>
      </div>
    </div>
  );
}

// Skeleton Component
export interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
  inline?: boolean;
  role?: string;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '0.375rem',
  className = '',
  inline = false,
  role = 'progressbar',
}: SkeletonProps): React.ReactElement {
  return (
    <div
      className={`animate-pulse bg-dark-600 ${inline ? 'inline-block' : ''} ${className}`}
      style={{ width, height, borderRadius }}
      role={role}
      aria-busy={true}
      aria-label="Loading"
    />
  );
}

// Divider Component
export interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  role?: string;
  'aria-orientation'?: 'horizontal' | 'vertical';
}

export function Divider({
  className = '',
  orientation = 'horizontal',
  role = 'separator',
  'aria-orientation': ariaOrientation,
}: DividerProps): React.ReactElement {
  return (
    <div
      className={`border-0 ${orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'} bg-border-default ${className}`}
      role={role}
      aria-orientation={ariaOrientation || orientation}
    />
  );
}

// Badge Component
export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'outline';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  role?: string;
  'aria-label'?: string;
}

export function Badge({
  variant = 'primary',
  className = '',
  children,
  onClick,
  role,
  'aria-label': ariaLabel,
}: BadgeProps): React.ReactElement {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const variantStyles = {
    primary: 'bg-primary-500/20 text-primary-400',
    secondary: 'bg-secondary-500/20 text-secondary-400',
    success: 'bg-success-500/20 text-success-400',
    error: 'bg-error-500/20 text-error-400',
    warning: 'bg-warning-500/20 text-warning-400',
    outline: 'border border-border-default text-text-secondary',
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseStyles} ${variantStyles[variant]} ${className} cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
        role={role}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
}

// Avatar Component
export interface AvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
  icon?: React.ReactNode;
  status?: 'online' | 'offline' | 'away';
  statusPosition?: 'bottom-right' | 'bottom-left';
}

export function Avatar({
  size = 'md',
  src,
  alt = '',
  fallback,
  className = '',
  icon,
  status,
  statusPosition = 'bottom-right',
}: AvatarProps): React.ReactElement {
  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const statusSize =
    size === 'xs'
      ? 'w-1.5 h-1.5'
      : size === 'sm'
        ? 'w-2 h-2'
        : size === 'md'
          ? 'w-2.5 h-2.5'
          : size === 'lg'
            ? 'w-3 h-3'
            : 'w-4 h-4';

  const statusStyles = {
    online: 'bg-success-500',
    offline: 'bg-dark-300',
    away: 'bg-warning-500',
  };

  const positionStyles = {
    'bottom-right': '-bottom-0.5 -right-0.5',
    'bottom-left': '-bottom-0.5 -left-0.5',
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`relative ${sizeStyles[size]} rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center font-semibold text-white ${className}`}
      role="img"
      aria-label={alt || fallback}
    >
      {src ? (
        <img
          src={src}
          alt={alt || fallback || ''}
          className="w-full h-full rounded-full object-cover"
        />
      ) : icon ? (
        icon
      ) : (
        <span>{getInitials(fallback)}</span>
      )}
      {status && (
        <span
          className={`absolute ${positionStyles[statusPosition]} ${statusSize} rounded-full border-2 border-bg-secondary ${statusStyles[status]}`}
          role="status"
          aria-label={status}
        />
      )}
    </div>
  );
}

// Tooltip Component
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
  delay = 100,
}: TooltipProps): React.ReactElement {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-bg-tertiary',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-bg-tertiary',
    left: 'right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-bg-tertiary',
    right: 'left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-bg-tertiary',
  };

  const child = React.Children.only(children) as React.ReactElement<Record<string, unknown>>;
  const hasAriaLabel = child.props['aria-label'] || child.props['aria-labelledby'];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {React.cloneElement(child, {
        'aria-describedby': hasAriaLabel ? undefined : 'tooltip',
      })}
      <div
        id="tooltip"
        className={`absolute ${positionStyles[position]} z-tooltip transition-all duration-200 pointer-events-none ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        role="tooltip"
        aria-hidden={!isVisible}
      >
        <div
          className={`px-3 py-2 bg-bg-tertiary text-text-primary text-sm rounded-lg shadow-lg ${className}`}
        >
          {content}
        </div>
        <div className={`absolute ${arrowStyles[position]}`} />
      </div>
    </div>
  );
}

// Progress Bar Component
export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  className = '',
  label,
}: ProgressBarProps): React.ReactElement {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantStyles = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    error: 'bg-error-500',
    warning: 'bg-warning-500',
  };

  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium text-text-secondary mb-1.5 block">{label}</label>
      )}
      <div
        className={`w-full ${sizeStyles[size]} bg-dark-600 rounded-full overflow-hidden ${className}`}
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full ${variantStyles[variant]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-text-tertiary mt-1 block" aria-hidden="true">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

// Error State Component
export interface ErrorStateProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again later',
  buttonText = 'Retry',
  onButtonPress,
}: ErrorStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-error-500/20 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-error-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary mb-6 max-w-sm">{description}</p>
      {onButtonPress && (
        <button
          onClick={onButtonPress}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-800"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

// Chip Component
export interface ChipProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  onRemove?: () => void;
  className?: string;
}

export function Chip({
  label,
  variant = 'default',
  size = 'md',
  onRemove,
  className = '',
}: ChipProps): React.ReactElement {
  const variantClasses: Record<string, string> = {
    default: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    danger: 'bg-error-100 text-error-800',
  };
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 hover:opacity-70" aria-label={`Remove ${label}`}>
          ×
        </button>
      )}
    </span>
  );
}

// Spinner Component
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function Spinner({ size = 'md', color, className = '' }: SpinnerProps): React.ReactElement {
  const sizeClasses: Record<string, string> = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      style={color ? { color } : undefined}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// Table HTML wrapper components
export function Tbody({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return <tbody className={className}>{children}</tbody>;
}

export function Thead({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return <thead className={className}>{children}</thead>;
}

export function Tr({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return <tr className={className}>{children}</tr>;
}

export function Th({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = '',
}: {
  children?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

// RadioGroup Component
export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
  name?: string;
}

export function RadioGroup({
  value,
  onValueChange,
  children,
  className = '',
  name,
}: RadioGroupProps): React.ReactElement {
  return (
    <div className={className} role="radiogroup">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childValue = (child.props as Record<string, unknown>).value as string | undefined;
          return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
            name,
            checked: childValue === value,
            onChange: () => onValueChange?.(childValue || ''),
          });
        }
        return child;
      })}
    </div>
  );
}
