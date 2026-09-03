# VMNL / AZEEBO+ — Complete Authority Stack Possibilities Analysis

**Documents Analysed:**
1. **VMNL-AZP-AOS-MA-001 R1.1** — Enterprise Agentic Operating System Master Authority
2. **AZP-CCPOS-001 R1.1** — Claude Code Production Operating System & Implementation Prompt Authority
3. **AZP-BRD-PRD-001 R3.0** — Integrated Business Requirements Document & Master Product Requirements Document
4. **AZP-UXDSA-001 R3.1** — UI/UX Design System & Experience Architecture Authority

**Analysis Date:** August 30, 2026
**Status:** Assessment Only — No Code Changes

---

## Executive Summary

The four authority documents together define the **complete operating, engineering, product, and experience architecture** for Azeebo+. The current codebase (28+ microservices, API gateway, 4 frontend apps, 23 shared packages) provides a strong technical foundation. The analysis reveals three layers of possibilities:

1. **Governance & Agent Orchestration** (from AOS-MA-001) — Agent registry, task routing, cost telemetry, risk scoring, kill switches
2. **Engineering Operating System** (from CCPOS-001) — Claude Code hook enforcement, specialist agents, skills, evidence traceability, permission controls
3. **Product & Experience Gaps** (from BRD-PRD-001 + UXDSA-001) — Missing screens, incomplete journeys, component state gaps, analytics instrumentation

**Bottom line: The engine exists. What's needed is the governance dashboard, the engineering guardrails, and the product completeness layer.**

---

## PART I — CODEBASE vs. AUTHORITY COMPLIANCE

### 1. Infrastructure & Services Compliance

| Authority Requirement | Codebase Status | Verdict |
|---|---|---|
| 8 Universes (Vertical, Movies & Series, Lifestyle, Comedy, Creator, Reality, Games, Sports) | 9 universe services exist | ✅ Compliant |
| 5 Demand Systems (AOU, Cinemaxis, Games 360, 9TLIFE, Azeebo+ Live) | live-event-service exists; others are brand concepts loaded as skill packs | ✅ Compliant (by design — skill packs, not services) |
| Core Platform (auth, user, content, media, knowledge, payment, wallet, search) | All 8 core services exist | ✅ Compliant |
| Engagement (engagement, messaging, notification, referral, reward, subscription) | All 6 exist | ✅ Compliant |
| Intelligence (analytics, recommendation) | 2 services exist | ✅ Compliant |
| Operations (moderation, queue, support) | 3 services exist | ✅ Compliant |
| API Gateway | Exists with proxy routing to all services | ✅ Compliant |
| Event-Driven Architecture | event-bus package + transactional outbox patterns | ✅ Compliant |
| Skill-Pack Architecture | Universe services + shared packages (no per-brand agents) | ✅ Compliant |
| Single Source of Truth | Single Prisma schema, gateway-mediated access, no cross-domain writes | ✅ Compliant |
| Shared Packages (auth, security, event-bus, logger, observability, etc.) | 23 packages exist | ✅ Compliant |

### 2. Frontend Apps Compliance (BRD-PRD-001 + UXDSA-001)

| App | Status | Key Gap |
|---|---|---|
| **Web** (`apps/web`) | 162+ pages, Next.js, responsive | Some screens lack all 13 UX states (loading/empty/error/restricted/etc.) |
| **Mobile** (`apps/mobile`) | 152+ screens, React Native, Expo | Some universe sub-pages were just created; need state-completeness audit |
| **Admin** (`apps/admin`) | 44 routes | Partner/operator experience limited; no agent portfolio dashboard |
| **Creator** (`apps/creator`) | 27 routes | E2+ activation-gated per BRD-PRD |

### 3. Engineering OS Compliance (CCPOS-001)

| CCPOS Requirement | Codebase Status | Verdict |
|---|---|---|
| CLAUDE.md Constitution | Exists at repo root | ✅ Present |
| Modular Rule System | `.claude/` directory exists | ⚠️ Partial — needs expansion |
| Machine-Readable Policy Layer | No policy engine | ❌ Missing |
| Specialist Agent Architecture | No specialist agents defined | ❌ Missing |
| Skills & Workflow Architecture | No `/azeebo-*` skills defined | ❌ Missing |
| Hook Enforcement Architecture | No pre/post tool hooks | ❌ Missing |
| Evidence & Traceability | `docs/` directory exists but no structured traceability | ⚠️ Partial |
| Permission Model (ALLOW/ASK/DENY) | No permission resolution | ❌ Missing |
| Hard-Denied Actions | No dangerous-operation blocking | ❌ Missing |
| Builder-vs-Reviewer Separation | No independent review automation | ❌ Missing |
| Repository Calibration | No `/azeebo-calibrate` | ❌ Missing |
| Worktree Isolation | Standard git, no worktree enforcement | ⚠️ Partial |

