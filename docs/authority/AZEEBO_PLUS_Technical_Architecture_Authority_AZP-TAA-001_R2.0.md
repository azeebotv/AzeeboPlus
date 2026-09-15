**AZEEBO+**

**TECHNICAL ARCHITECTURE AUTHORITY**

FINAL TRUE-MERGER, DOMAIN-ENFORCED, ATOMIC-RELEASE, CANON-VERSIONED, SUPPLY-CHAIN-SECURE, FAILURE-COMPLETE, FINOPS-CONTROLLED TECHNICAL ARCHITECTURE AUTHORITY

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>MASTER AUTHORITY<br />
</strong>AZP-TAA-001 — R2.0 / P2.0 / PA2.0</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

| **CONTROL** | **DESIGNATION** |
|----|----|
| Parent Product Authority | AZP-PDDMA-001 — Product Development & Deployment Master Authority |
| Parent Requirements Authority | AZP-FMVP-PRD-001 — R2.0 / P2.0 / PA2.0 |
| Product | Azeebo+ |
| Founding IP | Agbàlá Olódùmarè Universe (AOU) |
| Founding Title | Omíṣẹwà: The Throne Remembers |
| Architecture Style | Modular Monolith + Managed Platform Services + Event-Driven Side Effects |
| Reference Cloud | AWS — Africa (Cape Town) primary reference deployment, subject to legal/data-transfer approval |
| Status | Controlling Technical Architecture Authority |
| Effective Date | 8 August 2026 |

CONFIDENTIAL — INTERNAL PRODUCT, ENGINEERING, SECURITY, DATA, OPERATIONS & APPROVED PARTNER USE ONLY

# CONFIDENTIALITY, AUTHORITY & REVISION CONTROL

This document contains confidential technical architecture, security, operational, commercial-control and platform design information belonging to Virtual Media Network Limited. It is intended for controlled internal execution and approved technical/vendor diligence only.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>CONTROLLING RULE<br />
</strong>Where this Technical Architecture Authority conflicts with AZP-PDDMA-001 or AZP-FMVP-PRD-001 R2.0, the higher authority prevails. Subordinate implementation specifications may refine this architecture but may not bypass its domain boundaries, ledgers, rights controls, security controls, SLOs or release gates without approved architecture change control.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

| **REVISION** | **STATUS** | **CONTROL CHANGE** |
|----|----|----|
| R1.0 / P1.0 / PA1.0 | Initial Final Technical Authority | Locks reference stack, modular-monolith boundaries, data ownership, Canonical Knowledge Graph implementation, commerce ledgers, media pipeline, cloud topology, API standards, eventing, SRE, security, capacity and extraction triggers. |
| R2.0 / P2.0 / PA2.0 | Final True-Merger Technical Authority | Supersedes R1.0 as controlling technical authority while preserving all R1 locks. Adds canon/version correction, atomic release manifests, enforced domain boundaries, event replay/order governance, external-dependency resilience, emergency rights takedown, privacy/ledger deletion semantics, mandatory software-supply-chain security, threat modelling, break-glass control, executable DR, FinOps, client compatibility and Technical TBD closure gates. |

## Authority Hierarchy

1.  AZP-PDDMA-001 — Product Development & Deployment Master Authority.

2.  AZP-FMVP-PRD-001 — R2.0 Founding MVP Master PRD.

3.  AZP-TAA-001 — R2.0 / P2.0 / PA2.0 — this Technical Architecture Authority, superseding R1.0.

4.  Subordinate data model, API, media, security, SRE, CI/CD, environment and vendor implementation specifications.

5.  Sprint-level technical tasks and code-level implementation decisions.

# EXECUTIVE TECHNICAL LOCK

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>ARCHITECTURE THESIS<br />
</strong>Azeebo+ shall begin as a modular monolith with strict domain ownership, one highly available relational system of record, asynchronous side effects through transactional outbox/event delivery, managed media/cloud services, server-authoritative rights/entitlements/knowledge, and vendor-abstraction boundaries around identity, payments, media processing, push and analytics.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

| **DECISION** | **LOCK** |
|----|----|
| Consumer mobile | React Native New Architecture; supported stable release at implementation lock; Android-first optimisation, iOS-compatible codebase. |
| Responsive web / admin | React / Next.js; separate consumer-web and privileged-admin surfaces. |
| Backend | TypeScript / NestJS modular monolith with independent domain modules and worker processes. |
| System of record | PostgreSQL; separate domain schemas; no cross-domain direct writes. |
| Ephemeral/cache | Redis-compatible managed cache; never authoritative for commercial ledgers. |
| Asynchronous integration | Transactional outbox + managed queue/event bus; at-least-once delivery with idempotent consumers. |
| Media | Object storage + managed transcoding + HLS/CMAF adaptive delivery + CDN + signed playback authorisation. |
| API | REST/JSON, OpenAPI 3.1.x contract, RFC 9457 problem details, explicit idempotency/correlation standards. |
| Observability | OpenTelemetry-compatible traces, metrics and logs; SLO-driven alerting. |
| Cloud | AWS reference deployment, Multi-AZ in Africa (Cape Town); provider boundaries retained. |
| Infrastructure | Containerised workloads on managed container service; Terraform IaC; no Kubernetes requirement in founding phase. |
| Search | PostgreSQL full-text/trigram first; extract to dedicated search engine only at trigger. |
| Graph | No graph database in founding phase; Canonical Knowledge Graph implemented relationally in PostgreSQL. |
| Microservices | Explicitly deferred until extraction triggers are met. |
| Atomic release authority | Every public media/content release is bound to one immutable Release Manifest linking exact master, catalog, rights, knowledge mapping, subtitles, provenance and commercial state. |
| Domain enforcement | Database roles, application dependency rules and architecture tests enforce owning-domain writes; policy alone is insufficient. |
| Supply-chain security | SBOM, signed build artefacts, protected CI, vulnerability gates and production artefact verification are mandatory. |
| Failure resilience | External dependencies require explicit timeouts, retry/backoff, circuit breakers/degraded modes and recovery contracts. |
| FinOps | Cost allocation, anomaly detection and unit-cost observability are production architecture requirements. |

## Why This Architecture

- Keeps the founding engineering organisation small enough to operate safely.

- Provides transactional integrity for payments, entitlements, rewards and knowledge grants.

- Preserves clean extraction paths for Reality, Creator, Games, Sports and high-scale media functions.

- Avoids premature operational overhead from Kubernetes, Kafka, graph databases and dozens of independently deployed services.

- Enforces the parent authorities’ law: reuse before rebuild and complexity must earn its existence.

# CONTROL INDEX

**PART I — Architecture Principles, Decisions & Context**

**PART II — Client, Edge, API & Application Topology**

**PART III — Domain Architecture & Ownership**

**PART IV — Canonical Knowledge Graph & Storyworld Architecture**

**PART V — Media, Content, Rights & Provenance Architecture**

**PART VI — Commerce, Entitlements, Rewards & Sponsor Architecture**

**PART VII — Data, Search, Analytics, Eventing & Consistency**

**PART VIII — Cloud, Environments, CI/CD & Infrastructure**

**PART IX — Security, Privacy, Fraud & Administrative Control**

**PART X — SRE, SLOs, Capacity, DR & Incident Architecture**

**PART XI — Multi-Universe Evolution & Service Extraction**

**PART XII — Technical Governance, ADRs, Traceability & Acceptance**

PART XIII — R2 Final Enforcement, Failure, Recovery, FinOps & Compatibility Controls

APPENDICES — Reference Stack, Events, Data/Retention, TBDs, PRD Traceability, Standards, R2 Enforcement Registers, Release/Canon Controls, Resilience, Supply Chain, DR/FinOps & Compatibility

# PART I — ARCHITECTURE PRINCIPLES, DECISIONS & CONTEXT

## 1. Architectural Objectives

- Meet all P0/P1 founding PRD requirements without overbuilding future universes.

- Maintain strong consistency for commercial, rights, reward and knowledge state.

- Provide a simple extraction path when specific domains require independent scaling or release cadence.

- Operate within the Founding Capacity Envelope while supporting at least 2x tested burst headroom on critical paths where practical.

- Make Nigeria/mobile-network realities first-class technical requirements.

- Keep external vendors replaceable through adapters and portable data contracts.

- Preserve auditable provenance and rights control for AI-native AOU content.

## 2. Architecture Invariants

| **ID** | **INVARIANT** | **CONTROL** |
|----|----|----|
| TA-LAW-01 | Server authority | Rights, entitlements, premium eligibility, Knowledge State, reward grants and critical participation state are authorised on the server, never by client flags alone. |
| TA-LAW-02 | Domain writes | Only the owning domain may write its authoritative tables. |
| TA-LAW-03 | Ledger integrity | Commerce, entitlement, reward and knowledge-grant ledgers are append-oriented/auditable and never silently rewritten. |
| TA-LAW-04 | Idempotency | External callbacks, purchases, grants, redemptions and outbox consumers must be safely repeatable. |
| TA-LAW-05 | No public origins | Media/object-store origins are private; consumers access through authorised delivery paths. |
| TA-LAW-06 | No client secrets | No privileged secret or provider credential is embedded in consumer binaries. |
| TA-LAW-07 | No security via feature flag | Feature flags may hide capability but cannot substitute for backend authorisation. |
| TA-LAW-08 | Eventual where safe | Analytics, recommendations and notification side effects may be eventual; payment/entitlement/rights/knowledge writes may not. |
| TA-LAW-09 | Observable by default | Every critical request and job carries correlation context and emits required telemetry. |
| TA-LAW-10 | Portable vendors | Identity, payment, media, push, analytics and AI-provider integrations terminate behind adapter contracts. |
| TA-LAW-11 | No future-universe coupling | Founding code may expose extension points but shall not include dormant complex Reality/Games/Sports logic. |
| TA-LAW-12 | Migration discipline | Schema changes are versioned, reversible where practical and deployed through controlled migrations. |

## 3. Architecture Style

Founding Azeebo+ uses a modular monolith for transactional business domains, supported by independently deployed worker processes and managed infrastructure services. The application is one deployable backend boundary initially, but its internal modules are treated as if they were future services: each has explicit public interfaces, data ownership, events and dependency rules.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>EXTRACTION RULE<br />
</strong>A module may become a separate service only after a measurable trigger: independent scaling need, independent release ownership, isolation requirement, materially different availability target, heavy asynchronous workload, or regulatory/security boundary. Team preference alone is not an extraction trigger.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 4. System Context

| **ACTOR / SYSTEM** | **INTERACTION WITH AZEEBO+** |
|----|----|
| Consumer Mobile App | Discovery, playback, Storyworld, participation, rewards, commerce, profile. |
| Responsive Consumer Web | Deep-link acquisition, approved public viewing/discovery, account and selected premium flows. |
| Admin Web | CMS, rights, sponsor, support, finance lookup, feature flags and audit-controlled operations. |
| VCF | Uploads ACDP packages, media masters, provenance references and metadata. |
| VTM | Supplies performer, voice, likeness and digital-replica permission state. |
| Payment Channels | App-store billing and approved external payment providers through adapters. |
| Identity Provider | OIDC/OAuth authentication and account lifecycle. |
| Push Providers | FCM/APNs or equivalent through notification adapter. |
| Media Platform | Transcoding/packaging/origin/CDN delivery. |
| Analytics Warehouse | Receives pseudonymised product events and business facts. |
| Commercial/Finance/Support | Privileged operational interfaces with least-privilege RBAC. |

# PART II — CLIENT, EDGE, API & APPLICATION TOPOLOGY

## 5. Reference End-to-End Topology

| **LAYER** | **REFERENCE COMPONENTS** | **RESPONSIBILITY** |
|----|----|----|
| Consumer clients | React Native mobile; responsive Next.js web | UI, local session state, playback, presentation, offline-safe UX. |
| Edge | DNS, CDN, WAF, TLS termination, rate limiting | Public edge protection, cacheable delivery, bot/abuse filtering. |
| API facade | Versioned REST API / BFF-style composition inside backend | Client contract, authentication context, response shaping. |
| Application | NestJS modular monolith + background workers | Transactional domain logic and asynchronous jobs. |
| Data | PostgreSQL + Redis + object storage | Authoritative relational state, cache/idempotency, media/assets. |
| Integration | Queue/event bus + vendor adapters | External callbacks, push, media jobs, analytics, sponsor/finance integrations. |
| Operations | Admin web + observability + CI/CD | Controlled administration, deployment, monitoring, incident response. |

## 6. Mobile Client Architecture

- React Native New Architecture is the reference mobile framework. Use the supported stable release approved at implementation lock; versions are pinned per release train.

