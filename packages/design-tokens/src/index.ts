// Core Color Palette
export const colors = {
  // Primary Brand
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  
  // Secondary Brand
  secondary: '#EC4899',
  secondaryDark: '#DB2777',
  secondaryLight: '#F472B6',
  
  // Semantic Colors
  success: '#10B981',
  successDark: '#059669',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningDark: '#D97706',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorDark: '#DC2626',
  errorLight: '#F87171',
  info: '#3B82F6',
  
  // Backgrounds (Dark Theme Foundation)
  bg: {
    primary: '#111827',
    secondary: '#1F2937',
    tertiary: '#374151',
    hover: '#4B5563',
  },
  
  // Text Colors
  text: {
    primary: '#F3F4F6',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    inverse: '#111827',
  },
  
  // Borders & Dividers
  border: {
    default: '#4B5563',
    light: '#374151',
    focus: '#6366F1',
  },
  
  // Generic Colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Universe-Specific Accent Colors
export const universeColors = {
  brand: { primary: '#6366F1', secondary: '#EC4899' },
  reality: { primary: '#F59E0B', secondary: '#EF4444' },
  creator: { primary: '#EC4899', secondary: '#F472B6' },
  lifestyle: { primary: '#F97316', secondary: '#FBBF24' },
  vertical: { primary: '#8B5CF6', secondary: '#6366F1' },
  movie: { primary: '#EF4444', secondary: '#DC2626' },
  games: { primary: '#10B981', secondary: '#059669' },
  comedy: { primary: '#FBBF24', secondary: '#F59E0B' },
  sports: { primary: '#06B6D4', secondary: '#0EA5E9' },
};

// Gradient Definitions
export const gradients = {
  brand: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
  reality: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  creator: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
  lifestyle: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
  vertical: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
  movie: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  games: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  comedy: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
  sports: 'linear-gradient(135deg, #06B6D4 0%, #0EA5E9 100%)',
  premium: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)',
};

// Border Radius Scale
export const borderRadius = {
  sm: '0.125rem', // 2px
  md: '0.375rem', // 6px
  lg: '0.5rem',   // 8px
  xl: '0.75rem',  // 12px
  '2xl': '1rem',  // 16px
  '3xl': '1.5rem',// 24px
  full: '9999px',
};

// Spacing Scale
export const spacing = {
  '0': '0',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  xs: '0.25rem', // alias for '1'
  sm: '0.5rem', // alias for '2'
  md: '1rem', // alias for '4'
  lg: '1.5rem', // alias for '6'
  xl: '2rem', // alias for '8'
  '2xl': '3rem', // alias for '12'
  '3xl': '4rem', // alias for '16'
};

export const spacingNative = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
  xs: 4, // alias for '1'
  sm: 8, // alias for '2'
  md: 16, // alias for '4'
  lg: 24, // alias for '6'
  xl: 32, // alias for '8'
  '2xl': 48, // alias for '12'
  '3xl': 64, // alias for '16'
};

// Font Size Scale
export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
};

export const fontSizeNative = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16, // alias for base
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
};

// Font Weight Scale
export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const fontWeightNative = {
  thin: '100' as const,
  extralight: '200' as const,
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

// Line Height Scale
export const lineHeight = {
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
};

// Letter Spacing
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// Animation Tokens
export const animation = {
  // Durations in milliseconds
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
  },
  
  // Easing functions
  ease: {
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// Breakpoints
export const breakpoints = {
  xs: '0',
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const breakpointsNative = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Shadow Tokens
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

export const shadowsNative = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 15,
  },
};
