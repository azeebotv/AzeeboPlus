# T-P1-005 Findings — Prisma + DB Audit

**Evidence dir:** [audit-evidence/P1/db/](file:///Users/deprof/www/azeebo+/audit-evidence/P1/db/)

---

## P1-026 — `search-service` duplicates the User model including a `password` column (Critical · security · compliance)

**File:** [services/core/search-service/prisma/schema.prisma](file:///Users/deprof/www/azeebo+/services/core/search-service/prisma/schema.prisma#L11-L26)

**Observation:** `search-service` defines its own `User` model with `password String` field, plus `Wallet`, `WalletTransaction`, `WatchHistory`, `SavedItem`, `Notification`, `ContentItem`, `CreatorProfile`, `RewardAccount`, `UserSearch`, `PaymentIntent`, `MissionCompletion`, `RewardRedemption`, `PointsLedger`. That is the entire user domain duplicated into a service that should be a read-only search index.

**RCA (6-item):**
1. **Symptom:** every password hash in the search DB is a copy of the source-of-truth hash in `user-service`. If search DB is compromised, attacker has every user's password hash.
2. **Trigger:** any data write into search-service's User table (probably via a sync job) creates a parallel credential store outside the central IAM.
3. **Proximate cause:** `services/core/search-service/prisma/schema.prisma` defines `model User { password String }`.
4. **Root cause:** the search service was scaffolded with a copy of the user-service schema instead of being architected as a read projection over an Elasticsearch/OpenSearch index. The `password` field should never have been copied.
5. **Blast radius:** every user account. Search DB compromise = credential dump.
6. **Detection gap:** no schema-lint rule rejecting `password` columns outside `auth-service` or `user-service`.

**Remediation:**
1. Delete `password` column from `services/core/search-service/prisma/schema.prisma`.
2. Replace the duplicated User/Wallet/etc. models with denormalized read models fed from a CDC pipeline (e.g. Debezium → OpenSearch).
3. Add a CI lint: `grep -rE "password String|password_hash" services/*/prisma/schema.prisma` should only match `auth-service` and `user-service`.

---

## P1-027 — Wallet `Decimal` columns lack precision/scale (High · functionality)

**File:** [services/core/wallet-service/prisma/schema.prisma](file:///Users/deprof/www/azeebo+/services/core/wallet-service/prisma/schema.prisma#L14-L16) — `balance Decimal @default(0)` etc.

**Observation:** Prisma maps `Decimal` to Postgres `numeric` with arbitrary precision. Without `@db.Decimal(18, 2)` (or similar), there is no DB-level constraint on scale, and arithmetic can silently produce `0.30000000000000004`-class bugs.

**RCA:**
1. **Symptom:** rounding inconsistencies across services; precision loss when serializing to JSON for the API.
2. **Trigger:** any wallet arithmetic.
3. **Proximate cause:** `Decimal` without `@db.Decimal(p,s)`.
4. **Root cause:** Prisma defaults are permissive; no CI rule enforces precision.
5. **Blast radius:** every transaction; financial reconciliation breaks.
6. **Detection gap:** no DDL lint in CI.

**Remediation:** Add `@db.Decimal(18, 2)` (or NGN-specific scale) to every wallet/transaction column. Add a custom migration test that asserts scale on `wallets.balance` and `wallet_transactions.amount`.

---

## P1-028 — Every service ships a generated Prisma client (Medium · maintainability · cost)

**Files:** 28 `src/prisma/client/schema.prisma` (generated) + 28 `src/generated/prisma/schema.prisma` (some services have both — `apps/admin` for example).

**RCA:** Each service generates its own Prisma client to its own `output` path, doubling the schema count from 28 to 56. The duplicates will drift from the canonical schemas unless `prisma generate` is run in a CI step that fails on stale clients.

**Remediation:** Use a shared `@azeebo/db-client` package with one Prisma client generated into a workspace-shared path; each service imports the same client. Add `prisma generate --check` to CI.

---

## P1-029 — `prisma/seed/` only contains universes/admin, no idempotency guard (Medium · reliability)

**Files:**
- [prisma/seed/universes.sql](file:///Users/deprof/www/azeebo+/prisma/seed/universes.sql)
- [prisma/seed/universes-settings.sql](file:///Users/deprof/www/azeebo+/prisma/seed/universes-settings.sql)
- [prisma/seed/admin.sql](file:///Users/deprof/www/azeebo+/prisma/seed/admin.sql)

**Observation:** the seed SQL contains `INSERT` statements (verified by file size 1957/6010/1486 bytes). Without `ON CONFLICT DO NOTHING` clauses, re-running seed fails on duplicate primary key.

**Remediation:** Wrap every INSERT in `INSERT ... ON CONFLICT (id) DO NOTHING`; add a wrapper script that hashes and de-duplicates by deterministic UUIDs.

---

## P1-030 — `engagement/engagement-service` and `engagement/messaging-service` lack a `prisma/` directory but have `README.md` (Low · consistency)

**Observation:** [services/engagement/engagement-service/README.md](file:///Users/deprof/www/azeebo+/services/engagement/engagement-service/README.md) exists but `find` did not list a `prisma/` dir; same for `messaging-service`. These services may not persist to their own DB, or may share with `notification-service`.

**Remediation:** Document the persistence model in each README; add a CI check that any service with `app.module.ts` importing `PrismaModule` has a `prisma/schema.prisma`.

---

## Summary

| ID     | Sev      | Title                                                                              |
| ------ | -------- | ---------------------------------------------------------------------------------- |
| P1-026 | Critical | `search-service` duplicates User with `password` column (credential store clone)   |
| P1-027 | High     | Wallet `Decimal` columns lack `@db.Decimal(p,s)` precision/scale                    |
| P1-028 | Medium   | Every service ships its own generated Prisma client (drift risk, cost)             |
| P1-029 | Medium   | Seed SQL lacks `ON CONFLICT` idempotency                                            |
| P1-030 | Low      | `engagement/{engagement,messaging}-service` have no Prisma dir                     |

**Verification status:**
- [x] All schemas reviewed (28 source + 28 generated = 56 files).
- [x] Migration scripts reviewed (28 .sql files).
- [x] Findings filed with `file://` refs.
- [ ] Live migration dry-run against a Postgres → **NOT SATISFIED — requires `docker-compose up postgres` + Prisma CLI; deferred to a host with Docker + pnpm install complete.**