- Android is the primary optimisation target; iOS is developed from the same architecture and must not become a divergent application.

- Use typed API clients generated or validated from OpenAPI contracts where practical.

- Use platform secure storage/Keychain/Keystore for sensitive session material; never general asynchronous storage for refresh credentials.

- Media playback uses native-capable player integration and reports standardised playback telemetry.

- Business-critical authorisation state is not trusted from local client cache without server validation.

- Client database/storage is limited to non-authoritative cache, preferences and resumable UX state.

## 7. Consumer Web Architecture

- Next.js/React reference implementation for deep-link acquisition, responsive browsing and approved playback/commercial flows.

- Server-side or edge rendering may be used for public discoverability, but private user state remains authenticated and rights-aware.

- Consumer web and mobile consume the same domain APIs; avoid business-rule duplication in web server code.

- Public metadata pages may be cached; entitlement/Knowledge State responses are user-specific and non-public-cacheable.

## 8. Privileged Admin Architecture

- Admin is a separate web application and security boundary, not a hidden route in the consumer app.

- Authentication uses privileged IdP roles with MFA and stronger session controls.

- All mutations call audited backend admin endpoints; direct database administration is prohibited for routine operations.

- High-risk actions can require dual control/secondary approval workflow.

- Admin response payloads must be least-privilege by role and case purpose.

## 9. API Contract Standard

| **CONTROL** | **STANDARD** |
|----|----|
| Protocol | HTTPS REST/JSON for founding synchronous APIs. |
| Specification | OpenAPI 3.1.x contract as source-of-truth for externally consumed HTTP APIs. |
| Versioning | /v1 major path or equivalent explicit compatibility scheme; breaking changes require new major contract. |
| Errors | RFC 9457 Problem Details shape with stable internal error code. |
| Correlation | x-correlation-id propagated or generated at edge/API. |
| Idempotency | Idempotency-Key required for defined mutation classes such as purchase initiation and manual grants. |
| Pagination | Cursor-based for high-growth feeds/ledgers; offset permitted only for bounded admin lists. |
| Time | UTC in persistence and APIs; local formatting at client. |
| Identifiers | Opaque UUID/ULID-style public identifiers; no semantic sequential IDs exposed where avoidable. |
| Schema | Backward-compatible additive changes within API major; removals require deprecation window. |

## 10. API Security Flow

6.  Client authenticates through approved OIDC/OAuth flow using PKCE for public/native clients.

7.  Client receives short-lived access token and approved refresh/session mechanism from managed IdP.

8.  API validates token signature, issuer, audience, expiry and required claims.

9.  Application resolves consumer identity or privileged admin role context.

10. Domain policy performs resource-level authorisation; authentication alone never implies access.

11. High-risk operations apply idempotency, anti-abuse and audit controls before mutation.

# PART III — DOMAIN ARCHITECTURE & OWNERSHIP

## 11. Founding Domain Catalogue

| **DOMAIN** | **OWNS** | **AUTHORITATIVE DATA** | **KEY EVENTS** |
|----|----|----|----|
| Identity | accounts, external identities, consent linkage, age declaration | user_id / identity linkage | UserRegistered, ConsentRecorded, AccountStatusChanged |
| Profile | display profile, preferences, notification preferences | profile, preferences | PreferenceChanged |
| Catalog | storyworld/title/season/episode/chapter/clip metadata | catalog entities | ContentApproved, ContentPublished |
| Media | media asset, rendition, playback session/token | media asset metadata | MediaReady, PlaybackStarted/Completed facts |
| Rights & Provenance | territory/window/platform rights, music/talent clearance, provenance reference | rights records | RightsChanged, AssetBlocked |
| Storyworld | characters, relationships, places, artefacts, timeline objects | storyworld entities | StoryObjectPublished |
| Knowledge | canonical events, knowledge units, equivalence and user grants | knowledge graph + grants | KnowledgeGranted |
| Participation | polls, quizzes, predictions, missions/challenges responses | participation + responses | ParticipationSubmitted, ParticipationClosed |
| Rewards | points ledger, badge, streak, mission reward, redemption | reward ledger/projections | RewardGranted, RewardRedeemed |
| Commerce | products, prices, orders, transactions, refunds | commercial transaction ledger | PaymentConfirmed, PaymentFailed, RefundRecorded |
| Entitlements | access grants and lifecycle | entitlements | EntitlementGranted, EntitlementRevoked, EntitlementExpired |
| Sponsor | sponsor/campaign/surface/creative/CTA/frequency rules | campaign configuration | CampaignActivated, CampaignEnded |
| Notification | notification intent, preference checks, provider attempts | delivery jobs/status | NotificationAccepted/Failed |
| Discovery | home modules, search/read models, ranking rules | read models/index | IndexUpdated |
| Analytics | event ingestion contract and business facts | analytics event stream/warehouse | not authoritative business state |
| Support/Admin | support cases, audit events, privileged workflows | case/audit records | AdminActionRecorded |

## 12. Domain Dependency Rules

- Identity may be depended upon by all domains; Identity does not depend on media, commerce, Storyworld or rewards.

- Rights/Provenance is consulted by Catalog/Media/Discovery before public availability.

- Commerce records monetary truth; Entitlements records access truth. Neither domain writes the other’s tables.

- Knowledge consumes viewing/canonical checkpoints and grants Knowledge Units; Storyworld consumes Knowledge read models for spoiler-safe presentation.

- Rewards consumes participation/content events and writes only its own ledger.

- Analytics consumes events and copies facts; analytics outages may not block transactional completion.

- Sponsor configuration can decorate approved surfaces but cannot write canon, reward ledger or content rights directly.

## 13. Database Ownership Model

Founding deployment uses one managed PostgreSQL cluster for operational simplicity. Each domain owns a dedicated schema or explicitly segregated table namespace. Application modules may read through published domain interfaces/read models; direct cross-domain writes and cross-domain ad hoc foreign-key coupling are prohibited unless approved through architecture review.

| **DOMAIN SCHEMA** | **WRITE OWNER** | **CROSS-DOMAIN ACCESS RULE** |
|----|----|----|
| identity | Identity Module | Consumer user_id may be referenced as opaque key elsewhere. |
| catalog | Catalog Module | Other domains consume catalog IDs/read interfaces. |
| rights | Rights Module | Media/Discovery read effective rights decision through service/interface. |
| knowledge | Knowledge Module | Storyworld reads authorised Knowledge projection only. |
| participation | Participation Module | Rewards consumes events, not direct response writes. |
| rewards | Rewards Module | Balance is derived projection; ledger is authoritative. |
| commerce | Commerce Module | Finance/support read through controlled APIs. |
| entitlement | Entitlement Module | Playback checks through policy service/API. |
| audit | Audit Module | Append-only privileged events; routine modules cannot edit historical rows. |

## 14. Data Consistency Classification

| **STATE** | **CONSISTENCY** | **IMPLEMENTATION** |
|----|----|----|
| Payment transaction | Strong | DB transaction + provider idempotency + reconciliation. |
| Entitlement grant | Strong | Transactional domain write; unique grant constraints; idempotent handler. |
| Reward points | Strong/Auditable | Append-only ledger; derived balance projection. |
| Knowledge grant | Strong/Auditable | Idempotent user+knowledge unique grant. |
| Rights decision | Strong at authorisation time | Current effective rights evaluated server-side; cache bounded by short TTL/invalidation. |
| Watch progress | Durable eventual | Buffered/client updates accepted; server last-known progress. |
| Analytics | Eventual | At-least-once pipeline with deduplication where needed. |
| Notifications | Eventual | Queue + retries + provider status. |
| Recommendations | Eventual | Derived from cached/read models. |
| Sponsor reporting | Eventual but reconciled | Derived from analytics with campaign definitions. |

## 15. Transactional Outbox Pattern

Any domain mutation that must emit a reliable cross-domain event shall write the business state and an outbox record in the same PostgreSQL transaction. An outbox publisher asynchronously delivers events to the managed queue/event bus. Consumers must treat delivery as at-least-once and implement idempotent handlers.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>NO DUAL-WRITE<br />
</strong>The application shall not commit a database mutation and separately publish an external event without a recoverable outbox or equivalent atomic delivery strategy for critical side effects.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# PART IV — CANONICAL KNOWLEDGE GRAPH & STORYWORLD ARCHITECTURE

## 16. Canonical Knowledge Graph Technical Model

The Canonical Knowledge Graph is a proprietary server-side control layer that represents what happened in canon, what knowledge each content unit grants, and what a specific user is authorised to know. It is implemented relationally for the founding phase; graph-database adoption is explicitly deferred until query complexity or scale demonstrates need.

| **ENTITY** | **PURPOSE** | **KEY FIELDS** |
|----|----|----|
| canonical_event | Atomic or grouped canonical story event | event_id, storyworld_id, title_id, chronology, visibility class |
| knowledge_unit | Spoiler-relevant fact the audience may know | knowledge_id, event_id, sensitivity, reveal text/reference |
| knowledge_dependency | Prerequisite relationship between Knowledge Units | knowledge_id, requires_knowledge_id, rule |
| content_checkpoint | Point in long-form/vertical content capable of granting knowledge | content_id, checkpoint_type, threshold/timecode |
| checkpoint_grant | Knowledge Units granted by checkpoint | checkpoint_id, knowledge_id |
| equivalence_set | Maps different formats to equivalent canonical understanding | equivalence_id, event/knowledge scope |
| user_knowledge_grant | Immutable user knowledge acquisition record | user_id, knowledge_id, source, timestamp |
| knowledge_projection | Optimised current known-set/read model | user_id/storyworld_id, version, computed set/hash |

## 17. Knowledge Grant Flow

12. Media/Progress records user crossing an authorised configured content checkpoint.

13. Progress event enters outbox/event bus with content/checkpoint identity.

14. Knowledge Module resolves the checkpoint to Knowledge Units and equivalence rules.

15. Knowledge Module inserts only missing user_knowledge_grant rows using unique constraints/idempotency.

16. Knowledge projection/cache is updated or invalidated.

17. Storyworld APIs use the authoritative known-set to return AVAILABLE, LOCKED, TEASED or HIDDEN data without leaking full future payloads.

## 18. Cross-Format Equivalence

Long-form episodes and vertical episodes shall not infer equivalence by episode number. VCF/AOU Canon Authority supplies explicit mappings from each format’s checkpoints to Canonical Events/Knowledge Units. This permits users to watch different format combinations without spoiler leakage or duplicate grants.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>SERVER-SIDE SPOILER CONTROL<br />
</strong>Locked Storyworld content must be filtered before serialization. The API shall not send hidden future facts to the client and rely on UI hiding alone.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 19. Knowledge Scale Strategy

- Founding: relational grants with unique(user_id, knowledge_id) constraint and indexed storyworld/user queries.

- Cache current known-set for active users in Redis with short TTL/version key; PostgreSQL remains authoritative.

- Introduce compressed/bitmap projections only when row volume or latency justifies it.

- Extract to graph/knowledge service only if multi-title traversal complexity or independent scale triggers are met.

- Never sacrifice auditability of when/how knowledge was granted.

## 20. Storyworld Read Architecture

Storyworld pages are read-heavy. The backend may maintain denormalised read models combining approved Storyworld entities with Knowledge visibility states. Read models may be cached, but they must be keyed by content/canon version and user Knowledge version where personalised.

# PART V — MEDIA, CONTENT, RIGHTS & PROVENANCE ARCHITECTURE

## 21. ACDP Ingestion Pipeline

18. VCF/authorised source requests upload session and receives scoped pre-signed upload locations.

19. Master assets and ACDP manifest are uploaded to private staging object storage.

20. Ingestion validator verifies checksum, required files, metadata schema, rights/provenance references and virus/malware scan status where applicable.

21. Catalog/Media records are created in non-publishable state.

22. Transcoding/packaging jobs generate adaptive renditions, HLS/CMAF manifests, thumbnails and derived assets.

23. Automated technical QC records success/failure; human content/rights approval remains required.

24. Approved content moves to Scheduled/Published state and origin/CDN availability is enabled according to release window.

25. Publication emits ContentPublished/IndexUpdated events for discovery, notifications and analytics.

## 22. Object Storage Zones

| **ZONE** | **ACCESS** | **PURPOSE** |
|----|----|----|
| ingest-staging | VCF/ingestion service only | Temporary incoming ACDP and validation. |
| media-master-operational | Media processing only | Operational master copy required for derivatives; distinct from VCF archival authority. |
| media-derivatives | Media/CDN origin only | Packaged renditions, manifests, thumbnails, captions. |
| public-static | CDN only | Approved non-sensitive artwork/static assets. |
| audit-export | Restricted operations/security | Periodic immutable exports where required. |

