/**
 * Azeebo+ Brand Theme for React Native
 * Extends @azeebo/design-tokens with mobile-specific overrides.
 * Brand accents come from the token package so the canonical Figma accent is
 * defined exactly once.
 */

// Re-export base tokens from design-tokens package for consistency
import { brand, colors as tokenColors } from '@azeebo/design-tokens';

export { brand, zIndex, themes } from '@azeebo/design-tokens';

// ── Brand Colors ──────────────────────────────────────────────
export const colors = {
  // Primary brand
  primaryColor: brand.scarlet, // Canonical accent — CTAs, logo accent, highlights
  primaryDark: tokenColors.primary[600], // Pressed state
  secondary: '#1A1A1A', // Secondary surface color
  red: brand.scarlet, // Buttons, active states, glow
  redDark: tokenColors.primary[700], // Pressed state

  // Backgrounds
  bg: {
    primary: '#0B090E', // Page root: near-black with warm purple tint (matching web --hp-bg)
    secondary: '#100E14', // Alternating section background (--hp-bg-alt)
    tertiary: '#201C28', // Elevated surface
    surface: '#18151E', // Card backgrounds, input fields (--hp-card-bg)
    surfaceInput: '#18151E', // Input field backgrounds
    surfaceLight: '#fafafa', // Light card/paper surface (light-scheme panels)
    deep: '#0A0A1A', // Deep-space universe hero surfaces
    deepRaised: '#2d1f5e', // Elevated deep-surface (violet dusk)
    glass: 'rgba(255,255,255,0.06)', // Frosted glass panels
    glassBorder: 'rgba(255,255,255,0.12)', // Glass panel borders
    green: '#0D3B2E', // Forest green — legacy compatibility
  },

  // Text
  text: {
    primary: '#FFFFFF', // White — primary text
    secondary: '#9A8A7A', // Warm grey — secondary text
    tertiary: '#9A8A7A', // Warm grey — hints, captions (meets WCAG AA contrast >= 4.5:1)
    muted: '#9A8A7A', // Alias for tertiary
    inverse: '#0A0A0A', // Dark text on light backgrounds
    accent: brand.scarlet, // Accent text
    link: brand.scarlet, // Link color
  },

  // Semantic
  primary: tokenColors.primary,
  /* Semantic ramps come straight from the token package so a screen can never
     drift from the web's ramp again. */
  success: tokenColors.success,
  warning: tokenColors.warning,
  error: tokenColors.error,
  info: tokenColors.secondary,

  // Borders
  border: {
    default: 'rgba(255,255,255,0.2)',
    primary: 'rgba(255,255,255,0.2)',
    focus: tokenColors.border.focus,
    subtle: 'rgba(255,255,255,0.04)',
  },

  // Canonical neutral ramp — Tailwind-coincident cool greys. Text-tier
  // greys live in text.*; these serve borders, disabled fills, and
  // light-surface UI.
  neutral: {
    100: '#f0f0f0',
    200: '#e5e5e5',
    300: '#ccc',
    400: '#aaa',
    500: '#888',
    600: '#666',
    700: '#444',
    800: '#333',
    900: '#222',
    950: '#111',
  },

  // Decorative category hues — badges, chips, tags, stat fills that carry
  // vertical identity (games, comedy, sports, creators). These are the one
  // deliberately non-semantic group: they encode category color-coding.
  category: {
    highlight: '#FFEAA7', // warm gold
    amber: '#F39C12',
    mint: '#96CEB4',
    teal: '#4ECDC4',
    blue: '#45B7D1',
    indigo: '#6366F1',
    purple: '#DDA0DD',
    green: '#10B911',
    cocoa: '#6B5B4B',
  },

  // Pre-multiplied alpha washes (8-digit hex) for tints and glows.
  alpha: {
    /* React Native has no color-mix(), so tints are the brand hex plus an
       alpha byte — derived from the tokens rather than restated. */
    primary20: `${brand.flame}20`,
    danger20: `${brand.scarlet}20`,
    success25: '#22C55E25',
    violet20: '#8B5CF620',
  },

  // Overlays
  overlay: {
    dark: 'rgba(10,10,10,0.85)',
    light: 'rgba(255,255,255,0.05)',
  },

  // Dark shade scale (Tailwind gray)
  dark: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#030712',
    950: '#0A0A0A',
  },

  // Light shade scale (Tailwind gray)
  light: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // Accent metallics
  accent: {
    gold: '#F59E0B',
    silver: '#9CA3AF',
    bronze: '#CD7F32',
  },
} as const;

// ── Agbala Path Colors ────────────────────────────────────────
export const pathColors = {
  warrior: '#C41E3A',
  sage: '#1E90FF',
  trickster: '#FFD700',
  healer: '#32CD32',
} as const;

// ── Universe Colors ───────────────────────────────────────────
export const universeColors: Record<string, string> = {
  reality: '#8b5cf6',
  creators: brand.flame,
  creator: brand.flame,
  lifestyle: '#ec4899',
  vertical: '#3b82f6',
  movies: brand.flame,
  movie: brand.flame,
  games: '#06b6d4',
  comedy: '#fbbf24',
  sports: '#22c55e',
  music: '#d946ef',
  cinemaxis: '#0A1A3B',
};

// ── Typography ────────────────────────────────────────────────
export const typography = {
  fontFamily: {
    display: 'System', // Montserrat equivalent via system bold
    body: 'System', // Inter equivalent via system
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
    shadowColor: brand.scarlet,
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

// ── Default Images ──────────────────────────────────────────
export const defaultImages = {
  thumbnail: 'https://placehold.co/800x600/1a1a1a/ffffff?text=Azeebo%2B',
  avatar: 'https://placehold.co/200x200/1a1a1a/ffffff?text=U',
  banner: 'https://placehold.co/1200x400/1a1a1a/ffffff?text=Azeebo%2B',
} as const;
