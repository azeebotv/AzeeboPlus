> **File:** `founding-mvp-prd.md` · **Document ID:** AZP-FMVP-PRD-001 · **Revision:** R2.0 / P2.0 / PA2.0

**AZEEBO+**

**FOUNDING MVP MASTER PRODUCT REQUIREMENTS DOCUMENT**

**FINAL TRUE-MERGER, REQUIREMENT-TRACEABLE, STATE-COMPLETE,\
CANONICAL-KNOWLEDGE, COMMERCIAL-CONTROL, ENGINEERING-HANDOFF**

**AZP-FMVP-PRD-001**

**R2.0 / P2.0 / PA2.0**

| **CONTROL** | **DESIGNATION** |
|----|----|
| Parent Authority | AZP-PDDMA-001 — Product Development & Deployment Master Authority |
| Product Owner | Virtual Media Network Limited |
| Founding IP | Agbàlá Olódùmarè Universe (AOU) |
| Founding Title | Omíṣẹwà: The Throne Remembers |
| Founding Experiences | Vertical · Movies & Series · AOU Storyworld · Participate · Rewards |
| Status | Final Founding MVP Product Execution Authority |
| Effective Date | 8 August 2026 |

**CONFIDENTIAL · PROPRIETARY · CONTROLLED DISTRIBUTION**

# CONFIDENTIALITY & CONTROL NOTICE

This document contains confidential, proprietary and commercially sensitive product, technical, operational, financial and intellectual-property information belonging to Virtual Media Network Limited (VMNL). It is prepared for authorised internal execution and controlled adviser, investor, technology-partner and delivery-team review only.

No part may be distributed, copied, adapted or relied upon outside the approved purpose without VMNL authorisation. Planning targets and provisional technical thresholds contained in this authority are product-control assumptions until validated through engineering benchmark, production data, user evidence, commercial agreements and applicable legal/compliance review.

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>CONTROLLING RULE</strong></p>
<p>Where this PRD conflicts with AZP-PDDMA-001 or approved higher corporate/legal authority, the higher authority prevails. Lower-order technical, design, sprint, analytics, universe or operations documents may refine implementation but may not contradict this PRD without approved change control.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## Revision Control

| **REVISION** | **STATUS** | **CONTROL CHANGE** |
|----|----|----|
| R1.0 / P1.0 / PA1.0 | Founding MVP Master PRD | Initial integrated PRD architecture. |
| R2.0 / P2.0 / PA2.0 | Final True-Merger Authority | Adds full requirement traceability, durable IDs, business rules, state machines, Canonical Knowledge Graph, cross-format equivalence, SKU controls, fraud/abuse baseline, RBAC matrix, NFR/SLO targets, capacity envelope, screen-state matrix, Epic RACI/dependencies and controlled TBD/assumption register. |

## Authority Hierarchy

- 1\. VMNL corporate, legal and regulatory authority.

- 2\. AZP-PDDMA-001 — Product Development & Deployment Master Authority.

- 3\. AZP-FMVP-PRD-001 — this Founding MVP Master PRD.

- 4\. Technical Architecture Authority.

- 5\. Design System & UX Authority.

- 6\. M0–M3 Delivery Master.

- 7\. Data Model & API Specification.

- 8\. Analytics Event & KPI Authority.

- 9\. Payments / Entitlements / Reconciliation Authority.

- 10\. Storyworld Engine detailed PRD and universe-specific build authorities.

- 11\. Backlog, sprint, QA, release and operational runbooks.

# EXECUTIVE PRODUCT LOCK

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>FOUNDING PRODUCT JOB</strong></p>
<p>The Founding MVP exists to determine whether VMNL has earned the right to scale Azeebo+. It is a truth-generating product, not a miniature version of every future universe.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

- Omíṣẹwà proves whether the founding story is compelling.

- AOU proves whether premium long-form and vertical can operate as one canonical storyworld across different narrative routes.

- The Founding MVP proves whether Azeebo+ adds measurable value beyond passive playback.

- M2 proves whether consumer and sponsor economics can operate reliably.

- Title Two proves whether the platform and production system are reusable.

- Only proven value unlocks material expansion into subsequent universes.

## Founding Release States

| **RELEASE** | **STATE** | **PRIMARY QUESTION** | **PRIMARY EXIT** |
|----|----|----|----|
| M0 | Experience Proof | Do users understand and want the experience? | Experience architecture validated. |
| M1 | Founding Closed Beta | Does the product work and create intended behaviour? | AOU-G1 and AOU-G2 evidence. |
| M2 | Founding Public MVP | Can the product operate commercially and reliably? | AOU-G3 evidence. |
| M3 | Monetisation & Retention | Can retention and economics improve without destructive complexity? | Title Two / AOU-G4 readiness. |

## Founding Navigation

| **SURFACE** | **JOB** | **FOUNDING CONTENT** |
|----|----|----|
| Home | What should I do now? | Latest release, continue watching, mission/reward, AOU discovery. |
| Explore | Discover content and storyworlds. | Vertical, Series, AOU, Search. |
| Participate | Turn viewing into action. | Polls, quizzes, non-cash predictions, reactions, missions. |
| Rewards | Make progress visible. | Points, badges, streaks, missions, unlocks. |
| Profile | Own identity and history. | Watch history, storyworld progress, purchases, preferences, support. |

# CONTENTS — CONTROL INDEX

| **PART** | **CONTROL DOMAIN** |
|----|----|
| PART I | Product Authority, Scope & Release Control |
| PART II | Users, Navigation & Consumer Experience |
| PART III | Media, Vertical & Movies & Series |
| PART IV | Storyworld, Canonical Knowledge & Cross-Format Equivalence |
| PART V | Participation, Rewards & Missions |
| PART VI | Commerce, Products, Payments & Entitlements |
| PART VII | CMS, Rights, Provenance & Sponsor Controls |
| PART VIII | Analytics, Experiments, Discovery & Product Economics |
| PART IX | NFR, Reliability, Security, Privacy, Fraud & Capacity |
| PART X | Administration, Support, RBAC & Operations |
| PART XI | Epics, RACI, Delivery, QA & Release Gates |
| PART XII | Traceability, State Machines, Business Rules & Assumption Control |
| APPENDICES | Registers, matrices and final lock |

# PART I — PRODUCT AUTHORITY, SCOPE & RELEASE CONTROL

## 1. Product Purpose

The Founding MVP shall prove that premium African IP can become a durable direct-to-audience relationship through a mobile-first combination of vertical storytelling, premium long-form viewing, spoiler-aware Storyworld exploration, structured participation, visible rewards and controlled commercial access.

## 2. Founding Hypothesis

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>HYPOTHESIS</strong></p>
<p>If VMNL combines compelling vertical storytelling, premium long-form viewing, progressive Storyworld exploration, structured participation and visible rewards inside a low-friction mobile product, audiences will return more frequently and create greater commercial value than they would through passive playback alone.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 3. Five Questions the MVP Must Answer

| **CODE** | **QUESTION** | **EVIDENCE DOMAIN** |
|----|----|----|
| H1 | Do audiences want Omíṣẹwà? | Completion, continuation, return, affinity. |
| H2 | Does vertical create frequency and feed deeper premium engagement? | Cross-format conversion and knowledge parity. |
| H3 | Does Azeebo+ add value beyond playback? | Storyworld, participation, rewards, retention uplift. |
| H4 | Do product mechanics increase return behaviour? | D1/D7/D30, session depth, repeat participation. |
| H5 | Can the relationship create enough economic or strategic value to scale? | Contribution, sponsor value, premium conversion, CAC/LTV. |

## 4. Product Priority Classes

| **CLASS** | **MEANING** | **RELEASE CONSEQUENCE** |
|----|----|----|
| P0 | Mandatory for assigned release. | Missing P0 can block release. |
| P1 | Required for commercial maturity. | May trail earliest beta if evidence remains valid. |
| P2 | Post-proof enhancement. | Must earn priority from observed behaviour. |
| PX | Explicit exclusion. | May not enter scope without approved change control. |

## 5. Formal MVP Exclusions

- Open mass UGC

- Public DMs

- Open fan forums

- Unmoderated comments

- Full Creator Economy

- Creator cash payouts

- Full Reality Show Factory

- Reality voting and supervotes

- Cash predictions / real-money gaming

- Sports betting

- Complex multiplayer games

- Large premium sports-rights portfolio

- Proprietary stored-value wallet

- Blockchain/token economy

- Large acquired movie catalogue

- Filmmaker marketplace

- Complex ML recommendation stack

- Mass live chat

## 6. Release-Gate Relationship

| **AOU GATE** | **PRODUCT RELEASE RELATIONSHIP** | **BLOCKS IF FAILED** |
|----|----|----|
| AOU-G0A | Pre-M0 / technical-production proof. | Full-season production escalation. |
| AOU-G0B | Pre-M0 / creative proof. | Founding public positioning around Omíṣẹwà. |
| AOU-G1 | M1 audience proof. | Aggressive acquisition and M2 scale. |
| AOU-G2 | M1 platform proof. | Unproven Storyworld/participation/reward expansion. |
| AOU-G3 | M2 economic proof. | Material growth capital and broad paid acquisition. |
| AOU-G4 | Title Two reuse proof. | Claim of repeatable franchise/platform engine. |

# PART II — USERS, NAVIGATION & CONSUMER EXPERIENCE

## 7. User Roles

| **ROLE** | **NAME** | **CONTROL PURPOSE** |
|----|----|----|
| U1 | Guest | Unauthenticated discovery and approved free/sample access. |
| U2 | Registered Viewer | Persistent identity, watch history, preferences, progress. |
| U3 | Premium Viewer | Registered viewer with active commercial entitlement. |
| U4 | Storyworld Explorer | Behavioural state: meaningful Storyworld engagement. |
| U5 | Participant | Behavioural state: poll, quiz, mission, reaction or prediction participation. |
| U6 | Support User | Limited customer-support access. |
| U7 | Content Operator | Content metadata, scheduling and publishing. |
| U8 | Rights Operator | Territories, windows, rights, provenance clearance. |
| U9 | Commercial Operator | Approved sponsor campaigns, surfaces and rewards. |
| U10 | Finance Operator | Transactions, refunds and reconciliation. |
| U11 | Platform Administrator | High-privilege technical administration. |

## 8. Guest Access Doctrine

- Guests may open public deep links and browse approved public title information.

- Guests may watch approved free/sample content and limited AOU material.

- Registration is required for persistent progress, participation, rewards, premium purchases and personal notification state.

- The registration trigger is an M0/M1 experiment, not an ideological assumption.

## 9. Identity, Home, Explore & Search Requirements

| **ID** | **REQUIREMENT** | **P** | **REL** | **ACCEPTANCE SUMMARY** |
|----|----|----|----|----|
| AZP-AUTH-001 | Guest Session — System shall create a non-privileged guest session that permits approved public discovery without persistent entitlement or reward state. | P0 | M1 | QA-AUTH-001 |
| AZP-AUTH-002 | Account Creation — User shall create a unique account using approved authentication methods and recorded consent. | P0 | M1 | QA-AUTH-002 |
| AZP-AUTH-003 | Session Persistence — Authenticated sessions shall persist securely across normal app restarts subject to security policy. | P0 | M1 | QA-AUTH-003 |
| AZP-AUTH-004 | Logout — User shall be able to terminate the local authenticated session. | P0 | M1 | QA-AUTH-004 |
| AZP-AUTH-005 | Credential Recovery — Credential-based accounts shall support secure recovery. | P0 | M1 | QA-AUTH-005 |
| AZP-AUTH-006 | Age Declaration — Onboarding shall capture age declaration required by approved product policy. | P0 | M1 | QA-AUTH-006 |
| AZP-AUTH-007 | Consent Record — System shall record current terms/privacy consent version and timestamp. | P0 | M1 | QA-AUTH-007 |
| AZP-AUTH-008 | Progressive Profiling — Non-essential profile data shall be requested only when a clear feature requires it. | P1 | M2 | QA-AUTH-008 |
| AZP-AUTH-009 | Account Collision Handling — Duplicate or colliding credentials shall resolve through approved account-recovery/merge policy rather than silently creating uncontrolled duplicates. | P0 | M1 | QA-AUTH-009 |
| AZP-AUTH-010 | Role Separation — Consumer identity shall remain distinct from administrative RBAC roles. | P0 | M1 | QA-AUTH-010 |
| AZP-HOME-001 | Configurable Home — Home rails and hero modules shall be remotely configurable without binary release. | P0 | M1 | QA-HOME-001 |
| AZP-HOME-002 | Continue Watching — Authenticated users with incomplete eligible content shall receive Continue Watching. | P0 | M1 | QA-HOME-002 |
| AZP-HOME-003 | Release Module — Home shall support scheduled promotion of current vertical/premium release. | P0 | M1 | QA-HOME-003 |
| AZP-HOME-004 | Mission Module — When Rewards is enabled, Home may display active mission/progress without displacing critical content hierarchy. | P1 | M2 | QA-HOME-004 |
| AZP-EXP-001 | Explore Categories — Explore shall expose only activated categories; founding categories are Vertical, Series and AOU. | P0 | M1 | QA-EXP-001 |
| AZP-EXP-002 | Universe Visibility Flag — Future universe surfaces shall remain hidden until activation flags and readiness approval are satisfied. | P0 | M1 | QA-EXP-002 |
| AZP-SEARCH-001 | Founding Search — Search shall support title, episode, character, place and artefact queries. | P0 | M1 | QA-SEARCH-001 |
| AZP-SEARCH-002 | Zero Result Telemetry — Zero-result queries shall be recorded with query metadata subject to privacy controls. | P0 | M1 | QA-SEARCH-002 |
| AZP-SEARCH-003 | Availability-Aware Results — Search results shall respect publish state, territory, rights and age/access rules. | P0 | M1 | QA-SEARCH-003 |

# PART III — MEDIA, VERTICAL & MOVIES & SERIES

## 10. Media Functional Requirements

