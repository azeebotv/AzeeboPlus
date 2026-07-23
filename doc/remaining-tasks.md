# Remaining Tasks — Azeebo+ Platform

> Generated: 2026-07-22
> Status: Backend services complete for all universes. Mobile app only has Vertical/Agbala screens. Deployment, monitoring, and cross-platform tasks remain.

---

## Summary

| Category | Total | Can Code Now | Requires Runtime |
|----------|-------|--------------|------------------|
| Mobile App — Foundation | 8 | 8 | 0 |
| Mobile App — Universe Screens | 7 | 7 | 0 |
| Web App — Decommission | 4 | 4 | 0 |
| Admin/Creator Standalone Fixes | 4 | 4 | 0 |
| Agbala Deployment | 12 | 0 | 12 |
| Platform-Wide — CI/CD | 4 | 4 | 0 |
| Platform-Wide — Monitoring | 7 | 0 | 7 |
| Platform-Wide — Analytics | 4 | 0 | 4 |
| Platform-Wide — Accessibility | 7 | 0 | 7 |
| Platform-Wide — Performance | 8 | 0 | 8 |
| Platform-Wide — Testing | 7 | 0 | 7 |
| Platform-Wide — Documentation | 3 | 3 | 0 |
| **Total** | **75** | **37** | **38** |

---

## Phase 0 — Mobile App Foundation (P0)

> The mobile app has 89 screens across all universes. Core shell is implemented.

### M0.1 — Bottom Navigation Shell
- **Status:** `[x]` DONE
- **Priority:** P0
- **Description:** Build bottom tab bar (Home, Watch, Create, Rewards, Profile) per platform spec §9.1
- **AC:** 5 tabs render; active state highlighting; navigation works

### M0.2 — Top Bar Utilities
- **Status:** `[x]` DONE
- **Priority:** P0
- **Description:** Search, notifications bell, wallet balance shortcut in top bar
- **AC:** All utilities render and navigate correctly

### M0.3 — Universe Switcher
- **Status:** `[x]` DONE
- **Priority:** P0
- **Description:** Horizontal scrollable universe switcher within Watch tab (Reality, Creators, Lifestyle, Vertical, Movies, Games, Comedy, Sports)
- **AC:** All 8 universes listed; tapping switches content view

### M0.4 — Auth Flow Screens
- **Status:** `[x]` DONE
- **Priority:** P0
- **Description:** Login, Register, OTP Verification, Forgot Password, Profile Setup, Role Selection
- **AC:** Full auth flow works end-to-end with gateway

### M0.5 — Profile Screen
- **Status:** `[x]` DONE
- **Priority:** P0
- **Description:** Profile home, edit profile, settings, watch history, saved items
- **AC:** All sections render with real data

### M0.6 — Wallet/Payment Screens
- **Status:** `[x]` DONE
- **Priority:** P0
- **Description:** Wallet balance, add funds, transactions list, payment confirmation, withdraw
- **AC:** Wallet flow works with payment-service

### M0.7 — Rewards Screen
- **Status:** `[x]` DONE
- **Priority:** P0
- **Description:** Points balance, user level, missions, badges, streak, redemption options
- **AC:** Rewards data loads from reward-service

### M0.8 — Notifications Screen
- **Status:** `[x]` DONE
- **Priority:** P0
- **Description:** Notification center, push token registration, mark as read
- **AC:** Notifications load; push tokens register

---

## Phase 0B — Mobile Universe Screens (P1)

> Each universe has core screens in the mobile app. All 90 screens verified.

### M1.1 — Reality Universe Screens
- **Status:** `[x]` DONE
- **Priority:** P1
- **Description:** Reality Hub, Show Page, Episode Detail, Vote Screen, Supervote Flow, Prediction Page, Leaderboard
- **Depends:** M0.1-M0.3

### M1.2 — Creator Universe Screens (Mobile)
- **Status:** `[x]` DONE
- **Priority:** P1
- **Description:** Creator Hub, Creator Profile, Upload Flow, Creator Dashboard, Earnings, Analytics
- **Depends:** M0.1-M0.3

### M1.3 — Lifestyle Universe Screens
- **Status:** `[x]` DONE
- **Priority:** P1
- **Description:** Lifestyle Feed, Events, City Guide, Celebrity, Nightlife, Music, Influencers, Challenges, Polls, Quizzes
- **Depends:** M0.1-M0.3

### M1.4 — Movie Universe Screens
- **Status:** `[x]` DONE
- **Priority:** P1
- **Description:** Movie Home, Film Detail, Premiere Page, Watchlist, Passes/Rentals, Library
- **Depends:** M0.1-M0.3

### M1.5 — Games Universe Screens
- **Status:** `[x]` DONE
- **Priority:** P1
- **Description:** Games Home, Daily Challenge, Trivia, Gameplay, Leaderboard, Tournaments
- **Depends:** M0.1-M0.3

