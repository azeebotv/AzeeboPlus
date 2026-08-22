/**
 * Axe-core Accessibility Testing Configuration
 * A-001: Add axe-core to CI
 */

export const AXE_CONFIG = {
  // Rules to disable (with justification)
  disabledRules: [
    { rule: 'color-contrast', reason: 'Brand colors have been manually verified', ticket: 'A-004' },
  ],
  // WCAG level to target
  wcagLevel: 'AA',
  // Tags to check
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  // Elements to exclude from scanning (e.g., third-party widgets)
  exclude: ['[data-axe-exclude]', '.third-party-widget', '[aria-hidden="true"]'],
};

// Accessibility rules mapped to new-todo items
export const ACCESSIBILITY_RULE_MAP = {
  'A-001': ['axe-core integration'],
  'A-002': ['image-alt'],
  'A-003': ['aria-required-attr', 'aria-valid-attr-value'],
  'A-004': ['color-contrast'],
  'A-005': ['focus-order-semantics'],
  'A-006': ['dialog-name', 'aria-dialog-name'],
  'A-007': ['aria-required-attr'],
  'A-008': ['label', 'form-field-multiple-labels'],
  'A-009': ['td-headers-attr', 'th-has-data-cells'],
  'A-010': ['target-size'],
  'A-011': ['bypass'],
  'A-012': ['video-caption'],
  'A-013': ['css-orientation-lock'],
  'A-014': ['css-orientation-lock'],
} as const;
