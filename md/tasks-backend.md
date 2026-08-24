# Tasks — Backend Services

> Derived from AZP-TAA-001 R2.0 Technical Architecture Authority
> 28 services across 6 groups, plus shared packages

---

## 1. API Gateway (`services/gateway/api-gateway`)

### 1.1 Routing & Proxy (TAA §9)

| Task | Reference | Status |
|------|-----------|--------|
| Versioned routing `/v1/:service/*path` | TAA §9 | ✅ Implemented |
| Legacy unversioned routing support | TAA §9 | ✅ Implemented |
| Service discovery from env vars | TAA §41 | ✅ Implemented |
| Circuit breaker per upstream service | TAA §81 | ✅ Implemented |
| Response caching with TTL | TAA §35 | ✅ Implemented |
| Cache invalidation for critical reads | TAA §35 | ✅ Implemented |

### 1.2 Security (TAA §53)

| Task | Reference | Status |
|------|-----------|--------|
| JWT validation with HS256 algorithm pinning | TAA §49 | ✅ Implemented |
| Gateway secret for x-user-* headers | TAA §50 | ✅ Implemented |
| CORS origin restriction | TAA §53 | ✅ Implemented |
| Rate limiting on auth endpoints | TAA §53 | ✅ Implemented |
| CSRF protection (httpOnly cookie + header) | TAA §53 | ✅ Implemented |
| WebSocket origin validation | TAA §53 | ✅ Implemented |
| Request ID correlation propagation | TAA §9 | ✅ Implemented |
| Admin role check before upstream forwarding | TAA §50 | ✅ Implemented |

### 1.3 Resilience (TAA §81)

| Task | Reference | Status |
|------|-----------|--------|
| External dependency timeout budgets | TAA §81 | ✅ Implemented |
| Exponential backoff with jitter | TAA §81 | ✅ Implemented |
| Circuit breaker with degraded mode | TAA §81 | ✅ Implemented |
| Health check aggregation | TAA §57 | ✅ Implemented |
| Maintenance mode kill-switch | TAA §82 | ✅ Implemented |

---

## 2. Core Services

### 2.1 Auth Service (`services/core/auth-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| OIDC/OAuth authentication with PKCE | AZP-AUTH-001–005 | ✅ Implemented |
| Account creation and session persistence | AZP-AUTH-002/003 | ✅ Implemented |
| Logout and session invalidation | AZP-AUTH-004 | ✅ Implemented |
| Credential recovery (forgot/reset password) | AZP-AUTH-005 | ✅ Implemented |
| Age declaration and consent recording | AZP-AUTH-006/007 | ✅ Implemented |
| Progressive profiling | AZP-AUTH-008 | ✅ Implemented |
| Account collision handling | AZP-AUTH-009 | ✅ Implemented |
| Role separation (consumer/admin/creator) | AZP-AUTH-010 | ✅ Implemented |
| Social auth (Google, Apple) | TAA §49 | ✅ Implemented |
| MFA for admin accounts | TAA §49 | ✅ Implemented |
| Exponential backoff lockout | TAA §54 | ✅ Implemented |
| Constant-time session lookup | TAA §54 | ✅ Implemented |
| Admin user management (suspend/activate) | AZP-ADMIN-001 | ✅ Implemented |
| Audit logging for admin actions | TAA §56 | ✅ Implemented |

### 2.2 User Service (`services/core/user-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| User profile management | AZP-AUTH-008 | ✅ Implemented |
| Profile options (interests, genders) | — | ✅ Implemented |
| User preferences | — | ✅ Implemented |
| Privacy settings | TAA §83 | ✅ Implemented |
| Viewing history | — | ✅ Implemented |
| Saved content (watchlist, favorites) | — | ✅ Implemented |
| Follow/unfollow system | — | ✅ Implemented |
| Universe affinity tracking | — | ✅ Implemented |
| User data export (GDPR) | TAA §83 | ✅ Implemented |
| User deletion workflow | TAA §83 | ✅ Implemented |
| Subscription management | AZP-COM-008 | ✅ Implemented |
| Admin user management | AZP-ADMIN-001 | ✅ Implemented |
| Input sanitization for XSS prevention | TAA §53 | ✅ Implemented |

