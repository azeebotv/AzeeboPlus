import React, { useState, ReactNode } from 'react';
import { colors, borderRadius, spacing, fontSize, fontWeight, animation, gradients, shadows, universeColors } from '@azeebo/design-tokens';

// ============================================
// Spinner Component
// ============================================
interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = colors.primary,
}) => {
  const sizes = { small: 16, medium: 24, large: 40 };
  return (
    <div
      className="animate-spin rounded-full border-2"
      style={{
        width: sizes[size], height: sizes[size], borderColor: colors.bg.tertiary, borderTopColor: color
      }}
    />
  );
};

// ============================================
// Skeleton Component
// ============================================
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: borderRadiusProp = borderRadius.md,
  className = '',
}) => {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadiusProp === 'number' ? `${borderRadiusProp}px` : borderRadiusProp,
        backgroundColor: colors.bg.tertiary,
      }}
    />
  );
};

// ============================================
// Badge Component
// ============================================
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'small',
}) => {
  const variantStyles: Record<string, { bg: string; text: string; }> = {
    default: { bg: colors.bg.tertiary, text: colors.text.secondary },
    primary: { bg: `${colors.primary}20`, text: colors.primary },
    secondary: { bg: `${colors.secondary}20`, text: colors.secondary },
    success: { bg: `${colors.success}20`, text: colors.success },
    warning: { bg: `${colors.warning}20`, text: colors.warning },
    error: { bg: `${colors.error}20`, text: colors.error },
  };

  const sizeStyles: Record<string, { padding: string; fontSize: string }> = {
    small: { padding: `${spacing['1']} ${spacing['2']}`, fontSize: fontSize.xs },
    medium: { padding: `${spacing['2']} ${spacing['3']}`, fontSize: fontSize.sm },
  };

  return (
    <span
      className="inline-flex items-center rounded-full font-semibold"
      style={{
        backgroundColor: variantStyles[variant].bg,
        color: variantStyles[variant].text,
        padding: sizeStyles[size].padding,
        fontSize: sizeStyles[size].fontSize,
      }}
    >
      {children}
    </span>
  );
};

// ============================================
// Avatar Component
// ============================================
interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  fallback?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'medium',
  fallback,
  className = '',
}) => {
  const sizes = {
    small: 32, medium: 40, large: 48, xlarge: 64
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center text-white font-semibold ${className}`}
        style={{
          width: sizes[size], height: sizes[size], borderRadius: '50%', backgroundColor: colors.bg.tertiary,
        }}
      >
        {fallback ? getInitials(fallback) : '?'}
      </div>
    );
  }
  return (
    <img
      src={src} alt={alt}
      className={`object-cover ${className}`}
      style={{ width: sizes[size], height: sizes[size], borderRadius: '50%' }}
    />
  );
};

// ============================================
// Button Component
// ============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const variantStyles: Record<string, { bg: string; text: string; hoverBg: string }> = {
    primary: { bg: colors.primary, text: colors.white, hoverBg: colors.primaryDark },
    secondary: { bg: colors.secondary, text: colors.white, hoverBg: colors.secondaryDark },
    ghost: { bg: 'transparent', text: colors.text.primary, hoverBg: colors.bg.tertiary },
    danger: { bg: colors.error, text: colors.white, hoverBg: colors.errorDark },
    outline: { bg: 'transparent', text: colors.primary, hoverBg: colors.bg.tertiary },
  };
  const sizeStyles: Record<string, { padding: string; fontSize: string; minHeight: number }> = {
    sm: { padding: `${spacing['2']} ${spacing['4']}`, fontSize: fontSize.sm, minHeight: 32 },
    md: { padding: `${spacing['3']} ${spacing['6']}`, fontSize: fontSize.base, minHeight: 44 },
    lg: { padding: `${spacing['4']} ${spacing['8']}`, fontSize: fontSize.lg, minHeight: 52 },
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: variantStyles[variant].bg,
        color: variantStyles[variant].text,
        padding: sizeStyles[size].padding,
        fontSize: sizeStyles[size].fontSize,
        minHeight: sizeStyles[size].minHeight,
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {isLoading ? <Spinner size="small" color={variantStyles[variant].text} /> : (
        <>
          {leftIcon && leftIcon}
          {children}
          {rightIcon && rightIcon}
        </>
      )}
    </button>
  );
};

// ============================================
// Card Component
// ============================================
interface CardProps {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  variant = 'default',
  className = '',
}) => {
  const paddings: Record<string, string> = {
    none: '0',
    sm: spacing['4'],
    md: spacing['6'],
    lg: spacing['8'],
  };
  const variants: Record<string, { border?: string; boxShadow?: string }> = {
    default: { border: '1px solid ' + colors.border.light },
    elevated: { boxShadow: shadows.lg },
    outlined: { border: '2px solid ' + colors.border.default },
  };

  return (
    <div
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{
        backgroundColor: colors.bg.secondary,
        padding: paddings[padding],
        border: variants[variant].border,
        boxShadow: variants[variant].boxShadow,
      }}
    >
      {children}
    </div>
  );
};

// ============================================
// Input Component
// ============================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  fullWidth = true,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`} style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && <label style={{ color: colors.text.secondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>{label}</label>}
      <div className="relative">
        {leftIcon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>}
        <input
          {...props}
          className="w-full rounded-xl text-gray-100 bg-gray-800 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          style={{
            padding: leftIcon || rightIcon ? `${spacing['4']} ${spacing['12']} ${spacing['4']} ${leftIcon ? spacing['12'] : spacing['4']}` : `${spacing['4']} ${spacing['6']}`,
            border: `1px solid ${error ? colors.error : colors.border.light}`,
            fontSize: fontSize.base,
          }}
        />
        {rightIcon && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</div>}
      </div>
      {error && <span style={{ color: colors.error, fontSize: fontSize.sm }}>{error}</span>}
      {helperText && !error && <span style={{ color: colors.text.tertiary, fontSize: fontSize.sm }}>{helperText}</span>}
    </div>
  );
};