| **ID** | **REQUIREMENT** | **P** | **REL** | **OWNER** | **TEST** |
|----|----|----|----|----|----|
| AZP-VERT-001 | Native 9:16 Playback — Vertical shall provide portrait-native playback for approved 9:16 media. | P0 | M1 | Media | QA-VERT-001 |
| AZP-VERT-002 | Sequential Continuation — Vertical shall present the next authorised episode according to configured release and rights state. | P0 | M1 | Media/Product | QA-VERT-002 |
| AZP-VERT-003 | Progress Persistence — Authenticated vertical watch progress shall persist across normal sessions. | P0 | M1 | Media | QA-VERT-003 |
| AZP-VERT-004 | Captions — Vertical playback shall support captions/subtitles where delivered. | P0 | M1 | Media | QA-VERT-004 |
| AZP-VERT-005 | Deep-Link Sharing — Approved share actions shall create rights-aware deep links and campaign attribution where supported. | P0 | M1 | Growth/Media | QA-VERT-005 |
| AZP-VERT-006 | Release Cadence Configuration — Vertical release may be daily, multi-daily, burst or chapter-based without code change. | P0 | M1 | Content Ops | QA-VERT-006 |
| AZP-VERT-007 | End-State CTA — Vertical completion state shall support configurable CTA to next episode, series, Storyworld or Participate. | P0 | M1 | Product | QA-VERT-007 |
| AZP-MEDIA-001 | Adaptive Streaming — Video delivery shall use adaptive bitrate/rendition selection appropriate to network and device. | P0 | M1 | Media/SRE | QA-MEDIA-001 |
| AZP-MEDIA-002 | Resume — Long-form and vertical content shall support resume for authenticated users. | P0 | M1 | Media | QA-MEDIA-002 |
| AZP-MEDIA-003 | Data Saver — User shall be able to select a lower-data playback mode that persists. | P0 | M1 | Media/Product | QA-MEDIA-003 |
| AZP-MEDIA-004 | Secure Delivery — Media URLs/tokens shall be issued in a rights-aware manner that does not expose unrestricted permanent source URLs. | P0 | M1 | Media/Security | QA-MEDIA-004 |
| AZP-MEDIA-005 | Playback Telemetry — Player shall emit defined start/progress/complete/error/buffer events. | P0 | M1 | Media/Data | QA-MEDIA-005 |
| AZP-MEDIA-006 | Graceful Degradation — Failure of optional Storyworld/Rewards/Analytics services shall not unnecessarily block permitted playback. | P0 | M1 | Platform/SRE | QA-MEDIA-006 |
| AZP-MS-001 | Title Detail — Movies & Series shall provide title artwork, synopsis, episode rail and watch/resume state. | P0 | M1 | Media/Product | QA-MS-001 |
| AZP-MS-002 | Long-Form Player — Long-form player shall support adaptive playback, seeking where permitted, captions, subtitles and full-screen. | P0 | M1 | Media | QA-MS-002 |
| AZP-MS-003 | Entitlement Check — Premium playback shall require active entitlement when configured. | P0 | M2 | Commerce/Media | QA-MS-003 |
| AZP-MS-004 | Rights Override — Expired/blocked territorial rights shall override a user entitlement. | P0 | M1 | Rights/Media | QA-MS-004 |
| AZP-MS-005 | Post-Play State — Long-form completion shall offer configurable next episode, vertical, Storyworld or Participate CTA. | P1 | M2 | Product | QA-MS-005 |

## 11. Mandatory Player States

| **STATE** | **EXPECTED PRODUCT BEHAVIOUR** |
|----|----|
| Loading | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Playing | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Paused | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Buffering | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Completed | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Network degraded | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| No connection | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Authentication required | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Premium locked | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Rights/territory unavailable | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Content unpublished/removed | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Session expired | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Caption unavailable | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Retry available | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |
| Fatal error | Defined visual state, analytics/error code, safe recovery path and no silent data loss. |

# PART IV — STORYWORLD, CANONICAL KNOWLEDGE & CROSS-FORMAT EQUIVALENCE

R2 elevates Knowledge State into a formal proprietary control layer. Azeebo+ must understand what a user canonically knows, not merely what files the user has played. This is required because AOU may express the same canonical story through long-form and vertical routes, and later through multiple titles and crossovers.

## 12. Storyworld Object Model

| **OBJECT** | **PURPOSE** |
|----|----|
| Storyworld | Top-level canonical world. |
| Title | Specific dramatic property. |
| Character | Person/entity. |
| Relationship | Typed connection between entities. |
| Location | Canonical place. |
| Institution | Organisation/governance entity. |
| Artefact | Meaningful object. |
| Canonical Event | Story event independent of format. |
| Knowledge Unit | Atomic audience-safe fact or state. |
| Timeline Item | Chronological representation of event/knowledge. |
| Mystery | Controlled unresolved question. |
| Reveal | Knowledge unit or event transition exposed to audience. |
| Content Unit | Vertical episode, long-form episode, clip or future content object. |
| Unlock Rule | Rule linking content/behaviour to knowledge exposure. |

## 13. Storyworld & Knowledge Requirements

| **ID** | **REQUIREMENT** | **P** | **REL** | **TEST** |
|----|----|----|----|----|
| AZP-STORY-001 | AOU Hub — AOU Hub shall present configurable modules for title, episode, characters, timeline, places, artefacts, What You Know and unlocks. | P0 | M1 | QA-STORY-001 |
| AZP-STORY-002 | Character Page — Character page shall display only knowledge-authorised description, relationships, episodes and unlocked facts. | P0 | M1 | QA-STORY-002 |
| AZP-STORY-003 | Relationship View — Relationship view shall support typed/directional links with spoiler-safe visibility. | P0 | M1 | QA-STORY-003 |
| AZP-STORY-004 | Timeline — Timeline shall render according to Knowledge State and not expose unauthorised future events. | P0 | M1 | QA-STORY-004 |
| AZP-STORY-005 | What You Know — System shall generate/display a spoiler-controlled summary derived from authorised Knowledge Units. | P0 | M1 | QA-STORY-005 |
| AZP-STORY-006 | Progressive Unlock — Configured completion or canonical event rules may unlock characters, facts, artefacts, locations or participation. | P0 | M1 | QA-STORY-006 |
| AZP-STORY-007 | Locked Deep Link — Direct deep link to locked Storyworld object shall resolve to a spoiler-safe locked/teased state rather than leak full data. | P0 | M1 | QA-STORY-007 |
| AZP-STORY-008 | API Spoiler Safety — Unauthorised future Knowledge Units shall not be exposed in API responses merely because UI hides them. | P0 | M1 | QA-STORY-008 |
| AZP-KNOW-001 | Canonical Event Graph — AOU content shall map to canonical events independent of distribution format. | P0 | M1 | QA-KNOW-001 |
| AZP-KNOW-002 | Knowledge Unit Registry — Each audience-relevant canonical fact shall have a durable Knowledge Unit ID and spoiler level. | P0 | M1 | QA-KNOW-002 |
| AZP-KNOW-003 | User Knowledge State — Registered user shall possess derived Knowledge State representing authorised Knowledge Units. | P0 | M1 | QA-KNOW-003 |
| AZP-KNOW-004 | Unlock Trigger Policy — Each Knowledge Unit shall specify approved unlock trigger(s) such as content completion, canonical event threshold or explicit campaign event. | P0 | M1 | QA-KNOW-004 |
| AZP-KNOW-005 | Cross-Format Equivalence — Long-form and vertical content units shall map to canonical event/knowledge equivalence sets where they convey the same canonical information. | P0 | M1 | QA-KNOW-005 |
| AZP-KNOW-006 | No Automatic Full Unlock on Start — Merely starting a content unit shall not grant all Knowledge Units assigned to completion unless the specific rule says so. | P0 | M1 | QA-KNOW-006 |
| AZP-KNOW-007 | Partial Consumption — Knowledge rules may attach to completion thresholds or specific canonical checkpoints rather than only episode completion. | P1 | M2 | QA-KNOW-007 |
| AZP-KNOW-008 | Skip Protection — Seeking/jumping ahead shall not automatically grant skipped Knowledge Units unless content semantics and configured policy allow it. | P1 | M2 | QA-KNOW-008 |
| AZP-KNOW-009 | Rewatch Idempotency — Rewatching content shall not duplicate knowledge state or unlock rewards incorrectly. | P0 | M1 | QA-KNOW-009 |
| AZP-KNOW-010 | Cross-Title Namespace — Knowledge IDs and canonical events shall support later AOU titles without collision. | P0 | M1 | QA-KNOW-010 |
| AZP-KNOW-011 | Manual Remediation — Authorised operations may repair incorrect Knowledge State through audited remediation without rewriting canon. | P1 | M2 | QA-KNOW-011 |
| AZP-KNOW-012 | Knowledge Parity Analytics — System shall measure user route to Knowledge State (vertical, long-form, mixed) for cross-format analysis. | P1 | M2 | QA-KNOW-012 |

## 14. Canonical Knowledge Graph

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>CORE PROPRIETARY CONCEPT</strong></p>
<p>The Canonical Knowledge Graph is the abstraction between content playback and Storyworld visibility. Content Units map to Canonical Events; Canonical Events produce or imply Knowledge Units; User Knowledge State controls what the user may safely discover. This allows long-form, vertical and future titles to converge on canonical truth without requiring identical viewing routes.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 15. Cross-Format Knowledge Equivalence Matrix — Control Model

| **LONG-FORM** | **VERTICAL** | **CANONICAL EVENTS** | **KNOWLEDGE UNITS** | **RULE** |
|----|----|----|----|----|
| LF-E01 | V-001–V-010 | CE-001, CE-002, CE-003 | K-001, K-002, K-003, K-006 | Equivalent only after configured completion/checkpoints. |
| LF-E02 | V-011–V-020 | CE-004, CE-005 | K-004, K-005, K-010 | Illustrative mapping; actual AOU canon pack controls final IDs. |
| MIXED | Any combination | Union of completed/checkpointed canonical events | Deduplicated Knowledge Unit set | No double reward or duplicate unlock. |

The values above demonstrate the required data relationship only. Actual episode/event mappings shall be supplied by the AOU Canon Authority in the subordinate Canonical Knowledge Mapping Pack before M1 content lock.

## 16. Knowledge-State State Machine

| **STATE** | **MEANING** | **ALLOWED TRANSITION** |
|----|----|----|
| UNKNOWN | User has no authorised exposure. | → TEASED / KNOWN via approved unlock. |
| TEASED | Object/fact may be hinted without reveal. | → KNOWN after approved trigger. |
| KNOWN | Knowledge Unit fully authorised. | Persistent unless remediation required. |
| REVOKED_FOR_ERROR | Temporary repair state for erroneous grant. | → UNKNOWN/TEASED/KNOWN via audited repair. |

# PART V — PARTICIPATION, REWARDS & MISSIONS

## 17. Participation & Rewards Requirements

| **ID** | **REQUIREMENT** | **P** | **REL** | **OWNER** | **TEST** |
|----|----|----|----|----|----|
| AZP-PART-001 | Reusable Participation Object — Participation Engine shall support poll, quiz, prediction, reaction, mission and challenge as reusable types. | P0 | M1 | Engagement | QA-PART-001 |
| AZP-PART-002 | Authentication for Persistent Submission — Persistent participation shall require authenticated identity. | P0 | M1 | Engagement | QA-PART-002 |
| AZP-PART-003 | Participation Window — Each activity shall support configured start/end time and closed state. | P0 | M1 | Engagement | QA-PART-003 |
| AZP-PART-004 | Submission Policy — Each activity shall define once/repeat/change-response policy. | P0 | M1 | Engagement | QA-PART-004 |
| AZP-PART-005 | Result Policy — Activity shall define immediate, aggregate, delayed or non-public result. | P0 | M1 | Engagement | QA-PART-005 |
| AZP-PART-006 | Knowledge-Aware Participation — Quizzes/polls that can spoil future content shall respect Knowledge State. | P0 | M1 | Engagement/AOU | QA-PART-006 |
| AZP-PART-007 | Sponsor Attachment — Approved activities may carry sponsor attribution without granting sponsor canon or outcome control. | P1 | M2 | Commercial/Product | QA-PART-007 |
| AZP-PART-008 | Audit Trail — High-value or reward-bearing participation shall retain sufficient submission history for dispute review. | P1 | M2 | Engagement/Operations | QA-PART-008 |
| AZP-PART-009 | Non-Cash Prediction — Founding prediction mechanics shall use points/status/non-cash reward only. | P0 | M1 | Product/Legal | QA-PART-009 |
| AZP-RWD-001 | Points Ledger — Every points change shall record user, amount, reason, source and timestamp. | P0 | M2 | Engagement/Finance | QA-RWD-001 |
| AZP-RWD-002 | No Cash Equivalence — Loyalty points shall not be represented as cash, deposit balance or guaranteed monetary value. | P0 | M2 | Product/Finance/Legal | QA-RWD-002 |
| AZP-RWD-003 | Admin Adjustment Audit — Manual points adjustment shall require authorised role, reason and audit record. | P0 | M2 | Operations/Finance | QA-RWD-003 |
| AZP-RWD-004 | Mission Object — Mission shall define objective, eligibility, time window, completion logic and reward. | P0 | M2 | Engagement | QA-RWD-004 |
| AZP-RWD-005 | Streak Rule — Streak logic shall be defined/configurable and idempotent. | P1 | M2 | Engagement | QA-RWD-005 |
| AZP-RWD-006 | Reward Redemption — Redemption shall verify eligibility, consume required reward value once and create immutable redemption record. | P0 | M2 | Engagement/Finance | QA-RWD-006 |
| AZP-RWD-007 | Sponsor-Funded Reward — Sponsor-funded reward shall be distinguished from VMNL-funded points/entitlements in ledger/reporting. | P1 | M2 | Commercial/Finance | QA-RWD-007 |
| AZP-RWD-008 | Reward Abuse Controls — Reward earning/redemption shall enforce rate/eligibility controls to limit automated farming and duplicate claims. | P0 | M2 | Trust/Engagement | QA-RWD-008 |

## 18. Participation State Machine