## 23. Video Packaging Standard

- HLS is the baseline delivery protocol; CMAF/fMP4 packaging should be used where supported by the selected managed pipeline to maximise cross-platform reuse.

- Adaptive bitrate ladder shall include a low-bandwidth rendition appropriate to the Data Saver doctrine and be tuned from device/network tests.

- 1080p is the premium founding target for delivered AOU where source quality supports it; higher resolutions may be retained in master/derivative pipeline without forcing all users to stream them.

- Captions/subtitles use a standard web/mobile-compatible format such as WebVTT in delivery, generated from authoritative subtitle assets.

- Playback telemetry records rendition, startup, buffering, completion and failure class.

## 24. Playback Authorisation

26. Client requests playback authorisation for content_id.

27. Media Policy verifies publish state, territory, age/access rule, rights window and entitlement where required.

28. If authorised, backend issues short-lived signed playback token/URL/cookie scoped to asset and session.

29. CDN/origin validates signed access; origin remains private.

30. Playback token expiry does not silently revoke an already authorised active stream; refresh behaviour must be graceful.

## 25. Premium Content Protection

Founding premium protection shall use private origin, signed CDN access, encrypted transport and provider-side media encryption where supported. Multi-DRM (e.g., platform DRM systems) is a conditional M2/P2 capability triggered by licensing requirements, measured piracy risk or premium commercial need; it is not allowed to block owned-AOU M1 proof unnecessarily.

## 26. Rights Decision Service

Availability is computed server-side from content state + territory + effective rights window + platform + age/classification + entitlement. The resulting policy decision is reused by Explore, Search, Title Detail and Playback Authorisation so surfaces cannot disagree.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>RIGHTS OVERRIDE ENTITLEMENT<br />
</strong>A valid entitlement cannot grant access where VMNL no longer has effective distribution rights for that user/platform/territory.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 27. AI Provenance Reference

Azeebo+ stores the minimum distribution-control reference to VCF provenance: provenance_record_id, master_version/hash, clearance state, covered talent/voice restrictions and any distribution-relevant vendor/model restriction. Full creative-generation records remain under VCF authority unless needed for rights investigation.

# PART VI — COMMERCE, ENTITLEMENTS, REWARDS & SPONSOR ARCHITECTURE

## 28. Commerce Boundary

Commerce is provider-agnostic. The internal Product/SKU catalogue defines what is sold; channel adapters determine how an approved SKU is paid for on web, Android or iOS. Provider responses are translated into one internal transaction model.

## 29. Commerce Data Model

| **ENTITY** | **CONTROL** |
|----|----|
| product | Commercial definition and entitlement template. |
| price | Currency/channel/territory price and effective dates. |
| order | User intent to purchase a product. |
| payment_attempt | Provider/channel attempt with idempotency/provider reference. |
| transaction_event | Append-oriented state changes: pending/success/failure/refund/dispute. |
| refund | Approved full/partial refund record. |
| reconciliation_item | Unknown/mismatched provider/internal transaction requiring resolution. |

## 30. Purchase Consistency Flow

31. Create internal order and idempotency key.

32. Invoke approved channel adapter.

33. Receive synchronous result and/or asynchronous provider callback.

34. Normalise provider result into Commerce transaction state using provider reference + idempotency.

35. On confirmed success, publish PaymentConfirmed through outbox.

36. Entitlement consumer grants access idempotently under unique grant constraint.

37. If entitlement propagation exceeds SLO, alert/reconciliation workflow begins.

38. User-facing purchase result reflects authoritative state, not optimistic client assumption.

## 31. Entitlement Architecture

- Entitlements are separate from payments and support paid, sponsor-funded, promotional or reward-funded sources.

- Entitlement key includes user, access scope/product, effective start/end and source.

- Playback reads current entitlement through Entitlement policy interface; Redis may cache active grants with bounded TTL/invalidation.

- Refund/revoke events change entitlement lifecycle without rewriting original transaction history.

- Account-sharing/device concurrency policy remains a Product/Security configurable rule, not embedded in provider code.

## 32. Rewards Ledger

Rewards uses an append-only points ledger plus derived balance. Grant and redemption operations are idempotent. No administrator directly overwrites a balance; adjustments generate compensating ledger entries with reason and audit identity.

## 33. Sponsor Engine Boundary

- Sponsor configuration decorates approved product surfaces through campaign IDs, creatives, CTAs, missions and rewards.

- Sponsor Engine may request a Reward grant only through Rewards interface and cannot mutate reward balances directly.

- Sponsor Engine cannot change AOU canon, Knowledge Units, rights or participation results.

- Campaign metrics are joined from analytics by campaign_id; Sponsor does not receive raw unrestricted user PII.

# PART VII — DATA, SEARCH, ANALYTICS, EVENTING & CONSISTENCY

## 34. PostgreSQL Standard

- PostgreSQL is the authoritative operational datastore for founding transactional domains.

- Use explicit migrations, foreign keys inside domain boundaries, unique constraints for idempotency, and transaction isolation appropriate to the business rule.

- JSONB may be used for bounded extensible metadata, not as a substitute for strongly modelled commercial or rights fields.

- Large media binaries never live in PostgreSQL.

- Read replicas may be introduced for reporting/read-heavy workloads after measured need; analytics queries must not overload primary transactional paths.

## 35. Redis / Ephemeral Store Standard

- Allowed: cache, rate limit counters, short-lived idempotency locks, ephemeral session/reference state, queue coordination where supported.

- Not authoritative: payment status, entitlement history, reward ledger, rights truth, canon/knowledge truth.

- Cache failure must degrade performance, not silently change commercial truth.

- Keys use domain prefix/version and bounded TTL; invalidation events are preferred for critical hot reads.

## 36. Event Envelope

| **FIELD**      | **RULE**                                       |
|----------------|------------------------------------------------|
| event_id       | Globally unique.                               |
| event_type     | Stable versioned name.                         |
| event_version  | Integer/schema version.                        |
| occurred_at    | UTC timestamp.                                 |
| producer       | Domain/module.                                 |
| subject_id     | Opaque entity/user/content key as appropriate. |
| correlation_id | Trace/business correlation.                    |
| causation_id   | Prior event/request where applicable.          |
| payload        | Minimal business data; avoid unnecessary PII.  |
| schema_ref     | Schema/contract identifier.                    |

## 37. Event Delivery Guarantees

- At-least-once delivery is the founding assumption.

- Consumers keep processed-event/idempotency state where duplicate side effect matters.

- Dead-letter queues are mandatory for critical asynchronous consumers.

- No event is considered a substitute for an authoritative ledger record.

- Analytics consumers may tolerate loss differently from entitlement/reward consumers; queue policies reflect criticality.

## 38. Search Architecture

Founding search uses PostgreSQL full-text/trigram indexing and a dedicated availability-aware read model. Search results must never return content the user cannot legitimately discover under current publish/territory/age rules.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>SEARCH EXTRACTION TRIGGER<br />
</strong>Introduce a dedicated search engine only when one or more conditions persist: Search P95 cannot meet 1.5 s target under envelope, indexed searchable documents exceed the agreed operational threshold, multilingual/faceting/relevance requirements outgrow PostgreSQL, or independent scaling becomes materially cheaper.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 39. Analytics Pipeline

39. Client/server emit canonical product events through analytics SDK/collector abstraction.

40. Events carry event_id, anonymous/user identity as permitted, content/campaign dimensions and schema version.

41. Collector validates/enriches and sends to durable analytics stream/store.

42. Warehouse/lake receives events for BI, funnels, cohorts, sponsor reporting and economics.

43. PII minimisation/pseudonymisation occurs before broad analytics access.

44. Operational dashboards use production telemetry; financial ledgers remain separate sources of truth.

## 40. Analytics Storage Tiers

| **TIER** | **RETENTION / PURPOSE** |
|----|----|
| Hot operational | Recent events for debugging and live dashboards; short retention. |
| Warehouse | Curated analytics facts/dimensions for product/commercial reporting. |
| Archive | Lower-cost long-term raw or summarised events according to retention/privacy policy. |

# PART VIII — CLOUD, ENVIRONMENTS, CI/CD & INFRASTRUCTURE

## 41. Reference Cloud Deployment

The reference deployment is AWS with Africa (Cape Town) as the primary application/data region because it provides a three-Availability-Zone African region and enables a regional deployment close to the primary market. Final data-location and cross-border backup decisions remain subject to Legal/Privacy approval and service availability.

| **CAPABILITY** | **REFERENCE AWS SERVICE / PATTERN** | **PORTABILITY RULE** |
|----|----|----|
| DNS/TLS | Route 53 + ACM | DNS/TLS provider replaceable. |
| Edge/CDN/WAF | CloudFront + WAF | Media/CDN adapter and origin contracts retained. |
| Containers | ECS/Fargate + ECR | OCI containers; deployable to another managed runtime. |
| Database | RDS/Aurora PostgreSQL Multi-AZ | Standard PostgreSQL; avoid proprietary SQL where unnecessary. |
| Cache | ElastiCache Redis-compatible | Redis protocol abstraction. |
| Object storage | S3 | S3-compatible storage interface where practical. |
| Events/queues | EventBridge/SQS | Internal event envelope independent of provider. |
| Secrets/keys | Secrets Manager + KMS | Application accesses through config/secrets abstraction. |
| Observability | OpenTelemetry + CloudWatch/backend | OTel prevents backend lock-in. |
| IaC | Terraform | Provider modules separated from application config. |

## 42. Network Topology

- Public traffic terminates at managed edge/WAF/load-balancing layers.

- Application containers and databases reside in private network segments; databases have no public ingress.

- Only approved egress to payment, identity, push, media and monitoring providers is permitted where controls allow.

- Administrative access uses managed zero-trust/VPN/session-management mechanism rather than open database/SSH exposure.

- Security groups/network policies follow least privilege between application, workers, data and management planes.

## 43. Environment Model

| **ENVIRONMENT** | **PURPOSE** | **DATA POLICY** |
|----|----|----|
| Local/Developer | Developer feedback/unit tests | Synthetic/local data only. |
| Development | Shared integration | Synthetic/non-sensitive test data. |
| Staging | Production-like integration and release rehearsal | Masked/synthetic; no routine production PII. |
| Closed Beta | Controlled real users, separate production-class environment or isolated production cohort | Real user data with production controls. |
| Production | Public live service | Full controls, audited access. |
| DR/Recovery | Recovery capability | Encrypted replicated backups/snapshots under approved location policy. |

## 44. Infrastructure as Code

- All repeatable production infrastructure is declared through Terraform or approved equivalent IaC.

- No untracked console-only production resources except emergency break-glass actions followed by reconciliation.

- Environment-specific values are configuration, not copy-pasted infrastructure definitions.

- IaC plan is reviewed in CI before production apply.

- Cloud resources carry environment, domain, owner and cost-centre tags.

## 45. CI/CD Pipeline

45. Pull request: lint, type check, unit tests, secret scan, dependency/security scan, contract checks.

46. Merge: build immutable application/container artifact and SBOM where supported.

47. Deploy Development automatically after passing gates.

48. Promote same artifact to Staging; run integration, migration, smoke and regression tests.

49. Production release requires release approval; progressive/canary or rolling deployment where supported.

50. Post-deploy smoke checks verify auth, catalog, playback authorisation, critical APIs and telemetry.

51. Rollback or roll-forward plan remains available for every release.

## 46. Database Migration Strategy

- Use expand-and-contract migrations for backward compatibility.

- Large blocking migrations are tested against production-scale copies/synthetic loads before release.

- Application release must tolerate mixed schema during rolling deployment where relevant.

- Destructive column/table removal occurs only after dependent code and data-retention obligations are cleared.

- Migrations are included in release audit trail.

## 47. Dependency Version Policy

- Use supported stable runtime/framework releases at implementation lock; pin versions/lockfiles in each release train.

- No uncontrolled auto-upgrade of major dependencies in production.

- Monthly dependency review and urgent patch path for critical vulnerabilities.

- Framework/platform upgrades require compatibility test across media, auth, payments and analytics integrations.

# PART IX — SECURITY, PRIVACY, FRAUD & ADMINISTRATIVE CONTROL

## 48. Security Verification Baselines

Web/backend controls shall align with the current OWASP Application Security Verification Standard selected by Security at build lock. Mobile verification shall align with OWASP MASVS/MASTG. These frameworks are verification baselines, not claims of external OWASP certification.

## 49. Authentication & Session Controls