### 2.3 Content Service (`services/core/content-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Content entity model (CRUD) | AZP-CMS-001 | ✅ Implemented |
| Content lifecycle (draft/processing/published/archived) | AZP-CMS-002 | ✅ Implemented |
| Release scheduler | AZP-CMS-003 | ✅ Implemented |
| ACDP validation | AZP-CMS-004 | ✅ Implemented |
| Content versioning | AZP-CMS-005 | ✅ Implemented |
| Home feed generation | AZP-HOME-001 | ✅ Implemented |
| Continue watching feed | AZP-HOME-002 | ✅ Implemented |
| Featured/trending/new-releases feeds | — | ✅ Implemented |
| Content categories and tags | — | ✅ Implemented |
| Content comments | — | ✅ Implemented |
| Content analytics per item | — | ✅ Implemented |
| Content moderation status | — | ✅ Implemented |
| Content access check | — | ✅ Implemented |
| Content publishing/unpublishing | — | ✅ Implemented |
| Content reporting | — | ✅ Implemented |
| Input sanitization for user-generated content | TAA §53 | ✅ Implemented |

### 2.4 Media Service (`services/core/media-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Upload pipeline (image, video, audio, document) | TAA §21 | ✅ Implemented |
| Virus scanning enabled by default | TAA §54 | ✅ Implemented |
| Presigned upload URLs | TAA §22 | ✅ Implemented |
| Presigned download URLs | TAA §22 | ✅ Implemented |
| Chunked upload support | TAA §21 | ✅ Implemented |
| Media metadata management | TAA §21 | ✅ Implemented |
| CDN purge capability | TAA §82 | ✅ Implemented |
| Transcoding job status tracking | TAA §23 | ✅ Implemented |
| Orphaned media cleanup | TAA §22 | ✅ Implemented |
| Premium URL management | TAA §25 | ✅ Implemented |

### 2.5 Payment Service (`services/core/payment-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Payment initialization (provider-agnostic) | AZP-COM-001 | ✅ Implemented |
| Payment verification | AZP-COM-002 | ✅ Implemented |
| Payment intent creation | AZP-COM-003 | ✅ Implemented |
| Payment history | AZP-COM-008 | ✅ Implemented |
| Refund request workflow | AZP-COM-009 | ✅ Implemented |
| Transaction reconciliation | AZP-COM-010 | ✅ Implemented |
| Webhook handling (Paystack, Flutterwave) | TAA §81 | ✅ Implemented |
| Pricing management (movie, vote-packages, subscriptions, wallet, passes) | AZP-COM-011 | ✅ Implemented |
| Payment gateway admin management | AZP-COM-012 | ✅ Implemented |

### 2.6 Wallet Service (`services/core/wallet-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Wallet balance management | AZP-COM-002 | ✅ Implemented |
| Transaction history | AZP-COM-008 | ✅ Implemented |
| Wallet funding | AZP-COM-003 | ✅ Implemented |
| Wallet withdrawal | AZP-COM-009 | ✅ Implemented |
| Wallet transfer | — | ✅ Implemented |
| Bonus credit management | — | ✅ Implemented |
| Promo credit management | — | ✅ Implemented |
| Reward redemption to wallet | AZP-RWD-006 | ✅ Implemented |
| Audit trail | TAA §56 | ✅ Implemented |
| Linked bank accounts | — | ✅ Implemented |
| Withdrawal methods/pricing | — | ✅ Implemented |
| Payment methods | — | ✅ Implemented |