| **STATE** | **TRANSITION RULE** |
|----|----|
| DRAFT | Internal only → REVIEW/SCHEDULED. |
| SCHEDULED | Opens automatically or manually at approved time → OPEN. |
| OPEN | Accepts eligible responses → CLOSED. |
| CLOSED | No new response; result policy applies → RESULT_PENDING / RESULT_PUBLISHED / ARCHIVED. |
| RESULT_PENDING | Awaiting controlled result → RESULT_PUBLISHED. |
| RESULT_PUBLISHED | Read-only published outcome → ARCHIVED. |
| ARCHIVED | Historical read-only state. |

## 19. Reward State Machine

| **STATE** | **MEANING / TRANSITION** |
|----|----|
| CREATED | Reward definition exists. |
| ELIGIBLE | User satisfies eligibility but has not earned/claimed. |
| EARNED | Reward is owned/available to user. |
| REDEEMED | Benefit consumed/issued. |
| EXPIRED | Time validity ended. |
| REVOKED | Removed through approved fraud/error/contract rule with audit trail. |

# PART VI — COMMERCE, PRODUCTS, PAYMENTS & ENTITLEMENTS

## 20. Founding Product/SKU Catalogue

| **SKU CODE** | **PRODUCT** | **ACCESS** | **DURATION** | **RENEW** | **REFUND** | **ENTITLEMENT** |
|----|----|----|----|----|----|----|
| FREE-VERT | Free Vertical | Free | N/A | No | N/A | No commercial entitlement or free-access entitlement as implementation requires. |
| EA-EP | Episode Early Access | Paid digital | Configured hours/days | No | Policy-defined | Episode entitlement. |
| SERIES-PASS | Series/Season Pass | Paid digital | Configured season/window | No by default | Policy-defined | Series entitlement. |
| PREM-BUNDLE | Premium Bundle | Paid digital | Configured | Configurable | Policy-defined | Bundle entitlement. |
| SPON-UNLOCK | Sponsor Unlock | Sponsor-funded promo | Configured | No | N/A | Promotional entitlement; never silently converts to paid. |
| REWARD-UNLOCK | Reward Unlock | Loyalty-funded access | Configured | No | N/A | Reward-generated entitlement. |

## 21. Commerce Requirements

| **ID** | **REQUIREMENT** | **P** | **REL** | **TEST** |
|----|----|----|----|----|
| AZP-COM-001 | Channel-Compliant Payment Adapter — Commerce layer shall support approved payment routes by platform/product/territory without hard-coding all logic to one provider. | P0 | M2 | QA-COM-001 |
| AZP-COM-002 | Transaction State — Every payment shall have a definitive state and UNKNOWN/PENDING states shall enter reconciliation. | P0 | M2 | QA-COM-002 |
| AZP-COM-003 | Idempotent Purchase — Retry/callback duplication shall not create duplicate charge requests or duplicate entitlements where idempotency can prevent it. | P0 | M2 | QA-COM-003 |
| AZP-COM-004 | Entitlement Grant — Confirmed successful purchase shall create intended entitlement once and only once. | P0 | M2 | QA-COM-004 |
| AZP-COM-005 | Already Entitled Protection — User already holding an equivalent entitlement shall not unknowingly purchase an identical overlapping entitlement unless explicitly permitted and disclosed. | P0 | M2 | QA-COM-005 |
| AZP-COM-006 | Rights Override — Entitlement shall not override content rights expiry/territory block. | P0 | M2 | QA-COM-006 |
| AZP-COM-007 | Sponsor-Funded Entitlement — Sponsor-funded access shall be represented separately from paid consumer transaction and shall not silently auto-renew into paid access. | P0 | M2 | QA-COM-007 |
| AZP-COM-008 | Purchase History — Registered user shall be able to view approved purchase/entitlement history. | P1 | M2 | QA-COM-008 |
| AZP-COM-009 | Refund Workflow — Authorised Finance/Support workflow shall link refund to transaction and entitlement state. | P0 | M2 | QA-COM-009 |
| AZP-COM-010 | Transaction Reconciliation — System shall support reconciliation of provider records, internal transaction ledger and entitlements. | P0 | M2 | QA-COM-010 |
| AZP-COM-011 | Price Presentation — Before confirmation, user shall see approved price/currency and product scope. | P0 | M2 | QA-COM-011 |
| AZP-COM-012 | Commercial Analytics — Purchase funnel shall emit start/success/failure/cancel/refund and entitlement events. | P0 | M2 | QA-COM-012 |

## 22. Transaction State Machine

| **STATE** | **ALLOWED TRANSITIONS**                                     |
|-----------|-------------------------------------------------------------|
| CREATED   | → PENDING / CANCELLED.                                      |
| PENDING   | → SUCCESS / FAILED / CANCELLED / UNKNOWN.                   |
| UNKNOWN   | → SUCCESS / FAILED through reconciliation.                  |
| SUCCESS   | → REFUNDED / PARTIALLY_REFUNDED / DISPUTED where supported. |
| FAILED    | Terminal except new transaction.                            |
| CANCELLED | Terminal except new transaction.                            |
| REFUNDED  | Terminal for refunded amount.                               |
| DISPUTED  | → resolved status per provider/finance workflow.            |

## 23. Entitlement State Machine

| **STATE** | **RULE**                                                     |
|-----------|--------------------------------------------------------------|
| PENDING   | Awaiting confirmed grant condition.                          |
| ACTIVE    | Access permitted subject to rights and product policy.       |
| EXPIRED   | Time/access window ended.                                    |
| REVOKED   | Access removed under approved rule.                          |
| REFUNDED  | Commercial source refunded; access outcome follows SKU rule. |
| SUSPENDED | Temporary hold pending dispute/security/compliance review.   |

# PART VII — CMS, RIGHTS, PROVENANCE & SPONSOR CONTROLS

## 24. CMS / Rights / Sponsor Requirements

| **ID** | **REQUIREMENT** | **P** | **REL** | **OWNER** | **TEST** |
|----|----|----|----|----|----|
| AZP-CMS-001 | Content Entity Model — CMS shall support storyworld, title, season, episode, chapter, clip, media asset, artwork and Storyworld entities. | P0 | M1 | Media/Content Ops | QA-CMS-001 |
| AZP-CMS-002 | Content Lifecycle — Content shall move through controlled Draft/Review/Approved/Scheduled/Published/Unpublished/Expired/Blocked/Archived states. | P0 | M1 | Content Ops | QA-CMS-002 |
| AZP-CMS-003 | Release Scheduler — Approved releases shall support scheduled publication/unpublication. | P0 | M1 | Content Ops | QA-CMS-003 |
| AZP-CMS-004 | ACDP Validation — Production CMS shall block publication eligibility when mandatory ACDP components are missing or invalid. | P0 | M1 | Content Ops/VCF | QA-CMS-004 |
| AZP-CMS-005 | Versioning — Published media/metadata shall retain version identity sufficient for audit and rollback. | P0 | M1 | Content Ops | QA-CMS-005 |
| AZP-RIGHTS-001 | Rights Record — Every commercial media asset shall record owner/licensor, territories, window, platform and monetisation rights. | P0 | M1 | Rights | QA-RIGHTS-001 |
| AZP-RIGHTS-002 | Automatic Availability Enforcement — Where feasible, expired/blocked rights shall remove playback availability automatically. | P0 | M1 | Rights/Media | QA-RIGHTS-002 |
| AZP-RIGHTS-003 | Talent Clearance — Covered asset shall record required performer/voice/digital-replica clearance status. | P0 | M1 | VTM/Rights | QA-RIGHTS-003 |
| AZP-RIGHTS-004 | Music Clearance — Covered media shall record music-rights status before publish. | P0 | M1 | Rights/VCF | QA-RIGHTS-004 |
| AZP-RIGHTS-005 | AI Provenance Reference — AI-assisted AOU asset shall reference VCF provenance record and approved master version. | P0 | M1 | VCF/Rights | QA-RIGHTS-005 |
| AZP-SPON-001 | Sponsor Object — M2 shall support sponsor/campaign/surface/creative/CTA/start/end/audience/reward/reporting configuration. | P1 | M2 | Commercial/Product | QA-SPON-001 |
| AZP-SPON-002 | No Canon Control — Sponsor configuration shall not grant authority to change AOU canon or fabricate audience outcomes. | P0 | M2 | Product/AOU/Commercial | QA-SPON-002 |
| AZP-SPON-003 | Frequency Cap — Sponsor surfaces shall support configured exposure/frequency control where relevant. | P1 | M2 | Commercial/Product | QA-SPON-003 |
| AZP-SPON-004 | Reporting Integrity — Sponsor metrics shall derive from defined telemetry rather than unsupported manual estimates where platform telemetry exists. | P0 | M2 | Data/Commercial | QA-SPON-004 |

## 25. AZEEBO+ CONTENT DELIVERY PACKAGE — ACDP

- Master video and approved derivatives

- Portrait/vertical master where required

- Audio masters/tracks

- Captions and subtitles

- Poster and thumbnails

- Trailer/teaser where required

- Synopsis and content metadata

- Storyworld / canonical event mappings

- Territory and release window

- Talent clearance status

- Music clearance status

- AI provenance ID where applicable

- Classification/content warnings

- Sponsor restrictions

- Checksum/version

- Release approval

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>INGESTION LAW</strong></p>
<p>NO VALID ACDP = NO PRODUCTION INGESTION / PUBLICATION ELIGIBILITY.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## 26. Content Lifecycle State Machine

| **STATE**   | **NEXT CONTROLLED STATE**                         |
|-------------|---------------------------------------------------|
| DRAFT       | IN_REVIEW                                         |
| IN_REVIEW   | APPROVED / DRAFT                                  |
| APPROVED    | SCHEDULED / PUBLISHED                             |
| SCHEDULED   | PUBLISHED / APPROVED                              |
| PUBLISHED   | UNPUBLISHED / EXPIRED / BLOCKED                   |
| UNPUBLISHED | APPROVED / ARCHIVED                               |
| EXPIRED     | ARCHIVED / renewed APPROVED if rights change      |
| BLOCKED     | UNPUBLISHED / ARCHIVED / APPROVED after clearance |
| ARCHIVED    | Read-only historical state.                       |

# PART VIII — ANALYTICS, EXPERIMENTS, DISCOVERY & PRODUCT ECONOMICS

## 27. Founding Analytics Event Register

| **EVENT**             | **EVENT**           |
|-----------------------|---------------------|
| app_open              | deep_link_open      |
| onboarding_start      | onboarding_complete |
| registration_complete | home_view           |
| content_impression    | vertical_start      |
| vertical_25           | vertical_50         |
| vertical_75           | vertical_complete   |
| next_episode_start    | series_start        |
| series_25             | series_50           |
| series_75             | series_complete     |
| storyworld_open       | character_view      |
| relationship_view     | timeline_view       |
| artefact_view         | unlock_view         |
| poll_view             | poll_submit         |
| quiz_start            | quiz_complete       |
| prediction_submit     | mission_start       |
| mission_complete      | reward_earned       |
| reward_redeemed       | purchase_start      |
| purchase_success      | purchase_failure    |
| entitlement_granted   | notification_open   |
| search                | search_zero_result  |
| share                 | support_request     |

## 28. Experiment Registry

Every material experiment shall record hypothesis, target population, variant, primary metric, guardrails, duration, stop condition, decision rule, owner, privacy/commercial impact and final decision.

| **ID** | **HYPOTHESIS** | **QUESTION** | **PRIMARY** | **GUARDRAIL** | **RELEASE** |
|----|----|----|----|----|----|
| EXP-M0-001 | Registration trigger | When should guest be asked to register? | Activation + completion | Registration failure / abandonment | M0/M1 |
| EXP-M1-002 | Vertical cadence | 1/day vs 2/day vs burst | Completion + D7 return | Backlog / notification fatigue | M1 |
| EXP-M1-003 | End-state CTA | Next episode vs Storyworld vs Participate | Continuation / non-playback adoption | Completion reduction | M1 |
| EXP-M2-004 | Premium framing | Direct price vs sponsor-funded access | Conversion / contribution | Refund / drop-off | M2 |

## 29. Discovery Evolution

| **LEVEL** | **METHOD** | **ACTIVATION CONDITION** |
|----|----|----|
| D0 | Editorial | Founding default. |
| D1 | Popularity + recency | Sufficient basic telemetry. |
| D2 | Declared interests | Reliable preference data. |
| D3 | Behavioural cohorts | Sufficient repeat usage. |
| D4 | Cross-universe recommendation | Multiple active universes. |
| D5 | Predictive personalisation | Large enough clean data + justified ROI. |

## 30. AOU Product Metrics

| **GATE** | **PRIMARY PRODUCT METRICS** | **INITIAL MANAGEMENT RANGE / RULE** |
|----|----|----|
| G1 | Vertical completion; next-episode start; D7 return; long-form completion; cross-format conversion. | ~70–75% vertical completion; ~50–55% next start; ~25–30% D7; ~45–50% long-form qualified-start completion; calibrate in beta. |
| G2 | Non-playback adoption; retention/session/premium uplift. | ~20–25% qualified adoption initial test; value uplift matters more than raw use. |
| G3 | CAC; contribution; premium/sponsor value; payback; LTV/CAC. | Target path toward LTV/CAC ≥3x and CAC payback ≤12 months for scalable paid cohorts. |
| G4 | Title Two platform reuse; incremental engineering; audience portability. | Substantial reuse and materially lower incremental engineering than founding build. |

# PART IX — NFR, RELIABILITY, SECURITY, PRIVACY, FRAUD & CAPACITY

## 31. Provisional Founding NFR / SLO Matrix

| **SLO** | **PROVISIONAL TARGET** | **GATE** | **NOTE** |
|----|----|----|----|
| Critical-service availability | ≥99.9% monthly after stabilisation | M2 | Excludes only approved maintenance defined in SLO policy. |
| Crash-free sessions | ≥99.5% | M2 | Higher target after stabilisation. |
| Critical non-media API latency | P95 ≤750 ms; P99 ≤1,500 ms under launch envelope | M2 | Technical Authority may tighten after benchmark. |
| Search response | P95 ≤1.5 s | M2 | Excludes external network extremes. |
| Playback startup | P50 ≤2.5 s; P95 ≤6 s on qualifying 4G/Wi-Fi | M2 | Measure by rendition/network class. |
| Rebuffer ratio | P95 user session target \<2% playback time on qualifying networks | M2 | Segment degraded networks separately. |
| Entitlement propagation | ≤10 s after confirmed internal success for ≥99% normal cases | M2 | Provider webhook delays tracked separately. |
| CMS publish propagation | ≤5 min for normal content/config to intended edge availability | M2 | Emergency disable should be faster where designed. |
| Notification operational batch | 95% provider-accepted within 15 min for standard release batches | M2 | Not delivery/read guarantee. |
| RTO — identity/commerce entitlement | ≤60 min | M2 | Target pending Architecture validation. |
| RPO — transactional ledgers | ≤5 min / stronger where provider allows | M2 | Target pending Architecture validation. |

