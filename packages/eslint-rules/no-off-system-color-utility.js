/**
 * ESLint rule: no-off-system-color-utility
 *
 * The generated ramp is `--color-az-{error,success,warning,primary,secondary}`
 * at 50–900, plus the eight `--color-az-universe-*` branding hues. A class like
 * `bg-amber-500` is Tailwind's own palette, which sits outside that system: it
 * does not move when the brand does, it cannot be looked up in
 * `packages/design-tokens`, and — because `--color-az-warning-500` IS `#f59e0b`
 * — it usually renders the exact same colour while pretending to be a free
 * choice. `no-hex-colors` and `no-arbitrary-hex-class` close the literal-hex
 * routes; this closes the named-palette route.
 *
 * It also closes a worse one: a class that names a ramp the build never
 * generates. `globals.css` declares `--color-primary-500` and friends inside
 * `:root`, and Tailwind v4 only turns `@theme` properties into utilities, so
 * `bg-primary-500` is dead markup rather than merely a wrong colour — which is
 * how `packages/ui`, the shared component library every public page consumes,
 * came to style itself with classes that produce no CSS at all. See LEGACY_RAMP
 * and the console-layer matcher below.
 *
 * There is no fixer on purpose. `amber` -> `warning` is a semantic judgement
 * (`bg-orange-500` is more likely the brand flame than a warning), and a rule
 * that guesses produces markup that reads wrong even when it renders right.
 * The message carries the mapping so the substitution stays mechanical.
 *
 * Options:
 *   ramps:       Record<string, string[]> - hue family -> suggested az ramps
 *   hueNames:    string[]                 - override the hue family list
 *   legacyRamps: string[]                 - override the legacy ramp families
 */

const HUE_TO_RAMP = {
  red: ['error'],
  rose: ['error'],
  orange: ['warning — or the brand accent az-flame/az-scarlet'],
  amber: ['warning'],
  yellow: ['warning'],
  green: ['success'],
  emerald: ['success'],
  lime: ['success'],
  teal: ['success — or universe-creators'],
  cyan: ['secondary — or universe-lifestyle'],
  sky: ['secondary — or universe-lifestyle'],
  blue: ['secondary — or primary'],
  indigo: ['secondary'],
  violet: ['az-category-violet (500+) or az-category-violet-light (<=400)'],
  purple: ['az-category-violet (500+) or az-category-violet-light (<=400)'],
  fuchsia: ['az-category-pink'],
  pink: ['az-category-pink'],
  gray: ['ink / surface / glass'],
  grey: ['ink / surface / glass'],
  slate: ['ink / surface / glass'],
  zinc: ['ink / surface / glass'],
  neutral: ['ink / surface / glass'],
  stone: ['ink / surface / glass'],
};

// Utilities whose last segment is a colour step. `size-*` and friends are
// absent because they do not carry a colour.
const COLOR_UTILITY_PREFIX = new Set([
  'bg',
  'text',
  'border',
  'ring',
  'fill',
  'stroke',
  'shadow',
  'outline',
  'decoration',
  'divide',
  'placeholder',
  'accent',
  'caret',
  'from',
  'via',
  'to',
]);

// Tailwind puts an axis infix between the utility and the colour
// (`border-t-red-500`, `divide-y-gray-200`). A hue name is never one letter.
const AXIS_SEGMENT = /^[a-z]$/;

// `ring-offset-blue-500` puts a real word where the hue should be. These are
// stripped the same way single-letter axes are.
const INFIX_SEGMENTS = new Set(['offset', 'opacity']);