### 2.7 Search Service (`services/core/search-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Universal search (PostgreSQL FTS/trigram) | AZP-SEARCH-001 | ✅ Implemented |
| Faceted search | — | ✅ Implemented |
| Search suggestions | — | ✅ Implemented |
| Trending searches | — | ✅ Implemented |
| Availability-aware results | AZP-SEARCH-003 | ✅ Implemented |
| Zero-result telemetry | AZP-SEARCH-002 | ✅ Implemented |
| Admin search stats | — | ✅ Implemented |
| Search query data retention (30d anonymize, 90d delete) | TAA §83 | ✅ Implemented |
| Regex pattern escaping for safety | TAA §53 | ✅ Implemented |
| Search index repair capability | — | ✅ Implemented |

---

## 3. Engagement Services

### 3.1 Engagement Service (`services/engagement/engagement-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Leaderboard management | — | ✅ Implemented |
| Rankings by category | — | ✅ Implemented |
| Predictions system | AZP-PART-009 | ✅ Implemented |
| Prediction results | AZP-PART-005 | ✅ Implemented |
| Prediction history | — | ✅ Implemented |
| Batch prediction submission | — | ✅ Implemented |

### 3.2 Messaging Service (`services/engagement/messaging-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Conversation management | — | ✅ Implemented |
| Message sending/receiving | — | ✅ Implemented |
| Message reactions | — | ✅ Implemented |
| Message pinning | — | ✅ Implemented |
| Conversation muting | — | ✅ Implemented |
| Conversation archiving | — | ✅ Implemented |
| Message search | — | ✅ Implemented |
| WebSocket real-time messaging | — | ✅ Implemented |
| Input sanitization | TAA §53 | ✅ Implemented |

### 3.3 Notification Service (`services/engagement/notification-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Notification listing | — | ✅ Implemented |
| Mark read (single + all) | — | ✅ Implemented |
| Notification preferences | — | ✅ Implemented |
| Push token management | — | ✅ Implemented |
| Email notification support | — | ✅ Implemented |
| Notification templates (admin) | — | ✅ Implemented |
| Notification campaigns | — | ✅ Implemented |
| Digest sending | — | ✅ Implemented |
| 95% provider-accepted ≤15 min SLO | AZP-NFR-007 | ✅ Implemented |

### 3.4 Reward Service (`services/engagement/reward-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Points ledger (append-only) | AZP-RWD-001 | ✅ Implemented |
| No cash equivalence enforcement | AZP-RWD-002 | ✅ Implemented |
| Admin adjustment audit | AZP-RWD-003 | ✅ Implemented |
| Mission object | AZP-RWD-004 | ✅ Implemented |
| Streak rules | AZP-RWD-005 | ✅ Implemented |
| Reward redemption | AZP-RWD-006 | ✅ Implemented |
| Sponsor-funded rewards | AZP-RWD-007 | ✅ Implemented |
| Reward abuse controls | AZP-RWD-008 | ✅ Implemented |
| Badges and levels | — | ✅ Implemented |
| Balance as derived projection (not authoritative) | TAA §32 | ✅ Implemented |

### 3.5 Referral Service (`services/engagement/referral-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Referral code generation | — | ✅ Implemented |
| Referral application | — | ✅ Implemented |
| Referral stats tracking | — | ✅ Implemented |
| Referral completion workflow | — | ✅ Implemented |
| Admin referral config | — | ✅ Implemented |

### 3.6 Subscription Service (`services/engagement/subscription-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Subscription plans CRUD | — | ✅ Implemented |
| Subscribe to plan | — | ✅ Implemented |
| Current subscription lookup | — | ✅ Implemented |
| Subscription history | — | ✅ Implemented |
| Subscription renewal | — | ✅ Implemented |
| Bundle management | — | ✅ Implemented |
| Bundle comparison | — | ✅ Implemented |

---

## 4. Universe Services

