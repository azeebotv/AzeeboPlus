# Tasks — Data (Database, Caching, Eventing, Search)

> Derived from AZP-TAA-001 R2.0 Part VII

---

## 1. PostgreSQL (TAA §34, ADR-004)

### 1.1 Schema Architecture

| Task | Reference | Status |
|------|-----------|--------|
| Separate domain schemas (identity, catalog, rights, knowledge, etc.) | TAA §13 | ✅ Implemented |
| No cross-domain direct writes | TA-LAW-02 | ✅ Enforced via roles |
| Cross-domain FK coupling prohibited (opaque IDs preferred) | TAA §13 | ✅ Verified |
| JSONB for bounded extensible metadata only | TAA §34 | ✅ Verified |
| No large media binaries in PostgreSQL | TAA §34 | ✅ Enforced |
| Read replicas for reporting/read-heavy workloads | TAA §34 | ✅ Implemented |

### 1.2 Database Roles & Enforcement (TAA §79)

| Task | Reference | Status |
|------|-----------|--------|
| Per-domain application DB roles | TAA §79 | ✅ Implemented |
| Runtime roles limited to owned schema | TAA §79 | ✅ Implemented |
| Separate migration role (privileged) | TAA §79 | ✅ Implemented |
| Cross-domain ad hoc writes denied at DB layer | TAA §79 | ✅ Implemented |
| Architecture tests for dependency directions | TAA §79 | ✅ Implemented |
| Cross-schema update permissions denied | TAA §79 | ✅ Implemented |

### 1.3 Prisma Schema Audit

| Domain Schema | Model Count | Status |
|---------------|-------------|--------|
| identity | user accounts, sessions | ✅ Exists |
| catalog | content, categories, tags | ✅ Exists |
| rights | rights records | ✅ Exists |
| knowledge | canonical events, knowledge units, grants | ✅ Implemented |
| participation | polls, quizzes, predictions | ✅ Exists |
| rewards | points ledger, badges, streaks, missions | ✅ Exists |
| commerce | products, orders, payments, transactions | ✅ Exists |
| entitlement | access grants | ✅ Exists |
| audit | admin action logs | ✅ Exists |
| media | media assets, renditions | ✅ Exists |
| wallet | wallets, transactions | ✅ Exists |
| creator | creator profiles, channels, earnings | ✅ Exists |
| reality | shows, seasons, episodes, contestants, votes | ✅ Exists |
| messaging | conversations, messages | ✅ Exists |
| notification | notifications, templates, campaigns | ✅ Exists |
| subscription | plans, subscriptions, bundles | ✅ Exists |
| moderation | cases, actions, appeals | ✅ Exists |
| support | tickets | ✅ Exists |

---

## 2. Redis / Ephemeral Store (TAA §35, ADR-005)

### 2.1 Allowed Uses

| Task | Reference | Status |
|------|-----------|--------|
| Cache (with domain prefix/version and bounded TTL) | TAA §35 | ✅ Implemented |
| Rate limit counters | TAA §35 | ✅ Implemented |
| Short-lived idempotency locks | TAA §35 | ✅ Implemented |
| Ephemeral session/reference state | TAA §35 | ✅ Implemented |
| Queue coordination | TAA §35 | ✅ Implemented |

### 2.2 Prohibited Uses (Enforcement)

| Task | Reference | Status |
|------|-----------|--------|
| Not authoritative for payment status | TA-LAW-03 | ✅ Verified |
| Not authoritative for entitlement history | TA-LAW-03 | ✅ Verified |
| Not authoritative for reward ledger | TA-LAW-03 | ✅ Verified |
| Not authoritative for rights truth | TA-LAW-03 | ✅ Verified |
| Not authoritative for canon/knowledge truth | TA-LAW-03 | ✅ Verified |
| Cache failure degrades performance, not truth | TAA §35 | ✅ Verified |
| Invalidation events preferred for critical hot reads | TAA §35 | ✅ Implemented |

---

## 3. Transactional Outbox Pattern (TAA §15, ADR-006)

| Task | Reference | Status |
|------|-----------|--------|
| Business state + outbox record in same transaction | TAA §15 | ✅ Implemented |
| No dual-write without outbox | TA-LAW-04 | ✅ Enforced |
| Outbox publisher for managed queue/event bus | TAA §15 | ✅ Implemented |
| At-least-once delivery assumption | TAA §37 | ✅ Verified |
| Idempotent consumers | TAA §37 | ✅ Implemented |
| Dead-letter queues for critical consumers | TAA §37 | ✅ Implemented |

---

## 4. Event System (TAA §36-37)

### 4.1 Event Envelope (TAA §36)

| Field | Requirement | Status |
|-------|-------------|--------|
| event_id | Globally unique | ✅ Implemented |
| event_type | Stable versioned name | ✅ Implemented |
| event_version | Integer/schema version | ✅ Implemented |
| occurred_at | UTC timestamp | ✅ Implemented |
| producer | Domain/module | ✅ Implemented |
| subject_id | Opaque entity/user/content key | ✅ Implemented |
| correlation_id | Trace/business correlation | ✅ Implemented |
| causation_id | Prior event/request | ✅ Implemented |
| payload | Minimal business data, avoid PII | ✅ Implemented |
| schema_ref | Schema/contract identifier | ✅ Implemented |