- Use managed OIDC-compatible identity provider and OAuth authorisation flows appropriate to public/native clients.

- PKCE required for native/public authorisation-code flows.

- Access tokens are short-lived; refresh/session material is stored using platform secure storage.

- Consumer and admin identities/roles are logically separated.

- Admin requires MFA and stronger session expiry/re-authentication for sensitive actions.

- Account recovery and merge flows must resist account takeover and preserve purchase/history ownership.

## 50. Authorisation Model

Consumer authorisation is policy-based: identity + resource state + rights + entitlement + Knowledge State + age/territory as applicable. Administrative authorisation is RBAC with potential attribute/context checks. A role may call only explicitly permitted admin actions; UI visibility is not authorisation.

## 51. Data Classification

| **CLASS** | **EXAMPLES** | **CONTROL** |
|----|----|----|
| Public | Published title metadata, approved artwork | CDN/cache allowed. |
| Internal | Architecture, non-sensitive operations data | Authenticated staff only. |
| Confidential | Commercial terms, unreleased metadata, user analytics | Need-to-know, encrypted, audited. |
| Restricted | Credentials, payment tokens/references, sensitive PII, admin security material | Strongest access, encryption, redaction, no broad analytics exposure. |

## 52. Encryption & Key Management

- TLS for all external and service-to-service network traffic where supported; modern cipher configuration.

- Managed encryption at rest for databases, object storage, backups and secrets.

- Keys managed through cloud KMS/HSM-backed service; application code never hard-codes production keys.

- Secrets rotate according to provider/risk policy and are never stored in repository or mobile binary.

- Sensitive log fields are redacted before export.

## 53. Web/Mobile Application Security

- Input validation at trust boundary and output encoding appropriate to client context.

- Secure headers/CSP for web, CSRF controls where cookie/session architecture requires them, and CORS allow-listing.

- Rate limits on auth, search, participation, reward, purchase and support-sensitive routes.

- Mobile secure storage, network security configuration, release signing and tamper/resilience controls proportional to risk.

- No API keys or admin credentials shipped in consumer binaries.

## 54. Fraud & Abuse Architecture

| **RISK** | **FOUNDING CONTROL** |
|----|----|
| Credential stuffing | Rate limiting, provider risk controls, suspicious-login telemetry. |
| Reward farming | Account/device velocity rules, idempotent mission completion, anomaly review. |
| Quiz/prediction bots | Submission limits, server timestamps, rate limits; stronger attestation/captcha only if needed. |
| Payment abuse/chargeback | Provider controls, account risk flags, transaction history, refund policy. |
| Entitlement spoofing | Server-authoritative playback token; no client-only premium flag. |
| Scraping | CDN/API rate controls, signed media, bot/WAF rules. |
| Admin abuse | RBAC, MFA, audit logs, dual-control candidates. |
| Deep-link bypass | Every target resolves server-side rights/access state. |

## 55. Privileged Dual-Control Candidates

- Large/manual refunds over Finance-defined threshold.

- Manual premium entitlement with material commercial value.

- Rights override permitting otherwise blocked content.

- Production publication of high-profile/finale content outside scheduled workflow.

- Mass reward adjustment/redemption reversal.

- High-impact feature flag or universe activation in production.

- Break-glass access to restricted user/finance data.

## 56. Audit Architecture

High-risk admin actions write immutable/auditable records containing actor, role, time, action, target, prior/new state reference, reason and correlation ID. Audit records have restricted write path, retention policy and no routine edit/delete capability.

# PART X — SRE, SLOs, CAPACITY, DR & INCIDENT ARCHITECTURE

## 57. Founding SLO Matrix

| **SLO** | **TARGET** | **GATE** | **ARCHITECTURE NOTE** |
|----|----|----|----|
| Critical-service availability | ≥99.9% monthly after stabilisation | M2 | API/identity/entitlement/payment-authorisation critical set defined in service catalogue. |
| Crash-free sessions | ≥99.5% | M2 | Mobile/web client crash/ fatal error measurement. |
| Critical non-media API | P95 ≤750 ms; P99 ≤1,500 ms | M2 | Under founding envelope, excluding external provider waits. |
| Search | P95 ≤1.5 s | M2 | Availability-aware result set. |
| Playback startup | P50 ≤2.5 s; P95 ≤6 s | M2 | Qualifying 4G/Wi-Fi; report by network class. |
| Rebuffer ratio | P95 session \<2% playback time | M2 | Qualifying networks. |
| Entitlement propagation | ≤10 s for ≥99% normal internal success cases | M2 | Provider webhook delay classified separately. |
| CMS publication propagation | ≤5 min normal path | M2 | Emergency kill/disable path should be materially faster. |
| Notification batch | 95% provider-accepted ≤15 min | M2 | Standard release batch; not device delivery guarantee. |
| RTO identity/commerce entitlement | ≤60 min | M2 | Recovery objective. |
| RPO transactional ledgers | ≤5 min; target lower where architecture/provider permits | M2 | Restore point objective. |

## 58. Founding Capacity Envelope

| **DIMENSION** | **FOUNDING ENVELOPE** | **CONTROL** |
|----|----|----|
| Registered users | 250,000 | Plan scale before sustained 70% design saturation. |
| Monthly active users | 75,000 | Planning case, not cap. |
| Peak concurrent video sessions | 10,000 | Premiere load test required. |
| Vertical starts/minute | 5,000 burst | CDN/analytics burst absorption. |
| Long-form concurrent premiere | 5,000 | Load test with playback authorisation. |
| Transactions/minute | 300 burst | Include retries/idempotency. |
| Notification batch | 250,000 | Segment/provider throttling. |
| Analytics events/day | 10 million | Cost/retention controls. |
| CMS active operators | 50 | RBAC/audit performance. |
| Media library | 5 TB operational baseline | Object storage scales; VCF archive separate. |

## 59. Scaling Strategy

- Horizontal scale stateless API/container tasks based on CPU, request rate and latency.

- Workers scale independently by queue depth and processing age.

- PostgreSQL scales vertically first, then read replicas/partitioning/extraction based on measured bottleneck.

- CDN absorbs video/static distribution; origin is not sized to deliver all bytes directly.

- Autoscaling limits include cost guardrails and minimum warm capacity before premieres.

- Scale tests at 1.0x, 1.5x and target burst; critical premiere flows receive separate load rehearsal.

## 60. Observability Architecture

- OpenTelemetry-compatible instrumentation for HTTP, database, queue and critical business spans.

- Correlation ID crosses edge, API, domain, outbox, worker and provider callback where possible.

- Metrics include golden signals: latency, traffic, errors, saturation plus business SLO metrics.

- Logs are structured JSON with environment/service/domain and redacted user identifiers.

- Product analytics and operational telemetry are separate pipelines but may be correlated through controlled IDs.

## 61. Alerting & Error Budgets

- Alert on SLO burn rather than raw infrastructure metrics alone.

- Critical alerts: auth failure surge, playback authorisation failure, payment-confirmed/entitlement lag, provider callback backlog, DB saturation, queue age, rights publish mismatch.

- Error-budget exhaustion can freeze discretionary releases until reliability is restored.

- Every alert has an owner and runbook; unactionable alerts are removed.

## 62. Backup & Restore

- Automated encrypted database backups with point-in-time recovery where supported.

- Object-store versioning/lifecycle for operational assets and configuration exports.

- Restore tests occur on a defined cadence; backup existence without restore testing is not accepted.

- Critical configuration, IaC and secrets metadata are recoverable independently of application hosts.

- DR location and cross-border replication require Privacy/Legal approval.

## 63. Disaster Recovery Topology

Founding production is Multi-AZ within the primary region. Cross-region recovery begins as backup/restore and infrastructure recreation rather than expensive active-active deployment. Active multi-region is introduced only when business continuity, international expansion or availability requirements justify its operating cost.

## 64. Incident Command

| **SEVERITY** | **TECHNICAL RESPONSE** |
|----|----|
| SEV-1 | Immediate incident commander, cross-functional bridge, user/commercial impact assessment, rollback/containment, executive notification, mandatory postmortem. |
| SEV-2 | Named owner, rapid mitigation, service/domain escalation, postmortem based on impact. |
| SEV-3 | Normal engineering priority with operational tracking. |
| SEV-4 | Backlog/maintenance issue. |

# PART XI — MULTI-UNIVERSE EVOLUTION & SERVICE EXTRACTION

## 65. Founding-to-Expansion Architecture

The founding architecture intentionally carries reusable engines for Vertical, Movies & Series, Storyworld, Participation, Rewards and Commerce. Future universe work should add domain modules/read models before creating new independent services unless scale/isolation triggers demand separation.

## 66. Service Extraction Triggers

| **MODULE** | **EXTRACTION TRIGGER** |
|----|----|
| Media | Independent scale/cost optimisation; live/DRM complexity; dedicated team/release cadence. |
| Search | PostgreSQL search misses SLO/functionality threshold. |
| Notifications | Large scheduled campaigns/throughput require independent scale. |
| Analytics | Volume or governance requires separate collector/processing service. |
| Reality Show Factory | Live/vote state requires stronger isolation, write throughput or independent availability. |
| Creator/UGC | Moderation/upload pipeline creates separate security/scale boundary. |
| Games | Real-time or tournament workloads materially differ from content platform. |
| Sports | External data feeds/live event scale requires independent service boundary. |
| Commerce | Transaction volume/regulatory scope warrants independent deployment/security boundary. |
| Knowledge | Twenty-title graph traversal/volume outgrows relational module/read models. |

## 67. Reality Architecture Preparation

- Identity, Participation, Rewards, Sponsor, Notifications and Commerce interfaces must remain reusable.

- Reality Show Factory later introduces show/season/contestant/team/vote/result domains.

- Vote ledger requires immutable, auditable, independently reconciled event/ballot model and may justify isolated datastore/service.

- LiveOps and result publication require stronger runbooks and dual-control.

## 68. Creator Architecture Preparation

- Identity/Profile must support creator role without converting consumer identity into privileged admin.

- Creator upload/moderation uses separate UGC ingestion path from trusted VCF ACDP.

- Creator earnings/payouts remain separate future finance domain from founding consumer rewards.

- Trust & Safety becomes a dedicated service/operations boundary before open UGC scale.

## 69. Games & Sports Preparation

- Participation primitives can power trivia and prediction-for-points before standalone Games.

- Real-time game sessions are not included in founding monolith unless a qualified universe activates them.

- Regulated gaming or cash-equivalent mechanics require separate compliance and potentially separate entity/service boundary.

- Sports factual data must be sourced from licensed/authoritative providers and never inferred from generative AI.

## 70. Internationalisation Architecture

- All stored timestamps UTC; locale formatting client-side.

- Content entities support localised metadata, subtitle/audio tracks and territory windows.

- Price model supports currency/territory/channel dimensions.

- No hard-coded Nigeria-only assumptions inside domain keys or catalog models.

- Data residency and cross-border transfer policy may produce regional data deployment later; not pre-built before evidence.

# PART XII — TECHNICAL GOVERNANCE, ADRs, TRACEABILITY & ACCEPTANCE

## 71. Architecture Decision Record Catalogue

| **ADR** | **DECISION** | **AUTHORITY** | **STATUS** |
|----|----|----|----|
| ADR-001 | Mobile framework | React Native New Architecture | LOCKED |
| ADR-002 | Web/admin | React/Next.js separate consumer/admin surfaces | LOCKED |
| ADR-003 | Backend style | NestJS modular monolith + workers | LOCKED |
| ADR-004 | Operational DB | PostgreSQL domain schemas | LOCKED |
| ADR-005 | Cache | Redis-compatible managed cache, non-authoritative | LOCKED |
| ADR-006 | Events | Transactional outbox + managed queue/event bus | LOCKED |
| ADR-007 | API | REST/JSON + OpenAPI 3.1.x + RFC 9457 | LOCKED |
| ADR-008 | Identity | Managed OIDC/OAuth IdP + PKCE; provider via adapter | LOCKED / PROVIDER TBD |
| ADR-009 | Media protocol | HLS/CMAF ABR + private origin + signed access | LOCKED |
| ADR-010 | DRM | Conditional; activate when licence/risk/economics justify | CONDITIONAL |
| ADR-011 | Cloud | AWS reference deployment, af-south-1 primary | LOCKED SUBJECT TO LEGAL/DATA REVIEW |
| ADR-012 | Containers | Managed containers; no Kubernetes founding requirement | LOCKED |
| ADR-013 | IaC | Terraform | LOCKED |
| ADR-014 | Observability | OpenTelemetry-compatible | LOCKED |
| ADR-015 | Knowledge graph | Relational PostgreSQL; no graph DB initially | LOCKED |
| ADR-016 | Search | PostgreSQL FTS/trigram first | LOCKED |
| ADR-017 | Payments | Channel/payment adapters; provider selection separate | LOCKED / PROVIDER TBD |
| ADR-018 | Analytics | Vendor-abstract event collector + warehouse | LOCKED / BACKEND TBD |
| ADR-019 | Feature flags | Server-authoritative remote config; provider replaceable | LOCKED |
| ADR-020 | Microservices | Deferred until extraction trigger | LOCKED |

