# Feature Flag Implementation Plan — Azeebo+ Platform

> **Audit date:** 2026-08-10 · **Scope:** all 28 services, 4 frontends, 22 shared packages, gateway, infra
> This document is a *plan* — no code changes are included.

---

## 1. Current State Assessment

### 1.1 Two disconnected flag systems exist

| System | Backend | Managed by | Read at runtime by | Flags today |
|---|---|---|---|---|
| `@azeebo/feature-flags` (Redis) | Redis keys `feature_flags:<key>` | (No admin UI writes to it) | **content-service only** (`content_moderation_enabled` in `publishContent`) | 1 checked |
| `UniverseFeatureFlag` (Postgres) | `universe_feature_flags` table | Admin UI (`/feature-flags` route + `universe-management` module) | **Nothing** — only the admin backend itself (`checkFeatureFlag`) | seeded per universe |

Per-universe flags keep their expiry in `metadata.staleAfter`. The admin per-universe page (`/feature-flags` route) mirrors the global page's lifecycle affordances: every row has a **stale-after expiry editor** (date input + Set expiry / Clear expiry, full-metadata PUT that re-publishes to Redis), a **'stale · past expiry' badge** with the expiry date in its tooltip, and the header counts stale flags — the sweep (`StaleFlagSweepService`) **covers universe flags too** (owner from `metadata.owner` → `FLAG_OWNER_EMAILS`/ops-digest fallback, same `flag-stale` email with a universe scope line, `metadata.staleNotifiedAt` stamped on success so repeat sweeps skip; the badge shows 'stale · notified/un-notified' for both kinds). Auto-*removal* (prune) remains global-only.

Critical gaps found:

1. **The admin UI toggles DB flags that services never read.** `apps/admin` writes to the `azeebo_admin` database; `content-service` writes a *separate* `universe_feature_flags` table in `azeebo_content`. Neither is consulted by the Redis-backed `FeatureFlagService` that services would actually call. An operator toggling "voting_enabled" in the admin UI changes nothing at runtime.
2. **Only one real flag is evaluated in the whole platform** (`content_moderation_enabled`). Everything else — payments, wallets, OAuth, subscriptions, AI features — ships hardcoded.
3. **`FeatureFlagModule.register({})` is imported twice in content-service** (`app.module.ts` + `content.module.ts`), creating two Redis clients.
4. **`FeatureFlagGuard` trusts the client.** It reads `x-feature-flag` from the request header; if the header is absent the guard allows. That means a client can *probe any flag* and is never denied by default — inverted semantics for a kill-switch.
5. **Every `isEnabled()` is a synchronous-feeling Redis round-trip** — no local cache/TTL, so a hot path (feed render, search) could hammer Redis.
6. **No flag lifecycle**: no expiry, no ownership metadata, no audit trail of toggles, no metrics on evaluation, no cleanup convention.
7. **No client-side delivery.** Frontends (web/mobile) have no way to receive evaluated flags; they currently hardcode UI features and use localStorage for low-data mode only.

### 1.2 What the Redis package already does well

- Percentage rollouts with **deterministic per-user hashing** (`sha256(userId:key) % 100`)
- User-targeted allowlists (`userIds`)
- Sensible production guard (requires `FEATURE_FLAG_REDIS_URL`)
- `FeatureFlagGuard` + `FeatureFlagModule.register()` NestJS wiring
- `getAllFlagsWithDefaults()` for admin listing

---

## 2. Infrastructure Upgrades (do these first — everything else depends on them)

### 2.1 Unify the two systems
- Make **Redis the single runtime source of truth**. Keep `UniverseFeatureFlag` in Postgres as the *management layer* (per-universe scoping, ownership), and **bridge**: admin writes → publish to Redis (`feature_flags:<universe>.<key>`) + bump an audit log. Services evaluate `feature_flags:<universe>.<key>` with `defaultFlags` fallback.
- Alternatively, add a `scope` field (`global | universe:<id> | user:<id>`) to the Redis flag schema so per-universe and global flags live in one store.

### 2.2 Add a caching layer to `FeatureFlagService`
- Cache evaluated results for 30–60s in-process (or a small `Map` with TTL) with invalidation on `setFlag`/`enableFlag`/`disableFlag`/`deleteFlag`. Saves a Redis call per evaluation on hot paths. **The bootstrap path is cache-aware too**: `listFlags()` (the full-flag snapshot behind `getPublicFlags`) serves from an in-process list cache (`listCacheTtlMs`, default 30s, invalidated on every write) instead of a scan + per-key gets, so repeated bootstrap calls hit the snapshot — `flag_list_cache_hits_total{service}` / `flag_list_redis_reads_total{service}` expose the list hit ratio (see `docs/MONITORING.md`, plus `scripts/flag-eval-load-test.local.mjs` for a k6-free real-Redis re-run).
- Expose `getFlags(keys: string[])` batch API for bootstrap endpoints.

### 2.3 Typed flag registry (compile-time safety)
- Per service, export a typed constants object, e.g. `content.flags = { moderationEnabled: 'content_moderation_enabled', aiTags: 'content_ai_tags' } as const` (mirrors `packages/shared-types`). Prevents typos and enables IDE refactors, docs generation, and an automatic admin "known flags" list.

### 2.4 Fix `FeatureFlagGuard` semantics
- Add a `@FeatureFlag('key')` decorator so guards are **explicit and deny-by-default**: when the decorator is present, the route 404s/403s unless the flag is on. Drop reliance on the client-supplied header for authorization-style gating (keep header only for opt-in experimentation on public endpoints).

### 2.5 Client-side flag delivery
- Add `GET /feature-flags/bootstrap` (gateway → Redis, per-user evaluation with rollout hashing, returning only *public-safe* flags) consumed by web/mobile at app boot. Store in a small client package (`packages/feature-flags` gains a browser bundle; `analytics-sdk` reads it for event sampling).
- All client flags must be marked `isPublic` in metadata — never expose internal flags.