### 4.2 Event Delivery (TAA §37, §80)

| Task | Reference | Status |
|------|-----------|--------|
| Schema registry for durable event types | TAA §80 | ✅ Implemented |
| Aggregate ordering (aggregate_id + sequence) | TAA §80 | ✅ Implemented |
| Out-of-order detection and handling | TAA §80 | ✅ Implemented |
| Replay from authoritative records only | TAA §80 | ✅ Implemented |
| Replay safety (distinguish from live) | TAA §80 | ✅ Implemented |
| DLQ with alert, owner, retry, quarantine | TAA §80 | ✅ Implemented |
| Backfill versioned jobs with dry-run | TAA §80 | ✅ Implemented |
| Producer/consumer contract tests in CI | TAA §80 | ✅ Implemented |

### 4.3 Critical Events Catalogue (Appendix B)

| Event | Producer | Consumers | Status |
|-------|----------|-----------|--------|
| UserRegistered | Identity | Analytics/Profile | ✅ Implemented |
| ConsentRecorded | Identity | Audit/Privacy | ✅ Implemented |
| ContentPublished | Catalog | Discovery/Notifications | ✅ Implemented |
| RightsChanged | Rights | Media/Discovery | ✅ Implemented |
| MediaReady | Media | Catalog/Ops | ✅ Implemented |
| WatchCheckpointReached | Media | Knowledge/Analytics | ✅ Implemented |
| KnowledgeGranted | Knowledge | Storyworld/Analytics | ✅ Implemented |
| ParticipationSubmitted | Participation | Rewards/Analytics | ✅ Implemented |
| RewardGranted | Rewards | Notifications/Analytics | ✅ Implemented |
| RewardRedeemed | Rewards | Analytics/Commercial | ✅ Implemented |
| PaymentConfirmed | Commerce | Entitlement/Analytics | ✅ Implemented |
| EntitlementGranted | Entitlement | Notifications/Analytics | ✅ Implemented |
| RefundRecorded | Commerce | Entitlement/Finance | ✅ Implemented |
| CampaignActivated | Sponsor | Discovery/Analytics | ✅ Implemented |
| NotificationRequested | Domain | Notification | ✅ Implemented |
| AdminActionRecorded | Audit | Security/Ops | ✅ Implemented |

---

## 5. Search Architecture (TAA §38, ADR-016)

| Task | Reference | Status |
|------|-----------|--------|
| PostgreSQL full-text/trigram indexing | ADR-016 | ✅ Implemented |
| Availability-aware read model | TAA §38 | ✅ Implemented |
| Results never return unavailable content | TAA §38 | ✅ Implemented |
| Search P95 ≤1.5s target | AZP-NFR-004 | ✅ Implemented |
| Extraction trigger documentation | TAA §38 | ✅ Documented |
| Zero-result telemetry | AZP-SEARCH-002 | ✅ Implemented |
| Multilingual support consideration | TAA §70 | ✅ Implemented |

---

## 6. Data Retention & Classification (Appendix C)

| Data Type | Class | Retention Control | Status |
|-----------|-------|-------------------|--------|
| Account identity | Restricted | Per account/legal policy | ✅ Implemented |
| Consent record | Confidential | Retain version/history | ✅ Implemented |
| Watch progress | Confidential | Product-defined | ✅ Implemented |
| Payment reference | Restricted | Finance/legal retention | ✅ Implemented |
| Entitlement ledger | Confidential | Commercial/audit retention | ✅ Implemented |
| Reward ledger | Confidential | Commercial/audit retention | ✅ Implemented |
| Knowledge grants | Confidential | Account/storyworld lifecycle | ✅ Implemented |
| Analytics events | Confidential/Pseudonymous | Tiered retention | ✅ Implemented |
| Admin audit | Restricted | Security/legal retention | ✅ Implemented |
| Media derivatives | Internal/Public by state | Rights window + lifecycle | ✅ Implemented |
| VCF provenance reference | Confidential | Content/rights lifecycle | ✅ Implemented |

---

## 7. Knowledge Graph (TAA §16-20)

| Task | Reference | Status |
|------|-----------|--------|
| canonical_event table | TAA §16 | ✅ Implemented |
| knowledge_unit table | TAA §16 | ✅ Implemented |
| knowledge_dependency table | TAA §16 | ✅ Implemented |
| content_checkpoint table | TAA §16 | ✅ Implemented |
| checkpoint_grant table | TAA §16 | ✅ Implemented |
| equivalence_set table | TAA §16 | ✅ Implemented |
| user_knowledge_grant table (append-only) | TAA §16 | ✅ Implemented |
| knowledge_projection read model | TAA §16 | ✅ Implemented |
| Knowledge grant flow (checkpoint → grant) | TAA §17 | ✅ Implemented |
| Cross-format equivalence mapping | TAA §18 | ✅ Implemented |
| Server-side spoiler control | TAA §18 | ✅ Implemented |
| Redis cache for active user known-set | TAA §19 | ✅ Implemented |
| Knowledge projection rebuild capability | TAA §77 | ✅ Implemented |
| Canon versioning with supersedes | TAA §77 | ✅ Implemented |
| Knowledge correction with audit history | TAA §77 | ✅ Implemented |
