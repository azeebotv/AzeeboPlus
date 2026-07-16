# Azeebo+ Frontend Issues Report

**Date:** 2026-07-14
**Scope:** Client-side code, UI components, frontend assets, client-side configuration, and frontend dependencies — `apps/web` (Next.js 15 App Router), `apps/mobile` (Expo / React Native), and shared frontend packages (`packages/ui`, `packages/design-tokens`, `packages/analytics-sdk`).
**Method:** Static analysis, repo-wide pattern matching, and manual source review of pages/screens, components, hooks, contexts, stores, API clients, design tokens, `package.json`, and build configs. Cross-cutting findings were spot-verified against source.

Severity legend: **Critical** (broken core flow / security / financial), **High** (major functional or convention breach), **Medium** (correctness / maintainability), **Low** (cosmetic / minor).

Conventions referenced from `CLAUDE.md`: TypeScript only (no JS), no `any`; reuse `packages/ui` + `packages/design-tokens`; Zustand primary state + Context for cross-cutting concerns; every screen must have Loading/Empty/Error/Success/Unauthenticated/Locked states; never hardcode prices; never rely on client-side premium access checks; use `packages/analytics-sdk` (snake_case + universe prefix); accessibility (screen readers, ARIA/labels, WCAG AA contrast, reduced motion, alt text, 44x44px touch targets).

---

## Table of Contents

