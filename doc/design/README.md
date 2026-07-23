# Design Documentation

> Design system, component specs, screen blueprints, and UX guidelines for Azeebo+.

---

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Design Blueprint | `doc/AZEEBO_MODULAR_APP.md` (§4, §11-§12, §15) | Design system, screen blueprints, component catalog |
| Figma Handoff | `doc/AZEEBO_MODULAR_APP.md` (§2107-§3516) | Screen-by-screen Figma design specs |
| Claude Build Playbook | `doc/AZEEBO CLAUDE BUILD (1).md` | Design prompt templates |

## Design Principles

1. **Premium** — Cinematic, modern, not cheap or cluttered
2. **Mobile-first** — Thumb-friendly, optimized for mobile networks
3. **Modular** — Shared shell with distinct universe identity
4. **Rewarding** — Progress, points, and incentives always visible
5. **Culturally alive** — African-first, locally resonant

## Core Components

| Category | Components |
|----------|-----------|
| Navigation | Bottom bar, top bar, universe switcher, tabs |
| Content | Hero cards, content cards, rails, banners |
| Participation | Vote cards, prediction cards, challenge cards |
| Monetization | Wallet card, payment CTA, success card |
| Trust | Badges, leaderboards, progress bars, toasts |

## Screen States

Every screen must implement:

| State | Description |
|-------|-------------|
| Loading | Skeleton/shimmer with content structure |
| Empty | Illustration + message + CTA |
| Error | Error message + retry button |
| Success | Confirmation + feedback + next action |

## Design Tokens

Tokens are managed in `packages/design-tokens`. Never hardcode:

```typescript
// Bad
const color = '#FF6B35';
const spacing = 16;

// Good
import { colors, spacing } from '@azeebo/design-tokens';
const color = colors.primary;
const spacing = spacing.md;
```