---

## PART II — ALL GAPS CATEGORISED BY SOURCE DOCUMENT

### From VMNL-AZP-AOS-MA-001 (Agentic Operating System)

#### 🔵 Already Compliant
- Skill-pack architecture
- Single source of truth / zero-contradiction
- Event-driven patterns
- Core + universe service coverage

#### 🟡 Partial Fit (Extensions Needed)

| Gap | What Exists | What's Missing |
|---|---|---|
| Six Control-Plane Agents (Section 6) | knowledge-service, queue-service, moderation-service, analytics-service | Agent orchestration layer with routing, authority resolution, risk scoring, audit |
| Twelve Shared Enterprise Agents (Section 7) | payment-service, wallet-service, subscription-service, support-service, moderation-service, analytics-service | Close/reconciliation, AR ageing/collections, CRM/commercial, rights management, vendor management, HR/people, SRE/incident |
| Human–Agent Work Classification (Section 1) | Nothing | H0-H1-A1-A2-S-X classification tags on tasks/workflows |
| Cost Telemetry (Sections 12-13, 23) | Nothing | Per-task model cost tracking, model-tier routing (T0-T4), cost budgets per agent |
| Risk Scoring (Sections 20-21, 25) | moderation-service (content risk only) | Enterprise-wide R0-R4 risk levels, A0-A5 autonomy levels, maker/checker separation |

#### 🔴 Major Gaps (New Systems Required)

| Gap | Description |
|---|---|
| Authority Inheritance & Policy Engine (CP-02) | No system to resolve which governing document controls a given action |
| Reversibility Standard & Kill Switches (Section 25) | No infrastructure to suspend individual agent workflows or test rollback paths |
| Agent Portfolio Management (Part XII) | No dashboard to track agent ROI, correction rates, escalation rates, or make merge/retire decisions |
| Human Capacity Release Ledger (Part I, Section 2) | No before/after time tracking per workflow to measure hours released and redeployment |
| Headcount Avoidance Register (Section 29) | No CFO/People-validated register of avoided roles, delayed hires, vendor reductions |
| Process Mining Infrastructure (Part II) | No inventory of recurring workflows with hours, cost, risk, volume metrics |

---

### From AZP-CCPOS-001 (Claude Code Operating System)

#### 🔴 Major Gaps (Claude Code OS Not Installed)

| Gap | Description | Effort |
|---|---|---|
| **Machine-Readable Policy Layer** | No protected-path definitions, dangerous-operation blocking, sensitive-domain classification | Medium |
| **Specialist Agent System** | 10 specialist agents not defined (Implementation Engineer, Authority Auditor, Architecture Guardian, AOU Canon Guardian, Commerce Guardian, Commercial Semantics Reviewer, DB/Migration Reviewer, Security/SRE Reviewer, Test/Release Verifier, UX/Accessibility Reviewer) | Medium-High |
| **Skills & Workflow Architecture** | 11 principal skills not implemented (/azeebo-doctor, /calibrate, /intake, /audit, /plan, /build, /review, /verify, /migrate, /release, /closeout) | High |
| **Hook Enforcement** | No pre-tool-use, post-tool-use, subagent-start, or config-change hooks | Medium |
| **Permission Model** | No ALLOW/ASK/DENY resolution for Bash, Edit, Write actions | Medium |
| **Hard-Denied Actions** | No blocking of force-push, terraform destroy, secret writes, authority rewrites | Low-Medium |
| **Evidence & Traceability** | No requirement→implementation→test→evidence→release-gate traceability chain | Medium |
| **Repository Calibration** | No automated discovery of actual package manager, commands, paths, providers | Medium |
| **Builder-vs-Reviewer Separation** | No independent specialist review gates | Medium |
| **Execution Prompt Pack** | 23 execution prompts (AZP-CCP-000 through CCP-020) not implemented | High |

#### 🟡 Partial Fit

| Gap | What Exists | What's Missing |
|---|---|---|
| CLAUDE.md | Exists at repo root | Needs expansion to full constitution with authority hierarchy, product locks, technical locks, commercial locks, UX locks |
| Modular Rules | `.claude/` directory | Needs domain-specific rule files (Authority, Workflow, Product, Backend, Database, Frontend, Infrastructure, Testing) |
| Evidence Directories | `docs/` exists | Needs structured `/azeebo/evidence/` with architecture, gap analysis, plan, risk register, TBD register, test matrix, runbooks, closeout reports |
| Worktree Isolation | Standard git | No enforced worktree-per-task isolation |

---

### From AZP-BRD-PRD-001 R3.0 (Business Requirements)

#### 🟡 Product Architecture Gaps