1. [Dead Code](#1-dead-code)
2. [Unused Code](#2-unused-code)
3. [Duplicate Code](#3-duplicate-code)
4. [Placeholder Code](#4-placeholder-code)
5. [Stub Implementations](#5-stub-implementations)
6. [TODO / FIXME / HACK Annotations](#6-todo--fixme--hack-annotations)
7. [Naming Inconsistencies](#7-naming-inconsistencies)
8. [Logic Inconsistencies](#8-logic-inconsistencies)
9. [Style Inconsistencies](#9-style-inconsistencies)
10. [Architectural Violations](#10-architectural-violations)
11. [Security Issues](#11-security-issues)
12. [Performance Bottlenecks](#12-performance-bottlenecks)
13. [API / Data Contract Inconsistencies](#13-api--data-contract-inconsistencies)
14. [UI Inconsistencies & Accessibility Gaps](#14-ui-inconsistencies--accessibility-gaps)
15. [Test Coverage Gaps](#15-test-coverage-gaps)
16. [Documentation Mismatches](#16-documentation-mismatches)
17. [Dependency Issues](#17-dependency-issues)
18. [Configuration Drift](#18-configuration-drift)
19. [Deprecated / Legacy Code](#19-deprecated--legacy-code)
20. [Summary by Severity](#20-summary-by-severity)

---

## 1. Dead Code

### 1.1 Unused `AnimationDirection` type export (packages/ui)
| Field | Detail |
|-------|--------|
| **File** | `packages/ui/src/Motion.tsx:16` |
| **Severity** | Low |

**Problem:** Exported type `AnimationDirection = 'in' | 'out'` is never referenced anywhere.

**Fix:** Remove the unused type.

### 1.2 `initializeCertificatePinning()` defined but never called (mobile)
| Field | Detail |
|-------|--------|
| **File** | `apps/mobile/src/utils/certificatePinning.ts:275` (defined); not invoked in `apps/mobile/app/_layout.tsx:13-41` |
| **Severity** | High (security-relevant, see [11.1](#111-certificate-pinning-never-initialized-mobile)) |

**Problem:** The init routine that verifies the native pinning library is dead code — never wired into app startup.

**Fix:** Call `initializeCertificatePinning()` in the root layout during bootstrap.

---

## 2. Unused Code

### 2.1 Unused re-export in `useDatabase.ts` (web)
| Field | Detail |
|-------|--------|
| **File** | `apps/web/src/hooks/useDatabase.ts:1-7` |
| **Severity** | Low |

**Problem:** Re-exports `useUniverses` but consumers always import `useUniverses` directly; the re-export is never used.

**Fix:** Remove the re-export or standardize imports through it.

### 2.2 `sharp` unused runtime dependency (mobile)
| Field | Detail |
|-------|--------|
| **File** | `apps/mobile/package.json:52` |
| **Severity** | Medium |

**Problem:** `sharp` (^0.35.1) is a Node.js native image lib that cannot run in the RN runtime and is not imported anywhere in `src/`/`app/`.

**Fix:** Remove `sharp` from mobile dependencies (build tooling only).

---

## 3. Duplicate Code

### 3.1 Four divergent `ErrorState` implementations (packages/ui)
| Field | Detail |
|-------|--------|
| **Files** | `packages/ui/src/ErrorState.tsx:1-26`, `packages/ui/src/web-components.tsx:607-650`, `packages/ui/src/components.tsx:53-83`, `packages/ui/src/mobile-state-handlers.tsx:81-102` |
| **Severity** | High |

**Problem:** Four `ErrorState` components with incompatible prop contracts (`onRetry` vs `onButtonPress` vs `message` vs `description`). Barrel files select different ones per entry point (`web-index.ts:15` exports `ErrorState.tsx`; `index.ts` re-exports the `web-components` version), so consumers get different behavior by import path.

**Fix:** Consolidate to one component per platform. Standardize on `onRetry` with a deprecation alias; remove `ErrorState.tsx` and repoint `web-index.ts`.

### 3.2 Zustand stores duplicated verbatim (packages/ui)
| Field | Detail |
|-------|--------|
| **Files** | `packages/ui/src/state-handlers.tsx:1-80`, `packages/ui/src/mobile-state-handlers.tsx` (store block) |
| **Severity** | Medium (High for the mobile crash — see [8.3](#83-localstorage-used-in-react-native-store)) |

**Problem:** `useThemeStore`/`useUIStore`/`usePreferencesStore` are duplicated across files.

**Fix:** Extract stores into a single shared module.

### 3.3 State components duplicated across files (packages/ui)
| Field | Detail |
|-------|--------|
| **Files** | `packages/ui/src/components.tsx:1-272` vs `packages/ui/src/mobile-state-handlers.tsx` |
| **Severity** | Medium |

**Problem:** `LoadingState`, `EmptyState`, `SuccessState` overlap with different prop shapes (`onButtonPress`/`description`/`buttonText` vs `onAction`/`message`/`actionLabel`/`onRetry`).

**Fix:** Pick one prop vocabulary and one file; re-export.

### 3.4 Duplicate test suites (mobile)
| Field | Detail |
|-------|--------|
| **Files** | `apps/mobile/src/api/auth.api.spec.ts` vs `apps/mobile/src/api/__tests__/auth.test.ts`; `wallet.api.spec.ts` vs `__tests__/wallet.test.ts` |
| **Severity** | Medium |

**Problem:** Two parallel suites test the same modules with duplicated mocks/assertions. `__tests__/auth.test.ts:55` asserts `accessToken` (camelCase) while the app uses `access_token` (snake_case), so the duplicate tests a shape the app never produces.

**Fix:** Consolidate to one suite per module with consistent naming; fix or remove the mismatched token assertion.

### 3.5 Duplicate creator route trees (web)
| Field | Detail |
|-------|--------|
| **Files** | `apps/web/src/app/creator/*` and `apps/web/src/app/creators/*` |
| **Severity** | Medium |

**Problem:** Two parallel creator route namespaces create ambiguous navigation and duplicated pages.

**Fix:** Consolidate to a single canonical route prefix and redirect the other.

---

## 4. Placeholder Code

### 4.1 Hardcoded fallback vote package prices (web)
| Field | Detail |
|-------|--------|
| **File** | `apps/web/src/app/reality/super-vote/page.tsx:60-95` |
| **Severity** | Critical |

**Problem:** On API failure, the screen injects hardcoded placeholder vote packages with prices (500, 1000, 1800, 3000 NGN), violating "never hardcode prices" and presenting fake pricing to users.

**Fix:** On API failure, show an error state — do not render fabricated pricing.

### 4.2 Missing referenced static assets (web)
| Field | Detail |
|-------|--------|
| **Files** | `apps/web/src/app/layout.tsx:44` (`/og-image.png`), `apps/web/src/app/layout.tsx:71` (`/apple-touch-icon.png`) |
| **Severity** | Low |

**Problem:** Metadata references image assets that don't exist in `public/`.

**Fix:** Add the assets or use dynamic OG image generation and remove dead references.

---

## 5. Stub Implementations

### 5.1 `AnimatePresence` is a non-functional stub (packages/ui)
| Field | Detail |
|-------|--------|
| **File** | `packages/ui/src/Motion.tsx:86-91` |
| **Severity** | High |

**Problem:** `AnimatePresence` renders `<div className="animate-presence-*">` with no exit-animation logic and no matching CSS class in `animations.ts`. It provides none of the presence/unmount behavior its name implies.

**Fix:** Implement real mount/unmount transition tracking, or remove and document the limitation.

### 5.2 Local analytics stub instead of shared SDK (web)
| Field | Detail |
|-------|--------|
| **File** | `apps/web/src/lib/analytics.ts` |
| **Severity** | High (see [10.2](#102-local-analytics-implementation-instead-of-shared-sdk-web)) |

**Problem:** A local ad-hoc analytics class stands in for the mandated `packages/analytics-sdk`.

**Fix:** Replace with `@azeebo/analytics-sdk`.

---

## 6. TODO / FIXME / HACK Annotations

Repo-wide scan across `apps/` and frontend `packages/` found 320+ annotation occurrences across 80+ files. High-signal locations:

| File | Notes |
|------|-------|
| `packages/ui/src/Input.tsx` | 5 occurrences (unfinished states/props) |
| `packages/ui/src/Form.stories.tsx` | 14 occurrences |
| `packages/ui/src/Input.stories.tsx` | 13 occurrences |
| `apps/mobile/app/(creator)/monetization.tsx` | 12 occurrences |
| `apps/web/src/app/admin/content/page.tsx` | 9 occurrences |
| `apps/mobile/app/(tabs)/profile.tsx`, `wallet.tsx`, `profile/edit.tsx` | 8 each |
| `apps/mobile/app/creators/signup.tsx` | 8 occurrences |
| `apps/web/src/app/auth/profile-setup/page.tsx` | 7 occurrences |

**Severity:** Medium (aggregate)
**Fix:** Triage each annotation into a tracked ticket; remove stale markers. Prioritize `monetization.tsx` and `admin/content/page.tsx` (highest density in revenue/admin flows).

---

## 7. Naming Inconsistencies

### 7.1 Mixed token field casing (mobile)
| Field | Detail |
|-------|--------|
| **File** | `apps/mobile/src/api/` auth layer uses `access_token`/`refresh_token` (snake) while some tests/utilities use camelCase (`accessToken`) — e.g. `apps/mobile/src/api/__tests__/auth.test.ts:55` |
| **Severity** | Medium |

**Fix:** Standardize the token field naming end-to-end and update tests.

### 7.2 Inconsistent inline date formatting (web)
| Field | Detail |
|-------|--------|
| **Files** | multiple pages using `toLocaleDateString()` with differing formats |
| **Severity** | Low |

**Fix:** Introduce a shared `formatDate()` utility.

---

## 8. Logic Inconsistencies

### 8.1 API path double-prefix bug (mobile)
| Field | Detail |
|-------|--------|
| **Files** | `apps/mobile/src/api/client.ts` (adds `/api/v1`) + `pricingApi` endpoints that already include `/api/v1` |
| **Severity** | Critical |

**Problem:** `apiClient` prefixes request paths with `/api/v1`; pricing endpoints already include `/api/v1`, producing `/api/v1/api/v1/...` → 404. Pricing calls then silently fall back to hardcoded prices.

**Fix:** Remove the duplicate prefix from either the client base URL or the pricing endpoint definitions; add a test asserting the resolved URL.

### 8.2 Currency mismatch on payment screen (mobile)
| Field | Detail |
|-------|--------|
| **File** | `apps/mobile/app/(tabs)/payment.tsx` sends `currency: 'USD'` while the app displays/uses `NGN` everywhere |
| **Severity** | Critical |

**Problem:** Payment initiation sends `USD` while UI and wallet use `NGN` — a financial correctness bug.

**Fix:** Send `NGN` (or the server-authoritative currency); never hardcode currency client-side.

### 8.3 `localStorage` used in React Native store (packages/ui)
| Field | Detail |
|-------|--------|
| **File** | `packages/ui/src/mobile-state-handlers.tsx:25` (`createJSONStorage(() => localStorage)`) |
| **Severity** | High |

**Problem:** `localStorage` does not exist in React Native; this throws at runtime on mobile.

**Fix:** Use AsyncStorage or MMKV via `createJSONStorage`.

---

## 9. Style Inconsistencies

### 9.1 Hardcoded hex brand colors bypassing tokens (packages/ui)
| Field | Detail |
|-------|--------|
| **File** | `packages/ui/src/ErrorState.tsx:19` (`bg-[#E8420A] hover:bg-[#C83A08]`) |
| **Severity** | High |

**Problem:** Hardcoded hex values bypass design tokens and are not even in the palette (primary is `#8b5cf6`), so the component visually diverges from the design system.

**Fix:** Use token classes (`bg-primary-500 hover:bg-primary-600` or `bg-error-*`).

### 9.2 References to non-existent Tailwind tokens (packages/ui)
| Field | Detail |
|-------|--------|
| **Files** | `packages/ui/src/Switch.tsx:35` (`bg-primary`, `bg-gray-300`), `packages/ui/src/web-components.tsx:669-673` (`bg-neutral-100 text-neutral-800`) |
| **Severity** | High |

**Problem:** `bg-primary` (no scale), `bg-gray-300`, and the `neutral` scale don't exist in design-tokens, so `Switch` and `Chip` render with missing/incorrect backgrounds and diverge from the dark-theme `500/20 + 400` pattern used elsewhere (e.g. Badge `web-components.tsx:348-355`).

**Fix:** Use defined tokens (`bg-primary-500`, a defined neutral like `bg-dark-300`); align Chip variants with the Badge pattern.

### 9.3 Native `alert()` instead of ToastProvider (web)
| Field | Detail |
|-------|--------|
| **Files** | `apps/web/src/app/admin/settings/page.tsx`, `reality/super-vote/page.tsx`, `wallet/withdraw/page.tsx`, `wallet/add-funds/page.tsx`, `reality/episode/page.tsx`, `rewards/page.tsx`, `reality/contestant/page.tsx` |
| **Severity** | Medium |

**Problem:** Seven pages use browser-native `alert()` instead of the design-system Toast/feedback pattern — inconsistent UX including in wallet flows.

**Fix:** Replace `alert()` with the shared ToastProvider/feedback component.

---

## 10. Architectural Violations

### 10.1 Hardcoded prices in client code (web + mobile)
| Field | Detail |
|-------|--------|
| **Files** | `apps/web/src/app/reality/super-vote/page.tsx:67,75,83,91`; mobile deprecated pricing exports used by screens |
| **Severity** | Critical |

**Problem:** Violates the "never hardcode prices" rule; users can see fabricated prices when the API fails.

**Fix:** Always fetch prices from backend; render error states on failure.

### 10.2 Local analytics implementation instead of shared SDK (web)
| Field | Detail |
|-------|--------|
| **File** | `apps/web/src/lib/analytics.ts`; `@azeebo/analytics-sdk` not in `apps/web/package.json` |
| **Severity** | High |

**Problem:** CLAUDE.md mandates `packages/analytics-sdk`; web uses a local class instead, and mobile never imports the SDK at all.

**Fix:** Add `"@azeebo/analytics-sdk": "workspace:*"`, replace local imports, delete `src/lib/analytics.ts`, and normalize event names to snake_case + universe prefix.

### 10.3 Standalone UI components bypassing packages/ui (web)
| Field | Detail |
|-------|--------|
| **Files** | `apps/web/src/components/OptimizedImage.tsx`, `Skeleton.tsx`, `ConfirmDialog.tsx` |
| **Severity** | High |

**Problem:** App-local UI primitives duplicate what belongs in the shared `packages/ui`, violating the component-reuse policy.

**Fix:** Move reusable primitives into `packages/ui` and import from there.

### 10.4 Client-side premium access checks (web)
| Field | Detail |
|-------|--------|
| **Files** | premium content gating in `apps/web/src/app/watch/[id]/*` (client checks) |
| **Severity** | High |

**Problem:** Access to premium content is validated client-side without authoritative server validation, which can be bypassed.

**Fix:** Enforce premium access server-side; treat client checks as UX-only.

### 10.5 State management deviates from Zustand convention (web)
| Field | Detail |
|-------|--------|
| **File** | no `apps/web/src/store/` exists; all state in React Context |
| **Severity** | Medium |

**Problem:** CLAUDE.md names Zustand the primary state manager; the web app has no Zustand stores. Either the code or the doc is out of sync.

**Fix:** Introduce Zustand stores for feature state, or reconcile CLAUDE.md to the actual Context-based approach.

---

## 11. Security Issues

### 11.1 Certificate pinning never initialized (mobile)
| Field | Detail |
|-------|--------|
| **Files** | `apps/mobile/src/utils/certificatePinning.ts:275` (defined, never called); `apps/mobile/app/_layout.tsx:13-41` |
| **Severity** | High |

**Problem:** Pinning defaults to enabled in production but the init routine that verifies the native library is never invoked, and TLS-level pinning is a no-op without a native library — giving a false sense of MITM protection.

**Fix:** Call `initializeCertificatePinning()` at startup and verify a real native pinning implementation is present; fail closed if not.

### 11.2 Localhost API base URL committed for production builds (mobile)
| Field | Detail |
|-------|--------|
| **Files** | `apps/mobile/app.json:61` (`http://localhost:3013`), `apps/mobile/src/api/client.ts:46-53` |
| **Severity** | High |

**Problem:** `extra.apiBaseURL` is a cleartext localhost URL read before the `https://api.azeeboplus.com` default; a prod build missing `EXPO_PUBLIC_API_BASE_URL` targets localhost over HTTP.

**Fix:** Remove the committed localhost value; inject per-profile URLs via `eas.json`.

### 11.3 Client-side premium gating (web)
See [10.4](#104-client-side-premium-access-checks-web) — Severity High.

---

## 12. Performance Bottlenecks

### 12.1 Dynamic Tailwind class construction won't survive purge (packages/ui)
| Field | Detail |
|-------|--------|
| **File** | `packages/ui` components building class names dynamically |
| **Severity** | Medium |

**Problem:** Runtime-constructed Tailwind classes can be purged from the production build, causing missing styles (correctness) and forcing safelist bloat (perf/size).

**Fix:** Use complete static class strings or a safelist; avoid string interpolation of class fragments.

### 12.2 Reanimated worklets plugin disabled (mobile)
| Field | Detail |
|-------|--------|
| **File** | `apps/mobile/babel.config.js:5-8` |
| **Severity** | High |

**Problem:** Empty `plugins` array disables the reanimated/worklets plugin "to fix prebuild error," but the app uses `react-native-reanimated` v4 worklets (`useAnimatedStyle`, `withSpring`) extensively; worklets typically fail at runtime without the plugin.

**Fix:** Verify whether `babel-preset-expo` bundles the worklets plugin for this Expo version; if not, re-add `react-native-worklets/plugin` last and confirm animations run on device.

---

## 13. API / Data Contract Inconsistencies

### 13.1 Pricing endpoint contract mismatch (mobile)
See [8.1](#81-api-path-double-prefix-bug-mobile) — Critical.

### 13.2 Token field shape mismatch across layers (mobile)
See [7.1](#71-mixed-token-field-casing-mobile) — Medium.

---

## 14. UI Inconsistencies & Accessibility Gaps

### 14.1 Broken/inconsistent component styling (packages/ui)
| Field | Detail |
|-------|--------|
| **Files** | `packages/ui/src/Switch.tsx:35`, `packages/ui/src/web-components.tsx:669-673`, `packages/ui/src/ErrorState.tsx:19` |
| **Severity** | High |

**Problem:** Undefined tokens and hardcoded hex produce visually broken/off-brand components (see [9.1](#91-hardcoded-hex-brand-colors-bypassing-tokens-packagesui)–[9.2](#92-references-to-non-existent-tailwind-tokens-packagesui)).

**Fix:** Standardize on defined design tokens across all component variants.

### 14.2 Missing required screen states
| Field | Detail |
|-------|--------|
| **Files** | Multiple web/mobile screens lack the mandated Loading/Empty/Error/Unauthenticated/Locked states |
| **Severity** | Medium |

**Problem:** CLAUDE.md requires all six screen states; several screens implement only Success/Loading.

**Fix:** Add the missing states using shared state components.

### 14.3 Accessibility gaps
| Field | Detail |
|-------|--------|
| **Files** | Missing `accessibilityLabel`/`role` on interactive mobile elements; missing ARIA/alt text on web; dynamic pages with static SEO/meta (`apps/web/src/app/watch/[id]/page.tsx`, `apps/web/src/app/reality/episode/page.tsx`) |
| **Severity** | Medium |

**Problem:** Interactive elements lack accessible labels; some touch targets fall below 44x44px; no explicit reduced-motion handling in several animated components.

**Fix:** Add accessibility labels/roles, ensure 44x44px targets, honor reduced-motion, and generate content-derived meta for dynamic pages.

---

## 15. Test Coverage Gaps

### 15.1 Jest cannot execute the mobile unit tests
| Field | Detail |
|-------|--------|
| **File** | `apps/mobile/jest.config.js:3,4,11` |
| **Severity** | High |

**Problem:** `testRegex: ".*\\.(spec|e2e)\\.ts$"` with `testEnvironment: node` never picks up `__tests__/*.test.ts`, cannot run `.tsx` component tests, and pulls Detox e2e specs into the plain jest run.

**Fix:** Split into a unit config (matching `*.spec.ts` + `*.test.ts` under `src`, jsdom/`jest-expo` env) and a separate Detox config; exclude `e2e` from the unit run.

### 15.2 Empty `test/` directory (mobile)
| Field | Detail |
|-------|--------|
| **File** | `apps/mobile/test/.gitkeep` |
| **Severity** | Low |

**Problem:** Intended test location is empty; jest roots point to `src`/`e2e`.

**Fix:** Use or remove the directory.

### 15.3 Untested critical client logic
| Field | Detail |
|-------|--------|
| **Files** | AuthContext session/refresh, pricing fallback, video player state (mobile); most web pages lack tests |
| **Severity** | Medium |

**Fix:** Add unit tests for auth/session, pricing fallback, and player state once the jest env supports `.tsx`.

---

## 16. Documentation Mismatches

### 16.1 analytics-sdk README event catalog out of date
| Field | Detail |
|-------|--------|
| **File** | `packages/analytics-sdk/README.md:25-36` |
| **Severity** | Low |

**Problem:** README lists ~9 events but the SDK emits 30+, and omits the `ConsentCategory` model central to SDK behavior.

**Fix:** Regenerate the event catalog and document consent categories.

### 16.2 State-management docs vs implementation (web)
See [10.5](#105-state-management-deviates-from-zustand-convention-web) — reconcile CLAUDE.md with the actual Context-based approach.

---

## 17. Dependency Issues

### 17.1 Implausible/hallucinated version pins
| Field | Detail |
|-------|--------|
| **File** | `packages/analytics-sdk/package.json:26` (`"eslint": "^10.5.0"`), plus an unverified `lucide` version in `packages/ui` |
| **Severity** | High |

**Problem:** ESLint's real major line is 8/9; `^10.5.0` will fail to resolve. A pattern of unverified version pins appears in multiple frontend packages.

**Fix:** Pin all dev/runtime deps to real published versions and reconcile the toolchain.

### 17.2 Unused / mis-scoped mobile dependencies
| Field | Detail |
|-------|--------|
| **Files** | `apps/mobile/package.json:52` (`sharp`), `:43,51` (`react-dom`, `react-native-web` if web isn't shipped) |
| **Severity** | Medium |

**Fix:** Remove `sharp`; confirm whether web is a target before keeping `react-dom`/`react-native-web`.

### 17.3 Inconsistent version pinning (mobile)
| Field | Detail |
|-------|--------|
| **File** | `apps/mobile/package.json:30-39` |
| **Severity** | Low |

**Problem:** Most Expo deps use `~` but `expo-local-authentication`, `expo-secure-store`, `expo-device`, `@react-navigation/*`, `@tanstack/react-query` use `^` ranges.

**Fix:** Standardize on Expo's recommended pins and pin the rest to exact versions.

---

## 18. Configuration Drift

### 18.1 Committed localhost API URL (mobile)
See [11.2](#112-localhost-api-base-url-committed-for-production-builds-mobile) — High.

### 18.2 Babel worklets plugin disabled (mobile)
See [12.2](#122-reanimated-worklets-plugin-disabled-mobile) — High.

### 18.3 Missing static assets referenced by config (web)
See [4.2](#42-missing-referenced-static-assets-web) — Low.

---

## 19. Deprecated / Legacy Code

### 19.1 Deprecated design-token aliases still consumed (packages/ui)
| Field | Detail |
|-------|--------|
| **Files** | `packages/ui/src/mobile-state-handlers.tsx:10-15` imports `spacingNative`/`fontSizeNative`/`fontWeightNative` marked `@deprecated` in `packages/design-tokens/src/index.ts:165-166,197-198` |
| **Severity** | Medium |

**Problem:** Live mobile code imports deprecated token aliases — either the deprecation is premature or consumers use legacy APIs.

**Fix:** Migrate to `spacing`/`typography.fontSizes` and remove the deprecated aliases, or undo the deprecation if these are the intended RN API.

---

## 20. Summary by Severity

| Severity | Count | Representative Issues |
|----------|-------|-----------------------|
| **Critical** | 4 | Hardcoded fallback prices (web 4.1/10.1), API path double-prefix (mobile 8.1), currency mismatch USD vs NGN (mobile 8.2) |
| **High** | 12 | Cert pinning never initialized (11.1), localhost prod URL (11.2), local analytics vs SDK (10.2), standalone UI components (10.3), client-side premium gating (10.4/11.3), four ErrorState variants (3.1), AnimatePresence stub (5.1), undefined-token components (9.1/9.2/14.1), Babel worklets disabled (12.2), hallucinated eslint pin (17.1), jest can't run unit tests (15.1) |
| **Medium** | 15 | Duplicate creator routes (3.5), duplicate test suites (3.4), native alert() (9.3), Zustand deviation (10.5), missing screen states (14.2), a11y gaps (14.3), deprecated token aliases (19.1), unused/mis-scoped deps (17.2), token casing mismatch (7.1), untested client logic (15.3), TODO density (6) |
| **Low** | 8 | Unused type export (1.1), unused re-export (2.1), missing assets (4.2), inline date formatting (7.2), README event catalog (16.1), empty test dir (15.2), version pin inconsistency (17.3) |

### Recommended Priority Order
1. **Critical financial/correctness (mobile):** Fix API path double-prefix (8.1), currency mismatch (8.2). Remove hardcoded fallback prices (web 4.1/10.1).
2. **High security:** Initialize + verify certificate pinning (11.1); remove committed localhost prod URL (11.2); enforce server-side premium gating (10.4).
3. **High build/runtime:** Re-enable Babel worklets or verify preset (12.2); fix jest config so unit tests run (15.1); fix hallucinated dependency versions (17.1).
4. **High convention/consistency:** Adopt shared analytics-sdk (10.2); consolidate ErrorState + state components (3.1/3.3); replace undefined design tokens (9.1/9.2); move standalone UI into packages/ui (10.3).
5. **Medium/Low cleanup:** Deduplicate routes/tests, replace `alert()`, remove unused deps, fix a11y gaps and docs.

---

*Report generated by systematic analysis of the Azeebo+ frontend codebase (`apps/web`, `apps/mobile`, `packages/ui`, `packages/design-tokens`, `packages/analytics-sdk`). All paths are relative to the repository root; line numbers reference the codebase state at time of audit.*
