# Tasks — Testing (Unit, Integration, E2E, Load, Contract)

> Derived from AZP-TAA-001 R2.0 §45, §74, §75, §76
> Cross-referenced with actual test suites across all services

---

## 1. Current Test Coverage Summary

| Service | Suites | Tests | Status |
|---------|--------|-------|--------|
| auth-service | 11 | 153 | ✅ All passing |
| content-service | 10 | 101 | ✅ All passing |
| user-service | 7 | 74 | ✅ All passing |
| media-service | 6 | 56 | ✅ All passing |
| payment-service | 11 | 153 | ✅ All passing |
| wallet-service | 8 | 106 | ✅ All passing |
| search-service | 11 | 131 | ✅ All passing |
| engagement-service | 5 | 32 | ✅ All passing |
| messaging-service | 5 | 36 | ✅ All passing |
| notification-service | — | — | ✅ Documented |
| reward-service | — | — | ✅ Documented |
| referral-service | — | — | ✅ Documented |
| subscription-service | — | — | ✅ Documented |
| reality-service | 8 | 111 | ✅ All passing |
| creator-service | 4 | 95 | ✅ All passing |
| games-service | 8 | 82 | ✅ All passing |
| sports-service | 13 | 136 | ✅ All passing |
| movie-service | 8 | 101 | ✅ All passing |
| comedy-service | 7 | 60 | ✅ All passing |
| lifestyle-service | 15 | 183 | ✅ All passing |
| vertical-service | 10 | 99 | ✅ All passing |
| live-event-service | 2 | 9 | ✅ All passing |
| api-gateway | 5 | 34 | ✅ All passing |
| analytics-service | 6 | 65 | ✅ All passing |
| recommendation-service | 4 | 23 | ✅ All passing |
| moderation-service | 6 | 38 | ✅ All passing |
| queue-service | — | — | ✅ Documented |
| support-service | 13 | 65 | ✅ All passing |
| **packages/security** | 6 | 50 | ✅ All passing |
| **packages/error-handling** | 1 | 15 | ✅ All passing |
| **packages/validation** | — | 38 | ✅ All passing |
| **Total verified** | **207** | **2,056+** | |

---

## 2. Unit Testing Gaps

### 2.1 Services Needing Test Coverage

| Task | Service | Priority |
|------|---------|----------|
| Add tests for notification-service | engagement/notification-service | P0 |
| Add tests for reward-service engagement flows | engagement/reward-service | P0 |
| Add tests for referral-service edge cases | engagement/referral-service | P1 |
| Add tests for subscription-service renewal/cancellation | engagement/subscription-service | P0 |
| Add tests for queue-service job processing | operations/queue-service | P1 |
| Add tests for live-event-service (only 9 tests) | universes/live-event-service | P1 |

### 2.2 Missing Unit Test Categories

| Task | Category | Priority |
|------|----------|----------|
| Domain logic unit tests (business rules) | TAA §45 | P0 |
| Guard/interceptor unit tests | TAA §45 | P1 |
| Pipe/transformer unit tests | TAA §45 | P1 |
| Event handler/consumer unit tests | TAA §45 | P0 |
| Outbox publisher unit tests | TAA §45 | P0 |
| Error handling edge case tests | TAA §45 | P1 |

---

## 3. Integration Testing

### 3.1 API Integration Tests

| Task | Service | Priority |
|------|---------|----------|
| End-to-end auth flow tests (signup → login → refresh → logout) | auth-service | P0 |
| Payment flow tests (initialize → verify → webhook → entitlement) | payment-service | P0 |
| Content lifecycle tests (create → publish → unpublish) | content-service | P0 |
| Search integration tests (index → query → filter) | search-service | P0 |
| Messaging integration tests (converse → read → react) | messaging-service | P1 |
| Reality show lifecycle tests (create → vote → result) | reality-service | P0 |
| Knowledge grant integration tests (checkpoint → grant → projection) | — | P0 |

### 3.2 Cross-Service Integration Tests

| Task | Services | Priority |
|------|----------|----------|
| Auth → User profile creation on registration | auth, user | P0 |
| Content publish → Search index update | content, search | P0 |
| Payment confirmed → Entitlement granted | payment, entitlement | P0 |
| Content published → Notification sent | content, notification | P1 |
| Participation submitted → Reward granted | participation, reward | P1 |
| Sponsor campaign activated → Discovery decoration | sponsor, discovery | P2 |

### 3.3 Database Integration Tests

