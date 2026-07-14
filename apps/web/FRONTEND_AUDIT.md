# Azeebo+ Web Frontend Code Audit

**Date:** 2026-07-14
**Scope:** `apps/web/src/` — Full frontend codebase (Next.js 15, React 19, Tailwind CSS v4, TypeScript)

---

## Table of Contents

1. [Unfinished Features & Dead Code](#1-unfinished-features--dead-code)
2. [Technical Debt](#2-technical-debt)
3. [SEO Issues](#3-seo-issues)
4. [Performance](#4-performance)
5. [Accessibility Gaps](#5-accessibility-gaps)
6. [UI/UX Defects](#6-uiux-defects)

---

## 1. Unfinished Features & Dead Code

### 1.1 — Placeholder "Vote Now" button has no handler
**File:** `src/app/reality/page.tsx:140-151`
**Impact:** Users click "Vote Now" with no action, creating confusion.

**Fix:**
```tsx
<Link href="/predictions">
  <motion.button type="button" className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all" style={{ border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    Vote Now
  </motion.button>
</Link>
```

---

### 1.2 — Placeholder "Vote Now" button on leaderboard has no handler
**File:** `src/app/reality/page.tsx:321-328`
**Impact:** Same as above — dead CTA at bottom of leaderboard.

**Fix:** Wrap in `<Link href="/predictions">`.

---

### 1.3 — Placeholder "Add to Library" button has no handler
**File:** `src/app/movies/page.tsx:139-150`
**Impact:** Users click "Add to Library" with no action.

**Fix:** Connect to library service or remove until implemented.

---

### 1.4 — Placeholder "Leaderboard" button on games page has no handler
**File:** `src/app/games/page.tsx:134-145`
**Impact:** Dead CTA.

**Fix:** Link to `/rankings` or remove.

---

### 1.5 — Placeholder "Make Prediction" button has no handler
**File:** `src/app/sports/page.tsx:85-91`
**Impact:** Dead CTA.

**Fix:** Link to `/predictions` or remove.

---

### 1.6 — Placeholder "Character Lore" button has no handler
**File:** `src/app/vertical/page.tsx:92-101`
**Impact:** Dead CTA.

**Fix:** Link to character page or remove.

---

### 1.7 — Placeholder "Get Tickets" and "View Details" buttons have no handlers
**File:** `src/app/lifestyle/page.tsx:75-91` and `src/app/lifestyle/page.tsx:152-153`
**Impact:** Two dead CTAs on lifestyle page.

**Fix:** Connect to event/ticketing service or remove.

---

### 1.8 — Placeholder "Browse Comedy" and "Submit Your Clip" buttons have no handlers
**File:** `src/app/comedy/page.tsx:68-84`
**Impact:** Hero CTAs are non-functional.

**Fix:** "Browse Comedy" → `/browse?category=comedy`. "Submit Your Clip" → creator upload page.

---

### 1.9 — Placeholder "Start Watching" button has no handler on vertical page
**File:** `src/app/vertical/page.tsx:83-91`
**Impact:** Dead CTA on vertical series hero.

**Fix:** Wrap in `<Link>` to `/watch/${series[0].id}`.

---

### 1.10 — `StaggerGrid` accepts `columns` prop but ignores it
**File:** `src/components/motion/StaggerGrid.tsx:11,18`
**Impact:** Developers expect grid columns to be configurable; prop is silently ignored.

**Fix:** Remove `columns` from interface, or implement column-based layout.

---

### 1.11 — `SectionHeader` accepts unused `action` prop
**File:** `src/components/homepage/SectionHeader.tsx` (identified during prior audit)
**Impact:** Dead prop in interface.

**Fix:** Remove from interface or implement the action button.

---

### 1.12 — Resend OTP does nothing server-side
**File:** `src/app/auth/otp-verification/page.tsx:86-91`
**Impact:** `handleResend` resets UI but never calls an API to resend the OTP.

**Fix:** Add `apiFetch('/v1/auth/resend-otp', { method: 'POST' })` call.

---

## 2. Technical Debt

### 2.1 — Raw `<img>` tags instead of `OptimizedImage`
**File:** `src/app/auth/profile-setup/page.tsx:241`
**File:** `src/app/creator/content-manager/page.tsx:242,268`
**File:** `src/app/games/page.tsx:70,185`
**File:** `src/app/comedy/page.tsx:132`
**File:** `src/app/lifestyle/page.tsx:59,134`
**File:** `src/app/sports/page.tsx:133`
**File:** `src/app/vertical/page.tsx:59,142`
**File:** `src/app/creators/page.tsx:131`
**File:** `src/app/browse/page.tsx:555`
**File:** `src/app/search/page.tsx:505`
**Impact:** No lazy loading, no blur placeholder, no responsive srcsets, potential CLS. Project has `OptimizedImage` component but these pages bypass it.

**Fix:** Replace all `<img>` with `<OptimizedImage>` from `@/components/OptimizedImage`.

---

### 2.2 — `any` type in production code
**File:** `src/components/homepage/AuthenticatedHomepage.tsx:27`
```typescript
function extractContentItem(r: any): ContentItem {
```
**Impact:** Defeats TypeScript safety; recommendation API responses may have nested content structure.

**Fix:** Define a proper `RecommendationResponse` interface.

---

### 2.3 — `console.info` left in production API client
**File:** `src/lib/api/index.ts:83`
**Impact:** Logs internal API responses to user's browser console.

**Fix:** Replace with `webLogger.debug(...)` or remove.

---

### 2.4 — `console.warn` in video player
**File:** `src/hooks/useVideoPlayer.ts:182`
**Impact:** Exposes internal error details to users in console.

**Fix:** Replace with `webLogger.warn(...)`.

---

### 2.5 — `console.error` in ErrorBoundary
**File:** `src/components/ErrorBoundary.tsx:26`
**Impact:** Intentional but uses raw console instead of logger.

**Fix:** Use `webLogger.error(...)` for consistency.

---

### 2.6 — `browser confirm()` dialogs instead of custom modals
**Files:**
- `src/app/reality/super-vote/page.tsx:131,138`
- `src/app/admin/settings/page.tsx:575,597`
- `src/app/settings/devices/page.tsx:56`
- `src/app/creator/scheduled/page.tsx:169`
- `src/app/creator/drafts/page.tsx:195`
- `src/app/creator/content-manager/page.tsx:310`

**Impact:** Blocks the UI thread; not styled; poor UX on mobile; cannot be customized for a11y.

**Fix:** Use a custom confirmation modal component from `@azeebo/ui`.

---

### 2.7 — Hardcoded inline hex colors throughout pages
**Files:** 30+ files with `style={{ backgroundColor: '#E8420A' }}`, `style={{ color: '#22C55E' }}`, etc.
**Top offenders:**
- `src/app/admin/universes/page.tsx` (15 instances)
- `src/app/reality/episode/page.tsx` (8 instances)
- `src/app/admin/content/page.tsx` (8 instances)
- `src/app/creators/page.tsx` (5 instances)
- `src/app/premium/page.tsx` (5 instances)

**Impact:** Design system tokens defined in `globals.css` (e.g., `var(--brand-orange)`, `var(--brand-red)`, `var(--color-success-500)`) are ignored. Theme changes require editing dozens of files.

**Fix:** Replace all inline hex colors with CSS custom properties or Tailwind utility classes (e.g., `bg-[var(--brand-orange)]`, `text-[var(--color-success-500)]`).

---

### 2.8 — Clickable `<div>` without keyboard support
**File:** `src/app/watch/[id]/WatchPageClient.tsx:1015,1081`
**Impact:** `<div onClick={...}>` without `role="button"`, `tabIndex={0}`, or `onKeyDown` handler. Keyboard users cannot activate.

**Fix:** Add `role="button"`, `tabIndex={0}`, and `onKeyDown` for Enter/Space.

---

### 2.9 — Clickable notification items without keyboard handlers
**File:** `src/app/notifications/page.tsx:215`
**Impact:** `<div onClick={() => markAsRead(notification.id)}>` — keyboard users cannot mark as read.

**Fix:** Add `role="button"`, `tabIndex={0}`, `onKeyDown` handler.

---

### 2.10 — Search API endpoint missing `/v1/` prefix
**File:** `src/app/search/page.tsx:112`
```typescript
const response = await apiFetch<SearchResponse | SearchResult[]>(
  `/content/search?${params.toString()}`
);
```
**Impact:** Missing `/v1/` prefix may hit wrong endpoint or 404 depending on gateway routing.

**Fix:** Change to `/v1/content/search?${params.toString()}`.

---

### 2.11 — Suggestions API endpoint missing `/v1/` prefix
**File:** `src/app/search/page.tsx:129`
```typescript
const response = await apiFetch<SuggestionsResponse | string[]>(
  `/content/suggestions?q=${encodeURIComponent(query)}`
);
```
**Impact:** Same as above.

**Fix:** Change to `/v1/content/suggestions?q=...`.

---

### 2.12 — `apiFetch` in `reset-password` missing `/v1/` prefix
**File:** `src/app/auth/reset-password/page.tsx:62`
```typescript
const result = await apiFetch('/auth/reset-password', { ... });
```
**Impact:** Hits `/api/auth/reset-password` instead of `/api/v1/auth/reset-password` (gateway path rewriting may mask this, but inconsistent with other auth calls).

**Fix:** Change to `/v1/auth/reset-password`.

---

### 2.13 — Content type re-declared in `browse/page.tsx`
**File:** `src/app/browse/page.tsx:12-24`
**Impact:** `ContentItem` interface is defined locally, shadowing the canonical `ContentItem` from `@/lib/api`. Drift risk.

**Fix:** Import `ContentItem` from `@/lib/api` and extend if needed.

---

### 2.14 — Content type re-declared in `creator/content-manager/page.tsx`
**File:** `src/app/creator/content-manager/page.tsx:10-22`
**Impact:** Same issue as above — local `ContentItem` shadows canonical type.

**Fix:** Import from `@/lib/api`.

---

### 2.15 — Notification type re-declared in `notifications/page.tsx`
**File:** `src/app/notifications/page.tsx:10-18`
**Impact:** Local `Notification` interface may drift from actual API shape.

**Fix:** Define shared types in `@/lib/api` or `@azeebo/shared-types`.

---

## 3. SEO Issues

### 3.1 — Universe pages lack `generateMetadata`
**Files:**
- `src/app/reality/page.tsx`
- `src/app/movies/page.tsx`
- `src/app/games/page.tsx`
- `src/app/comedy/page.tsx`
- `src/app/lifestyle/page.tsx`
- `src/app/sports/page.tsx`
- `src/app/vertical/page.tsx`
- `src/app/creators/page.tsx`
- `src/app/browse/page.tsx`
- `src/app/search/page.tsx`
- `src/app/notifications/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/premium/page.tsx`

**Impact:** All these pages are `'use client'` with no server-side metadata. Search engines see generic "Azeebo+" title for every page. Missing OpenGraph, Twitter cards, and canonical URLs for all universe pages.

**Fix:** Either:
1. Extract metadata generation to a server component that wraps the client page, or
2. Add `generateMetadata` in a parallel `layout.tsx` or `page.tsx` server file for each route.

Example for `/movies`:
```typescript
// src/app/movies/layout.tsx (server component)
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Movies',
  description: 'Stream premium Nigerian movies on Azeebo+',
  openGraph: { title: 'Movies | Azeebo+', description: 'Stream premium Nigerian movies' },
};
```

---

### 3.2 — Missing `hreflang` and `lang` attribute alignment
**File:** `src/app/layout.tsx:78`
**Impact:** `<html lang="en">` is set but no `hreflang` alternate tags for future i18n. Minor for now but will block localization.

---

### 3.3 — Sitemap doesn't include universe pages
**File:** `src/app/sitemap.ts`
**Impact:** Dynamic universe pages (`/reality`, `/movies`, `/games`, etc.) may not appear in sitemap if not dynamically generated.

**Fix:** Ensure sitemap includes all public routes with appropriate `lastModified` and `changeFrequency`.

---

### 3.4 — No `canonical` URL on any page
**Impact:** Duplicate content risk across `/`, `/home`, `/browse`. Search engines may index multiple versions of the same content.

**Fix:** Add `<link rel="canonical">` via metadata on every page.

---

## 4. Performance

### 4.1 — All universe pages fetch `/universes` independently
**Files:** `reality/page.tsx`, `movies/page.tsx`, `games/page.tsx`, `comedy/page.tsx`, `lifestyle/page.tsx`, `sports/page.tsx`, `vertical/page.tsx`
**Impact:** 7 separate API calls to the same endpoint with no shared cache. Visiting multiple universe pages triggers redundant network requests.

**Fix:** Use a shared query key (`['universes']`) with `staleTime: 300000` (already done individually, but TanStack Query deduplication only works within the same component tree). Consider pre-fetching in layout or using a context/provider.

---

### 4.2 — `nollywoodShift` animation on `az-nollywood-bg` uses `background-size: 400% 400%`
**File:** `src/app/globals.css:319-335`
**Impact:** Animating `background-position` on a full-page gradient causes repaints on every frame. On low-end mobile devices this may cause jank.

**Fix:** Use `will-change: background-position` or replace with a CSS `transform`-based animation (cheaper for GPU compositing).

---

### 4.3 — Noise texture overlay on `body::before` uses SVG filter
**File:** `src/app/globals.css:456-466`
**Impact:** `feTurbulence` SVG filter is expensive to render and creates a fixed overlay at `z-index: 9999` that renders on every paint. This layer covers the entire viewport.

**Fix:** Pre-render the noise to a static PNG tile, or remove if not essential.

---

### 4.4 — Vignette effect on `body::after`
**File:** `src/app/globals.css:469-476`
**Impact:** Another full-viewport fixed overlay at `z-index: 9998`. Two stacked full-viewport pseudo-elements add compositing overhead.

**Fix:** Consider combining with the noise overlay into a single layer, or remove if visual impact is minimal.

---

### 4.5 — Multiple independent `useQuery` calls on same data in browse page
**File:** `src/app/browse/page.tsx:108-151`
**Impact:** Three separate `useQuery` calls for categories, universes, and content. Categories and universes queries have identical `staleTime: 300000` and could be batched.

**Fix:** Combine into a single query or use `Promise.all` in one query function.

---

### 4.6 — `useEffect` for analytics logging runs on every auth state change
**File:** `src/app/home/page.tsx:28-36`
**Impact:** `webLogger.log` and `analytics.homepageAccessed` fire whenever `isAuthenticated` or `isLoading` changes, not just on mount.

**Fix:** Add a ref to track first mount and only log once.

---

## 5. Accessibility Gaps

### 5.1 — `role="listbox"` misused on non-listbox containers
**Files:**
- `src/app/comedy/page.tsx:175` — category grid uses `role="listbox"` but children are buttons, not options
- `src/app/movies/page.tsx:166` — horizontal scroll of category buttons
- `src/app/creators/page.tsx:80` — grid of creator cards
- `src/app/rankings/page.tsx:109`
- `src/app/wallet/add-funds/page.tsx:152`
- `src/app/wallet/withdraw/page.tsx:241`
- `src/app/wallet/transactions/page.tsx:113,135`
- `src/app/reality/episodes/page.tsx:119`
- `src/app/messages/page.tsx:272`
- `src/app/creator/analytics/page.tsx:170`

**Impact:** `role="listbox"` expects `role="option"` children and specific keyboard interactions (Arrow keys, Space/Enter to select). These are plain button groups, not listboxes.

**Fix:** Use `role="toolbar"` or `role="group"` with `aria-label`, or remove the role entirely and let semantic `<button>` elements handle interaction.

---

### 5.2 — `<div>` with `onClick` missing keyboard support
**File:** `src/app/notifications/page.tsx:215`
**Impact:** Notification items are clickable `<div>` elements with no `tabIndex`, `role`, or `onKeyDown`. Keyboard users cannot interact.

**Fix:**
```tsx
<div
  role="button"
  tabIndex={0}
  onClick={() => markAsRead(notification.id)}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); markAsRead(notification.id); } }}
>
```

---

### 5.3 — Creators page clickable cards missing keyboard support
**File:** `src/app/creators/page.tsx:86`
**Impact:** `<div onClick={() => setSelectedCreator(creator)}>` without `tabIndex` or `onKeyDown`.

**Fix:** Add `tabIndex={0}`, `role="button"`, and `onKeyDown` handler.

---

### 5.4 — `select` elements in browse filters missing proper option styling
**File:** `src/app/browse/page.tsx:344-374`
**Impact:** `<option>` elements inside native `<select>` inherit dark background from the design system, making option text invisible on some browsers.

**Fix:** Add explicit `style={{ color: '#000', background: '#fff' }}` to `<option>` elements (already done in profile-setup but missing here).

---

### 5.5 — Missing `aria-live` region for dynamic content updates
**Files:**
- `src/app/notifications/page.tsx` — notifications list updates without announcing to screen readers
- `src/app/browse/page.tsx` — content grid updates without live region

**Impact:** Screen reader users are not notified when content loads or updates.

**Fix:** Add `aria-live="polite"` to content containers (browse page already has this at line 472 — verify it works).

---

### 5.6 — No visible focus indicators on some interactive elements
**File:** `src/app/premium/page.tsx:258`
**Impact:** Subscribe buttons use `className` without explicit focus-visible styles. The global `:focus-visible` style (line 495-498 of globals.css) provides a 2px orange outline, but some elements override it with `outline: none`.

**Fix:** Verify all interactive elements respect the global `:focus-visible` style. Add `focus-visible:ring-2 focus-visible:ring-[var(--brand-orange)]` to button components.

---

### 5.7 — Search page suggestions dropdown may trap focus
**File:** `src/app/search/page.tsx:300-387`
**Impact:** Suggestions dropdown has `role="listbox"` but no `onKeyDown` handler on the container for Escape key to close and return focus to input.

**Fix:** Add `onKeyDown` handler for Escape key on the suggestions container.

---

### 5.8 — OTP inputs have `maxLength={OTP_LENGTH}` (6) on each input
**File:** `src/app/auth/otp-verification/page.tsx:140`
**Impact:** Each individual OTP digit input accepts up to 6 characters because `maxLength` is set to `OTP_LENGTH` (6) instead of `1`.

**Fix:** Change `maxLength={OTP_LENGTH}` to `maxLength={1}`.

---

## 6. UI/UX Defects

### 6.1 — Profile setup shows hardcoded placeholder name
**File:** `src/app/auth/profile-setup/page.tsx:262-264`
```tsx
<p className="az-headline text-white text-lg">
  {fullName.trim() || 'Yetunde Williams'}
</p>
<p className="text-white/50 text-sm">@{username.trim() || 'YetyWilly'}</p>
```
**Impact:** When the user hasn't entered their name, the preview card shows "Yetunde Williams" / "@YetyWilly" — a specific person's name that will confuse every new user.

**Fix:** Use generic placeholders like "Your Name" / "@username" or show the initial letter only.

---

### 6.2 — Error state on profile page has no retry button
**File:** `src/app/profile/page.tsx:92-96`
```tsx
<ErrorState
  title="Failed to load profile"
  description="Please try again later."
  buttonText="Retry"
/>
```
**Impact:** `buttonText` is passed but `onButtonPress` is not — the Retry button does nothing.

**Fix:** Add `onButtonPress={() => refetch()}` to `ErrorState`.

---

### 6.3 — `movies/page.tsx` hero section "Premium" badge always shows
**File:** `src/app/movies/page.tsx:93-98`
**Impact:** The hero "Premium" badge is hardcoded and shows even if the movie is free content.

**Fix:** Conditionally render based on content metadata (e.g., `movies[0].isPremium`).

---

### 6.4 — `games/page.tsx` hero "Premium" badge always shows
**File:** `src/app/games/page.tsx:88-93`
**Impact:** Same as above.

---

### 6.5 — `vertical/page.tsx` hero and grid items always show "Premium" badge
**File:** `src/app/vertical/page.tsx:67-72,147-152`
**Impact:** Hardcoded premium badges on all vertical content.

---

### 6.6 — Toast notifications in premium page never auto-dismiss
**File:** `src/app/premium/page.tsx:282-295`
**Impact:** Success/error toasts appear but have no timeout or close button — they stay visible indefinitely.

**Fix:** Add a `useEffect` with a 5-second timeout to clear the toast, or add a close button.

---

### 6.7 — No empty state illustration on profile page
**File:** `src/app/profile/page.tsx:165-168`
**Impact:** When profile data fails to load, only a text error is shown with no retry mechanism.

---

### 6.8 — Comedy page has no animation/transition effects
**File:** `src/app/comedy/page.tsx`
**Impact:** Unlike reality, movies, games, and vertical pages which use `framer-motion` for scroll reveals and stagger grids, comedy page uses plain CSS transitions. Inconsistent visual quality.

**Fix:** Add `ScrollReveal`, `StaggerGrid`, and `GlowCard` components for consistency.

---

### 6.9 — Lifestyle page has no animation/transition effects
**File:** `src/app/lifestyle/page.tsx`
**Impact:** Same as comedy — missing motion components used by other universe pages.

---

### 6.10 — Sports page has no animation/transition effects
**File:** `src/app/sports/page.tsx`
**Impact:** Same as above.

---

### 6.11 — Creators page has no animation/transition effects
**File:** `src/app/creators/page.tsx`
**Impact:** Same as above — uses plain CSS `animate-pulse` for loading instead of `Skeleton` from `@azeebo/ui`.

---

### 6.12 — Creators page uses raw pulse animation instead of Skeleton component
**File:** `src/app/creators/page.tsx:65-74`
**Impact:** Manual `<div className="animate-pulse">` instead of using the shared `Skeleton` component from `@azeebo/ui/web` (used consistently in other pages).

**Fix:** Import and use `Skeleton` from `@azeebo/ui/web`.

---

### 6.13 — Content manager grid view is not responsive
**File:** `src/app/creator/content-manager/page.tsx:234`
**Impact:** Grid uses `xl:grid-cols-4` but cards have fixed `h-40` thumbnails. On small screens, the grid collapses to 1 column but cards remain at 160px height, wasting space.

---

### 6.14 — `not-found.tsx` button styling inconsistent with design system
**File:** `src/app/not-found.tsx:14`
**Impact:** Uses `bg-[#E8420A] rounded-lg` instead of `az-btn-primary` (pill shape). Inconsistent with every other CTA in the app.

**Fix:** Replace with `<Link href="/" className="az-btn-primary" style={{ width: 'auto', paddingInline: '2rem' }}>Go Home</Link>`.

---

### 6.15 — No loading state for `creators/page.tsx` second query
**File:** `src/app/creators/page.tsx:37-50`
**Impact:** When `selectedCreator` changes, `creatorContent` fetches but shows no loading indicator — the content section just stays empty until data arrives.

**Fix:** Add an `isLoadingCreatorContent` state or use a query for the second fetch.

---

### 6.16 — Creators page shows creator email publicly
**File:** `src/app/creators/page.tsx:105`
```tsx
<p className="text-sm text-white/50 mb-1">{creator.email}</p>
```
**Impact:** Displays creator email to all visitors — potential privacy/anti-spam issue.

**Fix:** Remove email display or replace with username/handle.

---

## Summary Statistics

| Category | Issue Count |
|----------|-------------|
| Unfinished Features & Dead Code | 12 |
| Technical Debt | 15 |
| SEO Issues | 4 |
| Performance | 6 |
| Accessibility Gaps | 8 |
| UI/UX Defects | 16 |
| **Total** | **61** |

---

## Priority Matrix

### P0 — Critical (Fix Immediately)
- 2.10, 2.11, 2.12 — API endpoint prefix bugs (broken features)
- 5.8 — OTP maxLength bug (broken auth flow)
- 1.12 — Resend OTP not calling API
- 6.2 — ErrorState retry button non-functional

### P1 — High (Fix This Sprint)
- 2.1 — Raw `<img>` tags (CLS, performance)
- 2.6 — `confirm()` dialogs (UX)
- 5.1 — `role="listbox"` misuse (screen reader confusion)
- 5.2, 5.3 — Clickable divs without keyboard support
- 6.1 — Hardcoded placeholder name
- 6.16 — Public email display
- 3.1 — Missing metadata on universe pages

### P2 — Medium (Fix Next Sprint)
- 1.1–1.9 — Dead CTA buttons
- 2.7 — Inline hex colors
- 4.1 — Redundant API calls
- 4.2, 4.3, 4.4 — Animation performance
- 5.4 — Select option styling
- 6.6 — Toast auto-dismiss
- 6.8–6.11 — Inconsistent motion

### P3 — Low (Backlog)
- 2.2–2.5 — Console statements
- 2.13–2.15 — Type duplication
- 3.2–3.4 — SEO nice-to-haves
- 4.5, 4.6 — Minor performance
- 1.10, 1.11 — Dead props
