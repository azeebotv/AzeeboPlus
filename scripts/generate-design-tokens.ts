/**
 * Generates the namespaced Tailwind v4 `@theme` layer for apps/web from
 * @azeebo/design-tokens, so there is exactly one hand-authored source of truth.
 *
 *   pnpm tokens:css          # write the stylesheet
 *   pnpm tokens:css --check  # fail if the committed file is stale
 *
 * Utilities come out prefixed `az-` (bg-az-scarlet, text-az-body, rounded-az-card)
 * to keep them unambiguous against the legacy --brand-* / --color-* variables that
 * still live in globals.css during migration.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  brand,
  colors,
  elevation,
  families,
  glass,
  radius,
  shadows,
  spacing,
  surface,
  type as typeScale,
  typography,
  universeColors,
  zIndex,
  type TypeRole,
} from '../packages/design-tokens/src/index';

const OUT = resolve(__dirname, '../apps/web/src/styles/design-tokens.css');
const checkOnly = process.argv.includes('--check');

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const colorEntries: Array<[string, string]> = [
  ['scarlet', brand.scarlet],
  ['flame', brand.flame],
  ...Object.entries(colors.primary).map(([k, v]) => [`primary-${k}`, v as string]),
  // The system's blue ramp is the semantic `secondary`; it carries informational
  // states (e.g. moderation "Reviewing"), which has no scarlet-side equivalent.
  ...Object.entries(colors.secondary).map(([k, v]) => [`secondary-${k}`, v as string]),
  ...Object.entries(colors.success).map(([k, v]) => [`success-${k}`, v as string]),
  ...Object.entries(colors.warning).map(([k, v]) => [`warning-${k}`, v as string]),
  ...Object.entries(colors.error).map(([k, v]) => [`error-${k}`, v as string]),
  // Reward tiers are metal-coded (gold/silver/bronze medals, badge ranks). The
  // registry declares them, and the generator has to flatten them explicitly —
  // `colors.accent` is an object of names rather than numeric steps, so leaving
  // it out made `accent-gold` a token that reads as valid but emits no CSS, and
  // pages fell back to `bg-slate-300` for silver.
  ...Object.entries(colors.accent).map(([k, v]) => [`accent-${k}`, v as string]),
  // Each universe is a hue-coded navigation key (the watch grid, the header
  // universe menu, per-show badges). The package owns the palette; web reads it
  // through the generator so per-universe hexes stop being retyped per page.
  ...Object.entries(universeColors).map(([k, v]) => [`universe-${k}`, v.primary]),
  ['ink', '#FFFFFF'],
  ['ink-dim', surface.dim],
  ['ink-muted', surface.faint],
  ['surface-root', surface.root],
  ['surface-raised', surface.raised],
  ['surface-panel', surface.panel],
  ['surface-edge', surface.edge],
  ['surface-auth-void', surface.authVoid],
  ['glass-border', glass.border],
  ['glass-border-hover', glass.borderHover],
  ['glass-card', glass.card],
  ['glass-fill', glass.fill],
  ['glass-fill-hover', glass.fillHover],
  ['glass-fill-active', glass.fillActive],
  ['glass-placeholder', glass.placeholder],
];

/* colorEntries is hand-written, so a group the registry adds and the generator
   forgets is silent: `colors.accent` was declared for a while and never emitted,
   which made `bg-az-accent-gold` a dead utility and pushed pages onto
   `bg-slate-300` for a silver medal. The registry's colour groups are therefore
   partitioned and checked instead of trusted — a new group is a build failure
   until someone decides which side it belongs on. This runs under
   `pnpm tokens:css:check`, so CI catches it too. */
const WEB_RAMP_GROUPS = ['primary', 'secondary', 'success', 'warning', 'error', 'accent'];
/* Legacy semantic groups the pre-design-system theme still feeds to
   apps/mobile's StyleSheet. They are deliberately NOT part of the web's `az-`
   vocabulary, which uses --color-az-{ink,surface}-* and the ramps above. */
const CONSOLE_ONLY_GROUPS = ['dark', 'light', 'text', 'bg', 'border'];

const emittedColorNames = new Set(colorEntries.map(([name]) => name));
const unemitted = Object.keys(colors)
  .filter((group) => WEB_RAMP_GROUPS.includes(group))
  .flatMap((group) =>
    Object.keys(colors[group] as Record<string, string>).map((step) => `--color-az-${group}-${step}`)
  )
  .filter((cssName) => !emittedColorNames.has(cssName.replace('--color-az-', '')));
const unaccountedGroups = Object.keys(colors).filter(
  (group) => !WEB_RAMP_GROUPS.includes(group) && !CONSOLE_ONLY_GROUPS.includes(group)
);
const unemittedUniverses = Object.keys(universeColors).filter(
  (name) => !emittedColorNames.has(`universe-${name}`)
);
const emissionGaps = [
  ...unemitted.map((cssName) => `${cssName} is declared in the registry but never pushed into the stylesheet`),
  ...unaccountedGroups.map(
    (group) => `colors.${group} belongs in neither WEB_RAMP_GROUPS nor CONSOLE_ONLY_GROUPS`
  ),
  ...unemittedUniverses.map((name) => `--color-az-universe-${name} is not in colorEntries`),
];
if (emissionGaps.length) {
  throw new Error(
    'generate-design-tokens: registry colour emission gap:\n' +
      emissionGaps.map((gap) => `  - ${gap}`).join('\n') +
      '\nAdd the entry to colorEntries (or classify the group) so the utilities Tailwind generates actually exist.'
  );
}

