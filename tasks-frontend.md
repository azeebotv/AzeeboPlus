# Tasks — Frontend (Web, Mobile, Admin, Creator)

> Derived from AZP-TAA-001 R2.0 Technical Architecture Authority
> Cross-referenced with actual project codebase state

---

## 1. Consumer Web App (`apps/web`)

### 1.1 Pages & Routing (from PRD traceability)

| Task | PRD Ref | Status | Priority |
|------|---------|--------|----------|
| Home feed with configurable modules (Continue Watching, Release, Mission) | AZP-HOME-001/002/003/004 | Partial | P0 |
| Explore categories with universe visibility flags | AZP-EXP-001/002 | Partial | P0 |
| Search with availability-aware results + zero-result telemetry | AZP-SEARCH-001/002/003 | Partial | P0 |
| Title detail pages per universe (vertical, movie, reality, comedy, etc.) | AZP-MS-001 | Partial | P0 |
| Long-form player with entitlement check | AZP-MS-002/003 | Partial | P0 |
| Rights override enforcement (server-side only) | AZP-MS-004 | ✅ Verified | P0 |
| Post-play state (continue watching, up next) | AZP-MS-005 | Partial | P1 |
| Storyworld hub, character pages, relationship view, timeline | AZP-STORY-001–004 | Partial | P0 |
| "What You Know" knowledge-safe view | AZP-STORY-005 | ✅ Implemented | P0 |
| Progressive unlock UI (spoiler-safe) | AZP-STORY-006 | ✅ Implemented | P0 |
| Locked deep-link handling | AZP-STORY-007 | ✅ Implemented | P0 |
| API spoiler safety (no hidden facts in responses) | AZP-STORY-008 | Backend-driven | P0 |
| Vertical 9:16 native playback | AZP-VERT-001 | Partial | P0 |
| Sequential vertical continuation | AZP-VERT-002 | Partial | P0 |
| Progress persistence across sessions | AZP-VERT-003 | Partial | P0 |
| Captions/subtitles (WebVTT) | AZP-VERT-004 | ✅ Implemented | P0 |
| Deep-link sharing | AZP-VERT-005 | Partial | P0 |
| Release cadence configuration display | AZP-VERT-006 | ✅ Implemented | P1 |
| End-state CTA after vertical completion | AZP-VERT-007 | ✅ Implemented | P1 |

### 1.2 API Contract Compliance (TAA §9)

| Task | Standard | Status |
|------|----------|--------|
| All API calls use versioned `/v1/` paths | OpenAPI 3.1.x | Partial |
| Error handling uses RFC 9457 Problem Details shape | TAA §9 | ✅ Implemented |
| Request correlation via `x-correlation-id` header | TAA §9 | ✅ Implemented |
| Idempotency-Key support for mutation classes (purchases, grants) | TAA §9 | ✅ Implemented |
| Cursor-based pagination for feeds/ledgers | TAA §9 | Partial |
| All timestamps displayed in user locale (UTC in API) | TAA §9 | Partial |
| Opaque UUID/ULID identifiers (no sequential IDs exposed) | TAA §9 | Partial |

### 1.3 Client Architecture (TAA §6/7)

| Task | Reference | Status |
|------|-----------|--------|
| Typed API clients generated from OpenAPI contracts | TAA §6 | ✅ Implemented |
| Platform secure storage for session material | TAA §6 | N/A (web uses HttpOnly cookies) |
| Media playback reports standardised telemetry | TAA §6 | Partial |
| Business-critical auth state not trusted from local cache | TAA §6 | ✅ Verified |
| Client DB limited to non-authoritative cache/preferences | TAA §6 | ✅ Done |

### 1.4 Content-Security-Policy & Security Headers

| Task | Standard | Status |
|------|----------|--------|
| Comprehensive CSP headers | OWASP ASVS | ✅ Present in next.config.js |
| CORS allow-listing | TAA §53 | ✅ Configured |
| Secure cookie flags (HttpOnly, Secure, SameSite) | TAA §53 | Partial |
| X-Content-Type-Options: nosniff | OWASP | ✅ Verified |
| Rate limit awareness on client-side | TAA §53 | ✅ Implemented |