### 2.6 Flag lifecycle & governance
- Schema additions: `owner`, `staleAfter` (expiry), `isPublic`, `auditEvents[]`, `lastToggledBy`.
- Audit: reuse the existing `AuditModule`/`audit_logs` infrastructure to record every create/update/toggle (who, when, old→new).
- Metrics: every service emits `flag_evaluation_total{service,key,result}` and `flag_toggled_total{service,key,value}` via the shared `@azeebo/flag-metrics` package (all 28 services wired — see `docs/MONITORING.md`). The `service` label enables per-service dashboards from one Prometheus; the Grafana dashboard (`services/gateway/api-gateway/prometheus/grafana-dashboard.json`) has a `$service` template variable. payment/queue/search serve these at `/flag-metrics` (they own `/metrics`); everyone else at `/metrics`.
- Conventions: `*_enabled` flags **default true** (they are kill-switches); new-experiment flags default **false**. Rollout ramp policy: 0% → 10% → 50% → 100% with a monitoring gate.
- **Cleanup process:** flags should carry a "remove after 2 sprints" convention; the admin UI lists stale flags (`GET /admin/feature-flags/stale`) and the Global Flags page has a one-click **Prune stale flags (N)** action — `POST /admin/feature-flags/prune-stale` (optional `{keys}` restrict to the confirmed subset) archives each flag's last-known state to the audit log before the hard delete, skips anything not actually past `staleAfter`, isolates per-key failures (`skipped` in the summary), and returns `{removedCount, removedKeys, archivedCount, skipped}`. **Nightly pass** (`StaleFlagNightlyService`): once per 24h (poll gate, unref'd — runs once at boot to catch up after restarts) it runs the owner sweep first, then **optionally auto-prunes** past-expiry flags — global via `STALE_FLAG_AUTO_PRUNE`, universe via the separate `STALE_FLAG_AUTO_PRUNE_UNIVERSE` knob (both default off), each archived before removal with `actorId: 'system'` — and posts a Slack-compatible summary to `STALE_FLAG_OPS_WEBHOOK_URL` (`STALE_FLAG_OPS_CHANNEL` override; fail-open — a failed post is reported, never thrown; no webhook → summary logged). The summary now covers **both scopes** (per-flag rows with owner + days-past-expiry + notified state, and separate `Auto-prune (global)` / `Auto-prune (universe)` outcome lines), and the `feature_flag.stale_nightly` audit entry records `staleCount` + `universeStaleCount` + `autoPruned` + `autoPrunedUniverse`. Manual trigger: `POST /admin/feature-flags/stale-nightly/run`. **Universe dry-run preview**: `STALE_FLAG_DRY_RUN_UNIVERSE=true` (or `?dryRun=1` on the manual trigger) previews the universe prune — the pass computes and reports exactly what would be removed (`removedKeys` dot-joined, same shape as a real prune) without deleting anything, and dry-run always wins over auto-prune, so ops can review the candidate list before enabling the knob. The summary line reads `Dry-run (universe): would remove N` (with a hint about the auto-prune knob state), and the audit entry records `autoPrunedUniverse: 0` + `wouldPruneUniverse: N` + `dryRunUniverse: true` so the trail never reads as a real prune. **No-silent-removal guard**: auto-prune **fails closed** — if either `STALE_FLAG_AUTO_PRUNE` / `STALE_FLAG_AUTO_PRUNE_UNIVERSE` is on but `STALE_FLAG_OPS_WEBHOOK_URL` is unset, the prunes are **blocked** (nothing is removed), the startup log and the pass both emit `logger.error` lines, a dedicated `feature_flag.nightly_misconfigured` audit entry is written (`reason: 'no-webhook'`, which scopes are armed, stale counts), the summary text reads `prune BLOCKED to prevent silent removal`, and the `stale_nightly` entry + last-run response carry `pruneBlocked: 'no-webhook'` (the Global Flags panel shows an amber **⚠ prune blocked · no webhook** chip). `STALE_FLAG_ALLOW_PRUNE_WITHOUT_WEBHOOK=true` is the explicit opt-out that restores log-only pruning. **Last-run status**: `GET /admin/feature-flags/nightly/last` returns the most recent pass straight from the audit log — `ranAt`, global/universe stale counts, notified count, pruned counts (or the dry-run would-prune count), and webhook status — and the Global Flags page renders it as a compact **Last nightly pass** panel (polled every 60s), so ops sees the job actually ran without opening logs. **Automated owner notification**: the admin backend's `StaleFlagSweepService` runs at boot + every `STALE_FLAG_SWEEP_INTERVAL_MS` (default 6h) and emails each flag's owner when its `staleAfter` passes — recipients from `FLAG_OWNER_EMAILS` (owner→email JSON map) with an `STALE_FLAG_NOTIFY_EMAIL` ops-digest fallback, sent through the notification-service's transactional endpoint (`template: 'flag-stale'`, registered in `EMAIL_SUBJECTS` + `EmailService` handlebars templates). Each flag is notified exactly once (`staleNotifiedAt` stamped on success — the admin UI shows 'stale · notified/un-notified'); failed sends stay unstamped and are retried next sweep; no-recipient dev runs stamp + audit instead of spamming. Manual trigger: `POST /admin/feature-flags/stale-sweep/run`. **Universe flags are covered by the same sweep**: per-universe expiries (`metadata.staleAfter` on `universe_feature_flags`) are read via `UniverseManagementService.getAllFeatureFlags()`, owner resolved from `metadata.owner` with the same email fallbacks, notified with the same `flag-stale` template (data includes `scope: 'universe'` + universe name/id, `adminUrl` points at the per-universe page), and stamped via `UniverseManagementService.stampStaleNotifiedAt` (DB-only merge into `metadata`, no Redis re-publish — the stamp is admin bookkeeping for dedupe + the badge); each is audited as `feature_flag.stale_notified` with `targetType: 'universe_feature_flag'`. The sweep summary's `checked`/`notified`/`alreadyNotified`/`failed`/`noRecipientStamped` counts include both kinds. **Universe prune with archive**: the per-universe Feature Flags page has its own **Remove stale flags (N)** action (`POST /admin/universes/feature-flags/prune-stale`, optional `{keys:[{universeId,featureKey}]}` confirmed batch) — `UniverseManagementService.pruneStaleFeatureFlags` archives each flag's full snapshot (featureKey, universeId, universe name/displayName, isEnabled, metadata, archivedAt) to the audit log as `feature_flag.deleted` with `targetType: 'universe_feature_flag'` BEFORE the DB+Redis hard delete (the same archive-before-remove contract as the global prune, so the row is restorable from the audit archive), skips requested keys that aren't actually past expiry, isolates per-key failures in `skipped`, and returns `{removedCount, removedKeys, archivedCount, skipped}`. **Undo/restore**: every removal (single delete or prune) snapshots the flag's last-known state into the `feature_flag.deleted` audit entry (`archivedSnapshot`); the Global Flags page's prune feedback shows an **Undo** button and a **Recently removed** section (`GET /admin/feature-flags/deleted?limit=20`) listing recently deleted flags with archive availability — restoring (`POST /admin/feature-flags/restore` with `{keys}`) replays the snapshot via `setFlag` (dropping the `archivedAt` stamp), refuses to clobber an existing flag, logs a `feature_flag.restored` audit entry per key, and returns `{restoredCount, restored, skipped}` with per-key reasons (`already-exists` / `no-archive`). **Universe undo mirrors it**: `POST /admin/universes/feature-flags/restore` with `{keys:[{universeId,featureKey}]}` — `UniverseManagementService.restoreUniverseFlag` locates the most recent `feature_flag.deleted` archive by snapshot identity (universeId + featureKey, robust to renames), re-creates the `universe_feature_flags` row (isEnabled + metadata, `archivedAt` dropped) and re-publishes it to the runtime Redis store, refuses `already-exists`, reports `no-archive` on a miss, and logs `feature_flag.restored` per key. The per-universe Feature Flags page's prune feedback shows the same **Undo — restore from audit archive** button, and — like the global page — a **Recently removed** section (`GET /admin/universes/feature-flags/deleted?limit=20`, `UniverseManagementService.getRecentlyDeletedUniverseFlags`) lists the most recent `feature_flag.deleted` entries for the `universe_feature_flag` scope with per-row **Restore** buttons (identity from the snapshot's universeId + featureKey; unarchived rows render as not-restorable). **Self-disable safety**: the evaluator (`FeatureFlagService`) never serves a flag past `staleAfter` + `autoDisableAfterDays` (default 7, module config; per-flag `metadata.autoDisableGraceDays` override, `metadata.autoDisable: false` opt-out) and flips the persisted state to off with an `autoDisabledAt` stamp — any admin update (a renewal) clears the stamp, and an in-flight persist re-reads Redis + re-checks the deadline so a just-renewed flag always wins. Every such evaluation bumps `flag_auto_disabled_total{service,key}` through the shared `onAutoDisabled` hook (see `docs/MONITORING.md` for the `FlagAutoDisabled` alert + Grafana panel), and the Global Flags page renders an **auto-disabled** badge on affected rows. **Stale-serving report**: `GET /admin/feature-flags/stale/metrics` (`StaleFlagMetricsService`) joins Prometheus `flag_stale_running_total` per key (lifetime + per-5m rate) **and** `flag_auto_disabled_total` (self-disable flip counts) — three instant queries via `PROMETHEUS_URL`, default unset → `available: false`. The join is **cached server-side for 30s** (single-flight: concurrent callers share one Prometheus fetch, `PROMETHEUS_CACHE_TTL_MS` override) and failures are never cached — which is what lets the Global Flags page **poll this endpoint every 30s** (`refetchInterval`) for live serving/auto-off badges without hammering Prometheus; `fetchedAt` reflects the last actual Prometheus fetch, preserved across cache hits so the UI can show honest staleness. The Global Flags page fetches it and shows a red **serving past expiry** badge (with rate/lifetime in the tooltip) on stale flags still receiving live traffic, plus a header line counting them, so ops sees which removal candidates are actively in the hot path rather than just past their date. It also distinguishes *how* a stale flag got turned off: rows show **auto-off · N×** (driven by the `autoDisabledAt` stamp OR the counter, which stays authoritative even if the stamp was cleared) with the counter in the tooltip, versus a grey **manually off** chip on stale disabled flags with no auto-disable recorded (`flag_auto_disabled_total = 0`), and a header line counts auto-disabled stale flags — so ops can tell the safety's flips from admin toggles at a glance.

### 2.7 Tests
- Unit-test rollout hash determinism, user targeting, anonymous-bucket stability (currently `process.env.ANONYMOUS_ID` is a *process-global*, so anonymous bucketing is wrong in multi-request/worker contexts — thread a per-request anonymous id through instead).
- **Live Redis chain e2e** — `apps/admin/src/modules/feature-flags/feature-flags.redis-live.spec.ts` drives the full admin toggle → Redis → service chain against a **real Redis server** (`docker-compose.test.yml` at the repo root, `redis:7-alpine` on port **6380** — deliberately not 6379, so a local dev Redis is never touched; persistence off, healthchecked). Two independent ioredis connections (admin writer + consumer) prove the store is genuinely shared: toggle on → consumer flips → the real `FeatureFlagGuard` with real `@FeatureFlag` metadata allows the route; toggle off → denies (403 semantics); removal → registered default; rollout/user targeting honored cross-connection; numeric `value` and `staleAfter` propagate through Redis. Writes live under the `feature_flags_test:` prefix and are deleted in `afterEach` — a shared instance is never clobbered. **Opt-in**: the suite skips (with the start command in a log line) unless `RUN_LIVE_REDIS=1` or `REDIS_TEST_URL` is set, so the default `pnpm test` never depends on Redis; when opted in with Redis down it fails fast (2s connect timeout, `retryStrategy: null`) instead of hanging. Run it: `docker compose -f docker-compose.test.yml up -d --wait redis-test` then `pnpm --filter @azeebo/admin test:redis`, or one shot `pnpm test:flags:redis` (boots → runs → tears down). `REDIS_TEST_URL` points it at any Redis (e.g. a CI service container). The always-on in-process proof stays in `feature-flags.redis-e2e.spec.ts` (fake store) so the chain is verified on every run; the live spec adds cross-connection/cross-process truth on demand. **CI**: the three dockerized suites (this one, the payment failover e2e, and the search pg_trgm e2e) run in `.github/workflows/dockerized-e2e.yml` — Redis + Postgres as GitHub Actions service containers (env `REDIS_TEST_URL`/`PAYMENT_TEST_DATABASE_URL`/`SEARCH_TEST_DATABASE_URL` point the suites at them; the search suite gets its own `azeebo_search_test` database), with only the two provider stubs (paystack/flutterwave mocks) booted via `docker-compose.test.yml`, Prisma clients generated first, and the stubs torn down on every outcome.

---

## 3. Per-Service Flag Recommendations

Naming: `snake_case`, `{domain}_{feature}_enabled` for kill-switches. Defaults: `default on` = kill-switch, `default off` = new feature.

### 3.1 Gateway (`services/gateway/api-gateway`)

| Flag | Default | Where | Why |
|---|---|---|---|
| `gateway_maintenance_mode` | off | Proxy controller top-level | Global 503 kill-switch (checked before routing/forwarding, sets `Retry-After: 300`; web `/maintenance` page wired via bootstrap) |
| `gateway_new_routes` | on | `SERVICE_CONFIGS` registration | `/live-events` + `/vertical` marked `isNew: true`; `findRoute` returns null → 404 when flag off, so routes ship as code and enable per env without redeploy |
| `gateway_circuit_breaker` | on | `CircuitBreakerProxyService` | Disable circuit-breaking during incidents to fall back to direct routing |
| `gateway_response_cache` | on | Proxy caching (`CACHE_TTL_MS`) | Toggle per-route-family caching (content/search) to drain stale cache safely |
| `gateway_strict_rate_limits` | off | `AuthThrottlerGuard` | Auth-endpoint limit tightens 10 → 3 req/60s when on (login/signup/OTP/forgot-password) |
| `gateway_csrf_enforce` | on | `CsrfMiddleware` | Emergency disable if a CSRF regression appears |
| `gateway_legacy_redirect` | on | `LegacyRedirectMiddleware` | Disable redirects once legacy clients are drained |
| `gateway_api_v2` | off | `ApiVersioningConfig` | Versioned routes (`/api/:version/:service`) reject `v2` with 404 until flag on — the header fallback collapses unknown versions to the route default, so the gate fires on explicit versioned URLs |

### 3.2 Core services

