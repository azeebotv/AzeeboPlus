/**
 * Canonical brand accents, measured from the Azeebo+ Figma files
 * (web: X2wuwXqlRqgRZcb4d9qttJ, mobile: mzeJtZPyYpmeCRWeXqM79h).
 * Neither file publishes Figma styles and the variables API is out of scope for
 * our token, so these were derived empirically from frame fills.
 */
export const BRAND_SCARLET = '#E31E24';
export const BRAND_FLAME = '#EC691F';

/** #RRGGBB -> rgba() so a single hex source of truth can feed CSS and RN alike. */
export function withAlpha(hex: string, alpha: number): string {
  const v = hex.replace('#', '');
  const n =
    v.length === 3
      ? v
          .split('')
          .map((c) => c + c)
          .join('')
      : v;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const brand = {
  scarlet: BRAND_SCARLET,
  flame: BRAND_FLAME,
  /** Vanta Black base canvas (#0B090E) */
  vantaBlack: '#0B090E',
  /** Flame multi-stop brand gradient */
  flameGradient: 'linear-gradient(135deg, #E5251C 0%, #E8420A 50%, #FFA02E 100%)',
  flameRamp: ['#E5251C', '#E8420A', '#FFA02E'],
  /** Dominant brand treatment: 144 fills across the captured frames. */
  gradientCss: `linear-gradient(135deg, ${BRAND_SCARLET} 0%, ${BRAND_FLAME} 100%)`,
  /** React Native has no CSS gradients; consumers layer two Expo.LinearGradient stops. */
  gradientStops: [
    { offset: 0, color: BRAND_SCARLET },
    { offset: 1, color: BRAND_FLAME },
  ],
  /** Superseded ramp endpoints, still present in the Figma and everywhere in apps/web. */
  legacyOrange: '#E8420A',
  legacyRed: '#CC1C1C',
};

/**
 * Neutral surfaces as drawn in Figma: a flat, hue-free dark ramp.
 * Note this differs from apps/web's current warm/purple-tinted `--hp-*` palette
 * (#0b090e root, #18151e card), so adopting it visibly shifts every surface.
 */
export const surface = {
  root: '#0F0F0F',
  raised: '#141414',
  panel: '#1F1F1F',
  edge: '#262626',
  /** Deep violet-black used behind the auth/onboarding art. */
  authVoid: '#100012',
  /**
   * The second, deeper violet of the same art: measured 10 times across the
   * Onboarding, Login and Register frames. `via-purple-950` on two landing
   * pages was an improvisation for this role.
   */
  authViolet: '#1B001F',
  /**
   * Warm endpoint of the auth-page backdrop. Not a Figma fill — this is the
   * value apps/web already paints, registered so the gradient is composed from
   * tokens instead of a hand-typed hex.
   */
  authWarm: '#3A1A0A',
  faint: '#A8A8A8',
  dim: '#D9D9D9',
  ink: '#FFFFFF',
};

/** Figma builds elevation from blur + hairline borders, not drop shadows. */
export const glass = {
  blur: 12,
  border: 'rgba(255, 255, 255, 0.08)',
  /** Hover hairline — Figma lifts the border a step rather than adding a shadow. */
  borderHover: 'rgba(255, 255, 255, 0.16)',
  fill: 'rgba(255, 255, 255, 0.06)',
  /** Card panel over imagery: Figma's frost reads noticeably lighter than `fill`. */
  card: 'rgba(255, 255, 255, 0.10)',
  fillHover: 'rgba(255, 255, 255, 0.15)',
  fillActive: 'rgba(255, 255, 255, 0.22)',
  /** Placeholder / secondary label grey measured at 0.47 alpha. */
  placeholder: 'rgba(217, 217, 217, 0.47)',
};

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

/**
 * Categorical hues: colours that name a *subject* — a music genre, a vertical's
 * identity, a chart series, a tournament outcome class — instead of a state.
 *
 * These are registered, not measured: the Figma captures contain no purple,
 * pink, cyan or indigo fill at all (the only violets there are the `#100012` /
 * `#1B001F` auth art), so this is the palette the product already ships in
 * apps/web's `--brand-*` compat layer, promoted so a page can write
 * `text-az-category-violet` instead of `text-[var(--brand-purple)]`. Same
 * contract as `universeColors`: fixed, never theme-aware, and never a
 * substitute for a state ramp.
 */
export const categoryColors = {
  violet: '#8b5cf6',
  violetLight: '#a78bfa',
  pink: '#ec4899',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  indigo: '#6366f1',
  sky: '#1e90ff',
  crimson: '#c41e3a',
  emerald: '#10b981',
  forest: '#0d3b2e',
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
  brand: typeof brand;
  surface: typeof surface;
  glass: typeof glass;
  elevation: typeof elevation;
  radius: typeof radius;
  families: typeof families;
  type: typeof type;
};

export const colors = {
  primary: {
    50: '#fdeeec',
    100: '#fbdad4',
    200: '#f6b4a8',
    300: '#f18a76',
    400: BRAND_FLAME,
    500: BRAND_SCARLET,
    600: '#c2181d',
    700: '#9c1317',
    800: '#750e11',
    900: '#4e090b',
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
    tertiary: '#9CA3AF',
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
    /** Focus hairline follows web's `.az-input:focus`, which draws scarlet. */
    focus: BRAND_SCARLET,
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
  /**
   * Added from Figma measurement: 20 is the dominant flex gap (194 uses) and 40
   * the dominant container padding (220 uses), neither expressible in the old
   * named scale. Existing keys keep their values so current consumers don't shift.
   */
  thin: 10,
  gutter: 20,
  page: 40,
};

/** @deprecated Use `spacing` instead. This was a duplicate for React Native. */
export const spacingNative = spacing;

/**
 * Font family is deliberately routed through a CSS custom property so swapping
 * the display face (e.g. to the licensed Gotham Rounded used in Figma) is a
 * one-line change in the generated stylesheet rather than a sweep across pages.
 * `familiesNative` is the React-Native equivalent: same single decision point.
 */
export const families = {
  displayVar: '--az-font-display',
  displayCss: 'var(--az-font-display, "Montserrat")',
  bodyVar: '--az-font-body',
  bodyCss: 'var(--az-font-body, "Inter")',
  displayNative: 'Montserrat',
  bodyNative: 'Inter',
};

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
    /** Display sizes present in Figma but missing from the previous scale. */
    '7xl': 60,
    '8xl': 80,
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
    /** Figma's measured body leading (14/20) — looser than `tight`, tighter than `normal`. */
    body: 1.43,
    display: 1.2,
  },
  /**
   * Figma applies tracking as a flat -2px on display text, which does not scale
   * across sizes. These are normalised to em so the ratio holds at every step.
   * Uppercase labels are the one literal lift: +0.1em at 12px was consistent.
   */
  letterSpacing: {
    display: '-0.03em',
    heading: '-0.02em',
    normal: '0em',
    label: '0.1em',
    micro: '0.05em',
  },
};

