# Cross-Surface Design System & Component Token Specification

> **Identifier:** AZP-DS-SPEC-001  
> **Status:** Authority Design Specification  
> **Version:** 1.0  
> **Date:** 2026-09-28  
> **Scope:** Shared tokens, component states, accessible color palette, and platform exceptions for Web, Mobile, Admin, Creator, and TV.

---

## 1. Executive Summary

This document establishes the canonical design-system tokens and component-state matrix across all five Azeebo+ surfaces (`apps/web`, `apps/mobile`, `apps/admin`, `apps/creator`, and `apps/tv`), resolving:

- **DS-10-02**: Cross-surface token and component contracts.
- **DS-10-05**: Unified state and user-feedback vocabulary.

In compliance with **AZP-PDDMA-001** and **AZP-TAA-001 R2.0**, this specification preserves existing functional themes (warm obsidian/dark base with `#E8420A` brand accents) while establishing strict token scales, WCAG 2.2 AA contrast compliance, and interaction requirements.

---

## 2. Canonical Token Scale

### 2.1 Color Palette & Semantic Surfaces

| Token Name                   | Hex Value | Semantic Role                           | WCAG Ratio on Canvas                                                    |
| ---------------------------- | --------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `--color-canvas-base`        | `#0B090E` | Deep obsidian background for Web/Mobile | N/A                                                                     |
| `--color-canvas-admin`       | `#0F172A` | Slate dark base for Admin/Operations    | N/A                                                                     |
| `--color-canvas-creator`     | `#1A0A0A` | Warm burgundy-tinted base for Creator   | N/A                                                                     |
| `--color-surface-card`       | `#140E18` | Elevated card & list background         | 1.15:1 to canvas                                                        |
| `--color-surface-elevated`   | `#1F1626` | Popovers, modals, dropdowns             | 1.35:1 to canvas                                                        |
| `--color-brand-primary`      | `#E8420A` | Primary interactive accent & CTAs       | 4.9:1 on base (AA)                                                      |
| `--color-brand-gradient-end` | `#D64545` | Brand CTA gradient terminus             | 4.5:1 on base (AA body text)                                            |
| `--color-text-primary`       | `#F5F0EB` | High-emphasis headers and body copy     | 17.5:1 (AAA)                                                            |
| `--color-text-secondary`     | `#9A8A7A` | Metadata, subtitles, labels             | 5.9:1 (AA)                                                              |
| `--color-text-muted`         | `#88817B` | Disabled state text, placeholders       | 5.2:1 on canvas, 5.0:1 on card, 4.6:1 on elevated (AA on every surface) |
| `--color-status-success`     | `#10B981` | Success alerts, completed states        | 7.8:1 (AAA)                                                             |
| `--color-status-warning`     | `#F59E0B` | In-progress, review pending             | 9.2:1 (AAA)                                                             |
| `--color-status-error`       | `#EF4444` | Failure, rejection, destructive action  | 5.3:1 (AA)                                                              |
| `--color-focus-ring`         | `#F97316` | High-visibility focus indicator ring    | 7.1:1 on base (exceeds 3:1 graphical minimum)                           |

### 2.2 Spacing & Radii Matrix

Derived from a strict 4px/8px modular grid:

- **Spacing:** `xs: 4px`, `sm: 8px`, `md: 12px`, `lg: 16px`, `xl: 24px`, `xxl: 32px`, `xxxl: 48px`
- **Radii:** `sm: 4px`, `md: 8px` (inputs/buttons), `lg: 12px` (cards), `xl: 16px` (modals/hero), `pill: 9999px` (tags/chips)

---

## 3. Universal State & Feedback Vocabulary (DS-10-05)

Every interactive surface, form, and data presentation component MUST implement its explicit state matrix without ambiguous defaults or silent failure fallbacks.

```
┌────────────────────────────────────────────────────────┐
│               Lifecycle State Flow                     │
│                                                        │
│  [Loading] ──► [Success: Data] ──► [Partial Data]      │
│     │                                                  │
│     ├──► [Success: Empty Result]                       │
│     ├──► [Error: Retryable Network/API Failure]        │
│     └──► [Forbidden / Entitlement Lock]                │
└────────────────────────────────────────────────────────┘
```

### 3.1 State Definitions & User Actions

1. **Initial / Loading State (`loading`)**:
   - Web/Admin/Creator: Skeleton cards (`<Skeleton />` or shimmer) maintaining exact element dimensions to prevent Cumulative Layout Shift (CLS).
   - Mobile: `<ActivityIndicator />` or `<ContentCardSkeleton />` with aria-busy="true".
   - TV: Non-interactive loading spinner with screen-reader live announcement.

2. **Genuine Empty Result (`success-empty`)**:
   - Triggers when an API query succeeded (`200 OK`) and returned 0 matching records.
   - Distinct title: `"No [items] found"`.
   - Descriptive copy explaining the cause (e.g., `"No content matches 'xyz'"` or `"You haven't added any videos yet"`).
   - Clear CTA to reset filters, search different terms, or perform the primary creation action.

3. **Service / Network Outage (`error-retryable`)**:
   - Triggers when the network drops, API responds with 5xx or `success: false`.
   - **MANDATORY**: MUST NEVER be rendered as a zero balance or empty list.
   - Distinct title: `"Unable to load [resource]"`.
   - Subtitle: Honest explanation without leaking stack traces or internal hostnames.
   - Primary action: `"Try Again"` or `"Retry"` button that re-triggers the specific query without reloading the entire page.