### 4.1 Reality Service (`services/universes/reality-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Show/season/episode management | TAA §67 | ✅ Implemented |
| Contestant management | TAA §67 | ✅ Implemented |
| Voting system (regular + super votes) | TAA §67 | ✅ Implemented |
| Vote quantity/pricing | TAA §67 | ✅ Implemented |
| Predictions per show | TAA §67 | ✅ Implemented |
| Leaderboard per show | TAA §67 | ✅ Implemented |
| Live chat | TAA §67 | ✅ Implemented |
| Fraud detection (votes, supervotes, predictions) | TAA §67 | ✅ Implemented |
| Show analytics | TAA §67 | ✅ Implemented |
| Comments on shows | TAA §67 | ✅ Implemented |
| Like/share functionality | TAA §67 | ✅ Implemented |
| Premium extras | TAA §67 | ✅ Implemented |
| WebSocket real-time updates | TAA §67 | ✅ Implemented |
| Vote ledger immutability/auditability | TAA §67 | ✅ Implemented |

### 4.2 Creator Service (`services/universes/creator-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Creator onboarding | TAA §68 | ✅ Implemented |
| Creator profile management | TAA §68 | ✅ Implemented |
| Channel management | TAA §68 | ✅ Implemented |
| Upload initiate/complete | TAA §68 | ✅ Implemented |
| Creator analytics | TAA §68 | ✅ Implemented |
| Creator earnings | TAA §68 | ✅ Implemented |
| Creator payouts | TAA §68 | ✅ Implemented |
| Creator verification | TAA §68 | ✅ Implemented |
| Creator tips/leaderboard | TAA §68 | ✅ Implemented |
| Creator subscriptions | TAA §68 | ✅ Implemented |
| Creator challenges | TAA §68 | ✅ Implemented |
| Creator monetization settings | TAA §68 | ✅ Implemented |
| Trust & Safety (separate from consumer) | TAA §68 | ✅ Implemented |

### 4.3 Games Service (`services/universes/games-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Game listing (home, featured, trending) | TAA §69 | ✅ Implemented |
| Trivia system | AZP-PART-001 | ✅ Implemented |
| Daily challenges | — | ✅ Implemented |
| Game sessions | — | ✅ Implemented |
| Game leaderboard | — | ✅ Implemented |
| Game tournaments | — | ✅ Implemented |
| Game stats tracking | — | ✅ Implemented |
| Real-time game sessions | TAA §69 | ✅ Implemented |

### 4.4 Sports Service (`services/universes/sports-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Sports fixtures management | TAA §69 | ✅ Implemented |
| Live scores | TAA §69 | ✅ Implemented |
| Sports predictions | TAA §69 | ✅ Implemented |
| Prediction leagues | TAA §69 | ✅ Implemented |
| Fan contests | TAA §69 | ✅ Implemented |
| Sports leaderboard | TAA §69 | ✅ Implemented |
| Live match details | TAA §69 | ✅ Implemented |
| Licensed/authoritative data sourcing | TAA §69 | ✅ Implemented |

### 4.5 Other Universe Services

| Service | Status | Notes |
|---------|--------|-------|
| Comedy Service | ✅ Implemented | Stand-up, specials, clips, series |
| Lifestyle Service | ✅ Implemented | Stories, events, quizzes, nightlife, social |
| Vertical Service | ✅ Implemented | Storyworlds, characters, titles, timeline, agbala paths |
| Movie Service | ✅ Implemented | Movie listings, details |
| Live Event Service | ✅ Implemented | Event management, streaming, tickets |

---

## 5. Operations Services

### 5.1 Moderation Service (`services/operations/moderation-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Content scanning | TAA §68 | ✅ Implemented |
| Risk assessment | TAA §68 | ✅ Implemented |
| Moderation cases | TAA §68 | ✅ Implemented |
| Case assignment and resolution | TAA §68 | ✅ Implemented |
| Moderation actions | TAA §68 | ✅ Implemented |
| Appeal workflow | TAA §68 | ✅ Implemented |
| User trust scoring | TAA §68 | ✅ Implemented |
| Moderation stats | TAA §68 | ✅ Implemented |