## 32. Founding Capacity Envelope

| **DIMENSION** | **FOUNDING DESIGN ENVELOPE** | **SCALE TRIGGER / NOTE** |
|----|----|----|
| Registered users | 250,000 design-year-one planning envelope | Scale architecture before 70% sustained capacity. |
| Monthly active users | 75,000 base planning case | Not a hard cap. |
| Peak concurrent video sessions | 10,000 founding design target | Premiere load test required. |
| Vertical starts/minute | 5,000 burst target | CDN/analytics must absorb burst. |
| Long-form concurrent premiere | 5,000 initial target | Scale threshold at 70% observed sustained peak. |
| Transactions/minute | 300 burst target | Including retries/idempotency load. |
| Notification batch | 250,000 recipients | Provider limits/segmentation apply. |
| Analytics events/day | 10 million | Retention/cost model required. |
| CMS active operators | 50 | RBAC and audit must remain performant. |
| Media library | 5 TB master/derivative operational planning baseline + scalable object storage | Storage policy separated from VCF archival master. |

## 33. Security & Privacy Requirements

| **ID**  | **CONTROL**                                                    |
|---------|----------------------------------------------------------------|
| SEC-001 | Encryption in transit for authenticated and sensitive traffic. |
| SEC-002 | Appropriate encryption at rest for sensitive data and secrets. |
| SEC-003 | Secrets managed outside source code and user-visible clients.  |
| SEC-004 | Least privilege and RBAC for administration.                   |
| SEC-005 | Audit logging for high-risk admin actions.                     |
| SEC-006 | Dependency/vulnerability monitoring and patch process.         |
| SEC-007 | Secure CI/CD and environment separation.                       |
| SEC-008 | Incident response and evidence preservation.                   |
| SEC-009 | Backups protected and restore-tested.                          |
| SEC-010 | Sensitive permission requests minimised and purpose-explained. |

## 34. Fraud & Abuse Baseline

| **ID** | **RISK** | **BASELINE CONTROL** |
|----|----|----|
| FA-001 | Credential abuse | Rate limiting, suspicious login signals, lock/step-up controls as architecture supports. |
| FA-002 | Fake account farming | Device/account velocity signals, campaign eligibility rules, manual review for material rewards. |
| FA-003 | Reward farming | Idempotent mission completion, per-user limits, suspicious earning patterns. |
| FA-004 | Coupon/sponsor abuse | Single-use/eligibility controls, redemption ledger, campaign limits. |
| FA-005 | Chargeback abuse | Transaction/dispute history, entitlement suspension policy, Finance review. |
| FA-006 | Automated quiz/prediction abuse | Rate limits, anomaly signals, reward caps, bot-resistance where justified. |
| FA-007 | Premium account sharing | Session/device visibility and reasonable concurrency policy; avoid punitive false positives. |
| FA-008 | Entitlement spoofing | Server-side entitlement authority; clients never self-authorise premium access. |
| FA-009 | Scraping | Rate limiting, token controls and detection for high-volume automated extraction. |
| FA-010 | Admin abuse | Named accounts, least privilege, audit logs, sensitive-action review. |

## 35. Low-Bandwidth Doctrine

- Adaptive bitrate and Data Saver are P0.

- App shall define degraded states for severely poor network, 3G-equivalent, normal 4G, high-speed 5G/Wi-Fi.

- Payment interruption must not silently duplicate charges or lose transaction state.

- Progress should resume after transient interruption where technically possible.

- Optional service failure must not collapse core permitted playback.

# PART X — ADMINISTRATION, SUPPORT, RBAC & OPERATIONS

## 36. Support & Administration Requirements

| **ID** | **REQUIREMENT** | **P** | **REL** | **TEST** |
|----|----|----|----|----|
| AZP-SUP-001 | Support Lookup — Authorised Support shall inspect account, recent playback issue, transaction, entitlement and reward/support state appropriate to case. | P0 | M2 | QA-SUP-001 |
| AZP-SUP-002 | Least-Privilege Support — Support shall not receive publish, rights-edit or unrestricted finance/admin permissions. | P0 | M2 | QA-SUP-002 |
| AZP-ADMIN-001 | Named Admin Accounts — Shared administrative credentials are prohibited. | P0 | M1 | QA-ADMIN-001 |
| AZP-ADMIN-002 | Audit High-Risk Actions — Publish/unpublish, rights edits, manual entitlements, refunds, reward adjustments, campaign activation and sensitive data access shall be audited. | P0 | M1 | QA-ADMIN-002 |
| AZP-ADMIN-003 | Feature Flags — Major features/universes shall support remote on/off/cohort/territory/platform control and emergency disable where designed. | P0 | M1 | QA-ADMIN-003 |
| AZP-ADMIN-004 | Dual-Control Candidate Actions — Technical Authority shall identify high-risk actions requiring secondary approval or workflow control. | P1 | M2 | QA-ADMIN-004 |

## 37. RBAC Permission Matrix

| **ACTION** | **Support** | **Content Ops** | **Rights** | **Commercial** | **Finance** | **Platform Admin** |
|----|----|----|----|----|----|----|
| View basic user/support context | YES | NO | NO | NO | LIMITED | YES |
| View transaction | LIMITED | NO | NO | NO | YES | YES |
| Issue/approve refund | REQUEST | NO | NO | NO | YES | CONTROLLED |
| Grant manual entitlement | REQUEST | NO | NO | NO | CONTROLLED | CONTROLLED |
| Publish/unpublish content | NO | YES | NO | NO | NO | YES |
| Edit rights window/territory | NO | NO | YES | NO | NO | CONTROLLED |
| Edit AOU canon/knowledge mapping | NO | AUTHORISED AOU ONLY | VIEW | NO | NO | CONTROLLED |
| Create sponsor campaign | NO | NO | NO | YES | NO | CONTROLLED |
| Adjust reward balance | REQUEST | NO | NO | NO | CONTROLLED | CONTROLLED |
| Manage feature flags | NO | NO | NO | NO | NO | YES |
| View audit log | LIMITED | LIMITED | LIMITED | LIMITED | LIMITED | YES |
| Access sensitive raw user data | NO | NO | NO | NO | LIMITED | STRICTLY CONTROLLED |

YES/NO values are policy defaults. “CONTROLLED” indicates a restricted permission or workflow potentially requiring secondary approval. The Technical/Security Authority shall implement finer-grained scopes.

## 38. Support Categories

- Login/account

- Playback

- Content unavailable

- Payment

- Premium access

- Refund

- Rewards

- Storyworld

- Participation

- Privacy

- Technical problem

# PART XI — EPICS, RACI, DELIVERY, QA & RELEASE GATES

| **EPIC** | **NAME** | **PRIMARY OWNER** | **SCOPE** |
|----|----|----|----|
| E01 | Identity & Onboarding | Core Platform Squad | Authentication, guest state, registration, profile, consent. |
| E02 | Media & Playback | Media & Content Squad | Vertical, long-form, progress, adaptive streaming, captions, Data Saver. |
| E03 | Content & CMS | Media & Content Squad | CMS, ACDP, release, rights, content lifecycle. |
| E04 | Storyworld & Knowledge | Engagement Squad + AOU Canon | Storyworld, Canonical Knowledge Graph, equivalence, unlock. |
| E05 | Participation | Engagement Squad | Polls, quizzes, non-cash predictions, missions foundation. |
| E06 | Rewards | Engagement Squad | Points, missions, badges, streaks, redemption. |
| E07 | Commerce & Entitlements | Commerce Squad | Payments, transaction ledger, entitlements, reconciliation, refunds. |
| E08 | Home & Discovery | Core/Product Growth | Home, Explore, Search, continue watching, cross-content CTAs. |
| E09 | Notifications | Engagement / Platform | Notification service, preferences, campaigns, analytics. |
| E10 | Analytics & Experimentation | Data & Growth | Event taxonomy, funnels, identity stitching, experiments. |
| E11 | Admin & Operations | Core Platform / Operations | RBAC, support, sponsor config, audit, feature flags. |
| E12 | Security, SRE & Release | Platform/SRE | CI/CD, monitoring, backup, incident, performance, release. |

## 39. Epic RACI & Dependency Matrix

| **EPIC** | **A — ACCOUNTABLE** | **R — RESPONSIBLE** | **C — CONSULTED** | **I — INFORMED** | **BLOCKING DEPENDENCIES** |
|----|----|----|----|----|----|
| E01 | Product Lead | Core Eng | Design, Security, Legal | All squads | None |
| E02 | Product Lead | Media Eng | SRE, Content Ops, Data | Support | E01, E03 |
| E03 | Product Lead | Media/CMS Eng | VCF, Rights, AOU Canon | Commercial | E01 |
| E04 | Product Lead + AOU Canon Authority | Engagement Eng | VCF, Media, Data | Support | E01, E02, E03 |
| E05 | Product Lead | Engagement Eng | AOU Canon, Commercial, Legal | Data | E01, E03 |
| E06 | Product Lead | Engagement Eng | Finance, Commercial, Trust | Support | E01, E05 |
| E07 | Product Lead + Finance | Commerce Eng | Legal, Security, Support, Store/PSP specialists | Commercial | E01, E03 |
| E08 | Product Lead | Core/Growth Eng | Media, Data, Design | Commercial | E01, E02, E03 |
| E09 | Product Lead | Platform/Engagement | Data, Support, Legal | Commercial | E01 |
| E10 | Product Lead + Data Lead | Data Eng/Analytics | All squads | Board/Finance | E01–E09 |
| E11 | Operations Lead + Product | Core Platform | Finance, Rights, Commercial, Security | All operators | E01, E03, E07 |
| E12 | Engineering Lead | SRE/Security | All engineering squads | Management | All critical services |

## 40. Definition of Ready

- Problem/user statement

- Durable requirement ID

- Release and priority

- Design/flow or explicit non-UI behaviour

- Acceptance criteria / test ID

- Analytics requirement

- Dependencies

- Owner

- Error/empty/restricted states

- Security/privacy/commercial review where applicable

## 41. Definition of Done

- Code and review complete

- QA acceptance passed

- Analytics verified

- Accessibility checked

- Permissions/RBAC verified

- Monitoring/alerting implemented where material

- Support documentation complete

- Configuration/feature flag available where required

- Rollback/recovery defined

- Acceptance owner approves

## 42. Test Strategy

- Unit

- Integration

- API/contract

- UI/end-to-end

- Device

- Network

- Playback/media

- Payment

- Entitlement/reconciliation

- Rights/territory

- Storyworld/knowledge

- Analytics

- Accessibility

- Security

- Performance/load

- Regression

- UAT

## 43. Release Acceptance

| **RELEASE** | **MANDATORY EXIT** |
|----|----|
| M0 | Prototype tested; experience understandable; major IA issues resolved; AOU-G0A/G0B already passed or remediation path accepted. |
| M1 | Registration, playback, progress, Storyworld, participation-lite, analytics, rights and support escalation operate; no unresolved SEV-1; AOU-G1/G2 evidence can be generated. |
| M2 | Payments, entitlements, reconciliation, refund workflow, rewards/sponsor where released, security review, monitoring, launch content, support and commercial ops ready. |
| M3 | Scope selected from M2 evidence; features have explicit value hypothesis and experiment/acceptance plan. |

## 44. Founding Launch Command

| **DOMAIN**  | **REQUIRED STATE** |
|-------------|--------------------|
| Content     | GREEN              |
| Product     | GREEN              |
| Engineering | GREEN              |
| QA          | GREEN              |
| SRE         | GREEN              |
| Security    | GREEN              |
| Payments    | GREEN              |
| Rights      | GREEN              |
| Operations  | GREEN              |
| Support     | GREEN              |
| Analytics   | GREEN              |
| Commercial  | GREEN              |

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>LAUNCH BLOCK</strong></p>
<p>Any critical RED blocks public launch. No single stakeholder may unilaterally waive a mandatory cross-functional gate.</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

# PART XII — TRACEABILITY, BUSINESS RULES, STATE CONTROL & ASSUMPTION GOVERNANCE

## 45. Requirements Traceability Rule

Every durable functional/non-functional requirement shall trace upward to a Product Law / parent authority or MVP hypothesis and downward to release, epic, screen/service, analytics event where applicable, acceptance test and gate/KPI where applicable. Backlog items that cannot trace to an approved requirement require challenge before implementation.

## 46. Business Rules Catalogue

| **RULE ID** | **BUSINESS RULE** |
|----|----|
| BR-AUTH-001 | Persistent watch/knowledge/reward state belongs to authenticated identity, not guest session. |
| BR-AUTH-002 | Guest-to-registered transition must preserve eligible current-session context where technically safe. |
| BR-MEDIA-001 | Playback availability requires publish + rights + territory + age/access state; premium entitlement alone is insufficient. |
| BR-MEDIA-002 | Optional service outage must not block permitted core playback unless dependency is security/rights critical. |
| BR-KNOW-001 | Knowledge is granted by configured canonical-event/knowledge rules, not by simple file existence. |
| BR-KNOW-002 | Starting an episode does not automatically grant its completion knowledge set. |
| BR-KNOW-003 | Vertical and long-form may grant equivalent Knowledge Units through different content routes. |
| BR-KNOW-004 | Knowledge grants are idempotent. |
| BR-KNOW-005 | Locked future knowledge must not leak through API or search indexing. |
| BR-PART-001 | Each participation object explicitly defines submission and result policy. |
| BR-PART-002 | Founding predictions cannot create cash stake or cash-equivalent wager. |
| BR-RWD-001 | Points are loyalty records, not money. |
| BR-RWD-002 | Reward earning and redemption are idempotent for a defined qualifying action. |
| BR-COM-001 | A successful purchase creates exactly the intended entitlement once. |
| BR-COM-002 | An already entitled user cannot unknowingly repurchase identical overlapping access. |
| BR-COM-003 | Sponsor-funded access never silently becomes paid recurring access. |
| BR-COM-004 | Rights expiry overrides active entitlement when VMNL lacks continuing distribution authority. |
| BR-COM-005 | Refund/entitlement outcome follows the SKU rule and is audit-traceable. |
| BR-CMS-001 | No valid ACDP means no production publication eligibility. |
| BR-RIGHTS-001 | Rights-complete status is required for public distribution. |
| BR-SPON-001 | Sponsor cannot alter AOU canon, merit outcome, factual truth or access unauthorised personal data. |
| BR-ADMIN-001 | No shared admin credentials. |
| BR-ADMIN-002 | High-risk administrative actions are audited. |
| BR-AN-001 | No KPI may rely on undocumented telemetry. |
| BR-REL-001 | Time/date pressure does not override failed mandatory gate. |