## 72. Technical Change Control

A change is architecture-material if it alters data ownership, authoritative ledger, API major contract, identity/session model, payment/entitlement flow, rights enforcement, Knowledge Graph semantics, cloud region, encryption/key design, SLO target, DR model or service extraction. Material changes require an ADR amendment, impact analysis, Product/Engineering/Security review and approval under parent change-control authority.

## 73. Technical Definition of Ready

- Linked PRD requirement IDs and acceptance tests.

- Architecture domain owner and data ownership identified.

- API/event/data contract defined or explicitly not required.

- Failure, idempotency, observability and security behaviour specified.

- Migration/backward-compatibility approach identified.

- Capacity/SLO implications reviewed.

## 74. Technical Definition of Done

- Code and infrastructure delivered through approved CI/CD.

- Contract tests, unit/integration tests and required performance/security tests pass.

- Telemetry, dashboards and alerting exist for critical path.

- Runbook/support documentation completed.

- Data migration and rollback/roll-forward validated.

- No undocumented production configuration or credentials.

- Architecture traceability updated.

## 75. Technical Launch Acceptance

| **DOMAIN** | **GREEN CONDITION** |
|----|----|
| Identity | OIDC/session/account recovery and admin MFA paths tested. |
| Media | Playback, ABR, low-bandwidth, signed access and CDN load tests pass. |
| Commerce | Payment/transaction/entitlement idempotency and reconciliation pass. |
| Knowledge | Cross-format grants and spoiler-safe API tests pass. |
| Rights | Availability policy consistent across Search/Explore/Playback. |
| Data | Backups, migrations, restore tests and capacity tests pass. |
| Security | Required ASVS/MASVS-aligned review and penetration testing issues closed to launch standard. |
| SRE | SLO dashboards, alerts, on-call and runbooks active. |
| Operations | Admin RBAC/audit/dual-control candidates configured. |
| Analytics | Critical telemetry validated and sponsor/economic facts traceable. |

## 76. Architecture Acceptance Gate

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>FINAL TECHNICAL GREEN<br />
</strong>M2 may not launch until the Architecture Review confirms: no critical domain-boundary violations, no unresolved SEV-1 architecture defect, transactional ledgers reconcile, Knowledge State cannot leak future payloads, rights/entitlement policy is server-authoritative, production is observable, backups restore, and the platform meets the agreed founding load envelope.</th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# PART XIII — R2 FINAL ENFORCEMENT, FAILURE, RECOVERY, FINOPS & COMPATIBILITY CONTROLS

This Part supersedes any lower-order interpretation of R1 where necessary. It does not relax any R1 invariant; it makes the remaining controls enforceable, versioned, failure-complete and operationally measurable.

## 77. Canon, Knowledge-Mapping & Correction Version Authority

The Canonical Knowledge Graph shall be correction-safe. Canon, Knowledge Units and cross-format mappings are never destructively edited in place after release. Corrections create new controlled versions with explicit supersession and audit history.

| **CONTROL** | **R2 REQUIREMENT** |
|----|----|
| Canon version | Every approved canon release carries canon_version_id, status, effective timestamp and supersedes_version_id where applicable. |
| Knowledge mapping version | Every content checkpoint mapping carries knowledge_mapping_version_id linked to the canon version used for approval. |
| Knowledge Unit identity | Knowledge Unit IDs are durable. Meaning changes require a new version or successor unit rather than silent text mutation. |
| Correction impact analysis | Before a mapping correction is activated, the system computes affected content, users, projections, caches and Storyworld surfaces. |
| Historical truth | Original user_knowledge_grant rows remain audit history; current effective knowledge is computed through correction/supersession rules. |
| Projection rebuild | Knowledge projections are versioned and rebuildable from authoritative grants plus active correction rules. |
| Erroneous reveal | If a user received knowledge they should not have received, the system removes future presentation through an effective-state correction while preserving the audit record of what occurred. |
| Correction severity | Material spoiler/canon correction is an incident/change event with named owner, affected-cohort analysis and post-correction verification. |

**R2 invariant: audit history is immutable; effective canon visibility is correctable.**

## 78. Atomic Content Release Manifest

A public Azeebo+ release must be internally atomic even when its assets live across multiple systems. The Release Manifest is the sealed distribution authority for a specific content release.

| **MANIFEST FIELD** | **CONTROL** |
|----|----|
| release_manifest_id | Immutable identifier referenced by publish/read models and operational audit. |
| content/catalog version | Exact title/episode/chapter metadata version. |
| media master / derivative set | Exact approved master hash/version and derivative package identity. |
| rights snapshot | Exact rights-policy version effective for the release. |
| knowledge mapping | Exact canon_version_id and knowledge_mapping_version_id. |
| captions/audio/localisation | Exact approved track/subtitle versions. |
| provenance | VCF provenance record ID and approved master hash. |
| commercial/sponsor state | Approved commercial attachments that affect presentation/access. |
| seal digest | Cryptographic digest or equivalent integrity seal over the manifest definition. |
| status | DRAFT → VALIDATED → SEALED → PUBLISHED → REVOKED/SUPERSEDED. |

- Only a SEALED Release Manifest may transition to public publication.

- Search, Explore, Playback and Storyworld must resolve the same active release identity, preventing mixed-version publication.

- A superseding release creates a new manifest; published manifests are not silently mutated.

- Emergency revocation disables the manifest and triggers policy/cache/CDN invalidation workflows.

## 79. Enforceable Domain-Boundary Controls

R1 domain ownership becomes mechanically enforceable in R2. A rule that exists only in documentation is not sufficient for commercial, rights or knowledge domains.

| **LAYER** | **ENFORCEMENT** |
|----|----|
| Database | Each domain receives an application DB role limited to its owned schema. Runtime roles cannot write another domain schema. Migration role is separate and privileged. |
| Application modules | Public module interfaces are explicit. Internal repositories are not imported across domains. |
| Architecture tests | CI tests fail on prohibited dependency directions, cross-domain repository access or direct write-path violations. |
| SQL | Cross-domain ad hoc writes and cross-schema update permissions are denied at the database layer. |
| Foreign keys | Cross-domain hard coupling remains prohibited unless architecture review explicitly authorises it; opaque IDs/events/read models are preferred. |
| Data access | Privileged support/reporting reads use approved APIs/read models or dedicated least-privilege roles, not shared superuser credentials. |
| Exceptions | Every exception receives ADR ID, owner, expiry/review date and remediation path. |

## 80. Event Contract, Ordering, Replay & Poison-Message Governance

| **CONTROL** | **R2 LOCK** |
|----|----|
| Schema registry | Every durable event type has owner, version, schema, compatibility policy and deprecation window. |
| Aggregate ordering | State-sensitive event streams carry aggregate_id and aggregate_version/sequence where ordering matters. |
| Out-of-order event | Consumers detect stale sequence and either defer, reconcile or discard according to documented policy; they may not blindly apply older state. |
| Replay | Replay is permitted only from retained authoritative event/outbox records under a named replay job and correlation/replay ID. |
| Replay safety | Consumers with external side effects distinguish replay/rebuild from live notifications, payments or duplicate reward grants. |
| DLQ | Critical DLQs have alert, owner, retry policy, poison-message quarantine and manual resolution workflow. |
| Backfill | Data backfills are versioned jobs with dry-run, scope, idempotency and reconciliation evidence. |
| Contract test | Producer/consumer compatibility is tested in CI for critical event contracts. |

## 81. External Dependency Resilience Contracts

Every external provider must have a documented resilience contract. Provider abstraction enables replacement; resilience controls keep the live platform functional while replacement is not instantaneous.

| **DEPENDENCY** | **FAILURE CONTRACT** |
|----|----|
| Identity provider | Existing valid sessions continue where cryptographic validation/policy allows; new login/recovery may degrade. Token/JWKS caching uses bounded safe lifetime. No fail-open authentication. |
| Payment provider | Timeout produces PENDING/UNKNOWN rather than assumed failure. Idempotent retry and webhook/reconciliation resolve final state. No fail-open entitlement. |
| Media/transcoder/CDN | Existing published derivatives remain served if control plane fails; new ingest may queue. CDN/origin failover follows approved topology. |
| Push | Queue/retry; push outage never blocks content, purchase or reward transaction. |
| Analytics | Buffered/durable ingestion where practical; analytics outage never blocks critical transactional paths. |
| Feature flag/config provider | Critical server defaults are versioned and safe. Security/rights decisions never depend solely on external remote config. |
| AI/VCF generation provider | Production generation vendor outage affects content production pipeline, not consumer runtime. Approved masters remain vendor-independent. |
| General | Explicit timeout budget, exponential backoff with jitter, bounded retry, circuit breaker/bulkhead where appropriate, provider health telemetry and named degraded mode. |

## 82. Emergency Rights Takedown & Distribution Kill Path

| **CONTROL** | **TARGET / RULE** |
|----|----|
| Authorised trigger | Rights Operator or designated emergency authority; dual control for reversal/override of a legal block. |
| Policy propagation | Emergency rights block must reach server authorisation/read models within target ≤5 minutes. |
| CDN purge | Operational target: purge/invalidate affected derivatives across configured CDN path within ≤15 minutes for normal supported provider flow; exceptions are incident-managed. |
| Playback credentials | Premium/media signed authorisations use bounded lifetime; target maximum 10 minutes for revocable protected content unless provider constraints require documented exception. |
| New sessions | Blocked immediately after policy propagation; entitlement never overrides the legal block. |
| Active sessions | Hard-takedown mode may interrupt active playback on next authorisation/segment policy boundary where architecture/provider supports it. |
| Verification | Rights/Ops verify API, search, explore, playback and CDN state before incident closure. |
| Audit | Reason, source request, operator, timestamps, affected assets and restoration decision are retained. |

## 83. Privacy Deletion, Anonymisation & Immutable-Ledger Reconciliation

Azeebo+ must support user privacy rights without corrupting commercial, security or legal ledgers that must remain auditable.

| **STEP** | **ARCHITECTURAL RULE** |
|----|----|
| Identity separation | Direct identifiers are held in Identity/Profile, not duplicated into immutable domain ledgers unless strictly required. |
| Surrogate IDs | Commerce, rewards, audit and knowledge records reference opaque internal user IDs rather than broad PII. |
| Deletion orchestration | Approved deletion/anonymisation request creates an orchestrated domain job with completion status per domain. |
| Legal hold/retention | Records subject to finance, fraud, legal or security retention are retained only to the required extent and separated from ordinary product use. |
| Anonymisation | Where records must remain, the link to directly identifying profile data is removed or irreversibly/policy-effectively pseudonymised according to approved legal design. |
| Analytics | User-level analytics is deleted/anonymised according to retention policy and warehouse propagation process. |
| Knowledge/rewards | Product-facing state can be deleted with the account while any retained audit evidence uses non-identifying or restricted references as authorised. |
| Proof | Deletion job produces an auditable completion record without exposing the deleted data itself. |

## 84. Mandatory Software-Supply-Chain Security

| **CONTROL** | **MANDATORY R2 REQUIREMENT** |
|----|----|
| SBOM | Generate and archive an SBOM for every production backend/container and mobile/web release artefact. |
| Artefact signing | Production container/build artefacts are cryptographically signed using approved signing service/key and verified before deployment. |
| Build provenance | CI records source commit, workflow identity, dependencies, build time and artefact digest; production deploy is traceable to immutable source revision. |
| Branch protection | Protected main/release branches, mandatory review, required status checks and restricted force-push/administrator bypass. |
| CI identity | Prefer short-lived OIDC/workload identity to long-lived cloud credentials in CI. |
| Secret scan | Pre-commit/CI and repository scanning for secrets; confirmed leaked secrets rotate immediately. |
| Dependency gate | Critical exploitable vulnerabilities block release unless Security records time-bound exception and compensating control. |
| Container/IaC scan | Images and IaC receive automated security/misconfiguration scans before promotion. |
| Registry control | Production deploys only from approved private registry/repository; digest pinning used for immutable deployment. |
| Third-party SDKs | Mobile/web SDKs require security/privacy review and inventory before introduction. |

