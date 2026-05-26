import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type IconName = keyof typeof LucideIcons;

export interface IconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  color?: string;
  className?: string;
  ariaLabel?: string;
  ariaHidden?: boolean;
}

export function Icon({
  name,
  size = 'md',
  color,
  className = '',
  ariaLabel,
  ariaHidden = false,
}: IconProps): React.ReactElement {
  const IconComponent = LucideIcons[name] as LucideIcon;

  if (!IconComponent) {
    console.warn(`Icon "${String(name)}" not found in Lucide icons`);
    return null as unknown as React.ReactElement;
  }

  const sizeMap = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
  };

  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <IconComponent
      size={iconSize}
      color={color}
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden || !ariaLabel ? true : undefined}
    />
  );
}

export default Icon;