# AZEEBO+ Missing Pages Analysis

**Generated:** 2026-06-02
**Source:** Compared `/Pages.md` (80 page specs) against actual implementations in `apps/mobile` and `apps/web`.
**Previous Analysis:** `docs/miss-pages.md` (outdated — reported 48 missing; most have since been implemented)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Pages Specified in Pages.md | 80 |
| Pages Implemented (Mobile) | 52+ unique routes |
| Pages Implemented (Web) | 74+ unique routes |
| **Truly Missing Pages** | **3** |

The project has made significant progress since the last analysis. **45 of the originally 48 missing pages** have been implemented across both platforms. Only **3 standalone pages** remain unimplemented.

---

## IMPLEMENTED PAGES (Previously Reported as Missing)

The following pages were listed as missing in `docs/miss-pages.md` but have **since been implemented**:

### Authentication & Onboarding
| Page | Mobile Route | Web Route |
|------|-------------|-----------|
| Page 6 — Reset Password | `(auth)/reset-password.tsx` | `auth/reset-password/page.tsx` |
| Page 7 — Profile Setup | `(auth)/profile-setup.tsx` | `auth/profile-setup/page.tsx` |

### Reality Universe
| Page | Mobile Route | Web Route |
|------|-------------|-----------|
| Page 19 — Episodes | `(reality)/episodes.tsx` | `reality/episodes/page.tsx` |
| Page 20 — Episode Player | `(reality)/episode.tsx` | `reality/episode/page.tsx` |
| Page 21 — Contestant Profile | `(reality)/contestant.tsx` | `reality/contestant/page.tsx` |
| Page 23 — Super Vote | `(reality)/super-vote.tsx` | `reality/super-vote/page.tsx` |
| Page 25 — Prediction Results | `predictions/[predictionId]/results.tsx` | `predictions/[predictionId]/results/page.tsx` |
| Page 26 — Leaderboard | `leaderboard.tsx` | `leaderboard/page.tsx` |
| Page 27 — Rankings | `rankings.tsx` | `rankings/page.tsx` |
| Page 29 — Live Chat | `reality/[showId]/live-chat.tsx` | *(component within live show)* |
| Page 30 — Results | `(reality)/results.tsx` | `reality/results/page.tsx` |

### Creator Ecosystem
| Page | Mobile Route | Web Route |
|------|-------------|-----------|
| Page 33 — Content Manager | `(creator)/content-manager.tsx` | `creator/content-manager/page.tsx` |
| Page 34 — Drafts | `(creator)/drafts.tsx` | `creator/drafts/page.tsx` |
| Page 35 — Published Content | `(creator)/published.tsx` | `creator/published/page.tsx` |
| Page 36 — Scheduled Posts | `(creator)/scheduled.tsx` | `creator/scheduled/page.tsx` |
| Page 37 — Creator Analytics | `(creator)/analytics.tsx` | `creator/analytics/page.tsx` |
| Page 38 — Audience Insights | *(within analytics)* | *(within creator analytics)* |
| Page 39 — Earnings Dashboard | `(creator)/earnings.tsx` | `creator/earnings/page.tsx` |
| Page 40 — Monetization Settings | `(creator)/monetization.tsx` | `creator/monetization/page.tsx` |
| Page 41 — Creator Profile | `(creator)/profile.tsx` | `creator/profile/page.tsx` |

### Wallet & Financial
| Page | Mobile Route | Web Route |
|------|-------------|-----------|
| Page 43 — Add Funds | `(tabs)/wallet/add-funds.tsx` | `wallet/add-funds/page.tsx` |
| Page 44 — Withdraw Funds | `(tabs)/wallet/withdraw.tsx` | `wallet/withdraw/page.tsx` |
| Page 45 — Transactions | `(tabs)/transactions.tsx` | `wallet/transactions/page.tsx` |
| Page 46 — Transaction Details | `transactions/[transactionId].tsx` | `wallet/transactions/[transactionId]/page.tsx` |

### Rewards & Engagement
| Page | Mobile Route | Web Route |
|------|-------------|-----------|
| Page 48 — Referral System | `(tabs)/referral.tsx` | `referral/page.tsx` |
| Page 49 — Subscription Plans | `(tabs)/wallet/subscription-plans.tsx` | `wallet/subscription-plans/page.tsx` |
| Page 50 — Premium Access | `premium.tsx` | `premium/page.tsx` |