function escapeRe(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Return the hue family a class token claims, or null when the token is not a
 * colour utility. A segment scan rather than one big regex, because a colour
 * utility can carry variants (`hover:`), the important marker (`!`), an opacity
 * (`/60`) and an axis or offset infix around the hue name.
 */
function hueOf(token, huePattern) {
  const base = token.split(':').pop();
  if (!base) return null;
  const parts = base.replace(/^!/, '').split('/')[0].split('-');
  if (parts.length < 3) return null;
  if (!COLOR_UTILITY_PREFIX.has(parts[0])) return null;
  // The generated vocabulary is already on-system.
  if (parts.includes('az') || parts.includes('brand') || parts.includes('hp')) return null;
  if (!/^\d{2,3}$/.test(parts[parts.length - 1])) return null;
  const hue = parts
    .slice(1, -1)
    .filter((segment) => !AXIS_SEGMENT.test(segment) && !INFIX_SEGMENTS.has(segment))
    .join('-');
  return huePattern.test(hue) ? hue : null;
}

/**
 * The console token families — `bg-bg-secondary`, `text-text-primary`,
 * `border-border-default` — which have a word where a step number would be.
 * The role segment is what makes them recognisable: a utility whose first
 * segment is the same word as the role (`bg-bg-`, `text-text-`, `border-border-`)
 * is reaching for the surface/text/border layer, not for a hue.
 */
const CONSOLE_ROLES = {
  'bg-bg': 'surface: --color-az-surface-root|raised|panel, or --color-az-glass-fill',
  'text-text': 'ink: --color-az-ink, --color-az-ink-dim, --color-az-ink-muted',
  'border-border': '--color-az-glass-border (or -hover)',
  // A background aimed at the border layer — almost always a `border-border-*`
  // that lost its first segment.
  'bg-border': '--color-az-glass-border for a border, or a surface token for a fill',
  'ring-bg': '--color-az-glass-border / an az ramp step',
  'border-bg': 'a border token: --color-az-glass-border (or an az ramp step)',
  'from-bg': '--color-az-surface-* or an az ramp step',
  'to-bg': '--color-az-surface-* or an az ramp step',
};

function consoleRoleOf(token) {
  const base = token.split(':').pop();
  if (!base) return null;
  const stripped = base.replace(/^!/, '').split('/')[0];
  for (const [role, target] of Object.entries(CONSOLE_ROLES)) {
    const [utility, family] = role.split('-');
    const parts = stripped.split('-');
    if (parts[0] === utility && parts[1] === family && parts.length >= 3) {
      // `border-t-bg-secondary` keeps its axis letter between the two.
      return target;
    }
    if (utility === 'border' && parts[1] && AXIS_SEGMENT.test(parts[1]) && parts[2] === family) {
      return target;
    }
  }
  return null;
}

// Only these families are enforced, because only these have a canonical target:
// `az-warning` IS amber, `az-error` IS red, `az-success` IS green and
// `az-secondary` IS blue — step for step, same hexes, in
// `packages/design-tokens/src/index.ts`.
//
// The violet/pink family used to be listed for guidance but NOT banned: neither
// Figma file defines a purple, and inventing a token to silence a lint error
// would have put an unmeasured colour on screen. They are banned now, against
// the layer that closes that objection honestly: `categoryColors`, which
// registers the hues the product already ships (`--brand-purple` et al.) as
// subject hues rather than measured brand colours. `az-category-violet` is the
// same hex a page painted before, lookable-up in the registry — so the ban
// removes Tailwind's private palette from the markup without moving a pixel.
const MIGRATABLE_HUES = [
  'red',
  'rose',
  'orange',
  'amber',
  'yellow',
  'green',
  'emerald',
  'lime',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'gray',
  'grey',
  'slate',
  'zinc',
  'neutral',
  'stone',
];

// The legacy *semantic* ramp — `--color-{primary,secondary,success,warning,
// error,danger,dark,light}-<step>` — is declared in `apps/web/src/app/globals.css`
// inside `:root`, not in a Tailwind v4 `@theme` block. v4 only generates a
// utility for a custom property it sees in `@theme`, so `bg-primary-500` compiles
// to nothing at all: the class survives in the markup, the rule never exists in
// the stylesheet, and the component renders with no background, no border and no
// text colour. Verified against the built CSS, which contains no `.bg-primary-500`
// rule. Because nothing renders, migrating these is a strict improvement rather
// than a pixel change — and the az ramps are the vocabulary that does generate.
// secondary/success/warning/error are step-for-step hex-identical to their az
// twins; `primary` is the retired warm-orange ramp, so it lands on the brand
// ramp instead, and `dark`/`light` are the surface and ink layers.
const LEGACY_RAMP = {
  primary: 'az-primary-<step> — or the accent tokens az-flame / az-scarlet',
  secondary: 'az-secondary-<step> (identical hexes)',
  success: 'az-success-<step> (identical hexes)',
  warning: 'az-warning-<step> (identical hexes)',
  error: 'az-error-<step> (identical hexes)',
  danger: 'az-error-<step>',
  dark: 'az-surface-root / az-surface-raised / az-surface-panel',
  light: 'az-ink / az-ink-dim / az-ink-muted',
};

function create(context) {
  const options = context.options[0] || {};
  const ramps = options.ramps || HUE_TO_RAMP;
  const hueNames = options.hueNames || [...MIGRATABLE_HUES, ...Object.keys(LEGACY_RAMP)];
  const legacyNames = options.legacyRamps || Object.keys(LEGACY_RAMP);
  const legacyPattern = new RegExp(`^(?:${legacyNames.map(escapeRe).join('|')})$`);
  const huePattern = new RegExp(`^(?:${hueNames.map(escapeRe).join('|')})$`);

  function check(text, node) {
    if (!text || !text.includes('-')) return;
    const seen = new Set();
    for (const token of text.split(/\s+/)) {
      if (!token || seen.has(token)) continue;
      seen.add(token);
      const shown = token.split(':').pop().replace(/^!/, '');
      const hue = hueOf(token, huePattern);
      if (hue) {
        context.report({
          node,
          loc: node.loc.start,
          messageId: legacyPattern.test(hue) ? 'deadRampColor' : 'offSystemColor',
          data: {
            token: shown,
            hue,
            ramps: legacyPattern.test(hue)
              ? LEGACY_RAMP[hue]
              : (ramps[hue] || []).join(' or '),
          },
        });
        continue;
      }
      const role = consoleRoleOf(token);
      if (!role) continue;
      context.report({
        node,
        loc: node.loc.start,
        messageId: 'consoleLayerColor',
        data: { token: shown, ramps: role },
      });
    }
  }

  return {
    Literal(node) {
      if (typeof node.value === 'string') check(node.value, node);
    },
    TemplateElement(node) {
      check(node.value.cooked ?? node.value.raw, node);
    },
  };
}

module.exports = {
  HUE_TO_RAMP,
  LEGACY_RAMP,
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow colour utilities outside the generated az vocabulary — raw Tailwind palette hues (bg-amber-500), the legacy :root ramp (bg-primary-500, which emits no CSS at all), and the console layer (text-text-primary)',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    messages: {
      offSystemColor:
        "'{{token}}' is a raw Tailwind palette colour, which sits outside the design system and does not move with the brand. Map '{{hue}}' onto a generated ramp: {{ramps}}.",
      deadRampColor:
        "'{{token}}' names the legacy :root ramp, and Tailwind v4 only generates a utility for a property declared in @theme — this class compiles to nothing and renders no colour at all. Use {{ramps}}.",
      consoleLayerColor:
        "'{{token}}' names the console surface/text/border layer, which is not a Tailwind v4 theme token, so it generates no utility. Use {{ramps}}.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          ramps: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
            description: 'Hue family -> suggested az ramps',
          },
          hueNames: {
            type: 'array',
            items: { type: 'string' },
            description: 'Override the hue families to flag',
          },
          legacyRamps: {
            type: 'array',
            items: { type: 'string' },
            description: 'Override the legacy semantic ramp families to flag',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create,
};