## 85. Threat-Model Authority

Threat modelling is a release input, not a post-build security exercise.

- A system-level threat model is mandatory before M2 public launch and maintained under Security ownership.

- Each critical domain documents assets, actors, trust boundaries, privileged paths, abuse cases and compensating controls.

- Material changes to identity, payment, entitlements, rights, Knowledge Graph, admin, public upload or regulated functionality trigger threat-model review.

- Threat models include both traditional security threats and business-abuse threats such as entitlement spoofing, reward farming, spoiler leakage, rights bypass and admin misuse.

- Penetration test findings map back to threat controls and release acceptance.

## 86. Break-Glass Privileged Access Architecture

| **CONTROL** | **RULE** |
|----|----|
| Normal state | No standing shared super-admin credential. Privilege is named, least-privilege and role-scoped. |
| Activation | Break-glass requires SEV-1/emergency reason, named incident/ticket and approved emergency workflow. |
| Time bound | Elevation expires automatically; default target ≤60 minutes unless incident commander extends with recorded reason. |
| Authentication | Strong MFA and re-authentication required. |
| Observation | Cloud/admin session activity is logged; session recording used where supported for high-risk infrastructure access. |
| Notification | Security/Ops and relevant system owner are notified immediately when break-glass activates. |
| Revocation | Access is automatically revoked on expiry or incident closure. |
| Review | Mandatory review by next business day or within incident postmortem; unexplained actions become security investigation. |

## 87. Executable Disaster Recovery & Recovery-Order Authority

R2 distinguishes normal regional-service recovery from catastrophic loss of the primary region. The founding 60-minute RTO applies to critical service restoration within the primary-region/Multi-AZ design, not automatically to total-region loss.

| **RECOVERY TIER** | **OBJECTIVE** | **R2 CONTROL** |
|----|----|----|
| Tier A — instance/AZ/service failure | Critical service RTO ≤60 min; transactional ledger RPO ≤5 min | Multi-AZ failover/redeploy, queue recovery, PITR as required. |
| Tier B — destructive data incident | RTO ≤4 h target; RPO defined by last safe PITR point | Restore to isolated environment, validate ledgers, reconcile external providers before reopening writes. |
| Tier C — primary-region loss | Initial founding target RTO ≤8 h; critical ledger RPO ≤15 min where approved cross-region backup permits | Recreate IaC in approved recovery region, restore authoritative data/config, re-point edge, progressively reopen services. |
| Tier D — vendor ecosystem failure | Per provider runbook | Activate alternate provider/degraded mode where pre-qualified; preserve authoritative ledgers. |

- Before M2: perform at least one end-to-end transactional database restore exercise and one application infrastructure recreation exercise.

- Quarterly: restore-test a representative production backup and document measured RTO/RPO.

- Semi-annually: cross-functional DR tabletop covering identity, commerce, rights, media and support.

- At least annually after public launch: technical regional-recovery exercise or equivalent evidence-based rehearsal proportionate to business scale.

- Recovery order is: identity/secrets/network → authoritative database/ledgers → rights/entitlement policy → core API → media authorisation → admin/support → rewards/participation → notifications/analytics/noncritical services.

## 88. FinOps & Unit-Cost Architecture

Azeebo+ shall treat cloud/media cost as a product architecture variable. Technical scale that destroys contribution margin is a failed architecture outcome.

| **CONTROL** | **R2 REQUIREMENT** |
|----|----|
| Tagging | All production resources carry environment, domain, owner, product/universe where applicable and cost-centre tags. |
| Budgets | Environment/domain budgets and forecast thresholds configured before M2. |
| Anomaly detection | Daily cloud-cost anomaly monitoring with named owner and incident threshold. |
| Autoscaling guardrails | Every autoscaled service has upper safety/cost bounds and documented premiere override procedure. |
| Media unit economics | Track CDN/egress cost per viewing hour, transcode cost per finished minute, storage cost per content-hour and premium protection overhead. |
| Platform unit economics | Track infrastructure cost per MAU/WEP and per 1,000 critical API requests where useful. |
| Analytics economics | Monitor event volume, retention tiers and cost per million events; prevent unbounded telemetry cardinality. |
| Database economics | Monitor storage, IOPS/compute, replica cost and expensive query trends. |
| Review cadence | Monthly Product/Engineering/Finance FinOps review; material architecture changes include cost impact. |
| Scale decision | Extraction or new managed service must demonstrate reliability, capability or total-cost benefit—not fashion. |

## 89. Client / API Compatibility & Forced-Upgrade Doctrine

| **CONTROL** | **R2 LOCK** |
|----|----|
| API compatibility | Breaking consumer API changes require a new major contract or compatibility layer; additive changes remain backward compatible. |
| Support window | Backend shall support at least the current and previous two consumer release trains, or a minimum 90-day compatibility window, whichever gives greater practical protection, unless security/legal emergency requires earlier retirement. |
| Capability negotiation | Server may return capability/minimum-version metadata so clients hide unsupported flows safely. |
| Minimum version | Server-authoritative min_supported_version is configurable by platform/territory. |
| Forced upgrade | Reserved for security, data integrity, rights/legal compliance, provider incompatibility or material unsupported-client risk; not routine feature promotion. |
| Upgrade UX | Forced upgrade provides clear reason and store/web path; if store update is unavailable, unaffected public/free web functionality may be used where appropriate. |
| Schema evolution | Mobile persisted cache/state is versioned and migratable; destructive local migration must preserve login/purchase truth from server. |
| Release rollback | Backend rollout must consider old clients before removing fields/behaviours. |

## 90. Technical TBD Closure & Provider Qualification Gates

R2 permits controlled TBDs during development, but a TBD cannot remain ambiguous beyond the release gate it blocks.

| **TBD** | **GATE** | **CLOSURE EVIDENCE** |
|----|----|----|
| TAA-TBD-001 Identity provider | M1 blocker | Security review; OIDC/OAuth/PKCE; admin MFA; export/account lifecycle; SLA; data terms; cost; adapter proof. |
| TAA-TBD-002 Payment route/providers | M2 blocker | Channel/app-store compliance; idempotency/webhooks; refund/reconciliation; settlement/reporting; security; commercial terms. |
| TAA-TBD-003 Media/CDN | M1 production blocker | HLS/CMAF, signed access, purge API, Cape Town/Africa performance, cost, origin security, telemetry, portability. |
| TAA-TBD-004 Analytics backend | M1 blocker | Canonical event ingestion, identity stitching, warehouse export, privacy, cost, retention, vendor exit. |
| TAA-TBD-005 DR region | M2 blocker | Legal/privacy approval, service availability, backup replication, restore test and Tier C RTO/RPO feasibility. |
| TAA-TBD-006 DRM | Conditional | Must be resolved before any title/licensor requires DRM. Owned AOU may proceed without if risk/rights allow. |
| TAA-TBD-007 ABR ladder/SLO | M1 benchmark blocker | Device/network benchmark, Data Saver quality and player telemetry evidence. |
| TAA-TBD-008 Concurrency/account sharing | M2 premium blocker | Commercial rule, support policy, device/session enforcement and fraud impact. |
| TAA-TBD-009 Search threshold | M2 architecture freeze | Benchmark corpus + latency/feature evidence; dedicated engine remains trigger-based. |
| TAA-TBD-010 Omíṣẹwà Knowledge mapping | M1 content blocker | AOU Canon approval, mapping version, equivalence tests, spoiler QA, atomic release linkage. |

**Release rule: a blocker-class TBD cannot be waived by schedule pressure. Any exception requires architecture-material change approval with explicit compensating control and expiry.**

## 91. R2 Enforcement Control Register

| **CONTROL ID** | **CONTROL** | **OWNER** | **GATE** | **ACCEPTANCE** |
|----|----|----|----|----|
| TA-R2-001 | Canon correction/versioning | Knowledge/Canon | M1 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-002 | Atomic Release Manifest | Catalog/Media/Rights/Knowledge | M1 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-003 | DB/module domain enforcement | Platform/Data | M1 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-004 | Event order/replay governance | Platform/Eventing | M1 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-005 | External dependency resilience | SRE/All | M2 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-006 | Emergency rights kill path | Rights/Media/SRE | M2 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-007 | Privacy deletion/ledger reconciliation | Identity/Privacy/Data | M2 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-008 | Software supply chain | Security/Platform | M1 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-009 | Threat-model authority | Security | M2 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-010 | Break-glass controls | Security/SRE | M2 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-011 | Executable DR | SRE/Data | M2 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-012 | FinOps/unit-cost controls | Engineering/Finance | M2 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-013 | Client compatibility/forced upgrade | Mobile/API | M2 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |
| TA-R2-014 | TBD closure gates | Architecture Governance | M1/M2 | Evidence recorded in architecture acceptance pack; no unresolved critical exception. |

# APPENDIX A — REFERENCE TECHNOLOGY BASELINE

| **LAYER** | **REFERENCE** | **CONTROL NOTE** |
|----|----|----|
| Mobile | React Native New Architecture | Supported stable release at build lock; Android-first optimisation. |
| Web/Admin | Next.js / React | Separate deployment and auth policy for admin. |
| Backend | Node.js + TypeScript + NestJS | Modular monolith, worker processes, OpenAPI. |
| Operational DB | PostgreSQL | Managed Multi-AZ, domain schemas. |
| Cache | Redis-compatible managed cache | Ephemeral/cache/rate limit/idempotency support. |
| Media | Managed transcoder + HLS/CMAF + CDN | Provider may be AWS-native or approved specialist behind adapter. |
| Cloud runtime | AWS ECS/Fargate reference | OCI container portability. |
| Object storage | S3 reference | Private origin, lifecycle/versioning. |
| Queue/Event | SQS/EventBridge reference | At-least-once, DLQ, outbox. |
| IaC | Terraform | Versioned modules. |
| Observability | OpenTelemetry | Backend vendor replaceable. |
| Security | OWASP ASVS + MASVS/MASTG baselines | Current adopted versions at build lock. |
| API contract | OpenAPI 3.1.x | RFC 9457 errors. |
| Identity | Managed OIDC/OAuth provider | PKCE for native/public clients. |
| Push | FCM/APNs via notification adapter | Provider responses retained. |
| Feature flags | Managed remote-config provider or internal service | No security-only enforcement client-side. |

# APPENDIX B — CRITICAL EVENT CATALOGUE

| **EVENT** | **PRODUCER** | **CONSUMERS** | **PURPOSE** |
|----|----|----|----|
| UserRegistered | Identity | Analytics/Profile | consumer account created |
| ConsentRecorded | Identity | Audit/Privacy | consent version/timestamp |
| ContentPublished | Catalog | Discovery/Notifications | content available |
| RightsChanged | Rights | Media/Discovery | invalidate availability cache |
| MediaReady | Media | Catalog/Ops | derivatives ready |
| WatchCheckpointReached | Media | Knowledge/Analytics | checkpoint crossed |
| KnowledgeGranted | Knowledge | Storyworld/Analytics | new fact authorised |
| ParticipationSubmitted | Participation | Rewards/Analytics | valid response |
| RewardGranted | Rewards | Notifications/Analytics | ledger entry created |
| RewardRedeemed | Rewards | Analytics/Commercial | redemption recorded |
| PaymentConfirmed | Commerce | Entitlement/Analytics | monetary success |
| EntitlementGranted | Entitlement | Notifications/Analytics | access active |
| RefundRecorded | Commerce | Entitlement/Finance | refund lifecycle |
| CampaignActivated | Sponsor | Discovery/Analytics | campaign visible |
| NotificationRequested | Domain | Notification | delivery intent |
| AdminActionRecorded | Audit | Security/Ops | privileged mutation |

# APPENDIX C — DATA RETENTION & CLASSIFICATION CONTROL MODEL

| **DATA TYPE** | **CLASS** | **AUTHORITATIVE STORE** | **RETENTION CONTROL** |
|----|----|----|----|
| Account identity | Restricted | Identity/PostgreSQL | Per account/legal policy; deletion/anonymisation workflow. |
| Consent record | Confidential | Identity/Audit | Retain version/history required to evidence consent/terms. |
| Watch progress | Confidential | Media/PostgreSQL | Product-defined; user account lifecycle. |
| Payment reference | Restricted | Commerce/PostgreSQL | Finance/legal retention; no raw card storage. |
| Entitlement ledger | Confidential | Entitlement/PostgreSQL | Commercial/audit retention. |
| Reward ledger | Confidential | Rewards/PostgreSQL | Commercial/audit retention. |
| Knowledge grants | Confidential | Knowledge/PostgreSQL | Account/storyworld lifecycle. |
| Analytics events | Confidential/Pseudonymous | Warehouse/archive | Tiered retention and privacy policy. |
| Admin audit | Restricted | Audit store | Security/legal retention; append-only. |
| Media derivatives | Internal/Public by state | Object storage | Rights window + lifecycle. |
| VCF provenance reference | Confidential | Rights/PostgreSQL + VCF authority | At least content/rights lifecycle. |