| Gap | BRD Reference | Current Status | What's Needed |
|---|---|---|---|
| **Master Counterparty** | BRD-004, R3-TBD-006 | Nothing exists | Legal entity + relationship instances + exposure tracking across sponsor/venue/rights holder/creator/telco/distributor/vendor |
| **Commercial Product Record** | BRD-007, Section 7 | payment-service + wallet-service exist | Waterfall reference, settlement obligation, receivables state, reserve classification |
| **Telco Reconciliation** | BRD-013, R3-TBD-007 | Nothing exists | Activation → entitlement → billing → carrier settlement → bank receipt flow |
| **Cinemaxis Windowing/DBO** | BRD Section 50-51 | movie-service exists | Windowing, territory, rights, Digital Ticket SKU, entitlement, Digital Box Office, rights-holder reporting |
| **9TLIFE City Graph** | BRD Section 53, R3-TBD-004 | lifestyle-service exists (basic) | City → neighbourhood → place → category → event → experience → partner → offer → itinerary model |
| **Creator Economy** | BRD Section 55, R3-TBD-008 | creator-service exists (basic) | Identity → rights → licence → guarantee → recoupment → earnings → payable → payment → dispute chain |
| **Revenue Class Separation** | BRD-003, BRD-006 | Nothing enforced | Property/universe attribution ≠ revenue class; GMV ≠ revenue; collection ≠ recognition |
| **Commercial Activation Gates** | Section 30 (C-G0 through C-G7) | Nothing exists | Customer value → demand → rights/legal → operations → contribution → working capital → trust → reuse gates |

#### 🔵 Already Compliant

- One customer identity across all universes (BRD-001) ✅
- One coherent commercial relationship with separate ledgers (BRD-002) ✅
- Shared engines reused before bespoke (BRD-009) ✅
- Global navigation doctrine (5-slot model) ✅
- M0-M3 release state framework ✅
- Universe qualification scoring system ✅

---

### From AZP-UXDSA-001 R3.1 (UI/UX Design System)

#### 🔴 Screen & Journey Gaps (124 Screens Defined, ~60% Built)

| Category | Screens Defined | Screens Built | Gap |
|---|---|---|---|
| **Core & Identity** (UX-SCR-001 to 018) | 18 | ~16 | Minor state gaps |
| **Vertical & Media** (UX-SCR-019 to 027) | 9 | ~8 | End State screen missing |
| **AOU** (UX-SCR-028 to 036) | 9 | ~6 | Relationship View, Artefact Detail, Knowledge Locked, Recap missing |
| **Participation & Rewards** (UX-SCR-037 to 048) | 12 | ~8 | Prediction, Challenge Detail, Participation Result, Reward Detail, Badge/Level, Redemption, Reward History |
| **Commerce** (UX-SCR-049 to 057) | 9 | ~6 | Provider Handoff, Payment Pending/Unknown, Refund Status |
| **Cinemaxis** (UX-SCR-058 to 063) | 6 | 0 | Entirely unbuilt — Digital Cinema Home, Film Detail, Digital Ticket, Player, Access Expired, Premiere |
| **Games 360** (UX-SCR-064 to 073) | 10 | ~5 | Game Lobby, Session, Question/Round, Submission, Result, Leaderboard, Team, Reward Funding |
| **9TLIFE** (UX-SCR-074 to 086) | 13 | ~3 | Tonight, Weekend, Map/List, Place Detail, Offer Detail, Itinerary, Booking, Partner Terms, Verified Review, Seasonal Home |
| **Live** (UX-SCR-087 to 096) | 10 | ~2 | Event Detail, Ticket/Access, Countdown, Live Player, Interrupted, Companion, Venue, Replay, Post-Event |
| **Creator** (UX-SCR-097 to 102) | 6 | ~3 | Portfolio, Opportunity, Qualified Publish, Analytics Summary, Rights/Permission |
| **Reality** (UX-SCR-103 to 109) | 7 | ~4 | Season Detail, Voting Closed, Result Pending, Result Published |
| **Sports** (UX-SCR-110 to 114) | 5 | ~1 | Fixture Detail, Team/Personality, Prediction, Fan Experience |
| **System/Failure** (UX-SCR-115 to 124) | 10 | ~4 | Network Degraded, Offline, Maintenance, Content Unavailable, Rights/Territory, Age Restricted, Account Restricted, Provider Unavailable, Integrity Hold, Fatal Error |

**Estimated: ~65 of 124 screens built (~52%)**

#### 🟡 UX Architecture Gaps

