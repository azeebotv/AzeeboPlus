const tseslint = require('typescript-eslint');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');
const noHexColors = require('./packages/eslint-rules/no-hex-colors');
const noArbitraryHexClass = require('./packages/eslint-rules/no-arbitrary-hex-class');
const noDeadClassOverride = require('./packages/eslint-rules/no-dead-class-override');
const noRetiredBrandAlias = require('./packages/eslint-rules/no-retired-brand-alias');
const noOffSystemColorUtility = require('./packages/eslint-rules/no-off-system-color-utility');
const noUndefinedAzUtility = require('./packages/eslint-rules/no-undefined-az-utility');
const requireSharedRouteBoundary = require('./packages/eslint-rules/require-shared-route-boundary');
const noConsoleLog = require('./packages/eslint-rules/no-console-log');
const requireMapAndThrow = require('./packages/eslint-rules/require-map-and-throw');

/**
 * Central no-hex-colors allow-list — the brand/design-system palette that is
 * intentional as a raw literal. The rule is configured once, at `error`, in the
 * base block below, so every app and service shares this list and a stray
 * override can never drop it. Register NEW palette colors here, not inline.
 */
const HEX_ALLOW_LIST = [
  '#000000', '#FFFFFF', '#00000000',
  // Brand colors — `#E8420A`/`#CC1C1C`/`#FF6B35` are the RETIRED accent. They
  // survive only in the internal consoles and the fixtures below; RETIRED_ACCENT
  // re-bans them everywhere else, ahead of this list. New code must not use
  // them at all.
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

/**
 * The retired accent pair. apps/web, apps/mobile and apps/tv are fully off them,
 * so the rule reports them anywhere except the paths below — the internal
 * consoles (apps/admin, apps/creator) still hardcode them and are outside the
 * public-page rollout, and scripts/** has to keep tolerating them because the
 * rule's own unit tests quote the retired hexes as fixtures. Exemptions are
 * matched against the absolute filename so they hold whether ESLint runs from
 * the repo root or from a workspace.
 */
const RETIRED_ACCENT = ['#E8420A', '#CC1C1C', '#FF6B35'];
const RETIRED_ACCENT_EXEMPT = ['/apps/admin/', '/apps/creator/', '/scripts/'];

/**
 * The pre-design-system alias layer that `globals.css` still defines for the
 * internal consoles. The map lives with the rule (`DEFAULT_ALIASES`) so the
 * severity configured here and the map the rule falls back to cannot drift: an
 * edit to a local copy would change what ESLint enforces while the rule's own
 * tests still passed. Every entry there is a hex-identical retyping of a
 * generated token, which is what makes the `--fix` rewrite safe; `--text-*`,
 * `--brand-gold` and the categorical hues are deliberately absent — see
 * `packages/eslint-rules/README.md`. The apps/web rollout is finished, so this
 * runs `error` repo-wide with a total-0 canary baseline.
 */

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
          'no-arbitrary-hex-class': noArbitraryHexClass,
          'no-dead-class-override': noDeadClassOverride,
          'no-retired-brand-alias': noRetiredBrandAlias,
          'no-off-system-color-utility': noOffSystemColorUtility,
          'no-undefined-az-utility': noUndefinedAzUtility,
          'require-shared-route-boundary': requireSharedRouteBoundary,
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
      // The critical misuse is accidental debug output, which
      // azeebo-custom/no-console-log bans outright. warn/error stay allowed here
      // so the two rules share one boundary (see that rule's header).
      'no-console': ['warn', { allow: ['warn', 'error'] }],
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
      // ...and plain Error throws in catch blocks too (banPlainErrors):
      // they collapse every cause into an uninformative 500 and lose the
      // cause. Cause-inspected branches (instanceof ladders that classify
      // before throwing) and non-HTTP contexts carry the
      // allowed-fabricated-4xx marker; see packages/eslint-rules/README.md.
      'azeebo-custom/require-map-and-throw': ['error', { banPlainErrors: true }],
      'azeebo-custom/no-hex-colors': [
        'error',
        {
          allowList: HEX_ALLOW_LIST,
          allowTransparent: true,
          retired: RETIRED_ACCENT,
          retiredExemptPaths: RETIRED_ACCENT_EXEMPT,
        },
      ],
      // no-hex-colors cannot see Tailwind arbitrary values: `bg-[#0b090e]` is a
      // plain string inside className, not a style position. This rule closes
      // that half of the surface. Migration is COMPLETE (every site converted to
      // a generated `az-*` utility or a `var(--*)` reference), so it goes
      // straight to `error` with a total-0 canary baseline — the same steady
      // state as no-hex-colors. Theme-aware surfaces deliberately stay
      // `bg-[var(--bg-primary)]`-style: the generated tokens are fixed hexes and
      // would lose the light-mode overrides.
      // No allowList on purpose — HEX_ALLOW_LIST tolerates semantic hexes like
      // #4ade80 that a className must still express as `text-az-success-400`.
      'azeebo-custom/no-arbitrary-hex-class': 'error',
      // globals.css is unlayered (it never opens a `@layer`), so its `.az-*`
      // component classes always win over a Tailwind utility on the same
      // element: `az-glass rounded-3xl shadow-2xl` renders .az-glass's radius
      // and shadow, and both utilities are dead code that misleads the next
      // reader about what the page actually looks like. The rollout converted
      // every site (`--fix` drops the dead utility; a surface that genuinely
      // wants another radius drops .az-glass and composes utilities instead),
      // so the rule goes straight to `error` with a total-0 canary baseline —
      // the same steady state as no-hex-colors.
      'azeebo-custom/no-dead-class-override': 'error',
      // The alias layer is the reason the accent could not be changed in one
      // place. It went through the warn-while-migrating ratchet (238 references
      // in apps/web, all now on the generated ramp), so it is gated at `error`
      // repo-wide with a total-0 canary baseline — the same steady state as
      // no-hex-colors. The alias definitions themselves survive in globals.css
      // for the internal consoles, which are outside the public-page rollout.
      'azeebo-custom/no-retired-brand-alias': [
        'error',
        { aliases: noRetiredBrandAlias.DEFAULT_ALIASES },
      ],
      // The az ramps (--color-az-{error,success,warning,primary,secondary} at
      // 50–900) are the only colour vocabulary the design system owns. A raw
      // Tailwind palette class renders the same hue but cannot be looked up,
      // does not move with the brand, and reads as a free choice. The rollout
      // converted the 459 apps/web occurrences cluster by cluster (wallet 62,
      // creator 85, lifestyle+aou 62, system+commerce+downloads 81,
      // account+ops 98, participation+rewards 71), so this is the steady state
      // the other colour rules already occupy: `error` repo-wide with a total-0
      // canary baseline. The purple/violet/pink families stay out of the rule —
      // the registry has no premium-hue ramp to point at yet.
      'azeebo-custom/no-off-system-color-utility': 'error',
      // The 219 error boundaries and 217 loading boundaries of apps/web were
      // each drawing their own card and spinner, so the same route spun three
      // ways and one retired accent alias reached ~200 files. All of them now
      // render the shared RouteErrorFallback / RouteLoading; this rule keeps the
      // NEXT route from re-inventing one, and it goes straight to `error` with a
      // total-0 canary baseline because the conversion is already complete.
      // Only files under an `src/app/` router tree are inspected, so services
      // resolve the severity without ever matching.
      'azeebo-custom/require-shared-route-boundary': 'error',
      // The other half of the colour rules: `no-off-system-color-utility` bans
      // the raw Tailwind palette, this one guarantees the `az-*` replacement it
      // points at exists. A class with no generated variable behind it compiles
      // to nothing, which is how `bg-az-accent-gold` stayed dead for a whole
      // migration while the registry declared the colour. Files are scoped by
      // the rule itself: only a workspace that owns the generated stylesheet is
      // measured, so services and packages resolve the severity inertly.
      'azeebo-custom/no-undefined-az-utility': 'error',
    },
  },
  // The shared component library is consumed by every public web page, but it
  // lives outside apps/web, so the default stylesheet paths above never resolve
  // from its files and the rule used to skip it silently. That is how the whole
  // of `packages/ui` came to style itself with the legacy `:root` ramps
  // (`bg-bg-primary`, `text-text-secondary`, `bg-primary-500`) that Tailwind v4
  // generates no utility for: nothing rendered, and no gate could see it. Pinning
  // apps/web's generated theme here means the 458 classes the migration put in
  // place are now checked against the vocabulary that actually ships.
  {
    files: ['packages/ui/**'],
    rules: {
      'azeebo-custom/no-undefined-az-utility': [
        'error',
        {
          themeStylesheet: 'apps/web/src/styles/design-tokens.css',
          sharedStylesheet: 'apps/web/src/app/globals.css',
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
  // HISTORY: this block was the migrating warn scope of the apps/web
  // design-token migration (no-hex-colors): `var(--token, #hex)` fallbacks
  // and raw surface/art hexes converted to the themed --bg-*/text families
  // plus fixed-art --hp-*/--music-purple tokens (see globals.css). With the
  // last site converted the block was deleted; the base config above is the
  // steady state, the no-hex baseline sits at total 0 as a canary, and
  // scripts/check-rule-promotion.mjs fails if the rule is ever weakened for
  // any workspace. See packages/eslint-rules/README.md.

  // HISTORY: this block was the per-service error gate of the
  // require-map-and-throw migration (one glob per converted service). With
  // the migration complete the base config above carries `error` directly,
  // and the block was retired. Scripts/check-rule-promotion.mjs keeps
  //  guarding the steady state; see packages/eslint-rules/README.md.

  // Disable formatting rules that conflict with Prettier (must be last)
  prettierConfig,
];