### Community & Social
| Page | Mobile Route | Web Route |
|------|-------------|-----------|
| Page 56 — Recommendations | `recommendations.tsx` | `recommendations/page.tsx` |
| Page 57 — Messages | `messages.tsx` | `messages/page.tsx` |

### User Settings
| Page | Mobile Route | Web Route |
|------|-------------|-----------|
| Page 59 — Edit Profile | `(tabs)/profile/edit.tsx` | `profile/edit/page.tsx` |
| Page 61 — Privacy & Security | `(tabs)/profile/privacy-security.tsx` | `profile/privacy-security/page.tsx` |
| Page 62 — Device Management | `settings/devices.tsx` | `settings/devices/page.tsx` |

### Admin Pages (Web Only)
| Page | Web Route |
|------|-----------|
| Page 67 — Creator Management | `admin/creators/page.tsx` |
| Page 69 — Financial Monitoring | `admin/financial/page.tsx` |
| Page 70 — Reports & Analytics | `admin/reports/page.tsx` |
| Page 71 — Reality Management | `admin/reality/page.tsx` |
| Page 72 — System Settings | `admin/settings/page.tsx` |
| Page 73 — Audit Logs | `admin/audit-logs/page.tsx` |
| Page 74 — Announcement Center | `admin/announcements/page.tsx` |
| Page 75 — Notification Management | `admin/notifications/page.tsx` |
| Page 76 — Payment Gateway Settings | `admin/payment-gateways/page.tsx` |
| Page 77 — Wallet Management | `admin/wallets/page.tsx` |
| Page 78 — Content Review Queue | `admin/content-review/page.tsx` |
| Page 79 — Engagement Monitoring | `admin/engagement/page.tsx` |
| Page 80 — Platform Overview | `admin/overview/page.tsx` |

---

## MISSING PAGES (Still Not Implemented)

Only **3 pages** from Pages.md remain unimplemented as standalone pages:

---

### 1. Page 8 — Role Selection

| Field | Detail |
|-------|--------|
| **Pages.md Reference** | Lines 110-122 |
| **Status** | Missing in both mobile and web |
| **Priority** | MEDIUM |
| **Category** | Authentication & Onboarding |
| **Estimated Complexity** | Low (2-3 hours per platform) |

**Description:**
Post-registration screen allowing users to select their role: Regular User, Creator, or Both. This affects the app experience, navigation, and available features.

**Key Components (from Pages.md):**
- AZEEBO+ Logo
- Role Selection Headline & Description Text
- Regular User Card / Option
- Creator Option / Card
- Both Option / Card
- Select Button per Role
- Info Icon / Tooltip
- Skip/Change Later Link
- Continue Button

**Current State:**
- Mobile: A `role-selection` route is registered in `(auth)/_layout.tsx` (`<Stack.Screen name="role-selection" />`) but **no corresponding file exists** (`apps/mobile/app/(auth)/role-selection.tsx` is missing)
- Web: No route or page exists for role selection
- Note: A `creator-signup.tsx` exists on mobile which partially covers the creator role flow

**Dependencies:**
- Page 3 — Register (feeds into this page)
- Page 7 — Profile Setup (follows after role selection)
- `POST /auth/role` API endpoint (creator-service)

**Implementation Tasks:**
1. Create `apps/mobile/app/(auth)/role-selection.tsx` — the layout route already exists
2. Create `apps/web/src/app/auth/role-selection/page.tsx`
3. Add role selection API call to auth API module
4. Wire navigation flow: Register → Role Selection → Profile Setup → Home

**Potential Challenges:**
- Route is already registered in mobile _layout but file is missing — will cause runtime error
- Need to handle "Both" role which combines user + creator experiences
- Must persist role selection to backend and local state

**Convention References:**
- Mobile: Follow pattern in `(auth)/profile-setup.tsx` (card-based selection UI)
- Web: Follow pattern in `auth/profile-setup/page.tsx` (Tailwind, client component)

---

### 2. Page 11 — Trending Now

