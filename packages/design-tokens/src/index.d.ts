export declare const universeColors: {
  reality: {
    primary: string;
    secondary: string;
  };
  creators: {
    primary: string;
    secondary: string;
  };
  lifestyle: {
    primary: string;
    secondary: string;
  };
  vertical: {
    primary: string;
    secondary: string;
  };
  movies: {
    primary: string;
    secondary: string;
  };
  games: {
    primary: string;
    secondary: string;
  };
  comedy: {
    primary: string;
    secondary: string;
  };
  sports: {
    primary: string;
    secondary: string;
  };
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
export declare const colors: {
  primary: {
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
  secondary: {
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
  accent: {
    gold: string;
    bronze: string;
    silver: string;
  };
  success: {
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
  warning: {
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
  error: {
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
  dark: {
    900: string;
    800: string;
    700: string;
    600: string;
    500: string;
    400: string;
    300: string;
    200: string;
    100: string;
  };
  light: {
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
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    hover: string;
  };
  border: {
    default: string;
    light: string;
    focus: string;
  };
};
export declare const spacing: {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
};
export declare const spacingNative: {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
};
export declare const typography: {
  fontSizes: {
    xs: number;
    sm: number;
    base: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
    '6xl': number;
  };
  fontWeights: {
    thin: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
};
export declare const fontSizeNative: {
  xs: number;
  sm: number;
  base: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
  '6xl': number;
};
export declare const fontWeightNative: {
  thin: '300';
  normal: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
  extrabold: '800';
};
export declare const borderRadius: {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  full: number;
};
export declare const shadows: {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  glow: string;
  goldGlow: string;
};
export declare const transitions: {
  fast: string;
  normal: string;
  slow: string;
};
export declare const zIndex: {
  hide: number;
  auto: string;
  base: number;
  dropdown: number;
  sticky: number;
  banner: number;
  overlay: number;
  modal: number;
  popover: number;
  toast: number;
  tooltip: number;
};
export declare const themes: {
  dark: {
    background: string;
    surface: string;
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
  };
  light: {
    background: string;
    surface: string;
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
  };
};
/**
 * Animation definitions
 */
export { easing, duration, animation } from './animations';
//# sourceMappingURL=index.d.ts.map