## 47. Screen-State Control Matrix — Critical Screens

| **SCREEN** | **MANDATORY STATES** |
|----|----|
| Home | First-time; returning; loading; partial rails; offline/degraded; error; no recommendations. |
| Explore | Loading; no result; universe hidden; restricted territory; error. |
| Search | Default; typing; results; zero-result; restricted result; offline; error. |
| Vertical Player | Loading; play; pause; buffer; complete; network loss; auth required; rights unavailable; error. |
| Vertical End State | Next available; next unreleased; Storyworld CTA; Participate CTA; all caught up. |
| Title Detail | Free; premium; entitled; expired entitlement; territory unavailable; upcoming; removed. |
| Long-Form Player | Loading; resume; captions; network loss; premium locked; rights expired; session expired; error. |
| AOU Hub | New user; partial knowledge; mature knowledge; locked object; empty module; service degraded. |
| Character Detail | Known; teased; locked; unavailable; deep-linked locked. |
| Timeline | Partial knowledge; no events; locked future; degraded service. |
| Participate | Open; closed; already submitted; ineligible; knowledge-locked; result pending; result published. |
| Rewards | No points; active mission; earned; redemption; expired/revoked; service degraded. |
| Purchase | Price; already entitled; pending; provider handoff; success; failed; cancelled; unknown/reconciling. |
| Profile | Guest prompt; registered; no history; purchase history; support entry; privacy controls. |
| Support | New case; lookup success; permission denied; transaction unknown; escalated. |

## 48. Controlled TBD / Assumption Register

| **TBD** | **DECISION** | **OWNER** | **RESOLVE BY** | **BLOCKS** | **STATUS** |
|----|----|----|----|----|----|
| TBD-001 | Final payment provider(s) / app-store route | Commerce Lead + Finance | Before M2 implementation lock | Checkout adapter / store compliance | OPEN |
| TBD-002 | Vertical release cadence | Product + VCF | M1 controlled test | Launch calendar | OPEN |
| TBD-003 | M2 premium pricing | Commercial + Finance + Product | Before M2 SKU lock | Purchase flow / economics | OPEN |
| TBD-004 | Final P95 playback SLO after device/network benchmark | Media Lead | Before M2 performance gate | Launch acceptance | OPEN |
| TBD-005 | Registration trigger | Growth/Product | M0/M1 | Onboarding conversion | OPEN |
| TBD-006 | Exact Knowledge Units/event mapping for Omíṣẹwà | AOU Canon Authority | Before M1 content lock | Storyworld spoiler safety | OPEN |
| TBD-007 | Reward partner catalogue | Commercial | Before relevant M2 campaign | Reward redemption | OPEN |
| TBD-008 | Final age/ratings implementation by territory | Legal/Rights/Product | Before M2 launch | Content access | OPEN |
| TBD-009 | Final consumer concurrency/account-sharing policy | Product + Security + Commercial | Before M2 premium lock | Premium entitlement | OPEN |
| TBD-010 | RTO/RPO final values after architecture design | Engineering/SRE | Before M2 SRE gate | Disaster recovery | OPEN |

# APPENDIX A — FULL REQUIREMENT REGISTER & TRACEABILITY MATRIX

This appendix is the authoritative R2 requirement traceability register. Requirement statements in the body and this matrix share the same durable IDs. Any lower-order backlog/test implementation must preserve traceability to these IDs.

| **REQ ID** | **PARENT** | **REL** | **EPIC** | **SCREEN / SERVICE** | **EVENT** | **ACCEPTANCE TEST** | **GATE** |
|----|----|----|----|----|----|----|----|
| AZP-AUTH-001 | Law 01/15 / H3 | M1 | E01 Identity | Guest Entry | app_open | QA-AUTH-001 | AOU-G1 |
| AZP-AUTH-002 | Law 01/15 / H3 | M1 | E01 Identity | Registration | registration_complete | QA-AUTH-002 | AOU-G1 |
| AZP-AUTH-003 | Law 01/15 / H3 | M1 | E01 Identity | All | session_resume | QA-AUTH-003 | — |
| AZP-AUTH-004 | Law 01/15 / H3 | M1 | E01 Identity | Profile | logout | QA-AUTH-004 | — |
| AZP-AUTH-005 | Law 01/15 / H3 | M1 | E01 Identity | Account | credential_recovery | QA-AUTH-005 | — |
| AZP-AUTH-006 | Law 01/15 / H3 | M1 | E01 Identity | Onboarding | age_declared | QA-AUTH-006 | — |
| AZP-AUTH-007 | Law 01/15 / H3 | M1 | E01 Identity | Onboarding | consent_recorded | QA-AUTH-007 | — |
| AZP-AUTH-008 | Law 01/15 / H3 | M2 | E01 Identity | Onboarding/Profile | profile_field_added | QA-AUTH-008 | — |
| AZP-AUTH-009 | Law 01/15 / H3 | M1 | E01 Identity | Registration | auth_collision | QA-AUTH-009 | — |
| AZP-AUTH-010 | Law 01/15 / H3 | M1 | E01 Identity | Admin Login | admin_login | QA-AUTH-010 | — |
| AZP-HOME-001 | Law 01/15 / H3 | M1 | E08 Home & Discovery | Home | home_view | QA-HOME-001 | AOU-G2 |
| AZP-HOME-002 | Law 01/15 / H3 | M1 | E08 Home & Discovery | Home | continue_impression | QA-HOME-002 | AOU-G1 |
| AZP-HOME-003 | Law 01/15 / H3 | M1 | E08 Home & Discovery | Home | release_impression | QA-HOME-003 | — |
| AZP-HOME-004 | Law 01/15 / H3 | M2 | E08 Home & Discovery | Home | mission_impression | QA-HOME-004 | AOU-G2 |
| AZP-EXP-001 | Law 01/15 / H3 | M1 | E08 Home & Discovery | Explore | explore_view | QA-EXP-001 | — |
| AZP-EXP-002 | Law 01/15 / H3 | M1 | E08 Home & Discovery | Explore | universe_enter | QA-EXP-002 | — |
| AZP-SEARCH-001 | Law 01/15 / H3 | M1 | E08 Home & Discovery | Search | search | QA-SEARCH-001 | AOU-G2 |
| AZP-SEARCH-002 | Law 01/15 / H3 | M1 | E10 Analytics | Search | search_zero_result | QA-SEARCH-002 | — |
| AZP-SEARCH-003 | Law 01/15 / H3 | M1 | E08 Home & Discovery | Search | search_result_view | QA-SEARCH-003 | — |
| AZP-VERT-001 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Vertical Player | vertical_start | QA-VERT-001 | AOU-G1 |
| AZP-VERT-002 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Vertical End State | next_episode_start | QA-VERT-002 | AOU-G1 |
| AZP-VERT-003 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Vertical Player | vertical_progress | QA-VERT-003 | — |
| AZP-VERT-004 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Vertical Player | caption_toggle | QA-VERT-004 | — |
| AZP-VERT-005 | H1-H2 / Law 08 | M1 | E08 Home & Discovery | Vertical Player | share | QA-VERT-005 | AOU-G1 |
| AZP-VERT-006 | H1-H2 / Law 08 | M1 | E03 Content & CMS | Release Scheduler | release_schedule_change | QA-VERT-006 | — |
| AZP-VERT-007 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Vertical End State | vertical_end_cta | QA-VERT-007 | AOU-G2 |
| AZP-MEDIA-001 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Players | playback_start | QA-MEDIA-001 | — |
| AZP-MEDIA-002 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Players | resume_start | QA-MEDIA-002 | — |
| AZP-MEDIA-003 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Settings/Player | data_saver_change | QA-MEDIA-003 | — |
| AZP-MEDIA-004 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Players | media_token_issue | QA-MEDIA-004 | — |
| AZP-MEDIA-005 | H1-H2 / Law 08 | M1 | E10 Analytics | Players | vertical_start / series_start | QA-MEDIA-005 | — |
| AZP-MEDIA-006 | H1-H2 / Law 08 | M1 | E12 SRE | Players | degraded_dependency | QA-MEDIA-006 | — |
| AZP-MS-001 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Title Detail | title_view | QA-MS-001 | AOU-G1 |
| AZP-MS-002 | H1-H2 / Law 08 | M1 | E02 Media & Playback | Long-Form Player | series_start | QA-MS-002 | AOU-G1 |
| AZP-MS-003 | H1-H2 / Law 08 | M2 | E07 Commerce | Premium Locked / Player | entitlement_check | QA-MS-003 | AOU-G3 |
| AZP-MS-004 | H1-H2 / Law 08 | M1 | E03 Content & CMS | Content Unavailable | rights_denied | QA-MS-004 | — |
| AZP-MS-005 | H1-H2 / Law 08 | M2 | E08 Home & Discovery | Long-Form End State | series_end_cta | QA-MS-005 | AOU-G2 |
| AZP-STORY-001 | Law 14 / H3-H4 | M1 | E04 Storyworld | AOU Hub | storyworld_open | QA-STORY-001 | AOU-G2 |
| AZP-STORY-002 | Law 14 / H3-H4 | M1 | E04 Storyworld | Character Detail | character_view | QA-STORY-002 | AOU-G2 |
| AZP-STORY-003 | Law 14 / H3-H4 | M1 | E04 Storyworld | Relationship View | relationship_view | QA-STORY-003 | AOU-G2 |
| AZP-STORY-004 | Law 14 / H3-H4 | M1 | E04 Storyworld | Timeline | timeline_view | QA-STORY-004 | AOU-G2 |
| AZP-STORY-005 | Law 14 / H3-H4 | M1 | E04 Storyworld | What You Know | knowledge_summary_view | QA-STORY-005 | AOU-G2 |
| AZP-STORY-006 | Law 14 / H3-H4 | M1 | E04 Storyworld | Unlock | unlock_view | QA-STORY-006 | AOU-G2 |
| AZP-STORY-007 | Law 14 / H3-H4 | M1 | E04 Storyworld | Locked Storyworld | locked_object_view | QA-STORY-007 | — |
| AZP-STORY-008 | Law 14 / H3-H4 | M1 | E04 Storyworld | Storyworld API | knowledge_denied | QA-STORY-008 | — |
| AZP-KNOW-001 | Law 14 / H3-H4 | M1 | E04 Storyworld | Admin Story Mapping | canon_event_map | QA-KNOW-001 | AOU-G2 |
| AZP-KNOW-002 | Law 14 / H3-H4 | M1 | E04 Storyworld | Knowledge Admin | knowledge_unit_create | QA-KNOW-002 | — |
| AZP-KNOW-003 | Law 14 / H3-H4 | M1 | E04 Storyworld | Storyworld | knowledge_state_update | QA-KNOW-003 | AOU-G2 |
| AZP-KNOW-004 | Law 14 / H3-H4 | M1 | E04 Storyworld | Knowledge Admin | knowledge_unlock_rule | QA-KNOW-004 | — |
| AZP-KNOW-005 | Law 14 / H3-H4 | M1 | E04 Storyworld | Story Mapping Admin | format_equivalence_map | QA-KNOW-005 | AOU-G1 |
| AZP-KNOW-006 | Law 14 / H3-H4 | M1 | E04 Storyworld | Players/Storyworld | knowledge_unlock | QA-KNOW-006 | — |
| AZP-KNOW-007 | Law 14 / H3-H4 | M2 | E04 Storyworld | Players | knowledge_checkpoint | QA-KNOW-007 | — |
| AZP-KNOW-008 | Law 14 / H3-H4 | M2 | E04 Storyworld | Long-Form Player | knowledge_skip_eval | QA-KNOW-008 | — |
| AZP-KNOW-009 | Law 14 / H3-H4 | M1 | E04 Storyworld | Players | knowledge_state_update | QA-KNOW-009 | — |
| AZP-KNOW-010 | Law 14 / H3-H4 | M1 | E04 Storyworld | Admin | knowledge_namespace | QA-KNOW-010 | AOU-G4 |
| AZP-KNOW-011 | Law 14 / H3-H4 | M2 | E11 Admin | Knowledge Support | knowledge_admin_adjust | QA-KNOW-011 | — |
| AZP-KNOW-012 | Law 14 / H3-H4 | M2 | E10 Analytics | Analytics | knowledge_route | QA-KNOW-012 | AOU-G1 |
| AZP-PART-001 | Law 14 / H3-H4 | M1 | E05 Participation | Participate | participation_view | QA-PART-001 | AOU-G2 |
| AZP-PART-002 | Law 14 / H3-H4 | M1 | E05 Participation | Participate | participation_submit | QA-PART-002 | — |
| AZP-PART-003 | Law 14 / H3-H4 | M1 | E05 Participation | Poll/Quiz | participation_window | QA-PART-003 | — |
| AZP-PART-004 | Law 14 / H3-H4 | M1 | E05 Participation | Poll/Quiz | participation_submit | QA-PART-004 | — |
| AZP-PART-005 | Law 14 / H3-H4 | M1 | E05 Participation | Poll/Quiz | participation_result | QA-PART-005 | — |
| AZP-PART-006 | Law 14 / H3-H4 | M1 | E05 Participation | Participate | participation_denied_knowledge | QA-PART-006 | — |
| AZP-PART-007 | Law 14 / H3-H4 | M2 | E05 Participation | Participate | sponsor_participation_view | QA-PART-007 | — |
| AZP-PART-008 | Law 14 / H3-H4 | M2 | E05 Participation | Participate | participation_audit | QA-PART-008 | — |
| AZP-PART-009 | Law 14 / H3-H4 | M1 | E05 Participation | Prediction | prediction_submit | QA-PART-009 | — |
| AZP-RWD-001 | Law 07 / H5 | M2 | E06 Rewards | Rewards | reward_earned | QA-RWD-001 | AOU-G2 |
| AZP-RWD-002 | Law 07 / H5 | M2 | E06 Rewards | Rewards | points_view | QA-RWD-002 | — |
| AZP-RWD-003 | Law 07 / H5 | M2 | E11 Admin | Rewards Admin | points_admin_adjust | QA-RWD-003 | — |
| AZP-RWD-004 | Law 07 / H5 | M2 | E06 Rewards | Mission | mission_start | QA-RWD-004 | — |
| AZP-RWD-005 | Law 07 / H5 | M2 | E06 Rewards | Rewards | streak_update | QA-RWD-005 | — |
| AZP-RWD-006 | Law 07 / H5 | M2 | E06 Rewards | Redemption | reward_redeemed | QA-RWD-006 | — |
| AZP-RWD-007 | Law 07 / H5 | M2 | E06 Rewards | Rewards | sponsor_reward_redeemed | QA-RWD-007 | — |
| AZP-RWD-008 | Law 07 / H5 | M2 | E06 Rewards | Rewards | reward_abuse_signal | QA-RWD-008 | — |
| AZP-COM-001 | Law 07 / H5 | M2 | E07 Commerce | Purchase | purchase_start | QA-COM-001 | AOU-G3 |
| AZP-COM-002 | Law 07 / H5 | M2 | E07 Commerce | Payment Result | purchase_status | QA-COM-002 | — |
| AZP-COM-003 | Law 07 / H5 | M2 | E07 Commerce | Purchase | purchase_retry | QA-COM-003 | — |
| AZP-COM-004 | Law 07 / H5 | M2 | E07 Commerce | Payment Success | entitlement_granted | QA-COM-004 | AOU-G3 |
| AZP-COM-005 | Law 07 / H5 | M2 | E07 Commerce | Premium Product | purchase_blocked_entitled | QA-COM-005 | — |
| AZP-COM-006 | Law 07 / H5 | M2 | E07 Commerce | Premium Player | rights_denied | QA-COM-006 | — |
| AZP-COM-007 | Law 07 / H5 | M2 | E07 Commerce | Premium Product | sponsor_entitlement | QA-COM-007 | — |
| AZP-COM-008 | Law 07 / H5 | M2 | E07 Commerce | Purchase History | purchase_history_view | QA-COM-008 | — |
| AZP-COM-009 | Law 07 / H5 | M2 | E07 Commerce | Refund Admin | refund_processed | QA-COM-009 | — |
| AZP-COM-010 | Law 07 / H5 | M2 | E07 Commerce | Reconciliation Admin | reconciliation_run | QA-COM-010 | — |
| AZP-COM-011 | Law 07 / H5 | M2 | E07 Commerce | Purchase | price_view | QA-COM-011 | — |
| AZP-COM-012 | Law 07 / H5 | M2 | E10 Analytics | Purchase | purchase_success | QA-COM-012 | AOU-G3 |
| AZP-CMS-001 | Law 13 | M1 | E03 Content & CMS | Admin CMS | content_create | QA-CMS-001 | — |
| AZP-CMS-002 | Law 13 | M1 | E03 Content & CMS | Admin CMS | content_state_change | QA-CMS-002 | — |
| AZP-CMS-003 | Law 13 | M1 | E03 Content & CMS | Release Scheduler | release_schedule_change | QA-CMS-003 | — |
| AZP-CMS-004 | Law 13 | M1 | E03 Content & CMS | ACDP Validation | acdp_validation | QA-CMS-004 | — |
| AZP-CMS-005 | Law 13 | M1 | E03 Content & CMS | Admin CMS | content_version | QA-CMS-005 | — |
| AZP-RIGHTS-001 | Law 13 | M1 | E03 Content & CMS | Rights Admin | rights_record_update | QA-RIGHTS-001 | — |
| AZP-RIGHTS-002 | Law 13 | M1 | E03 Content & CMS | Player/Search | rights_denied | QA-RIGHTS-002 | — |
| AZP-RIGHTS-003 | Law 13 | M1 | E03 Content & CMS | Rights Admin | talent_clearance_update | QA-RIGHTS-003 | — |
| AZP-RIGHTS-004 | Law 13 | M1 | E03 Content & CMS | Rights Admin | music_clearance_update | QA-RIGHTS-004 | — |
| AZP-RIGHTS-005 | Law 13 | M1 | E03 Content & CMS | ACDP | provenance_linked | QA-RIGHTS-005 | — |
| AZP-SPON-001 | Law 01/15 / H3 | M2 | E11 Admin | Sponsor Admin | campaign_create | QA-SPON-001 | AOU-G3 |
| AZP-SPON-002 | Law 01/15 / H3 | M2 | E11 Admin | Sponsor Admin | campaign_publish | QA-SPON-002 | — |
| AZP-SPON-003 | Law 01/15 / H3 | M2 | E11 Admin | Sponsor Admin | campaign_impression | QA-SPON-003 | — |
| AZP-SPON-004 | Law 01/15 / H3 | M2 | E10 Analytics | Analytics | campaign_report | QA-SPON-004 | AOU-G3 |
| AZP-AN-001 | Law 08 / H1-H5 | M1 | E10 Analytics | All | analytics_event | QA-AN-001 | — |
| AZP-AN-002 | Law 08 / H1-H5 | M1 | E10 Analytics | All | identity_link | QA-AN-002 | — |
| AZP-AN-003 | Law 08 / H1-H5 | M1 | E10 Analytics | All | content_event | QA-AN-003 | — |
| AZP-AN-004 | Law 08 / H1-H5 | M2 | E10 Analytics | Deep Link | deep_link_open | QA-AN-004 | AOU-G3 |
| AZP-AN-005 | Law 08 / H1-H5 | M1 | E10 Analytics | Analytics | event_qa | QA-AN-005 | — |
| AZP-AN-006 | Law 08 / H1-H5 | M2 | E10 Analytics | Analytics | wep_calculated | QA-AN-006 | AOU-G3 |
| AZP-AN-007 | Law 08 / H1-H5 | M2 | E10 Analytics | Analytics | contribution_wep | QA-AN-007 | AOU-G3 |
| AZP-AN-008 | Law 08 / H1-H5 | M2 | E10 Analytics | Analytics | knowledge_route | QA-AN-008 | AOU-G1 |
| AZP-AN-009 | Law 08 / H1-H5 | M2 | E10 Analytics | Analytics | feature_value_review | QA-AN-009 | AOU-G2 |
| AZP-NFR-001 | Law 17 | M2 | E12 SRE | Platform | availability_slo | QA-NFR-001 | — |
| AZP-NFR-002 | Law 17 | M2 | E12 SRE | App | crash_free | QA-NFR-002 | — |
| AZP-NFR-003 | Law 17 | M2 | E07 Commerce | Commerce | reconciliation_accuracy | QA-NFR-003 | — |
| AZP-NFR-004 | Law 17 | M2 | E12 SRE | Platform | api_latency | QA-NFR-004 | — |
| AZP-NFR-005 | Law 17 | M2 | E02 Media | Players | playback_startup | QA-NFR-005 | — |
| AZP-NFR-006 | Law 17 | M2 | E02 Media | Players | rebuffer_ratio | QA-NFR-006 | — |
| AZP-NFR-007 | Law 17 | M2 | E07 Commerce | Purchase | entitlement_latency | QA-NFR-007 | — |
| AZP-NFR-008 | Law 17 | M2 | E12 SRE | Platform | recovery_test | QA-NFR-008 | — |
| AZP-NFR-009 | Law 17 | M1 | E12 SRE | Platform | observability_check | QA-NFR-009 | — |
| AZP-NFR-010 | Law 17 | M1 | E12 SRE | App | degraded_mode | QA-NFR-010 | — |
| AZP-SUP-001 | Law 17 | M2 | E11 Admin | Support | support_request | QA-SUP-001 | — |
| AZP-SUP-002 | Law 17 | M2 | E11 Admin | Support | rbac_denied | QA-SUP-002 | — |
| AZP-ADMIN-001 | Law 17 | M1 | E11 Admin | Admin Login | admin_login | QA-ADMIN-001 | — |
| AZP-ADMIN-002 | Law 17 | M1 | E11 Admin | Admin | admin_audit | QA-ADMIN-002 | — |
| AZP-ADMIN-003 | Law 17 | M1 | E11 Admin | Feature Flags | feature_flag_change | QA-ADMIN-003 | — |
| AZP-ADMIN-004 | Law 17 | M2 | E11 Admin | Admin | dual_control | QA-ADMIN-004 | — |
| SEC-001 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-001 | — |
| SEC-002 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-002 | — |
| SEC-003 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-003 | — |
| SEC-004 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-004 | — |
| SEC-005 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-005 | — |
| SEC-006 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-006 | — |
| SEC-007 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-007 | — |
| SEC-008 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-008 | — |
| SEC-009 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-009 | — |
| SEC-010 | Law 17 | M1/M2 | E12 Security, SRE & Release | Platform/Admin | security_control | QA-SEC-010 | — |