| Task | Domain | Priority |
|------|--------|----------|
| Migration up/down tests | All | P0 |
| Cross-domain write prevention tests | All | P0 |
| Idempotency constraint tests | All | P0 |
| Outbox transaction atomicity tests | All | P0 |

---

## 4. Contract Testing (TAA §45, §80)

| Task | Reference | Priority |
|------|-----------|----------|
| OpenAPI contract tests for all services | TAA §45 | P0 |
| Producer/consumer contract tests for critical events | TAA §80 | P0 |
| Gateway → upstream service contract validation | TAA §45 | P0 |
| Mobile/web client → API contract validation | TAA §45 | P1 |
| Admin client → admin API contract validation | TAA §45 | P1 |

---

## 5. Load & Performance Testing (TAA §59)

### 5.1 Founding Capacity Envelope Tests

| Task | Envelope | Status |
|------|----------|--------|
| 250,000 registered users baseline | TAA §58 | ✅ Documented |
| 75,000 MAU planning case | TAA §58 | ✅ Documented |
| 10,000 peak concurrent video sessions | TAA §58 | ✅ Documented |
| 5,000 vertical starts/minute burst | TAA §58 | ✅ Documented |
| 5,000 long-form concurrent premiere | TAA §58 | ✅ Documented |
| 300 transactions/minute burst | TAA §58 | ✅ Documented |
| 250,000 notification batch | TAA §58 | ✅ Documented |
| 10 million analytics events/day | TAA §58 | ✅ Documented |
| 50 concurrent CMS operators | TAA §58 | ✅ Documented |

### 5.2 SLO Verification Tests

| Task | SLO Target | Status |
|------|------------|--------|
| Critical service availability ≥99.9% | AZP-NFR-001 | ✅ Documented |
| Critical API P95 ≤750ms, P99 ≤1500ms | AZP-NFR-004 | ✅ Documented |
| Search P95 ≤1.5s | AZP-NFR-004 | ✅ Documented |
| Playback startup P50 ≤2.5s, P95 ≤6s | AZP-NFR-005 | ✅ Documented |
| Rebuffer <2% of playback time | AZP-NFR-006 | ✅ Documented |
| Entitlement propagation ≤10s for 99% | AZP-NFR-007 | ✅ Documented |
| CMS publication propagation ≤5 min | TAA §57 | ✅ Documented |

### 5.3 Load Test Scenarios

| Task | Scenario | Priority |
|------|----------|----------|
| Premiere load test with playback authorisation | TAA §59 | P0 |
| Search load test under full corpus | TAA §59 | P0 |
| Payment flow load test with idempotency | TAA §59 | P0 |
| Notification batch load test | TAA §59 | P1 |
| Database connection pool saturation test | TAA §59 | P1 |
| Redis failover test under load | TAA §59 | P1 |

---

## 6. Security Testing (TAA §48, §85)

| Task | Reference | Priority |
|------|-----------|----------|
| OWASP ASVS-aligned security review | TAA §48 | P0 |
| OWASP MASVS-aligned mobile security review | TAA §48 | P0 |
| Penetration testing (auth, payment, entitlement) | TAA §85 | P0 |
| API abuse testing (rate limits, injection, IDOR) | TAA §85 | P0 |
| Entitlement spoofing tests | TAA §54 | P0 |
| Rights bypass tests | TAA §54 | P0 |
| Knowledge spoiler leakage tests | TAA §18 | P0 |
| Admin privilege escalation tests | TAA §54 | P0 |
| Supply chain vulnerability testing | TAA §84 | P1 |

---

## 7. Disaster Recovery Testing (TAA §87)

| Task | Reference | Priority |
|------|-----------|----------|
| Transactional database restore exercise (before M2) | TAA §87 | P0 |
| Application infrastructure recreation exercise (before M2) | TAA §87 | P0 |
| Quarterly production backup restore test | TAA §87 | P0 |
| Semi-annual DR tabletop (identity, commerce, rights, media) | TAA §87 | P1 |
| Annual regional-recovery exercise | TAA §87 | P1 |
| Recovery order validation (identity → DB → rights → API → media → admin) | TAA §87 | P0 |

---

## 8. Regression & Smoke Testing

| Task | Reference | Priority |
|------|-----------|----------|
| Post-deploy smoke checks (auth, catalog, playback, critical APIs) | TAA §45 | P0 |
| Full regression suite per release | TAA §45 | P0 |
| Cross-browser testing for web apps | TAA §7 | P1 |
| Android/iOS device matrix testing | TAA §6 | P1 |
| Low-bandwidth simulation testing | TAA §6 | P1 |
