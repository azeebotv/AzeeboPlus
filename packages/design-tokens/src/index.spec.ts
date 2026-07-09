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
} from './index';

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
});