### 1.5 Performance & UX

| Task | SLO Target | Status |
|------|------------|--------|
| Playback startup P50 ≤2.5s, P95 ≤6s | AZP-NFR-005 | ✅ Documented |
| Rebuffer ratio <2% of playback time | AZP-NFR-006 | ✅ Documented |
| Crash-free sessions ≥99.5% | AZP-NFR-002 | N/A (web) |
| Data Saver mode for low-bandwidth users | AZP-MEDIA-003 | Partial |
| Graceful degradation on API failures | AZP-MEDIA-006 | Partial |

---

## 2. Consumer Mobile App (`apps/mobile`)

### 2.1 React Native Architecture (TAA §6, ADR-001)

| Task | Reference | Status |
|------|-----------|--------|
| React Native New Architecture enabled | ADR-001 | ✅ Enabled (newArchEnabled: true) |
| Android-first optimisation | TAA §6 | ✅ Verified |
| iOS-compatible codebase (not divergent) | TAA §6 | ✅ Verified |
| Supported stable release pinned per release train | TAA §6 | ✅ Verified (eas.json)
| Typed API clients from OpenAPI contracts | TAA §6 | Partial |

### 2.2 Platform Security (TAA §6, OWASP MASVS)

| Task | Reference | Status |
|------|-----------|--------|
| Secure storage (Keychain/Keystore) for refresh tokens | TAA §6 | ✅ Uses expo-secure-store |
| No secrets in consumer binaries | TA-LAW-06 | ✅ Verified |
| Network security configuration (TLS pinning consideration) | OWASP MASVS | ✅ Implemented |
| Release signing and tamper controls | TAA §53 | ✅ Implemented |
| No API keys or admin credentials shipped | TA-LAW-06 | ✅ Verified |

### 2.3 Playback & Media

| Task | Reference | Status |
|------|-----------|--------|
| Native-capable player integration | TAA §6 | Partial |
| Adaptive bitrate with Data Saver support | AZP-MEDIA-003 | Partial |
| Playback telemetry (rendition, startup, buffering, completion) | AZP-MEDIA-005 | Partial |
| Deep-link handling for content sharing | AZP-VERT-005 | Partial |
| Offline-safe UX patterns | TAA §6 | ✅ Implemented |

### 2.4 Client State Management

| Task | Reference | Status |
|------|-----------|--------|
| Local DB limited to non-authoritative cache | TAA §6 | ✅ Verified |
| Auth state rehydrated from server, not local trust | TAA §6 | ✅ Verified |
| Schema versioning for persisted cache/state | TAA §89 | ✅ Implemented |
| Destructive migration preserves login/purchase truth | TAA §89 | ✅ Implemented |

### 2.5 App Store Compliance

| Task | Reference | Status |
|------|-----------|--------|
| iOS App Store review guidelines compliance | TAA §28 | ✅ Verified |
| Android Play Store billing integration | ADR-017 | ✅ Implemented |
| Privacy policy and data collection disclosures | TAA §83 | ✅ Implemented |
| Forced upgrade UX (clear reason + store path) | TAA §89 | ✅ Implemented |

---

## 3. Admin Dashboard (`apps/admin`)

### 3.1 Security Boundary (TAA §8)

| Task | Reference | Status |
|------|-----------|--------|
| Separate web application security boundary | TAA §8 | ✅ Separate app |
| Privileged IdP roles with MFA | TAA §49 | Partial |
| Stronger session controls for admin | TAA §49 | Partial |
| All mutations call audited backend endpoints | TAA §8 | ✅ Via API gateway |
| No direct database administration for routine ops | TAA §8 | ✅ Enforced |

### 3.2 Admin Capabilities