| Field | Detail |
|-------|--------|
| **Pages.md Reference** | Lines 162-175 |
| **Status** | Missing as standalone page in both mobile and web |
| **Priority** | MEDIUM |
| **Category** | Core Navigation & Discovery |
| **Estimated Complexity** | Medium (4-6 hours per platform) |

**Description:**
Dedicated trending content page with time-based filters (Today/Week/Month/All-time) and universe filter tabs. Shows trending content with trend indicators and position changes.

**Key Components (from Pages.md):**
- Top App Bar
- Trending Now Headline
- Time Filter (Today / Week / Month / All-time)
- Universe Filter Tabs
- Trending Content List
- Content Card (Thumbnail, Title, Creator, Views)
- Trend Indicator (Arrow, position change)
- Refresh Button
- View Details CTA per Item
- Empty State / Loading State
- Bottom Navigation

**Current State:**
- Mobile: Trending content exists as a **section within** `(tabs)/home.tsx` and `(tabs)/watch.tsx`, but no dedicated standalone page
- Web: No dedicated trending page; trending content appears within home and watch pages
- API: `contentApi.getTrendingContent()` already exists and is used in home screen

**Dependencies:**
- Page 9 — Home (currently hosts trending section)
- Page 10 — Watch Hub (currently shows trending rail)
- `GET /content/trending` API endpoint (content-service)
- Universe filter data from content-service

**Implementation Tasks:**
1. Create `apps/mobile/app/trending.tsx` (or `(tabs)/trending.tsx` if adding as a tab)
2. Create `apps/web/src/app/trending/page.tsx`
3. Extend `getTrendingContent` API to support time filters and universe tabs
4. Build `TimeFilterTabs` component (Today/Week/Month/All-time)
5. Build `TrendingContentCard` with trend indicator arrows
6. Add pull-to-refresh on mobile, refresh button on web
7. Add navigation entry points (link from Home trending section, bottom nav, or watch page)

**Potential Challenges:**
- Need to decide if this is a separate tab in bottom navigation or a navigable page
- Time-based filtering requires backend support for time window queries
- Trend position indicators (up/down arrows) need historical ranking data
- Must handle empty states gracefully when no trending content exists for a time period

**Convention References:**
- Mobile: Follow list pattern in `(tabs)/search.tsx` (FlatList with cards)
- Web: Follow grid pattern in `browse/page.tsx` (Tailwind grid layout)
- Use existing `ContentCard` components from home screen

---

### 3. Page 16 — Recently Watched

| Field | Detail |
|-------|--------|
| **Pages.md Reference** | Lines 245-262 |
| **Status** | Missing as standalone page in both mobile and web |
| **Priority** | MEDIUM |
| **Category** | Core Navigation & Discovery |
| **Estimated Complexity** | Medium (4-5 hours per platform) |

**Description:**
Dedicated watch history page showing recently viewed content in chronological order with progress bars for incomplete content, resume functionality, and time group headers.

**Key Components (from Pages.md):**
- Top App Bar
- Recently Watched Headline
- Clear History Button
- Chronological List View
- Watch History Item (Thumbnail, Title, Creator, Time Watched)
- Progress Bar (if incomplete)
- Resume / Watch Again CTA
- Remove from History Icon
- Time Group Headers (Today / Yesterday / Last Week / etc.)
- Empty State / Loading State
- Bottom Navigation

**Current State:**
- Mobile: Watch history exists as a **section within** `(tabs)/library.tsx` (line 105: "No watch history" empty state), but no dedicated standalone page
- Web: Watch history exists as a **section within** `library/page.tsx` (lines 170-244: "Watch History" section), but no dedicated standalone page
- API: Watch history tracking likely exists in content-service for the library page

**Dependencies:**
- Page 15 — Saved Content / Library (currently hosts watch history section)
- `GET /watch/history` API endpoint (content-service)
- `DELETE /watch/history/:id` (remove from history)
- `DELETE /watch/history` (clear all history)
- Content playback progress tracking

**Implementation Tasks:**
1. Create `apps/mobile/app/recently-watched.tsx` (or `(tabs)/recently-watched.tsx`)
2. Create `apps/web/src/app/library/recent/page.tsx`
3. Implement time-grouped list (Today / Yesterday / Last Week / Older)
4. Add progress bar component for incomplete content
5. Add resume playback functionality (deep link to player with timestamp)
6. Add swipe-to-remove on mobile, remove button on web
7. Add clear all history with confirmation dialog
8. Add navigation entry from library page ("See All" link) and profile menu

