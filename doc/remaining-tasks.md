# Remaining Tasks — Agbala Storyworld

> Generated: 2026-07-06
> Status: All code implementation complete. Remaining items require running services, deployment, or manual verification.

---

## Summary

| Category | Total | Can Code Now | Requires Runtime |
|----------|-------|--------------|------------------|
| Deployment | 12 | 0 | 12 |
| Post-Deployment Monitoring | 7 | 0 | 7 |
| Analytics Integration | 4 | 0 | 4 |
| Accessibility Audit | 7 | 0 | 7 |
| Performance Optimization | 8 | 0 | 8 |
| Additional Testing | 7 | 0 | 7 |
| Documentation | 5 | 0 | 5 |
| **Total** | **50** | **0** | **50** |

---

## Phase 1 — Staging Deployment

### D1.1 — Database Migration on Staging
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Actions:**
  1. Run `npx prisma migrate deploy` on staging database
  2. Verify all 20 Agbala models created
  3. Verify `agbala-olodumare` storyworld seeded
- **Verification:**
  - [ ] `SELECT COUNT(*) FROM "AgbalaTitle"` returns seeded data
  - [ ] `SELECT COUNT(*) FROM "AgbalaCharacter"` returns seeded data
  - [ ] `SELECT COUNT(*) FROM "AgbalaRealm"` returns seeded data

### D1.2 — Seed Data on Staging
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Actions:**
  1. Run `npm run seed:agbala` on staging
  2. Verify notification templates seeded
  3. Verify badge definitions seeded
- **Verification:**
  - [ ] 5 titles seeded with chapters
  - [ ] 8 characters seeded with relationships
  - [ ] 6 realms seeded
  - [ ] 15 notification templates seeded
  - [ ] 10 badges seeded

### D1.3 — Environment Variables on Staging
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Actions:**
  1. Set `STORYWORLD_DEFAULT_SLUG=agbala-olodumare`
  2. Set `ANALYTICS_SERVICE_URL` for analytics events
  3. Set `SEARCH_SERVICE_URL` for search indexing
  4. Set `NOTIFICATION_SERVICE_URL` for notifications
  5. Set `REWARD_SERVICE_URL` for badge system
  6. Set `MODERATION_SERVICE_URL` for theory moderation
  7. Set `SUBSCRIPTION_SERVICE_URL` for paywall gating
- **Verification:**
  - [ ] All env vars present in staging config
  - [ ] Services can reach each other via internal URLs

### D1.4 — Vertical Service Deployment
- **Status:** `[ ]` PENDING
- **Priority:** P0
- **Actions:**
  1. Build vertical-service: `npm run build`
  2. Deploy to staging environment
  3. Verify StoryworldsModule loaded
- **Verification:**
  - [ ] `GET /health` returns 200
  - [ ] `GET /api/storyworlds` returns storyworld list
  - [ ] `GET /api/storyworlds/agbala-olodumare` returns Agbala data

### D1.5 — Mobile App Build
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Build Expo app: `eas build --profile staging`
  2. Install on test device
  3. Navigate to Agbala hub
- **Verification:**
  - [ ] Agbala tab appears in navigation
  - [ ] Hub page loads with content
  - [ ] Title cards render correctly

### D1.6 — Web App Deployment
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Build Next.js app: `npm run build`
  2. Deploy to staging
  3. Test SSR pages
- **Verification:**
  - [ ] `/vertical/agbala` loads
  - [ ] `/vertical/agbala/titles` lists titles
  - [ ] `/admin/vertical/agbala` admin pages accessible

### D1.7 — API Gateway Configuration
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Add storyworld routes to gateway config
  2. Configure rate limiting for public endpoints
  3. Set up CORS for web app
- **Verification:**
  - [ ] `GET /api/v1/storyworlds` proxied correctly
  - [ ] Auth required for write endpoints
  - [ ] Public read endpoints accessible without auth

### D1.8 — CDN / Static Assets
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Upload cover images to CDN
  2. Configure image optimization
  3. Set cache headers for static assets
- **Verification:**
  - [ ] Cover images load from CDN
  - [ ] Images optimized for mobile
  - [ ] Cache headers correct

### D1.9 — SSL / HTTPS
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Verify SSL cert on staging domain
  2. Test HTTPS for all API endpoints
  3. Verify mixed content warnings
- **Verification:**
  - [ ] All endpoints accessible via HTTPS
  - [ ] No mixed content warnings

### D1.10 — Database Backups
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Configure automated backups for staging DB
  2. Test backup restoration
  3. Document backup schedule
- **Verification:**
  - [ ] Backups running daily
  - [ ] Restoration tested successfully

### D1.11 — Rollback Procedure
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Document rollback steps
  2. Test rollback on staging
  3. Verify data integrity after rollback
- **Verification:**
  - [ ] Rollback document complete
  - [ ] Rollback tested successfully

### D1.12 — Smoke Tests
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Run automated smoke tests against staging
  2. Test critical user journeys
  3. Verify error handling
- **Verification:**
  - [ ] All smoke tests pass
  - [ ] Critical journeys work end-to-end