### M1.6 — Comedy Universe Screens
- **Status:** `[x]` DONE
- **Priority:** P1
- **Description:** Comedy Feed, Clip Player, Comedian Profile, Comedy Challenges, Specials
- **Depends:** M0.1-M0.3

### M1.7 — Sports Universe Screens
- **Status:** `[x]` DONE
- **Priority:** P1
- **Description:** Sports Home, Highlights, Predictions, Fan Contests, Fixtures, Leaderboard
- **Depends:** M0.1-M0.3

---

## Phase 1 — Web App Decommission (P2)

> Admin and creator dashboards now live in standalone apps. Web copies should redirect.

### W1.1 — Decommission Web Admin Dashboard
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Remove `apps/web/src/app/admin/*`, `AdminLayout.tsx`, admin API methods. Redirect `/admin*` to admin host.
- **Depends:** Admin standalone app verified in staging

### W1.2 — Decommission Web Creator Dashboard
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Remove `apps/web/src/app/creators/dashboard/*`. Redirect to creator host.
- **Depends:** Creator standalone app verified in staging

### W1.3 — Add Missing Universe Detail Pages (Web)
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Add detail pages for lifestyle events, comedy clips, game sessions, sports fixtures, movie detail

### W1.4 — Verify Real-Time Messaging (Web)
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Verify WebSocket messaging works in web app with messaging-service

---

## Phase 2 — Admin/Creator Standalone Fixes (P2)

### A2.1 — Admin: Verify superadmin Role
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** All admin controllers should accept `@Roles('admin', 'superadmin')`

### A2.2 — Admin: Verify Settings Endpoints
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Confirm `GET/PUT admin/settings` exists in admin backend

### A2.3 — Creator: Verify Subscriber Count
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Confirm subscriber count is backed by real data (not swallowed error)

### A2.4 — Creator: Verify Settings Endpoint
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Confirm `GET/PUT creator/settings` was added

---

## Phase 3 — Agbala Deployment (P0 — Runtime Required)

> All code is complete. These tasks require running services in staging/production.

### D3.1 — Database Migration on Staging
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Actions:**
  1. Run `npx prisma migrate deploy` on staging database
  2. Verify all 20 Agbala models created
  3. Verify `agbala-olodumare` storyworld seeded

### D3.2 — Seed Data on Staging
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Actions:**
  1. Run `npm run seed:agbala` on staging
  2. Verify 5 titles, 8 characters, 6 realms, 15 notification templates, 10 badges seeded