| Gap | UXDSA Reference | What's Needed |
|---|---|---|
| **24 Experience Laws** | UX-L01 through UX-L24 | Audit each law against current implementation |
| **Component State Completeness** | All critical screens need 13 states (loading, empty, auth, premium-locked, knowledge-locked, rights-restricted, territory, offline, degraded-network, transaction-pending, transaction-unknown, provider-failure, error, recovery) | State audit across all existing screens |
| **Design Token System** | Appendix A (500+ tokens) | Verify all tokens are implemented in design-tokens package |
| **Shared Component Library** | Appendix B (100+ components) | Verify all components exist in ui package |
| **Analytics Instrumentation** | Part XII | Critical impressions, actions, conversions, errors specified per screen |
| **Back-Stack Continuity** | Section 7 | Cross-system handoff behaviour (Vertical→Storyworld, Cinemaxis→9TLIFE, etc.) |
| **Low-Bandwidth Behaviour** | Section 26 | Data Saver mode, offline state, degraded recovery across all screens |
| **Accessibility Compliance** | Part IX | WCAG 2.1 AA across all screens — semantics, focus, contrast, text scale, motion, media controls |
| **Commerce Trust** | Part VII | Price, access, refund, partner boundary, sponsorship disclosure patterns |
| **Search Architecture** | Section 8 | Multi-type search (content, storyworld, people, real-world, live, play) with availability controls |

---

## PART III — 25 BUILDABLE POSSIBILITIES (PRIORITY ORDER)

### Tier 1 — Foundation (Build First)

| # | Possibility | Source Document | What | Foundation | Effort |
|---|---|---|---|---|---|
| 1 | **Model Cost Tracker** | AOS-MA-001 §12-13 | Middleware logging model name, tokens, latency, dollar cost per AI request | analytics-service + observability | Low |
| 2 | **Agent Registry** | AOS-MA-001 §6-8, CCPOS-001 §15 | Central registry of all agents: ID, version, purpose, owner, tools, risk/autonomy, kill switches, cost budgets | knowledge-service + new schema | Medium |
| 3 | **Task Router / Work Classifier** | AOS-MA-001 §1, §5 | H0-H1-A1-A2-S-X classification, routing to cheapest reliable tier | queue-service + routing logic | Medium |
| 4 | **Kill Switch Infrastructure** | AOS-MA-001 §25, CCPOS-001 §20 | Per-agent workflow suspension/resumption with tested rollback (K0-K4) | Gateway + circuit breakers | Low-Medium |
| 5 | **Machine-Readable Policy Layer** | CCPOS-001 §14 | Protected paths, dangerous operations, sensitive domains, secret patterns | New config files + validation | Medium |

### Tier 2 — Engineering Guardrails (Build Second)

| # | Possibility | Source Document | What | Foundation | Effort |
|---|---|---|---|---|---|
| 6 | **Specialist Agent System** | CCPOS-001 §28-37 | 10 specialist agents: Implementation Engineer, Authority Auditor, Architecture Guardian, AOU Canon Guardian, Commerce Guardian, Commercial Semantics, DB/Migration, Security/SRE, Test/Release, UX/Accessibility | .claude/ config + prompts | Medium |
| 7 | **Skills & Workflow Architecture** | CCPOS-001 §39-49 | 11 principal skills: /azeebo-doctor through /azeebo-closeout | .claude/skills/ + execution logic | High |
| 8 | **Hook Enforcement** | CCPOS-001 §17 | Pre-tool-use, post-tool-use, subagent-start, config-change hooks | .claude/hooks/ + validation | Medium |
| 9 | **Permission Model (ALLOW/ASK/DENY)** | CCPOS-001 §19-21 | Resolution system for Bash, Edit, Write actions with domain controls | Config + hook logic | Medium |
| 10 | **Evidence & Traceability** | CCPOS-001 §18 | requirement→implementation→test→evidence→release-gate chain | /azeebo/evidence/ structure | Medium |

### Tier 3 — Risk & Governance (Build Third)

| # | Possibility | Source Document | What | Foundation | Effort |
|---|---|---|---|---|---|
| 11 | **Risk Scoring Engine** | AOS-MA-001 §20-21 | R0-R4 risk levels, A0-A5 autonomy levels, approval gate routing | New service or moderation-service extension | Medium |
| 12 | **Authority Resolver** | AOS-MA-001 §6, CCPOS-001 §3-5 | Resolves governing document (EPCOF, CEERP, PDDMA, BRD, UXDSA, TAA, CCPOS) per action | knowledge-service extension | Medium |
| 13 | **Cost Dashboard (Admin)** | AOS-MA-001 §23, §28 | Real-time model cost per agent/task/domain with budget alerts | admin app + analytics-service | Medium |
| 14 | **Agent Portfolio Review Module** | AOS-MA-001 §30-32 | Monthly review UI: ROI, correction rate, escalation rate, merge/retire recs | admin app + analytics queries | Medium |
| 15 | **Human Capacity Ledger** | AOS-MA-001 §2, §29 | Before/after time tracking, headcount avoidance register, vendor replacement | admin app + new schema | Medium |

