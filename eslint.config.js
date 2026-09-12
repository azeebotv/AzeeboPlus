const tseslint = require('typescript-eslint');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');
const noHexColors = require('./packages/eslint-rules/no-hex-colors');
const noConsoleLog = require('./packages/eslint-rules/no-console-log');
const requireMapAndThrow = require('./packages/eslint-rules/require-map-and-throw');

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
      // preserves real causes (Prisma/upstream/network) instead of flattening
      // them into a misleading client error (e.g. a DB outage surfacing as a
      // 400). Warn repo-wide while legacy sites are migrated; content-service
      // and user-service are fully converted and hard-fail below. New
      // violations also fail the lint-ratchet CI gate (see
      // scripts/check-lint-warning-ratchet.mjs): the per-workspace warning
      // baseline may only decrease. Fix or convert; never grow the count.
      'azeebo-custom/require-map-and-throw': 'warn',
      'azeebo-custom/no-hex-colors': [
        'error',
        {
          allowList: [
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
          ],
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
  // Fully converted to mapAndThrow — enforce the ban as an error there.
  // Extend this block service-by-service as conversions land; a service is
  // ready when `pnpm --filter <pkg> exec eslint src` reports zero
  // require-map-and-throw warnings. PROMOTION IS ENFORCED: a clean service
  // left out of this block fails CI (scripts/check-map-and-throw-promotion.mjs,
  // wired after the lint-ratchet gate) — the failure prints the exact snippet
  // to add here.
  {
    files: [
      // core
      'services/core/content-service/**/*.ts',
      'services/core/knowledge-service/**/*.ts',
      'services/core/user-service/**/*.ts',
      'services/core/wallet-service/**/*.ts',
      // engagement
      'services/engagement/engagement-service/**/*.ts',
      'services/engagement/messaging-service/**/*.ts',
      'services/engagement/notification-service/**/*.ts',
      'services/engagement/referral-service/**/*.ts',
      'services/engagement/reward-service/**/*.ts',
      'services/engagement/subscription-service/**/*.ts',
      // intelligence
      'services/intelligence/analytics-service/**/*.ts',
      'services/intelligence/recommendation-service/**/*.ts',
      // operations
      'services/operations/queue-service/**/*.ts',
      // universes
      'services/universes/comedy-service/**/*.ts',
      'services/universes/games-service/**/*.ts',
      'services/universes/lifestyle-service/**/*.ts',
      'services/universes/live-event-service/**/*.ts',
      'services/universes/vertical-service/**/*.ts',
    ],
    rules: {
      'azeebo-custom/require-map-and-throw': 'error',
    },
  },
  // Disable formatting rules that conflict with Prettier (must be last)
  prettierConfig,
];