# APPENDIX B — REQUIREMENT STATEMENT REGISTER

| **REQ ID** | **P** | **REL** | **OWNER** | **TITLE** | **REQUIREMENT STATEMENT** |
|----|----|----|----|----|----|
| AZP-AUTH-001 | P0 | M1 | Core Platform | Guest Session | System shall create a non-privileged guest session that permits approved public discovery without persistent entitlement or reward state. |
| AZP-AUTH-002 | P0 | M1 | Core Platform | Account Creation | User shall create a unique account using approved authentication methods and recorded consent. |
| AZP-AUTH-003 | P0 | M1 | Core Platform | Session Persistence | Authenticated sessions shall persist securely across normal app restarts subject to security policy. |
| AZP-AUTH-004 | P0 | M1 | Core Platform | Logout | User shall be able to terminate the local authenticated session. |
| AZP-AUTH-005 | P0 | M1 | Core Platform | Credential Recovery | Credential-based accounts shall support secure recovery. |
| AZP-AUTH-006 | P0 | M1 | Core Platform | Age Declaration | Onboarding shall capture age declaration required by approved product policy. |
| AZP-AUTH-007 | P0 | M1 | Core Platform | Consent Record | System shall record current terms/privacy consent version and timestamp. |
| AZP-AUTH-008 | P1 | M2 | Product | Progressive Profiling | Non-essential profile data shall be requested only when a clear feature requires it. |
| AZP-AUTH-009 | P0 | M1 | Core Platform | Account Collision Handling | Duplicate or colliding credentials shall resolve through approved account-recovery/merge policy rather than silently creating uncontrolled duplicates. |
| AZP-AUTH-010 | P0 | M1 | Platform/Security | Role Separation | Consumer identity shall remain distinct from administrative RBAC roles. |
| AZP-HOME-001 | P0 | M1 | Core/Product | Configurable Home | Home rails and hero modules shall be remotely configurable without binary release. |
| AZP-HOME-002 | P0 | M1 | Core/Product | Continue Watching | Authenticated users with incomplete eligible content shall receive Continue Watching. |
| AZP-HOME-003 | P0 | M1 | Product Ops | Release Module | Home shall support scheduled promotion of current vertical/premium release. |
| AZP-HOME-004 | P1 | M2 | Engagement | Mission Module | When Rewards is enabled, Home may display active mission/progress without displacing critical content hierarchy. |
| AZP-EXP-001 | P0 | M1 | Product | Explore Categories | Explore shall expose only activated categories; founding categories are Vertical, Series and AOU. |
| AZP-EXP-002 | P0 | M1 | Platform/Product | Universe Visibility Flag | Future universe surfaces shall remain hidden until activation flags and readiness approval are satisfied. |
| AZP-SEARCH-001 | P0 | M1 | Media/Product | Founding Search | Search shall support title, episode, character, place and artefact queries. |
| AZP-SEARCH-002 | P0 | M1 | Data & Growth | Zero Result Telemetry | Zero-result queries shall be recorded with query metadata subject to privacy controls. |
| AZP-SEARCH-003 | P0 | M1 | Media/Rights | Availability-Aware Results | Search results shall respect publish state, territory, rights and age/access rules. |
| AZP-VERT-001 | P0 | M1 | Media | Native 9:16 Playback | Vertical shall provide portrait-native playback for approved 9:16 media. |
| AZP-VERT-002 | P0 | M1 | Media/Product | Sequential Continuation | Vertical shall present the next authorised episode according to configured release and rights state. |
| AZP-VERT-003 | P0 | M1 | Media | Progress Persistence | Authenticated vertical watch progress shall persist across normal sessions. |
| AZP-VERT-004 | P0 | M1 | Media | Captions | Vertical playback shall support captions/subtitles where delivered. |
| AZP-VERT-005 | P0 | M1 | Growth/Media | Deep-Link Sharing | Approved share actions shall create rights-aware deep links and campaign attribution where supported. |
| AZP-VERT-006 | P0 | M1 | Content Ops | Release Cadence Configuration | Vertical release may be daily, multi-daily, burst or chapter-based without code change. |
| AZP-VERT-007 | P0 | M1 | Product | End-State CTA | Vertical completion state shall support configurable CTA to next episode, series, Storyworld or Participate. |
| AZP-MEDIA-001 | P0 | M1 | Media/SRE | Adaptive Streaming | Video delivery shall use adaptive bitrate/rendition selection appropriate to network and device. |
| AZP-MEDIA-002 | P0 | M1 | Media | Resume | Long-form and vertical content shall support resume for authenticated users. |
| AZP-MEDIA-003 | P0 | M1 | Media/Product | Data Saver | User shall be able to select a lower-data playback mode that persists. |
| AZP-MEDIA-004 | P0 | M1 | Media/Security | Secure Delivery | Media URLs/tokens shall be issued in a rights-aware manner that does not expose unrestricted permanent source URLs. |
| AZP-MEDIA-005 | P0 | M1 | Media/Data | Playback Telemetry | Player shall emit defined start/progress/complete/error/buffer events. |
| AZP-MEDIA-006 | P0 | M1 | Platform/SRE | Graceful Degradation | Failure of optional Storyworld/Rewards/Analytics services shall not unnecessarily block permitted playback. |
| AZP-MS-001 | P0 | M1 | Media/Product | Title Detail | Movies & Series shall provide title artwork, synopsis, episode rail and watch/resume state. |
| AZP-MS-002 | P0 | M1 | Media | Long-Form Player | Long-form player shall support adaptive playback, seeking where permitted, captions, subtitles and full-screen. |
| AZP-MS-003 | P0 | M2 | Commerce/Media | Entitlement Check | Premium playback shall require active entitlement when configured. |
| AZP-MS-004 | P0 | M1 | Rights/Media | Rights Override | Expired/blocked territorial rights shall override a user entitlement. |
| AZP-MS-005 | P1 | M2 | Product | Post-Play State | Long-form completion shall offer configurable next episode, vertical, Storyworld or Participate CTA. |
| AZP-STORY-001 | P0 | M1 | Engagement | AOU Hub | AOU Hub shall present configurable modules for title, episode, characters, timeline, places, artefacts, What You Know and unlocks. |
| AZP-STORY-002 | P0 | M1 | Engagement/AOU | Character Page | Character page shall display only knowledge-authorised description, relationships, episodes and unlocked facts. |
| AZP-STORY-003 | P0 | M1 | Engagement/AOU | Relationship View | Relationship view shall support typed/directional links with spoiler-safe visibility. |
| AZP-STORY-004 | P0 | M1 | Engagement/AOU | Timeline | Timeline shall render according to Knowledge State and not expose unauthorised future events. |
| AZP-STORY-005 | P0 | M1 | Engagement/AOU | What You Know | System shall generate/display a spoiler-controlled summary derived from authorised Knowledge Units. |
| AZP-STORY-006 | P0 | M1 | Engagement/AOU | Progressive Unlock | Configured completion or canonical event rules may unlock characters, facts, artefacts, locations or participation. |
| AZP-STORY-007 | P0 | M1 | Engagement/AOU | Locked Deep Link | Direct deep link to locked Storyworld object shall resolve to a spoiler-safe locked/teased state rather than leak full data. |
| AZP-STORY-008 | P0 | M1 | Platform/AOU | API Spoiler Safety | Unauthorised future Knowledge Units shall not be exposed in API responses merely because UI hides them. |
| AZP-KNOW-001 | P0 | M1 | AOU Canon/Product | Canonical Event Graph | AOU content shall map to canonical events independent of distribution format. |
| AZP-KNOW-002 | P0 | M1 | AOU Canon | Knowledge Unit Registry | Each audience-relevant canonical fact shall have a durable Knowledge Unit ID and spoiler level. |
| AZP-KNOW-003 | P0 | M1 | Engagement/Platform | User Knowledge State | Registered user shall possess derived Knowledge State representing authorised Knowledge Units. |
| AZP-KNOW-004 | P0 | M1 | AOU Canon/Product | Unlock Trigger Policy | Each Knowledge Unit shall specify approved unlock trigger(s) such as content completion, canonical event threshold or explicit campaign event. |
| AZP-KNOW-005 | P0 | M1 | AOU Canon/Product | Cross-Format Equivalence | Long-form and vertical content units shall map to canonical event/knowledge equivalence sets where they convey the same canonical information. |
| AZP-KNOW-006 | P0 | M1 | Product/AOU | No Automatic Full Unlock on Start | Merely starting a content unit shall not grant all Knowledge Units assigned to completion unless the specific rule says so. |
| AZP-KNOW-007 | P1 | M2 | Product/AOU | Partial Consumption | Knowledge rules may attach to completion thresholds or specific canonical checkpoints rather than only episode completion. |
| AZP-KNOW-008 | P1 | M2 | Media/AOU | Skip Protection | Seeking/jumping ahead shall not automatically grant skipped Knowledge Units unless content semantics and configured policy allow it. |
| AZP-KNOW-009 | P0 | M1 | Engagement | Rewatch Idempotency | Rewatching content shall not duplicate knowledge state or unlock rewards incorrectly. |
| AZP-KNOW-010 | P0 | M1 | AOU Canon/Platform | Cross-Title Namespace | Knowledge IDs and canonical events shall support later AOU titles without collision. |
| AZP-KNOW-011 | P1 | M2 | Support/Admin | Manual Remediation | Authorised operations may repair incorrect Knowledge State through audited remediation without rewriting canon. |
| AZP-KNOW-012 | P1 | M2 | Data/AOU | Knowledge Parity Analytics | System shall measure user route to Knowledge State (vertical, long-form, mixed) for cross-format analysis. |
| AZP-PART-001 | P0 | M1 | Engagement | Reusable Participation Object | Participation Engine shall support poll, quiz, prediction, reaction, mission and challenge as reusable types. |
| AZP-PART-002 | P0 | M1 | Engagement | Authentication for Persistent Submission | Persistent participation shall require authenticated identity. |
| AZP-PART-003 | P0 | M1 | Engagement | Participation Window | Each activity shall support configured start/end time and closed state. |
| AZP-PART-004 | P0 | M1 | Engagement | Submission Policy | Each activity shall define once/repeat/change-response policy. |
| AZP-PART-005 | P0 | M1 | Engagement | Result Policy | Activity shall define immediate, aggregate, delayed or non-public result. |
| AZP-PART-006 | P0 | M1 | Engagement/AOU | Knowledge-Aware Participation | Quizzes/polls that can spoil future content shall respect Knowledge State. |
| AZP-PART-007 | P1 | M2 | Commercial/Product | Sponsor Attachment | Approved activities may carry sponsor attribution without granting sponsor canon or outcome control. |
| AZP-PART-008 | P1 | M2 | Engagement/Operations | Audit Trail | High-value or reward-bearing participation shall retain sufficient submission history for dispute review. |
| AZP-PART-009 | P0 | M1 | Product/Legal | Non-Cash Prediction | Founding prediction mechanics shall use points/status/non-cash reward only. |
| AZP-RWD-001 | P0 | M2 | Engagement/Finance | Points Ledger | Every points change shall record user, amount, reason, source and timestamp. |
| AZP-RWD-002 | P0 | M2 | Product/Finance/Legal | No Cash Equivalence | Loyalty points shall not be represented as cash, deposit balance or guaranteed monetary value. |
| AZP-RWD-003 | P0 | M2 | Operations/Finance | Admin Adjustment Audit | Manual points adjustment shall require authorised role, reason and audit record. |
| AZP-RWD-004 | P0 | M2 | Engagement | Mission Object | Mission shall define objective, eligibility, time window, completion logic and reward. |
| AZP-RWD-005 | P1 | M2 | Engagement | Streak Rule | Streak logic shall be defined/configurable and idempotent. |
| AZP-RWD-006 | P0 | M2 | Engagement/Finance | Reward Redemption | Redemption shall verify eligibility, consume required reward value once and create immutable redemption record. |
| AZP-RWD-007 | P1 | M2 | Commercial/Finance | Sponsor-Funded Reward | Sponsor-funded reward shall be distinguished from VMNL-funded points/entitlements in ledger/reporting. |
| AZP-RWD-008 | P0 | M2 | Trust/Engagement | Reward Abuse Controls | Reward earning/redemption shall enforce rate/eligibility controls to limit automated farming and duplicate claims. |
| AZP-COM-001 | P0 | M2 | Commerce | Channel-Compliant Payment Adapter | Commerce layer shall support approved payment routes by platform/product/territory without hard-coding all logic to one provider. |
| AZP-COM-002 | P0 | M2 | Commerce/Finance | Transaction State | Every payment shall have a definitive state and UNKNOWN/PENDING states shall enter reconciliation. |
| AZP-COM-003 | P0 | M2 | Commerce | Idempotent Purchase | Retry/callback duplication shall not create duplicate charge requests or duplicate entitlements where idempotency can prevent it. |
| AZP-COM-004 | P0 | M2 | Commerce | Entitlement Grant | Confirmed successful purchase shall create intended entitlement once and only once. |
| AZP-COM-005 | P0 | M2 | Commerce/Product | Already Entitled Protection | User already holding an equivalent entitlement shall not unknowingly purchase an identical overlapping entitlement unless explicitly permitted and disclosed. |
| AZP-COM-006 | P0 | M2 | Commerce/Rights | Rights Override | Entitlement shall not override content rights expiry/territory block. |
| AZP-COM-007 | P0 | M2 | Commercial/Commerce | Sponsor-Funded Entitlement | Sponsor-funded access shall be represented separately from paid consumer transaction and shall not silently auto-renew into paid access. |
| AZP-COM-008 | P1 | M2 | Commerce | Purchase History | Registered user shall be able to view approved purchase/entitlement history. |
| AZP-COM-009 | P0 | M2 | Finance/Commerce | Refund Workflow | Authorised Finance/Support workflow shall link refund to transaction and entitlement state. |
| AZP-COM-010 | P0 | M2 | Finance/Commerce | Transaction Reconciliation | System shall support reconciliation of provider records, internal transaction ledger and entitlements. |
| AZP-COM-011 | P0 | M2 | Commerce/Product | Price Presentation | Before confirmation, user shall see approved price/currency and product scope. |
| AZP-COM-012 | P0 | M2 | Commerce/Data | Commercial Analytics | Purchase funnel shall emit start/success/failure/cancel/refund and entitlement events. |
| AZP-CMS-001 | P0 | M1 | Media/Content Ops | Content Entity Model | CMS shall support storyworld, title, season, episode, chapter, clip, media asset, artwork and Storyworld entities. |
| AZP-CMS-002 | P0 | M1 | Content Ops | Content Lifecycle | Content shall move through controlled Draft/Review/Approved/Scheduled/Published/Unpublished/Expired/Blocked/Archived states. |
| AZP-CMS-003 | P0 | M1 | Content Ops | Release Scheduler | Approved releases shall support scheduled publication/unpublication. |
| AZP-CMS-004 | P0 | M1 | Content Ops/VCF | ACDP Validation | Production CMS shall block publication eligibility when mandatory ACDP components are missing or invalid. |
| AZP-CMS-005 | P0 | M1 | Content Ops | Versioning | Published media/metadata shall retain version identity sufficient for audit and rollback. |
| AZP-RIGHTS-001 | P0 | M1 | Rights | Rights Record | Every commercial media asset shall record owner/licensor, territories, window, platform and monetisation rights. |
| AZP-RIGHTS-002 | P0 | M1 | Rights/Media | Automatic Availability Enforcement | Where feasible, expired/blocked rights shall remove playback availability automatically. |
| AZP-RIGHTS-003 | P0 | M1 | VTM/Rights | Talent Clearance | Covered asset shall record required performer/voice/digital-replica clearance status. |
| AZP-RIGHTS-004 | P0 | M1 | Rights/VCF | Music Clearance | Covered media shall record music-rights status before publish. |
| AZP-RIGHTS-005 | P0 | M1 | VCF/Rights | AI Provenance Reference | AI-assisted AOU asset shall reference VCF provenance record and approved master version. |
| AZP-SPON-001 | P1 | M2 | Commercial/Product | Sponsor Object | M2 shall support sponsor/campaign/surface/creative/CTA/start/end/audience/reward/reporting configuration. |
| AZP-SPON-002 | P0 | M2 | Product/AOU/Commercial | No Canon Control | Sponsor configuration shall not grant authority to change AOU canon or fabricate audience outcomes. |
| AZP-SPON-003 | P1 | M2 | Commercial/Product | Frequency Cap | Sponsor surfaces shall support configured exposure/frequency control where relevant. |
| AZP-SPON-004 | P0 | M2 | Data/Commercial | Reporting Integrity | Sponsor metrics shall derive from defined telemetry rather than unsupported manual estimates where platform telemetry exists. |
| AZP-AN-001 | P0 | M1 | Data & Growth | Event Taxonomy | Critical product events shall use canonical documented names and properties. |
| AZP-AN-002 | P0 | M1 | Data | Identity Stitching | Analytics shall distinguish guest session/device from registered user and avoid obvious double counting after registration. |
| AZP-AN-003 | P0 | M1 | Data/Media | Content IDs | Playback/exploration events shall include canonical content/entity identifiers. |
| AZP-AN-004 | P1 | M2 | Growth/Data | Campaign Attribution | Supported acquisition/share links shall preserve campaign attribution through activation where feasible. |
| AZP-AN-005 | P0 | M1 | Data/QA | Analytics QA | Critical events shall be verified in staging, beta and production smoke tests before launch acceptance. |
| AZP-AN-006 | P0 | M2 | Product/Data | WEP | Weekly Engaged Participants shall use a controlled qualifying-action definition and stable reporting logic. |
| AZP-AN-007 | P1 | M2 | Finance/Data/Product | Contribution per WEP | Product economics dashboard shall pair WEP with contribution margin per WEP when financial data is available. |
| AZP-AN-008 | P1 | M2 | Data/AOU | Knowledge Route | Analytics shall record whether canonical knowledge was acquired by vertical, long-form or mixed route. |
| AZP-AN-009 | P0 | M2 | Product/Data | Feature Classification Evidence | Storyworld/participation/reward features shall produce metrics sufficient for SCALE/MAINTAIN/OPTIMISE/RETIRE decision. |
| AZP-NFR-001 | P0 | M2 | SRE | Availability | Defined critical production services shall target 99.9% monthly availability after stabilisation. |
| AZP-NFR-002 | P0 | M2 | Mobile/SRE | Crash-Free Sessions | Founding public target shall be at least 99.5% crash-free sessions. |
| AZP-NFR-003 | P0 | M2 | Commerce/Finance | Transaction Accuracy | Payment and entitlement reconciliation shall target 100% record accuracy. |
| AZP-NFR-004 | P0 | M2 | Platform/SRE | API Performance | Critical non-media APIs shall meet provisional P95 latency SLO defined below under launch load. |
| AZP-NFR-005 | P0 | M2 | Media/SRE | Playback Startup | Qualifying playback sessions shall meet provisional P50/P95 startup SLO defined below. |
| AZP-NFR-006 | P0 | M2 | Media/SRE | Rebuffer | Qualifying sessions shall remain within provisional rebuffer ratio SLO. |
| AZP-NFR-007 | P0 | M2 | Commerce/SRE | Entitlement Propagation | Confirmed successful transaction shall produce active entitlement within provisional SLO except documented provider delay cases. |
| AZP-NFR-008 | P0 | M2 | SRE | RTO/RPO | Critical domains shall have defined recovery objectives and tested restore process. |
| AZP-NFR-009 | P0 | M1 | SRE | Observability | Critical services shall provide logs, metrics, alerts, correlation/traceability and dependency visibility. |
| AZP-NFR-010 | P0 | M1 | Platform/SRE | Graceful Degradation | Failure of optional services shall not unnecessarily block permitted core playback. |
| AZP-SUP-001 | P0 | M2 | Operations | Support Lookup | Authorised Support shall inspect account, recent playback issue, transaction, entitlement and reward/support state appropriate to case. |
| AZP-SUP-002 | P0 | M2 | Security/Operations | Least-Privilege Support | Support shall not receive publish, rights-edit or unrestricted finance/admin permissions. |
| AZP-ADMIN-001 | P0 | M1 | Security | Named Admin Accounts | Shared administrative credentials are prohibited. |
| AZP-ADMIN-002 | P0 | M1 | Platform/Security | Audit High-Risk Actions | Publish/unpublish, rights edits, manual entitlements, refunds, reward adjustments, campaign activation and sensitive data access shall be audited. |
| AZP-ADMIN-003 | P0 | M1 | Platform/Product | Feature Flags | Major features/universes shall support remote on/off/cohort/territory/platform control and emergency disable where designed. |
| AZP-ADMIN-004 | P1 | M2 | Security/Finance/Product | Dual-Control Candidate Actions | Technical Authority shall identify high-risk actions requiring secondary approval or workflow control. |
| SEC-001 | P0 | M1/M2 | Security/SRE | Security Control | Encryption in transit for authenticated and sensitive traffic. |
| SEC-002 | P0 | M1/M2 | Security/SRE | Security Control | Appropriate encryption at rest for sensitive data and secrets. |
| SEC-003 | P0 | M1/M2 | Security/SRE | Security Control | Secrets managed outside source code and user-visible clients. |
| SEC-004 | P0 | M1/M2 | Security/SRE | Security Control | Least privilege and RBAC for administration. |
| SEC-005 | P0 | M1/M2 | Security/SRE | Security Control | Audit logging for high-risk admin actions. |
| SEC-006 | P0 | M1/M2 | Security/SRE | Security Control | Dependency/vulnerability monitoring and patch process. |
| SEC-007 | P0 | M1/M2 | Security/SRE | Security Control | Secure CI/CD and environment separation. |
| SEC-008 | P0 | M1/M2 | Security/SRE | Security Control | Incident response and evidence preservation. |
| SEC-009 | P0 | M1/M2 | Security/SRE | Security Control | Backups protected and restore-tested. |
| SEC-010 | P0 | M1/M2 | Security/SRE | Security Control | Sensitive permission requests minimised and purpose-explained. |