### 5.2 Analytics Service (`services/intelligence/analytics-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Event ingestion | AZP-AN-001 | ✅ Implemented |
| KPI dashboards | AZP-AN-006 | ✅ Implemented |
| Funnel analytics | AZP-AN-006 | ✅ Implemented |
| Cohort analytics | AZP-AN-006 | ✅ Implemented |
| Search correction analytics | AZP-SEARCH-002 | ✅ Implemented |
| WEP (Watching Equivalent Per user) | AZP-AN-006 | ✅ Implemented |
| Contribution per WEP | AZP-AN-007 | ✅ Implemented |
| Campaign attribution | AZP-AN-004 | ✅ Implemented |

### 5.3 Recommendation Service (`services/intelligence/recommendation-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Content recommendations | — | ✅ Implemented |
| Creator recommendations | — | ✅ Implemented |
| Cross-universe recommendations | — | ✅ Implemented |
| Trending content | — | ✅ Implemented |
| User segment classification | — | ✅ Implemented |
| Creator score | — | ✅ Implemented |
| Churn risk assessment | — | ✅ Implemented |
| Monetization insights | — | ✅ Implemented |
| Fraud risk assessment | — | ✅ Implemented |
| Personalised feed | — | ✅ Implemented |

### 5.4 Queue Service (`services/operations/queue-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Queue management | TAA §15 | ✅ Implemented |
| Job processing | TAA §15 | ✅ Implemented |
| Dead-letter queue handling | TAA §37 | ✅ Implemented |

### 5.5 Support Service (`services/operations/support-service`)

| Task | PRD Ref | Status |
|------|---------|--------|
| Support ticket management | AZP-SUP-001 | ✅ Implemented |
| Least-privilege support access | AZP-SUP-002 | ✅ Implemented |

---

## 6. Shared Packages

| Package | Purpose | Status |
|---------|---------|--------|
| `@azeebo/security` | Helmet, CORS, AdminGuard, WebSocket origin | ✅ Implemented |
| `@azeebo/validation` | DTO validation, input sanitization | ✅ Implemented |
| `@azeebo/error-handling` | Global exception filter, error sanitization | ✅ Implemented |
| `@azeebo/feature-flags` | Server-authoritative feature flags | ✅ Implemented |
| `@azeebo/event-bus` | Event publishing infrastructure | ✅ Implemented |
| `@azeebo/observability` | OpenTelemetry instrumentation | ✅ Implemented |
| `@azeebo/logger` | Structured JSON logging | ✅ Implemented |
| `@azeebo/shared-types` | Common type definitions | ✅ Implemented |
| `@azeebo/shared-services` | Shared service utilities | ✅ Implemented |
| `@azeebo/contract-tests` | API contract testing | ✅ Implemented |
| `@azeebo/test-utils` | Test utilities and helpers | ✅ Implemented |
| `@azeebo/http-client` | HTTP client with resilience | ✅ Implemented |
| `@azeebo/internal-clients` | Inter-service communication | ✅ Implemented |
| `@azeebo/analytics-sdk` | Analytics event collection | ✅ Implemented |
| `@azeebo/design-tokens` | Design system tokens | ✅ Implemented |
| `@azeebo/ui` | Shared UI components | ✅ Implemented |
| `@azeebo/queue-policy` | Queue consumer policies | ✅ Implemented |
| `@azeebo/flag-metrics` | Feature flag usage metrics | ✅ Implemented |
| `@azeebo/opentelemetry` | OTel configuration | ✅ Implemented |
| `@azeebo/api-client` | API client utilities | ✅ Implemented |
| `@azeebo/auth` | Auth utilities | ✅ Implemented |
| `@azeebo/utils` | General utilities | ✅ Implemented |
| `@azeebo/eslint-rules` | Custom ESLint rules | ✅ Implemented |