# APPENDIX D — TECHNICAL TBD / DECISION REGISTER

| **TBD** | **DECISION** | **OWNER** | **RESOLVE BY** | **NOTE** |
|----|----|----|----|----|
| TAA-TBD-001 | Final managed identity provider | Platform/Security | Before M1 auth implementation lock | Provider adapter remains mandatory. |
| TAA-TBD-002 | Final payment provider(s) / app-store billing route | Commerce/Finance | Before M2 checkout lock | Parent TBD-001. |
| TAA-TBD-003 | Media processing/CDN provider selection | Media/SRE | Before M1 production pipeline lock | Must meet HLS, signed access and capacity requirements. |
| TAA-TBD-004 | Analytics warehouse/product analytics backend | Data | Before M1 analytics production lock | Canonical event contract remains provider-independent. |
| TAA-TBD-005 | Final DR secondary-region/data-transfer location | SRE/Privacy/Legal | Before M2 DR sign-off | Primary remains Multi-AZ. |
| TAA-TBD-006 | DRM activation decision | Product/Media/Rights | Before premium licensing requiring DRM | Conditional. |
| TAA-TBD-007 | Final ABR ladder and playback SLO | Media | M1 network/device benchmark | Parent TBD-004. |
| TAA-TBD-008 | Consumer concurrency/account-sharing policy | Product/Security/Commercial | Before M2 premium lock | Parent TBD-009. |
| TAA-TBD-009 | Search extraction threshold numeric doc count | Data/Product | Before M2 architecture freeze | Latency trigger remains authoritative. |
| TAA-TBD-010 | Exact Omíṣẹwà Knowledge mapping | AOU Canon/Product | Before M1 content lock | Parent TBD-006. |

# APPENDIX E — PRD REQUIREMENT → ARCHITECTURE TRACEABILITY

This appendix maps every durable requirement from AZP-FMVP-PRD-001 R2.0 to its primary technical domain. Detailed implementation tests remain under the PRD/QA authorities.

| **REQ ID** | **REL** | **P** | **ARCH DOMAIN** | **PRIMARY CONTROL** | **TITLE** |
|----|----|----|----|----|----|
| AZP-AUTH-001 | M1 | P0 | Identity | OIDC/Identity module + Profile schema | Guest Session |
| AZP-AUTH-002 | M1 | P0 | Identity | OIDC/Identity module + Profile schema | Account Creation |
| AZP-AUTH-003 | M1 | P0 | Identity | OIDC/Identity module + Profile schema | Session Persistence |
| AZP-AUTH-004 | M1 | P0 | Identity | OIDC/Identity module + Profile schema | Logout |
| AZP-AUTH-005 | M1 | P0 | Identity | OIDC/Identity module + Profile schema | Credential Recovery |
| AZP-AUTH-006 | M1 | P0 | Identity | OIDC/Identity module + Profile schema | Age Declaration |
| AZP-AUTH-007 | M1 | P0 | Identity | OIDC/Identity module + Profile schema | Consent Record |
| AZP-AUTH-008 | M2 | P1 | Identity | OIDC/Identity module + Profile schema | Progressive Profiling |
| AZP-AUTH-009 | M1 | P0 | Identity | OIDC/Identity module + Profile schema | Account Collision Handling |
| AZP-AUTH-010 | M1 | P0 | Identity | OIDC/Identity module + Profile schema | Role Separation |
| AZP-HOME-001 | M1 | P0 | Experience/BFF | REST API facade + config/read models | Configurable Home |
| AZP-HOME-002 | M1 | P0 | Experience/BFF | REST API facade + config/read models | Continue Watching |
| AZP-HOME-003 | M1 | P0 | Experience/BFF | REST API facade + config/read models | Release Module |
| AZP-HOME-004 | M2 | P1 | Experience/BFF | REST API facade + config/read models | Mission Module |
| AZP-EXP-001 | M1 | P0 | Experience/BFF | REST API facade + config/read models | Explore Categories |
| AZP-EXP-002 | M1 | P0 | Experience/BFF | REST API facade + config/read models | Universe Visibility Flag |
| AZP-SEARCH-001 | M1 | P0 | Discovery/Search | Discovery module + PostgreSQL search/read model | Founding Search |
| AZP-SEARCH-002 | M1 | P0 | Discovery/Search | Discovery module + PostgreSQL search/read model | Zero Result Telemetry |
| AZP-SEARCH-003 | M1 | P0 | Discovery/Search | Discovery module + PostgreSQL search/read model | Availability-Aware Results |
| AZP-VERT-001 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Native 9:16 Playback |
| AZP-VERT-002 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Sequential Continuation |
| AZP-VERT-003 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Progress Persistence |
| AZP-VERT-004 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Captions |
| AZP-VERT-005 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Deep-Link Sharing |
| AZP-VERT-006 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Release Cadence Configuration |
| AZP-VERT-007 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | End-State CTA |
| AZP-MEDIA-001 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Adaptive Streaming |
| AZP-MEDIA-002 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Resume |
| AZP-MEDIA-003 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Data Saver |
| AZP-MEDIA-004 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Secure Delivery |
| AZP-MEDIA-005 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Playback Telemetry |
| AZP-MEDIA-006 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Graceful Degradation |
| AZP-MS-001 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Title Detail |
| AZP-MS-002 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Long-Form Player |
| AZP-MS-003 | M2 | P0 | Media | Media/Catalog + CDN/playback policy | Entitlement Check |
| AZP-MS-004 | M1 | P0 | Media | Media/Catalog + CDN/playback policy | Rights Override |
| AZP-MS-005 | M2 | P1 | Media | Media/Catalog + CDN/playback policy | Post-Play State |
| AZP-STORY-001 | M1 | P0 | Storyworld | Storyworld module/read model | AOU Hub |
| AZP-STORY-002 | M1 | P0 | Storyworld | Storyworld module/read model | Character Page |
| AZP-STORY-003 | M1 | P0 | Storyworld | Storyworld module/read model | Relationship View |
| AZP-STORY-004 | M1 | P0 | Storyworld | Storyworld module/read model | Timeline |
| AZP-STORY-005 | M1 | P0 | Storyworld | Storyworld module/read model | What You Know |
| AZP-STORY-006 | M1 | P0 | Storyworld | Storyworld module/read model | Progressive Unlock |
| AZP-STORY-007 | M1 | P0 | Storyworld | Storyworld module/read model | Locked Deep Link |
| AZP-STORY-008 | M1 | P0 | Storyworld | Storyworld module/read model | API Spoiler Safety |
| AZP-KNOW-001 | M1 | P0 | Knowledge | Knowledge module + CKG/grant ledger | Canonical Event Graph |
| AZP-KNOW-002 | M1 | P0 | Knowledge | Knowledge module + CKG/grant ledger | Knowledge Unit Registry |
| AZP-KNOW-003 | M1 | P0 | Knowledge | Knowledge module + CKG/grant ledger | User Knowledge State |
| AZP-KNOW-004 | M1 | P0 | Knowledge | Knowledge module + CKG/grant ledger | Unlock Trigger Policy |
| AZP-KNOW-005 | M1 | P0 | Knowledge | Knowledge module + CKG/grant ledger | Cross-Format Equivalence |
| AZP-KNOW-006 | M1 | P0 | Knowledge | Knowledge module + CKG/grant ledger | No Automatic Full Unlock on Start |
| AZP-KNOW-007 | M2 | P1 | Knowledge | Knowledge module + CKG/grant ledger | Partial Consumption |
| AZP-KNOW-008 | M2 | P1 | Knowledge | Knowledge module + CKG/grant ledger | Skip Protection |
| AZP-KNOW-009 | M1 | P0 | Knowledge | Knowledge module + CKG/grant ledger | Rewatch Idempotency |
| AZP-KNOW-010 | M1 | P0 | Knowledge | Knowledge module + CKG/grant ledger | Cross-Title Namespace |
| AZP-KNOW-011 | M2 | P1 | Knowledge | Knowledge module + CKG/grant ledger | Manual Remediation |
| AZP-KNOW-012 | M2 | P1 | Knowledge | Knowledge module + CKG/grant ledger | Knowledge Parity Analytics |
| AZP-PART-001 | M1 | P0 | Participation | Participation module + event/outbox | Reusable Participation Object |
| AZP-PART-002 | M1 | P0 | Participation | Participation module + event/outbox | Authentication for Persistent Submission |
| AZP-PART-003 | M1 | P0 | Participation | Participation module + event/outbox | Participation Window |
| AZP-PART-004 | M1 | P0 | Participation | Participation module + event/outbox | Submission Policy |
| AZP-PART-005 | M1 | P0 | Participation | Participation module + event/outbox | Result Policy |
| AZP-PART-006 | M1 | P0 | Participation | Participation module + event/outbox | Knowledge-Aware Participation |
| AZP-PART-007 | M2 | P1 | Participation | Participation module + event/outbox | Sponsor Attachment |
| AZP-PART-008 | M2 | P1 | Participation | Participation module + event/outbox | Audit Trail |
| AZP-PART-009 | M1 | P0 | Participation | Participation module + event/outbox | Non-Cash Prediction |
| AZP-RWD-001 | M2 | P0 | Rewards | Rewards ledger + projection | Points Ledger |
| AZP-RWD-002 | M2 | P0 | Rewards | Rewards ledger + projection | No Cash Equivalence |
| AZP-RWD-003 | M2 | P0 | Rewards | Rewards ledger + projection | Admin Adjustment Audit |
| AZP-RWD-004 | M2 | P0 | Rewards | Rewards ledger + projection | Mission Object |
| AZP-RWD-005 | M2 | P1 | Rewards | Rewards ledger + projection | Streak Rule |
| AZP-RWD-006 | M2 | P0 | Rewards | Rewards ledger + projection | Reward Redemption |
| AZP-RWD-007 | M2 | P1 | Rewards | Rewards ledger + projection | Sponsor-Funded Reward |
| AZP-RWD-008 | M2 | P0 | Rewards | Rewards ledger + projection | Reward Abuse Controls |
| AZP-COM-001 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Channel-Compliant Payment Adapter |
| AZP-COM-002 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Transaction State |
| AZP-COM-003 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Idempotent Purchase |
| AZP-COM-004 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Entitlement Grant |
| AZP-COM-005 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Already Entitled Protection |
| AZP-COM-006 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Rights Override |
| AZP-COM-007 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Sponsor-Funded Entitlement |
| AZP-COM-008 | M2 | P1 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Purchase History |
| AZP-COM-009 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Refund Workflow |
| AZP-COM-010 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Transaction Reconciliation |
| AZP-COM-011 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Price Presentation |
| AZP-COM-012 | M2 | P0 | Commerce/Entitlement | Commerce + Entitlement modules/adapters | Commercial Analytics |
| AZP-CMS-001 | M1 | P0 | Catalog/CMS | Catalog/CMS + ACDP ingestion | Content Entity Model |
| AZP-CMS-002 | M1 | P0 | Catalog/CMS | Catalog/CMS + ACDP ingestion | Content Lifecycle |
| AZP-CMS-003 | M1 | P0 | Catalog/CMS | Catalog/CMS + ACDP ingestion | Release Scheduler |
| AZP-CMS-004 | M1 | P0 | Catalog/CMS | Catalog/CMS + ACDP ingestion | ACDP Validation |
| AZP-CMS-005 | M1 | P0 | Catalog/CMS | Catalog/CMS + ACDP ingestion | Versioning |
| AZP-RIGHTS-001 | M1 | P0 | Rights/Provenance | Rights policy + provenance reference | Rights Record |
| AZP-RIGHTS-002 | M1 | P0 | Rights/Provenance | Rights policy + provenance reference | Automatic Availability Enforcement |
| AZP-RIGHTS-003 | M1 | P0 | Rights/Provenance | Rights policy + provenance reference | Talent Clearance |
| AZP-RIGHTS-004 | M1 | P0 | Rights/Provenance | Rights policy + provenance reference | Music Clearance |
| AZP-RIGHTS-005 | M1 | P0 | Rights/Provenance | Rights policy + provenance reference | AI Provenance Reference |
| AZP-SPON-001 | M2 | P1 | Sponsor | Sponsor config + analytics tags | Sponsor Object |
| AZP-SPON-002 | M2 | P0 | Sponsor | Sponsor config + analytics tags | No Canon Control |
| AZP-SPON-003 | M2 | P1 | Sponsor | Sponsor config + analytics tags | Frequency Cap |
| AZP-SPON-004 | M2 | P0 | Sponsor | Sponsor config + analytics tags | Reporting Integrity |
| AZP-AN-001 | M1 | P0 | Analytics/Data | Event collector + warehouse | Event Taxonomy |
| AZP-AN-002 | M1 | P0 | Analytics/Data | Event collector + warehouse | Identity Stitching |
| AZP-AN-003 | M1 | P0 | Analytics/Data | Event collector + warehouse | Content IDs |
| AZP-AN-004 | M2 | P1 | Analytics/Data | Event collector + warehouse | Campaign Attribution |
| AZP-AN-005 | M1 | P0 | Analytics/Data | Event collector + warehouse | Analytics QA |
| AZP-AN-006 | M2 | P0 | Analytics/Data | Event collector + warehouse | WEP |
| AZP-AN-007 | M2 | P1 | Analytics/Data | Event collector + warehouse | Contribution per WEP |
| AZP-AN-008 | M2 | P1 | Analytics/Data | Event collector + warehouse | Knowledge Route |
| AZP-AN-009 | M2 | P0 | Analytics/Data | Event collector + warehouse | Feature Classification Evidence |
| AZP-NFR-001 | M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Availability |
| AZP-NFR-002 | M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Crash-Free Sessions |
| AZP-NFR-003 | M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Transaction Accuracy |
| AZP-NFR-004 | M2 | P0 | SRE/Security | SLO/SRE/security platform controls | API Performance |
| AZP-NFR-005 | M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Playback Startup |
| AZP-NFR-006 | M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Rebuffer |
| AZP-NFR-007 | M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Entitlement Propagation |
| AZP-NFR-008 | M2 | P0 | SRE/Security | SLO/SRE/security platform controls | RTO/RPO |
| AZP-NFR-009 | M1 | P0 | SRE/Security | SLO/SRE/security platform controls | Observability |
| AZP-NFR-010 | M1 | P0 | SRE/Security | SLO/SRE/security platform controls | Graceful Degradation |
| AZP-SUP-001 | M2 | P0 | Support/Ops | Support API + audit/RBAC | Support Lookup |
| AZP-SUP-002 | M2 | P0 | Support/Ops | Support API + audit/RBAC | Least-Privilege Support |
| AZP-ADMIN-001 | M1 | P0 | Admin/Audit | Admin API + audit/RBAC/feature flags | Named Admin Accounts |
| AZP-ADMIN-002 | M1 | P0 | Admin/Audit | Admin API + audit/RBAC/feature flags | Audit High-Risk Actions |
| AZP-ADMIN-003 | M1 | P0 | Admin/Audit | Admin API + audit/RBAC/feature flags | Feature Flags |
| AZP-ADMIN-004 | M2 | P1 | Admin/Audit | Admin API + audit/RBAC/feature flags | Dual-Control Candidate Actions |
| SEC-001 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |
| SEC-002 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |
| SEC-003 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |
| SEC-004 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |
| SEC-005 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |
| SEC-006 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |
| SEC-007 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |
| SEC-008 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |
| SEC-009 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |
| SEC-010 | M1/M2 | P0 | SRE/Security | SLO/SRE/security platform controls | Security Control |