# APPENDIX C — STATE-MACHINE CATALOGUE

| **DOMAIN** | **CONTROLLED STATE PATH** |
|----|----|
| Content | DRAFT → IN_REVIEW → APPROVED → SCHEDULED/PUBLISHED → UNPUBLISHED/EXPIRED/BLOCKED → ARCHIVED |
| Transaction | CREATED → PENDING → SUCCESS/FAILED/CANCELLED/UNKNOWN → REFUNDED/PARTIALLY_REFUNDED/DISPUTED as applicable |
| Entitlement | PENDING → ACTIVE → EXPIRED/REVOKED/REFUNDED/SUSPENDED |
| Participation | DRAFT → SCHEDULED → OPEN → CLOSED → RESULT_PENDING/RESULT_PUBLISHED → ARCHIVED |
| Reward | CREATED → ELIGIBLE → EARNED → REDEEMED/EXPIRED/REVOKED |
| Knowledge | UNKNOWN → TEASED → KNOWN; error remediation via REVOKED_FOR_ERROR |
| Support Case | OPEN → IN_PROGRESS → ESCALATED/WAITING → RESOLVED → CLOSED |
| Experiment | DRAFT → APPROVED → RUNNING → STOPPED/COMPLETED → DECIDED → ARCHIVED |

# APPENDIX D — BUSINESS RULE INDEX

