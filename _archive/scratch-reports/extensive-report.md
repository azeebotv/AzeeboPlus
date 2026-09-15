# Azeebo+ — Extensive Work Report

**Branch:** `Major-Upgrade` · **Dates:** September 7–8, 2026 · **Footprint:** ~127 files changed/untracked

This report covers everything done across the recent working sessions: web crash fixes, backend error-handling hardening, a full Prisma schema↔database drift reconciliation across all 28 services, a new CI migration-drift gate, a platform-wide gateway smoke test, seed data for the bundles compare page, and a platform feature-flag audit.

---

## 1. Web App Crash Fixes & Gateway Routing

### 1.1 `tracks.find is not a function` — `/music`
`MusicTrackList` crashed on render: the service returns `artistName`/`coverImage` while the web `Track` interface expected `artist`/`thumbnail`, and endpoints return paginated `{items}` envelopes rather than bare arrays.

- Built a shared normalizer (`apps/web/src/lib/music.ts`, new) that unwraps envelopes and maps field names.
- Updated all music pages (`/music`, tracks, artists, genres, trending) and `MusicTrackList.tsx` to consume the normalized shape.

### 1.2 `universesQuery.data.find is not a function` — `/sports`, `/comedy`, `/games`
Same class of bug: universe queries returned an envelope, pages called `.find` on it directly.

- Fixed `useUniverses` hook and the sports/comedy/games pages.
- Verified `api.universe.getUniverses()` → `/api/v1/public/universes` path and the `gatewayPath` transform in `base.ts`; `base-client.test.ts` updated.

### 1.3 Admin app 502s (`/api/v1/admin/feature-flags` etc.)
Root cause: gateway forwarded `/admin/feature-flags` but the admin backend serves URI-versioned `/v1/admin/...`.

- Fixed both `pathRewrite` sites in the gateway proxy controller; admin app requests now resolve. Also touched `start-all.sh`.

---

## 2. Error-Handling Hardening (the "preferences bug" class)