**Potential Challenges:**
- Resume playback requires storing playback position per content item
- Time grouping logic needs timezone handling (WAT - West Africa Time)
- History data may grow large — needs pagination or virtual scrolling
- Must handle privacy: some users may not want watch history visible
- Need to decide if this replaces the library section or complements it

**Convention References:**
- Mobile: Follow list pattern in `(tabs)/library.tsx` (FlatList with sections)
- Web: Follow pattern in `library/page.tsx` (Tailwind list with cards)
- Use existing content thumbnail components

---

## PRIORITY BREAKDOWN

All 3 remaining pages are **MEDIUM priority** — they enhance the user experience but are not blocking core functionality since partial implementations exist within other pages.

| Priority | Pages | Estimated Total Effort |
|----------|-------|----------------------|
| HIGH | 0 pages | — |
| MEDIUM | 3 pages (8, 11, 16) | 10-14 hours per platform |
| LOW | 0 pages | — |

---

## RECOMMENDED IMPLEMENTATION ORDER

### Step 1: Page 8 — Role Selection (Quick Win)
- **Effort:** 2-3 hours per platform
- **Why first:** A missing file is already registered in the mobile router (`_layout.tsx`), which could cause runtime errors. This is the fastest to implement and unblocks the onboarding flow.
- **Approach:**
  1. Create mobile `role-selection.tsx` matching the existing auth screen patterns
  2. Create web `role-selection/page.tsx` using Tailwind
  3. Wire up the `POST /auth/role` endpoint
  4. Test the full onboarding flow: Welcome → Register → OTP → Role Selection → Profile Setup → Home

### Step 2: Page 11 — Trending Now
- **Effort:** 4-6 hours per platform
- **Why second:** Leverages existing `getTrendingContent` API and content card components. The trending section already exists in Home — this extracts and expands it into a full page.
- **Approach:**
  1. Create standalone page with time filters
  2. Extend API for time-based filtering
  3. Add trend indicators (position change arrows)
  4. Add "See All Trending" link from Home trending section

### Step 3: Page 16 — Recently Watched
- **Effort:** 4-5 hours per platform
- **Why third:** Watch history data already exists in the library page. This extracts and enhances it with time grouping and resume playback.
- **Approach:**
  1. Create standalone page with time-grouped headers
  2. Add progress bars and resume functionality
  3. Add clear history and remove individual items
  4. Add "See All" link from library watch history section

---

## IMPLEMENTATION CONVENTIONS

### Mobile App
- **File location:** `apps/mobile/app/[route].tsx`
- **Framework:** React Native + Expo Router
- **Styling:** `StyleSheet.create()` with design tokens from `@azeebo/design-tokens`
- **Color scheme:** Dark primary (`#111827` bg, `#8B5CF6` primary)
- **State:** React hooks + Context API
- **API calls:** Typed modules in `apps/mobile/src/api/`

### Web App
- **File location:** `apps/web/src/app/[route]/page.tsx`
- **Framework:** Next.js 14 App Router
- **Styling:** Tailwind CSS with design tokens
- **Directives:** `'use client'` only when needed
- **API calls:** Typed modules in `apps/web/src/lib/api.ts`

### Shared Patterns
- All pages implement: loading state, error state, empty state, success state
- Currency: ₦ NGN format
- Timezone: WAT (West Africa Time)
- Phone format: +234
- Languages: EN / YO / HA / IG

---

## RELATED DOCUMENTATION

- [Pages.md](./Pages.md) — Complete page specifications
- [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) — Detailed implementation plans with code samples
- [docs/miss-pages.md](./docs/miss-pages.md) — Previous analysis (outdated)
- [todo.md](./todo.md) — Project task tracking
- [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) — Database schema reference
- [docs/API_ROUTE_MAP.md](./docs/API_ROUTE_MAP.md) — API endpoint reference

---

*Last Updated: 2026-06-02*
*Analysis Method: File glob comparison of `apps/mobile/app/**/*.tsx` (88 files) and `apps/web/src/app/**/page.tsx` (74 files) against Pages.md specifications*