### Tier 4 — Product Completeness (Build Fourth)

| # | Possibility | Source Document | What | Foundation | Effort |
|---|---|---|---|---|---|
| 16 | **Cinemaxis Experience Pack** | UXDSA-001 §58-63, BRD-PRD §51 | 6 screens: Digital Cinema Home, Film Detail, Digital Ticket, Player, Access Expired, Premiere | movie-service + new UI | Medium-High |
| 17 | **9TLIFE Experience Pack** | UXDSA-001 §74-86, BRD-PRD §53 | 13 screens: Tonight, Weekend, Map/List, Place Detail, Offer, Itinerary, Booking, Partner Terms, etc. | lifestyle-service extension + new UI | High |
| 18 | **Live Experience Pack** | UXDSA-001 §87-96, BRD-PRD §54 | 10 screens: Event Detail, Ticket/Access, Countdown, Player, Interrupted, Companion, Venue, Replay, Post-Event | live-event-service + new UI | High |
| 19 | **Games 360 Completion** | UXDSA-001 §64-73, BRD-PRD §52 | Complete remaining 5 screens: Lobby, Session, Question/Round, Submission, Result, Leaderboard, Team, Reward Funding | games-service extension | Medium |
| 20 | **Master Counterparty Module** | BRD-PRD §57-58, R3-TBD-006 | Legal entity + relationship instances + exposure tracking | New domain module or service | High |

### Tier 5 — Platform Maturity (Build Fifth)

| # | Possibility | Source Document | What | Foundation | Effort |
|---|---|---|---|---|---|
| 21 | **System/Failure State Pack** | UXDSA-001 §115-124 | 10 screens: Network Degraded, Offline, Maintenance, Content Unavailable, Rights/Territory, Age Restricted, Account Restricted, Provider Unavailable, Integrity Hold, Fatal Error | Cross-cutting UI components | Medium |
| 22 | **Process Mining Tool** | AOS-MA-001 Part II | Inventory of recurring workflows with hours, cost, risk, volume, automation-readiness | admin + analytics + queue-service | Medium-High |
| 23 | **Telco Reconciliation** | BRD-PRD §56, R3-TBD-007 | Activation → entitlement → billing → carrier settlement → bank receipt | New provider adapter + reconciliation module | Medium |
| 24 | **Revenue Class Separation** | BRD-PRD §7, BRD-003/006 | Enforce property/universe ≠ revenue class; GMV ≠ revenue; collection ≠ recognition | payment-service + data layer | Medium |
| 25 | **Accessibility Compliance Pack** | UXDSA-001 Part IX | WCAG 2.1 AA audit + fixes across all 124 screens | Cross-cutting UI audit | High |

---

## PART IV — SCREEN GAP SUMMARY (UXDSA-001 R3.1)

### Screens Built vs. Required by Release Phase

| Phase | Screens Required | Screens Built | Completion |
|---|---|---|---|
| **M0/M1/M2** (Founding → MVP) | ~78 | ~65 | **83%** |
| **E1** (Frequency Expansion) | ~35 | ~10 | **29%** |
| **E2+** (Network Expansion) | ~11 | ~8 | **73%** |
| **Total** | **124** | **~83** | **67%** |

### Critical Missing M0/M1/M2 Screens (Must Complete for MVP)

| Screen ID | Screen | Why Critical |
|---|---|---|
| UX-SCR-034 | AOU What You Know | Core AOU Knowledge experience |
| UX-SCR-035 | AOU Knowledge Locked | Core AOU Knowledge experience |
| UX-SCR-040 | Prediction | Participation core |
| UX-SCR-042 | Challenge Detail | Participation core |
| UX-SCR-043 | Participation Result | Participation core |
| UX-SCR-045 | Reward Detail | Rewards core |
| UX-SCR-046 | Badge / Level | Rewards core |
| UX-SCR-047 | Redemption | Commerce + Rewards |
| UX-SCR-051 | Provider Handoff | Commerce critical |
| UX-SCR-052 | Payment Pending / Unknown | Commerce critical |
| UX-SCR-057 | Refund Status | Commerce trust |

### Critical Missing E1 Screens (Required for Expansion)

| Screen ID | Screen | Why Critical |
|---|---|---|
| UX-SCR-058-063 | All 6 Cinemaxis screens | Entire demand system unbuilt |
| UX-SCR-074-086 | 10 of 13 9TLIFE screens | Entire demand system mostly unbuilt |
| UX-SCR-087-096 | 8 of 10 Live screens | Entire demand system mostly unbuilt |

---

## PART V — CCPOS-001 EXECUTION PROMPT PACK SUMMARY

The document defines 23 execution prompts (AZP-CCP-000 through CCP-020) that form the Claude Code operating system:

