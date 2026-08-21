# Tasks — AI/ML, Intelligence & Analytics Services

> Derived from AZP-TAA-001 R2.0 Parts VII, XI
> Services: analytics-service, recommendation-service, search-service

---

## 1. Analytics Service (`services/intelligence/analytics-service`)

### 1.1 Event Ingestion (TAA §39, AZP-AN-001)

| Task | Reference | Status |
|------|-----------|--------|
| Canonical product event taxonomy | AZP-AN-001 | Partial |
| Event collector with validation/enrichment | TAA §39 | Partial |
| Durable analytics stream/store | TAA §39 | Partial |
| Identity stitching (anonymous → user) | AZP-AN-002 | Partial |
| Content ID standardisation across events | AZP-AN-003 | Partial |
| Schema version on all events | TAA §39 | Needs implementation |
| PII minimisation before broad analytics access | TAA §39 | Needs implementation |
| Analytics outage never blocks critical paths | TA-LAW-08 | Needs verification |

### 1.2 Product Analytics (AZP-AN-006/007)

| Task | Reference | Status |
|------|-----------|--------|
| WEP (Watching Equivalent Per user) metric | AZP-AN-006 | Needs implementation |
| Contribution per WEP per content item | AZP-AN-007 | Needs implementation |
| Feature classification evidence | AZP-AN-009 | Needs implementation |
| Knowledge route analytics | AZP-AN-008 | Needs implementation |
| Campaign attribution for sponsors | AZP-AN-004 | Partial |

### 1.3 Analytics QA (AZP-AN-005)

| Task | Reference | Status |
|------|-----------|--------|
| Event completeness monitoring | AZP-AN-005 | Needs implementation |
| Event latency monitoring | AZP-AN-005 | Needs implementation |
| Event quality scoring | AZP-AN-005 | Needs implementation |
| Anomaly detection on event volume | TAA §88 | Needs implementation |

### 1.4 Analytics Storage Tiers (TAA §40)

| Tier | Purpose | Status |
|------|---------|--------|
| Hot operational | Recent events for debugging/live dashboards | Needs implementation |
| Warehouse | Curated facts/dimensions for reporting | Needs implementation |
| Archive | Lower-cost long-term retention | Needs implementation |

### 1.5 Analytics Economics (TAA §88)

| Task | Reference | Status |
|------|-----------|--------|
| Event volume monitoring per domain | TAA §88 | Needs implementation |
| Retention tier cost tracking | TAA §88 | Needs implementation |
| Cost per million events tracking | TAA §88 | Needs implementation |
| Prevent unbounded telemetry cardinality | TAA §88 | Needs implementation |

---

## 2. Recommendation Service (`services/intelligence/recommendation-service`)

### 2.1 Recommendation Capabilities

| Task | Reference | Status |
|------|-----------|--------|
| Content recommendations | — | ✅ Implemented |
| Creator recommendations | — | ✅ Implemented |
| Cross-universe recommendations | — | ✅ Implemented |
| Trending content | — | ✅ Implemented |
| User segment classification | — | ✅ Implemented |
| Creator score calculation | — | ✅ Implemented |
| Churn risk assessment | — | ✅ Implemented |
| Monetization insights | — | ✅ Implemented |
| Fraud risk assessment | — | ✅ Implemented |
| Personalised feed | — | ✅ Implemented |

### 2.2 Recommendation Quality (TAA §8)

| Task | Reference | Status |
|------|-----------|--------|
| Recommendations use rights-aware content only | TAA §8 | Needs verification |
| Recommendation outages don't block transactions | TA-LAW-08 | Needs verification |
| Eventual consistency acceptable for recommendations | TA-LAW-08 | ✅ By design |
| A/B testing framework for recommendation algorithms | — | Needs implementation |
| Recommendation diversity and fairness metrics | — | Needs implementation |
| Cold-start user handling | — | Needs implementation |

### 2.3 Recommendation Architecture (TAA §38)

| Task | Reference | Status |
|------|-----------|--------|
| Derived from cached/read models (eventual) | TAA §38 | ✅ By design |
| Not authoritative business state | TAA §38 | ✅ By design |
| Personalised feed respects Knowledge State | TAA §18 | Needs verification |
| Content availability filtering before recommendation | TAA §26 | Partial |

