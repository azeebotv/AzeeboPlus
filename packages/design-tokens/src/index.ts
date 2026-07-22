export const universeColors = {
  reality: { primary: '#FF6B6B', secondary: '#FF8E8E' },
  creators: { primary: '#4ECDC4', secondary: '#7DD9D3' },
  lifestyle: { primary: '#45B7D1', secondary: '#6EC6D8' },
  vertical: { primary: '#96CEB4', secondary: '#B5DCC7' },
  movies: { primary: '#FFEAA7', secondary: '#FFF3C2' },
  games: { primary: '#DDA0DD', secondary: '#E6BCE6' },
  comedy: { primary: '#F39C12', secondary: '#F5B041' },
  sports: { primary: '#E74C3C', secondary: '#EC7063' },
};

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type ThemeColors = {
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
};

export type DesignTokens = {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  transitions: typeof transitions;
  zIndex: typeof zIndex;
  themes: typeof themes;
};

export const colors = {
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  secondary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  accent: {
    gold: '#fbbf24',
    bronze: '#cd7f32',
    silver: '#c0c0c0',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  dark: {
    900: '#0a0a0a',
    800: '#111111',
    700: '#1a1a1a',
    600: '#222222',
    500: '#2a2a2a',
    400: '#333333',
    300: '#444444',
    200: '#666666',
    100: '#888888',
  },
  light: {
    50: '#ffffff',
    100: '#fafafa',
    200: '#f5f5f5',
    300: '#f0f0f0',
    400: '#e5e5e5',
    500: '#d4d4d4',
    600: '#a3a3a3',
    700: '#737373',
    800: '#525252',
    900: '#262626',
  },
  text: {
    primary: '#F3F4F6',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    inverse: '#111827',
  },
  bg: {
    primary: '#111827',
    secondary: '#1F2937',
    tertiary: '#374151',
    hover: '#4B5563',
  },
  border: {
    default: '#4B5563',
    light: '#374151',
    focus: '#6366F1',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

/** @deprecated Use `spacing` instead. This was a duplicate for React Native. */
export const spacingNative = spacing;

export const typography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },
  fontWeights: {
    thin: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

/** @deprecated Use `typography.fontSizes` instead. This was a duplicate for React Native. */
export const fontSizeNative = typography.fontSizes;

export const fontWeightNative = {
  thin: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  glow: '0 0 20px rgba(139, 92, 246, 0.4)',
  goldGlow: '0 0 20px rgba(251, 191, 36, 0.4)',
};

export const transitions = {
  fast: '150ms ease',
  normal: '300ms ease',
  slow: '500ms ease',
};

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 100,
  sticky: 200,
  banner: 300,
  overlay: 400,
  modal: 500,
  popover: 600,
  toast: 700,
  tooltip: 800,
};

export const themes = {
  dark: {
    background: colors.dark[900],
    surface: colors.dark[800],
    card: colors.dark[700],
    border: colors.dark[600],
    text: colors.light[50],
    textSecondary: colors.light[100],
    textMuted: colors.light[300],
  },
  light: {
    background: colors.light[50],
    surface: colors.light[100],
    card: colors.light[50],
    border: colors.light[400],
    text: colors.dark[900],
    textSecondary: colors.dark[700],
    textMuted: colors.dark[400],
  },
};

/**
 * Animation definitions
 */
export { easing, duration, animation, generateAnimationsCSS } from './animations';
