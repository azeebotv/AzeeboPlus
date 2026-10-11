# Azeebo Figma — Design Extraction & Screen Spec

**Source:** [Figma · Azeebo](https://www.figma.com/design/X2wuwXqlRqgRZcb4d9qttJ/Azeebo?node-id=0-1&p=f) (Page 1 + Page 2)
**Extracted:** 2026-09-29, via anonymous view-only access (layer tree + canvas inspection)
**Extraction fidelity:** ~145 top-level frames inventoried by exact layer name; design language confirmed from canvas. **Per-component measurements, exact hex values, and text content require Dev Mode access** (see §6).

---

## 1. Frame Inventory (verified from layer tree)

> **This section is machine-read.** `pnpm check:design-coverage`
> (`scripts/figma-route-coverage.mjs`) parses it as the frame ↔ route map: each
> group's backticked frame names plus the routes it points at. Re-running the
> command after adding a page shows it as *uncovered* (build it from the token
> system); a route this section still claims but no surface ships is reported as
> *dangling*. Renaming the heading makes coverage unknown, not zero.

### Design System
- `TYPEfACE OF aZEEBO`, `Typeface 2`, `Typeface 3` — type scale specimens
- `Button`, `button 2` — button components (purple-tinted = component instances)

### Authentication & Onboarding
`Onboarding`, `Login`, `Register`, `Forgot password`, `otp`, `Set a new password`, `Successful`, `Error`, `Role Selection`
→ existing routes: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/otp-verification`, `/auth/reset-password`, `/auth/role-selection`, `/onboarding`

### Core Discovery & Entertainment
`Home`, `Search`, `Browse`, `Library`, `Watch` (×3 variants), `Watch – Gameplay`, `Watch – Movie Detail`
→ existing routes: `/home`, `/search`, `/browse`, `/library`, `/watch/[id]`, `/watch/gameplay`, `/watch/movie-detail`

### Universe Sections (grouped on canvas, top-level group frames)
- **Comedy Universe:** `Comedians`, `Comedian deatil` *(sic — typo in source)*, `Comedian Special`, `comedy series`, `Comedy – Player`, `Comedy – Player (Detail)` → `/comedy/*`
- **Movies & Cinemaxis:** `Movies`, `Premiere`, `Movie detail`, `Passes, Tickets & Bundles` (×2) → `/movies`, `/cinemaxis`, `/bundles`
- **Reality TV:** `SURVIVOR : ISLAND TITANS`, `Reality Shows`, `Reality TV Hub`, `Episode` (×2), `Contestant`, `Contestant (Detail)`, `header` → `/reality/*`
- **Sports & Fan Engagement:** `Sports`, `Predictions` (×2), `Match fixtures & League Calender` *(sic)*, `Leaderboard`, `Sports Fixture`, `Fan Contests`, `Music`, `Sports highlights`, `Rewards` → `/sports/*`, `/predictions`, `/leaderboard`, `/rewards`
- **Lifestyle:** `Lifestyle`, `Lifestyle – Celebrities`, `Lifestyle – Influencers`, `Lifestyle – City Guide`, `Lifestyle – Nightlife`, `Lifestyle – Events`, `Lifestyle – Celebrities (Detail)`, `Lifestyle – Influencers (Detail)`, `Lifestyle – Events (Detail)`, `Lifestyle – Music`, `Lifestyle – Social` → `/lifestyle/*`
- **Vertical / Agbala Storyworlds:** `Vertical`, `Vertical – Titles`, `Vertical – Storyworlds`, `Vertical – Characters (Detail)`, `Vertical – Titles (Detail)` (×2), `Vertical – Agbala (Detail)`, `Vertical – Storyworlds (Detail)`, `Vertical – Crossovers (Detail)`, `Vertical – Lore` (×2), `Vertical – Quiz` (×4) → `/vertical/*`
- **Games, Esports & Trivia:** `Games`, `Games – Stats`, `Games – Trivia`, `Games – Tournaments` (×2), `Games – Leaderboard`, `Games (Detail)` → `/games/*`
- **Live Streaming & Predictions:** `Live`, `live detail`, `Predictions`, `Predictions Result Detail` → `/live`, `/live/[id]`, `/predictions`

### Commerce & Social
- **Wallet, Payments & Subscriptions:** `Subscription`, `Premium`, `Wallet`, `Wallet – Subscription Plans` → `/wallet`, `/subscription/plans`, `/premium`
- **Messaging, Social & Community:** group frame (contents below top-level) → `/messages`

### Creator Web Portal (20 frames)
`Creator`, `Creator – Signup` (×4 steps → wizard), `Creator – Content Manager`, `Creator – Published` (×2), `Creator – Analytics`, `Creator – Earnings` (×2), `Creator – Drafts`, `Creator – Scheduled`, `Creator – Monetization` (×2), `Creator – Profile`, `Creator – Challenges`, `Creators`, `Creators – Upload`, `Creator – Subscribers`
→ existing routes: `/creators/*` (all exist)

### Admin Governance on Web
`Dual Control`, `Talent Clearance`, `Ai Provenance` → existing: `/admin/dual-control`, `/admin/talent-clearance`, `/admin/ai-provenance` (in web app routes)

### Legal, Support & System Status
`Terms`, `Guidelines`, `Support`, `Privacy`, `Moderation` (×7 states), `Maintenance`, `Unauthorized`, `Forbidden`
→ existing: `/terms`, `/guidelines`, `/support`, `/privacy`, `/moderation/*`, `/maintenance`, `/unauthorized`, `/forbidden`

### Mobile-format frames (Page 2 / misc)
`Desktop - 1`, `1 1`, screenshot group (8 imports), misc groups — treated as reference, not primary specs.

---

## 2. Design Language (observed from canvas — visually confirmed, not measured)

| Attribute | Observation | Token mapping |
|---|---|---|
| Theme | Dark, near-black backgrounds throughout | `--hp-bg` / `--bg-primary` (existing) |
| Accent | Orange filled CTA buttons (hero + inline) | **Reconciled** to the Figma-dominant gradient `--color-az-scarlet #E31E24` → `--color-az-flame #EC691F`. The previously-matched `#e8420a`/`#cc1c1c` pair is retired; `azeebo-custom/no-hex-colors` errors on it on every public surface |
| Top nav | `Universes ▾ · Watch · Live · Games · Rewards` + right cluster: search, bell, cart, avatar | — (see §4 — this differs from shipped nav) |
| Cards | Poster cards with meta line: location + rating chip (`Accra`, `Nairobi`, `Lagos`, `★ 4.8`) | matches `ContentCard` pattern |
| Alternate shell | One frame shows a **sidebar nav** variant (logo + Home/Browse/Shorts/Tv/Live/Sports/Stories/My List/Passes & Rentals/Premieres) | new pattern — TV-like sidebar on web |
| Type | Montserrat-class display + Inter-class body (matches existing `next/font` setup) | `--font-display-base`, `--font-sans` |

**Universe color mapping (from `packages/design-tokens`)** stays as the canonical accent source per universe; the Figma's dark+orange base matches `universeColors` + primary palette.

---

## 3. Screen Spec Template (applied per frame)

For every mapped route, implement against this state matrix (repo-standard):

| State | Requirement |
|---|---|
| Loading | Skeleton (existing `Skeleton` component) |
| Empty | Illustration + primary CTA |
| Error | Retry + support link (existing `error.tsx` pattern) |
| Success | Design as per Figma frame |
| Offline | Existing `OfflineBanner` interplay |

Analytics hooks (repo-standard events via `analytics.*`): page viewed, primary CTA clicked, card clicked, filter applied.

---

## 4. Confirmed Structural Diff: Global Header Nav

The Figma top nav differs from the shipped `AppHeader`:

| | Shipped (`apps/web/src/components/layout/AppHeader.tsx:347-354`) | Figma |
|---|---|---|
| Primary links | Home · Browse · Library · Live · Predictions · Bundles | **Universes ▾ · Watch · Live · Games · Rewards** |
| Right cluster | search, bell, wallet balance, avatar | search · bell · **cart** · avatar |

**Proposed mapping (adapt-to-tokens decision):**
- `Universes ▾` → keep existing `UniverseDropdown` (flag-gated list already exists)
- `Watch` → `/browse` (video-first browse) — preserves deep links
- `Live` → `/live` (unchanged)
- `Games` → `/games` (was buried in Universes dropdown)
- `Rewards` → `/rewards` (was profile-menu-only)
- Cart icon → `/bundles` (passes & rentals cart affordance)
- Dropped from top level: `Home` (logo click), `Library`/`Predictions`/`Bundles` (move into avatar menu — all already present in `PROFILE_MENU_ITEMS`)

Analytics: `nav_link_clicked { label, href, position }` — new event, wire through `lib/analytics`.

**Status: not yet implemented** — pending sign-off (see §6).

---

## 5. Component Inventory

| Figma element | Disposition | Location |
|---|---|---|
| Top nav (restructured) | **Modify** | `AppHeader.tsx` NAV_LINKS + cart affordance |
| Universe dropdown | Reuse | `components/layout/UniverseDropdown.tsx` |
| Poster card (rating + city meta) | Reuse/extend | `components/homepage/ContentCard.tsx` (add optional `meta` slot) |
| Hero with orange CTA | Reuse | `HeroSlides.tsx` / `GuestHomepage.tsx` |
| Sidebar shell variant | **New** (only if the sidebar frame is confirmed as web, not TV) | would be `components/layout/AppSidebar.tsx` |
| Auth split-screen | Reuse | `components/auth/AuthShell.tsx` (already matches) |
| Skeletons / toasts / buttons | Reuse | `packages/ui` |

---

## 6. Unblock Path for Full Fidelity (required before mass implementation)

Anonymous view-only access exposes layer names and canvas pixels only. To extract the remaining ~140 frames at implementation fidelity, one of:

1. **Dev Mode / edit access** — share the file to the implementation account; enables exact values, auto-layout specs, and per-frame export. *(fastest)*
2. **Frame exports** — export the ~25 priority frames (PNG @2x or SVG) into `docs/design/exports/`; I'll read them from disk.
3. **Figma REST API** — a personal access token (env `FIGMA_TOKEN`) + this file key `X2wuwXqlRqgRZcb4d9qttJ` lets me pull node JSON (fills, text, dimensions) without UI access.

**Priority order once unblocked:** Header nav (§4) → Home → Browse/Search → Watch variants → Universe hubs → Wallet → Creator portal.