# APPENDIX F — AUTHORITATIVE STANDARDS & PRIMARY REFERENCES

| **REFERENCE** | **URL** | **USE** |
|----|----|----|
| React Native — About the New Architecture | https://reactnative.dev/architecture/landing-page | Reference for current React Native architecture direction. |
| NestJS — Modules | https://docs.nestjs.com/modules | Reference for module encapsulation used by the modular-monolith baseline. |
| OpenAPI Specification | https://spec.openapis.org/oas/ | HTTP API contract standard. |
| RFC 9457 — Problem Details for HTTP APIs | https://datatracker.ietf.org/doc/html/rfc9457 | Standard API error envelope. |
| OpenID Connect Core 1.0 | https://openid.net/specs/openid-connect-core-1_0-18.html | Authentication protocol baseline. |
| RFC 7636 — PKCE | https://www.rfc-editor.org/rfc/rfc7636 | Proof Key for Code Exchange for public/native clients. |
| Apple — HTTP Live Streaming | https://developer.apple.com/streaming/ | HLS delivery reference. |
| PostgreSQL Current Documentation | https://www.postgresql.org/docs/current/ | Operational relational database reference. |
| OpenTelemetry Documentation | https://opentelemetry.io/docs/ | Vendor-neutral traces, metrics and logs. |
| OWASP ASVS | https://owasp.org/www-project-application-security-verification-standard/ | Web/backend security verification baseline. |
| OWASP MASVS | https://mas.owasp.org/MASVS/ | Mobile application security verification baseline. |
| AWS Regions — Africa (Cape Town) | https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html | Reference primary AWS region and Availability Zones. |

# APPENDIX G — CANON VERSION & ATOMIC RELEASE CONTROL MODEL

| **OBJECT** | **MINIMUM FIELDS** | **IMMUTABILITY / TRANSITION RULE** |
|----|----|----|
| canon_version | canon_version_id; status; effective_at; supersedes; approver | Approved versions are immutable; correction creates successor. |
| knowledge_mapping_version | mapping_version_id; canon_version_id; content/checkpoint scope; approver | Published mapping is immutable; successor version carries correction. |
| release_manifest | release_manifest_id; catalog/media/rights/knowledge/provenance/localisation versions; digest | SEALED manifest immutable; supersede/revoke only. |
| user_knowledge_grant | user_id; knowledge_id; source checkpoint; mapping version; timestamp | Append-only historical evidence. |
| knowledge_correction | correction_id; prior/new mapping; impact set; reason; approver | Compensating effective-state rule; does not erase audit history. |

# APPENDIX H — DOMAIN ENFORCEMENT MATRIX

| **DOMAIN** | **RUNTIME WRITE ROLE** | **MAY DIRECTLY WRITE** | **CROSS-DOMAIN INTERACTION** |
|----|----|----|----|
| Identity | azp_identity_rw | identity schema only | Public interface/events; opaque user_id references. |
| Catalog | azp_catalog_rw | catalog schema only | Rights/Media/Storyworld via interfaces/events/read models. |
| Rights | azp_rights_rw | rights schema only | Authorisation policy interface; invalidation events. |
| Knowledge | azp_knowledge_rw | knowledge schema only | Consumes checkpoints; exposes spoiler-safe projection. |
| Commerce | azp_commerce_rw | commerce schema only | Publishes payment/refund facts; never writes entitlement. |
| Entitlement | azp_entitlement_rw | entitlement schema only | Consumes commerce/reward/sponsor grants; playback reads policy. |
| Rewards | azp_rewards_rw | rewards schema only | Consumes eligible events; no sponsor direct writes. |
| Audit | azp_audit_append | audit append path only | Privileged actions publish append-only audit records. |

# APPENDIX I — EXTERNAL DEPENDENCY RESILIENCE REGISTER

| **PROVIDER CLASS** | **TIMEOUT / RETRY PRINCIPLE** | **DEGRADED MODE** | **RECONCILIATION** |
|----|----|----|----|
| Identity | Short bounded network timeout; retry only safe discovery/key operations | Existing verifiable sessions where safe; new auth unavailable | Provider/session audit after recovery |
| Payment | Bounded request timeout; idempotent retry/backoff | Transaction PENDING/UNKNOWN; no entitlement fail-open | Provider settlement/webhook reconciliation |
| Media/CDN | Control-plane retries; serving path cached/distributed | Serve existing derivatives; queue new ingest | Manifest/CDN inventory verification |
| Push | Queue + backoff + provider throttle | No push; app remains functional | Delivery status/retry queue |
| Analytics | Async/buffer where practical | Critical product paths continue | Backfill/replay analytics events where retained |
| Remote config | Cached signed/server defaults | Use last-known safe config | Provider/config version comparison |

# APPENDIX J — SUPPLY-CHAIN, THREAT-MODEL & BREAK-GLASS ACCEPTANCE

| **CONTROL** | **M1** | **M2 / PUBLIC** |
|----|----|----|
| SBOM generated | Required for backend/container/web/mobile release candidates | Required and archived per production release |
| Signed artefacts | Required for production-intended container artefacts | Verified in deployment gate |
| Threat model | Initial system/domain model drafted | Approved current model; material threats mapped to controls |
| Dependency vulnerabilities | Critical unresolved release blockers unless approved exception | Same + penetration-test findings closed to launch standard |
| Break-glass | Workflow designed/tested in staging | Production time-bound access and audit operational |
| CI cloud identity | Short-lived workload identity preferred/implemented where supported | No routine long-lived high-privilege deploy secrets |

# APPENDIX K — DR & FINOPS CONTROL MATRIX

| **AREA** | **M2 ACCEPTANCE EVIDENCE** |
|----|----|
| Transactional restore | Successful restore from production-class backup; ledger consistency and reconciliation documented. |
| IaC rebuild | Staging/recovery environment recreated from version-controlled IaC with measured time. |
| DR contacts/runbook | Named incident command, provider contacts, recovery order and decision authority. |
| Cost allocation | ≥95% of material cloud spend attributable to environment/domain/cost centre by tagging/account structure. |
| Cost anomaly alert | Tested anomaly/budget alert reaches named owner. |
| Media unit cost | Dashboard/report for CDN/egress per viewing hour and storage/transcode cost. |
| Autoscale cap | Documented max scale/cost bounds and premiere override procedure. |

# APPENDIX L — CLIENT COMPATIBILITY & EMERGENCY VERSION CONTROL

| **SCENARIO** | **REQUIRED BEHAVIOUR** |
|----|----|
| Normal backend evolution | Preserve supported older clients through additive/backward-compatible APIs. |
| Client missing new feature | Capability negotiation hides/blocks unsupported feature without breaking core flows. |
| Security-critical old client | Server raises min_supported_version and presents forced-upgrade UX. |
| Store update delayed | Do not force upgrade until update path is actually available unless risk requires temporary service restriction. |
| Backend rollback | Rollback preserves contracts required by currently supported clients. |
| Persisted local schema change | Migration/versioned cache; authoritative account/purchase state rehydrates from server. |

# APPENDIX M — R2 ARCHITECTURE ACCEPTANCE MATRIX

| **CONTROL** | **R2 ADDITION** | **GATE** | **GREEN CONDITION** |
|----|----|----|----|
| TA-R2-001 | Canon correction/versioning | M1 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-002 | Atomic Release Manifest | M1 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-003 | DB/module domain enforcement | M1 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-004 | Event order/replay governance | M1 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-005 | External dependency resilience | M2 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-006 | Emergency rights kill path | M2 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-007 | Privacy deletion/ledger reconciliation | M2 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-008 | Software supply chain | M1 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-009 | Threat-model authority | M2 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-010 | Break-glass controls | M2 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-011 | Executable DR | M2 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-012 | FinOps/unit-cost controls | M2 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-013 | Client compatibility/forced upgrade | M2 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |
| TA-R2-014 | TBD closure gates | M1/M2 | GREEN requires implementation evidence + test/runbook/monitoring where applicable; no unresolved critical exception. |

# FINAL LOCK — AZP-TAA-001

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><strong>TECHNICAL AUTHORITY LOCK<br />
AZP-TAA-001 — R2.0 / P2.0 / PA2.0 is the controlling technical architecture authority beneath AZP-PDDMA-001 and AZP-FMVP-PRD-001 R2.0. It fully preserves R1.0 architectural decisions unless expressly strengthened by R2. Its doctrine is: modular monolith first; mechanically enforced domain ownership; sealed atomic releases; canon-version correction with immutable audit history; server-authoritative rights, commerce and knowledge; transactional outbox; verified software supply chain; failure-complete external dependencies; tested disaster recovery; FinOps visibility; backward-compatible clients; and service extraction only when evidence earns complexity.</strong></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

BUILD THE SMALLEST RELIABLE TECHNICAL SYSTEM THAT CAN PROVE THE NEXT BIGGEST PRODUCT CLAIM.

REUSE BEFORE REBUILD. • CONSISTENCY WHERE MONEY/RIGHTS/KNOWLEDGE MATTER. • EVENTUAL WHERE SAFE. • ATOMIC RELEASES. • VERIFY THE SUPPLY CHAIN. • DESIGN FOR FAILURE. • OBSERVE COST AS WELL AS RELIABILITY.
