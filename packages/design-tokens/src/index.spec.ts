import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  themes,
  universeColors,
  brand,
  surface,
  glass,
  radius,
  type as typeScale,
} from './index';

describe('Canonical brand (Figma-derived)', () => {
  it('anchors the primary ramp on the Figma-dominant accent, not the legacy orange', () => {
    expect(brand.scarlet).toBe('#E31E24');
    expect(brand.flame).toBe('#EC691F');
    expect(colors.primary[500]).toBe(brand.scarlet);
    expect(colors.primary[400]).toBe(brand.flame);
    expect(colors.primary[500]).not.toBe(brand.legacyOrange);
  });

  it('expresses the CTA treatment as one gradient definition', () => {
    expect(brand.gradientCss).toContain(brand.scarlet);
    expect(brand.gradientCss).toContain(brand.flame);
    expect(brand.gradientStops).toHaveLength(2);
  });

  it('drives dark theme surfaces from the measured neutral ramp', () => {
    expect(themes.dark.background).toBe(surface.root);
    expect(themes.dark.card).toBe(surface.panel);
    expect(surface.root).toBe('#0F0F0F');
  });

  it('builds depth from blur plus hairline rather than drop shadow', () => {
    expect(glass.blur).toBe(12);
    expect(glass.border).toBe('rgba(255, 255, 255, 0.08)');
    // The card frost sits over imagery, so it must stay lighter than plain fill.
    expect(glass.card).toBe('rgba(255, 255, 255, 0.10)');
    expect(shadows.glow).toContain('227, 30, 36');
  });

  it('exposes the radii Figma uses that the numeric scale lacked', () => {
    expect(radius.card).toBe(12);
    expect(radius.control).toBe(10);
    expect(radius.chip).toBe(2);
  });

  it('carries the spacing steps measured as dominant in Figma', () => {
    expect(spacing.gutter).toBe(20);
    expect(spacing.page).toBe(40);
    expect(spacing.thin).toBe(10);
    // legacy keys must not shift value when new steps are added
    expect(spacing.xl).toBe(24);
  });

  it('defines a type role scale using only the two loaded families', () => {
    const families = new Set(Object.values(typeScale).map((r) => r.family));
    expect(families).toEqual(new Set(['body', 'display']));
    const sizes = Object.values(typeScale).map((r) => r.size);
    const allowed = new Set<number>(Object.values(typography.fontSizes));
    for (const s of sizes) expect(allowed.has(s)).toBe(true);
    expect(typeScale.body.size).toBe(14);
    expect(typeScale.body.lineHeight).toBeCloseTo(1.43);
    expect(typeScale.overline.transform).toBe('uppercase');
    expect(typeScale.overline.tracking).toBe('0.1em');
  });
});

describe('Design Tokens', () => {
  it('should export colors object with expected scales', () => {
    expect(colors).toBeDefined();
    expect(typeof colors).toBe('object');
    expect(colors.primary).toBeDefined();
    expect(colors.primary[500]).toBeDefined();
    expect(colors.secondary).toBeDefined();
    expect(colors.success).toBeDefined();
    expect(colors.warning).toBeDefined();
    expect(colors.error).toBeDefined();
  });

  it('should export spacing object with expected keys', () => {
    expect(spacing).toBeDefined();
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
  });

  it('should export typography object with fontSizes and fontWeights', () => {
    expect(typography).toBeDefined();
    expect(typography.fontSizes).toBeDefined();
    expect(typography.fontSizes.base).toBe(14);
    expect(typography.fontWeights).toBeDefined();
    expect(typography.fontWeights.bold).toBe('700');
  });

  it('should export universeColors object', () => {
    expect(universeColors).toBeDefined();
    expect(universeColors.reality).toBeDefined();
    expect(universeColors.reality.primary).toBe('#FF6B6B');
    expect(universeColors.games).toBeDefined();
  });

  it('should export borderRadius, shadows, transitions, zIndex, and themes', () => {
    expect(borderRadius).toBeDefined();
    expect(shadows).toBeDefined();
    expect(transitions).toBeDefined();
    expect(zIndex).toBeDefined();
    expect(themes).toBeDefined();
    expect(themes.dark).toBeDefined();
    expect(themes.light).toBeDefined();
  });

  it('should export canonical aspect-ratio manifest tokens (DD-05)', () => {
    const { aspectRatios, aspectRatioValues } = require('./index');
    expect(aspectRatios).toBeDefined();
    expect(aspectRatios.poster).toBe('3:4');
    expect(aspectRatios.feed).toBe('4:5');
    expect(aspectRatios.landscape).toBe('16:9');
    expect(aspectRatios.square).toBe('1:1');
    expect(aspectRatios.story).toBe('9:16');
    expect(aspectRatioValues.poster).toBe(0.75);
    expect(aspectRatioValues.square).toBe(1);
  });
});