### D3.3 — Environment Variables on Staging
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Actions:**
  1. Set `STORYWORLD_DEFAULT_SLUG=agbala-olodumare`
  2. Set `ANALYTICS_SERVICE_URL`, `SEARCH_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `REWARD_SERVICE_URL`, `MODERATION_SERVICE_URL`, `SUBSCRIPTION_SERVICE_URL`

### D3.4 — Vertical Service Deployment
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Actions:**
  1. Build and deploy vertical-service
  2. Verify `GET /health` returns 200
  3. Verify `GET /api/storyworlds` returns storyworld list

### D3.5 — Mobile App Build (Agbala)
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Build Expo app: `eas build --profile staging`
  2. Verify Agbala tab appears, hub page loads, title cards render

### D3.6 — Web App Deployment (Agbala)
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Build and deploy Next.js app
  2. Verify `/vertical/agbala` loads, `/vertical/agbala/titles` lists titles

### D3.7 — API Gateway Configuration
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Add storyworld routes to gateway config
  2. Configure rate limiting for public endpoints
  3. Set up CORS for web app

### D3.8 — CDN / Static Assets
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Upload cover images to CDN
  2. Configure image optimization and cache headers

### D3.9 — SSL / HTTPS
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Verify SSL cert on staging domain
  2. Test HTTPS for all API endpoints

### D3.10 — Database Backups
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Configure automated backups for staging DB
  2. Test backup restoration

### D3.11 — Rollback Procedure
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Document rollback steps
  2. Test rollback on staging

### D3.12 — Smoke Tests
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Run automated smoke tests against staging
  2. Test critical user journeys end-to-end

---

## Phase 4 — CI/CD Improvements (P2)

### CI4.1 — Implement Real CD Deployment
- **Status:** `[x]` DONE
- **Priority:** P2
- **Description:** CD pipeline has real Coolify webhook deployment + SSH fallback for staging and production

### CI4.2 — Add Integration Tests to CI
- **Status:** `[x]` DONE
- **Priority:** P2
- **Description:** Integration test job exists in ci.yml (line 86-127) with PostgreSQL + Redis services

### CI4.3 — Add E2E Tests to CI
- **Status:** `[x]` DONE
- **Priority:** P2
- **Description:** E2E test job added to ci.yml for admin and creator Playwright smoke tests

### CI4.4 — Post-Deploy Verification
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Add post-deploy smoke tests and health check verification

---

## Phase 5 — Post-Deployment Monitoring (P2 — Runtime Required)

### M5.1 — Error Tracking Setup
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Configure Sentry/Datadog for all services; set up error alerts

### M5.2 — Performance Monitoring
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Set up APM; configure latency alerts; monitor database query performance

### M5.3 — Uptime Monitoring
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Configure health check monitoring; set up uptime alerts

### M5.4 — Database Monitoring
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Monitor connection pool usage; track slow queries; disk space alerts

### M5.5 — Log Aggregation
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Configure log shipping; set up log-based alerts; create debug dashboards

### M5.6 — Analytics Dashboard
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Connect events to analytics dashboard; create universe-specific dashboards

### M5.7 — Capacity Planning
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Document resource usage; project growth; plan scaling triggers

---

## Phase 6 — Analytics Integration (P2 — Runtime Required)

### A6.1 — Analytics Event Wiring
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Wire analytics events to all key user actions across all universes

### A6.2 — Funnel Tracking
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Define and track conversion funnels per universe

### A6.3 — A/B Test Hooks
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Add experiment flags to key screens

### A6.4 — Low-Data Mode Detection
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Detect `Save-Data` header; reduce image quality; skip auto-play

---

## Phase 7 — Accessibility Audit (P2 — Runtime Required)

### X7.1 — Screen Reader Testing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Test with VoiceOver (iOS), TalkBack (Android), NVDA (Windows)

### X7.2 — Keyboard Navigation
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Test tab order; verify focus indicators; test keyboard shortcuts

### X7.3 — Color Contrast
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Run contrast checker; fix WCAG AA violations

### X7.4 — Touch Target Size
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Verify all buttons >= 44x44 points

### X7.5 — Reduced Motion
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Test with "Reduce Motion" enabled; disable animations when preferred

### X7.6 — Alt Text for Images
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Add alt text to all cover images, character portraits, realm images

### X7.7 — Lighthouse Audit
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Run Lighthouse on mobile and web pages; fix issues; target score >= 90

---

## Phase 8 — Performance Optimization (P2 — Runtime Required)

### P8.1 — Lazy Loading
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Lazy load below-fold content, images, video player

### P8.2 — Prefetching
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Prefetch next likely screens; prefetch character data on hub

### P8.3 — Bundle Analysis
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Analyze mobile and web bundle size; identify optimization opportunities

### P8.4 — Image Optimization
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Convert images to WebP/AVIF; generate responsive sizes; implement blur placeholders

### P8.5 — Database Indexing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Review query performance; add indexes for slow queries

### P8.6 — Caching Strategy
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Configure CDN caching; set up Redis caching for hot data

### P8.7 — Offline Support
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Cache last-viewed content; show offline indicator; queue actions for sync

### P8.8 — Memory Leak Detection
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Monitor memory usage over time; test long sessions

---

## Phase 9 — Testing (P2 — Runtime Required)

### T9.1 — Integration Tests
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Test title listing, quiz flow, theory submission end-to-end

### T9.2 — E2E Tests (Mobile)
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Set up Detox/E2E framework; write critical path tests

### T9.3 — E2E Tests (Web)
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Set up Playwright/Cypress; write critical path tests

### T9.4 — Load Testing
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Set up k6/Artillery; test concurrent users; identify bottlenecks

### T9.5 — Security Testing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Run OWASP ZAP scan; test SQL injection; test XSS vectors

### T9.6 — Regression Testing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Run full test suite; verify no existing functionality broken

### T9.7 — Cross-Browser Testing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Test on Chrome, Safari, Firefox, Edge; iOS Safari, Android Chrome

---

## Phase 10 — Documentation (P2)

### DOC10.1 — API Documentation
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Generate OpenAPI spec from decorators; publish to internal docs site

### DOC10.2 — User Guide
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Description:** Write user-facing documentation; include screenshots; publish to help center

### DOC10.3 — Developer Guide
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Description:** Document local setup, architecture decisions, contributing guidelines

---

## Critical Path

```
M0.1-M0.8 (Mobile Foundation) → M1.1-M1.7 (Universe Screens)
                                         ↓
                    W1.1-W1.2 (Decommission) + A2.1-A2.4 (Standalone Fixes)
                                         ↓
                    D3.1-D3.4 (Agbala Deploy) → D3.5-D3.7 (Client Deploy)
                                         ↓
                    CI4.1-CI4.4 (CI/CD) → M5.1-M5.7 (Monitoring)
                                         ↓
                    A6.1-A6.4 (Analytics) → X7.1-X7.7 (A11y) → P8.1-P8.8 (Perf)
```

---

## Notes

- **Mobile foundation (Phase 0)** is the highest priority — the app cannot launch without core shell
- **Universe screens (Phase 0B)** can be built in parallel once foundation is done
- **Runtime-required tasks** (Phases 3-9) need deployed services in staging/production
- **CI/CD improvements (Phase 4)** can be done in parallel with mobile work
- Priority should be given to mobile foundation → universe screens → deployment → monitoring