4. **Entitlement / Rights Gate (`forbidden-gated`)**:
   - Triggers when content requires authentication (`401`), subscription (`403`), or is geoblocked.
   - Copy explains what is required (e.g., `"Sign in to watch"` or `"Available with Azeebo+ Premium"`).
   - Action redirects to authentication or subscription upgrade flow.

---

## 4. Platform-Specific Interaction Exceptions

### 4.1 Web (`apps/web`)

- Full keyboard tab navigation with visible outline (`--color-focus-ring`).
- Responsive fluid containers with `@media (prefers-reduced-motion)` honoring.

### 4.2 Mobile (`apps/mobile`)

- Minimum touch target: `44x44px` on all buttons, chips, and list rows.
- Dynamic color scheme support (dark/light system overrides).
- Thumbnails render via `<Image>` with fallback to themed placeholder.

### 4.3 Admin & Creator (`apps/admin`, `apps/creator`)

- Mutation buttons are locked (`disabled`) during pending mutations to prevent duplicate submission.
- Toggles utilize `role="switch"`, `aria-checked`, and `aria-label` for screen reader accessibility.
- Financial numbers never render synthetic zeroes when queries fail.

### 4.3.1 Text on solid light fills (`--color-az-flame` and the rest of the table)

- `--color-az-flame` (`#EC691F`) is a _light_ accent: white on it measures **3.18:1**, below the 4.5:1 AA floor for the 12–14px type this platform uses on chips, pills, badges and selected tabs. White on `--color-az-scarlet` (`#E31E24`) still passes at 4.69:1.
- The same holds for every other light fill, measured the same way: `--color-az-warning-500` **2.15:1**, `--color-az-success-500` **2.28:1**, `--color-az-accent-gold` **1.67:1**, `--color-az-accent-silver` **1.82:1**, `--color-az-accent-bronze` **3.14:1**, `--color-az-error-500` **3.76:1**, `--color-az-secondary-500` **3.68:1**. The deep surface ink clears all of them (5.09–11.48:1). A destructive fill that must keep white ink uses step 600 (`--color-az-error-600`, 4.83:1) with an `error-700` hover, never step 500.
- Never pair `text-az-ink` (white) with a solid `bg-az-flame` surface. Use `text-az-surface-root` instead — `#0F0F0F` on `#EC691F` is **6.03:1**. Opacity variants (`bg-az-flame/10`) sit on the dark canvas and keep the normal ink.
- The brand gradient (`from-az-flame to-az-scarlet`) is a _large-text_ surface only. White clears 3.18:1 on the flame stop and deep ink clears 4.09:1 on the scarlet stop — both below 4.5:1, both above the 3:1 large-text floor. Chips, pills, tabs, badges and compact buttons (12–14px) use `bg-az-flame` with `text-az-surface-root`; only labels at 24px / 18.66px bold may sit on the gradient (`.az-btn-primary`).
- The same rule governs gradient **text** (`.az-text-gradient`): its scarlet stop is 4.23:1 on the page root, so it is for display type. Inline emphasis at body size uses `text-az-flame` (6.24:1). The visual audit measures each opaque stop of clipped text against the layer behind it, so a gradient label that drops below AA is caught rather than read as transparent.
- Categorical badges are fills, not text: the tier swatches (`bg-az-secondary-500`, `bg-az-category-violet`, `bg-az-warning-500`) carry white at 3.68:1, 4.23:1 and 2.15:1, and `#0F0F0F` at 5.19:1, 4.53:1 and 8.93:1 — use the deep ink.
- Enforced statically by the `no-low-contrast-pair` ESLint rule (`packages/eslint-rules`), so the pairing fails `pnpm lint` instead of waiting for the rendered audit. The rule is driven by a measured table (`packages/eslint-rules/contrast-pairs.json`), so a new light fill is one entry: token, hex, done. It computes each ratio from the hexes, derives both spellings (`bg-az-warning-500`, `bg-[var(--color-az-warning-500)]`), and a test re-reads every hex from `apps/web/src/styles/design-tokens.css` so the table cannot drift from the shipped theme. Solid fills only, with the gradient, large-text roles, translucent washes and corrected dark ink exempt.
- Verified 2026-11-10/11 by a full-route visual sweep (desktop 1440×900 and mobile 390×844, 177 web routes, now gated on every PR by `visual-audit-pr`): every remaining contrast failure traced back to these pairings. A static hex audit cannot catch them, because both classes come from tokens.
- Still open (brand decision, not a code defect): `--color-az-scarlet` as _text_ on the dark canvas is 4.09–4.23:1 — fine for large/bold display type, short of AA for body copy.

### 4.4 TV 10-Foot UI (`apps/tv`)

- Focus-driven remote D-pad navigation with distinct visual focus rings (minimum 3px border).
- Safe area margins: 48px horizontal, 27px vertical (overscan protection).
- Typography scaled for 10-foot viewing distance (minimum 16px for captions, 24px for body text).

---

## 5. Verification & Compliance Checklist

- [x] High contrast ratios meet WCAG 2.2 AA (minimum 4.5:1 for body copy). **Met** as of 2026-11-05 (DD-08): `--color-text-muted` was `#66584C` (2.9:1) and is now `#88817B`; `--color-brand-gradient-end` was `#CC1C1C` (3.5:1) and is now `#D64545`. Ratios recomputed from the hex values on 2026-11-04 and re-verified after the change on 2026-11-05. Note both replacements clear the threshold narrowly (`#D64545` is 4.53:1 on `--color-canvas-base`), so any further darkening of the canvas or lightening of the gradient needs a re-measure.
- [x] State matrix covers loading, data, empty, retryable error, and gated states.
- [x] Touch/remote focus accessibility requirements documented.
- [x] Component contracts established across all 5 surfaces.
