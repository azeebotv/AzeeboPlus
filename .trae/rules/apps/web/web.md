# Azeebo+ Web App Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Technology Stack

| Component | Technology | Enforcement |
|-----------|-----------|-------------|
| Framework | Next.js | MUST |
| Language | TypeScript | MUST |
| UI Library | Component-driven architecture | MUST |
| State Management | React Query + Context | SHOULD |
| Styling | Design tokens + CSS Modules or Tailwind | MUST |

---

## Web App Overview

The Azeebo+ web app provides the same modular entertainment experience as mobile, optimized for desktop and web browsers. It shares the same design system, API layer, and business logic.

---

## Shared Principles with Mobile

### Core Product Concept

Azeebo+ is NOT one flat app. It is:
- One shared app shell
- One shared navigation system
- One shared wallet / rewards logic
- One shared identity system
- Multiple experience universes

### The 8 Universes

1. **Reality Universe** - Reality shows, voting, predictions
2. **Creator Universe** - Creator discovery, uploads, earnings
3. **Lifestyle Universe** - Youth culture, events, nightlife
4. **Vertical Universe** - Premium storyworld, lore, characters
5. **Movie Universe** - Digital cinema, rentals, premieres
6. **Games Universe** - Challenges, trivia, tournaments
7. **Comedy Universe** - Viral skits, stand-up clips
8. **Sports Universe** - Predictions, highlights, fan boards

---

## Navigation Structure

### Primary Navigation

| Section | Purpose |
|---------|---------|
| Home | Main daily entry point |
| Watch | Content browsing across universes |
| Create | Creator tools and uploads |
| Rewards | Points, badges, missions |
| Profile | User identity and settings |

### Top-Bar Utilities

- Search
- Notifications
- Wallet access
- Profile shortcut
- Optional live indicator

### Universe Switcher

Inside Watch, users can switch between universes with a tabbed or sidebar interface.

---

## Responsive Design

### Breakpoints

| Breakpoint | Min Width | Target |
|------------|-----------|--------|
| Mobile | 0px | Phones |
| Tablet | 768px | Tablets |
| Desktop | 1024px | Laptops |
| Large | 1440px | Desktops |

### Mobile-First Approach

- Design for mobile first
- Progressive enhancement for larger screens
- Touch-friendly on all sizes
- Responsive images and media

---

## Screen Requirements

### Every Screen MUST Include

- Loading state
- Empty state
- Error state
- Success state
- Retry option

### Screen States

| State | Purpose |
|-------|---------|
| Loading | Show skeleton or spinner |
| Empty | Guide user to action |
| Error | Explain issue, offer retry |
| Success | Confirm action completed |
| No Internet | Offline indicator |

---

## Design System

### Brand Feel

The UI should feel:
- Premium
- Modern
- Cinematic
- Youthful
- Culturally alive
- Bold
- Immersive
- Commercially intelligent

### Visual Direction

- Dark and light compatible
- Rich cards
- Strong hero imagery
- Modular rails
- Bold typography
- Layered content hierarchy
- Strong visual contrast
- Clear monetization cues
- Visible rewards cues

### Core UI Principles

- Mobile-first design
- High clarity
- Low friction
- Visually rich but not cluttered
- Reusable component logic
- Strong CTA hierarchy
- Monetization visibility without feeling spammy
- Smooth content browsing
- Clear separation of universes

---

## Core Components

### Navigation Components

- Top navigation bar
- Universe switcher
- Tab bars
- Segmented controls
- Sidebar (desktop)

### Content Containers

- Hero cards
- Content cards
- Show cards
- Creator cards
- Video tiles
- Highlight rails
- Feature banners

### Participation Components

- Vote cards
- Supervote cards
- Prediction cards
- Entry cards
- Challenge cards
- Reward cards

### Monetization Components

- Wallet balance card
- Purchase selector
- Payment CTA block
- Transaction success card
- Premium unlock card
- Pass / rental card

### Trust / Utility Components