| **RULE ID** | **RULE** |
|----|----|
| BR-AUTH-001 | Persistent watch/knowledge/reward state belongs to authenticated identity, not guest session. |
| BR-AUTH-002 | Guest-to-registered transition must preserve eligible current-session context where technically safe. |
| BR-MEDIA-001 | Playback availability requires publish + rights + territory + age/access state; premium entitlement alone is insufficient. |
| BR-MEDIA-002 | Optional service outage must not block permitted core playback unless dependency is security/rights critical. |
| BR-KNOW-001 | Knowledge is granted by configured canonical-event/knowledge rules, not by simple file existence. |
| BR-KNOW-002 | Starting an episode does not automatically grant its completion knowledge set. |
| BR-KNOW-003 | Vertical and long-form may grant equivalent Knowledge Units through different content routes. |
| BR-KNOW-004 | Knowledge grants are idempotent. |
| BR-KNOW-005 | Locked future knowledge must not leak through API or search indexing. |
| BR-PART-001 | Each participation object explicitly defines submission and result policy. |
| BR-PART-002 | Founding predictions cannot create cash stake or cash-equivalent wager. |
| BR-RWD-001 | Points are loyalty records, not money. |
| BR-RWD-002 | Reward earning and redemption are idempotent for a defined qualifying action. |
| BR-COM-001 | A successful purchase creates exactly the intended entitlement once. |
| BR-COM-002 | An already entitled user cannot unknowingly repurchase identical overlapping access. |
| BR-COM-003 | Sponsor-funded access never silently becomes paid recurring access. |
| BR-COM-004 | Rights expiry overrides active entitlement when VMNL lacks continuing distribution authority. |
| BR-COM-005 | Refund/entitlement outcome follows the SKU rule and is audit-traceable. |
| BR-CMS-001 | No valid ACDP means no production publication eligibility. |
| BR-RIGHTS-001 | Rights-complete status is required for public distribution. |
| BR-SPON-001 | Sponsor cannot alter AOU canon, merit outcome, factual truth or access unauthorised personal data. |
| BR-ADMIN-001 | No shared admin credentials. |
| BR-ADMIN-002 | High-risk administrative actions are audited. |
| BR-AN-001 | No KPI may rely on undocumented telemetry. |
| BR-REL-001 | Time/date pressure does not override failed mandatory gate. |

# APPENDIX E — FOUNDING SCREEN REGISTER

| **\#** | **SCREEN** | **STATE AUTHORITY** |
|----|----|----|
| 1 | Splash / Entry | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 2 | Guest Landing / Deep-Link Entry | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 3 | Registration | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 4 | Onboarding | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 5 | Home | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 6 | Explore | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 7 | Search | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 8 | Vertical Feed/Player | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 9 | Vertical Episode End State | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 10 | Series Home | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 11 | Title Detail | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 12 | Long-Form Player | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 13 | AOU Hub | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 14 | Character Detail | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 15 | Relationship View | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 16 | Timeline | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 17 | Artefact Detail | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 18 | What You Know | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 19 | Participate Home | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 20 | Poll | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 21 | Quiz | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 22 | Prediction | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 23 | Mission | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 24 | Rewards Home | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 25 | Reward Detail | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 26 | Redemption | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 27 | Premium Product | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 28 | Purchase | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 29 | Payment Result | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 30 | Profile | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 31 | Watch History | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 32 | Purchase History | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 33 | Notification Preferences | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 34 | Account / Privacy | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 35 | Support | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 36 | Network Error | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 37 | Content Unavailable | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 38 | Premium Locked | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 39 | Rights/Territory Unavailable | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |
| 40 | Payment Failure | See Screen-State Matrix; detailed UX authority to expand without contradicting PRD. |

# APPENDIX F — ADMIN SCREEN REGISTER

| **\#** | **ADMIN SCREEN**            | **PRIMARY ROLE**                  |
|--------|-----------------------------|-----------------------------------|
| 1      | Admin Login                 | Role-controlled; see RBAC matrix. |
| 2      | Dashboard                   | Role-controlled; see RBAC matrix. |
| 3      | Content Catalogue           | Role-controlled; see RBAC matrix. |
| 4      | Title Editor                | Role-controlled; see RBAC matrix. |
| 5      | Episode Editor              | Role-controlled; see RBAC matrix. |
| 6      | Storyworld Editor           | Role-controlled; see RBAC matrix. |
| 7      | Character Editor            | Role-controlled; see RBAC matrix. |
| 8      | Timeline / Knowledge Editor | Role-controlled; see RBAC matrix. |
| 9      | Release Scheduler           | Role-controlled; see RBAC matrix. |
| 10     | Rights Status               | Role-controlled; see RBAC matrix. |
| 11     | ACDP Validation             | Role-controlled; see RBAC matrix. |
| 12     | Participation Manager       | Role-controlled; see RBAC matrix. |
| 13     | Rewards Manager             | Role-controlled; see RBAC matrix. |
| 14     | Sponsor Campaign Manager    | Role-controlled; see RBAC matrix. |
| 15     | User Support View           | Role-controlled; see RBAC matrix. |
| 16     | Transaction Lookup          | Role-controlled; see RBAC matrix. |
| 17     | Entitlement Lookup          | Role-controlled; see RBAC matrix. |
| 18     | Refund Workflow             | Role-controlled; see RBAC matrix. |
| 19     | Feature Flags               | Role-controlled; see RBAC matrix. |
| 20     | Analytics Dashboard         | Role-controlled; see RBAC matrix. |
| 21     | Audit Log                   | Role-controlled; see RBAC matrix. |

# APPENDIX G — FOUNDING DATA ENTITIES

| **ENTITY**      | **ENTITY**           | **ENTITY**      |
|-----------------|----------------------|-----------------|
| User            | Profile              | Consent         |
| Preference      | Session              | Device          |
| Storyworld      | Title                | Season          |
| Episode         | Chapter              | Clip            |
| Media Asset     | Artwork              | Character       |
| Relationship    | Location             | Institution     |
| Artefact        | Canonical Event      | Knowledge Unit  |
| Knowledge State | Mystery              | Reveal          |
| Timeline Item   | Watch Progress       | Participation   |
| Response        | Quiz                 | Poll            |
| Prediction      | Mission              | Reward          |
| Points Ledger   | Badge                | Streak          |
| Redemption      | Product              | Price           |
| Transaction     | Entitlement          | Refund          |
| Sponsor         | Campaign             | Notification    |
| Rights Record   | Provenance Reference | Support Case    |
| Feature Flag    | Experiment           | Analytics Event |

# APPENDIX H — NEXT SUBORDINATE EXECUTION AUTHORITIES

| **\#** | **AUTHORITY** | **PURPOSE** |
|----|----|----|
| 1 | Azeebo+ Technical Architecture Authority | Services, data, APIs, infrastructure, RTO/RPO and vendor boundaries. |
| 2 | Azeebo+ Design System & UX Authority | Screen flows, component states, accessibility and interaction. |
| 3 | Azeebo+ M0–M3 Delivery Master | Milestones, squads, dependencies, resourcing and gate calendar. |
| 4 | Azeebo+ Product Backlog & Sprint Authority | Sprint-ready stories mapped to requirement IDs. |
| 5 | Azeebo+ Data Model & API Specification | Entity schemas and service contracts. |
| 6 | Azeebo+ Analytics Event & KPI Authority | Canonical event schema and dashboards. |
| 7 | Azeebo+ ACDP & Rights Specification | Ingestion validation and release-control details. |
| 8 | Azeebo+ Payments, Entitlements & Reconciliation Authority | Provider routing, ledgers, store treatment and finance control. |
| 9 | AOU Canonical Knowledge Graph & Storyworld Engine Detailed PRD | Final event/knowledge mappings, graph rules and cross-title extension. |
| 10 | Azeebo+ QA, Security, SRE & Launch Authority | Test cases, load, incident and launch command. |

# FINAL LOCK — AZP-FMVP-PRD-001

<table>
<colgroup>
<col style="width: 100%" />
</colgroup>
<thead>
<tr>
<th><p><strong>REVISION</strong></p>
<p>R2.0 / P2.0 / PA2.0 — FINAL TRUE-MERGER, REQUIREMENT-TRACEABLE, STATE-COMPLETE, CANONICAL-KNOWLEDGE, COMMERCIAL-CONTROL, ENGINEERING-HANDOFF FOUNDING MVP MASTER PRD</p></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

This authority supersedes the R1 Founding MVP PRD architecture and preserves its founding strategy while adding the control systems required for high-confidence engineering handoff.

## Locked Founding Principles

- AOU launches the Founding MVP; AOU is IP, not a ninth consumer universe.

- Vertical and Movies & Series are founding distribution surfaces.

- Canonical Knowledge State controls spoiler-safe Storyworld discovery across long-form, vertical and future titles.

- No open mass UGC, real-money gaming or proprietary stored-value wallet in the Founding MVP.

- Payments, entitlements, points and promotional rewards remain separate ledgers/concepts.

- No feature without a value hypothesis, analytics and acceptance criteria.

- No public content without rights-complete ACDP and applicable provenance.

- No major scale without AOU-G1/G2/G3 evidence; no franchise-reuse claim without AOU-G4.

- Reuse before rebuild; capital follows evidence.

## Final Product Doctrine

**PROVE CONTENT.**

**PROVE BEHAVIOUR.**

**PROVE PRODUCT.**

**PROVE ECONOMICS.**

**PROVE REUSE.**

**THEN SCALE AZEEBO+.**

**THE SMALLEST SYSTEM THAT CAN PROVE THE NEXT BIGGEST CLAIM.**
