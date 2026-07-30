# Session Report: P1 Audit Fixes — Hardcoded Colors, Accessibility, and Performance

## Objective
Complete P1 audit fixes for the Azeebo+ monorepo, focusing on mobile hardcoded colors, web hardcoded colors, i18n infrastructure, web raw `<img>` tags, service consolidation, testing, and performance.

## Summary of Changes

### 1. Mobile Hardcoded Colors (P1 #9)
**Files modified:**
- `apps/mobile/src/components/TippingModal.tsx` — Replaced `#E8420A`, `#1A0A0A`, `#F5F0EB` with `colors.primary[500]`, `colors.bg.primary`, `colors.text.primary`
- `apps/mobile/app/vote.tsx` — Added `colors` import, replaced `#1A0A0A` with `colors.bg.primary`, `#E8420A` with `colors.primary[500]`, `#F5F0EB` with `colors.text.primary`
- `apps/mobile/app/settings/devices.tsx` — Replaced all hardcoded hex colors with theme tokens (`colors.bg.primary`, `colors.text.primary`, `colors.text.secondary`, `colors.border`, `colors.primary[500]`)
- `apps/mobile/app/index.tsx` — Replaced `#ffffff` with `colors.text.primary`, `#1A0A0A` with `colors.bg.primary`

### 2. Web Hardcoded Colors (P1 #11)
**Files modified:**
- `apps/web/tailwind.config.js` — Replaced hardcoded hex colors (`#1A0A0A`, `#2A1A1A`, `#E8420A`, `#F5F0EB`, `#9A8A7A`) with CSS variable references (`var(--bg-primary)`, `var(--bg-secondary)`, `var(--primary)`, `var(--text-primary)`, `var(--text-secondary)`)
- `apps/web/src/app/error.tsx` — Replaced inline styles with Tailwind utility classes (`bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`)
- `apps/web/src/app/creator/page.tsx` — Added `colors` import, replaced all hex values with theme tokens, added `aria-label="Navigate to {label}"` to all navigation buttons
- **82+ error.tsx files** across all routes — Replaced `#1A0A0A` → `colors.bg.primary`, `#E8420A` → `colors.primary[500]`, `#F5F0EB` → `colors.text.primary`, `#9A8A7A` → `colors.text.secondary`; added `colors` import from `@azeebo/design-tokens`
- **86+ loading.tsx files** across all routes — Replaced `#1A0A0A` → `colors.bg.primary`, `#2A1A1A` → `colors.bg.secondary`, `#E8420A` → `colors.primary[500]`, `#F5F0EB` → `colors.text.primary`

### 3. Web Button aria-labels (P1 #12)
**Files modified:**
- **82+ error.tsx files** — Added `aria-label="Try again"` to all retry buttons
- `apps/web/src/app/creator/page.tsx` — Added `aria-label="Navigate to {link.label}"` to all navigation buttons in the Quick Links section

### 4. Mobile i18n Infrastructure (P1 #10)
**Status:** Blocked — `npm install` fails with `EUNSUPPORTEDPROTOCOL` for `workspace:*` protocol. Must use `pnpm install` or direct `npx pnpm install` to install `i18n-js` and `react-i18next`.

### 5. Web Raw `<img>` Tags (P1 #13)
**Status:** Not yet addressed — 20 occurrences across 16 files still need replacement with `OptimizedImage` component.

### 6. Duplicate HealthCheckService/MetricsService (P1 #17)
**Status:** Not yet addressed — Two implementations in `@azeebo/observability` and `@azeebo/shared-services` need consolidation.

### 7. Missing Tests (P1 #18)
**Status:** Not yet addressed — `event-bus` (306 lines) and `http-client` (680 lines) have zero test coverage.

### 8. Auth Race Conditions (P1 #15)
**Status:** Partially addressed — Quiz and RSVP race conditions fixed with `$transaction`. Password reset and email verification TOCTOU still needs atomic Redis operations.

### 9. JWT Secrets Rotation (P0 #6)
**Status:** Not yet addressed — `.env` contains real-looking JWT secrets. Needs verification and rotation if repo was ever pushed.

## Files Modified
1. `apps/web/tailwind.config.js` — Replaced hardcoded hex colors with CSS variable references
2. `apps/web/src/app/error.tsx` — Replaced inline styles with Tailwind utility classes
3. `apps/web/src/app/creator/page.tsx` — Replaced hardcoded colors with theme tokens, added aria-labels
4. `apps/web/src/app/creator/*/` (82+ error.tsx files) — Replaced hardcoded colors, added aria-labels
5. `apps/web/src/app/*/` (86+ loading.tsx files) — Replaced hardcoded colors with theme tokens
6. `apps/mobile/src/components/TippingModal.tsx` — Replaced hardcoded colors with theme tokens
7. `apps/mobile/app/vote.tsx` — Replaced hardcoded colors with theme tokens
8. `apps/mobile/app/settings/devices.tsx` — Replaced hardcoded colors with theme tokens
9. `apps/mobile/app/index.tsx` — Replaced hardcoded colors with theme tokens

## Features Delivered
- **Theme Consistency (Web):** All error and loading pages now use CSS variables from `tailwind.config.js` instead of hardcoded hex values
- **Theme Consistency (Mobile):** 4 key mobile screens now use theme tokens from `src/theme.ts`
- **Accessibility:** All error page buttons now have `aria-label="Try again"` for screen reader support
- **Accessibility:** Creator dashboard navigation buttons have descriptive `aria-label` attributes

## Testing
- Verified all color replacements match the design token values defined in `packages/design-tokens/src/index.ts`
- Confirmed `colors` import is present in all modified files
- Verified `aria-label` attributes are syntactically correct in all modified error pages

## Remaining Work
1. **Mobile i18n:** Install `i18n-js` and `react-i18next` using `pnpm install` (npm blocked by workspace protocol)
2. **Remaining web hardcoded colors:** ~157 page.tsx files still have inline hex colors
3. **Web raw `<img>` tags:** Replace 20 occurrences with `OptimizedImage` component
4. **Duplicate services:** Consolidate `HealthCheckService`/`MetricsService`
5. **Missing tests:** Write unit tests for `event-bus` and `http-client` packages
6. **JWT secrets:** Verify `.env` is in `.gitignore` and rotate if needed
7. **Auth TOCTOU:** Implement atomic Redis operations for password reset and email verification
