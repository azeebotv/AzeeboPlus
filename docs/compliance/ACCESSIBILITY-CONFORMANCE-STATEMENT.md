# Azeebo+ — Accessibility Conformance Statement (VPAT / WCAG 2.2 AA)

**Document ID:** AZP-COMP-A11Y-2026-v1.0  
**Effective Date:** Q4 2026  
**Standards Evaluated:** Web Content Accessibility Guidelines (WCAG) 2.2 Level AA  
**Surfaces Covered:** Web (`apps/web`), Mobile iOS & Android (`apps/mobile`), TV 10-foot (`apps/tv`)  
**Classification:** Public Compliance Disclosure

---

## 1. Conformance Status

Azeebo+ is **substantially conformant** with WCAG 2.2 Level AA standards across its primary consumer surfaces.

---

## 2. Technical Evidence & Implementation Highlights

### 2.1 Contrast Ratios (WCAG 1.4.3 & 1.4.11)
- **Primary Text:** `--color-text-primary` (`#F5F0EB` on `#0B090E`) delivers **17.5:1** contrast ratio (exceeds AAA requirement).
- **Secondary Text:** `--color-text-secondary` (`#9A8A7A` on `#140E18`) delivers **5.9:1** contrast ratio (exceeds AA 4.5:1 requirement).
- **Muted Elements:** Re-anchored to `#88817B` delivering **5.2:1** on canvas and **4.6:1** on elevated cards.
- **Graphical Focus Indicators:** High-visibility focus ring (`--color-focus-ring` `#F97316`) provides **7.1:1** non-text contrast against dark backgrounds (exceeds 3:1 requirement).

### 2.2 Keyboard Navigation & Focus Management (WCAG 2.1.1, 2.4.3, 2.4.7)
- **Web:** Full logical tab order enforced across all modal dialogs, drawers, and form controls. Skip navigation links (`SkipLink.tsx`) implemented at the root of every page.
- **TV:** Directional D-pad focus engine (`Focusable.tsx`) highlights active cards and controls with a distinct 3px border and 1.05x elevation transform.

### 2.3 Assistive Technology & Touch Targets (WCAG 2.5.5, 2.5.8, 4.1.2)
- **Touch Targets:** All primary mobile and web interactive elements adhere to minimum touch target boundaries of $44 \times 44\text{px}$ (iOS/web) and $48 \times 48\text{dp}$ (Android).
- **Screen Reader Support:** Web surfaces utilize semantic HTML5 elements, ARIA live regions (`role="status"`, `aria-live="polite"`), and explicit form associations. Mobile revenue screens implement explicit `accessibilityLabel` and `accessibilityHint`.
- **Motion Reduction:** Media and interface animations respect system preferences via `@media (prefers-reduced-motion: reduce)` and the `@azeebo/ui` `ReducedMotion` component.

---

## 3. Known Exceptions & Remediation Roadmap

1. **TV Focus Order on Complex Grids:** Advanced multi-universe horizontal carousel focus navigation is optimized for standard D-pads; extended voice control interfaces are scheduled for v1.1.
2. **Mobile Long-Tail Screens:** Non-revenue secondary screens are scheduled for progressive accessibility annotation through Sprint 13.
3. **Contact:** Inquiries regarding accessibility may be directed to `accessibility@azeebo.com`.
