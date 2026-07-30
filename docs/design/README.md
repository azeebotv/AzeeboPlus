# Design Documentation

> Design system, component specs, screen blueprints, and UX guidelines for Azeebo+.

---

## Key Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Design Tokens | `packages/design-tokens/` | Colors, spacing, typography, shadows |
| UI Components | `packages/ui/` | Shared React UI components |
| Mobile Theme | `apps/mobile/src/theme.ts` | Mobile design tokens |
| Web Styles | `apps/web/src/app/globals.css` | Global CSS variables |

---

## Design System

### Colors
- Primary: `#E8420A` (Brand Orange)
- Background: `#1A0A0A` (Dark)
- Surface: `#140808` (Card backgrounds)
- Border: `#2A1A1A`
- Text Primary: `#F5F0EB`
- Text Secondary: `#9A8A7A`
- Success: `#0D3B2E` / `#4ADE80`
- Error: `#CC1C1C` / `#F87171`
- Warning: `#F59E0B`

### Typography
- Headings: 700 weight, 15-28px
- Body: 400 weight, 13-14px
- Captions: 400 weight, 11-12px

### Spacing
- Card padding: 16-20px
- Section gaps: 16-24px
- Border radius: 6-16px (cards), 999px (badges/pills)

### Components
- **GlassCard**: Semi-transparent card with blur effect
- **BrandButton**: Gradient button with brand colors
- **BrandInput**: Styled input with dark theme
- **ContentCard**: Content display card with thumbnail
- **HeroCarousel**: Homepage hero banner carousel
- **StateContainers**: Loading, empty, error states

---

## Screen Patterns

### Mobile (Expo Router)
- File-based routing in `apps/mobile/app/`
- Bottom tabs: Home, Watch, Create, Rewards, Profile
- Universe switcher in Watch tab
- Auth flow: Login → Register → OTP → Profile Setup

### Web (Next.js)
- App Router in `apps/web/src/app/`
- Server components with client islands
- Dark theme throughout
- Responsive grid layouts

### Admin (Vite+React)
- Sidebar navigation with icons
- Dashboard overview with stats cards
- CRUD tables with search/filter
- Feature flags management page

### Creator (Vite+React)
- Creator-focused dashboard
- Upload flow with drag-and-drop
- Analytics charts with Recharts
- Earnings and payout management