| Task | PRD Ref | Status |
|------|---------|--------|
| CMS: content entity management, lifecycle, release scheduling | AZP-CMS-001/002/003 | Partial |
| Rights management: record, availability enforcement | AZP-RIGHTS-001/002 | Partial |
| Talent/music clearance management | AZP-RIGHTS-003/004 | ✅ Implemented |
| AI provenance reference management | AZP-RIGHTS-005 | ✅ Implemented |
| Sponsor campaign configuration | AZP-SPON-001/002/003 | Partial |
| Sponsor reporting integrity | AZP-SPON-004 | Partial |
| Feature flag management (server-authoritative) | AZP-ADMIN-003 | ✅ Implemented |
| Named admin accounts | AZP-ADMIN-001 | ✅ Implemented |
| Audit high-risk actions | AZP-ADMIN-002 | Partial |
| Dual-control candidate actions | AZP-ADMIN-004 | ✅ Implemented |
| Support lookup with least-privilege | AZP-SUP-001/002 | Partial |

### 3.3 RBAC & Authorization (TAA §50)

| Task | Reference | Status |
|------|-----------|--------|
| RBAC with least-privilege per role | TAA §50 | ✅ Implemented |
| Superadmin-only restrictions on destructive ops | TAA §50 | ✅ Applied |
| UI visibility ≠ authorization enforcement | TAA §50 | ✅ Verified (PermissionGuard, RoleGuard)
| Audit trail for admin mutations | TAA §56 | ✅ Implemented |
| Dual-control for large refunds, manual entitlements | TAA §55 | ✅ Implemented |

---

## 4. Creator Portal (`apps/creator`)

### 4.1 Creator Identity (TAA §68)

| Task | Reference | Status |
|------|-----------|--------|
| Creator role without converting consumer identity to admin | TAA §68 | Partial |
| Creator profile management (displayName, bio, avatar) | AZP-CMS-001 | ✅ Implemented |
| Creator onboarding wizard | — | ✅ Implemented |

### 4.2 Content Management (TAA §68)

| Task | Reference | Status |
|------|-----------|--------|
| Creator upload path (separate from VCF ACDP) | TAA §68 | ✅ Implemented |
| Content lifecycle management (draft/published/archived) | AZP-CMS-002 | ✅ Implemented |
| Content analytics per creator | AZP-AN-006 | ✅ Implemented |
| Monetization settings management | — | ✅ Implemented |

### 4.3 Earnings & Payouts (TAA §68)

| Task | Reference | Status |
|------|-----------|--------|
| Creator earnings dashboard | TAA §68 | ✅ Implemented |
| Payout request flow | TAA §68 | ✅ Implemented |
| Earnings analytics | TAA §68 | ✅ Implemented |

---

## Cross-Cutting Frontend Tasks

### F-CC-01: Internationalisation (TAA §70)
- All stored timestamps UTC; locale formatting client-side ✅
- Content entities support localised metadata ✅ (6 languages: en, fr, pt, ha, yo, ig)
- No hard-coded Nigeria-only assumptions in domain keys ✅
- RTL support consideration for future markets ✅

### F-CC-02: Error Boundaries & Resilience
- Global error boundaries per app ✅
- Graceful degradation on API failures ✅
- Offline indicators and retry mechanisms ✅
- Network state awareness ✅

### F-CC-03: Accessibility
- WCAG 2.1 AA compliance for web surfaces ✅
- Screen reader support for mobile ✅
- Keyboard navigation for admin ✅
- Colour contrast and touch targets ✅

### F-CC-04: Analytics Integration (TAA §39)
- Canonical product events via analytics SDK ✅
- Event_id, anonymous/user identity, content dimensions ✅
- Schema version on all events ✅
- PII minimisation in client events ✅
- Campaign attribution for sponsor tracking ✅

### F-CC-05: Capability Negotiation (TAA §89)
- Server returns min_supported_version metadata ✅
- Client hides unsupported flows safely ✅
- Forced upgrade UX with clear reason and store path ✅
- Backend rollback preserves contracts for supported clients ✅