const spacingEntries = Object.entries(spacing).map(([k, v]) => [`az-${kebab(k)}`, String(v)] as [string, number]);
const typeEntries = Object.entries(typeScale) as Array<[string, TypeRole]>;

const lines: string[] = [
  '/* GENERATED by scripts/generate-design-tokens.ts -- DO NOT EDIT.',
  ' * Source of truth: packages/design-tokens/src/index.ts',
  ' * Regenerate with: pnpm tokens:css',
  ' */',
  '',
  `/* Display face is routed through ${families.displayVar} so switching to the`,
  ' * licensed Gotham Rounded from Figma is a one-line change here rather than a',
  ' * sweep through every public page.',
  ' */',
  ':root {',
  `  ${families.displayVar}: ${families.displayNative};`,
  `  ${families.bodyVar}: ${families.bodyNative};`,
  '}',
  '',
  /* `static` emits every variable even while no utility references it, because
     pages here set colors through inline style={{ ...: 'var(--color-az-*)' }}. */
  '@theme static {',
  '  /* --- color --- */',
];

for (const [name, value] of colorEntries) lines.push(`  --color-az-${name}: ${value};`);

lines.push('', '  /* --- brand gradient (use as bg-[image:--gradient-az-cta]) --- */');
lines.push(`  --gradient-az-cta: ${brand.gradientCss};`);

lines.push('', '  /* --- font families --- */');
lines.push(`  --font-az-display: var(${families.displayVar}), ui-sans-serif, sans-serif;`);
lines.push(`  --font-az-body: var(${families.bodyVar}), ui-sans-serif, sans-serif;`);

lines.push('', '  /* --- spacing (px; Tailwind exposes these as p-az-*, gap-az-*) --- */');
for (const [name, value] of spacingEntries) lines.push(`  --spacing-${name}: ${value}px;`);

lines.push('', '  /* --- radius --- */');
for (const [name, value] of Object.entries(radius)) lines.push(`  --radius-az-${kebab(name)}: ${value}px;`);

lines.push('', '  /* --- type roles: family + size + leading + weight + tracking --- */');
for (const [role, t] of typeEntries) {
  lines.push(`  --text-az-${kebab(role)}: ${t.size}px;`);
  lines.push(`  --text-az-${kebab(role)}--line-height: ${t.lineHeight};`);
  lines.push(`  --text-az-${kebab(role)}--font-weight: ${t.weight};`);
  lines.push(`  --text-az-${kebab(role)}--letter-spacing: ${t.tracking};`);
}

lines.push('', '  /* --- elevation: Figma builds depth from blur + hairline, not shadow --- */');
lines.push(`  --shadow-az-lifted: ${elevation.lifted};`);
lines.push(`  --shadow-az-hairline: ${elevation.hairline};`);
lines.push(`  --shadow-az-glow: ${shadows.glow};`);
lines.push(`  --blur-az-glass: ${glass.blur}px;`);

lines.push('', '  /* --- tracking + leading primitives --- */');
for (const [name, value] of Object.entries(typography.letterSpacing)) lines.push(`  --tracking-az-${kebab(name)}: ${value};`);
for (const [name, value] of Object.entries(typography.lineHeights)) lines.push(`  --leading-az-${kebab(name)}: ${value};`);

lines.push('', '  /* --- stacking --- */');
for (const [name, value] of Object.entries(zIndex)) {
  if (typeof value === 'number' && value >= 0) lines.push(`  --z-index-az-${kebab(name)}: ${value};`);
}

lines.push('}', '');

/* Tailwind v4 exposes no --text-*--font-family or --text-transform hooks, so the
   full role bundle (family + size + leading + weight + tracking + casing) is
   emitted as a real utility instead. One class per role is what makes the
   convention enforceable on pages that do not exist yet. */
lines.push('/* --- type role utilities: class="az-heading" etc --- */');
for (const [role, t] of typeEntries) {
  const name = kebab(role);
  lines.push(`@utility az-${name} {`);
  lines.push(`  font-family: var(--font-az-${t.family});`);
  lines.push(`  font-size: var(--text-az-${name});`);
  lines.push(`  line-height: var(--text-az-${name}--line-height);`);
  lines.push(`  font-weight: var(--text-az-${name}--font-weight);`);
  lines.push(`  letter-spacing: var(--text-az-${name}--letter-spacing);`);
  if (t.transform === 'uppercase') lines.push('  text-transform: uppercase;');
  lines.push('}');
}
lines.push('');

const output = lines.join('\n');

if (checkOnly) {
  const current = (() => {
    try {
      return readFileSync(OUT, 'utf8');
    } catch {
      return '';
    }
  })();
  if (current !== output) {
    console.error('design-tokens.css is stale or missing. Run: pnpm tokens:css');
    process.exit(1);
  }
  console.log('design-tokens.css is up to date');
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, output);
  const counts = {
    colors: colorEntries.length,
    spacing: spacingEntries.length,
    radii: Object.keys(radius).length,
    typeRoles: typeEntries.length,
  };
  console.log(`wrote ${OUT}`);
  console.log(`  ${counts.colors} colors, ${counts.spacing} spacing, ${counts.radii} radii, ${counts.typeRoles} type roles`);
}
