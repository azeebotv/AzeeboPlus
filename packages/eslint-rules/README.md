# @azeebo/eslint-rules

Custom ESLint rules for the Azeebo+ platform. This is **not** a publishable
package — there is no `package.json` and no shareable config. The rules are
plain CommonJS modules loaded **by path** from the root
[`eslint.config.js`](../../eslint.config.js) flat config:

```js
// eslint.config.js (root)
const noHexColors = require('./packages/eslint-rules/no-hex-colors');
const noConsoleLog = require('./packages/eslint-rules/no-console-log');
const requireMapAndThrow = require('./packages/eslint-rules/require-map-and-throw');

// …then registered under the `azeebo-custom` plugin namespace:
plugins: {
  'azeebo-custom': {
    rules: {
      'no-hex-colors': noHexColors,
      'no-console-log': noConsoleLog,
      'require-map-and-throw': requireMapAndThrow,
    },
  },
},
```

## Shipped rules

| Rule                                                | Type       | Severity in this repo                                                    | Purpose                                                                                                            |
| --------------------------------------------------- | ---------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [`require-map-and-throw`](#require-map-and-throw)   | problem    | `error` repo-wide (canary ratchet at 0)                                  | Ban fabricated 4xx statuses in catch blocks                                                                        |
| [`no-console-log`](#no-console-log)                 | problem    | `error` (off in logger/scripts)                                          | Ban `console.log` in favor of the structured logger                                                                |
| [`no-hex-colors`](#no-hex-colors)                   | suggestion | `error` repo-wide (token migration complete, baseline canary at 0)       | Ban hardcoded hex colors in favor of design tokens                                                                 |
| [`no-arbitrary-hex-class`](#no-arbitrary-hex-class) | suggestion | `error` repo-wide (baseline canary at 0, no allowList)                   | Ban raw hex inside Tailwind arbitrary values (`bg-[#0b090e]`)                                                      |
| [`no-dead-class-override`](#no-dead-class-override) | problem    | `error` repo-wide (canary baseline at 0)                                 | Ban Tailwind utilities that can never beat an unlayered `.az-*` class; `--fix` drops them                          |
| [`no-retired-brand-alias`](#no-retired-brand-alias) | suggestion | `error` repo-wide (canary baseline at 0; 238 refs converted in apps/web) | Ban the pre-design-system `var(--brand-*)`/`var(--hp-*)` alias layer in favour of `--color-az-*`; `--fix` swaps it |
| [`no-off-system-color-utility`](#no-off-system-color-utility) | suggestion | `error` repo-wide (canary baseline at 0; 459 apps/web + 458 packages/ui occurrences converted) | Ban raw Tailwind palette colours (`bg-amber-500`) plus the two vocabulary layers Tailwind v4 generates nothing for (`bg-primary-500`, `bg-bg-primary`) |
| [`require-shared-route-boundary`](#require-shared-route-boundary) | problem | `error` repo-wide (canary baseline at 0) | Require `src/app/**/error.tsx` and `loading.tsx` to render the shared `RouteErrorFallback` / `RouteLoading` |
| [`no-undefined-az-utility`](#no-undefined-az-utility) | problem | `error` repo-wide, apps/web by walk-up and packages/ui by config pin (canary baseline at 0) | Ban `az-*` classes with no generated token or shared rule behind them, which Tailwind compiles to nothing |

---

## `require-map-and-throw`

> Do not fabricate a hardcoded 4xx inside a catch block — the real cause may
> need a different status. Use `mapAndThrow(error, '<context>')` from
> `@azeebo/security`.

### Why

When a catch block throws a hardcoded `BadRequestException` / `NotFoundException`
/ …, the original cause — a Prisma `P2xxx` code, an upstream 4xx/5xx, a network
failure — is flattened into one fabricated client error. This is the exact
pattern that turned a database outage into a `400 Bad Request` on
`/users/me/preferences`: clients retried a request that was never their fault,
and the server-side signal (500 spike) was invisible.

`mapAndThrow(error, '<context>')` from `@azeebo/security` rethrows
`HttpException`s unchanged and maps Prisma / upstream / network errors to their
correct statuses.

### What it flags

Inside any `catch` block:

- `throw new <NestJS 4xx Exception>(…)` — `BadRequestException`,
  `UnauthorizedException`, `ForbiddenException`, `NotFoundException`,
  `ConflictException`, `GoneException`, `PayloadTooLargeException`,
  `UnsupportedMediaTypeException`, `UnprocessableEntityException`,
  `TooManyRequestsException`, `NotAcceptableException`,
  `RequestTimeoutException`, `MethodNotAllowedException`,
  `PaymentRequiredException`
- `throw new HttpException(msg, <4xx literal>)` — e.g. `422`
- Plain `Error`/`TypeError` throws **only when** `banPlainErrors` is enabled

### What it allows

- Rethrowing the caught error itself (`throw error;` or
  `if (error instanceof NotFoundException) throw error;`) — the correct
  preservation pattern
- `mapAndThrow(error, '<context>')`
- 5xx throws (`InternalServerErrorException`, `HttpException(msg, 500)`) — an
  honest 5xx in a catch is legitimate
- Any throw outside a catch block

### Options

```js
'azeebo-custom/require-map-and-throw': ['error', { banPlainErrors: true }]
```

| Option           | Default | Effect                                                                                                                                                                                                                        |
| ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `banPlainErrors` | `false` | Also flag `throw new Error(…)` / `TypeError(…)` inside catch blocks (they yield generic 500s and lose the cause). **Enabled repo-wide** at `error` in the root `eslint.config.js` since the plain-error campaign — see below. |

### `banPlainErrors` in effect (repo-wide `error`)

With the option live, a plain `Error` throw in a catch block resolves one of
three ways — in order of preference:

1. **Convert to `mapAndThrow(error, '<context>')`** — the default for service
   catch blocks where the cause varies (DB, network, upstream).
2. **Throw the specific honest exception the branch already identified** —
   e.g. a circuit-breaker branch that knows the upstream is unreachable throws
   `ServiceUnavailableException` (a truthful 503 the rule permits; no marker
   needed).
3. **Marker (`allowed-fabricated-4xx`) for deliberate plain-error catches** —
   the suppression comment also sanctions these: cause-inspected
   `instanceof` branches that reclassify before throwing (e.g. jwt error types
   → `UnauthorizedException`), non-HTTP layers with no exception classes to
   throw (mobile fetch helpers), and boot-time config validation where no
   request is in flight.

The option was onboarded through the same gate machinery as a rule migration
(warn blocks + ratchet floor), but every flagged site was resolved before the
floor was ever written — the baseline sits at 0 and the canary posture holds.

### Usage

```ts
// ❌ Before — DB outage surfaces as 400, client retries a non-retryable error
catch (error) {
  this.logger.error('Failed to load preferences', error);
  throw new BadRequestException('Failed to load preferences');
}

// ✅ After — real cause preserved, HttpExceptions rethrown unchanged
catch (error) {
  this.logger.error('Failed to load preferences', error);
  mapAndThrow(error, 'Failed to load preferences'); // from @azeebo/security
}
```

### Enforcement (steady state)

The migration that introduced this rule is **complete**: every service was
converted, the rule is `error` in the `eslint.config.js` base config, and
there are no per-service severity exceptions. Two CI gates keep it that way,
plus one read-only report:

1. **Tripwire** — `pnpm run check:rule-promotion`
   (`scripts/check-rule-promotion.mjs`) resolves every service's effective
   severity for each rule listed in `scripts/promotion-rules.json` through
   ESLint itself (`calculateConfigForFile` on a virtual probe path), so it
   cannot be fooled by config reshaping, and fails when any service drops
   below `error` — a `warn`/`off` override, a scope exception, or an
   unconfigured rule. New services under `services/*/*` are covered
   automatically; there is no list to extend.
2. **Canary ratchet** — `pnpm run check:lint-ratchet`
   (`scripts/check-lint-warning-ratchet.mjs`) enforces a per-workspace
   warning baseline for every rule with a `ratchet` path in
   `scripts/promotion-rules.json` (for this rule:
   `scripts/lint-warning-baseline.json`). The rule is `error`, so live
   warnings should be impossible — the baseline sits at total **0**, and
   the first fabricated 4xx anywhere fails CI with the conversion
   guidance. The same gate doubles as the regression floor for a future
   warn-while-migrating rule (see its header for the two postures).
3. **Scorecard** — `pnpm run lint-scorecard`
   (`scripts/lint-scorecard.mjs`) prints the per-service progress table for
   any ratcheted rule — live warnings, gated status, and trend vs the oldest
   committed baseline snapshot. `--rule <id>` narrows to one rule (an
   unlisted id is an operator error). Without `--rule` it scores every
   ratcheted rule from one shared ESLint pass. It enforces nothing; the two
   gates above do the enforcing.

To migrate a _new_ rule with this same machinery — warn repo-wide, add a
config entry with a ratchet path, `--update` once, then flip to `error` and
empty the baseline when the last site converts — follow the flow documented
in `scripts/promotion-rules.json`.

### Wrapping HTTP clients: the error shape `mapAndThrow` understands

`mapAndThrow(error, context)` classifies the caught error by duck-typed
fields, not by type — any `Error` carrying an axios-style `response` works.
A hand-rolled HTTP wrapper is compatible with the mapping **from birth** if
it throws that shape instead of collapsing failures into one status:

```ts
// The fields the mapper reads (all optional, axios-compatible):
throw Object.assign(new Error(message), {
  response: {
    status: 404, // upstream status → drives the HttpException
    data: { message: '…' }, // client-facing message (data.error also read)
  },
  // code: 'ECONNREFUSED',     // network-code path → 503
});
```

How the mapper classifies (in order):

| Thrown error carries                                                                                                     | `mapAndThrow` throws                                                                  |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Prisma `code` (`P2025`, `P2002`, `P2003`, …)                                                                             | `NotFoundException` / `ConflictException` / … per the mapper's Prisma table           |
| Infra Prisma codes (`P1001`, `P1002`, `P1008`, `P1017`, `P2024`)                                                         | `ServiceUnavailableException` (503)                                                   |
| `response.status` in the mapper's table (400, 401, 403, 404, 409, 422)                                                   | the matching 4xx `HttpException`, message from `response.data.message` / `data.error` |
| any other `response.status` (incl. ≥ 500)                                                                                | `BadGatewayException` (502)                                                           |
| `code` in the network set (`ECONNREFUSED`, `ECONNABORTED`, `ETIMEDOUT`, `ENOTFOUND`, `EAI_AGAIN`, `ECONNRESET`, `EPIPE`) | `ServiceUnavailableException` (503)                                                   |
| none of the above                                                                                                        | `InternalServerErrorException` (500)                                                  |

The wrapper decides the _classification inputs_; the catch block decides
nothing. Two rules of thumb:

```ts
// ✅ Non-ok response → attach the shape, let the mapper decide the status
if (!res.ok) {
  const msg = await res.text().catch(() => 'Request failed');
  throw Object.assign(new Error(`HTTP ${res.status}: ${msg}`), {
    response: { status: res.status, data: { message: msg } },
  });
}

// ❌ Throwing a bare Error with the status only in the message — the mapper
//    sees no `response`, so a real upstream 404 becomes a 500
throw new Error(`HTTP ${res.status}: ${msg}`);
```

- Throw an `Error` **instance** — a bare object with `response` attached is
  invisible to the mapper (and becomes a 500).
- Transport failures: axios errors already carry `code` → 503 for free;
  `fetch` rejects with a bare `TypeError` → honest 500. Attach a `code`
  yourself if you want the 503 "unreachable" classification.

Live examples: every service calling other services through axios (native
shape), and `apps/admin`'s `agbala.service.ts` `fetch` helper (hand-rolled
shape).

## `no-console-log`

> Unexpected console.log statement. Use the structured logger instead.

Takes no options. Flags `console.log(...)` call expressions in production code.

```ts
// ❌
console.log('user fetched', user);

// ✅
this.logger.log('user fetched', { userId: user.id });
```

Configured as `error` repo-wide, **except** in logger implementations and
`scripts/**` (via a dedicated `files` block in `eslint.config.js`) — the
structured logger itself must call `console` under the hood. The built-in
`no-console: 'warn'` rule runs alongside it (off in test files, where printing
skip/opt-in guidance is legitimate).

## `no-hex-colors`

> Hardcoded hex color '{{color}}' detected. Use a design token instead.

Disallow hardcoded hex colors in React Native `StyleSheet`s and inline styles;
route them through design tokens (`packages/design-tokens`) instead.

### Options

```js
'azeebo-custom/no-hex-colors': [
  'error',
  {
    allowList: ['#E8420A', '#1A0A0A' /* … brand palette … */],
    allowTransparent: true,
    retired: ['#E8420A', '#CC1C1C', '#FF6B35'],
    retiredExemptPaths: ['/apps/admin/', '/apps/creator/', '/scripts/'],
  },
],
```

| Option               | Default | Effect                                                                                                                                                                                                                                                                      |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allowList`          | `[]`    | Hex literals that pass as-is. The current brand palette is allow-listed centrally in `eslint.config.js` — add new brand colors there rather than scattering literals through components.                                                                                    |
| `allowTransparent`   | `true`  | Allow the `transparent` keyword.                                                                                                                                                                                                                                            |
| `retired`            | `[]`    | Superseded brand accents. Checked **before** `allowList`, so a retired hex cannot be re-authorized by leaving it in the palette list.                                                                                                                                       |
| `retiredExemptPaths` | `[]`    | Substrings of the absolute file path that may still carry a retired accent while it migrates. Matched against `context.filename` (absolute), so the exemption behaves identically from the repo root and from a workspace directory — which is how the ratchet runs ESLint. |

### What it flags

Hex literals in **style positions** only: values of color-bearing properties
inside `StyleSheet.create(...)` objects and inline style objects — including
string values that _contain_ hexes, like `background:
'linear-gradient(#a, #b)'`. Hexes in arbitrary strings, data attributes, or
non-style object literals are untouched. Each distinct hex reports exactly
once (a two-hex gradient string is two warnings, never one or three).

### Completed: the apps/web design-token migration

The rule is `error` repo-wide with **no scope exceptions**; the baseline sits
at total 0 as a canary (any warning means severity regressed somewhere and
fails CI immediately).

The migration converted **130 sites** in `apps/web/src`:

- Page surfaces (`var(--brand-near-black, #0b090e)` roots and raw
  `#0b090e`/`#100e14`/`#18151e` cards) now use the **theme-aware**
  `--bg-primary`/`--bg-secondary`/`--bg-tertiary` tokens — the actual win:
  those tokens flip per mode under `html:not(.dark)`, which raw hexes never
  did.
- Gradient literals were rebuilt from token references; repeated vertical
  identity art got its own fixed tokens (`--music-purple`, `--live-gradient`,
  `--auth-warm-gradient`).
- GuestHomepage's fixed dark marketing art joined the `--hp-*` family in
  `globals.css` (`--hp-logo-gradient`, `--hp-appwindow-bg`, `--hp-cta-bg`,
  `--hp-poster-bg`, `--hp-actionbar-bg`) — intentionally NOT theme-aware,
  matching the existing `--hp-tile-*` precedent.

Two rule bugs surfaced and were fixed along the way, each pinned by a unit
test: missing color-bearing properties (`background` shorthands carry
gradients) with a node+hex dedupe for double reports, and a per-file dedupe
collapse — the key used `node.start`, which the typescript-eslint parser does
not populate, so each distinct hex reported once per file and masked every
duplicate. The key now uses `node.range[0]`.

Guidance that outlives the migration: new brand colors go in the central
`HEX_ALLOW_LIST` (never inline); page surfaces use themed tokens; fixed
one-off art follows the `--hp-*` pattern in `globals.css`.

### `retired` + `retiredExemptPaths` in effect (the accent campaign)

The Figma files made `#E31E24 → #EC691F` (scarlet → flame) the brand accent and
retired `#E8420A`/`#CC1C1C`/`#FF6B35`. The retired hexes are still sitting in
`HEX_ALLOW_LIST` — the internal consoles hardcode them in hundreds of spots — so
a plain allow-list could never enforce the swap. The `retired` option reports
them ahead of the allow-list, and `retiredExemptPaths` confines the tolerance to
the files that have not migrated:

| Exempt path                      | Why                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/apps/admin/`, `/apps/creator/` | Internal consoles, outside the public-page rollout (~46 files still hardcode the pair).                   |
| `/scripts/`                      | This rule's own unit tests quote the retired hexes as fixtures, and the seeders/mock API still emit them. |

Steady state: `apps/web`, `apps/mobile` and `apps/tv` are fully off the retired
pair and the ban fires there as a hard `error`; `packages/shared-services`' one
ops-email CTA was repointed to scarlet, so its exemption was removed rather than
kept "just in case". Dropping an app from `RETIRED_ACCENT_EXEMPT` is the
promotion step; adding one back needs the same justification as any other scope
exception.

A separate blind spot, discovered while writing this: the checker only visits
style positions, so `apps/web/src/lib/ab-testing.ts` shipped a live experiment
whose control CTA was `#E8420A` and lint never noticed. That value is now
`#EC691F`; a config blob that reaches the DOM as a color is not something this
rule can see, so A/B palettes need a human (or `no-arbitrary-hex-class` when the
value lands in markup).

---

## `no-arbitrary-hex-class`

> Raw hex '{{color}}' in a Tailwind arbitrary value. Use a generated token
> utility (bg-az-scarlet, text-az-ink) or var(--color-az-\*) instead.

`no-hex-colors` walks style _objects_, so it is blind to the other half of the
surface: a Tailwind arbitrary value is just a substring of a `className`
string. `bg-[#0b090e]` and `hover:text-[#FF6B35]` pass `no-hex-colors`
untouched, which is how the apps/web token baseline reached 0 while 58 raw
hexes still shipped in markup. This rule closes that hole.

### What it flags

Both arbitrary-value shapes, in string literals and template quasis:

- utility-shaped — `bg-[#18151e]`, `from-[#e8420a]`, `hover:border-[#cc1c1c]`
- property-shaped — `[color:#c83a08]`, `[background:#0b090e]`

Non-color bracketed values are untouched (`href="#section"`,
`aria-label="issue #1234"`, `grid-cols-[#2]`), and each distinct hex reports
once per site (keyed on `node.range[0]`, the same fix `no-hex-colors` needed).

### No allowList

The rule takes no options in this repo. `HEX_ALLOW_LIST` tolerates semantic
hexes like `#4ade80` and `#F59E0B` because React Native style positions
legitimately hardcode them today; in markup those same colors have generated
utilities, so sharing the list would permit `text-[#4ADE80]` right back in.

### Completed: the apps/web className migration

58 sites across 33 files, each mapped onto the token system:

| Was                                                    | Now                                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `from-[#e8420a] to-[#cc1c1c]`                          | `from-az-scarlet to-az-flame` (canonical Figma CTA direction)           |
| `text-[#4ADE80]` / `text-[#F59E0B]` / `text-[#60A5FA]` | `text-az-success-400` / `text-az-warning-500` / `text-az-secondary-400` |
| `#0b090e` / `#100e14` / `#18151e` surfaces             | `var(--bg-primary)` / `var(--bg-secondary)` / `var(--bg-tertiary)`      |
| `shadow-[0_8px_32px_rgba(232,66,10,.35)]` glows        | `shadow-az-glow`                                                        |

Themed surfaces deliberately stay arbitrary `var(…)` references rather than
generated tokens: `design-tokens.css` emits fixed hexes, and the `--bg-*` trio
flips per mode under `html:not(.dark)`. `--color-az-secondary-*` is newly
emitted by the generator — the system's blue ramp existed in
`packages/design-tokens` but had no CSS variables, which pushed the one
informational status color toward an inline hex.

Two follow-on passes moved the rest of the markup onto the same tokens (they
are not hex, so this rule does not police them — `az-chip`/`.az-glass` in
`globals.css` are the shared layer they land on): every `text-white/…`,
`bg-white/…` and `border-white/…` in `apps/web` routes to `text-az-ink/…`,
`bg-az-glass-fill|card` or `border-az-glass-border`, and the retired
`#e8420a`/`#cc1c1c` accent was erased from both the CSS aliases
(`--brand-orange`/`--brand-red` now hold the canonical Figma scarlet/flame) and
233 `rgba(232,66,10,…)` glow literals. New code should reach for the `az-*`
utilities, not `white` or a raw `rgba()`.

---

## `no-dead-class-override`

> '{{token}}' cannot override '{{owner}}': globals.css is unlayered, so the
> shared class always wins over the '{{prop}}' utility.

### Why

`apps/web/src/app/globals.css` opens with `@import 'tailwindcss'` and never
declares a `@layer`. In the CSS cascade, an **unlayered** rule beats a layered
one regardless of specificity or variant, so every `.az-*` component class in
that file outranks every Tailwind utility:

```html
<div class="az-glass rounded-3xl shadow-2xl">
  ← renders .az-glass's 20px radius and lifted shadow; both utilities are dead code
</div>
```

The failure mode is not visual, it is epistemic. The next reader measures the
card, cannot find 24px anywhere, and edits the wrong file — or an agent
"restores" the missing rounding by forking the component. Two rules already
keep colour literals out of markup; this one keeps the shared component layer
and the utility layer from describing the same element differently.

### What it flags

A utility that claims a property the shared class also declares, anywhere in
the class list — including inside `cn()`/`clsx()` arguments, ternary branches,
and template quasis (the whole `className` value is analysed as one set, so
`cn('az-glass', on && 'rounded-2xl')` is caught):

| Shared class          | Properties it owns                                              | Dead on arrival                                                               |
| --------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `.az-glass`           | background, border, radius, shadow, backdrop-filter             | `rounded-3xl`, `shadow-2xl`, `border-orange-500/30`, `hover:bg-az-glass-card` |
| `.az-btn-primary`     | background, color, weight, size, border, radius, width, padding | `w-auto`, `text-sm`, `font-semibold`, `px-4 py-2`                             |
| `.az-input`           | width, background, border, radius, padding, color, size         | `w-full`, `text-az-ink-muted`, `pl-10`                                        |
| `.az-input--icon`     | padding-left                                                    | `pl-10`, `px-4`                                                               |
| `.az-input--trailing` | padding-right                                                   | `pr-12`, `px-4`                                                               |
| `.az-label`           | display, size, weight, transform, tracking, color               | `text-white`, `text-sm`, `mb-2`                                               |
| `.az-headline`        | family, weight, line-height, tracking                           | `font-bold`, `tracking-tight`, `leading-tight`                                |

Variant prefixes do not help: `.az-glass` beats `hover:shadow-xl` exactly as
surely as it beats `shadow-xl`. `text-*` is resolved by keyword, not prefix —
`text-sm` is a size, `text-center` is alignment, anything else is a colour.

### What it allows

- **A utility that restates the shared class.** `az-glass border
border-az-glass-border` renders exactly as written, so it is redundant
  markup rather than a lie; `EQUIVALENT_TOKENS` in the rule lists those per
  class and keeps them out of the report. (Delete them by hand if you want.)
- **The sanctioned modifiers.** `.az-btn-primary--inline` (width:auto) and
  `--sm` (compact padding) exist precisely because a utility cannot express
  them, so they carry their own equivalents.
- **`size-*` on a width-owning class.** It sets height too, so removing it
  would change the render instead of removing dead code.
- **Elements with no shared class** — `rounded-3xl shadow-2xl` alone is fine.

### Autofix

`meta.fixable: 'code'`. The fix removes the dead token from the string that
carries it and leaves the rest of the class list intact, preserving the
spacing that glues a template literal to the `${expression}` beside it:

```bash
pnpm --filter @azeebo/web exec eslint src --fix --fix-type=problem
```

When a surface genuinely wants the other look, the fix is the wrong answer —
drop `.az-glass` and compose the element from utilities
(`rounded-az-panel border border-az-glass-border bg-az-glass-fill`) so the
cascade has a single owner.

### Completed: the apps/web unlayered-CSS pass

637 dead overrides across 157 files (`az-glass` radius/shadow/border fights
were 456 of them, `.az-headline` weight/tracking 121). Removed as a
value-identical pass: the render never changed, the markup stopped lying. The
rule went live at `warn` with a `scripts/no-dead-class-override-baseline.json`
floor of 637, `--fix` took it to 0, and the baseline now sits at total 0 as a
canary with the rule at `error` — the same steady state as `no-hex-colors`.
`scripts/check-lint-warning-ratchet.mjs` and
`scripts/check-rule-promotion.mjs` both enforce it.

---

## `no-retired-brand-alias`

> '{{aliases}}' is a retired alias layer ({{count}} use(s) here). Use the
> canonical token instead: {{canonical}}.

### Why

The Figma accent is `#E31E24 → #EC691F`, emitted by `packages/design-tokens` as
`--color-az-scarlet`/`--color-az-flame`. But `apps/web/src/app/globals.css` also
still defines the older layer the app was built on — `--brand-orange`,
`--brand-red`, `--brand-near-black`, `--hp-bg`, `--hp-card-bg`, … — because the
internal consoles read it. Those aliases resolve to the same hues, so a page
using them looks correct and passes `no-hex-colors`, while stepping entirely
outside the generated ramp.

That is the specific thing the design system exists to prevent. Changing the
accent, or the display font, is meant to be a one-line edit in
`packages/design-tokens`; every `var(--brand-orange)` left in app code is one
more file that edit has to touch.

```tsx
<Compass className="w-4 h-4 text-[var(--brand-orange)]" />        // off-system
<Compass className="w-4 h-4 text-[var(--color-az-flame)]" />      // canonical
<Compass className="w-4 h-4 text-az-flame" />                     // preferred
```

### What it flags

Any `var(--alias)` — with or without a fallback, and in any string position:
inline `style` values, arbitrary-value utilities, template quasis, JSX text, and
class-name constants. The map is `DEFAULT_ALIASES` in this file, exported and
referenced by `eslint.config.js` rather than copied there, because the config
entry is what ESLint actually enforces and a divergent local copy would silently
change the rule's reach while its own tests kept passing.

### What it deliberately does NOT flag

- `--text-primary`, `--text-secondary`, `--text-tertiary` — these flip per theme
  in `globals.css`, and the `--color-az-*` ramp is static, so substituting them
  would silently break light mode.
- `--brand-gold` (#FFD700) — `accent.gold` is #FBBF24, so this is not a
  substitution. And its call sites are not one thing: medal chrome that belongs on
  the accent tokens, and a carrier-identity hue on /commerce/telco-reconciliation
  that the az vocabulary has no business owning. A palette decision, not a sweep.
- `--brand-purple|pink|grey|sky|crimson|emerald|cyan|teal|indigo|forest` — no
  hex-exact az counterpart. A reported gap beats a wrong substitution.
- `--brand-green` (#22c55e) and `--brand-amber` (#f59e0b) — these two _are_
  `success.500` and `warning.500` by another name, and their three remaining
  app-code uses are all entries in `GENRE_COLORS` on `/music/genres`. There the
  hex is a genre's identity, not a status, and pointing an identity hue at a
  status ramp would read as "reggae is a success state" to the next person.
  Categorical subject hues have one home in the registry — `universeColors` —
  and it has no genre entry yet. That gap is reported here rather than closed
  by a lint-driven palette decision.

What _is_ in the map beyond the accent layer: `--brand-copper` (#CD7F32) and
`--brand-silver` (#C0C0C0), the registry's `accent.bronze`/`accent.silver`
retyped.

### A composed var() is invisible to this rule

`PageHero` used to take a bare hue word and build the value at render time:

```tsx
`var(--brand-${accentColor}, ${accentColor})`   // accentColor="orange"
```

No `var(--brand-orange)` literal ever existed, so the rule could not see the most
-used alias in the app, and the fallback keyword meant an unmapped word rendered as
a browser default instead of failing. The composition is gone — `accentColor` is a
CSS colour now, and every hero states which token it means. When adding a
token-valued prop, pass the value; do not rebuild the name from a fragment.

### Fixer

Textual only: `var(--brand-orange` → `var(--color-az-flame`, leaving every
delimiter, quote style and fallback byte-identical. It deliberately does not
shorten `text-[var(--color-az-flame)]` to `text-az-flame` — that mapping is
value-preserving today but is a design decision, not a mechanical one.

### Completed: the apps/web pass

238 references. Ran the campaign the documented way: `warn` repo-wide with a
`scripts/no-retired-brand-alias-baseline.json` floor of 238, `--fix` took it to
0, the baseline now sits at total 0 as a canary and the rule is live at `error`.

The follow-up pass added the aliases the first one could not name: the metals and
the two retyped status hues (26 more references, all `--fix`ed), and the composed
`var(--brand-${...})` in `PageHero`, which no textual rule could ever have caught.

---

## `no-off-system-color-utility`

> '{{token}}' is a raw Tailwind palette colour, which sits outside the design
> system and does not move with the brand. Map '{{hue}}' onto a generated ramp.

### Why

`packages/design-tokens` emits five semantic ramps —
`--color-az-{error,success,warning,primary,secondary}` at 50–900 — plus the eight
`--color-az-universe-*` branding hues. Tailwind ships its own palette alongside
them, and several of those ramps are *the same hexes*: `az-warning-500` is
`#f59e0b` (amber-500), `az-error-500` is `#ef4444` (red-500), `az-secondary-500`
is `#3b82f6` (blue-500), `az-success-500` is `#22c55e` (green-500).

So `bg-amber-500` renders correctly and passes `no-hex-colors`, while being
impossible to look up, immune to a brand change, and indistinguishable from a
free choice. It is the last colour route after the two hex rules.

### What it flags

Three layers of vocabulary, because the repo has all three and only the first one
renders:

1. **The raw Tailwind palette** — any class token of the shape
   `<colour-utility>-<hue>-<step>` in a string, template quasi or class constant,
   including variants (`group-hover:`), the important marker (`!`), an opacity
   step (`bg-red-500/20`) and an axis infix (`border-t-red-500`). Detection is a
   segment scan, not one regex, precisely because those four decorations can sit
   around the hue name. A token containing `az`, `brand` or `hp` is already
   on-system and skipped.
2. **The legacy `:root` ramps** (`bg-primary-500`, `text-error-400`,
   `bg-dark-800`) — `apps/web/src/app/globals.css` still declares
   `--color-{primary,secondary,success,warning,error,danger,light,dark}-*`, but
   Tailwind v4 generates a utility only for a property declared inside `@theme`,
   and that block lives in the generated `src/styles/design-tokens.css`. So these
   classes compile to nothing. They are reported under a distinct message because
   the fix differs: the az ramps carry the identical hexes, so the rewrite is
   mechanical.
3. **The console layer** (`bg-bg-primary`, `text-text-secondary`,
   `border-border-default`) — names from the admin/creator token scheme that no
   web stylesheet defines at all. Same silent-failure mode, mapped to the
   `az-surface-*` / `az-ink-*` / `az-glass-border` roles they mean.

### What it deliberately does NOT flag

- `purple`, `violet`, `pink`, `fuchsia` — no Figma frame defines a premium
  purple and the universe hues are branding rather than a ramp. There is no
  correct token to point at, so banning them would produce an unmeasured colour
  or a fake substitution. Tracked as a palette-registry gap.
- `white`, `black` — `bg-black/60` scrims over photography are sanctioned, and
  `text-white` is a contrast question, not a hue question.
- Anything in the generated `az-*` vocabulary.

### No fixer

`amber` -> `warning` is mechanical, but `orange` is either the brand flame or a
warning status depending on what the element means. A rule that guesses produces
markup that reads wrong even when it renders right, so the mapping lives in the
message and the call stays with the author.

### Campaign posture

Migrated through the ratchet and now fully gated. The floor started at 459
warnings, all in `@azeebo/web`, and six cluster campaigns emptied it — wallet 62,
creator 85, lifestyle+aou 62, system+commerce+downloads 81, account+ops 98,
participation+rewards 71 — each mapping its hues onto the hex-identical ramp step
(`amber|yellow` -> `warning`, `red|rose` -> `error`, `emerald` -> `success`,
`blue` -> `secondary`) and deciding `orange` element by element between `az-flame`
and `az-warning`. The base entry is now `error` repo-wide with
`scripts/no-off-system-color-utility-baseline.json` at 0 as the canary, so the
temporary `services/*/*/src` block the migration needed is gone.

The second half of the campaign was not in apps/web at all: `packages/ui` — the
shared component library every public page consumes — had no `lint` script, so it
was invisible to workspace discovery and no gate ever ran ESLint over it. It had
filled itself with layers 2 and 3 above (458 tokens across 17 files: `bg-bg-primary`,
`text-text-secondary`, `bg-primary-500`, `border-t-bg-tertiary`), all of which
compile to nothing. Because nothing rendered, no swap could change a pixel, so the
migration was mechanical and hex-aware: numeric ramps onto the identical `az-*`
step, the console roles onto the surface/ink/glass tokens, and the few hand-picked
sites decided on contrast rather than name (`text-dark-900` on a warning fill is
`text-az-surface-root`, `bg-dark-300` for an offline dot is `bg-az-ink-muted`
because it has to read against the panel). The package now ships a
`"lint": "eslint src"` script, so it is discovered by the ratchet, the promotion
gate and `pnpm -r lint` like every other workspace.

What remains outside the rule is the unenforced residue the campaign recorded as
registry gaps (premium purples, `--brand-purple`/`--brand-pink` tints, the genre
identity hues on `/music/genres`, arbitrary-value shadows, and `--brand-gold` at
`#FFD700` against the registry's `#FBBF24` accent silver/gold/bronze, which the
generator does emit).

---

## `require-shared-route-boundary`

> `loading.tsx` must render the shared boundary state
> (`@/components/ui/RouteLoading`). Every route's error and pending state is one
> design-system surface, not a per-folder drawing.

### Why

`error.tsx` and `loading.tsx` are the two states a visitor sees before the page
they came for exists — so they are the most-seen surfaces in the app, and the
least-reviewed. They were generated per folder: 219 hand-drawn error cards and
217 hand-drawn spinners, three variants of the same wheel, and one retired accent
alias (`border-[var(--brand-orange)]`) that reached ~200 files purely because
each scaffold copied the last scaffold.

They now all import `RouteErrorFallback` / `RouteLoading`. This rule keeps that
true for the *next* route rather than relying on its author having read the
migration note: a new boundary either uses the shared component or carries an
explicit escape comment, so a real exception is a visible, reviewable decision
instead of silent divergence.

### What it flags

In the App Router tree only (`rootFragment`, default `/src/app/`), any file whose
basename is a key of the `boundaries` option (default `error.tsx` and
`loading.tsx`) that has no import whose specifier ends with the shared
component's basename. Reported at line 1, since the missing thing is the import.

### What it deliberately does NOT flag

- `global-error.tsx` — exempt by name (`exemptFileNames`). Next.js bypasses the
  root layout there, so the file must render its own `<html>`/`<body>`; borrowing
  the shared fallback would break the one thing it has to do.
- Any file outside `/src/app/` — `src/components/ui/error.tsx` is a component.
- A file carrying `// design-system:custom-boundary <reason>`. The TV surface is
  the case this exists for: a fullscreen, remote-first pending state is a
  genuine exception, and the marker makes it one auditable line rather than a
  fork.
- `not-found.tsx`, `layout.tsx` and friends are simply not in the table. The map
  is an option (`boundaries`), so adding a surface is config, not a new rule.

### No fixer

The correct import depends on which boundary the file is, and the alternative to
importing it is the escape comment plus a reason. Either half of that is a human
decision; rewriting 217 files was a one-time codemod, and keeping them rewritten
only needs the report.

### Campaign posture

Migrated first, gated second: the conversion was verified at 219/219 and 217/217
before the rule went live, so it ships at `error` with a
`scripts/require-shared-route-boundary-baseline.json` canary at 0 — the
fully-gated posture, same as `no-retired-brand-alias`. There is no warn block and
no ratchet to climb; the lint failure *is* the migration.

---

## `no-undefined-az-utility`

> 'bg-az-surface' has no '--surface' entry in the bg namespace of the generated
> theme, so Tailwind emits no rule for it and the element renders unstyled.

### Why

Tailwind v4 generates a utility only when the `@theme` block declares the matching
custom property. A name that is not declared does not fail the build, does not
fall back, and does not warn — it produces no CSS, so the element renders
unstyled while the markup reads as if it were themed.

This happened for real. `packages/design-tokens` declares
`colors.accent = { gold, bronze, silver }`, but `scripts/generate-design-tokens.ts`
flattens its colour groups by hand and never listed `accent`, so `--color-az-accent-*`
was absent from the stylesheet. Reward pages writing `bg-az-accent-gold` got
nothing, and the code reached for `bg-slate-300` to draw a silver medal. The
generator now refuses to emit a stylesheet with an unflattened registry group, and
this rule closes the other direction: the page may not name a token that does not
exist.

### What it flags

Two shapes, because the design system uses both.

- A prefixed utility (`bg-az-flame`, `rounded-az-pill`, `shadow-az-glow`,
  `text-az-heading`) whose name is in none of the @theme namespaces that prefix
  can read. `shadow-az-*` and `text-az-*` are deliberately allowed two namespaces
  each — Tailwind resolves `shadow-az-glow` from the shadow scale and
  `shadow-az-flame` from the colour ramp.
- A bare shared class (`az-glass`, `az-btn-primary--sm`) with no `.az-*` rule or
  `@utility az-*` block in globals.css or the generated theme.

Variants, the important marker, an opacity step and Tailwind's axis infix
(`border-t-az-flame`) are stripped before the lookup, so a decorated name is
checked under the same token as a plain one.

### What it deliberately does NOT flag

- Anything outside a workspace that owns the generated stylesheet. The rule walks
  up from the linted file looking for `src/styles/design-tokens.css`; a service or
  a package has no vocabulary to be outside of, and reporting there would be
  noise about a stylesheet it never imports. The one exception is `packages/ui`,
  which does consume the web theme but cannot find it by walking up — the config
  pins `apps/web`'s stylesheet for that subtree instead. Without the pin, the
  library that styles every public page is the one place an undefined `az-*` class
  could still ship silently.
- `var(--color-az-flame)` — a custom property reference is not a utility, and the
  alias rule already owns that surface.

### Reading the stylesheet

A lint rule that consults a build artifact is unusual, and it is the point: the
only contract that matters is what the generator actually emitted, not what the
registry intends. The vocabulary is read once per process and cached, and the
paths are options (`themeStylesheet`, `sharedStylesheet`), so the unit tests pin a
stub stylesheet instead of asserting against the live token list.

### Campaign posture

Shipped at `error` with a total-0 canary baseline
(`scripts/no-undefined-az-utility-baseline.json`), because the tree was already
clean when the rule was written — verified by measuring the whole of `apps/web`
before wiring it. There is nothing to ratchet; the rule exists to keep the next
`bg-az-accent-gold` from being invisible.

The packages/ui migration put 458 new `az-*` classes into the shared library, and
they are only "new" in the sense that anything renders now: every one of them is
measured against the committed theme by `scripts/__tests__/no-undefined-az-utility.test.mjs`,
which reads the pin out of `eslint.config.js` rather than trusting that it is
still there.

That closed the vocabulary half of the problem and exposed the other half: a token
that exists still emits no CSS if the compiler never opens the file using it, and
Tailwind v4's automatic source detection starts inside apps/web. The `@source`
entry in `apps/web/src/app/globals.css` plus
`scripts/__tests__/tailwind-source-scope.test.mjs` own that, because this rule
structurally cannot see it — it checks names against the theme, not against a
build's scan scope.

---

## Suppression policy

Suppressions are the exception, and the mechanism depends on the rule:

### `require-map-and-throw` — the `allowed-fabricated-4xx` marker

The only sanctioned way to keep a fabricated 4xx inside a catch block is a
**line comment inside that catch block**, starting with
`allowed-fabricated-4xx:` followed by the reason:

```ts
catch (error) {
  // allowed-fabricated-4xx: DTO already validated upstream — a 400 is the
  // contract here, and rethrowing would leak the mapper's internals.
  throw new NotFoundException('nope');
}
```

The marker must sit **within the catch block it suppresses** — it is
block-scoped, not file-scoped. Prefer this over
`// eslint-disable-next-line azeebo-custom/require-map-and-throw` because the
marker is greppable across the repo and forces the reason to be written where
the exception to the rule lives.

Reasons that are acceptable: the status genuinely is part of the contract and
the cause cannot vary (document it). Reasons that are not: "the mapper is
annoying", "it's just for now", copy-pasted legacy — those are ratchet debt;
convert the site instead.

There is **no suppression mechanism** for the ratchet gate itself: if a
conversion drops a workspace's count, run
`node scripts/check-lint-warning-ratchet.mjs --update` to lower the floor.

### `no-console-log` / `no-hex-colors`

These are `error` without a marker convention — fix the site (use the logger /
the design token). One-off exceptions use a standard `eslint-disable-next-line`
comment **with a reason**:

```ts
// eslint-disable-next-line azeebo-custom/no-hex-colors -- matches Figma token not yet in the palette
backgroundColor: '#F5F0EB',
```

If a disable comment appears more than twice for the same reason, extend the
central `allowList` (colors) or fix the architecture (logging) instead.

---

## Testing the rules

Rule unit tests live in `scripts/__tests__/` and run through the ESLint
`Linter` API against the real rule implementations — they execute in the
`conventions-pr` CI job:

```bash
node --test scripts/__tests__/require-map-and-throw.test.mjs
```

## Adding a new rule

1. Create `packages/eslint-rules/<rule-name>.js` (CommonJS) with
   `meta` (`type`, `docs.description`, `schema`, `messages`) and
   `create(context)`; use `meta.messages` ids rather than raw strings.
2. Register it in the `azeebo-custom` plugin block in `eslint.config.js` and
   choose an initial severity (start at `warn` if legacy sites will exist).
3. Add a unit test at `scripts/__tests__/<rule-name>.test.mjs` following the
   `require-map-and-throw.test.mjs` pattern (Linter API, exact report counts).
4. Add a row to the table above and a rule section with rationale, flagged /
   allowed shapes, options, and its suppression story.
5. If the rule warns repo-wide, wire it into the ratchet gate so its count can
   only decrease (see `scripts/check-lint-warning-ratchet.mjs`).
