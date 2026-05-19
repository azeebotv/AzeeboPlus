# Azeebo+ Mobile App Steering

**Version:** 1.0
**Last Updated:** April 23, 2026

---

## Technology Stack

| Component | Technology | Enforcement |
|-----------|-----------|-------------|
| Framework | React Native + Expo | MUST |
| Language | TypeScript | MUST |
| State Management | React Query + Zustand | SHOULD |
| Navigation | Expo Router | MUST |

---

## App Overview

Azeebo+ mobile app is a premium, modular, mobile-first digital platform that supports multiple universes inside one shared app shell.

### Core Product Concept

Azeebo+ is NOT one flat app. It is:
- One shared app shell
- One shared navigation system
- One shared wallet / rewards logic
- One shared identity system
- Multiple experience universes inside the same ecosystem

---

## The 8 Universes

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

### Bottom Navigation (Persistent)

| Tab | Purpose |
|-----|---------|
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

### Watch Section Universe Switcher

Inside Watch, users can switch between:
- Reality
- Creators
- Lifestyle
- Vertical
- Movies
- Games
- Comedy
- Sports

---

## Core Experience Flow

```
Home → Watch / Create → Participate / Consume → Spend / Earn → Reward → Return
```

### Key Product Loops

- Watch loop
- Creator loop
- Payment loop
- Reward loop
- Re-entry loop

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

- Mobile-first
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

- Bottom navigation bar
- Top app bar
- Universe switcher
- Tab bars
- Segmented controls

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

## Key Screens

### Home Screen

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

**UX Goal:** Make users feel there is always something happening

### Watch Hub

**Sections:**
- Universe switcher at top
- Featured hero
- Rails by category
- Trending and recommended content
- Premium content block

### Reality Universe Home

**Sections:**
- Live now
- Vote now
- Featured shows
- Current contestants
- Trending clips
- Predictions
- Leaderboard snapshot
- Premium extras

**UX Goal:** Drive urgency, participation, and emotional heat

### Creator Universe Home

**Sections:**
- Featured creators
- Trending uploads
- Creator categories
- Challenge prompts
- Earn as a creator
- Creator tools CTA
- Top monetizing creators
- Recommended creators

**UX Goal:** Make the platform feel creator-positive and opportunity-rich

### Lifestyle Universe Home

**Sections:**
- Featured culture story
- Music rail
- Celebrity rail
- Nightlife / city guide
- Relationships / gist rail
- Events near you
- Influencer features
- Premium club content

**UX Goal:** Create fresh daily return behavior

### Vertical Universe Home

**Sections:**
- Universe hero banner
- Layered / world map
- Featured titles
- Latest episodes
- Character spotlight
- Lore explorer
- Recaps
- Crossover tracker

**UX Goal:** Create immersion, theory-building, and fandom depth

### Movie Universe Home

**Sections:**
- Featured premiere
- New releases
- Coming soon
- Rentals / passes
- Watchlist
- Recommendations
- Premium screenings
- Special access events

**UX Goal:** Make film access feel premium and transaction-worthy

### Games Universe Home

**Sections:**
- Featured game
- Daily challenge
- Trivia categories
- High scores
- Tournaments
- Rewards summary
- Play now CTA

**UX Goal:** Create fast repeat-entry behavior

### Comedy Universe Home

**Sections:**
- Trending skits
- Featured comedians
- Stand-up bites
- Creator comedy clips
- Comedy challenge prompt
- Share rail
- Premium comedy specials

**UX Goal:** Support mass repeat viewing and shareability

### Sports Universe Home

**Sections:**
- Featured sports moment
- Highlights
- Predictions
- Contests
- Fan boards
- Fixtures / upcoming events
- Leaderboard

**UX Goal:** Drive recurring passion-led return behavior

### Rewards Home

**Sections:**
- Points balance
- User level
- Active missions
- Badges
- Streak tracker
- Reward redemption options
- Milestone cards

**UX Goal:** Make progress and reward feel highly visible

### Wallet / Payment Flow

**Sections:**
- Current wallet balance
- Funding CTA
- Payment method
- Item summary
- Price breakdown
- Confirm payment
- Success state

**UX Goal:** Trustworthy, clean, and low-friction conversion

### Profile

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

### Allowed File Types

| Type | Extensions | Max Size |
|------|-----------|----------|
| Image | jpg, png, webp | 50MB |
| Video | mp4, webm | 500MB |
| Audio | mp3, aac | 100MB |
| Document | pdf | 50MB |

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

### Loading Optimization

- Lazy load screens
- Paginate content lists
- Cache frequently accessed data
- Use skeleton loaders
- Optimize images

### Offline Support

- Cache last viewed content
- Show offline indicator
- Queue actions for sync
- Handle network errors gracefully

---

## Accessibility

- WCAG 2.1 AA compliance
- Screen reader support
- Minimum touch target size (44x44)
- Color contrast requirements
- Focus management

---

## Prohibited Actions

- No storing secrets in AsyncStorage
- No client-side payment verification
- No hardcoded pricing
- No trusting frontend validation alone
- No bypassing shared services
