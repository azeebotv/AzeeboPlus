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

| Rule | Type | Severity in this repo | Purpose |
|------|------|----------------------|---------|
| [`require-map-and-throw`](#require-map-and-throw) | problem | `error` repo-wide (canary ratchet at 0) | Ban fabricated 4xx statuses in catch blocks |
| [`no-console-log`](#no-console-log) | problem | `error` (off in logger/scripts) | Ban `console.log` in favor of the structured logger |
| [`no-hex-colors`](#no-hex-colors) | suggestion | `error` repo-wide (token migration complete, baseline canary at 0) | Ban hardcoded hex colors in favor of design tokens |

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

| Option | Default | Effect |
|--------|---------|--------|
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

To migrate a *new* rule with this same machinery — warn repo-wide, add a
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
    status: 404,               // upstream status → drives the HttpException
    data: { message: '…' },    // client-facing message (data.error also read)
  },
  // code: 'ECONNREFUSED',     // network-code path → 503
});
```

How the mapper classifies (in order):

| Thrown error carries | `mapAndThrow` throws |
|---|---|
| Prisma `code` (`P2025`, `P2002`, `P2003`, …) | `NotFoundException` / `ConflictException` / … per the mapper's Prisma table |
| Infra Prisma codes (`P1001`, `P1002`, `P1008`, `P1017`, `P2024`) | `ServiceUnavailableException` (503) |
| `response.status` in the mapper's table (400, 401, 403, 404, 409, 422) | the matching 4xx `HttpException`, message from `response.data.message` / `data.error` |
| any other `response.status` (incl. ≥ 500) | `BadGatewayException` (502) |
| `code` in the network set (`ECONNREFUSED`, `ECONNABORTED`, `ETIMEDOUT`, `ENOTFOUND`, `EAI_AGAIN`, `ECONNRESET`, `EPIPE`) | `ServiceUnavailableException` (503) |
| none of the above | `InternalServerErrorException` (500) |

The wrapper decides the *classification inputs*; the catch block decides
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
  },
],
```

| Option | Default | Effect |
|--------|---------|--------|
| `allowList` | `[]` | Hex literals that pass as-is. The current brand palette is allow-listed centrally in `eslint.config.js` — add new brand colors there rather than scattering literals through components. |
| `allowTransparent` | `true` | Allow the `transparent` keyword. |

### What it flags

Hex literals in **style positions** only: values of color-bearing properties
inside `StyleSheet.create(...)` objects and inline style objects — including
string values that *contain* hexes, like `background:
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
