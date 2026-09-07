import { describe, it, expect } from 'vitest';

// Accessibility utility functions
function checkColorContrast(foreground: string, background: string): number {
  // Simplified contrast ratio calculation
  const getLuminance = (hex: string): number => {
    const rgb = hex
      .replace('#', '')
      .match(/.{2}/g)
      ?.map((h) => parseInt(h, 16) / 255) || [0, 0, 0];
    const [r, g, b] = rgb.map((v) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function meetsWCAGAA(ratio: number): boolean {
  return ratio >= 4.5;
}

function meetsWCAGAAA(ratio: number): boolean {
  return ratio >= 7;
}

function generateAltText(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function checkHeadingOrder(headings: string[]): boolean {
  if (headings.length === 0) return true;
  let lastLevel = parseInt(headings[0].replace('h', ''));
  for (let i = 1; i < headings.length; i++) {
    const level = parseInt(headings[i].replace('h', ''));
    if (level - lastLevel > 1) return false;
    lastLevel = level;
  }
  return true;
}

function validateAriaLabel(element: { role?: string; ariaLabel?: string; text?: string }): boolean {
  if (element.ariaLabel) return true;
  if (element.text && element.text.trim().length > 0) return true;
  return false;
}

function checkTabIndex(elements: { tabIndex: number; isVisible: boolean }[]): boolean {
  const visibleElements = elements.filter((e) => e.isVisible);
  const tabbableElements = visibleElements.filter((e) => e.tabIndex >= 0);
  return tabbableElements.length > 0;
}

describe('Color Contrast', () => {
  it('calculates contrast ratio correctly', () => {
    const ratio = checkColorContrast('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('white on white has low contrast', () => {
    const ratio = checkColorContrast('#ffffff', '#ffffff');
    expect(ratio).toBeCloseTo(1, 0);
  });

  it('black on white meets WCAG AA', () => {
    const ratio = checkColorContrast('#000000', '#ffffff');
    expect(meetsWCAGAA(ratio)).toBe(true);
  });

  it('light gray on white fails WCAG AA', () => {
    const ratio = checkColorContrast('#cccccc', '#ffffff');
    expect(meetsWCAGAA(ratio)).toBe(false);
  });

  it('dark text on light background meets WCAG AAA', () => {
    const ratio = checkColorContrast('#1a1a1a', '#ffffff');
    expect(meetsWCAGAAA(ratio)).toBe(true);
  });
});

describe('Alt Text Generation', () => {
  it('generates alt text from filename', () => {
    expect(generateAltText('hero-banner.jpg')).toBe('Hero Banner');
  });

  it('handles underscores', () => {
    expect(generateAltText('user_avatar.png')).toBe('User Avatar');
  });

  it('removes file extension', () => {
    expect(generateAltText('photo.webp')).toBe('Photo');
  });
});

describe('Heading Order', () => {
  it('validates correct heading order', () => {
    expect(checkHeadingOrder(['h1', 'h2', 'h3', 'h4'])).toBe(true);
  });

  it('rejects skipped heading levels', () => {
    expect(checkHeadingOrder(['h1', 'h3'])).toBe(false);
  });

  it('allows same level headings', () => {
    expect(checkHeadingOrder(['h2', 'h2', 'h2'])).toBe(true);
  });
});

describe('ARIA Labels', () => {
  it('passes when aria-label is present', () => {
    expect(validateAriaLabel({ role: 'button', ariaLabel: 'Close' })).toBe(true);
  });

  it('passes when text content exists', () => {
    expect(validateAriaLabel({ role: 'button', text: 'Submit' })).toBe(true);
  });

  it('fails when no label or text', () => {
    expect(validateAriaLabel({ role: 'button' })).toBe(false);
  });
});

describe('Tab Index', () => {
  it('has tabbable elements', () => {
    expect(
      checkTabIndex([
        { tabIndex: 0, isVisible: true },
        { tabIndex: -1, isVisible: true },
      ])
    ).toBe(true);
  });

  it('fails when no tabbable visible elements', () => {
    expect(
      checkTabIndex([
        { tabIndex: -1, isVisible: true },
        { tabIndex: -1, isVisible: true },
      ])
    ).toBe(false);
  });
});