---

## Phase 2 — Post-Deployment Monitoring

### M2.1 — Error Tracking Setup
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Configure Sentry/Datadog for vertical-service
  2. Set up error alerts for Agbala endpoints
  3. Test error capture
- **Verification:**
  - [ ] Errors appear in monitoring dashboard
  - [ ] Alerts configured for 5xx errors

### M2.2 — Performance Monitoring
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Set up APM for vertical-service
  2. Configure latency alerts
  3. Monitor database query performance
- **Verification:**
  - [ ] P95 latency < 200ms for read endpoints
  - [ ] P95 latency < 500ms for write endpoints

### M2.3 — Uptime Monitoring
- **Status:** `[ ]` PENDING
- **Priority:** P1
- **Actions:**
  1. Configure health check monitoring
  2. Set up uptime alerts
  3. Document escalation process
- **Verification:**
  - [ ] Health checks running every 60s
  - [ ] Alerts fire on downtime

### M2.4 — Database Monitoring
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Monitor connection pool usage
  2. Track slow queries
  3. Set up disk space alerts
- **Verification:**
  - [ ] Connection pool < 80% utilization
  - [ ] No queries > 1s

### M2.5 — Log Aggregation
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Configure log shipping to centralized system
  2. Set up log-based alerts
  3. Create debug dashboards
- **Verification:**
  - [ ] Logs appearing in aggregation system
  - [ ] Alerts for error patterns

### M2.6 — Analytics Dashboard
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Connect `agbala_*` events to analytics dashboard
  2. Create Agbala-specific dashboards
  3. Set up funnel tracking
- **Verification:**
  - [ ] Events appearing in dashboard
  - [ ] Funnel tracking working

### M2.7 — Capacity Planning
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Actions:**
  1. Document current resource usage
  2. Project growth based on user adoption
  3. Plan scaling triggers
- **Verification:**
  - [ ] Capacity document complete
  - [ ] Scaling triggers defined

---

## Phase 3 — Analytics Integration

### A3.1 — Analytics Event Wiring
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Wire `trackHubViewed` to hub page load
  2. Wire `trackPathSelected` to path selection
  3. Wire `trackTitleWatched` to video player
  4. Wire `trackCharacterViewed` to character page
  5. Wire `trackRealmExplored` to realm page
- **Verification:**
  - [ ] Events appear in analytics when user interacts

### A3.2 — Funnel Tracking
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Define conversion funnels
  2. Track: Hub → Title → Watch → End Card → Unlock
  3. Track: Hub → Quiz → Result → Subscribe
- **Verification:**
  - [ ] Funnels visible in dashboard
  - [ ] Drop-off points identified

### A3.3 — A/B Test Hooks
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Actions:**
  1. Add experiment flags to hub page
  2. Add variant support to quiz
  3. Add variant support to subscription prompts
- **Verification:**
  - [ ] Experiment flags configurable
  - [ ] Variants can be toggled

### A3.4 — Low-Data Mode Detection
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Actions:**
  1. Detect `Save-Data` header
  2. Reduce image quality on low data
  3. Skip video auto-play on low data
- **Verification:**
  - [ ] Low data mode detected
  - [ ] Content adapted accordingly

---

## Phase 4 — Accessibility Audit

### X4.1 — Screen Reader Testing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Test with VoiceOver (iOS)
  2. Test with TalkBack (Android)
  3. Test with NVDA (Windows)
- **Verification:**
  - [ ] All content readable by screen readers
  - [ ] Navigation logical and intuitive

### X4.2 — Keyboard Navigation
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Test tab order on all pages
  2. Verify focus indicators visible
  3. Test keyboard shortcuts
- **Verification:**
  - [ ] All interactive elements reachable via keyboard
  - [ ] Focus indicators clear

### X4.3 — Color Contrast
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Run contrast checker on all pages
  2. Fix any WCAG AA violations
  3. Test with color blindness simulators
- **Verification:**
  - [ ] All text meets 4.5:1 contrast ratio
  - [ ] All large text meets 3:1 contrast ratio

### X4.4 — Touch Target Size
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Verify all buttons >= 44x44 points
  2. Verify all links have adequate spacing
  3. Fix any undersized targets
- **Verification:**
  - [ ] All touch targets meet minimum size

### X4.5 — Reduced Motion
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Actions:**
  1. Test with "Reduce Motion" enabled
  2. Disable animations when preferred
  3. Provide static alternatives
- **Verification:**
  - [ ] Animations disabled when preferred
  - [ ] Content still usable without motion

### X4.6 — Alt Text for Images
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Add alt text to all cover images
  2. Add alt text to character portraits
  3. Add alt text to realm images
- **Verification:**
  - [ ] All images have descriptive alt text

### X4.7 — Lighthouse Audit
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Run Lighthouse on mobile pages
  2. Run Lighthouse on web pages
  3. Fix any issues flagged
- **Verification:**
  - [ ] Accessibility score >= 90

---

## Phase 5 — Performance Optimization

### P5.1 — Lazy Loading
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Lazy load below-fold content
  2. Lazy load images
  3. Lazy load video player