---

## 3. Search Service (`services/core/search-service`)

### 3.1 Search Capabilities

| Task | Reference | Status |
|------|-----------|--------|
| Universal search (PostgreSQL FTS/trigram) | ADR-016 | ✅ Implemented |
| Faceted search | — | ✅ Implemented |
| Search suggestions/autocomplete | — | ✅ Implemented |
| Trending searches | — | ✅ Implemented |
| Facet configuration | — | ✅ Implemented |
| Admin search statistics | — | ✅ Implemented |
| Search query logging | — | ✅ Implemented |
| Search index repair | — | ✅ Implemented |

### 3.2 Search Quality (TAA §38)

| Task | Reference | Status |
|------|-----------|--------|
| Results never return unavailable content | TAA §38 | Partial |
| Availability-aware result filtering | TAA §38 | Partial |
| Search P95 ≤1.5s target | AZP-SEARCH-001 | Needs measurement |
| Zero-result telemetry for improvement | AZP-SEARCH-002 | Partial |
| Multilingual search support | TAA §70 | Needs planning |
| Fuzzy/approximate matching | — | Partial |

### 3.3 Search Data Retention (LOW-04)

| Task | Reference | Status |
|------|-----------|--------|
| Anonymise search queries after 30 days | TAA §83 | ✅ Implemented |
| Delete anonymised logs after 90 days | TAA §83 | ✅ Implemented |
| SHA-256 hashing for anonymised queries | TAA §83 | ✅ Implemented |
| Batch processing (500 per transaction) | TAA §83 | ✅ Implemented |

### 3.4 Search Extraction Trigger (TAA §38)

| Trigger Condition | Threshold | Status |
|-------------------|-----------|--------|
| Search P95 cannot meet 1.5s target | Persistent | Needs measurement |
| Indexed documents exceed threshold | TBD (TAA-TBD-009) | Needs definition |
| Multilingual/faceting outgrow PostgreSQL | Qualitative | Needs evaluation |
| Independent scaling materially cheaper | Cost analysis | Needs evaluation |

---

## 4. AI Provenance & Content Generation (TAA §27, §81)

| Task | Reference | Status |
|------|-----------|--------|
| VCF provenance reference storage | TAA §27 | Needs implementation |
| Master version/hash tracking | TAA §27 | Needs implementation |
| Clearance state for AI-generated content | TAA §27 | Needs implementation |
| Talent/voice/likeness restriction tracking | TAA §27 | Needs implementation |
| Vendor/model restriction recording | TAA §27 | Needs implementation |
| AI provider outage doesn't affect consumer runtime | TAA §81 | Needs verification |
| Approved masters remain vendor-independent | TAA §81 | Needs verification |

---

## 5. Canonical Knowledge Graph AI Features (TAA §16-20)

| Task | Reference | Status |
|------|-----------|--------|
| Canonical event graph implementation | AZP-KNOW-001 | Needs implementation |
| Knowledge unit registry | AZP-KNOW-002 | Needs implementation |
| User knowledge state tracking | AZP-KNOW-003 | Needs implementation |
| Unlock trigger policy engine | AZP-KNOW-004 | Needs implementation |
| Cross-format equivalence mapping | AZP-KNOW-005 | Needs implementation |
| Partial consumption tracking | AZP-KNOW-007 | Needs implementation |
| Skip protection (prevent knowledge bypass) | AZP-KNOW-008 | Needs implementation |
| Rewatch idempotency | AZP-KNOW-009 | Needs implementation |
| Cross-title namespace isolation | AZP-KNOW-010 | Needs implementation |
| Manual remediation capability | AZP-KNOW-011 | Needs implementation |
| Knowledge parity analytics | AZP-KNOW-012 | Needs implementation |

---

## 6. Sponsor Analytics (TAA §33)

| Task | Reference | Status |
|------|-----------|--------|
| Campaign metrics joined from analytics by campaign_id | TAA §33 | Partial |
| Sponsor does not receive raw unrestricted PII | TAA §33 | Needs verification |
| Campaign attribution accuracy | AZP-AN-004 | Partial |
| Sponsor reporting integrity | AZP-SPON-004 | Partial |
| Frequency cap enforcement tracking | AZP-SPON-003 | Partial |
