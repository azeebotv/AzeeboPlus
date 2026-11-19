# Architecture Split Plan: `azeebo_creator` Co-Tenancy Separation

> **Status:** Approved Post-Launch Architecture Initiative (AD-01, R-08)  
> **Target Execution Window:** Q2 2027 (Post-Launch Hardening Phase)  
> **Owners:** Lead Database Administrator & Creator Engineering Leads

---

## 1. Executive Summary & Context

During the Azeebo+ Program Milestone Review (PMR-2026-11-04), Architecture Debt `AD-01` was formally catalogued:
- The database `azeebo_creator` is currently co-tenanted by two separate operational owners:
  1. `services/universes/creator-service` (the backend domain microservice)
  2. `apps/creator` (the creator web dashboard and client-side NestJS gateway)
- This co-tenancy accounted for 75 of 91 baseline drift statements due to dual Prisma schemas managing overlapping tables and divergent indices.
- **Decision:** Co-tenancy is accepted for the January 31, 2027 launch under an immutable migration lock (`scripts/drift-live-baseline.json`). This plan outlines the post-launch architectural migration to isolate data domains into separate dedicated databases.

---

## 2. Target Architecture

```
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│ services/universes/creator-svc  │        │          apps/creator           │
│   (Creator Domain Service)      │        │       (Creator Portal)          │
└────────────────┬────────────────┘        └────────────────┬────────────────┘
                 │                                          │
                 ▼                                          ▼
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│     DB: azeebo_creator          │        │   DB: azeebo_creator_portal     │
│   (Core Creator Profiles,       │        │   (Portal Sessions, Drafts,     │
│    Analytics, Challenges)       │        │    UI Settings, Local Queues)   │
└─────────────────────────────────┘        └─────────────────────────────────┘
```

---

## 3. Table Ownership Allocation Matrix

| Table Name | Target Database Owner | Rationale |
|------------|-----------------------|-----------|
| `CreatorProfile` | `azeebo_creator` | Canonical domain identity; consumed across platform universes |
| `CreatorTier` | `azeebo_creator` | Core revenue and platform tiering rules |
| `CreatorChallenge` | `azeebo_creator` | Shared gamification system |
| `ChallengeSubmission`| `azeebo_creator` | Public participant submissions and judging data |
| `CreatorAnalytics` | `azeebo_creator` | Aggregated telemetry data from analytics pipelines |
| `CreatorPortalSession` | `azeebo_creator_portal` | Web session and browser authentication state |
| `ContentDraft` | `azeebo_creator_portal` | Unsubmitted staging media metadata |
| `CreatorUiPreference` | `azeebo_creator_portal` | Client-specific layout, pinned tools, and theme states |
| `CreatorNotificationDraft` | `azeebo_creator_portal` | Draft broadcast messages prior to queue dispatch |

---

## 4. Phased Execution Roadmap

### Phase 1: Pre-Migration & Schema Isolation (Week +4 Post-Launch)
1. Provision target RDS/PostgreSQL instance `azeebo_creator_portal`.
2. Generate isolated Prisma schema in `apps/creator/prisma/schema.prisma` containing only portal-owned models.
3. Configure dual database connections in `apps/creator` using `@nestjs/common` multi-database modules.

### Phase 2: Dual-Writing & Data Synchronization (Week +6 Post-Launch)
1. Run initial data export/import script migrating portal-owned historical records.
2. Enable dual-writing with shadow verification logging for 14 days.
3. Assert 100% data consistency and zero latency regression.

### Phase 3: Cutover & Schema Pruning (Week +8 Post-Launch)
1. Switch `apps/creator` read queries exclusively to `azeebo_creator_portal`.
2. Prune deprecated portal tables from `services/universes/creator-service/prisma/schema.prisma`.
3. Drop the 75 baseline drift suppressions from `scripts/drift-live-baseline.json`.
4. Close Architecture Debt `AD-01`.