- **Verification:**
  - [ ] Initial load < 2s on 3G
  - [ ] Images load on scroll

### P5.2 — Prefetching
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Actions:**
  1. Prefetch next likely screens
  2. Prefetch character data on hub
  3. Prefetch title details on list
- **Verification:**
  - [ ] Navigation feels instant
  - [ ] No unnecessary network requests

### P5.3 — Bundle Analysis
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Analyze mobile bundle size
  2. Analyze web bundle size
  3. Identify optimization opportunities
- **Verification:**
  - [ ] Bundle size within budget

### P5.4 — Image Optimization
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Convert images to WebP/AVIF
  2. Generate responsive image sizes
  3. Implement blur placeholders
- **Verification:**
  - [ ] Images optimized for all screen sizes

### P5.5 — Database Indexing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Review query performance
  2. Add indexes for slow queries
  3. Analyze query plans
- **Verification:**
  - [ ] All queries < 100ms

### P5.6 — Caching Strategy
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Configure CDN caching for static assets
  2. Set up Redis caching for hot data
  3. Implement stale-while-revalidate
- **Verification:**
  - [ ] Cache hit rate > 80%

### P5.7 — Offline Support
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Actions:**
  1. Cache last-viewed content
  2. Show offline indicator
  3. Queue actions for sync
- **Verification:**
  - [ ] App usable offline for cached content

### P5.8 — Memory Leak Detection
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Monitor memory usage over time
  2. Test long sessions
  3. Fix any leaks found
- **Verification:**
  - [ ] No memory growth over 30min session

---

## Phase 6 — Additional Testing

### T6.1 — Integration Tests
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Test title listing end-to-end
  2. Test quiz flow end-to-end
  3. Test theory submission end-to-end
- **Verification:**
  - [ ] All integration tests pass

### T6.2 — E2E Tests (Mobile)
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Set up Detox/E2E framework
  2. Write critical path tests
  3. Run on CI
- **Verification:**
  - [ ] E2E tests pass on iOS and Android

### T6.3 — E2E Tests (Web)
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Set up Playwright/Cypress
  2. Write critical path tests
  3. Run on CI
- **Verification:**
  - [ ] E2E tests pass in Chrome, Safari, Firefox

### T6.4 — Load Testing
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Actions:**
  1. Set up k6/Artillery
  2. Test concurrent users
  3. Identify bottlenecks
- **Verification:**
  - [ ] Supports 1000 concurrent users
  - [ ] P95 latency within SLA

### T6.5 — Security Testing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Run OWASP ZAP scan
  2. Test SQL injection
  3. Test XSS vectors
- **Verification:**
  - [ ] No critical vulnerabilities

### T6.6 — Regression Testing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Run full test suite
  2. Verify no existing functionality broken
  3. Document any regressions
- **Verification:**
  - [ ] All tests pass
  - [ ] No regressions

### T6.7 — Cross-Browser Testing
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Test on Chrome, Safari, Firefox, Edge
  2. Test on iOS Safari, Android Chrome
  3. Fix any rendering issues
- **Verification:**
  - [ ] Consistent rendering across browsers

---

## Phase 7 — Documentation

### DOC7.1 — API Documentation
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Generate OpenAPI spec from decorators
  2. Publish to internal docs site
  3. Add code examples
- **Verification:**
  - [ ] API docs published
  - [ ] All endpoints documented

### DOC7.2 — User Guide
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Actions:**
  1. Write user-facing documentation
  2. Include screenshots
  3. Publish to help center
- **Verification:**
  - [ ] User guide complete

### DOC7.3 — Developer Guide
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Document local setup
  2. Document architecture decisions
  3. Document contributing guidelines
- **Verification:**
  - [ ] Developer guide complete

### DOC7.4 — Runbook
- **Status:** `[ ]` PENDING
- **Priority:** P2
- **Actions:**
  1. Document common operations
  2. Document troubleshooting steps
  3. Document escalation paths
- **Verification:**
  - [ ] Runbook complete

### DOC7.5 — Changelog
- **Status:** `[ ]` PENDING
- **Priority:** P3
- **Actions:**
  1. Document all features added
  2. Document breaking changes
  3. Document migration steps
- **Verification:**
  - [ ] Changelog complete

---

## Critical Path

```
D1.1 (DB Migration) → D1.2 (Seed) → D1.3 (Env Vars) → D1.4 (Deploy)
                                                          ↓
                                              D1.5 (Mobile) + D1.6 (Web)
                                                          ↓
                                              D1.7 (Gateway) → D1.12 (Smoke)
                                                          ↓
                                              M2.1 (Errors) → M2.2 (Perf)
                                                          ↓
                                              A3.1 (Analytics) → X4.1 (A11y)
```

---

## Notes

- All remaining tasks require running services in staging/production environment
- Cannot be completed in local development without full stack running
- Priority should be given to deployment tasks (Phase 1) before monitoring (Phase 2)
- Accessibility and performance tasks can be done in parallel with monitoring
- Documentation should be last, after all verification complete
