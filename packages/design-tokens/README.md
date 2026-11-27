# @azeebo/design-tokens

Shared design tokens for Azeebo+ applications.

## Features

- **Color Palette**: Brand colors and themes
- **Typography**: Font sizes, weights, and styles
- **Spacing**: Consistent spacing values
- **Breakpoints**: Responsive breakpoints

## Usage

```typescript
import { colors, spacing, breakpoints } from '@azeebo/design-tokens';

const styles = {
  color: colors.primary,
  padding: spacing.md,
  [breakpoints.md]: {
    padding: spacing.lg,
  },
};
```

## Generated CSS layer (apps/web)

`pnpm tokens:css` compiles this package into `apps/web/src/styles/design-tokens.css`:

- `@theme static` custom properties — every color (`--color-az-*`), radius
  (`--radius-az-*`), blur, shadow and gradient. `static` keeps the variables
  present even when a page only touches them through `style={{ … }}`, which
  Tailwind's on-demand pruning would otherwise drop.
- One `@utility az-<role>` per type role (`az-display`, `az-heading`, `az-title`,
  `az-lead`, `az-body`, `az-overline`, …). Each sets family, size, leading,
  weight and tracking together; v4 has no `--text-*--font-family` hook, so the
  family has to ride in the utility. `az-headline` carries family/weight/leading
  but **no** size — pair it with a Tailwind step when a page needs a specific
  one.
- `--color-az-universe-<name>` — the per-universe hues (the watch grid, the header
  universe menu, per-show badges). A universe hue encodes a *subject*, not a
  status, so it lives in this package rather than in the state ramps.
- `--color-az-accent-<metal>` — the reward-tier metals (`gold`, `bronze`,
  `silver`), the same values the mobile sheets read through `colors.accent`.
  `--brand-gold` used to sit beside that gold at #FFD700; one concept now has one
  value, and the medal chrome on `/leaderboard` and `/rewards` reads it.
- `--color-az-category-<hue>` — the subject hues that are not a universe and not a
  status: genre badges, vertical identity, chart series (`violet` and its light
  step, `pink`, `cyan`, `teal`, `indigo`, `sky`, `crimson`, `emerald`, `forest`).
  Registered rather than measured, exactly like `universeColors`, and with the same
  purpose: before this layer existed these hexes lived only in twelve
  `--brand-*` hue aliases in `globals.css` and in Tailwind's private `purple-500`,
  which is to say nowhere a page could look them up.
- `--color-az-ink*`, `--color-az-surface-*` (including `surface-auth-violet`, the
  measured Onboarding/Login backdrop, and `surface-auth-warm`) and
  `--color-az-glass-*` — the surface layer, mapped by the generator's
  `SURFACE_UTILITIES` table because its utility names do not match its field names.
- `--shadow-az-glow-<name>` and `--shadow-az-sticky(-idle)` — the glow family
  (`gold|silver|bronze|badge(-strong)|warning(|bloom|spark)|error|primary(-soft)`).
  Every one is `withAlpha` of a colour already in this package, so a glow cannot
  introduce a hue the registry does not own. Five pages had hand-written five
  geometries for the same warning bloom; they now share `shadow-az-glow-warning`.

The generator flattens colour groups by hand, so it now checks its own list: every
group in `colors` must be either a web ramp (`primary`, `secondary`, `success`,
`warning`, `error`, `accent`) or a declared console-only one (`dark`, `light`,
`text`, `bg`, `border`), every web ramp step must reach the stylesheet, and so must
every `universeColors` and `categoryColors` entry and every field of `surface`. A
group or field added here without being classified fails `pnpm tokens:css` — that
is how `colors.accent` shipped for a whole migration while `bg-az-accent-gold`
compiled to nothing. The other half of the guard is the
`azeebo-custom/no-undefined-az-utility` lint rule, which reads the emitted
stylesheet and rejects a page that names a token not in it.
`scripts/__tests__/design-token-emission.test.mjs` pins the same contract from the
outside, and `pnpm tokens:css:check` fails if the committed stylesheet is stale.

Colors the rule-enforcement layer expects you to use: `text-az-ink`,
`text-az-ink-dim`, `text-az-ink-muted`, `bg-az-glass-fill|card`,
`border-az-glass-border`, `text-az-flame|scarlet`, the semantic ramps
`az-primary|secondary|success|warning|error-<step>`, `bg-az-surface-*` for
elevations and auth backdrops, `az-category-*` for subject hues, and
`shadow-az-glow-*` for the glows.

`globals.css` builds the shared component classes on top of those variables
(`.az-glass`, `.az-chip`, `.az-btn-primary`, `.az-input`, `.az-divider`,
`.az-text-gradient`).

### A token existing is not the same as a class being generated

Tailwind v4 detects its sources automatically, starting from the app's own
directory, and compiles a utility only for a class name it actually opens. A file
outside that tree is invisible: the token is in the theme, the markup is correct,
and the rule is still never emitted. `packages/ui` — imported at 148 sites in
apps/web, carrying its own class names — was entirely in that blind spot, so
`apps/web/src/app/globals.css` declares:

```css
@source '../../../../packages/ui/src';
```

`scripts/__tests__/tailwind-source-scope.test.mjs` holds the contract: every
workspace outside apps/web that ships `az-*` classes must sit inside the declared
scan scope, and every `@source` path must resolve. Both failure modes are silent
in lint and visible only as an unstyled component.

### The shared classes deliberately outrank utilities

Those `.az-*` classes are written **outside** any CSS cascade layer. Tailwind v4
puts its utilities in `@layer utilities`, and unlayered rules always beat
layered ones, so `.az-glass` cannot be partly overridden by stacking `rounded-*`,
`bg-*` or `border-*` next to it. That is the point: a surface is restyled by
editing the shared class once, not by patching the ~600 pages that consume it.

The practical consequence when writing a page:

- Want the card treatment with a different fill, border or radius? Compose it
  from utilities instead of adding `.az-glass`
  (`rounded-az-panel border border-az-glass-border bg-az-glass-fill backdrop-blur-az-glass`).
- Want the card treatment as-is? Use `.az-glass` and put padding/typography
  utilities alongside it — those are not properties the class owns.
- `.az-glass` also lifts its hairline on `:hover` (Figma responds to the pointer
  with a brighter border, not a deeper shadow), so clickable cards need no
  `onMouseEnter` style mutation.

Themed page surfaces are the one deliberate exception to fixed generated colors:
`--bg-primary`, `--bg-secondary`, `--bg-tertiary` flip per mode in `globals.css`,
so markup references them as `bg-[var(--bg-primary)]` rather than a generated
token.

## Ownership

- **Team**: Design Engineering
- **Maintainer**: design@azeeboplus.com
- **Last Updated**: 2026-10-11