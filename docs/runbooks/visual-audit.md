# Visual audit (contrast, overflow, clipped text, broken images)

`scripts/visual-audit.mjs` renders every static route in headless Chromium and
fails on what a reader would call broken. On every PR the **Visual Audit
(contrast, overflow, images)** job in
[`pr-checks.yml`](../../.github/workflows/pr-checks.yml) runs it twice across the
web app's production build — once as a guest, once signed in (see [Two sign-in
states](#two-sign-in-states)) — and either run fails the job. The admin and
creator portals are supported by the same script and run locally (see
[Portals](#portals)).

It exists because the 2026-11-10 sweep found defects no unit test can see: white
text on the flame accent measured 3.18:1 on 152 of 177 pages, and admin/creator
links landed on blank documents because the redirect kept a path prefix the
portals don't route. Both shipped with a green test suite, because nothing
rendered a page and looked at it.

## What it checks

Per route and viewport (1440×900 and 390×844):

| Check          | Fails when                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contrast`     | Text measures below WCAG 2.2 AA against the colour painted behind it: 4.5:1, or 3:1 for large text (24px, or 18.66px bold). Gradient backgrounds are measured against **every opaque stop**; a `url()` or translucent layer is skipped, not guessed. Gradient-clipped text (`background-clip: text`, computed colour `transparent`) is measured by its own stops against the layer _behind_ it — not as black text. |
| `overflow`     | The document scrolls sideways. Elements inside an intended scroller (carousel, table) are not offenders.                                                                                                                                                                                                                                                                                                            |
| `clipped-text` | Text is cut off with no ellipsis and no line clamp.                                                                                                                                                                                                                                                                                                                                                                 |
| `broken-image` | An `<img>` finished with `naturalWidth === 0` — usually a `next/image` host missing from `remotePatterns`.                                                                                                                                                                                                                                                                                                          |
| `route-error`  | The route answered 4xx/5xx or navigation threw and was not a portal hand-off.                                                                                                                                                                                                                                                                                                                                       |

Route discovery is filesystem/route-table based (`apps/web/src/app/**/page.tsx`,
each portal's `App.tsx` routes), so a new screen is audited without touching the
script. Dynamic routes (`[id]`, `:id`) are skipped — they need real ids and would
mostly audit the same not-found state. Routes that redirect (auth gates, the
portal hand-off) are reported as _gated_ and not counted; the destination is
audited on its own line.

### Portal hand-offs

The web app owns `/admin` and `/creator` paths, but answers them with a 307 to
the portal origin — which a `--app web` run does not serve. Chromium follows that
redirect for the main-frame document without offering it to request interception,
so a naive nav dies with `ERR_CONNECTION_REFUSED`: the first full pass reported
forty working hand-offs as broken routes. The audit therefore reads the 3xx
`Location` before the browser follows it; a destination on any app origin this
run is not auditing is recorded as gated (`redirected to … (portal hand-off)`).
A refused connection whose 3xx was missed is still gated, because Playwright puts
the URL in the error. When the destination _is_ being audited (`--app all`), the
portal is measured on its own routes; nothing is ever audited through the
hand-off.

## Running it

```bash
# the web app, both viewports (needs a server on :4000 — `pnpm --filter @azeebo/web dev`)
pnpm audit:visual

# as a signed-in account, so /wallet, /settings, /messages, … render
pnpm audit:visual --signed-in

# one route, desktop only, verbose
pnpm audit:visual --only /movies --viewport desktop --verbose

# the portals (needs their preview servers: see below)
pnpm audit:visual --app admin --base-url http://localhost:5173
```

Useful flags: `--app web|admin|creator|all`, `--base-url <url>` or
`--base-url web=http://127.0.0.1:3000`, `--checks contrast,overflow`,
`--json-out <file>`, `--screenshots <dir>`, `--settle <ms>`,
`--concurrency <n>`, `--no-stub-api`, `--signed-in`.

Exit codes: `0` clean, `1` findings or stale allowlist entries, `2` could not run
(server down, Playwright/Chromium missing).

### Portals

Both portals authenticate by asking the gateway `GET /api/v1/auth/me` for an
httpOnly-cookie session. The audit answers that call (and `/auth/refresh`) with a
seeded profile so it sees real screens instead of the login hand-off; the rest of
the API returns `data: null`, which the portals' payload guards coerce to an
empty state. Serve them from a production build:

```bash
pnpm --filter @azeebo/admin --filter @azeebo/creator run build:client
(cd apps/admin && pnpm exec vite preview --config client/vite.config.ts --port 5173 --strictPort) &
(cd apps/creator && pnpm exec vite preview --config client/vite.config.ts --port 5174 --strictPort) &
pnpm audit:visual --app admin --base-url http://localhost:5173
```

### Two sign-in states

Guest and signed-in are different layouts, not one layout with a flag:

- As a **guest**, the middleware 307s every protected route (`/wallet`,
  `/settings`, `/messages`, `/dashboard`, …) to `/auth/login`. A guest-only run
  therefore never renders those screens — 106 of the web app's 177 routes — and a
  green report says nothing about them.
- As a **signed-in account**, the audit sets the web middleware's own marker
  cookie (`azeebo_web_auth`, any non-empty value other than `authenticated`, per
  `apps/web/src/lib/cookie-names.ts`). Protected routes render their real layout
  on stubbed empty data. In this state `/` 307s to `/home`, so the _guest_
  homepage is the one that is unreachable.

So CI runs both states (`--signed-in` for the second) and each fails on its own
findings. Both are cheap: the whole web app is ~4 minutes per state.

**The portals are not gated in CI yet.** One full admin pass (45 routes, both
viewports) measured 221 findings — legacy `#E8420A` text at 4.47:1 on the panel
surface, `#CC1C1C` at 3.21:1, white on `#3B82F6` at 3.68:1, and a 127px
sideways scroll from the mobile sidebar. Clearing that is a design-token pass
through the portal themes, not a CI switch: wiring it in now would either block
every PR or bury the signal under an allowlist. Run it locally when touching a
portal screen, and treat the numbers above as the backlog.

## Findings and the allowlist

Current state is clean, so **any** finding fails the job. A finding that is a
deliberate, justified exception goes in
[`scripts/visual-audit-allowlist.json`](../../scripts/visual-audit-allowlist.json):

```json
{
  "check": "contrast",
  "identity": "rgb(227, 30, 36)|on|rgb(15, 15, 15)|18px",
  "reason": "Brand scarlet display type on the dark canvas; design decision of 2026-11-10.",
  "app": "web", // optional: narrow to one surface
  "route": "/vertical/agbala" // optional: narrow to one route
}
```

`identity` is the _cause_, not the full finding id — the full id is
`check|identity`, and a leading `check|` in the file is rejected. Identities are
built from the cause (a colour pair and size, an element's class signature, an
image host and path), never from text or coordinates, so a copy edit does not
invalidate an entry. One entry excuses one finding; two look-alikes on two routes
need two entries.

Two rules keep the list honest:

- **A reason is required** (at least 10 characters). The JSON is validated before
  the run, so a silent exception cannot be added.
- **A stale entry fails the job.** If nothing reproduces the finding any more,
  the entry must be deleted — an exception that outlives its defect forgives the
  next thing that looks like it. `--update` prunes matched entries automatically;
  it will not write a reason for a new finding, because a generated excuse is
  the drift this gate exists to catch.

## Fixing the common cases

- **White text on flame** (`3.18:1`): use the deep surface ink
  (`text-az-surface-root`, 6.03:1), or make the label large text (≥18.66px
  bold) if it must sit on the brand gradient, as `.az-btn-primary` does.
- **The brand CTA gradient** (scarlet → flame) cannot carry a small label:
  white is 3.18:1 on the flame stop, and deep ink is 4.09:1 on scarlet. Small
  CTAs use `.az-cta-small` or `.az-btn-primary--sm` (solid flame, deep ink); the
  gradient is reserved for labels at large-text size.
- **Gradient text** (`.az-text-gradient`): its scarlet stop is 4.23:1 on the
  page root, so it is display type only. Inline emphasis at body size uses
  `text-az-flame` (6.24:1).
- **Categorical badges** (tier pips, status tags on a saturated fill): use
  `text-az-surface-root`, not white — the blue/violet/amber swatches hold white
  at 3.68 / 4.23 / 2.15:1 and the deep ink at 5.19 / 4.53 / 8.93:1.
- **Sideways scroll on mobile**: usually a decorative absolute element (glow,
  blurred blob) extending past the viewport. Clip it on the x axis
  (`overflow-x-clip`) at the section that owns it.
- **Broken image**: the host is missing from `apps/web/next.config.js`
  `remotePatterns`; `node scripts/check-seed-image-hosts.mjs` catches the seeded
  ones earlier.

## Reports

CI uploads `visual-audit-report` with `guest/report.json` and
`signed-in/report.json` (every finding, excused or not, plus gated routes) and
full-page screenshots of any failing page under `.visual-audit-out/`. The console output groups findings by identity, so one CTA
pattern failing on 150 routes reads as one block, not 150 lines.
