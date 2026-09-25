/**
 * Azeebo+ TV Theme
 *
 * 10-foot UI scale: typography and spacing are ~1.4–1.6x the phone theme.
 * Shares the same brand palette (re-exported from the mobile theme source of
 * truth) so the TV experience stays on-brand.
 */
import { colors } from '../../mobile/src/theme';

export {
  colors,
  pathColors,
  universeColors,
  shadows,
  depth,
  defaultImages,
} from '../../mobile/src/theme';

// ── TV Typography (10-foot UI: larger everywhere) ─────────────
export const tvTypography = {
  fontFamily: {
    display: 'System',
    body: 'System',
  },
  fontSize: {
    xs: 14,
    sm: 16,
    base: 20,
    md: 22,
    lg: 26,
    xl: 32,
    xxl: 40,
    hero: 56,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

// ── TV Spacing ────────────────────────────────────────────────
export const tvSpacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
  section: 64,
} as const;

// ── TV Radius ─────────────────────────────────────────────────
export const tvRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

// ── Focus Treatment ───────────────────────────────────────────
// The visual language of TV: the focused item scales up and gets a bright
// border. The border color is the brand orange; unfocused items dim slightly.
export const focus = {
  scale: 1.08,
  borderWidth: 4,
  borderColor: colors.border.focus,
  unfocusedOpacity: 0.75,
  transitionMs: 150,
} as const;

// ── TV-specific dims ──────────────────────────────────────────
// Card sizes tuned for 1080p at TV viewing distance.
export const tvDims = {
  heroHeight: 480,
  railCardWidth: 320,
  railCardHeight: 180, // 16:9
  navRailWidth: 280,
  topBarHeight: 96,
} as const;