**auth-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `auth_social_google` / `auth_social_apple` | on | `social/` controllers | Per-provider kill switch (provider outages, compliance) |
| `auth_mfa_totp` | off | `mfa/` module | Roll out TOTP MFA to cohorts. **`auth_mfa_required_for_admins` (off) enforced**: at login/magic-link, admins without MFA enrolled are blocked 403 `admin_mfa_not_enrolled` (fail-closed — no tokens); admins with MFA get `428 { mfaRequired: true, method: 'totp', challengeId }` and must complete `POST /auth/mfa/verify-login` (10-min single-use challenge, TOTP via `MfaService.verifyMfaCode` incl. backup codes, audit-logged + analytics) |
| `auth_otp_email` / `auth_otp_sms` | on | `otp/` controller | Channel routing: switch SMS→Email at scale; kill an abusive channel |
| `auth_passwordless_magic_link` | off | `auth/magic-link/*` | New login method, 5% rollout. **Implemented**: `POST /auth/magic-link/request` (3/hr rate limit) stores a single-use `magic_link:{token}` (15-min TTL), sends the first-class `magic-link` email template (notification-service subject + shared-services HTML, env override `EMAIL_TEMPLATE_MAGIC_LINK_HTML`), and never reveals whether the account exists; `POST /auth/magic-link/verify` (5/15min) burns the link and issues tokens. Fail-closed: both endpoints 403 while the flag is off. Admins still hit the MFA challenge on passwordless sign-in |
| `auth_device_limits` | off | `DeviceLimitService` | Enforce subscription-tier device caps (Free=1…Enterprise=10) |
| `auth_refresh_rotation` | on | token service | Kill-switch for refresh-token rotation |
| `auth_email_verification_required` | off | signup flow | Require verified email before login. **Implemented**: `register()` branches — no tokens issued, verification email sent via `sendVerificationEmail()` (shared with `resendVerification`), response carries `requiresEmailVerification`; `login()` rejects unverified users with 403 `email_not_verified` (audit-logged + analytics) until `verifyEmail()` marks them verified. The verification link is a **first-class template**: `email-verification` registered in `EmailService.registerTemplates()` (env override `EMAIL_TEMPLATE_EMAIL_VERIFICATION_HTML`), delivered via notification-service's new `POST /v1/notifications/email` (`sendTemplatedEmail` — template→subject map, email kill-switch, unknown template = 400). Tokens expire after **1h** (`VERIFICATION_TOKEN_TTL_SECONDS`, was 24h) and are hardened with a **per-token attempt budget** (5 tries, then the token is burned with 429; counter TTL matches the token) plus a **per-user resend throttle** (3 emails/hour, 429). **Post-verification auto-login**: `verifyEmail()` ends by calling `generateTokens()` — the user gets fresh `access_token`/`refresh_token` (plus `user`/`expiresAt`) in the response, so no second sign-in is needed; works with the flag on or off (verification is always proof of identity) |
| `auth_role_select` | on | `/select-role` | Gate the role-selection flow |

**user-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `user_profile_v2` | off | `/me` PATCH | **Implemented** — flag ON additionally upserts `UserProfile` (bio/location/isPublic, returned as `data.profile`); OFF ignores the v2 fields (legacy displayName/avatar only). DTO hardened: displayName 3–50, avatar must be a URL, bio ≤ 500, location ≤ 100; suite 58/58 (+3 v2 tests) |
| `user_universe_affinity` | off | affinity endpoints | Compute/return universe affinity (new data pipeline) |
| `user_continue_watching` | on | history endpoints | Kill-switch for resume tracking |
| `user_deletion_soft` | on | `user-deletion.controller` | Soft-delete vs hard-delete switch (compliance) |
| `user_follow_system` | off | `/:id/follow` | Roll out follow/follower graph |
| `user_privacy_settings_v2` | off | privacy endpoints | New granular privacy controls |

**wallet-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `wallet_withdrawals_enabled` | on | `/withdraw` | **Compliance kill-switch** — freeze withdrawals instantly |
| `wallet_transfers_enabled` | off | `/transfer` | P2P transfers (fraud-sensitive) |
| `wallet_bonus_credit` / `wallet_promo_credit` | off | `/bonus-credit`, `/promo-credit` | Marketing campaigns on/off without deploy |
| `wallet_redeem_rewards` | on | `/redeem-reward` | Kill redemption during reconciliation |
| `wallet_distributed_lock` | on | `WalletService.withWalletLock` | **Implemented** — Redis `SET NX EX` distributed lock (15s TTL) wrapped around the S2S money-movement entry points (`debitBalance`, `creditBalance`, `chargeWallet`, `creditReverse`), closing the idempotency pre-check race that runs *outside* the DB transaction; `FOR UPDATE` row locks remain the primary serialization; fail-open when Redis is down (DB lock still protects balance), `409 Conflict` when the lock is held; keyed per wallet (`wallet:lock:{id}` / `wallet:lock:user:{userId}`); defaults on |
| `wallet_ledger_v2` | off | `WalletService.writeLedgerEntry` | **Implemented** — new `WalletLedger` model + migration `20260810000003_wallet_ledger` (append-only `wallet_ledger` table: operationType, amount, balanceAfter, reference, idempotencyKey, metadata) + regenerated Prisma client; every completed money movement (debit/credit/withdraw/transfer both legs/charge/reverse) writes an immutable entry with the post-op balance when the flag is on; ledger writes never fail the money movement |
| `wallet_fraud_checks` | off | `WalletService.assertFraudChecksPass` | **Implemented** — velocity/pattern limits on money-out: per-hour count + per-day count + per-day amount cap, env-tunable (`WALLET_FRAUD_MAX_PER_HOUR/PER_DAY/DAILY_AMOUNT`, withdraw-tight 3/10/1,000,000 vs transfer-loose 5/20 defaults); `403 Forbidden` when exceeded |

**payment-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `payment_provider_paystack` / `payment_provider_flutterwave` | on | `PaymentsService.getActiveProvider` | Per-gateway routing + outage kill-switch; **rollout-aware pick** — `isEnabled(key, userId)` passes the user id as the bucketing key, so a stored `rolloutPercentage` on either provider flag hash-buckets an A/B traffic split between gateways (e.g. paystack 50% → that share of users to paystack, rest to flutterwave); targeted-user lists apply per user; fallback chain paystack → flutterwave → 400 unchanged |
| `payment_new_checkout_flow` | off | `PaymentsService.initializePayment`/`verifyPayment` | **Implemented** — when on, intents get a 30-minute session expiry (`checkoutExpiresAt` in metadata) surfaced as `expiresAt` on the response; `verifyPayment` rejects expired sessions with 400 so abandoned checkouts can't be completed later |
| `payment_webhooks_enabled` | on | `webhook.controller` | Pause webhook processing during provider incidents |
| `payment_intents_api` | off | `POST /payments/intent`, `POST /payments/intent/:id/confirm` | **Implemented** — Stripe-style deferred authorization: create an intent without calling the provider (`status: 'requires_payment'`), confirm later to get the checkout URL; flag-gated at the controller (FeatureFlagGuard) *and* in the service (fail-closed); idempotency-key dedup on create |
| `payment_self_service_refund` | off | `/refund-request` | Allow users to request refunds |
| `payment_kyc_required` | off | `PaymentsService.initializePayment` | **Implemented** — deposit gating: when on, `initializePayment` rejects unverified users with `403 KYC verification required` before any intent is created; verified via the JWT `kycVerified` claim (controller passes `req.user.kycVerified === true`); fail-closed — a missing claim blocks, so ops flips this only after KYC is rolled out |
| `payment_scheduled_tasks` | on | `ScheduledTasksModule` | Disable dunning/retry cron jobs in one toggle |

**content-service** (already has `content_moderation_enabled` — keep)
| Flag | Default | Where | Why |
|---|---|---|---|
| `content_moderation_enabled` | on | `publishContent` (existing) | Kill-switch for safety scans on publish — defaults registered in ContentModule (self-contained) |
| `content_transcoding_new` | off | `startTranscoding` | New transcoding pipeline/format set |
| `content_ai_tags` | off | ingestion service | **Implemented** — `applyAiTags` hook POSTs `{title, description}` to `CONTENT_AI_TAGS_URL/tag`, stores `{tags[]}` in `metadata.aiTags`; fail-open (no tagger / tagger error never fails ingestion) |
| `content_clip_ingestion` | off | `ingestClipContent` | Clip extraction feature |
| `content_comments_v2` | off | comment endpoints | **Implemented** — `addCommentToContent(..., parentId?)` accepts threads only while on (else 400), validates the parent exists on the same content |
| `content_windowing_enabled` | on | `checkContentAvailability` | Enforce release windows (premieres/exclusives) |
| `content_premium_gate` | off | access-check | **Implemented** — while off, `checkContentAccess` bypasses rental/pass/premium entitlement checks (all published content unlocked, `accessType: 'unlocked'`); flipping on enforces them |
| `content_recommended_rail` | off | `getRecommended` | **Implemented** — `getRecommended` returns `[]` and the home-feed rail query is skipped while off |
| `universe.{name}.{feature}` | on | per-universe | **Bridge implemented** — `ContentFeedService.getEnabledUniverseIds(featureKey)` (5-min Redis cache) reads `UniverseFeatureFlag` rows (unset ⇒ enabled); `discoveryUniverseFilter()` constrains home/watch/trending/new-releases/recommended to `discovery_enabled` universes |