- Badges
- Profile chips
- Verification marks
- Progress bars
- Leaderboards
- Filters
- Toasts
- Modals
- Bottom sheets

---

## Key Pages

### Home Page

**Sections:**
- Greeting + search + notifications
- Wallet summary / rewards access
- Hero Banner
- What's Hot Now
- Continue Watching
- Featured Universes
- Challenge of the Day
- Live / Trending Now
- Rewards Strip

### Watch Hub

**Sections:**
- Universe switcher
- Featured hero
- Rails by category
- Trending and recommended content
- Premium content block

### Universe Pages

Each universe has its own landing page with universe-specific content and features.

### Rewards Page

**Sections:**
- Points balance
- User level
- Active missions
- Badges
- Streak tracker
- Reward redemption options

### Wallet / Payment Flow

**Sections:**
- Current wallet balance
- Funding CTA
- Payment method
- Item summary
- Price breakdown
- Confirm payment
- Success state

### Profile Page

**Sections:**
- Profile image
- Name / bio
- Watched content
- Rewards
- Wallet history
- Creator tools if applicable
- Settings
- Account status

---

## SEO & Metadata

### Requirements

- Unique title per page
- Meta descriptions
- Open Graph tags
- Twitter cards
- Structured data (JSON-LD)
- Canonical URLs

### Performance

- Server-side rendering (SSR) for public pages
- Static generation where possible
- Image optimization
- Code splitting
- Lazy loading

---

## Security Boundaries

### Frontend MUST NOT

- Store secrets
- Verify payments
- Enforce permissions alone
- Hardcode pricing
- Trust user input without validation

### All Sensitive Logic MUST Be Server-Side

- Payment verification
- Permission checks
- Price validation
- Wallet operations
- Authentication decisions

---

## Media Handling

### Premium Media

- MUST use signed URLs (time-limited)
- URLs MUST expire (15-60 min)
- Storage paths MUST NOT be public
- Direct S3 access MUST be blocked

### Public Media

- Use CDN with caching
- Implement rate limiting
- Monitor bandwidth usage

### Upload Validation

- Verify MIME type
- Check file size (max 500MB)
- Validate file headers
- Reject executable files

---

## Analytics Events

### Event Naming Convention

Event names MUST use `snake_case`:
```
✅ user_signup_completed
✅ content_view_started
✅ payment_processed
❌ userSignupCompleted
❌ ContentViewStarted
```

### Required Events

| Stage | Event | Data |
|-------|-------|------|
| View | `{action}_viewed` | user_id, timestamp |
| Submit | `{action}_submitted` | user_id, data |
| Success | `{action}_completed` | user_id, result |
| Failure | `{action}_failed` | user_id, error |

### Standard Event Types

- `screen_view`
- `content_impression`
- `content_click`
- `play_start`
- `play_complete`
- `vote_initiated`
- `vote_completed`
- `payment_initiated`
- `payment_success`
- `payment_failure`
- `reward_earned`
- `reward_redeemed`
- `creator_followed`
- `creator_tipped`
- `prediction_submitted`
- `game_started`
- `game_completed`
- `share_initiated`
- `notification_opened`

### Event Envelope

Every event should include:
- `user_id`
- `session_id`
- `platform`
- `universe`
- `content_id` (if relevant)
- `timestamp`
- `device info`
- `app version`
- `experiment flags` (if any)

### Analytics MUST NOT Include

- Secrets or API keys
- Passwords or tokens
- PII (unless anonymized)
- Payment details

---

## Performance Guidelines

### Core Web Vitals

- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

### Optimization

- Server-side rendering for initial load
- Code splitting by route
- Image optimization (Next.js Image)
- Font optimization
- Lazy loading components
- Caching strategies

### Loading States

- Skeleton loaders for content
- Progressive image loading
- Optimistic UI updates
- Streaming for large content

---

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast requirements
- Alt text for images
- ARIA labels where needed

---

## Prohibited Actions

- No storing secrets in localStorage
- No client-side payment verification
- No hardcoded pricing
- No trusting frontend validation alone
- No bypassing shared services