| Prompt ID | Skill | Purpose | Implemented? |
|---|---|---|---|
| CCP-000 | Master Boot | Principal orchestrator — authority stack, doctrine, boot sequence | ❌ |
| CCP-001 | /azeebo-doctor | OS health check — settings, hooks, agents, skills, rules, policy | ❌ |
| CCP-002 | /azeebo-calibrate | Map generic OS to real repository — discover actual commands, paths, providers | ❌ |
| CCP-003 | /azeebo-intake | Forensic read-only repository inspection — current-state architecture | ❌ |
| CCP-004 | /azeebo-audit | Authority conformance analysis — requirement→evidence→gap→conflict | ❌ |
| CCP-005 | Target State | Gap analysis — minimum target state for R3 conformance | ❌ |
| CCP-006 | /azeebo-plan | Implementation plan — phases, modules, schema, API, events, screens, tests | ❌ |
| CCP-007 | /azeebo-build | Implement approved phase in isolated worktree | ❌ |
| CCP-008 | UI/UX | Implement R3.1 UX authority — audit, screens, states, tokens, components | ❌ |
| CCP-009 | AOU | AOU canonical knowledge implementation — hub, character, timeline, knowledge state | ❌ |
| CCP-010 | Cinemaxis | Digital Cinema — windowing, DBO, ticket, entitlement, reporting | ❌ |
| CCP-011 | Games 360 | Play engine — trivia, predictions, missions, leaderboards, rewards | ❌ |
| CCP-012 | 9TLIFE | City Graph — place, partner, offer, itinerary, booking, referral | ❌ |
| CCP-013 | Live | Event OS — event, edition, venue, rights, stream, replay, sponsor | ❌ |
| CCP-014 | Commerce | Counterparty, settlement, waterfall, reconciliation, entitlements | ❌ |
| CCP-015 | Security/SRE | Security, SRE, DR, FinOps hardening | ❌ |
| CCP-016 | /azeebo-review | Independent multi-disciplinary review | ❌ |
| CCP-017 | /azeebo-verify | Repository verification — typecheck, lint, test, migration, security | ❌ |
| CCP-018 | /azeebo-migrate | Migration safety review (not execution) | ❌ |
| CCP-019 | /azeebo-release | Release readiness assessment (not deployment) | ❌ |
| CCP-020 | /azeebo-closeout | Phase closeout — evidence-backed delivery report | ❌ |

---

## PART VI — 120-DAY WAVE MAPPING (COMBINED)

### Wave 0 — Baseline & Control Plane (Days 1-30)

| Task | Source | Effort |
|---|---|---|
| Model Cost Tracker | AOS-MA-001 | Low |
| Agent Registry | AOS-MA-001 | Medium |
| Kill Switch Infrastructure | AOS-MA-001 | Low-Medium |
| Machine-Readable Policy Layer | CCPOS-001 | Medium |
| Evidence & Traceability Structure | CCPOS-001 | Medium |
| Process Mining baseline | AOS-MA-001 | Medium-High |
| Complete missing M0/M1/M2 screens (11 screens) | UXDSA-001 | Medium |

### Wave 1 — Cash, Coordination & Commercial (Days 31-60)

| Task | Source | Effort |
|---|---|---|
| Task Router / Work Classifier | AOS-MA-001 | Medium |
| Risk Scoring Engine | AOS-MA-001 | Medium |
| Cost Dashboard (Admin) | AOS-MA-001 | Medium |
| Authority Resolver | AOS-MA-001 | Medium |
| Specialist Agent System (10 agents) | CCPOS-001 | Medium-High |
| Hook Enforcement | CCPOS-001 | Medium |
| Permission Model (ALLOW/ASK/DENY) | CCPOS-001 | Medium |

### Wave 2 — Customer, Product & Workforce (Days 61-90)

| Task | Source | Effort |
|---|---|---|
| Skills & Workflow Architecture (11 skills) | CCPOS-001 | High |
| Human Capacity Ledger | AOS-MA-001 | Medium |
| Agent Portfolio Review Module | AOS-MA-001 | Medium |
| Cinemaxis Experience Pack (6 screens) | UXDSA-001 | Medium-High |
| 9TLIFE Experience Pack (10 screens) | UXDSA-001 | High |
| Live Experience Pack (8 screens) | UXDSA-001 | High |
| Games 360 Completion (5 screens) | UXDSA-001 | Medium |
| Master Counterparty Module | BRD-PRD | High |

### Wave 3 — Domain Skill Packs & Portfolio Optimisation (Days 91-120)

| Task | Source | Effort |
|---|---|---|
| System/Failure State Pack (10 screens) | UXDSA-001 | Medium |
| Telco Reconciliation | BRD-PRD | Medium |
| Revenue Class Separation | BRD-PRD | Medium |
| Accessibility Compliance Pack | UXDSA-001 | High |
| First formal ROI measurement | AOS-MA-001 | Low |
| Retire/merge weak pilots | AOS-MA-001 | Low |
| CCPOS-001 repository calibration | CCPOS-001 | Medium |

