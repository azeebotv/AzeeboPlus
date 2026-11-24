/**
 * Azeebo+ Brand Theme & Vanta Black Design System (TypeScript Constants)
 * Generated from Official Logo Color Extraction & Vanta Dark Mode Guidelines
 */

export const AZEEBO_BRAND = {
  name: 'Azeebo+',
  tagline: 'The Universe of African & Global Entertainment',
  colors: {
    // Extracted Logo Flame Palette
    logo: {
      crimson: '#E5251C', // Stop 1
      scarlet: '#F3501A', // Stop 2 (Primary)
      flame: '#FF6B00',   // Stop 3
      amber: '#FFA02E',   // Stop 4
      coral: '#FA8128',   // Accent
    },
    // Vanta Black OLED Matrix
    vanta: {
      black: '#050505',
      surface0: '#09090C',
      surface1: '#0F0F14',
      surface2: '#15151C',
      surface3: '#1C1C26',
      surfaceInput: '#111116',
      glassBg: 'rgba(15, 15, 20, 0.72)',
      glassBorder: 'rgba(255, 255, 255, 0.08)',
      glassBorderHover: 'rgba(255, 255, 255, 0.18)',
      glassBorderActive: 'rgba(243, 80, 26, 0.45)',
    },
    // High-Contrast Text
    text: {
      primary: '#FFFFFF',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
      muted: '#64748B',
      accent: '#FF6B00',
      inverse: '#050505',
    },
    // Universes
    universes: {
      reality: { id: 'reality', name: 'Reality & Voting', color: '#FF3366', glow: 'rgba(255, 51, 102, 0.35)' },
      creators: { id: 'creators', name: 'Creator Hub', color: '#00E5FF', glow: 'rgba(0, 229, 255, 0.35)' },
      movies: { id: 'movies', name: 'Azeebo Cinema', color: '#FFA02E', glow: 'rgba(255, 160, 46, 0.35)' },
      comedy: { id: 'comedy', name: 'Comedy & Shows', color: '#FFD600', glow: 'rgba(255, 214, 0, 0.35)' },
      sports: { id: 'sports', name: 'Live Sports', color: '#00E676', glow: 'rgba(0, 230, 118, 0.35)' },
      games: { id: 'games', name: 'Play & Win', color: '#B388FF', glow: 'rgba(179, 136, 255, 0.35)' },
      lifestyle: { id: 'lifestyle', name: 'Lifestyle & Culture', color: '#45B7D1', glow: 'rgba(69, 183, 209, 0.35)' },
      vertical: { id: 'vertical', name: 'Reels & Shorts', color: '#FF007A', glow: 'rgba(255, 0, 122, 0.35)' },
    },
    // Status
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    }
  },
  gradients: {
    brandFlame: 'linear-gradient(135deg, #E5251C 0%, #F3501A 38%, #FF6B00 72%, #FFA02E 100%)',
    brandSubtle: 'linear-gradient(135deg, rgba(229, 37, 28, 0.15) 0%, rgba(243, 80, 26, 0.05) 100%)',
    vantaGlow: 'radial-gradient(circle at top center, rgba(243, 80, 26, 0.16) 0%, rgba(5, 5, 5, 0) 70%)',
    scrim: 'linear-gradient(180deg, transparent 0%, rgba(5, 5, 5, 0.6) 60%, #050505 100%)',
  },
  shadows: {
    card: '0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
    elevated: '0 20px 45px -10px rgba(0, 0, 0, 0.9), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
    brandGlow: '0 0 35px rgba(243, 80, 26, 0.35)',
    brandGlowSubtle: '0 0 18px rgba(243, 80, 26, 0.2)',
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  }
} as const;

export type AzeeboBrandTheme = typeof AZEEBO_BRAND;