/**
 * The role scale pages should actually use. Hand-authored type in Figma mixes 8
 * font families and non-integer sizes from scaled instances (14.06px, 12.30px),
 * so these roles are the normalised distillation of the most-used combinations,
 * mapped onto the two families the app loads (Inter body, Montserrat display).
 */
export type TypeRole = {
  size: number;
  lineHeight: number;
  weight: string;
  tracking: string;
  transform: 'none' | 'uppercase';
  family: 'display' | 'body';
};

export const type: Record<
  | 'microLabel'
  | 'overline'
  | 'caption'
  | 'body'
  | 'bodyStrong'
  | 'lead'
  | 'subtitle'
  | 'title'
  | 'sectionTitle'
  | 'heading'
  | 'display'
  | 'hero',
  TypeRole
> = {
  microLabel: {
    size: 10,
    lineHeight: 1.5,
    weight: '400',
    tracking: '0.05em',
    transform: 'uppercase',
    family: 'body',
  },
  overline: {
    size: 12,
    lineHeight: 1.33,
    weight: '700',
    tracking: '0.1em',
    transform: 'uppercase',
    family: 'body',
  },
  caption: {
    size: 12,
    lineHeight: 1.33,
    weight: '400',
    tracking: '0em',
    transform: 'none',
    family: 'body',
  },
  body: {
    size: 14,
    lineHeight: 1.43,
    weight: '400',
    tracking: '0em',
    transform: 'none',
    family: 'body',
  },
  bodyStrong: {
    size: 14,
    lineHeight: 1.43,
    weight: '600',
    tracking: '0em',
    transform: 'none',
    family: 'body',
  },
  lead: {
    size: 16,
    lineHeight: 1.5,
    weight: '400',
    tracking: '0em',
    transform: 'none',
    family: 'body',
  },
  subtitle: {
    size: 18,
    lineHeight: 1.5,
    weight: '500',
    tracking: '0em',
    transform: 'none',
    family: 'display',
  },
  title: {
    size: 20,
    lineHeight: 1.4,
    weight: '600',
    tracking: '-0.02em',
    transform: 'none',
    family: 'display',
  },
  sectionTitle: {
    size: 24,
    lineHeight: 1.5,
    weight: '600',
    tracking: '-0.02em',
    transform: 'none',
    family: 'display',
  },
  heading: {
    size: 32,
    lineHeight: 1.2,
    weight: '700',
    tracking: '-0.02em',
    transform: 'none',
    family: 'display',
  },
  display: {
    size: 48,
    lineHeight: 1.2,
    weight: '800',
    tracking: '-0.03em',
    transform: 'none',
    family: 'display',
  },
  hero: {
    size: 60,
    lineHeight: 1.15,
    weight: '800',
    tracking: '-0.03em',
    transform: 'none',
    family: 'display',
  },
};

