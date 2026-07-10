/**
 * Azeebo+ Brand Theme for React Native
 * Matches the web design system in design prompt.md
 */

// ── Brand Colors ──────────────────────────────────────────────
export const colors = {
  // Primary brand
  primaryColor: '#E8420A', // Azeebo Orange — CTAs, logo accent, highlights
  primaryDark: '#C83A08', // Darker orange for pressed states
  red: '#CC1C1C', // Deep Red — buttons, active states, glow
  redDark: '#B91818', // Darker red for pressed states

  // Backgrounds
  bg: {
    primary: '#1A0A0A', // Warm near-black — main background
    secondary: '#0A0A0A', // Cool near-black
    tertiary: '#2A1A1A', // Elevated surface
    surface: '#2A2A2A', // Card backgrounds, input fields
    surfaceInput: '#1E1E1E', // Input field backgrounds
    glass: 'rgba(255,255,255,0.08)', // Frosted glass panels
    glassBorder: 'rgba(255,255,255,0.2)', // Glass panel borders
    green: '#0D3B2E', // Forest green — marketing/hero backgrounds
  },

  // Text
  text: {
    primary: '#FFFFFF', // White — primary text
    secondary: '#9A8A7A', // Warm grey — secondary text
    tertiary: '#6B5B4B', // Muted grey — hints, captions
    inverse: '#0A0A0A', // Dark text on light backgrounds
    accent: '#E8420A', // Orange accent text
    link: '#E8420A', // Link color
  },

  // Semantic
  primary: {
    50: '#FEF3EC',
    100: '#FDE2D1',
    200: '#FBC5A3',
    300: '#F89E6B',
    400: '#F46E2E',
    500: '#E8420A',
    600: '#C83A08',
    700: '#A33007',
    800: '#7E2505',
    900: '#5A1A03',
  },
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#CC1C1C',
    600: '#B91818',
    700: '#991B1B',
    800: '#7F1D1D',
    900: '#611111',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Borders
  border: {
    default: 'rgba(255,255,255,0.2)',
    focus: '#E8420A',
    subtle: 'rgba(255,255,255,0.04)',
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
  creators: '#E8420A',
  creator: '#E8420A',
  lifestyle: '#ec4899',
  vertical: '#3b82f6',
  movies: '#E8420A',
  movie: '#E8420A',
  games: '#06b6d4',
  comedy: '#fbbf24',
  sports: '#22c55e',
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

// ── Default Images ──────────────────────────────────────────
export const defaultImages = {
  thumbnail: 'https://placehold.co/800x600/1a1a1a/ffffff?text=Azeebo%2B',
  avatar: 'https://placehold.co/200x200/1a1a1a/ffffff?text=U',
  banner: 'https://placehold.co/1200x400/1a1a1a/ffffff?text=Azeebo%2B',
} as const;