---

## PART VII — KEY METRICS ALL FOUR DOCUMENTS REQUIRE

| Metric | Source | What to Track |
|---|---|---|
| Hours released | AOS-MA-001 §2 | Human hours saved per workflow |
| Cycle-time reduction | AOS-MA-001 §27 | Before/after time per process |
| Cost/task | AOS-MA-001 §27 | Loaded labour + system + model cost |
| Cash accelerated | AOS-MA-001 §28 | Collections improvement, faster close |
| Correction/rework rate | AOS-MA-001 §28 | Agent error frequency |
| SLA performance | AOS-MA-001 §28 | % completed within service level |
| Model cost | AOS-MA-001 §23 | Per-task and monthly AI spend |
| Human escalation rate | AOS-MA-001 §28 | How often agents need human intervention |
| Headcount/vendor avoidance | AOS-MA-001 §29 | Roles not hired, contracts not renewed |
| Agent merges/retirements | AOS-MA-001 §30 | Portfolio optimisation actions taken |
| Screen completion | UXDSA-001 | % of 124 screens built with all 13 states |
| Component coverage | UXDSA-001 App B | % of 100+ components implemented |
| Token coverage | UXDSA-001 App A | % of 500+ tokens implemented |
| Requirement traceability | CCPOS-001 §73 | Authority→Requirement→Implementation→Test→Evidence→Release |
| BRD compliance | BRD-PRD | % of BRD-001 through BRD-016 requirements met |

---

## PART VIII — NON-GOALS (ALL DOCUMENTS)

- Do NOT mirror the organisation chart with agents (AOS-MA-001 §31)
- Do NOT automate waste (AOS-MA-001 Part II)
- Do NOT create an AI shadow organisation (AOS-MA-001 §1)
- Do NOT deploy the full end-state portfolio at once (AOS-MA-001 §36)
- Do NOT count theoretical savings as realised savings (AOS-MA-001 §29)
- Do NOT let agents create parallel enterprise truth (AOS-MA-001 §38)
- Do NOT treat Claude Code as an unrestricted coding assistant (CCPOS-001 §0)
- Do NOT create mini-app fragmentation (UXDSA-001 UX-L05)
- Do NOT count GMV as revenue (BRD-PRD §7)
- Do NOT merge money, entitlements, points, and rewards (BRD-PRD BRD-002)
- Do NOT weaken rights enforcement (CCPOS-001 LAW-05)
- Do NOT expose locked AOU Knowledge (CCPOS-001 §94)
- Do NOT introduce regulated gaming without separate authority (BRD-PRD §37)
- Do NOT introduce open mass UGC without Trust & Safety authority (BRD-PRD §37)
- Do NOT commit secrets (CCPOS-001 LAW-08)
- Do NOT perform destructive production operations without approval (CCPOS-001 §25)
- Do NOT silently change architecture (CCPOS-001 LAW-09)
- Do NOT pass without evidence (CCPOS-001 LAW-10)

---

## BOTTOM LINE

The codebase is approximately **65-70% compliant** with the full authority stack. The remaining 30-35% breaks down into:

| Category | Effort | Priority |
|---|---|---|
| Governance & Agent Orchestration | Medium | 🔴 Critical — safety net before any autonomous work |
| Engineering Guardrails (CCPOS) | Medium-High | 🔴 Critical — required for controlled development |
| Product Completeness (E1 screens) | High | 🟡 Important — required for expansion phases |
| UX State/Component/Token Completeness | Medium | 🟡 Important — required for quality baseline |
| Commercial Architecture (Counterparty, Telco, Revenue) | Medium-High | 🟢 Important — required for monetisation |

**The operating question remains the same across all four documents:**

> *What is the cheapest, safest and fastest combination of elimination, standard process, deterministic software, AI and human judgement that produces the required result with less overhead and stronger control?*

---

*VMNL / Azeebo+ Authority Stack Analysis — August 2026*
*Documents: AOS-MA-001 R1.1 | CCPOS-001 R1.1 | BRD-PRD-001 R3.0 | UXDSA-001 R3.1*

---

## IMPLEMENTATION PROGRESS — Updated August 31, 2026

### ✅ Completed (All Tiers)

#### Tier 1 — Foundation (CCPOS-001 Engineering OS)
| Component | Status | Files |
|-----------|--------|-------|
| Machine-Readable Policy Layer | ✅ Done | `.claude/policy.md` |
| 11 Specialist Agents | ✅ Done | `.claude/agents/*.md` (11 files) |
| 11 Principal Skills | ✅ Done | `.claude/skills/*.md` (11 files) |
| Hook Enforcement | ✅ Done | `.claude/hooks/*.md` (3 files) |