export const radius = {
  /** Figma's two most-used radii after the card value, neither in `borderRadius`. */
  chip: 2,
  control: 10,
  card: 12,
  panel: 16,
  feature: 20,
  pill: 50,
  /** Oversized hero artwork corners measured at 64. */
  hero: 64,
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
  glow: `0 0 20px ${withAlpha(BRAND_SCARLET, 0.4)}`,
  goldGlow: '0 0 20px rgba(251, 191, 36, 0.4)',
};

/**
 * Figma builds depth almost entirely from background blur plus a 1px
 * rgba(255,255,255,0.08) hairline; drop shadows appear only 11 times across the
 * captured frames. Prefer `elevation` over `shadows` for new surfaces.
 */
export const elevation = {
  none: 'none',
  hairline: `0 0 0 1px ${glass.border}`,
  /** The one real shadow in the file: ~50px blur, ~3px y-offset, black. */
  lifted: '0 3px 50px rgba(0, 0, 0, 0.35)',
  /** Sticky header once the page has scrolled under it. */
  sticky: '0 1px 24px 0 rgba(0, 0, 0, 0.4)',
  /** Sticky header at rest. */
  stickyIdle: '0 1px 12px 0 rgba(0, 0, 0, 0.2)',
  blurPx: glass.blur,
};

/**
 * Hue-tinted blooms. Figma barely shadows anything, but the product's reward,
 * restriction and rank surfaces all paint one, and each page hand-typed its own
 * rgba() literal — which is how a single warning glow ended up with five
 * different geometries. Every value here is derived from a registered hex, so
 * moving a hue moves its glow with it.
 */
export const glows = {
  /** Rank chips on the leaderboard: a short, tight bloom under the medal gradient. */
  gold: `0 4px 16px ${withAlpha(colors.accent.gold, 0.4)}`,
  silver: `0 4px 16px ${withAlpha(colors.accent.silver, 0.3)}`,
  bronze: `0 4px 16px ${withAlpha(colors.accent.bronze, 0.3)}`,
  /** Reward tiles: the same metal, but a wide halo rather than a drop. */
  badge: `0 0 25px ${withAlpha(colors.accent.gold, 0.3)}`,
  badgeStrong: `0 0 40px ${withAlpha(colors.accent.gold, 0.3)}`,
  /** Status surfaces (maintenance, rate-limited, degraded). */
  warning: `0 8px 32px ${withAlpha(colors.warning[500], 0.3)}`,
  warningBloom: `0 0 40px ${withAlpha(colors.warning[500], 0.3)}`,
  warningSpark: `0 0 12px ${withAlpha(colors.warning[500], 0.6)}`,
  error: `0 8px 32px ${withAlpha(colors.error[500], 0.35)}`,
  primary: `0 8px 32px ${withAlpha(BRAND_SCARLET, 0.35)}`,
  primarySoft: `0 0 12px ${withAlpha(BRAND_SCARLET, 0.3)}`,
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
    background: surface.root,
    surface: surface.raised,
    card: surface.panel,
    border: surface.edge,
    text: surface.ink,
    textSecondary: surface.dim,
    textMuted: surface.faint,
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

/**
 * Polling-interval tokens (single source of truth for refetchInterval values)
 */
export { pollingIntervals } from './polling';
export type { PollingIntervalName } from './polling';

/**
 * Aspect-ratio manifest (PMR Task DD-05)
 */
export { aspectRatios, aspectRatioValues } from './aspect-ratios';
export type { AspectRatioName } from './aspect-ratios';