Audited all NestJS services for catch-all handlers that convert internal failures into 4xx responses (the bug where an upstream/DB error was surfaced as a client's "preferences not found" 404).

- **New shared module:** `packages/security/src/error-mapping/` (`error-mapping.ts` + spec) — `mapErrorToHttpException` / `mapAndThrow`: rethrows `HttpException` unchanged; maps axios upstream errors by status; Prisma P2025 → 404; unknown errors → 500 (never 4xx).
- Exported from `packages/security/src/index.ts`; adopted in services (e.g. user-service admin module, support, moderation).
- Verified typecheck + the new unit spec.

## 3. JWT Secret Alignment

Aligned `JWT_ACCESS_SECRET` (and related gateway/auth secrets) across gateway, auth-service, and user-service env files so restarted processes authenticate identically to the running set. Restarted processes now verify tokens the same way the live ones do.

## 4. Prisma Drift Reconciliation — 28/28 Services Clean

Ran `prisma migrate diff` (live DB → schema) for every service. Started at **7 clean / 21 drifted**, ended **28 clean**. Every destructive change was reviewed against real row counts before applying; all dropped data was archived to an `archive` schema first.

| Service | Drift | Resolution |
|---|---|---|
| **auth** | Naive diff would have recreated the role enum, dropping a user's `moderator` role | `moderator` is live in runtime code (`@Roles('moderator')` in content-service) — **added `moderator` back to the schema enum** (the DB was right). Also unblocked two legacy failed migration rows whose statements were verified already present, then applied `registered_devices` + password default (`20260908140000_*`) |
| **support** | `senderType` TEXT with lowercase values vs new enum; NOT NULL `updatedAt` adds | Hand-written `20260908142000_*`: value-mapping copy (`user`→USER, `admin`→AGENT per controller logic), temporary DEFAULT backfill on the 3-row table, then default drop |
| **media** | Diff would have dropped `filename`/`mimetype`, losing the 4 rows' data | True **renames** (`filename`→`fileName`, `mimetype`→`mimeType`) + safe INT→BIGINT widening (`20260908143000_*`); data verified intact after |
| **recommendation** | 25 cross-domain fossil tables (wallets, badges, missions, refunds…), all 0 rows | `20260908144000_retire_cross_domain_fossils`: archive-then-drop with existence-checked constraint drops; a second follow-up aligned the kept fossil tables' column shapes (all empty). Two stale blocking issues fixed along the way (failed empty init resolved; nonexistent FK name made `IF EXISTS`) |
| **notification** | 7 cross-domain fossil tables; `users` held 6 real rows | `20260908150000_retire_fossil_domain_tables`: archived (`archive.users_20260908` = 6 rows) before dropping; service's own FKs into fossil `users` removed |
| **vertical** (the big one) | 37 PascalCase legacy tables → snake_case universe-centric tables, with real data | **All 32 rows preserved**: `Storyworld` row seeds the `universe_maps` anchor; AgbalaTitle(6)→titles, AgbalaCharacter(10)→characters, AgbalaRealm(5)→realms, AgbalaOrisaFile(5)→orisa_files; legacy-only columns merged into each row's `data` JSONB. The 873-line migration was **dry-run in a transaction first** (caught an ambiguous-column bug before it touched the DB), then deployed. 0 legacy tables remain |
| **content + wallet** | Metadata-only (index drop, DEFAULT drops, 3 FK adds — 0 orphans verified; ledger id default on 0 rows) | Applied directly. Note: content-service had **no `.env`**, which is why it kept appearing drifted — applied via explicit URL |
| **user** | user_profiles/user_roles tables, dropped users columns | Safe additive `20260908113000_user_schema_sync` + `20260907134500_add_feature_preferences` |
| **payment, engagement, messaging, referral, moderation, queue, comedy, games, movie, sports** | Additive/column-shape residuals | Generated `*_drift_sync` migrations (202609081300xx–142001) |

**Integrity checks:** `_prisma_migrations` history has **zero unresolved failures** anywhere (every unfinished row carries `rolled_back_at`); auth's Prisma client regenerated after its schema edit. The `archive` schemas in recommendation/notification/vertical hold everything dropped — recoverable with plain SQL.

## 5. CI Gate: Migrations ↔ Schema Drift

**`scripts/check-prisma-migrations.mjs`** (new, follows the `scripts/check-*.mjs` convention):
- Per service: creates a throwaway shadow DB, **replays the full `prisma/migrations` chain** (exactly what `migrate deploy` does on a fresh environment), diffs against `schema.prisma`.
- Fails on **DRIFTED** (replay ≠ schema; diff written to `.check-prisma-drift-out/` as CI artifact) or **BROKEN** (migrations can't replay from empty). `--update-baseline` escape hatch.
- Resolves each service's own pinned Prisma CLI.

**Getting the gate green surfaced and fixed 9 genuinely broken chains:**

| Class | Services | Fix |
|---|---|---|
| Missing `migration_lock.toml` | knowledge, media, live-event | copied lock file |
| Migrations never created base tables (empty init / hand-created DBs) — fresh deploys would fail | content, search, reward, recommendation, lifestyle, vertical | **squashed** each chain to a full-schema init under the original `20240101000000_init` name (live DBs skip by record); historical folders kept at `prisma/migrations-legacy/` |
| Chain never produced schema shape | auth (role enum incl. `moderator`), wallet (`balance_snapshots.id` default), creator (`settings` column + `users.updatedAt` default) | hand-written **idempotent** reconciliation migrations (`20260908153000/153100/153200_*`), also applied to live DBs |

**Wiring:** `prisma-migrations` job in `.github/workflows/ci.yml` (merge gate) + `prisma-migrations-pr` in `pr-checks.yml` (PR gate, added to `build-pr` needs), both with the repo's standard postgres:15 service container + `pnpm install --frozen-lockfile`. Root alias `pnpm run check:prisma-migrations`; artifact dir gitignored.

**Verification:** full sweep **28 checked · 28 clean · 0 drifted · 0 broken**, exit 0; negative test (unreachable shadow host) exits 1 with a clear error; both YAMLs parse clean.

## 6. Gateway-Wide GET Smoke Test

**`scripts/smoke-gateway-get.mjs`** (new, zero new deps):
- **Route source of truth:** imports `SERVICE_CONFIGS` from the gateway's proxy registry (dist, or a TS-source fallback parser when dist isn't built — parser verified to match dist across all 38 services).
- **Dev tokens:** mints HS256 JWTs locally with `JWT_ACCESS_SECRET` (`iss: azeebo-auth`, `aud: azeebo-api`) — `user` token for normal routes, `admin` token for admin-scoped routes.
- **Hits** every concrete GET route (`/api/v{defaultVersion}/{service}{path}`) — 198 routes across 32 services. Parametrized routes skipped (no fixtures for `:id`), routes behind `gateway_new_routes` skipped, `SMOKE_SKIP_SERVICES` excludes out-of-scope apps (admin/creator frontends).
- **Fails** on any 5xx, connection failures/timeouts, or a token-rejection guard (>50% 401s = misconfigured token, run tested nothing). Legitimate 4xx empty-DB responses are reported, not failed.
- **False-positive protection:** concurrency 2 (a parallel blast exhausts dev Postgres's 100 slots), up to 2 retries with 5s spacing to ride out the gateway's 60s circuit-breaker cooldown.

**Bugs it caught on first runs:**
1. `GET /api/v1/games/trending` 500ing every call — games-service included `questions` on `Challenge` while its running instance held a **stale Prisma client** generated before that relation existed. Fixed by regenerating the client, rebuilding, restarting (runtime env recovered from a sibling process). Now 200.
2. Environmental: the earlier parallel run left all 28 services holding ~97 idle Postgres connections (max 100), locking out even `psql`. Drained as superuser; the smoke test's default concurrency prevents recurrence.

**Wiring:** `pnpm run smoke:gateway`; added as a step in the `all-in-one-smoke` job (dockerized-e2e workflow), running after the container is healthy with the same boot-time secrets.

**Final live verification:** 198 routes · 112 healthy · **0 × 5xx** · 0 conn-fail · 86 tolerated 4xx — exit 0. (The 4xx report also surfaced ~40 dead registrations the upstreams no longer serve — `/v1/analytics/funnel`, `/v1/rewards/levels`, lifestyle `/saved`, etc. — worth deleting.)

## 7. Seed Data: `bundle_passes` for the Bundles Compare Page

**`scripts/seeders/subscription-seeder.ts`** (new, follows existing seeder conventions — service-local Prisma client at `src/prisma/client`, `printCount`, `--dry-run`, upsert idempotency):

| id | name | tier | price | original | discount | universes |
|---|---|---|---|---|---|---|
| `entertainment` | Entertainment Bundle | standard | 2100 | 3000 | 30% | reality, comedy, movies |
| `creator-pack` | Creator Pack | premium | 1500 | 2000 | 25% | creator, lifestyle |
| `all-access` | All Access | ultimate | 4800 | 8000 | 40% | all 8 |
| `sports-games` | Sports & Games | standard | 1400 | 2000 | 30% | sports, games |

- Mirrors `BUNDLE_PRESETS` in `apps/web/src/app/bundles/page.tsx` / mobile equivalent, so the API returns what the UI was designed around. Stable string ids keep `/bundles/[id]` deep links deterministic; tiers/universe-ids match the page's filter and `UNIVERSE_NAMES`.
- **Cache-aware:** `getBundles()` caches in Redis 300s under `subscription:bundle:passes`; the seeder scans and deletes that key after writing.
- Registered in `scripts/seed-all.ts` as step 9 (`--service subscription`).
- **Verified end-to-end:** `GET /api/v1/subscription/bundles/compare` through the gateway → 4 bundles, `individualTotal: 15000`, `bundleSavings: 5200`; page's `Number(bundle.price)` already handles Decimal-as-string; second run leaves exactly 4 distinct rows.

## 8. Feature Flags: `reward_streaks` Enabled + Platform Audit

### 8.1 Enable
- reward-service gates `GET /rewards/streak` via `@FeatureFlag(rewardFlags.streaks)` (403 when off); `checkIn()` checks the same flag in code (returns "Streaks disabled", `current: 0`).
- Enabled via the platform's intended ops path: Redis override `feature_flags:reward_streaks → {"enabled":true,...}` (same mechanism as the two pre-existing dev enables, `reward_missions`/`reward_badges`). Services pick it up within the 30s eval cache; no deploy.
- **Verified:** `{"success":true,"data":{"streak":{"current":0,...}}}` through the gateway for a seeded reward-account user (was 403 before).
- **Note:** the module default in `reward-service/src/app.module.ts` is still `false` — the Redis override holds the runtime enable. Flip the default for permanence across environments.

### 8.2 Platform-wide flag audit (~150 registered flags, ~90 evaluating OFF)
Key findings, by surface:
- **Client page gates (FlagGate/redirect or null-render):** admin `/overview` (`admin_new_dashboard`), admin `/reports/builder` (`admin_report_builder`), creator `/analytics` (`creator_new_analytics`), creator `/payouts` (`creator_payouts_ui`), web homepage rails (`web_new_home`, `web_recommendations_rail`), web banner/upsell, mobile homepage rails (`mobile_new_home`), mobile biometrics.
- **Universe endpoints 403 while off:** lifestyle events/city-guide/nightlife/influencer-verification; movie cinema-pass/watchlist-sync; vertical crossovers/lore-ai/storyworlds-create; sports fan-contests/odds-feeds; games tournaments/trivia-ai/seasonal-leaderboards; comedy challenges; reality live-voting; live-event tickets/chat; creator tips/subscriptions/insights.
- **Core flows behind off-flags:** wallet transfers; payment self-service refunds/new checkout/intents; user follow system (4 endpoints)/profile v2/universe affinity/privacy v2; search faceted + typo tolerance; messaging receipts/typing/media sharing; content comments v2 + premium gate; notification digest + preferences v2; subscription free trial + promos; reward double-points; auth MFA-TOTP/magic-link/device-limits.
- **Universe nav sentinels:** all 9 (`universe.<slug>.enabled`) ON.
- **Bug found:** mobile `AuthenticatedHomepage.tsx:37-38` reads `mobile_new_home` for *both* `showRecommendationsRail` and `showNewHomeRails` — web's equivalent reads two distinct flags. Likely copy-paste bug.
- **Dead flag:** `subscription_bundles` is registered (default off) but never evaluated anywhere — bundle endpoints aren't gated.
- Live cross-check via gateway `/feature-flags/bootstrap` (23 public keys) matches the module-default map exactly.

## 9. Current Repository State

- **Branch:** `Major-Upgrade`, 127 changed/untracked files, **nothing committed** (per no-commit default).
- **New files** include: `scripts/check-prisma-migrations.mjs`, `scripts/smoke-gateway-get.mjs`, `scripts/seeders/subscription-seeder.ts`, `apps/web/src/lib/music.ts`, `packages/security/src/error-mapping/`, ~30 new/renamed migration folders (incl. `*_drift_sync`), `migrations-legacy/` archives for 5 services, 3 `migration_lock.toml` files.
- **Modified:** CI workflows (ci.yml, pr-checks.yml, dockerized-e2e.yml), `package.json`, `.gitignore`, web music/sports/comedy/games/universe pages, gateway proxy controller + `app.module`, `seed-all.ts`, auth schema + services, content/media/upload services.
- **Operational notes:**
  - Running service instances should be restarted to pick up regenerated Prisma clients (vertical's especially — its old client references dropped PascalCase models).
  - `subscription-service/.env` still carries the `change-me-in-production` DB password placeholder; worth aligning with the other services.
  - The `archive` schemas hold all dropped data; `prisma/migrations-legacy/` holds the pre-squash chains.
- **Deploy-safety posture:** all 28 services' migration chains replay from empty; migration history has zero unresolved failures; the two new CI jobs block any future drift from merging.

## 10. Recommended Next Steps

1. **Restart services** to load regenerated Prisma clients (vertical first).
2. **Fix the mobile homepage flag bug** (`mobile_new_home` double-read).
3. **Clean up the dead `subscription_bundles` flag** (wire it or remove it).
4. **Delete ~40 dead route registrations** surfaced by the smoke test.
5. **Flip `reward_streaks` module default** if the enable should be permanent.
6. **Align subscription-service `.env`** DB credentials with the rest of the stack.
7. Consider committing the work in reviewable slices (web fixes / migrations / CI tooling / seeds) — say the word and it'll be staged accordingly.
