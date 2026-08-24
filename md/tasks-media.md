# Tasks — Media, Content, Rights, Provenance & Knowledge Graph

> Derived from AZP-TAA-001 R2.0 Parts IV, V, VII
> Core differentiators: Knowledge Graph, Rights Control, Atomic Releases

---

## 1. ACDP Ingestion Pipeline (TAA §21)

| Step | Task | Status |
|------|------|--------|
| 1 | VCF requests upload session → scoped pre-signed locations | ✅ Implemented |
| 2 | Master assets + ACDP manifest uploaded to private staging | ✅ Implemented |
| 3 | Ingestion validator: checksum, required files, metadata schema, rights/provenance refs | ✅ Implemented |
| 4 | Catalog/Media records created in non-publishable state | ✅ Implemented |
| 5 | Transcoding/packaging: adaptive renditions, HLS/CMAF, thumbnails, derived assets | ✅ Implemented |
| 6 | Automated technical QC (success/failure recording) | ✅ Implemented |
| 7 | Human content/rights approval workflow | ✅ Implemented |
| 8 | Approved content → Scheduled/Published state, CDN availability per release window | ✅ Implemented |
| 9 | Publication emits ContentPublished/IndexUpdated events | ✅ Implemented |

---

## 2. Object Storage Zones (TAA §22)

| Zone | Access | Status |
|------|--------|--------|
| ingest-staging | VCF/ingestion service only | ✅ Implemented |
| media-master-operational | Media processing only | ✅ Implemented |
| media-derivatives | Media/CDN origin only | ✅ Implemented |
| public-static | CDN only | ✅ Implemented |
| audit-export | Restricted operations/security | ✅ Implemented |

---

## 3. Video Packaging (TAA §23)

| Task | Reference | Status |
|------|-----------|--------|
| HLS baseline delivery | TAA §23 | ✅ Verified (VideoPackagingService) |
| CMAF/fMP4 packaging for cross-platform reuse | TAA §23 | ✅ Implemented |
| Adaptive bitrate ladder with low-bandwidth Data Saver rendition | TAA §23 | ✅ Implemented |
| 1080p premium founding target | TAA §23 | ✅ Verified (1080p rendition configured) |
| Captions/subtitles (WebVTT) from authoritative assets | TAA §23 | ✅ Implemented |
| Playback telemetry (rendition, startup, buffering, completion, failure) | TAA §23 | ✅ Implemented |

---

## 4. Playback Authorisation (TAA §24)

| Step | Task | Status |
|------|------|--------|
| 1 | Client requests playback authorisation for content_id | ✅ Implemented |
| 2 | Media Policy verifies: publish state, territory, age/access rule, rights window, entitlement | ✅ Implemented |
| 3 | If authorised: short-lived signed playback token/URL/cookie | ✅ Implemented |
| 4 | CDN/origin validates signed access; origin remains private | ✅ Verified (PlaybackAuthorizationService) |
| 5 | Active stream not silently revoked on token expiry | ✅ Verified (10-min token lifetime) |

---

## 5. Premium Content Protection (TAA §25)

| Task | Reference | Status |
|------|-----------|--------|
| Private origin (no public media URLs) | TA-LAW-05 | ✅ Implemented |
| Signed CDN access | TAA §25 | ✅ Implemented |
| Encrypted transport (TLS) | TAA §52 | ✅ Enforced |
| Provider-side media encryption (where supported) | TAA §25 | ✅ Implemented |
| Multi-DRM (conditional M2/P2) | ADR-010 | Deferred |

---

## 6. Rights Decision Service (TAA §26)

| Task | Reference | Status |
|------|-----------|--------|
| Server-side availability computation | TAA §26 | ✅ Implemented |
| Factors: content state + territory + rights window + platform + age/classification + entitlement | TAA §26 | ✅ Implemented |
| Single policy decision reused by Explore/Search/Title Detail/Playback | TAA §26 | ✅ Implemented |
| Rights override entitlement enforcement | TA-LAW-03 | ✅ Implemented |
| Rights cache bounded by short TTL/invalidation | TAA §26 | ✅ Implemented |
| RightsChanged event invalidates availability cache | TAA §36 | ✅ Implemented |

---

## 7. AI Provenance Reference (TAA §27)

| Field | Status |
|-------|--------|
| provenance_record_id | ✅ Implemented |
| master_version/hash | ✅ Implemented |
| clearance_state | ✅ Implemented |
| covered_talent/voice_restrictions | ✅ Implemented |
| distribution_relevant_vendor/model_restriction | ✅ Implemented |

---

## 8. Canonical Knowledge Graph (TAA §16-20, §77)

### 8.1 Data Model

| Entity | Purpose | Status |
|--------|---------|--------|
| canonical_event | Atomic/grouped canonical story event | ✅ Implemented |
| knowledge_unit | Spoiler-relevant fact audience may know | ✅ Implemented |
| knowledge_dependency | Prerequisite relationships | ✅ Implemented |
| content_checkpoint | Point in content capable of granting knowledge | ✅ Implemented |
| checkpoint_grant | Knowledge Units granted by checkpoint | ✅ Implemented |
| equivalence_set | Maps different formats to equivalent understanding | ✅ Implemented |
| user_knowledge_grant | Immutable user knowledge acquisition record (append-only) | ✅ Implemented |
| knowledge_projection | Optimised current known-set/read model | ✅ Implemented |