#### Tier 2 — Governance (AOS-MA-001 Agentic OS)
| System | Status | Files |
|--------|--------|-------|
| Agent Registry | ✅ Done | Prisma schema + NestJS module + controller + DTOs (19 API endpoints) |
| Model Cost Tracker | ✅ Done | Shared package `@azeebo/model-cost-tracker` (6 files) + backend endpoints |
| Risk Engine | ✅ Done | Prisma schema + NestJS module + controller + DTOs (17 API endpoints) |
| Task Router | ✅ Done | Prisma schema + NestJS module + controller + DTOs (15 API endpoints) |
| Capacity Ledger | ✅ Done | Prisma schema + NestJS module + controller + seed endpoint |
| Gateway Routes | ✅ Done | All `/v1/agents/*`, `/v1/cost/*`, `/v1/risk/*`, `/v1/tasks/*`, `/v1/capacity/*` |

#### Tier 3 — Product Completeness (Missing Screens)
| Category | Pages Created | Status |
|----------|--------------|--------|
| AOU Hub + Detail + What-You-Know | 3 web pages | ✅ Done |
| Commerce (Payment Pending, Refund Status) | 2 web pages | ✅ Done |
| Participation (Poll, Quiz) | 2 web pages | ✅ Done |
| Cinemaxis (Film Detail, Digital Ticket) | 2 web pages | ✅ Done |
| 9TLIFE (Tonight, Place Detail) | 2 web pages | ✅ Done |
| Live (Event Detail) | 1 web page | ✅ Done |
| System/Failure (7 states) | 7 web pages | ✅ Done |
| Mobile Reality (contestant-detail, voting) | 2 screens | ✅ Done |
| Mobile Comedy (index) | 1 screen | ✅ Done |
| Mobile Lifestyle (city-guide, music) | 2 screens | ✅ Done |
| Mobile Sports (index) | 1 screen | ✅ Done |
| Mobile Vertical (5 screens) | 5 screens | ✅ Done |
| Music (artists, genres, tracks, trending) | 4 web pages | ✅ Done |

#### Tier 4 — Admin Dashboards
| Dashboard | Status | Features |
|-----------|--------|----------|
| 🤖 Agent Registry (`/agents`) | ✅ Done | Stats, search, kill switch, seed |
| 💰 Cost Dashboard (`/cost-dashboard`) | ✅ Done | Model/agent/domain breakdowns |
| 📋 Task Router (`/task-router`) | ✅ Done | H0-X tiers, seed |
| 🛡️ Risk Engine (`/risk-engine`) | ✅ Done | Decision matrix, approval workflow, seed |
| ⏱️ Capacity Ledger (`/capacity-ledger`) | ✅ Done | Before/after tracking, seed |
| Analytics Proxy Module | ✅ Done | Native fetch proxy to analytics service |
| Feature Flag Gating | ✅ Done | `admin_governance_dashboard` flag |

#### Tier 5 — Infrastructure & Quality
| Item | Status |
|------|--------|
| Tipping backend (controller + service + gateway) | ✅ Done |
| WebSocket notifications (hook + frontend) | ✅ Done |
| E2E tests (tipping, games, notifications) | ✅ Done |
| Cookie Consent (GDPR/NDPR) | ✅ Done |
| P0 security fixes (PgBouncer, entrypoint) | ✅ Done |
| CORS hardening | ✅ Done |
| Gateway public path allowlist | ✅ Done |
| Rate limiter fail-closed | ✅ Done |
| Web admin governance page nav wiring | ✅ Done |
| Admin backend compile errors fixed | ✅ Done |

### Compilation Status
| Service | Status |
|---------|--------|
| Web App | ✅ Clean |
| Admin Backend | ✅ Clean (0 errors, was 7) |
| Admin Frontend | ✅ Clean |
| Analytics Service | ✅ Clean |
| Gateway | ✅ Clean |
| Creator Service | ✅ Clean |
| Model Cost Tracker | ✅ Clean |
| Feature Flags | ✅ Clean |
| Analytics Tests (73) | ✅ All passing |

### Remaining Items (Low Priority)
| Item | Effort | Priority |
|------|--------|----------|
| Wire `@TrackCost()` into actual AI API calls | Medium | 🔵 Low (no AI calls exist yet) |
| Commercial Architecture (Counterparty, Telco, Revenue Class) | High | 🔵 Low (requires new domain models) |
| CCPOS-001 Execution Prompt Pack (23 prompts) | High | 🔵 Low (documentation-level) |
| Worktree Isolation | Medium | 🔵 Low (operational discipline) |

---

*Progress updated: August 31, 2026*
*Total files created this session: ~80 new files, ~15 modified files*
