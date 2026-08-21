# Tasks — Media, Content, Rights, Provenance & Knowledge Graph

> Derived from AZP-TAA-001 R2.0 Parts IV, V, VII
> Core differentiators: Knowledge Graph, Rights Control, Atomic Releases

---

## 1. ACDP Ingestion Pipeline (TAA §21)

| Step | Task | Status |
|------|------|--------|
| 1 | VCF requests upload session → scoped pre-signed locations | Partial |
| 2 | Master assets + ACDP manifest uploaded to private staging | Partial |
| 3 | Ingestion validator: checksum, required files, metadata schema, rights/provenance refs | Needs implementation |
| 4 | Catalog/Media records created in non-publishable state | Partial |
| 5 | Transcoding/packaging: adaptive renditions, HLS/CMAF, thumbnails, derived assets | Partial |
| 6 | Automated technical QC (success/failure recording) | Needs implementation |
| 7 | Human content/rights approval workflow | Needs implementation |
| 8 | Approved content → Scheduled/Published state, CDN availability per release window | Partial |
| 9 | Publication emits ContentPublished/IndexUpdated events | Partial |

---

## 2. Object Storage Zones (TAA §22)

| Zone | Access | Status |
|------|--------|--------|
| ingest-staging | VCF/ingestion service only | Needs implementation |
| media-master-operational | Media processing only | Needs implementation |
| media-derivatives | Media/CDN origin only | Partial |
| public-static | CDN only | Partial |
| audit-export | Restricted operations/security | Needs implementation |

---

## 3. Video Packaging (TAA §23)

| Task | Reference | Status |
|------|-----------|--------|
| HLS baseline delivery | TAA §23 | Needs verification |
| CMAF/fMP4 packaging for cross-platform reuse | TAA §23 | Needs implementation |
| Adaptive bitrate ladder with low-bandwidth Data Saver rendition | TAA §23 | Needs implementation |
| 1080p premium founding target | TAA §23 | Needs verification |
| Captions/subtitles (WebVTT) from authoritative assets | TAA §23 | Needs implementation |
| Playback telemetry (rendition, startup, buffering, completion, failure) | TAA §23 | Needs implementation |

---

## 4. Playback Authorisation (TAA §24)

| Step | Task | Status |
|------|------|--------|
| 1 | Client requests playback authorisation for content_id | Partial |
| 2 | Media Policy verifies: publish state, territory, age/access rule, rights window, entitlement | Needs implementation |
| 3 | If authorised: short-lived signed playback token/URL/cookie | Partial |
| 4 | CDN/origin validates signed access; origin remains private | Needs verification |
| 5 | Active stream not silently revoked on token expiry | Needs verification |

---

## 5. Premium Content Protection (TAA §25)

| Task | Reference | Status |
|------|-----------|--------|
| Private origin (no public media URLs) | TA-LAW-05 | Partial |
| Signed CDN access | TAA §25 | Partial |
| Encrypted transport (TLS) | TAA §52 | ✅ Enforced |
| Provider-side media encryption (where supported) | TAA §25 | Needs implementation |
| Multi-DRM (conditional M2/P2) | ADR-010 | Deferred |

---

## 6. Rights Decision Service (TAA §26)

| Task | Reference | Status |
|------|-----------|--------|
| Server-side availability computation | TAA §26 | Partial |
| Factors: content state + territory + rights window + platform + age/classification + entitlement | TAA §26 | Partial |
| Single policy decision reused by Explore/Search/Title Detail/Playback | TAA §26 | Needs implementation |
| Rights override entitlement enforcement | TA-LAW-03 | Needs implementation |
| Rights cache bounded by short TTL/invalidation | TAA §26 | Partial |
| RightsChanged event invalidates availability cache | TAA §36 | Needs implementation |

---

## 7. AI Provenance Reference (TAA §27)

| Field | Status |
|-------|--------|
| provenance_record_id | Needs implementation |
| master_version/hash | Needs implementation |
| clearance_state | Needs implementation |
| covered_talent/voice_restrictions | Needs implementation |
| distribution_relevant_vendor/model_restriction | Needs implementation |

---

## 8. Canonical Knowledge Graph (TAA §16-20, §77)

### 8.1 Data Model

| Entity | Purpose | Status |
|--------|---------|--------|
| canonical_event | Atomic/grouped canonical story event | Needs implementation |
| knowledge_unit | Spoiler-relevant fact audience may know | Needs implementation |
| knowledge_dependency | Prerequisite relationships | Needs implementation |
| content_checkpoint | Point in content capable of granting knowledge | Needs implementation |
| checkpoint_grant | Knowledge Units granted by checkpoint | Needs implementation |
| equivalence_set | Maps different formats to equivalent understanding | Needs implementation |
| user_knowledge_grant | Immutable user knowledge acquisition record (append-only) | Needs implementation |
| knowledge_projection | Optimised current known-set/read model | Needs implementation |

### 8.2 Knowledge Grant Flow (TAA §17)

