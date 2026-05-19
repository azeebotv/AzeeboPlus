import React from 'react';
import { colors, spacing, borderRadius, shadows } from '@azeebo/design-tokens';

// Button Component
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  style?: React.CSSProperties;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  onClick,
  disabled = false,
  leftIcon,
  style,
  ariaLabel,
  ariaDescribedBy,
  tabIndex,
}: ButtonProps): React.ReactElement {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary',
    ghost: 'bg-transparent text-text hover:bg-gray-800 focus:ring-gray-600',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
      tabIndex={tabIndex}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
    </button>
  );
}

// Card Component
export interface CardProps {
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({
  className = '',
  padding = 'md',
  children,
  onClick,
}: CardProps): React.ReactElement {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-card rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl ${paddingStyles[padding]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
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
    <Card padding="none" onClick={onClick}>
      <div className="relative aspect-video bg-gray-900">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {isPremium && (
          <Badge variant="success" className="absolute top-2 right-2">
            Premium
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-text truncate">{title}</h3>
        {description && (
          <p className="text-textSecondary text-sm mt-1 line-clamp-2">{description}</p>
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
    <div className="relative rounded-2xl overflow-hidden">
      <div className="aspect-video relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={onPlay}
            className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center hover:scale-110 transition-transform duration-200"
          >
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-2 mb-2">
          {isLive && <Badge variant="error">Live</Badge>}
          {isPremium && <Badge variant="success">Premium</Badge>}
          <Badge variant="outline">{universe.charAt(0).toUpperCase() + universe.slice(1)}</Badge>
        </div>
        <p className="text-textSecondary text-sm mb-1">{subtitle}</p>
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-textSecondary text-sm line-clamp-2">{description}</p>
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
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '0.375rem',
  className = '',
}: SkeletonProps): React.ReactElement {
  return (
    <div
      className={`animate-pulse bg-gray-700 ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

// Divider Component
export interface DividerProps {
  className?: string;
}

export function Divider({ className = '' }: DividerProps): React.ReactElement {
  return <div className={`border-t border-border ${className}`} />;
}

// Badge Component
export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'outline';
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = 'primary',
  className = '',
  children,
}: BadgeProps): React.ReactElement {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variantStyles = {
    primary: 'bg-primary/20 text-primary',
    secondary: 'bg-secondary/20 text-secondary',
    success: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    outline: 'border border-border text-textSecondary',
  };

  return <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>{children}</span>;
}

// Avatar Component
export interface AvatarProps {
  size?: 'sm' | 'medium' | 'lg';
  src?: string;
  fallback: string;
  className?: string;
}

export function Avatar({
  size = 'medium',
  src,
  fallback,
  className = '',
}: AvatarProps): React.ReactElement {
  const sizeStyles = {
    sm: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div
      className={`${sizeStyles[size]} rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-semibold text-white ${className}`}
    >
      {src ? <img src={src} alt="" className="w-full h-full rounded-full object-cover" /> : fallback}
    </div>
  );
}