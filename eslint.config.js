const tseslint = require('typescript-eslint');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');
const noHexColors = require('./packages/eslint-rules/no-hex-colors');
const noConsoleLog = require('./packages/eslint-rules/no-console-log');
const requireMapAndThrow = require('./packages/eslint-rules/require-map-and-throw');

/**
 * Central no-hex-colors allow-list — the brand/design-system palette that is
 * intentional as a raw literal. Shared by the base config (error) and the
 * apps/web migrating block (warn) below, so a flat-config override can never
 * accidentally drop the list. Register NEW palette colors here, not inline.
 */
const HEX_ALLOW_LIST = [
  '#000000', '#FFFFFF', '#00000000',
  // Brand colors
  '#E8420A', '#1A0A0A', '#F5F0EB', '#9A8A7A',
  '#E5E4E2', '#555', '#000', '#fff',
  '#a855f7', '#2A1A1A',
  '#14532D', '#B91C1C', '#1E40AF',
  '#F5F5F5', '#E0E0E0', '#757575',
  '#424242', '#212121', '#F44336', '#2196F3',
  '#4CAF50', '#FF9800', '#9C27B0',
  // Additional design system colors
  '#06b6d4', '#1A1A1A', '#1E90FF', '#32CD32',
  '#4ade80', '#607D8B', '#8b5cf6',
  '#A78BFA', '#C0C0C0', '#C41E3A', '#CC1C1C',
  '#CD7F32', '#D1D5DB', '#D97706', '#EC4899',
  '#FF6B35', '#FFD700',
  '#fbbf24',
  // Third-party social brand colors
  '#1DA1F2', '#1877F2', '#25D366',
  // Dashboard/analytics colors
  '#10B981', '#F59E0B', '#3B82F6', '#EF4444',
  '#10B98120', '#F59E0B20',
  '#6B7280',
  // Creator app theme colors
  '#140808', '#0D0505', '#6A5A4A', '#6B5A4A',
  '#0D3B2E',
  // Semantic state accents (success/sky variants, see
  // --color-success-500 and the dashboard palette).
  '#34D399', '#38BDF8', '#22c55e',
];

module.exports = [
  // Ignore patterns
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/coverage/**',
      '**/prisma/client/**',
      '**/generated/**',
    ],
  },
  // Base config for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
      'azeebo-custom': {
        rules: {
          'no-hex-colors': noHexColors,
          'no-console-log': noConsoleLog,
          'require-map-and-throw': requireMapAndThrow,
        },
      },
    },
    rules: {
      // TypeScript ESLint recommended rules
      ...tseslint.configs.recommended.rules,

      // Prettier integration
      'prettier/prettier': 'error',

      // Custom rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          args: 'after-used',
          caughtErrorsIgnorePattern: '^_|^(err|error)$',
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase', 'snake_case'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'variableLike',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase', 'camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'property',
          format: null,
        },
        {
          selector: 'typeProperty',
          format: null,
        },
        {
          selector: 'method',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'objectLiteralMethod',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'classMethod',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'parameter',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'accessor',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'parameterProperty',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
      ],
      'no-console': 'warn',
      'azeebo-custom/no-console-log': 'error',
      // Catch blocks must not fabricate hardcoded 4xx statuses — mapAndThrow
      // (packages/security) preserves real causes (Prisma/upstream/network)
      // instead of flattening them into a misleading client error (e.g. a DB
      // outage surfacing as a 400). The migration that introduced this rule
      // is COMPLETE — every service converted — so the rule is `error`
      // repo-wide, not `warn`. The only sanctioned exception is the
      // in-catch `allowed-fabricated-4xx:` marker (see
      // packages/eslint-rules/README.md); CI keeps a tripwire
      // (scripts/check-rule-promotion.mjs) that fails if the rule is ever
      // weakened below `error` for a service.
      'azeebo-custom/require-map-and-throw': 'error',
      'azeebo-custom/no-hex-colors': [
        'error',
        {
          allowList: HEX_ALLOW_LIST,
          allowTransparent: true,
        },
      ],
    },
  },
  // Allow console in logger and scripts
  {
    files: ['**/logger/**', '**/scripts/**', '**/logger.ts'],
    rules: {
      'no-console': 'off',
      // Logger implementations are the structured logger — they must call
      // console under the hood (the custom rule exists for app code).
      'azeebo-custom/no-console-log': 'off',
    },
  },
  // Relaxed naming conventions for test files
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      // Tests legitimately spy on console methods and print skip/opt-in guidance.
      'no-console': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase', 'snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase', 'camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE'],
        },
        {
          selector: 'property',
          format: null,
        },
        {
          selector: 'typeProperty',
          format: null,
        },
        {
          selector: 'parameter',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'objectLiteralMethod',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'method',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
      ],
    },
  },
  // ---------------------------------------------------------------------------
  // MIGRATING: apps/web design-token migration (no-hex-colors).
  //
  // Web tsx files use `var(--token, #hex)` fallbacks whose raw values are the
  // page/surface palette already defined in apps/web/src/app/globals.css
  // (--brand-near-black #0b090e, --brand-surface #18151e, --bg-secondary
  // #100e14) — so the hexes were allow-listed. The allow-list entries are now
  // TRIMMED and this block warns while the fallbacks are replaced with plain
  // `var(--token)` references; the ratchet (scripts/no-hex-colors-baseline.json)
  // floors the count and the scorecard tracks it. Everywhere else the rule is
  // `error` (base config above). When the last fallback is converted, DELETE
  // this block — the base config is already the steady state.
  //
  // (Flat config: a block rule entry REPLACES the base entry, so the trimmed
  // allow-list options are repeated here — they share HEX_ALLOW_LIST above.)
  {
    files: ['apps/web/src/**/*.ts', 'apps/web/src/**/*.tsx'],
    rules: {
      'azeebo-custom/no-hex-colors': [
        'warn',
        {
          allowList: HEX_ALLOW_LIST,
          allowTransparent: true,
        },
      ],
    },
  },

  // HISTORY: this block was the per-service error gate of the
  // require-map-and-throw migration (one glob per converted service). With
  // the migration complete the base config above carries `error` directly,
  // and the block was retired. Scripts/check-rule-promotion.mjs keeps
  //  guarding the steady state; see packages/eslint-rules/README.md.

  // Disable formatting rules that conflict with Prettier (must be last)
  prettierConfig,
];