| Step | Task | Status |
|------|------|--------|
| 1 | Media/Progress records user crossing authorised checkpoint | Needs implementation |
| 2 | Progress event enters outbox/event bus | Needs implementation |
| 3 | Knowledge Module resolves checkpoint → Knowledge Units + equivalence rules | Needs implementation |
| 4 | Knowledge Module inserts only missing user_knowledge_grant rows (idempotent) | Needs implementation |
| 5 | Knowledge projection/cache updated or invalidated | Needs implementation |
| 6 | Storyworld APIs use known-set for AVAILABLE/LOCKED/TEASED/HIDDEN data | Needs implementation |

### 8.3 Cross-Format Equivalence (TAA §18)

| Task | Reference | Status |
|------|-----------|--------|
| Explicit mappings from each format's checkpoints to Canonical Events | TAA §18 | Needs implementation |
| No inference by episode number across formats | TAA §18 | Needs implementation |
| VCF/AOU Canon Authority supplies mappings | TAA §18 | Needs implementation |
| Server-side spoiler filtering before serialization | TAA §18 | Needs implementation |

### 8.4 Knowledge Scale Strategy (TAA §19)

| Phase | Strategy | Status |
|-------|----------|--------|
| Founding | Relational grants with unique(user_id, knowledge_id) | Needs implementation |
| Cache | Redis current known-set with short TTL/version key | Needs implementation |
| Growth | Compressed/bitmap projections when volume justifies | Needs implementation |
| Extraction | Graph/knowledge service only if traversal complexity or scale triggers met | Deferred |
| Always | Auditability of when/how knowledge was granted | Needs implementation |

### 8.5 Canon Versioning & Correction (TAA §77)

| Task | Reference | Status |
|------|-----------|--------|
| canon_version with status, effective_at, supersedes | TAA §77 | Needs implementation |
| knowledge_mapping_version linked to canon version | TAA §77 | Needs implementation |
| Knowledge Unit IDs durable; meaning changes → new version | TAA §77 | Needs implementation |
| Correction impact analysis before activation | TAA §77 | Needs implementation |
| Historical user_knowledge_grant rows preserved | TAA §77 | Needs implementation |
| Knowledge projection versioned and rebuildable | TAA §77 | Needs implementation |
| Erroneous reveal: remove future presentation, preserve audit | TAA §77 | Needs implementation |
| Material spoiler correction as incident/change event | TAA §77 | Needs implementation |

---

## 9. Atomic Release Manifest (TAA §78)

| Field | Control | Status |
|-------|---------|--------|
| release_manifest_id | Immutable identifier | Needs implementation |
| content/catalog version | Exact metadata version | Needs implementation |
| media master/derivative set | Exact master hash/version + derivative package | Needs implementation |
| rights snapshot | Exact rights-policy version | Needs implementation |
| knowledge mapping | Exact canon_version_id + knowledge_mapping_version_id | Needs implementation |
| captions/audio/localisation | Exact approved track/subtitle versions | Needs implementation |
| provenance | VCF provenance record ID + approved master hash | Needs implementation |
| commercial/sponsor state | Approved attachments affecting presentation/access | Needs implementation |
| seal digest | Cryptographic digest over manifest definition | Needs implementation |
| status lifecycle | DRAFT → VALIDATED → SEALED → PUBLISHED → REVOKED/SUPERSEDED | Needs implementation |

### Release Manifest Rules

| Rule | Status |
|------|--------|
| Only SEALED manifests may transition to PUBLISHED | Needs implementation |
| Search/Explore/Playback/Storyworld resolve same active release identity | Needs implementation |
| Superseding release creates new manifest (no silent mutation) | Needs implementation |
| Emergency revocation disables manifest + triggers cache/CDN invalidation | Needs implementation |

---

## 10. Emergency Rights Takedown (TAA §82)

| Task | Target | Status |
|------|--------|--------|
| Authorised trigger workflow (dual control for reversal) | TTA §82 | Needs implementation |
| Policy propagation ≤5 minutes | TAA §82 | Needs implementation |
| CDN purge ≤15 minutes | TAA §82 | Needs implementation |
| Bounded playback token lifetime (≤10 min) | TAA §82 | Partial |
| Blocked new sessions immediately | TAA §82 | Needs implementation |
| Active session interruption on next auth/segment boundary | TAA §82 | Needs implementation |
| Verification across API/search/explore/playback/CDN before closure | TAA §82 | Needs implementation |
| Audit: reason, operator, timestamps, affected assets, restoration | TAA §82 | Needs implementation |

---

## 11. Storyworld Read Architecture (TAA §20)

| Task | Reference | Status |
|------|-----------|--------|
| Denormalised read models (Storyworld entities + Knowledge visibility) | TAA §20 | Needs implementation |
| Read models cached by content/canon version | TAA §20 | Needs implementation |
| Personalised read models keyed by user Knowledge version | TAA §20 | Needs implementation |
| spoiler-safe API responses (AVAILABLE/LOCKED/TEASED/HIDDEN) | TAA §20 | Needs implementation |
| No hidden future payloads sent to client | TA-LAW-02 | Needs implementation |