### 8.2 Knowledge Grant Flow (TAA §17)

| Step | Task | Status |
|------|------|--------|
| 1 | Media/Progress records user crossing authorised checkpoint | ✅ Implemented |
| 2 | Progress event enters outbox/event bus | ✅ Implemented |
| 3 | Knowledge Module resolves checkpoint → Knowledge Units + equivalence rules | ✅ Implemented |
| 4 | Knowledge Module inserts only missing user_knowledge_grant rows (idempotent) | ✅ Implemented |
| 5 | Knowledge projection/cache updated or invalidated | ✅ Implemented |
| 6 | Storyworld APIs use known-set for AVAILABLE/LOCKED/TEASED/HIDDEN data | ✅ Implemented |

### 8.3 Cross-Format Equivalence (TAA §18)

| Task | Reference | Status |
|------|-----------|--------|
| Explicit mappings from each format's checkpoints to Canonical Events | TAA §18 | ✅ Implemented |
| No inference by episode number across formats | TAA §18 | ✅ Implemented |
| VCF/AOU Canon Authority supplies mappings | TAA §18 | ✅ Implemented |
| Server-side spoiler filtering before serialization | TAA §18 | ✅ Implemented |

### 8.4 Knowledge Scale Strategy (TAA §19)

| Phase | Strategy | Status |
|-------|----------|--------|
| Founding | Relational grants with unique(user_id, knowledge_id) | ✅ Implemented |
| Cache | Redis current known-set with short TTL/version key | ✅ Implemented |
| Growth | Compressed/bitmap projections when volume justifies | ✅ Implemented |
| Extraction | Graph/knowledge service only if traversal complexity or scale triggers met | Deferred |
| Always | Auditability of when/how knowledge was granted | ✅ Implemented |

### 8.5 Canon Versioning & Correction (TAA §77)

| Task | Reference | Status |
|------|-----------|--------|
| canon_version with status, effective_at, supersedes | TAA §77 | ✅ Implemented |
| knowledge_mapping_version linked to canon version | TAA §77 | ✅ Implemented |
| Knowledge Unit IDs durable; meaning changes → new version | TAA §77 | ✅ Implemented |
| Correction impact analysis before activation | TAA §77 | ✅ Implemented |
| Historical user_knowledge_grant rows preserved | TAA §77 | ✅ Implemented |
| Knowledge projection versioned and rebuildable | TAA §77 | ✅ Implemented |
| Erroneous reveal: remove future presentation, preserve audit | TAA §77 | ✅ Implemented |
| Material spoiler correction as incident/change event | TAA §77 | ✅ Implemented |

---

## 9. Atomic Release Manifest (TAA §78)

| Field | Control | Status |
|-------|---------|--------|
| release_manifest_id | Immutable identifier | ✅ Implemented |
| content/catalog version | Exact metadata version | ✅ Implemented |
| media master/derivative set | Exact master hash/version + derivative package | ✅ Implemented |
| rights snapshot | Exact rights-policy version | ✅ Implemented |
| knowledge mapping | Exact canon_version_id + knowledge_mapping_version_id | ✅ Implemented |
| captions/audio/localisation | Exact approved track/subtitle versions | ✅ Implemented |
| provenance | VCF provenance record ID + approved master hash | ✅ Implemented |
| commercial/sponsor state | Approved attachments affecting presentation/access | ✅ Implemented |
| seal digest | Cryptographic digest over manifest definition | ✅ Implemented |
| status lifecycle | DRAFT → VALIDATED → SEALED → PUBLISHED → REVOKED/SUPERSEDED | ✅ Implemented |

### Release Manifest Rules

| Rule | Status |
|------|--------|
| Only SEALED manifests may transition to PUBLISHED | ✅ Implemented |
| Search/Explore/Playback/Storyworld resolve same active release identity | ✅ Implemented |
| Superseding release creates new manifest (no silent mutation) | ✅ Implemented |
| Emergency revocation disables manifest + triggers cache/CDN invalidation | ✅ Implemented |

---

## 10. Emergency Rights Takedown (TAA §82)

| Task | Target | Status |
|------|--------|--------|
| Authorised trigger workflow (dual control for reversal) | TTA §82 | ✅ Implemented |
| Policy propagation ≤5 minutes | TAA §82 | ✅ Implemented |
| CDN purge ≤15 minutes | TAA §82 | ✅ Implemented |
| Bounded playback token lifetime (≤10 min) | TAA §82 | ✅ Implemented |
| Blocked new sessions immediately | TAA §82 | ✅ Implemented |
| Active session interruption on next auth/segment boundary | TAA §82 | ✅ Implemented |
| Verification across API/search/explore/playback/CDN before closure | TAA §82 | ✅ Implemented |
| Audit: reason, operator, timestamps, affected assets, restoration | TAA §82 | ✅ Implemented |

---

## 11. Storyworld Read Architecture (TAA §20)

| Task | Reference | Status |
|------|-----------|--------|
| Denormalised read models (Storyworld entities + Knowledge visibility) | TAA §20 | ✅ Implemented |
| Read models cached by content/canon version | TAA §20 | ✅ Implemented |
| Personalised read models keyed by user Knowledge version | TAA §20 | ✅ Implemented |
| spoiler-safe API responses (AVAILABLE/LOCKED/TEASED/HIDDEN) | TAA §20 | ✅ Implemented |
| No hidden future payloads sent to client | TA-LAW-02 | ✅ Implemented |
