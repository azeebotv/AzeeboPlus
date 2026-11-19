# Azeebo+ — Comprehensive Architecture & Operational Handover Walkthrough

**Document ID:** AZP-ENG-SYSWALK-2026-v1.0  
**Companion Documents:** `ARCHITECTURE.md`, `CLAUDE.md`, `AZEEBO-PMR-2026-11-04.md`, `docs/program/PROGRAM-RACI.md`  
**Purpose:** Engineering onboarding, technical deputy handover, and single-maintainer bus factor mitigation (R-01 / D-10)  
**Author:** Lead Systems Architect  
**Reviewer:** Technical Deputy Lead

---

## 1. System Abstract & Architectural Principles

Azeebo+ is a modular entertainment operating system serving nine content universes:
1. **Reality** (`reality-service`): Live voting, contestant leaderboards, super-votes, predictions.
2. **Movies / Cinemaxis** (`movie-service`): Catalog, Day-and-Date theatrical premieres, ticketing.
3. **Comedy** (`comedy-service`): Specials, clips, challenges, comedian tipping.
4. **Games** (`games-service`): Tournaments, trivia, leaderboards.
5. **Lifestyle** (`lifestyle-service`): Nightlife, celebrity guides, events, influencers.
6. **Vertical / Agbala** (`vertical-service`): African mythology cinematic storyworlds, lore, quizzes.
7. **Sports** (`sports-service`): Fixtures, highlights, fan contests, predictions.
8. **Live Events / PPV** (`live-event-service`): PPV ticket sessions, backstage chat, live streaming.
9. **Creator Economy** (`creator-service` + `apps/creator`): Video uploads, onboarding, tipping, analytics.

### Core Architectural Invariants
- **Database-per-Service:** 26 isolated PostgreSQL databases; cross-service queries are forbidden.
- **Deny-by-Default Gateway:** `services/gateway/api-gateway` strips untrusted client headers, verifies JWTs, injects `x-user-id` and `x-user-role`, and routes to internal services using an immutable routing manifest.
- **Pessimistic Concurrency on Financial Paths:** `wallet-service` enforces Redis mutex locks (5s) and PostgreSQL `SELECT ... FOR UPDATE` row locks inside interactive database transactions.
- **Client-Supplied Idempotency:** All fund movement (`/wallet/deposit`, `/wallet/withdraw`, `/wallet/debit`, `/wallet/transfer`) requires `X-Idempotency-Key` (UUIDv4).
- **Invariant CI Defense:** ~40 custom scripts defend type safety, route contracts, deployed schema locks, and design-token adherence on every PR.

---

## 2. Directory Structure & Workspace Layout

```
azeebo+/
├── apps/
│   ├── web/           # Next.js 15 / React 19 consumer web application
│   ├── mobile/        # Expo SDK 57 / React Native mobile application
│   ├── tv/            # Expo SDK 57 10-foot TV client
│   ├── admin/         # Vite + React 19 + NestJS operational admin portal
│   └── creator/       # Vite + React 19 + NestJS creator economy portal
├── packages/          # 26 shared packages (ui, design-tokens, auth, security, etc.)
├── services/          # 29 NestJS microservices grouped into core, universes, engagement, operations, intelligence
├── deploy/            # Deployment manifests, all-in-one configs, canary rules
└── scripts/           # Invariant CI gates, seeder tools, and verification scripts
```

---

## 3. Request Lifecycle & Trust Boundary

1. **Edge:** Client connects to `nginx` (TLS termination, rate limiting, security headers).
2. **Gateway (:3013):**
   - Strips any inbound `x-user-*` or `x-internal-*` headers.
   - Verifies JWT bearer token against `JWT_ACCESS_SECRET`.
   - Injects verified `x-user-id`, `x-user-role`, and `x-gateway-secret`.
   - Checks feature flag kill-switches (`gateway_maintenance_mode`).
   - Checks route allowlist when `gateway_endpoint_enforcement=true`.
3. **Upstream Microservice (:3000–:3028):**
   - Validates `x-gateway-secret` matches `GATEWAY_SECRET`.
   - Binds `RolesGuard` to check user permissions against controller decorators.
   - Executes domain logic against its dedicated database.

---

## 4. Key Operational Runbooks & Emergency Procedures

- **Database Backup & PITR Restore:** `scripts/backup-databases.sh` and `scripts/verify-backup-restore.sh`.
- **Emergency Rollback:** `scripts/rollback.sh` reverts the production container image in $<15$ minutes.
- **Host File Descriptor Incident Recovery:** Run `scripts/launchd/service-agents.sh disable` to cleanly clear LaunchAgents without exhausting macOS file descriptors.
- **Live Database Drift Verification:** Run `node scripts/drift-live-db.mjs` to compare all 30 live databases against schema models.
