# Azeebo+ Design System & UI/UX Guide

**Version:** 1.0
**Last Updated:** May 1, 2026
**Applies To:** Web App (Next.js), Mobile App (React Native), Admin Portal, Creator Portal

---

## Table of Contents

1. [Brand Vision & Identity](#1-brand-vision--identity)
2. [Design Philosophy](#2-design-philosophy)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Components](#6-components)
7. [Navigation & Information Architecture](#7-navigation--information-architecture)
8. [Screen States & Error Handling](#8-screen-states--error-handling)
9. [The 8 Universes Design Language](#9-the-8-universes-design-language)
10. [Responsive Design](#10-responsive-design)
11. [Animation & Motion](#11-animation--motion)
12. [Accessibility](#12-accessibility)
13. [Performance UX](#13-performance-ux)
14. [Monetization UX Patterns](#14-monetization-ux-patterns)
15. [Reward & Engagement UX Patterns](#15-reward--engagement-ux-patterns)

---

## 1. Brand Vision & Identity

### Core Brand Attributes

| Attribute | Description |
|-----------|-------------|
| **Premium** | High-quality, exclusive feel that justifies paid content |
| **Modern** | Current design trends, clean lines, contemporary aesthetics |
| **Cinematic** | Video-first, immersive viewing experiences with theatrical elements |
| **Youthful** | Energetic, culturally relevant, trend-aware |
| **Culturally Alive** | Dynamic, trending, community-driven content |
| **Bold** | Strong visual statements, confident typography |
| **Immersive** | Full-screen experiences, minimal distractions |
| **Commercially Intelligent** | Subtle monetization, non-intrusive purchasing flows |

### Brand Personality

Azeebo+ feels like stepping into a premium entertainment venue — exclusive yet accessible, exciting yet comfortable. Think Netflix meets Discord meets a high-end gaming platform.

### Voice & Tone

| Context | Tone |
|---------|------|
| Headlines | Bold, exciting, action-oriented |
| Body text | Clear, concise, friendly |
| CTAs | Direct, compelling, rewarding |
| Errors | Helpful, never blaming |
| Empty states | Encouraging, guiding |
| Success messages | Celebratory, reinforcing |

---

## 2. Design Philosophy

### Core UI Principles

1. **Mobile-First** — Design for mobile, then scale up
2. **High Clarity** — Every element serves a purpose
3. **Low Friction** — Minimize steps to value
4. **Visually Rich** — High-quality imagery, bold cards
5. **Reusable Components** — Consistency across universes
6. **Strong CTA Hierarchy** — Primary actions unmistakable
7. **Monetization Visibility** — Clear value propositions for paid features
8. **Reward Visibility** — Constant reinforcement of earning/spending
9. **Universe Separation** — Distinct visual identity per universe

### Visual Direction

```
┌─────────────────────────────────────────────────────────────┐
│  DARK FOUNDATION                                           │
│  ─────────────────────────────────────────────────────────  │
│  Primary Background: #111827 (near-black)                  │
│  Card Background: #1F2937 (elevated surface)               │
│  Subtle Borders: #374151                                   │
│                                                             │
│  ACCENT PULSE                                              │
│  ─────────────────────────────────────────────────────────  │
│  Primary: #6366F1 (indigo) — trust, premium               │
│  Secondary: #EC4899 (pink) — energy, excitement            │
│                                                             │
│  CONTENT PRIORITY                                          │
│  ─────────────────────────────────────────────────────────  │
│  Hero imagery dominates                                     │
│  Modular content rails                                      │
│  Layered hierarchy with clear focal points                  │
└─────────────────────────────────────────────────────────────┘
```

### Design Meta-Patterns

| Pattern | Application |
|---------|-------------|
| **Hero + Rail** | Featured content hero, supporting content rail |
| **Card Grid** | Masonry or uniform grids for browseable content |
| **Tabbed Sections** | Universe switching, category filtering |
| **Sticky Navigation** | Bottom nav (mobile), top bar (web) |
| **Slide-Up Panels** | Quick actions, purchases, details |
| **Full-Screen Takeover** | Video playback, immersive content |

---

## 3. Color System

### Primary Color Palette

```css
:root {
  /* Core Brand */
  --color-primary: #6366F1;        /* Indigo - primary actions */
  --color-primary-dark: #4F46E5;   /* Indigo dark - hover states */
  --color-primary-light: #818CF8;  /* Indigo light - subtle accents */

  /* Secondary Brand */
  --color-secondary: #EC4899;      /* Pink - energy, CTAs */
  --color-secondary-dark: #DB2777; /* Pink dark */
  --color-secondary-light: #F472B6; /* Pink light */

  /* Semantic Colors */
  --color-success: #10B981;        /* Emerald - positive states */
  --color-warning: #F59E0B;        /* Amber - caution */
  --color-error: #EF4444;          /* Red - errors, destructive */
  --color-info: #3B82F6;           /* Blue - informational */

  /* Backgrounds (Dark Theme Foundation) */
  --bg-primary: #111827;           /* Main background - near black */
  --bg-secondary: #1F2937;         /* Card surfaces */
  --bg-tertiary: #374151;         /* Elevated elements */
  --bg-hover: #4B5563;             /* Hover states */

  /* Text Colors */
  --text-primary: #F3F4F6;         /* Primary text - high contrast */
  --text-secondary: #9CA3AF;       /* Secondary text */
  --text-tertiary: #6B7280;        /* Muted, disabled text */
  --text-inverse: #111827;         /* Text on light backgrounds */

  /* Borders & Dividers */
  --border-default: #4B5563;       /* Standard borders */
  --border-light: #374151;          /* Subtle dividers */
  --border-focus: #6366F1;         /* Focus rings */

  /* Overlays */
  --overlay-light: rgba(255, 255, 255, 0.05);
  --overlay-medium: rgba(0, 0, 0, 0.5);
  --overlay-heavy: rgba(0, 0, 0, 0.8);
}
```

### Universe-Specific Accent Colors

| Universe | Primary Accent | Usage |
|----------|-----------------|-------|
| Reality | #F59E0B (Amber) | Voting, predictions, live events |
| Creator | #EC4899 (Pink) | Creator profiles, upload CTAs |
| Lifestyle | #F97316 (Orange) | Events, nightlife, culture |
| Vertical | #8B5CF6 (Purple) | Premium content, lore, characters |
| Movie | #EF4444 (Red) | Cinematic, trailers, rentals |
| Games | #10B981 (Emerald) | Challenges, tournaments, leaderboards |
| Comedy | #FBBF24 (Yellow) | Viral content, trending |
| Sports | #06B6D4 (Cyan) | Live scores, highlights |

### Gradient Combinations

```css
/* Primary Gradient - Brand */
--gradient-brand: linear-gradient(135deg, #6366F1 0%, #EC4899 100%);

/* Universe Gradients */
--gradient-reality: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
--gradient-creator: linear-gradient(135deg, #EC4899 0%, #F472B6 100%);
--gradient-lifestyle: linear-gradient(135deg, #F97316 0%, #FBBF24 100%);
--gradient-vertical: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%);
--gradient-movie: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
--gradient-games: linear-gradient(135deg, #10B981 0%, #059669 100%);
--gradient-comedy: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
--gradient-sports: linear-gradient(135deg, #06B6D4 0%, #0EA5E9 100%);

/* Premium/Paid Gradient */
--gradient-premium: linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%);
```

### Color Usage Rules

| Color | Usage | Forbidden |
|-------|-------|-----------|
| Primary | Main CTAs, active states, brand moments | Backgrounds (use sparingly) |
| Secondary | Supporting CTAs, highlights | Primary actions |
| Success | Confirmations, positive feedback | General use |
| Warning | Caution states, important notices | Errors |
| Error | Destructive actions, error states | Warnings |
| Backgrounds | Dark theme foundation | Light theme defaults |

---

## 4. Typography

### Font Stack

```css
/* Primary - Inter for clean readability */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Display - Optional bold display font for heroes */
--font-display: 'Inter', 'Poppins', sans-serif;

/* Monospace - For code, prices, stats */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Token | Size (Desktop) | Size (Mobile) | Weight | Usage |
|-------|----------------|---------------|--------|-------|
| `--text-4xl` | 36px / 2.25rem | 30px | 700 | Hero headlines |
| `--text-3xl` | 30px / 1.875rem | 26px | 700 | Page titles |
| `--text-2xl` | 24px / 1.5rem | 20px | 600 | Section headers |
| `--text-xl` | 20px / 1.25rem | 18px | 600 | Card titles |
| `--text-lg` | 18px / 1.125rem | 16px | 500 | Subheadings |
| `--text-base` | 16px / 1rem | 16px | 400 | Body text |
| `--text-sm` | 14px / 0.875rem | 14px | 400 | Supporting text |
| `--text-xs` | 12px / 0.75rem | 12px | 500 | Labels, badges |
| `--text-xxs` | 10px / 0.625rem | 10px | 500 | Micro labels |

### Line Heights

| Context | Line Height | Usage |
|---------|-------------|-------|
| Headlines | 1.1 - 1.2 | Bold, tight tracking |
| Body | 1.5 - 1.6 | Comfortable reading |
| Captions | 1.4 | Supporting text |
| Buttons | 1.0 | Compact CTAs |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tight` | -0.025em | Large headlines |
| `--tracking-normal` | 0 | Body text |
| `--tracking-wide` | 0.025em | All caps labels |
| `--tracking-wider` | 0.05em | Badge text |

### Typography Rules

1. **Never use font sizes below 12px** for interactive or readable content
2. **Maintain 4.5:1 contrast ratio** for body text (WCAG AA)
3. **Use font weight to create hierarchy**, not size alone
4. **Limit to 2-3 font weights** per section to avoid visual noise
5. **Always use relative units** (rem) for scalability

### Example Typography Hierarchy

```tsx
// Page: Discovery / Watch
<h1 style={{ fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2 }}>
  Featured This Week
</h1>

<h2 style={{ fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 }}>
  Trending in Reality
</h2>

<p style={{ fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 }}>
  Vote for your favorite contestants in the live finale event happening tonight.
</p>

<span style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.05em' }}>
  LIVE
</span>
```

---

## 5. Spacing & Layout

### Spacing Scale

| Token | Value (px) | Value (rem) | Usage |
|-------|------------|-------------|-------|
| `--space-0` | 0 | 0 | Reset |
| `--space-1` | 4px | 0.25rem | Tight gaps |
| `--space-2` | 8px | 0.5rem | Icon padding |
| `--space-3` | 12px | 0.75rem | Compact elements |
| `--space-4` | 16px | 1rem | Standard padding |
| `--space-5` | 20px | 1.25rem | Card padding |
| `--space-6` | 24px | 1.5rem | Section gaps |
| `--space-8` | 32px | 2rem | Major sections |
| `--space-10` | 40px | 2.5rem | Page margins |
| `--space-12` | 48px | 3rem | Hero spacing |
| `--space-16` | 64px | 4rem | Section dividers |
| `--space-20` | 80px | 5rem | Page padding |
| `--space-24` | 96px | 6rem | Large gaps |

### Layout Grid

```css
/* Grid System */
--grid-columns: 12;
--grid-gutter: 24px;       /* Desktop */
--grid-gutter-mobile: 16px;

/* Container Widths */
--container-sm: 640px;      /* Narrow content */
--container-md: 768px;     /* Standard content */
--container-lg: 1024px;    /* Wide content */
--container-xl: 1280px;    /* Full content */
--container-2xl: 1536px;   /* Maximum */
```

### Breakpoints

| Breakpoint | Min Width | Target Device | Columns |
|------------|-----------|---------------|---------|
| `xs` | 0px | Small phones | 4 |
| `sm` | 480px | Large phones | 4 |
| `md` | 768px | Tablets | 8 |
| `lg` | 1024px | Laptops | 12 |
| `xl` | 1280px | Desktops | 12 |
| `2xl` | 1536px | Large screens | 12 |

### Layout Patterns

#### Hero + Rail Layout
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                      HERO (16:9 or 21:9)                     │
│                      Full-width image                        │
│                      Gradient overlay                        │
│                      Title + CTA                             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ← PREV  │  CARD  │  CARD  │  CARD  │  CARD  │  CARD  │ NEXT →│
│          │  RAIL  │  RAIL  │  RAIL  │  RAIL  │  RAIL  │       │
└──────────────────────────────────────────────────────────────┘
```

#### Card Grid Layout
```
┌────────┬────────┬────────┬────────┐
│        │        │        │        │
│  CARD  │  CARD  │  CARD  │  CARD  │
│        │        │        │        │
├────────┼────────┼────────┼────────┤
│        │        │        │        │
│  CARD  │  CARD  │  CARD  │  CARD  │
│        │        │        │        │
└────────┴────────┴────────┴────────┘
```

#### Featured Content Layout
```
┌─────────────────────────────┬────────────┐
│                             │            │
│                             │   CARD     │
│        LARGE FEATURE        ├────────────┤
│        (2/3 width)          │   CARD     │
│                             ├────────────┤
│                             │   CARD     │
└─────────────────────────────┴────────────┘
```

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Badges, small buttons |
| `--radius-md` | 8px | Cards, inputs |
| `--radius-lg` | 12px | Modals, large cards |
| `--radius-xl` | 16px | Bottom sheets |
| `--radius-2xl` | 24px | Featured cards |
| `--radius-full` | 9999px | Avatars, pills |

---

## 6. Components

### Component Categories

#### Navigation Components

| Component | States | Usage |
|-----------|--------|-------|
| Bottom Navigation | default, active, badge | Mobile main navigation |
| Top Navigation Bar | default, scrolled, transparent | Web header |
| Universe Switcher | collapsed, expanded | Tab switching between universes |
| Tab Bar | default, active, disabled | Category filtering |
| Segmented Control | single, multi-select | Filter options |
| Sidebar (Desktop) | expanded, collapsed, hover | Web navigation |

#### Content Containers

| Component | States | Usage |
|-----------|--------|-------|
| Hero Card | default, loading, hover | Featured content |
| Content Card | default, hover, loading | Standard content items |
| Show Card | default, live, upcoming | TV shows, series |
| Creator Card | default, verified, featured | Creator profiles |
| Video Tile | default, hover, playing | Video thumbnails |
| Highlight Rail | default, loading | Horizontal scroll sections |
| Feature Banner | default, parallax | Full-width promotions |

#### Participation Components

| Component | States | Usage |
|-----------|--------|-------|
| Vote Card | default, voted, closed | Voting interfaces |
| Supervote Card | default, used, expired | Premium voting tokens |
| Prediction Card | default, correct, incorrect | Sports/prediction games |
| Entry Card | default, joined, won | Challenge entries |
| Challenge Card | default, active, expired | Tournament/challenge info |
| Reward Card | default, claimed, expired | Reward displays |

#### Monetization Components

| Component | States | Usage |
|-----------|--------|-------|
| Wallet Balance | default, loading, updating | Balance display |
| Purchase Selector | default, selected, disabled | Tier selection |
| Payment CTA Block | default, loading, processing | Payment confirmation |
| Transaction Success | default, with receipt | Purchase confirmation |
| Premium Unlock | default, trial, subscribed | Premium upsells |
| Pass/Rental Card | default, expired, active | Time-limited content |
| Price Tag | default, discounted, bonus | Pricing display |

#### Trust & Utility Components

| Component | States | Usage |
|-----------|--------|-------|
| Badge | default, animated, new | Status indicators |
| Profile Chip | default, online, offline | User status |
| Verification Mark | verified, unverified, pending | Identity verification |
| Rating Stars | partial, full, interactive | Content ratings |
| Progress Bar | default, animated, complete | Progress indicators |
| Countdown Timer | default, urgent, expired | Live events, deadlines |

### Component State Requirements

**Every interactive component MUST support:**

| State | Visual Treatment |
|-------|-----------------|
| Default | Resting state |
| Hover | Subtle lift, glow, or highlight |
| Active/Pressed | Scale down slightly, darker |
| Focused | Visible focus ring (2px primary) |
| Disabled | 50% opacity, no interactions |
| Loading | Skeleton or spinner overlay |
| Error | Error color border, icon |

### Base Component API

```tsx
// Button Component
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

// Card Component
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

// Input Component
interface InputProps {
  type: 'text' | 'email' | 'password' | 'search';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onChange?: (value: string) => void;
}
```

---

## 7. Navigation & Information Architecture

### App Shell Structure

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR (Sticky)                                          │
│  [Logo] [Search] [Notifications] [Wallet] [Profile]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                     MAIN CONTENT AREA                       │
│                     (Scrollable)                            │
│                                                             │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  BOTTOM NAV (Fixed)                                        │
│  [Home] [Watch] [Create] [Rewards] [Profile]               │
└─────────────────────────────────────────────────────────────┘
```

### Primary Navigation Tabs

| Tab | Icon | Purpose | Badge/Cue |
|-----|------|---------|-----------|
| Home | House | Daily entry, personalized feed | Live indicator |
| Watch | Play | Content browsing, universe switcher | Continue watching |
| Create | Plus/Video | Creator tools, upload | Upload count |
| Rewards | Star | Points, badges, missions | Point balance |
| Profile | User | Identity, settings, wallet | — |

### Universe Switcher (Watch Section)

```
┌─────────────────────────────────────────────────────────────┐
│  [All] [Reality] [Creator] [Lifestyle] [Vertical] [Movies] │
│        [Games] [Comedy] [Sports]                           │
└─────────────────────────────────────────────────────────────┘
```

### Page Hierarchy

```
HOME (Tab 1)
├── Featured Hero Carousel
├── Continue Watching Rail
├── Personalized Recommendations
├── Trending Across Universes
├── Universe-specific Sections
│   ├── Reality Highlights
│   ├── Creator Spotlight
│   └── ...
└── Live Events Banner

WATCH (Tab 2)
├── Universe Switcher
├── Category Filters
├── Content Grid/Rails
├── Search Results
└── Content Detail Pages
    ├── Video Player
    ├── Related Content
    ├── Comments/Community
    └── Purchase/Rent Options

CREATE (Tab 3)
├── Creator Dashboard
├── Upload Center
├── Analytics Overview
├── Earnings Summary
└── Content Management

REWARDS (Tab 4)
├── Points Balance
├── Daily Missions
├── Achievement Badges
├── Streak Tracker
└── Referral Program

PROFILE (Tab 5)
├── Profile Header
├── Wallet Balance
├── Purchase History
├── Watch History
├── Settings
└── Logout
```

### Breadcrumb Pattern

For deep navigation (Web):
```
Home / Watch / Reality / Show Name / Season 1 / Episode 3
```

### Modal & Sheet Patterns

| Pattern | Trigger | Animation |
|---------|---------|-----------|
| Bottom Sheet | Quick actions, purchases | Slide up |
| Modal Dialog | Confirmations, forms | Fade + scale |
| Side Panel | Filters, details | Slide from right |
| Full Screen | Video playback, immersive | Fade |

---

## 8. Screen States & Error Handling

### Required States for Every Screen

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      LOADING STATE                          │
│                      ─────────────                          │
│                      Skeleton placeholders                  │
│                      Content structure visible              │
│                      Animated shimmer effect                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      EMPTY STATE                            │
│                      ───────────                            │
│                      Illustration/icon                     │
│                      Helpful message                        │
│                      Clear CTA button                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      ERROR STATE                            │
│                      ───────────                            │
│                      Error icon/message                     │
│                      Retry button                           │
│                      Support link (if severe)              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      SUCCESS STATE                          │
│                      ────────────                           │
│                      Confirmation                           │
│                      Next action prompt                     │
│                      Celebration (subtle)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Loading State Guidelines

| Element | Skeleton Treatment |
|---------|-------------------|
| Images | Animated placeholder matching aspect ratio |
| Text | Rounded rectangles, varying widths |
| Avatars | Circular placeholders |
| Cards | Full card skeleton with image + text |
| Buttons | Pill-shaped skeleton |

**Animation:** Subtle shimmer effect (opacity 0.3 → 0.7 → 0.3) over 1.5s, infinite.

### Empty State Guidelines

**Structure:**
1. **Illustration** — Contextual visual (max 200x200px)
2. **Headline** — What's missing (max 5 words)
3. **Description** — Why it's empty + benefit (1-2 sentences)
4. **Primary CTA** — Action to populate content
5. **Optional Secondary CTA** — Alternative action

**Examples:**

| Context | Headline | Description | CTA |
|---------|----------|-------------|-----|
| No search results | "No matches found" | "Try different keywords or browse categories" | "Browse Categories" |
| No notifications | "All caught up!" | "When you get notifications, they'll appear here" | — |
| No watch history | "Start watching" | "Content you watch will appear here" | "Explore Content" |
| No rewards | "Earn your first points" | "Watch, vote, and engage to earn rewards" | "Start Watching" |

### Error State Guidelines

**Error Hierarchy:**

| Severity | Response | User Action |
|----------|----------|-------------|
| Network | "Connection issue" | Retry button, auto-retry |
| Auth | "Session expired" | Redirect to login |
| Payment | "Payment failed" | Retry with same/different method |
| Server | "Something went wrong" | Retry, contact support |
| Not Found | "Content unavailable" | Navigate back, browse |

**Error Component Structure:**
```tsx
<ErrorState
  type="network" | "server" | "auth" | "payment" | "not-found"
  message="Custom message (optional)"
  onRetry={() => void}
  onContactSupport={() => void}
/>
```

### Success State Guidelines

**Success Feedback Types:**

| Type | Usage | Duration |
|------|-------|----------|
| Toast | Quick confirmations | 3s auto-dismiss |
| Inline | Form success, state change | Persistent until dismissed |
| Modal | Major achievements | User dismisses |
| Redirect | After payment, signup | Immediate |

---

## 9. The 8 Universes Design Language

Each universe has a distinct visual identity while maintaining overall brand consistency.

### Reality Universe

**Theme:** Live, urgent, democratic
**Accent:** Amber (#F59E0B) + Red (#EF4444)
**Vibe:** Competition, voting, live events

**Visual Elements:**
- Pulsing "LIVE" badges
- Vote count animations
- Progress bars for standings
- Contestant comparison layouts
- Real-time update indicators

**Key Patterns:**
- Voting cards with quick-select
- Leaderboard rankings with animations
- Countdown timers for eliminations
- Live chat integration

### Creator Universe

**Theme:** Creative, personal, aspiring
**Accent:** Pink (#EC4899)
**Vibe:** Self-expression, community, opportunity

**Visual Elements:**
- Profile-forward layouts
- Content grid mosaics
- Follower/subscriber counts
- Earnings dashboards
- Upload progress indicators

**Key Patterns:**
- Creator card with stats overlay
- Content upload flow
- Analytics mini-graphs
- Community engagement metrics

### Lifestyle Universe

**Theme:** Cultural, social, trendy
**Accent:** Orange (#F97316)
**Vibe:** Nightlife, events, youth culture

**Visual Elements:**
- Event countdown displays
- Location-based content
- Social share prominent
- Trend indicators
- Mood/style tags

**Key Patterns:**
- Event cards with date overlays
- Map integration for venues
- Social proof indicators
- Trend ranking lists

### Vertical Universe

**Theme:** Premium, immersive, narrative
**Accent:** Purple (#8B5CF6)
**Vibe:** Exclusive stories, lore, characters

**Visual Elements:**
- Cinematic aspect ratios (21:9)
- Character profile cards
- Lore timeline views
- Premium lock overlays
- Exclusive badge systems

**Key Patterns:**
- Episode/chapter navigation
- Character relationship maps
- Lore glossary tooltips
- Premium unlock flows

### Movie Universe

**Theme:** Cinematic, theatrical, rental
**Accent:** Red (#EF4444)
**Vibe:** Blockbusters, premieres, rentals

**Visual Elements:**
- 2.35:1 hero banners
- Star rating displays
- Runtime/certification badges
- Trailer play overlays
- Rental expiry warnings

**Key Patterns:**
- Movie detail pages with cast
- Rental/purchase flow
- Watchlist functionality
- Similar recommendations

### Games Universe

**Theme:** Competitive, gamified, leaderboards
**Accent:** Emerald (#10B981)
**Vibe:** Tournaments, challenges, rankings

**Visual Elements:**
- Leaderboard tables
- XP/level indicators
- Achievement badges
- Tournament brackets
- Challenge timers

**Key Patterns:**
- Tournament brackets
- Challenge entry cards
- Leaderboard widgets
- Achievement unlocking

### Comedy Universe

**Theme:** Viral, light, shareable
**Accent:** Yellow (#FBBF24)
**Vibe:** Trending, memes, stand-up

**Visual Elements:**
- Trending fire icons
- Share button prominence
- Reaction buttons
- Clip extraction UI
- Creator attribution

**Key Patterns:**
- Viral trending rail
- Reaction/share tools
- Clip creation interface
- Comedy special pages

### Sports Universe

**Theme:** Athletic, real-time, passionate
**Accent:** Cyan (#06B6D4)
**Vibe:** Live scores, highlights, fan boards

**Visual Elements:**
- Score overlays
- Team color theming
- Live indicator pulses
- Stat comparison tables
- Fan reaction buttons

**Key Patterns:**
- Live score widgets
- Game prediction cards
- Highlight reels
- Team following

---

## 10. Responsive Design

### Responsive Strategy

1. **Mobile-First** — Design for smallest screen first
2. **Progressive Enhancement** — Add features as space allows
3. **Content Priority** — Most important content visible on all sizes
4. **Touch-Friendly** — 44px minimum touch targets

### Breakpoint Implementation

```css
/* Mobile First (default) */
/* Styles for 0px - 767px */

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1280px) { }

/* Extra Large */
@media (min-width: 1536px) { }
```

### Responsive Component Behavior

| Component | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| Navigation | Bottom tabs | Bottom tabs | Sidebar + Top bar |
| Cards | 2 columns | 3-4 columns | 4-6 columns |
| Hero | Full width | Full width | Contained, larger |
| Video Player | Full width | Full width | Constrained, sidebar |
| Filters | Bottom sheet | Side panel | Side panel |
| Modal | Full screen | Centered, 90% | Centered, 600px max |

### Touch Target Sizes

| Size | Pixels | Usage |
|------|--------|-------|
| Minimum | 44x44px | All interactive elements |
| Recommended | 48x48px | Primary actions |
| Large | 56x56px | FAB, major CTAs |

### Responsive Typography

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| H1 | 30px | 36px | 42px |
| H2 | 24px | 28px | 32px |
| H3 | 20px | 22px | 24px |
| Body | 16px | 16px | 16px |
| Caption | 14px | 14px | 14px |

---

## 11. Animation & Motion

### Animation Principles

1. **Purposeful** — Every animation serves a function
2. **Quick** — Most under 300ms
3. **Smooth** — 60fps minimum, ease-out curves
4. **Subtle** — Enhance, never distract

### Animation Tokens

```css
:root {
  /* Durations */
  --duration-instant: 100ms;    /* Micro-interactions */
  --duration-fast: 150ms;       /* Small UI changes */
  --duration-normal: 250ms;     /* Standard transitions */
  --duration-slow: 400ms;      /* Major transitions */
  --duration-slower: 600ms;    /* Page transitions */

  /* Easings */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);      /* Most transitions */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);        /* Exit animations */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);  /* Combined */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful */
}
```

### Animation Usage Guide

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Hover lift | 150ms | ease-out | Card hover |
| Button press | 100ms | ease-in | Button click |
| Modal open | 250ms | ease-out | Dialogs |
| Modal close | 200ms | ease-in | Dialogs |
| Page transition | 400ms | ease-in-out | Route changes |
| Skeleton shimmer | 1500ms | linear | Loading |
| Toast enter | 300ms | ease-bounce | Notifications |
| Toast exit | 200ms | ease-in | Notifications |
| Slide up | 300ms | ease-out | Bottom sheets |
| Slide down | 250ms | ease-in | Bottom sheets |

### Micro-Interactions

| Interaction | Animation |
|-------------|-----------|
| Button tap | Scale to 0.97, then 1 |
| Like heart | Scale up + fill + particles |
| Vote cast | Progress fill + count increment |
| Points earned | Number counter + sparkle |
| Badge earned | Scale bounce + glow |
| Tab switch | Underline slide |
| Card hover | Y-translate -4px + shadow |
| Pull to refresh | Spinner rotation |
| Skeleton load | Shimmer sweep left-to-right |

### Page Transitions

```tsx
// Recommended page transition
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Duration: 400ms, ease-in-out
```

---

## 12. Accessibility

### WCAG 2.1 AA Compliance (Minimum)

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| Color contrast | 4.5:1 (text), 3:1 (large text) | Use semantic colors only |
| Touch targets | 44x44px minimum | All interactive elements |
| Focus visible | 2px ring, offset | Focus styles on all elements |
| Keyboard navigation | Full functionality | Tab order, Enter/Space |
| Screen reader | Semantic HTML | ARIA where needed |
| Reduced motion | Respect preference | `prefers-reduced-motion` |

### Focus States

```css
/* Always visible, never removed */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Remove for mouse users only */
:focus:not(:focus-visible) {
  outline: none;
}
```

### Semantic Structure

```html
<main>
  <header>Navigation</header>
  <section>
    <h1>Section Title</h1>
    <article>Content Card</article>
    <article>Content Card</article>
  </section>
  <aside>Related Content</aside>
  <footer>Links</footer>
</main>
```

### ARIA Guidelines

| Pattern | ARIA Attribute |
|---------|----------------|
| Tabs | `role="tablist"`, `role="tab"`, `aria-selected` |
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Accordion | `role="button"`, `aria-expanded` |
| Skip link | `href="#main-content"`, visually hidden until focused |
| Loading | `aria-busy="true"`, `aria-label` |
| Error | `aria-invalid="true"`, `aria-describedby` |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 13. Performance UX

### Performance Principles

1. **Perceived Speed** — Make the UI responsive before data loads
2. **Skeleton First** — Show structure immediately
3. **Progressive Loading** — Load visible content first
4. **Cancel Stale Requests** — Don't update with outdated data

### Loading Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  0ms    →    Render skeleton immediately                   │
│  100ms  →    First content paint                           │
│  500ms  →    Progressive content load                       │
│  2000ms →    Timeout warning (if slow connection)          │
│  5000ms →    Retry option (if failed)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Image Loading

```tsx
// Lazy load with blur placeholder
<Image
  src={content.thumbnail}
  placeholder="blur"
  blurDataURL={generateBlurHash(content.thumbnail)}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Virtual Scrolling

For lists > 50 items, use virtual scrolling to maintain 60fps.

### Skeleton Usage

| Content Type | Skeleton Treatment |
|--------------|-------------------|
| Card with image | Image placeholder + 2 text lines |
| User avatar | Circular skeleton |
| Video tile | 16:9 rectangle + overlay elements |
| Text content | 3-4 lines, varying widths |
| Stats | Number + label pairs |

---

## 14. Monetization UX Patterns

### Payment Flow Principles

1. **Transparent Pricing** — No hidden fees
2. **Clear Value** — What they're getting
3. **Minimal Friction** — Fewest steps possible
4. **Secure Feel** — Trust indicators
5. **Easy Recovery** — Failed payment handling

### Purchase Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. CONTENT_DISCOVERY                                      │
│     → "Unlock Premium Episode" banner                       │
│     → Shows preview/thumbnail                               │
│                                                             │
│  2. PRICING_PRESENTATION                                    │
│     → Single price, no confusion                            │
│     → "Best value" badge if relevant                        │
│     → Wallet balance shown                                  │
│                                                             │
│  3. CONFIRMATION                                            │
│     → Summary of purchase                                   │
│     → Price breakdown                                       │
│     → "Confirm Purchase" CTA                                │
│                                                             │
│  4. PROCESSING                                              │
│     → Loading state with progress                           │
│     → "Don't close this page"                               │
│                                                             │
│  5. SUCCESS                                                 │
│     → Celebration + receipt                                 │
│     → Immediate access to content                           │
│     → Cross-sell related content                            │
│                                                             │
│  6. FAILURE                                                 │
│     → Clear error message                                   │
│     → Retry option                                          │
│     → Alternative payment method                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Wallet Integration

| Location | Wallet Visibility |
|----------|-------------------|
| Header | Always visible (desktop) |
| Bottom nav | Always visible (mobile) |
| Content cards | Balance on hover/tap |
| Purchase flow | Auto-applied, toggle available |
| Transaction history | Full access |

### Subscription Patterns

| State | Treatment |
|-------|-----------|
| Free user | Upgrade prompts, trial offers |
| Trial | Days remaining, cancel anytime |
| Active | Next billing date, manage button |
| Past due | Payment update required |
| Cancelled | Reactivation offer |

### Pricing Display

```
┌─────────────────────────────────────────────────────────────┐
│  [Content Title]                                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   RENT      │  │    BUY      │  │  SUBSCRIBE  │        │
│  │   $3.99     │  │   $12.99    │  │   $9.99/mo  │        │
│  │  48 hours   │  │   Forever   │  │  All access │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 15. Reward & Engagement UX Patterns

### Points System Visibility

| Location | Points Display |
|----------|----------------|
| Header | Balance + trend arrow |
| Content cards | "Earn X points" badge |
| Purchase confirmation | Points earned |
| Reward page | Full history + breakdown |
| Profile | Lifetime points + level |

### Achievement System

```
┌─────────────────────────────────────────────────────────────┐
│  BADGE EARNED                                              │
│  ════════════════                                           │
│                                                             │
│       🏆                                                   │
│                                                             │
│  "First Vote"                                              │
│  You cast your first vote!                                 │
│                                                             │
│  +50 points                                                │
│                                                             │
│  [Share]  [View Rewards]                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Streak System

| Streak | Visual Treatment |
|--------|------------------|
| Day 1-6 | Fire icon, count display |
| Day 7 (Week) | Week complete animation, bonus |
| Day 30 (Month) | Celebration, special badge |
| Break | "Streak lost" message, recovery option |

### Mission System

```
┌─────────────────────────────────────────────────────────────┐
│  TODAY'S MISSIONS                                          │
│  ══════════════════                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Watch]  Watch 30 minutes           ████████░░ 80%  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Vote]   Cast 3 votes                 ██████░░░░ 66%  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Share]  Share content              ░░░░░░░░░░░ 0%   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Progress: 2/3 complete → +100 bonus points                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Engagement Loop

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ┌─────────┐                                             │
│     │  WATCH  │                                             │
│     └────┬────┘                                             │
│          │                                                  │
│          ▼                                                  │
│     ┌─────────┐     ┌─────────┐     ┌─────────┐            │
│     │  VOTE   │────▶│  EARN   │────▶│  SPEND  │            │
│     └─────────┘     └────┬────┘     └────┬────┘            │
│                          │               │                  │
│                          ▼               │                  │
│                     ┌─────────┐           │                  │
│                     │ RETURN  │◀──────────┘                  │
│                     └─────────┘                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Card

### Design Token Summary

```css
/* Colors */
--color-primary: #6366F1;
--color-secondary: #EC4899;
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
--bg-primary: #111827;
--bg-secondary: #1F2937;
--text-primary: #F3F4F6;

/* Spacing */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;  /* 24px */
--space-8: 2rem;    /* 32px */

/* Typography */
--text-sm: 0.875rem;
--text-base: 1rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
```

### Must-Have for Every Screen

- [ ] Loading state (skeleton)
- [ ] Empty state (illustration + CTA)
- [ ] Error state (message + retry)
- [ ] Success state (confirmation)
- [ ] Touch targets ≥ 44px
- [ ] Focus states (keyboard nav)
- [ ] Responsive at all breakpoints

---

**End of Design System & UI/UX Guide**