// ============================================
// ProgressBar Component
// ============================================
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, color = colors.primary, size = 'medium', showLabel = false, className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const heights = { small: 4, medium: 8, large: 12 };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-2" style={{ color: colors.text.secondary, fontSize: fontSize.sm }}>
          <span>{value}</span><span>{max}</span>
        </div>
      )}
      <div style={{ height: heights[size], backgroundColor: colors.bg.tertiary, borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: color, transition: 'width 300ms cubic-bezier(0,0,0.2,1)', borderRadius: '9999px' }} />
      </div>
    </div>
  );
};

// ============================================
// Divider Component
// ============================================
interface DividerProps { className?: string }
export const Divider: React.FC<DividerProps> = ({ className = '' }) => {
  return <div className={className} style={{ borderTopWidth: '1px', borderColor: colors.border.light }} />;
};

// ============================================
// ContentCard Component
// ============================================
interface ContentCardProps {
  title: string;
  description?: string;
  thumbnail?: string;
  universe?: keyof typeof gradients;
  isPremium?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  title, description, thumbnail, universe = 'brand', isPremium = false, onClick, className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`overflow-hidden rounded-2xl cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-xl ${className}`}
      style={{ backgroundColor: colors.bg.secondary, boxShadow: shadows.md }}
    >
      {thumbnail && (
        <div className="relative aspect-video overflow-hidden">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {isPremium && (
            <div className="absolute top-3 right-3">
              <Badge variant="warning">Premium</Badge>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          {universe && (
            <div style={{
              padding: '2px 8px', borderRadius: '9999px', fontSize: fontSize.xs, fontWeight: fontWeight.medium,
              color: universeColors[universe as keyof typeof universeColors].primary,
              background: `${universeColors[universe as keyof typeof universeColors].primary}20`
            }}>
              {universe.charAt(0).toUpperCase() + universe.slice(1)}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-lg mb-1" style={{ color: colors.text.primary, fontSize: fontSize.lg, fontWeight: fontWeight.semibold }}>{title}</h3>
        {description && <p style={{ color: colors.text.secondary, fontSize: fontSize.sm }}>{description}</p>}
      </div>
    </div>
  );
};

// ============================================
// HeroCard Component
// ============================================
interface HeroCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  thumbnail: string;
  universe?: keyof typeof gradients;
  isLive?: boolean;
  isPremium?: boolean;
  onPlay?: () => void;
  className?: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  title,
  subtitle,
  description,
  thumbnail,
  universe = 'brand',
  isLive = false,
  isPremium = false,
  onPlay,
  className = ''
}) => {
  return (
    <div className={`relative rounded-3xl overflow-hidden aspect-video ${className}`}>
      <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
      
      <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {isLive && (
            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
          {isPremium && <Badge variant="warning">Premium</Badge>}
        </div>
        
        {subtitle && <p className="text-gray-300 text-sm uppercase tracking-wider">{subtitle}</p>}
        <h1 className="text-white text-4xl font-bold">{title}</h1>
        {description && <p className="text-gray-300 max-w-2xl text-lg">{description}</p>}
        {onPlay && <Button onClick={onPlay} variant="primary" size="lg" rightIcon={<PlayIcon />}>
          Watch Now
        </Button>}
      </div>
    </div>
  );
};

// ============================================
// EmptyState Component
// ============================================
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && <div className="mb-6 opacity-60">{icon}</div>}
      <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>{title}</h3>
      <p className="mb-6" style={{ color: colors.text.secondary, fontSize: fontSize.base }}>{description}</p>
      {onAction && actionLabel && <Button onClick={onAction} variant="secondary">{actionLabel}</Button>}
    </div>
  );
};

// ============================================
// ErrorState Component
// ============================================
interface ErrorStateProps {
  type?: 'network' | 'server' | 'auth' | 'payment' | 'not-found';
  message?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ type = 'network', message, onRetry, onContactSupport }) => {
  const defaultMessages: Record<string, string> = {
    network: 'Looks like you’re offline. Check your internet connection.',
    server: 'Something went wrong on our end. We’re working on it.',
    auth: 'Your session has expired. Please log in again.',
    payment: 'Payment didn’t go through. Please try again.',
    'not-found': 'This page or content can’t be found.',
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="mb-4 rounded-full bg-red-900/20 p-4 text-red-400">
        <ExclamationIcon />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-red-300">Oops, something’s wrong</h3>
      <p className="mb-6 text-gray-400 text-base">{message || defaultMessages[type]}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {onRetry && <Button onClick={onRetry} variant="primary">Try Again</Button>}
        {onContactSupport && <Button onClick={onContactSupport} variant="ghost">Contact Support</Button>}
      </div>
    </div>
  );
};

// ============================================
// Simple Icon Components
// ============================================
const PlayIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3v14l12-7L5 3z" />
  </svg>
);
const ExclamationIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);


