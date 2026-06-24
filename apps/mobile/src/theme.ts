/**
 * Azeebo+ Brand Theme for React Native
 * Matches the web design system in design prompt.md
 */

// ── Brand Colors ──────────────────────────────────────────────
export const colors = {
  // Primary brand
  primary: '#E8420A',       // Azeebo Orange — CTAs, logo accent, highlights
  primaryDark: '#C83A08',   // Darker orange for pressed states
  red: '#CC1C1C',           // Deep Red — buttons, active states, glow
  redDark: '#B91818',       // Darker red for pressed states

  // Backgrounds
  bg: {
    primary: '#0A0A0A',     // Near-black — main background
    secondary: '#1A0A0A',   // Slightly warmer black — cards, surfaces
    tertiary: '#2A1A1A',    // Elevated surface
    surface: '#2A2A2A',     // Card backgrounds, input fields
    surfaceInput: '#1E1E1E', // Input field backgrounds
    glass: 'rgba(255,255,255,0.08)', // Frosted glass panels
    glassBorder: 'rgba(255,255,255,0.12)', // Glass panel borders
    green: '#0D3B2E',       // Forest green — marketing/hero backgrounds
  },

  // Text
  text: {
    primary: '#FFFFFF',     // White — primary text
    secondary: '#9A8A7A',   // Warm grey — secondary text
    tertiary: '#6B5B4B',    // Muted grey — hints, captions
    inverse: '#0A0A0A',     // Dark text on light backgrounds
    accent: '#E8420A',      // Orange accent text
    link: '#E8420A',        // Link color
  },

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#CC1C1C',
  info: '#3B82F6',

  // Borders
  border: {
    default: 'rgba(255,255,255,0.08)',
    focus: '#CC1C1C',
    subtle: 'rgba(255,255,255,0.04)',
  },

  // Overlays
  overlay: {
    dark: 'rgba(10,10,10,0.85)',
    light: 'rgba(255,255,255,0.05)',
  },
} as const;

// ── Universe Colors ───────────────────────────────────────────
export const universeColors: Record<string, string> = {
  reality: '#CC1C1C',
  creators: '#E8420A',
  lifestyle: '#0D3B2E',
  vertical: '#8B5CF6',
  movies: '#F59E0B',
  games: '#3B82F6',
  comedy: '#22C55E',
  sports: '#EF4444',
  music: '#EC4899',
};

// ── Typography ────────────────────────────────────────────────
export const typography = {
  fontFamily: {
    display: 'System',   // Montserrat equivalent via system bold
    body: 'System',       // Inter equivalent via system
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ── Spacing ───────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
} as const;

// ── Border Radius ─────────────────────────────────────────────
export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 16,
  xxl: 24,
  pill: 999,
} as const;

// ── Shadows (for frosted glass glow effect) ───────────────────
export const shadows = {
  glass: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  glassStrong: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },
  red: {
    shadowColor: '#CC1C1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ── Animation Durations ───────────────────────────────────────
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// ── Motion (spring configs for react-native-reanimated) ──────
export const spring = {
  gentle: { damping: 15, stiffness: 150, mass: 1 },
  snappy: { damping: 20, stiffness: 300, mass: 0.8 },
  bouncy: { damping: 12, stiffness: 200, mass: 1 },
  stiff: { damping: 25, stiffness: 400, mass: 0.6 },
} as const;

// ── Depth Layers (z-index scale) ─────────────────────────────
export const depth = {
  base: 0,
  card: 1,
  overlay: 10,
  modal: 100,
  toast: 200,
} as const;
