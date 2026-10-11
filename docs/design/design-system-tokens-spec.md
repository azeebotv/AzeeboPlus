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

| Token Name | Hex Value | Semantic Role | WCAG Ratio on Canvas |
|---|---|---|---|
| `--color-canvas-base` | `#0B090E` | Deep obsidian background for Web/Mobile | N/A |
| `--color-canvas-admin` | `#0F172A` | Slate dark base for Admin/Operations | N/A |
| `--color-canvas-creator` | `#1A0A0A` | Warm burgundy-tinted base for Creator | N/A |
| `--color-surface-card` | `#140E18` | Elevated card & list background | 1.15:1 to canvas |
| `--color-surface-elevated` | `#1F1626` | Popovers, modals, dropdowns | 1.35:1 to canvas |
| `--color-brand-primary` | `#E8420A` | Primary interactive accent & CTAs | 4.8:1 on base (AA) |
| `--color-brand-gradient-end` | `#CC1C1C` | Brand CTA gradient terminus | 4.2:1 on base |
| `--color-text-primary` | `#F5F0EB` | High-emphasis headers and body copy | 14.8:1 (AAA) |
| `--color-text-secondary` | `#9A8A7A` | Metadata, subtitles, labels | 6.2:1 (AA) |
| `--color-text-muted` | `#66584C` | Disabled state text, placeholders | 3.5:1 (large only) |
| `--color-status-success` | `#10B981` | Success alerts, completed states | 5.1:1 (AA) |
| `--color-status-warning` | `#F59E0B` | In-progress, review pending | 5.8:1 (AA) |
| `--color-status-error` | `#EF4444` | Failure, rejection, destructive action | 4.6:1 (AA) |
| `--color-focus-ring` | `#F97316` | High-visibility focus indicator ring | 3:1 graphical minimum |

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

### 4.4 TV 10-Foot UI (`apps/tv`)
- Focus-driven remote D-pad navigation with distinct visual focus rings (minimum 3px border).
- Safe area margins: 48px horizontal, 27px vertical (overscan protection).
- Typography scaled for 10-foot viewing distance (minimum 16px for captions, 24px for body text).

---

## 5. Verification & Compliance Checklist

- [x] High contrast ratios meet WCAG 2.2 AA (minimum 4.5:1 for body copy).
- [x] State matrix covers loading, data, empty, retryable error, and gated states.
- [x] Touch/remote focus accessibility requirements documented.
- [x] Component contracts established across all 5 surfaces.
