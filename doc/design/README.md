# Design Documentation

> Design system, component specs, screen blueprints, and UX guidelines for Azeebo+.

---

## Structure

```
docs/design/
├── README.md              # This file
├── design-system/         # Design tokens, components, patterns
│   ├── tokens.md          # Colors, typography, spacing
│   ├── components.md      # Shared component catalog
│   └── patterns.md        # Common UX patterns
├── screens/               # Screen-by-screen specs
│   ├── home.md
│   ├── reality/
│   ├── creator/
│   ├── lifestyle/
│   ├── vertical/
│   ├── movie/
│   ├── games/
│   ├── comedy/
│   └── sports/
└── figma/                 # Figma file links and handoff notes
    └── handoff.md
```

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

Tokens are managed in `/packages/design-tokens`. Never hardcode:

```typescript
// Bad
const color = '#FF6B35';
const spacing = 16;

// Good
import { colors, spacing } from '@azeebo/design-tokens';
const color = colors.primary;
const spacing = spacing.md;
```