**search-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `search_faceted` | off | `searchWithFacets` | Roll out faceted search UI/API |
| `search_typo_tolerance` | off | `search()` | Fuzzy matching (expensive, A/B it). **Implemented**: Levenshtein scoring in `src/modules/search/fuzzy.ts` (normalized similarity + token best-pair + substring detection, threshold 0.5). Candidate retrieval is computed in **Postgres** via the `pg_trgm` migration (`20260810000001_pg_trgm_fuzzy_search`): `CREATE EXTENSION pg_trgm` + GIN trigram indexes on `content_items.title/description`, `creator_profiles."displayName"/bio`, `universes.name/"displayName"`; the fuzzy path runs `$queryRaw` with `similarity(...) > 0.3` OR `ILIKE '%…%'` in the WHERE (both index-backed) so the pool is SQL-computed and scales with the catalog instead of a bounded in-process heuristic. The retrieval queries also `SELECT similarity(...)` per column (`titleSim`/`descSim`, `displayNameSim`/`bioSim`, `nameSim`/`displayNameSim`), so each row carries its explainable pg_trgm signal. **Blended relevance**: the precision filter stays on the Levenshtein `fuzzyScore` (threshold 0.5), but ranking and the reported score use `blendScore(fuzzy, trigram)` (`src/modules/search/fuzzy.ts`) — decisive matches (fuzzyScore ≥ 0.85: exact/substring/near-exact) keep their score unchanged, while typo-corrections blend 60% fuzzy + 40% trigram, so strong n-gram overlap (e.g. 'avngers' vs 'Avengers') genuinely lifts a near-miss. Exact substring matches still rank above near-misses. **Per-item `score` (0–1) is surfaced on every fuzzy result** (content/creators/universes) so clients can render rank badges or 'did you mean' hints — scores ≥ ~0.85 are decisive matches; scores below that are the blended correction signal, with the trigram component making the ranking explainable. Universal search results also carry `contentType` and `universe` (direct columns) for client-side chips/filters without joins. **One comparable scale across types**: content, creators, and universes all score through the same `scoreFuzzyCandidate()` pipeline (`fuzzy.ts`) — admission on the Levenshtein component (`FUZZY_MATCH_THRESHOLD`) for every type (previously creators/universes filtered on the *blended* score, a real asymmetry), then the same 60/40 blend — so identical match shapes produce identical scores regardless of result type, and clients can compare a 0.7 creator match against a 0.7 content match directly. **Web UI runs entirely on the universal endpoint**: `apps/web/src/app/search/page.tsx` queries `/v1/search` only — the migration `20260810000002_content_thumbnail_duration` added `thumbnail`/`duration` to the search index's `content_items` (plus `duration` in the demo all-in-one table), and the search results now carry `thumbnail`, `duration` (seconds), `contentType`, and `universe` so the page needs no second lookup. Type and duration filters are now functional (mapped from `contentType`/`duration`); sort maps to the API (`newest`/`rating`/`popular`). **Rank badges**: results from the typo-tolerant path render a green "N% match" badge next to the title (tooltip explains the blended signal); exact-path results carry no score, so no badge. **'Matched because' breakdown**: the badge also maps `fuzzyScore`/`trigramScore` from the universal response and, on hover, shows a plain-language popover splitting the blended score into its two explainable components — "Spelling match" (the Levenshtein component) and "Character patterns" (the pg_trgm n-gram component) plus the "Overall" blended percentage. Exact-path results (which omit the components) keep the native `title` tooltip. **'Did you mean' banner**: `data.suggestedQuery` (when present and different from the active query) renders as a one-click banner that re-runs the search via the same `handleSearch` path. **Correction analytics**: the web app fires `content_search_correction_shown` (once per suggestion, guarded by a ref) when the banner appears and `content_search_correction_accepted` when the user clicks it — both carry the original query and the suggested title, so the search team can compute the correction acceptance rate (accepted / shown). Both event names are now registered in the analytics-service `ALLOWED_EVENT_NAMES` — they previously failed ingest validation and were silently dropped, so the series only has data from this change forward. **Admin Search Analytics panel** (`/search` in the admin app, nav "Search 🔍"): `GET /v1/analytics/search/corrections?days=7|14|30|90` aggregates `product_events` via `DATE_TRUNC('day')` + `COUNT(*) FILTER` into a contiguous zero-filled daily series (`{ date, shown, accepted, rate }`) plus overall totals, with `days` clamped to [1,90] server-side; the page renders summary cards (shown / accepted / acceptance rate all-time + last 7d), a hand-rolled SVG chart (per-day shown/accepted bars with the acceptance-rate line on a 0–100% scale, hover tooltips), and an accessible daily breakdown table. The route is registered in the gateway's analytics proxy block. The flag stays off by default, so badges and the banner only appear once `search_typo_tolerance` is enabled (A/B). **Startup guard**: `SearchService.onModuleInit` probes `pg_extension` for `pg_trgm`; if it's missing (migration not run / role lacks the `CREATE EXTENSION` grant) or the probe is inconclusive (DB down at boot), `search()` logs a throttled warning and falls back to the **exact path** instead of 400ing every fuzzy request. The state is re-probed lazily on a 60s interval, so creating the extension later (or a DB that recovers) self-heals without a restart, and a runtime `similarity()`/`pg_trgm` error in the fuzzy path also degrades to the exact path for that request. The effective mode (flag AND extension) drives the cache key, so degraded responses never poison the fuzzy cache. **Ops visibility**: `GET /health` now returns a `search` object from `SearchService.getFuzzyStatus()` — `{ enabled, pgTrgm: 'available'|'missing'|'unknown', indexes: 'present'|'missing'|'unknown', degraded, warning?, mode, lastProbeAt }` — so dashboards can see whether fuzzy search is degraded and why (flag on + extension missing, or extension present but the migration's GIN trigram indexes absent). Degradation is reported but does NOT flip health to 503, since the exact path keeps serving. **Prometheus /metrics**: a new MetricsModule (prom-client, the same pattern as payment/queue-service) serves `GET /v1/search/metrics` (`@Public`, gateway-routed) with the alerting contract: `search_fuzzy_enabled` (1/0), `search_fuzzy_degraded` (1/0 — the signal to alert on: flag on but pg_trgm unavailable, exact-path fallback active), and enum gauges `search_pg_trgm_state{state="available|missing|unknown"}` / `search_pg_trgm_indexes{state="present|missing|unknown"}` (exactly one label = 1, so a state change never leaves a stale 1), plus a **direct alerting boolean `search_pg_trgm_indexes_missing`** (1 when the extension is present but the migration's GIN indexes are absent — intentionally independent of `search_fuzzy_degraded`, since unindexed fuzzy still runs). The gauges are refreshed after every startup probe, throttled 60s re-probe, and runtime degradation event via `MetricsService.setFuzzyStatus(getFuzzyStatus())`, with default labels `service="search-service"` + environment. **Population-job counters**: `MetricsService.recordPopulationRun(outcome, rows)` feeds `search_index_population_runs_total{outcome="success|skipped|error"}` (incremented on every population run, including flag-off skips and failures) and `search_index_population_rows_total` (rows actually upserted), so dashboards can watch index freshness and catch a silently failing population job. **Alert rules as code**: `services/core/search-service/prometheus/alerts.yml` defines the alert contract — `SearchFuzzyDegraded` (critical, `search_fuzzy_degraded == 1` for 2m), `SearchPgTrgmIndexesMissing` (warning, `search_pg_trgm_indexes_missing == 1` for 5m), and `SearchPgTrgmStateUnknown` (warning, `search_pg_trgm_state{state="unknown"} == 1` for 10m — a probe stuck unknown is visible even when the flag is off). **Admin stats surface the same state**: `GET /v1/search/admin/stats` (search-service AdminController, `AdminGuard`, gateway-routed) now returns the `getFuzzyStatus()` object as `fuzzy` alongside `totalSearchesToday`/`uniqueSearchers`/`topQueries`, and the admin **Search Analytics** page (`/search`) renders a live status panel from it — healthy/degraded dot, enabled, pg_trgm, indexes, effective mode, searches today, unique searchers, and the warning note — refreshed every 60s, so ops sees degradation without hitting /health. **Startup migration check**: the probe also counts the six GIN trigram indexes from the pg_trgm migration in `pg_indexes`; the extension existing without them logs a throttled warning (fuzzy still works, just unindexed) and surfaces as `indexes: 'missing'` + a `warning` in the health status. **Score components**: fuzzy results now also expose `fuzzyScore` and `trigramScore` (the two explainable components of the blended `score`) on content/creators/universes, so clients can render a 'matched because' breakdown; exact-path results omit all three. **Runtime-tunable blend**: the numeric flag `search_fuzzy_trigram_weight` (default `0.4` via `FeatureFlagModule.register({ defaultValues })`) sets the trigram weight in the blend — `score = fuzzy*(1-w) + trigram*w` — read once per search via `getValue`, clamped to [0,1], falling back to `DEFAULT_TRIGRAM_WEIGHT` when unset. The decisive-match anchor (≥0.85) still keeps its score untouched, so retuning only reshapes the typo-correction band; changes land within the flag cache TTL (no deploy). **'Did you mean' hint**: when the best-scoring content match — computed over the full ranked pool, not the current page — scores below the decisive anchor (`DECISIVE_MATCH_SCORE` = 0.85, exported from `fuzzy.ts`), the response's top-level `data.suggestedQuery` carries that title so clients can render a one-click re-search link; it's absent when the top match is decisive or there are no matches. **Exact totals**: `pagination.total` comes from a `count(*)` over the same trigram WHERE (run in parallel with the pool query), so it is uncapped and reflects every matching row — an upper bound on the score-filtered page, since the 0.5 in-process threshold is a precision pass on top. Creators and universes use the **same path**: their retrieval is already index-backed pg_trgm `$queryRaw` (pool + `similarity()`/ILIKE in the WHERE), and they now also get exact `count(*)` queries over the identical predicate — so the response's top-level `total` (`content + creators + universes`) is exact rather than capped at the 200-row pools or the 20/10 response limits. Filters (status/universe/date range) apply in SQL; the pool `LIMIT 1000` remains a safety cap on rows fetched for scoring, not on the total. **Per-surface pagination**: creators and universes now page independently of content via `creatorsPage`/`creatorsLimit` (default 20) and `universesPage`/`universesLimit` (default 10) query params (both clamped to [1,100] in the controller). Each surface gets its own pagination object — `creatorsPagination`/`universesPagination` (`{ page, limit, total, totalPages }`, totals exact since the counts run over the same predicate) alongside the existing content `pagination`. The exact path pages via ORM `skip/take` + `count`; the fuzzy path slices the fully-scored pools (the `FUZZY_CREATOR_LIMIT`/`FUZZY_UNIVERSE_LIMIT` response caps are gone — the pool caps remain safety bounds, not response limits) with the SQL counts as totals. **Web UI section headers**: the search page maps both per-surface pagination objects from the response and renders the exact totals as a right-aligned "N creators · M universes" header beside the results count line (shown only when at least one surface has matches). **Category + creator fields**: migration `20260810000003_content_categories_creator` adds `categories String[]` + `creatorName String?` to the search index's `content_items`, denormalized from the content DB's `content_categories` join table and `creator_profiles.displayName`. Both SQL SELECTs (exact + fuzzy) and both mappings carry the new columns; `SearchResult` exposes them, and the web search page maps `categories` + `creator: { name: creatorName }` onto its result type so the **category filter** (slug→name resolved via the categories query) and the **creator chip** work on the universal endpoint with no second lookup. The faceted filter now targets the scalar-array `categories` (names) rather than a relation. **Learned typo dictionary** (`search_typo_dictionary`, default off): accepted 'did you mean' clicks feed back into the search service via `POST /v1/search/log` — the DTO gained optional `correction` + `accepted`, and `logSearch` upserts the (original query → correction) pair into a new `search_typo_corrections` table (migration `20260810000004_search_typo_corrections`, unique per pair, `count` incremented per acceptance, `lastAcceptedAt` refreshed), sharing the `search_log_queries` kill-switch since it derives from query logs. The web search page's banner-click handler posts the accepted correction (fire-and-forget; anonymous sessions 401 and are swallowed). In the fuzzy path, when the flag is on and the top match is a non-decisive typo, the service consults `getTypoCorrections(query)` (most-accepted first) and prefers a learned correction that exists in the ranked pool — so repeatedly accepted corrections become sticky suggestions. Learning always writes; only the suggestion preference is flag-gated. **Infinite-scroll pagination**: the search page's results query is a `useInfiniteQuery` against `/v1/search` sending `page` + `limit=20`, with `getNextPageParam` driven by the response's own `pagination` object (`page < totalPages` → fetch next); an IntersectionObserver sentinel (200px root margin) auto-loads the next page with a visible **Load more results** fallback button; a "Showing X of Y results" line uses the server content total, and when the client-side type/category/duration filters are active the count shows the filtered total with a "(filtered from N)" suffix (the server total is exact for the raw query, so the client reports honestly). The empty state distinguishes 'No results found' (server returned nothing) from 'No results match your filters yet' + a Load more control (server has more pages the filters may match). Fuzzy and exact results use separate cache keys so toggling never serves stale results. **Index population job**: `search_index_population` (on by default) drives a scheduled job (`PopulationModule`/`PopulationService`, cron default `*/5 * * * *` — override `SEARCH_INDEX_POPULATION_CRON`, resolved from config so `.env` values apply; batch size `SEARCH_INDEX_POPULATION_BATCH_SIZE`, default 100) that reads published content from the **content DB** (`ContentDbService`, a `pg` Pool on `CONTENT_DATABASE_URL`): categories resolved through the `_CategoryToContentItem` junction (`array_agg` of `categories.name`) and creator displayName from the content DB's `users.displayName` keyed by `content_items.creatorId` — then batch-upserts (keyset-paginated, one Prisma transaction per page, idempotent `upsert`) into the search index's `content_items`, including `contentType`/`universe` derived from the content universe name and `duration` from `media_assets`, so the denormalized `categories`/`creatorName` columns (and the whole content row) stay fresh on a schedule instead of going stale. It also runs once at startup, has an in-process lock preventing overlapping runs, and skips early when the flag is off; source errors are logged and retried on the next tick. **Local alerting stack**: `services/core/search-service/prometheus/` ships `docker-compose.yml` + `prometheus.yml` + `alertmanager.yml` — a runnable local Prometheus (v2.53, port 9090) + Alertmanager (v0.27, port 9093) pair that binds `./alerts.yml` as the rule file and scrapes the search-service's `/v1/metrics` on `host.docker.internal:3005` (gateway-exposed alternative `/v1/search/metrics` documented) **plus the api-gateway** on `host.docker.internal:3013/metrics` (its flag lifecycle counters — `flag_stale_running_total`, `flag_auto_disabled_total`, … — are the data behind the admin stale-serving report), so the three fuzzy-search alert rules can be fired and cleared on a dev machine **and the admin stale badge works out of the box**: set `PROMETHEUS_URL=http://localhost:9090` in `apps/admin/.env` (the example ships with that default) and the Global Flags page's serving-past-expiry / auto-off badges read this Prometheus; alertmanager.yml routes to a placeholder host webhook with Slack/email receiver examples in comments; **Grafana dashboard** — `services/core/search-service/prometheus/grafana-dashboard.json` (import into Grafana, Prometheus datasource) visualizes the fuzzy-guard gauges (stat panels for `search_fuzzy_degraded` / `search_fuzzy_enabled` / `search_pg_trgm_indexes_missing`, step-line time series for the `search_pg_trgm_state` and `search_pg_trgm_indexes` enum gauges) plus the **population-job counters** (`search_index_population_runs_total{outcome}` bars and a rows-upserted/min rate panel), with an `environment` templating variable fed by `label_values(search_fuzzy_enabled, environment)`; the compose header documents the import. **Self-healing index repair**: `search_index_repair` (on by default) drives `IndexRepairService` (`RepairModule`) — a job that recreates the migration's six GIN trigram indexes when the SearchPgTrgmIndexesMissing condition holds (pg_trgm extension present, indexes absent), using the exact migration definitions via `CREATE INDEX CONCURRENTLY IF NOT EXISTS` (idempotent, non-blocking). It runs at startup, on a cron (`SEARCH_INDEX_REPAIR_CRON`, default `*/5 * * * *` — matching the alert's `for: 5m`, so healing usually preempts the alert), and on demand via `POST /v1/search/admin/indexes/repair` (AdminGuard; also the documented Alertmanager webhook target for the alert). Guards: it never creates the extension itself (that's the migration's job), skips when indexes are present or the flag is off, and is rate-limited by `SEARCH_INDEX_REPAIR_COOLDOWN_MS` (default 5m, applies to failures too). After a successful repair it calls `SearchService.refreshFuzzyProbe()`, so /health and the metrics gauges flip to 'present' immediately instead of waiting for the next 60s probe. |
| `search_suggestions_ai` | off | `getSuggestions` | AI-ranked suggestions vs `resultCount` ranking |
| `search_trending_cached` | on | `getTrending` | Serve trending from Redis cache vs DB |
| `search_log_queries` | on | `logSearch` | Toggle search logging (privacy/compliance) |

**media-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `media_upload_chunked` | off | upload controller | **Implemented** — `POST /upload/chunked/init` (Redis session, 24h TTL) → `PUT /upload/chunked/:uploadId/:index` (chunks ≤10MB staged to S3 via `putBuffer`, duplicate/range-checked) → `POST /upload/chunked/:uploadId/complete` (assembles via `getObjectBuffer`, runs the normal validated upload path, best-effort cleanup). All endpoints fail-closed 403 while off |
| `media_presigned_urls` | on | upload/`getMediaUrl` | Signed-URL flow vs proxy streaming |
| `media_transcode_av1` | off | transcoding | New codec (cost/bandwidth trade-off) |
| `media_virus_scan` | off | upload pipeline | **Implemented** — `scanUploadIfEnabled` POSTs `{key, mimetype}` to `MEDIA_VIRUS_SCAN_URL/scan` (30s timeout), requires `{ clean: true }`; fail-closed (no scanner configured / unreachable / non-clean → 400). Clean passes return `scanStatus: 'clean'` on `UploadResponse` |
| `media_cdn_edge_cache` | on | URL signing | Toggle CDN edge cache headers. **Implemented**: `UploadService.getCacheControl(mimetype)` returns per-type directives when on (images `public, max-age=31536000, immutable`; videos `public, max-age=86400`; audio/documents `public, max-age=604800`; unknown types `public, max-age=3600`), and `private, no-store` when off; every upload endpoint (`/media/upload/{image,video,audio,document,thumbnail,avatar,banner}`) sets the `Cache-Control` response header from it (controller uses `@Res({ passthrough: true })`), and the value is also echoed in the `UploadResponse.cacheControl` field. **Per-type TTLs are env-configurable** (no longer hard-coded): `MEDIA_CACHE_TTL_IMAGE` (default 31536000, keeps `, immutable`), `MEDIA_CACHE_TTL_VIDEO` (86400), `MEDIA_CACHE_TTL_AUDIO` (604800), `MEDIA_CACHE_TTL_DOCUMENT` (604800), `MEDIA_CACHE_TTL_DEFAULT` (3600) — seconds, read once at construction via a parse+positive-integer validation (invalid/unset falls back to the default), documented in `services/core/media-service/.env.example`; tune per environment without a code change. **Typed policy**: `UploadResponse` now carries `cachePolicy: 'no-store' | 'immutable' | 'long-lived' | 'medium-lived' | 'short-lived'` alongside the raw `cacheControl` string, so clients switch on caching behavior without parsing the header — `no-store` when the flag is off, `immutable` for images (regardless of tuned TTL, the directive keeps `, immutable`), and the other bands track the **resolved** max-age (≥7d / ≥1d / <1d), so tuning `MEDIA_CACHE_TTL_*` re-bands the policy automatically. Mirrored as `UploadCachePolicy` on the mobile client's `MediaUploadResponse`. **CDN purge**: flipping the flag does not evict already-cached objects — `POST /admin/cdn/purge` (`{ keys?: string[], prefix?: string }`, AdminGuard) invalidates them via `CdnPurgeService` (CloudFront `CreateInvalidation`, paths `/{key}` or `/{prefix}/*`; logs a no-op when `CLOUDFRONT_DISTRIBUTION_ID` is unset, i.e. dev). **The flip is now automated**: `CdnFlagPurgeQueueService` (UploadModule) polls `media_cdn_edge_cache` every `MEDIA_CDN_FLAG_POLL_MS` (default 30s, aligned with the feature-flags cache TTL) and on an on→off transition enqueues a deduped, single-flight in-process purge job that runs `CdnPurgeService.purgePrefix('uploads')` — the full `/uploads/*` invalidation — so ops no longer calls the endpoint manually; the first poll only seeds last-known state (booting with the flag already off never purges), poll failures retry on the next tick, and the interval is unref'd/cleared on destroy. **Manual one-click purge**: the admin app's Global Flags page renders a **Purge CDN** button on the `media_cdn_edge_cache` card (confirm dialog → `POST /api/v1/media/admin/cdn/purge` with `{ prefix: 'uploads' }`, proxied through the gateway's media block — route added to the registry), with in-flight + success/error feedback; the existing `POST /admin/cdn/purge` endpoint remains for keys/prefixes. **Per-key purge on re-upload**: while caching is disabled (`no-store` policy), every completed upload also best-effort invalidates exactly its own S3 key via `CdnPurgeService.purgeKeys([key])` (fire-and-forget, guarded against missing keys, failures swallowed) — so a re-upload of a key that was cached while the flag was on can never be shadowed by the stale edge copy; uploads with caching enabled skip the purge (the new object is the cache). **Upload analytics**: every completed upload emits a `media_upload` event (added to analytics-service `ALLOWED_EVENT_NAMES`) via a fire-and-forget POST to `{ANALYTICS_SERVICE_URL}/analytics/track` — metadata `{ contentType, uploadType, cacheControl, cachePolicy, sizeBytes, filename, key }` + the requesting `userId` — the raw material for CDN cache-budget planning (per-type volumes × TTLs → expected cache residency); a failed analytics POST is swallowed so it can never fail an upload. |

### 3.3 Universe services

**reality-service** (`reality_` prefix)
- `reality_voting_enabled` (on) — kill voting during result-reconciliation
- `reality_predictions_enabled` (on) — prediction market kill-switch
- `reality_live_voting` (off) — live in-episode voting
- `reality_auto_elimination` (off) — automated contestant elimination

**movie-service** (`movie_` prefix)
- `movie_rentals_enabled` (on), `movie_premieres_enabled` (on)
- `movie_cinema_pass` (off) — CinemaPass subscription product
- `movie_watchlist_sync` (off) — cross-device watchlist sync

**comedy-service** (`comedy_` prefix)
- `comedy_challenges_enabled` (off), `comedy_specials_gate` (off) — premium-gate comedy specials

**games-service** (`games_` prefix)
- `games_tournaments_enabled` (off) — tournament engine (payout risk)
- `games_trivia_ai` (off) — AI-generated questions
- `games_leaderboards_seasonal` (off) — seasonal leaderboard resets

**lifestyle-service** (`lifestyle_` prefix — 14 modules, biggest flag surface)
- `lifestyle_events_ticketing` (off) — event tickets/payments
- `lifestyle_stories_enabled` (on), `lifestyle_city_guide` (off), `lifestyle_influencer_verification` (off)
- `lifestyle_nightlife_booking` (off), `lifestyle_polls_enabled` (on), `lifestyle_quizzes_enabled` (on)
- Per-module kill-switches so one broken module (e.g., celebrity gossip feed) can be cut without touching the service

**vertical-service** (`vertical_` prefix)
- `vertical_crossovers_enabled` (off) — crossover content graph
- `vertical_timeline_enabled` (on), `vertical_lore_ai` (off) — AI lore generation
- `vertical_storyworlds_create` (off) — community-created storyworlds

**sports-service** (`sports_` prefix)
- `sports_prediction_markets` (on) — kill-switch for real-money-adjacent predictions
- `sports_fan_contests` (off), `sports_live_scores` (on), `sports_odds_feeds` (off) — third-party odds ingestion

**live-event-service** (`live_event_` prefix) — all **Implemented** (new `liveEventFlags` registry; `FeatureFlagModule` wired; spec +8)
- `live_event_ppv` (on) — pay-per-view gate on `getStreamUrl`: paid events require a purchased ticket when on; the ticket requirement is lifted when off
- `live_event_streaming` (on) — streaming backend kill-switch: `getStreamUrl` returns 403 when off
- `live_event_tickets` (off) — ticket sales: `purchaseTicket` 403 when off, before any wallet debit
- `live_event_chat` (off) — live chat moderation toggle: new events get `chatEnabled = requested && flag` (kill-switch wins)

**creator-service** (`creator_` prefix)
- `creator_onboarding_v2` (off), `creator_tips_enabled` (off), `creator_subscriptions_enabled` (off)
- `creator_payouts_enabled` (on) — **payout kill-switch** (money movement)
- `creator_monetization_insights` (off) — new analytics product — **Implemented**: `GET /creators/analytics` (the existing monetization analytics endpoint with content/audience/earnings breakdown) is FeatureFlagGuard-gated
- `creator_verification_manual` (on) — manual vs automated verification

### 3.4 Engagement services

**notification-service**
- `notification_push_ios` / `notification_push_android` (on) — per-platform push kill-switches
- `notification_email_enabled` (on), `notification_sms_enabled` (on)
- `notification_digest` (off) — **Implemented** — `sendDailyDigest(userId?)` (403 when off) emails each user's unread items since the per-user Redis marker (24h default) via the first-class `digest` template; admin-triggered `POST /v1/notifications/admin/digest/send`
- `notification_preferences_v2` (off) — **Implemented** — flag ON writes/reads the full `NotificationPreference` surface (per-channel columns, quietHours HH:MM, timezone, separate categoryOverrides); OFF keeps the legacy flat categoryOverrides map

**reward-service**
- `reward_points_enabled` (on), `reward_streaks` (off), `reward_badges` (off), `reward_missions` (off)
- `reward_double_points` (off) — promotional multiplier, toggled by marketing

**referral-service**
- `referral_program_enabled` (on), `referral_reward_boost` (off) — campaign multiplier
- `referral_auto_complete` (off) — auto-complete referrals on first deposit

**messaging-service**
- `messaging_dm_enabled` (on), `messaging_read_receipts` (off), `messaging_typing_indicator` (off)
- `messaging_media_sharing` (off) — attach images (storage cost)

**engagement-service**
- `engagement_leaderboards` (on), `engagement_rankings` (on), `engagement_predictions` (off)
- `engagement_event_ingest` (on) — pause event ingestion during backpressure

**subscription-service**
- `subscription_bundles` (off) — bundle subscribe/cancel endpoints
- `subscription_free_trial` (off) — **Implemented**: first-time subscribers (no prior subscription record) get a free trial — no payment, `paymentMethod: 'trial'`, endDate = `SUBSCRIPTION_TRIAL_DAYS` (default 7), zero-amount transaction; returning users are always charged
- `subscription_promo_discounts` (off) — **Implemented**: `promoCode` on `SubscribeToPlanDto`; `SUBSCRIPTION_PROMO_CODES` JSON registry (`{"LAUNCH10": 10}`) applies a % discount to the charged amount (wallet debit + external verification compare the discounted price), recorded in the transaction description; unknown codes charge full price
- `subscription_device_limits` (off) — **Implemented** (auth-service side): `DeviceLimitService.checkDeviceLimit` fetches the user's active plan from subscription-service (`GET /v1/subscriptions/current` with `x-user-id` + `x-gateway-secret`) and uses `plan.maxDevices` instead of `DEFAULT_MAX_DEVICES`; falls back to the env default when the user has no plan or the call fails; result carries `source: 'plan' | 'default'`
- `subscription_dunning` (on) — retry/payment recovery jobs

### 3.5 Operations services

**queue-service** — per-queue processor switches (the `QUEUE_CONFIG` map is the natural home)
- `queue_process_notifications` / `queue_process_payments` / `queue_process_emails` / `queue_process_analytics` / `queue_process_content` (all on) — pause individual queues during provider outages or migrations
- `queue_concurrency_payments` (numeric variant) — tune worker concurrency at runtime. **Implemented**: `PaymentProcessor.applyRuntimeConcurrency()` reads `getValue(queue_concurrency_payments)` and assigns it to the live BullMQ `worker.concurrency` (settable in bullmq ≥5.7) — applied in `onModuleInit` and re-applied on every job, so ops changes take effect within the flag cache TTL without a restart. Registered as a numeric `defaultValues` entry (default 5).
- `queue_dlq_retry` (on) — dead-letter retry policy toggle. **Implemented**: `PaymentProcessor.onFailed` detects final failures (`attemptsMade >= opts.attempts`) and, when the flag is on, re-queues the job **with a real delay**: the payments `Queue` is injected via `@InjectQueue('payments')` and the job is removed then re-added with the same `jobId` and `{ delay, attempts, backoff }` (BullMQ cannot delay-retry an existing failed job — `moveToDelayed` requires the active set and re-adding the same jobId is a silent no-op). Delays double per pass (base → 2×base → 4×base, capped at 1h); passes are bounded, tracked in `job.data.dlqRetryCount` (persisted via `updateData` before the re-add). Both knobs are **runtime-tunable numeric flags**: `queue_dlq_retry_max_passes` (default 3) and `queue_dlq_retry_base_delay_ms` (default 30000) — read fresh per final failure via `getValue`, so ops changes apply within the flag cache TTL. Precedence for the base delay: flag value → enqueuer's per-job `retryDelay` → 30s default. If the delayed re-add fails, the processor falls back to `job.retry('failed', { resetAttemptsMade: true })` so the job is never lost. When off (or budget exhausted) the job stays in the failed set for the manual retry endpoints. **Admin UI**: both knobs (plus `queue_concurrency_payments`) are tunable from the admin app's **Global Flags** page (`/feature-flags/global`) — numeric inputs with save/reset, grouped under the **queue-service** context chip.
- `queue_dlq_retry` **also drives `NotificationProcessor`** — **Implemented**: the same numeric-flag pattern is wired into the notification processor's dead-letter behavior, consuming the *same* `queue_dlq_retry` / `queue_dlq_retry_max_passes` / `queue_dlq_retry_base_delay_ms` flags so ops tunes one queue-service DLQ policy for both payment and notification jobs. `NotificationProcessor.onFailed` gates on the final attempt (`job.opts.attempts`, default 3 for the notifications queue), then removes the job and re-adds it to the injected `@InjectQueue('notifications')` queue with the same `jobId` and `{ delay, attempts, backoff }`, pass counter persisted in `job.data.dlqRetryCount`, delays doubling per pass (base → 2×base → 4×base, capped at 1h), flag base → per-job `retryDelay` → 30s constant, and the same fallback `job.retry('failed', { resetAttemptsMade: true })` if the delayed re-add fails. Per-job `maxRetries`/`retryDelay` fields on `NotificationJobData` remain available to producers as the pre-flag fallback.
- `queue_dlq_retry` **also drives `EmailProcessor`** — **Implemented**: the same numeric-flag pattern is wired into the email processor's dead-letter behavior, consuming the *same* `queue_dlq_retry` / `queue_dlq_retry_max_passes` / `queue_dlq_retry_base_delay_ms` flags — one queue-service DLQ policy across all three processors. `EmailProcessor.onFailed` gates on the final attempt (`job.opts.attempts`, default 3 for the emails queue), then removes the job and re-adds it to the injected `@InjectQueue('emails')` queue with the same `jobId` and `{ delay, attempts, backoff }`, pass counter persisted in `job.data.dlqRetryCount`, delays doubling per pass (base → 2×base → 4×base, capped at 1h), and the same fallback `job.retry('failed', { resetAttemptsMade: true })` if the delayed re-add fails. **The one difference: the email DLQ default base delay is 60s, not 30s** — it matches the emails queue's native exponential backoff (the longest in the app, `QUEUE_CONFIG.emails.delay: 60000`) because email is the most provider-throttle-prone surface; a slower DLQ cadence gives the provider time to recover. Precedence is unchanged: flag value → per-job `retryDelay` → 60s constant (the shared flag's 30000 `defaultValue` still wins when ops has set it). **Per-queue email overrides**: `EmailProcessor` now consumes the same stored-ness pattern — `queue_dlq_retry_emails` (toggle) plus `queue_dlq_retry_max_passes_emails` / `queue_dlq_retry_base_delay_ms_emails` win for the emails queue when stored, else the shared flags — so its budget can diverge from payments/notifications (e.g. a tighter email max-pass budget to limit provider-throttle blast radius).
- **Per-queue DLQ budgets for all three processors** — **Implemented**: nine new flags (toggles `queue_dlq_retry_payments` / `queue_dlq_retry_notifications` / `queue_dlq_retry_emails`, plus the `_max_passes` / `_base_delay_ms` numeric twins per queue) let ops tune each queue's dead-letter budget **independently** of the others and of the shared flags. Semantics are *overrides*: a per-queue flag is consulted only when **explicitly stored** — `PaymentProcessor` / `NotificationProcessor` check `getFlag(perQueue)` first (stored-ness, not `isEnabled`, because the admin UI lists the toggles as default-on) and use the per-queue value when present; otherwise they fall back to the shared `queue_dlq_retry` / `queue_dlq_retry_max_passes` / `queue_dlq_retry_base_delay_ms` flags exactly as before. This gives both directions of independence: a per-queue toggle **off** pauses DLQ retry for that queue while the shared switch stays on, and a per-queue toggle **on** resumes it while the shared switch is off; per-queue numerics override the shared budget for that queue only (e.g. payments max-passes 5 while notifications keeps 3). The shared flags' existing behavior is untouched until a per-queue flag is written. All nine are registered in the `queueFlags` registry and in queue-service's module defaults (toggles default-on in `defaultFlags`, numerics carry the same 3 / 30000 `defaultValues` for admin visibility — emails' stored overrides still let it diverge, and its 60s constant remains the no-default fallback) — so they list on the Global Flags page under **queue-service** from day one, and evaluation is unaffected by the defaults because it keys off stored-ness. The metric labels (`queue=payments|notifications|emails`) already separate the queues for dashboards.
- **DLQ policy visibility in the queue admin endpoints** — **Implemented**: `GET /v1/queue/dlq-policy` (QueueController, AdminGuard, gateway-routed) returns, per queue (payments/notifications/emails), the **effective resolved dead-letter policy**: for the toggle, max passes, and base delay it reports `{ source, value, key }` where `source` is `per-queue` (the queue-specific override is stored and won), `shared` (the shared flag is stored and won), or `default` (neither stored — the registered default or the queue's fallback constant applies, e.g. emails' 60s base). Resolution lives in `src/dlq-policy.ts` (`resolveDlqPolicy`) and mirrors the precedence the three processors evaluate inline in `maybeDeadLetterRetry` — stored-ness via `getFlag`, values via `getValue`/`isEnabled`, numerics validated and floored exactly like the processors (invalid stored values fall back to the per-queue constant) — so what ops sees is precisely what the processors will do. The per-job `retryDelay` fallback is job-level and intentionally not part of the queue-level policy. Ops can therefore confirm which flag won (and spot a stale override) without reading Redis or the admin flag UI.
- **DLQ retry metric** — **Implemented**: queue-service gained a prom-client `MetricsModule` (`GET /metrics`, `@Public`, default labels `service=queue-service` + environment, mirroring payment/auth/wallet/analytics). All three processors emit a job-level counter, `queue_dlq_retry_scheduled_total{queue, pass, base_delay_ms}`, exactly once per DLQ pass *actually scheduled* (incremented after the delayed re-add succeeds, so failed re-adds that fall back to in-place retry don't count). `base_delay_ms` carries the effective base delay at scheduling time (flag value → per-job `retryDelay` → default), so retry-latency dashboards can compute `rate × delay` backpressure per queue and see runtime flag-tuning changes reflected as new label values.

**support-service**
- `support_ai_chatbot` (off), `support_self_service_refunds` (off), `support_escalation_ai` (off)
- `support_takedowns_auto` (off) — automated DMCA takedown processing

**moderation-service**
- `moderation_ai_scans` (off) — third-party scan (cost + false positives)
- `moderation_auto_approve` (off) — trust-score-based auto-approval
- `moderation_auto_suspend` (off) — automated suspensions (abuse risk)
- `moderation_trust_scores` (off) — trust score computation

### 3.6 Intelligence services

**analytics-service**
- `analytics_sampling_rate` (numeric) — sample events when volume spikes
- `analytics_batch_ingest` (off) — batch vs per-event writes
- `analytics_report_builder_v2` (off) — new report builder UI/API

**recommendation-service**
- `recommendation_collaborative` / `recommendation_content_based` / `recommendation_hybrid` (off/off/on) — algorithm A/B
- `recommendation_cross_universe` (off), `recommendation_churn_model` (off), `recommendation_fraud_model` (off)
- `recommendation_creator_score` (off), `recommendation_personalized_feed` (off)
- `recommendation_caching` (on) — kill-switch for cached recommendations

---

## 4. Frontend Flag Recommendations

> **Implementation status (Phase 5):** the bootstrap endpoint is live — the gateway serves
> `GET /feature-flags/bootstrap` (public, per-user rollout hashing via JWT `sub`, stable
> `x-anonymous-id` for anonymous bucketing, returns only `isPublic` / `publicFlagKeys` flags).
> The web app consumes it via `apps/web/src/lib/flags.ts` + `FlagsContext` (localStorage TTL
> cache), with `MaintenanceGate` in the root layout driving `web_maintenance_mode` → `/maintenance`
> and AppHeader filtering universe nav entries by `universe.{name}.enabled`.

### 4.1 Web (`apps/web`)
- `web_maintenance_mode` (off) — render the existing `/maintenance` page app-wide (already has the route!) **— implemented**
- `web_new_home` (off) — new home layout/rails vs legacy
- `web_dark_mode` (on) — UI theme toggle
- `web_autoplay` (on) — wire existing `shouldAutoPlay()` to a server flag
- `web_low_data_default` (off) — default new users to low-data mode
- `web_recommendations_rail` (off) — show the recommendation rail
- `web_announcement_banner` (off) — ops-driven banner (e.g., outage notice)
- `web_premium_upsell` (off) — premium upsell placements
- Per-universe tabs (`/reality`, `/sports`, …) should render based on `universe.{name}.enabled` from bootstrap so a disabled universe disappears from nav.

### 4.2 Mobile (`apps/mobile`, Expo)
- `mobile_new_home` (off), `mobile_dark_mode` (on), `mobile_autoplay` (on)
- `mobile_low_data_default` (off) — data-conscious markets
- `mobile_universe_switcher` (on) — gate the universe switcher rail
- `mobile_push_enabled` (on) — remote-disable push registration
- `mobile_biometric_auth` (off) — biometric login rollout
- Same per-universe nav gating as web.

### 4.3 Admin (`apps/admin`)
- `admin_new_dashboard` (off) — new dashboard layout
- `admin_feature_flag_editor_v2` (off) — richer flag editor (rollout %, user lists, expiry)
- `admin_report_builder` (off) — gate the report builder route (already exists)
- `admin_bulk_actions` (off) — bulk content ops (dangerous — flag it)

**Global Flags page** (`/feature-flags/global`, nav "Global Flags 🎛️`) — **Implemented**. A full-stack global flag manager for the Redis store, complementary to the per-universe flag page:
- **Backend**: new `FeatureFlagsModule` in `apps/admin` (`FeatureFlagsController` at `admin/feature-flags`, guarded by `JwtAuthGuard` + `RolesGuard` for admin/superadmin, with `AuditLogService` entries on update/delete). `GET` lists stored flags merged with registered defaults via `getAllFlagsWithDefaults()` — now including numeric `defaultValues` (previously only boolean `defaultFlags` merged, so numeric knobs like the DLQ settings never listed). `PUT /:key` sets enabled/value/description/owner (audited as `feature_flag.updated`); `DELETE /:key` resets to default (audited `feature_flag.deleted`). **Rollout % + user targeting** — `UpdateFeatureFlagDto` now accepts `rolloutPercentage` (int 0–100) and `userIds` (unique string array), both persisted through `setFlag` and included in the audit trail; the evaluator was already honoring them (targeted users always get the flag; everyone else falls into a stable hash bucket within the rollout %), so the admin UI is the missing piece now filled in. `FeatureFlagModule.register({ global: true, defaultValues })` registers the queue DLQ defaults (max passes 3, base delay 30000ms) so they're visible before first write.
- **Gateway**: `GET/PUT/DELETE /v1/admin/feature-flags[/:key]` added to the admin proxy block (route registry + forwarding to `admin-service`).
- **Client**: `GlobalFeatureFlag` type + `listGlobalFeatureFlags` / `updateGlobalFeatureFlag` / `resetGlobalFeatureFlag` API methods; the page renders one card per flag with a service-context chip derived from the typed registries' key prefixes (queue-service, search-service, media, auth, payment, …), numeric flags get a **number input + Save + Reset to default** (save disabled until the draft differs), boolean flags get an on/off toggle plus a **rollout & targeting** sub-section: a 0–100 range slider with live %, a comma/space-separated user-ID input, an Apply button (enabled only when the draft differs from the stored values; parses/dedupes/clamps on commit) and a Clear button that restores 100% rollout with no targeted users; the card shows the current serving state ("Currently served to X% of users · N targeted users"). Context filter chips and search filter the list.
- **Verification**: feature-flags package spec 25/25, admin backend jest 15/15 (5 suites), admin client `tsc --noEmit` + `vite build` clean, gateway proxy controller spec 17/17. (Jest suites run under Node 22 — jest 29.7 aborts on the local Node 26; a Node 22 binary lives in `.freebuff/node22/` for CI-equivalent runs. The admin client's only spec is a Playwright e2e that vitest shouldn't collect.)

**Search Analytics panel** (`/search`, nav "Search 🔍") — **Implemented**. A search-team dashboard for the 'did you mean' correction funnel: range selector (7/14/30/90 days), summary cards (suggestions shown, corrections accepted, acceptance rate all-time + last 7 days), a hand-rolled SVG chart (per-day shown/accepted bars with the acceptance-rate line on a 0–100% scale, hover tooltips), and an accessible daily breakdown table. Backed by `GET /v1/analytics/search/corrections?days=N` — a new analytics-service endpoint whose `getSearchCorrections` aggregates `product_events` with `DATE_TRUNC('day')` + `COUNT(*) FILTER` over the two correction event names, fills the contiguous range with zeros, and clamps days to [1,90]; registered in the gateway analytics proxy block. The underlying events (`content_search_correction_shown`/`accepted`) were also added to analytics-service `ALLOWED_EVENT_NAMES` — they were previously rejected by ingest validation, so the chart only has data from this change forward.

### 4.4 Creator (`apps/creator`)
- `creator_new_analytics` (off), `creator_upload_v2` (off), `creator_payouts_ui` (off)
- `creator_onboarding_wizard` (off)

---

## 5. Shared Packages & Infra

| Package | Flag opportunity |
|---|---|
| `packages/feature-flags` | The upgrades in §2 (cache, typed registry, bootstrap endpoint, browser bundle, audit, metrics) |
| `packages/analytics-sdk` | `analytics_client_sampling` — sample client events via bootstrap flags |
| `packages/api-client` | Read `featureFlags` from bootstrap response; expose `isFlagEnabled()` to all apps |
| `packages/shared-queue` | `queue_*` per-processor toggles consumed centrally |
| `packages/event-bus` | `events_consume_{eventType}` — pause consumers per event type (already an event catalog) |
| `packages/shared-services` | A global `FeatureFlagModule.forRoot()` shared by all services so Redis URL/prefix/audit are configured once |
| `packages/security` | `security_rate_limit_strict`, `security_helmet_strict` — tighten middleware progressively |
| `infra/`, `deploy/`, `.github/workflows` | `deploy_canary` gate in CD — flag-driven canary %; smoke tests skip when `gateway_maintenance_mode` on |
| `scripts/local-dev.sh` | Seed a known set of dev flags on `setup`; `local-dev.sh db seed` populates `feature_flags:*` Redis keys |

---

## 6. Suggested Rollout Order

1. **Phase 1 — Foundation (§2):** caching, typed registry, fixed guard, audit + metrics, admin UI writes to Redis. (~1 sprint)
2. **Phase 2 — Financial kill-switches:** `wallet_withdrawals_enabled`, `payment_provider_*`, `creator_payouts_enabled`, `subscription_dunning`, `live_event_ppv`. Highest risk → first coverage.
3. **Phase 3 — Platform toggles:** gateway maintenance/CSRF/rate-limit, queue per-processor, notification channels, auth (social, MFA, device limits).
4. **Phase 4 — Universe & engagement flags:** per-universe feature toggles, games/reality/sports risk surfaces, reward/referral promos.
5. **Phase 5 — Frontend:** bootstrap endpoint + web/mobile consumption, maintenance mode, nav gating.
6. **Phase 6 — Intelligence:** recommendation algorithm A/B, analytics sampling, moderation AI gates.

---

## 7. Conventions Summary

- `{domain}_{feature}_enabled` — boolean kill-switch, **default on**
- `{domain}_{feature}_v2` / `{domain}_{new_feature}` — new feature, **default off**, rollout via percentage
- Numeric flags (e.g., `analytics_sampling_rate`, `queue_concurrency_payments`) need the Redis schema to support `number` values — extend `FeatureFlag` interface with a `value?: string | number | boolean | Json` variant field.
- Every flag gets `owner`, `description`, `staleAfter`, `isPublic` in metadata.
- Every toggle writes an audit-log entry and emits a metric.
- Remove flags within 2 sprints of full rollout (list stale flags in admin UI).

<!-- flag-registry-table:start -->
## Appendix A — Per-Service Flag Registry (machine-checked)

Generated from `packages/feature-flags/src/registries.ts` by
`scripts/generate-flag-registry-table.mjs` — **do not edit by hand**.
After adding or renaming a flag, re-run the generator; CI (`check:flags:docs`)
fails if this table is stale. Each domain is a registry consumed by one
service (or client surface for `web` / `mobile` / `admin`).

**32 domains · 191 unique flag keys.**

| Domain | Flag key |
| --- | --- |
| admin | `admin_bulk_actions` |
| admin | `admin_feature_flag_editor_v2` |
| admin | `admin_new_dashboard` |
| admin | `admin_report_builder` |
| analytics | `analytics_batch_ingest` |
| analytics | `analytics_client_sampling` |
| analytics | `analytics_report_builder_v2` |
| analytics | `analytics_sampling_rate` |
| auth | `auth_device_limits` |
| auth | `auth_email_verification_required` |
| auth | `auth_mfa_required_for_admins` |
| auth | `auth_mfa_totp` |
| auth | `auth_otp_email` |
| auth | `auth_otp_sms` |
| auth | `auth_passwordless_magic_link` |
| auth | `auth_refresh_rotation` |
| auth | `auth_role_select` |
| auth | `auth_social_apple` |
| auth | `auth_social_google` |
| comedy | `comedy_challenges_enabled` |
| comedy | `comedy_specials_gate` |
| content | `content_ai_tags` |
| content | `content_clip_ingestion` |
| content | `content_comments_v2` |
| content | `content_moderation_enabled` |
| content | `content_premium_gate` |
| content | `content_recommended_rail` |
| content | `content_transcoding_new` |
| content | `content_windowing_enabled` |
| creator | `creator_monetization_insights` |
| creator | `creator_new_analytics` |
| creator | `creator_onboarding_wizard` |
| creator | `creator_payouts_enabled` |
| creator | `creator_payouts_ui` |
| creator | `creator_subscriptions_enabled` |
| creator | `creator_tips_enabled` |
| creator | `creator_upload_v2` |
| engagement | `engagement_event_ingest` |
| engagement | `engagement_leaderboards` |
| engagement | `engagement_predictions` |
| engagement | `engagement_rankings` |
| games | `games_leaderboards_seasonal` |
| games | `games_tournaments_enabled` |
| games | `games_trivia_ai` |
| gateway | `gateway_api_v2` |
| gateway | `gateway_circuit_breaker` |
| gateway | `gateway_csrf_enforce` |
| gateway | `gateway_legacy_redirect` |
| gateway | `gateway_maintenance_mode` |
| gateway | `gateway_new_routes` |
| gateway | `gateway_response_cache` |
| gateway | `gateway_strict_rate_limits` |
| lifestyle | `lifestyle_celebrity_feed` |
| lifestyle | `lifestyle_city_guide` |
| lifestyle | `lifestyle_events_ticketing` |
| lifestyle | `lifestyle_influencer_verification` |
| lifestyle | `lifestyle_music_enabled` |
| lifestyle | `lifestyle_nightlife_booking` |
| lifestyle | `lifestyle_polls_enabled` |
| lifestyle | `lifestyle_quizzes_enabled` |
| lifestyle | `lifestyle_social_enabled` |
| lifestyle | `lifestyle_stories_enabled` |
| liveEvent | `live_event_chat` |
| liveEvent | `live_event_ppv` |
| liveEvent | `live_event_streaming` |
| liveEvent | `live_event_tickets` |
| media | `media_cdn_edge_cache` |
| media | `media_presigned_urls` |
| media | `media_transcode_av1` |
| media | `media_upload_chunked` |
| media | `media_virus_scan` |
| messaging | `messaging_dm_enabled` |
| messaging | `messaging_media_sharing` |
| messaging | `messaging_read_receipts` |
| messaging | `messaging_typing_indicator` |
| mobile | `mobile_autoplay` |
| mobile | `mobile_biometric_auth` |
| mobile | `mobile_dark_mode` |
| mobile | `mobile_low_data_default` |
| mobile | `mobile_new_home` |
| mobile | `mobile_push_enabled` |
| moderation | `moderation_ai_scans` |
| moderation | `moderation_auto_approve` |
| moderation | `moderation_auto_suspend` |
| moderation | `moderation_trust_scores` |
| movie | `movie_cinema_pass` |
| movie | `movie_premieres_enabled` |
| movie | `movie_rentals_enabled` |
| movie | `movie_watchlist_sync` |
| notification | `notification_digest` |
| notification | `notification_email_enabled` |
| notification | `notification_preferences_v2` |
| notification | `notification_push_android` |
| notification | `notification_push_ios` |
| notification | `notification_sms_enabled` |
| payment | `payment_intents_api` |
| payment | `payment_kyc_required` |
| payment | `payment_new_checkout_flow` |
| payment | `payment_provider_flutterwave` |
| payment | `payment_provider_paystack` |
| payment | `payment_scheduled_tasks` |
| payment | `payment_self_service_refund` |
| payment | `payment_webhooks_enabled` |
| queue | `queue_concurrency_payments` |
| queue | `queue_dlq_retry` |
| queue | `queue_dlq_retry_base_delay_ms` |
| queue | `queue_dlq_retry_base_delay_ms_emails` |
| queue | `queue_dlq_retry_base_delay_ms_notifications` |
| queue | `queue_dlq_retry_base_delay_ms_payments` |
| queue | `queue_dlq_retry_emails` |
| queue | `queue_dlq_retry_max_passes` |
| queue | `queue_dlq_retry_max_passes_emails` |
| queue | `queue_dlq_retry_max_passes_notifications` |
| queue | `queue_dlq_retry_max_passes_payments` |
| queue | `queue_dlq_retry_notifications` |
| queue | `queue_dlq_retry_payments` |
| queue | `queue_process_analytics` |
| queue | `queue_process_content` |
| queue | `queue_process_emails` |
| queue | `queue_process_notifications` |
| queue | `queue_process_payments` |
| reality | `reality_auto_elimination` |
| reality | `reality_live_voting` |
| reality | `reality_predictions_enabled` |
| reality | `reality_voting_enabled` |
| recommendation | `recommendation_caching` |
| recommendation | `recommendation_churn_model` |
| recommendation | `recommendation_collaborative` |
| recommendation | `recommendation_content_based` |
| recommendation | `recommendation_creator_score` |
| recommendation | `recommendation_cross_universe` |
| recommendation | `recommendation_fraud_model` |
| recommendation | `recommendation_hybrid` |
| recommendation | `recommendation_personalized_feed` |
| referral | `referral_auto_complete` |
| referral | `referral_program_enabled` |
| referral | `referral_reward_boost` |
| reward | `reward_badges` |
| reward | `reward_double_points` |
| reward | `reward_missions` |
| reward | `reward_points_enabled` |
| reward | `reward_streaks` |
| search | `search_faceted` |
| search | `search_fuzzy_trigram_weight` |
| search | `search_index_population` |
| search | `search_index_repair` |
| search | `search_log_queries` |
| search | `search_suggestions_ai` |
| search | `search_trending_cached` |
| search | `search_typo_dictionary` |
| search | `search_typo_tolerance` |
| security | `security_rate_limit_strict` |
| sports | `sports_fan_contests` |
| sports | `sports_live_scores` |
| sports | `sports_odds_feeds` |
| sports | `sports_prediction_markets` |
| subscription | `subscription_bundles` |
| subscription | `subscription_device_limits` |
| subscription | `subscription_dunning` |
| subscription | `subscription_free_trial` |
| subscription | `subscription_promo_discounts` |
| support | `support_ai_chatbot` |
| support | `support_escalation_ai` |
| support | `support_self_service_refunds` |
| support | `support_takedowns_auto` |
| user | `user_continue_watching` |
| user | `user_deletion_soft` |
| user | `user_follow_system` |
| user | `user_privacy_settings_v2` |
| user | `user_profile_v2` |
| user | `user_universe_affinity` |
| vertical | `vertical_crossovers_enabled` |
| vertical | `vertical_lore_ai` |
| vertical | `vertical_storyworlds_create` |
| vertical | `vertical_timeline_enabled` |
| wallet | `wallet_bonus_credit` |
| wallet | `wallet_distributed_lock` |
| wallet | `wallet_fraud_checks` |
| wallet | `wallet_ledger_v2` |
| wallet | `wallet_promo_credit` |
| wallet | `wallet_redeem_rewards` |
| wallet | `wallet_transfers_enabled` |
| wallet | `wallet_withdrawals_enabled` |
| web | `web_announcement_banner` |
| web | `web_autoplay` |
| web | `web_dark_mode` |
| web | `web_low_data_default` |
| web | `web_maintenance_mode` |
| web | `web_new_home` |
| web | `web_premium_upsell` |
| web | `web_recommendations_rail` |

<!-- flag-registry-table:end -->
