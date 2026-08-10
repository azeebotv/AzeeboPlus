# Azeebo+ Implementation Todo

> **Last updated:** 2026-08-10
> Master implementation tracker for the **Feature Flag Program** — see `docs/feature-flags-implementation.md` for the full plan this file operationalizes. Also retains the pre-existing audit backlog from the earlier `todo.md`.

## Status Legend

- `[ ]` — not started · `[~]` — in progress · `[x]` — done · `[!]` — blocked
- Phases are ordered; Phase 1 is the foundation everything else depends on.

---

## Phase 0 — Pre-existing Audit Backlog (carried over)

### Critical Security & Quality Issues

| # | File | Issue | Line / Context | Severity | Suggested Fix |
|---|------|-------|----------------|----------|---------------|
| 1 | `packages/error-handling/types/ReducingInput.ts` | Uses `any` type for input | `type ReducingInput = any;` | HIGH | Replace with explicit generic types (e.g., `type ReducingInput<T> = (input: T) => T;`) |
| 2 | `packages/opentelemetry/dataInterfaces.ts` | Hard-coded price values | `price: 99.99;` | HIGH | Move all pricing constants to a centralized config file and reference via env variables |
| 3 | Various services | `console.log`/debug statements in production code | e.g. auth-service | HIGH | Replace with `logger.debug()` from shared logger |
| 4 | Many `services/*/health.controller.ts` | Missing/incomplete `GET /health` with DB ping | No DB connection check | HIGH | Standardize health controller with `await prisma.$queryRaw('SELECT 1')` |
| 5 | `payment-service` | Missing idempotency-key validation on refund/payment endpoints | No `Idempotency-Key` check | HIGH | Implement idempotency via Redis with TTL + strict key mapping |
| 6 | `wallet-service` | No audit trail on wallet transactions | No ledger entry on charge/debit | HIGH | Add entries to `wallet_ledger` (operation_type, amount, timestamp, user_id) |
| 7 | Multiple services | Re-implemented utility functions (validation, response formatting) | Duplicate `toSuccessResponse` | MEDIUM | Extract shared utilities into `packages/shared-utils/` |
| 8 | Engagement services | Inconsistent analytics event naming (snake_case vs camelCase) | `reality_vote_created` vs `RealityVoteCreated` | MEDIUM | Shared `AnalyticsEvent` enum + lint rule |
| 9 | Intelligence services | Missing unit/integration tests for new features | No `*.test.ts` files | MEDIUM | Jest + ts-jest scaffolding; target 80% coverage |
| 10 | `search-service` | Potential N+1 query in search index refresh | Loop query per item | MEDIUM | Batch fetch with `WHERE id IN (...)` |
| 11 | `packages/auth` | Duplicate JWT strategy definitions | Two identical `JwtStrategy` classes | LOW | Consolidate into shared strategy |
| 12 | `packages/shared-types` | Multiple base entity definitions | Duplicate interfaces | LOW | Single canonical definition |

### Testing / Analytics / Docs backlog
- [ ] Unit tests for `packages/logger/logger.middleware.ts`
- [ ] Integration tests for `queue-service` worker/processor paths
- [ ] E2E coverage for payment failure + refund flow (currently success-path only)
- [ ] Conversion events on checkout success page (`apps/web` CheckoutSuccess)
- [ ] Adopt shared `EventPayload` interface across services
- [ ] Centralize price constants (`PRICE_CONFIG`)
- [ ] Lint rule: `no-console-log` in production builds
- [ ] Swagger/OpenAPI spec version consistency + `swagger-cli validate` in CI

---

## Phase 1 — Feature-Flag Infrastructure Foundation

> Everything in later phases depends on this. Target: 1 sprint.

### 1.1 `packages/feature-flags` package hardening
- [x] Add in-process TTL cache (30–60s) to `FeatureFlagService`; invalidate on `setFlag`/`enableFlag`/`disableFlag`/`deleteFlag` + `clearCache()`
- [x] Add batch APIs `getFlags(keys)` / `evaluateMany(keys)` + `getPublicFlags()` to service
- [x] Extend `FeatureFlag` interface with `value?: FlagValue` (variant support) + `owner`, `staleAfter`, `isPublic`, `lastToggledBy`
- [x] Fix anonymous rollout bucketing: per-request anonymous id param instead of process-global `process.env.ANONYMOUS_ID`
- [x] Add `@FeatureFlag('key')` decorator with **deny-by-default** semantics; legacy `x-feature-flag` header kept as opt-in
- [x] Add `onEvaluation` (metrics) + `onToggle` (audit) hooks in config
- [x] Unit tests (jest spec) for rollout determinism, user targeting, anonymous buckets, cache invalidation, guard semantics; logic smoke-verified via compiled-node run (jest unrunnable on local Node 26 — see §8)
- [x] Split NestJS-free `core.ts` from `nestjs.ts` glue; public `index.ts` keeps export surface
- [x] Rebuild `dist`
- [ ] Browser bundle export for client-side consumption (Phase 5.1)
- [ ] Bump package version to 1.1.0

### 1.2 Single source of truth — unify Redis + Postgres flag systems
- [x] Add `universeFlagKey(name, feature)` helper + `global` module option to the package
- [x] Bridge: admin `universe-management.service.ts` publishes flag writes to Redis (`feature_flags:universe.<name>.<key>`) incl. `universe.<name>.enabled` sentinel; `checkFeatureFlag` reads Redis first, DB fallback
- [~] Bridge: content-service `UniverseFeatureFlag` CRUD — `AdminController`/`AdminService` are **unregistered dead code** (confirmed); runtime surface is the admin app, which is bridged
- [x] Runtime services evaluate `universe.{name}.{feature}` via the Redis key convention
- [ ] Resolve the duplicate `UniverseFeatureFlag` models (content-service DB vs admin DB) — documented in plan; needs data reconciliation
- [x] Deduplicate `FeatureFlagModule.register({})` in content-service via `global: true` (single Redis client)
- [x] Add `ioredis@^5.11.1` to `apps/admin` (package.json + lockfile importer; symlinked from store for local build)

### 1.3 Global module wiring
- [ ] Add `FeatureFlagModule.forRoot()` to `packages/shared-services` (current `FeatureFlagModule.register({ global: true })` pattern works; shared wrapper is a convenience)
- [~] Wire registration into service `app.module.ts` — done for wallet, payment, creator, subscription (flag consumers so far); remaining in §7
- [x] Add `FEATURE_FLAG_REDIS_URL` to `.env.example` (falls back to `REDIS_URL` in code)
- [ ] Add to `scripts/local-dev.sh` `.env.local` generation + docker-compose env

### 1.4 Admin management UI
- [x] Fixed broken client API — `listFeatureFlags`/toggle/create/delete now hit the real admin-backend routes (`/admin/universes/feature-flags`), which publish to Redis server-side
- [x] Rewrote `feature-flags.tsx` for the real backend shape + universe selector + rollout % + user allowlist + stale-after editor
- [x] Add stale-flag badge + count in the UI
- [ ] Audit history panel per flag (reuse audit-logs infra)
- [ ] Typed "known flags" reference per service (registry exists in package; UI wiring pending)

### 1.5 Typed flag registries
- [x] Create `packages/feature-flags/src/registries.ts` with `as const` registries for 14 domains + `allFlagRegistries` + `KnownFlagKey` type
- [ ] Generate admin "known flags" reference from registries
- [ ] `FEATURE_FLAG_DEFAULT_*` env override convention doc (README already references it)

---

## Phase 2 — Financial Kill-Switches (highest risk first)

> All default-on boolean kill-switches. Target: 1 sprint.

### 2.1 wallet-service
- [x] `wallet_withdrawals_enabled` → `/withdraw` endpoint (guard + flag, default ON)
- [x] `wallet_transfers_enabled` (off) → `/transfer`
- [x] `wallet_bonus_credit` / `wallet_promo_credit` (off) → `/bonus-credit`, `/promo-credit`
- [x] `wallet_redeem_rewards` → `/redeem-reward`
- [ ] `wallet_distributed_lock` → debit/credit lock path
- [ ] `wallet_ledger_v2` (off) → new ledger writer
- [ ] `wallet_fraud_checks` (off) → velocity/pattern checks on transactions
- [x] Spec mocks for `FeatureFlagGuard` in 4 controller specs; typecheck green

### 2.2 payment-service
- [x] `payment_provider_paystack` / `payment_provider_flutterwave` (on) → `getActiveProvider()` in `payments.service.ts` (paystack → flutterwave fallback; both off → 400)
- [ ] Percentage-based provider routing (A/B traffic split between gateways) — needs rollout-aware provider pick
- [x] `payment_webhooks_enabled` → guards on both webhook endpoints
- [ ] `payment_new_checkout_flow` (off) → `/initialize` alternate path
- [ ] `payment_intents_api` (off) → `/intent`
- [x] `payment_self_service_refund` (off) → guard on `/refund-request`
- [ ] `payment_kyc_required` (off) → deposit gating
- [x] `payment_scheduled_tasks` → cron cleanup methods skip when disabled
- [x] Spec mocks for `FeatureFlagService` in 7 specs; fixed pre-existing unused-var in controller spec; typecheck green

### 2.3 creator-service
- [x] `creator_payouts_enabled` → `/payouts` (default ON)
- [x] `creator_tips_enabled` (off) → `/tips/:creatorId`
- [x] `creator_subscriptions_enabled` (off) → `POST`/`DELETE /subscribe/:creatorId`
- [ ] `creator_monetization_insights` (off) → monetization analytics
- [x] Contract spec mocked; typecheck green

### 2.4 subscription-service
- [x] `subscription_bundles` (off) → bundle subscribe/cancel endpoints
- [ ] `subscription_free_trial` (off) → trial grant (no trial logic exists yet)
- [ ] `subscription_promo_discounts` (off) → promo pricing
- [x] `subscription_dunning` → guard on `/renew/:id`
- [ ] `subscription_device_limits` (off) → enforce `maxDevices`/`maxStreams` (auth-service side)
- [x] Contract spec mocked; typecheck green

### 2.5 live-event-service
- [ ] `live_event_ppv` → PPV gate on live events
- [ ] `live_event_streaming` → streaming backend switch
- [ ] `live_event_tickets` (off) → ticket sales
- [ ] `live_event_chat` (off) → live chat moderation toggle
- [ ] Tests

---

## Phase 3 — Platform Toggles

### 3.1 api-gateway
- [ ] `gateway_maintenance_mode` (off) → global 503 in `proxy.controller.ts`
- [ ] Wire web `/maintenance` page to the flag via bootstrap (§5.1)
- [ ] `gateway_new_routes` (off) → gate new `SERVICE_CONFIGS` entries (e.g., `/live-events`, `/vertical`)
- [ ] `gateway_circuit_breaker` (on) → `CircuitBreakerProxyService`
- [ ] `gateway_response_cache` (on) → per-route-family proxy caching
- [ ] `gateway_strict_rate_limits` (off) → `ThrottlerModule` limits
- [ ] `gateway_csrf_enforce` (on) → `CsrfMiddleware`
- [ ] `gateway_legacy_redirect` (on) → `LegacyRedirectMiddleware`
- [ ] `gateway_api_v2` (off) → v2 version routing
- [ ] Smoke/e2e: maintenance mode returns 503; route gating works

### 3.2 auth-service
- [x] `auth_social_google` / `auth_social_apple` (on) → social controllers
- [x] `auth_mfa_totp` (off) → `mfa/` module; then `auth_mfa_required_for_admins` (off) — registered, admin enforcement TBD
- [x] `auth_otp_email` / `auth_otp_sms` (on) → `otp/` controller channel routing (SMS path gated; email OTP registered — no email-OTP endpoint exists yet)
- [ ] `auth_passwordless_magic_link` (off) → login flow (registered; magic-link endpoint not implemented)
- [x] `auth_device_limits` (off) → device controller (GET/revoke/revoke-all gated)
- [x] `auth_refresh_rotation` (on) → refresh token rotation (POST /auth/refresh gated)
- [x] `auth_email_verification_required` (off) → signup gating (register issues no tokens + sends verification email; login blocked with 403 `email_not_verified` until verified); verification link is a first-class `email-verification` template through notification-service `POST /v1/notifications/email`; tokens expire after 1h with a per-token attempt budget (5 → burned, 429) + per-user resend throttle (3/hr); **post-verification auto-login**: `verifyEmail` issues fresh access/refresh tokens via `generateTokens` so the user is signed in immediately
- [x] `auth_role_select` (on) → `/select-role`
- [ ] Tests: each auth flag branch + OAuth provider kill simulation### 3.3 queue-service
- [x] `queue_process_notifications` (on) → notification processor
- [x] `queue_process_payments` (on) → payment processor
- [x] `queue_process_emails` (on) → email processor
- [x] `queue_process_analytics` (on) → analytics queue (registered; no processor class exists yet)
- [x] `queue_process_content` (on) → content-processing queue (registered; no processor class exists yet)
- [x] `queue_concurrency_payments` (numeric) → worker concurrency tuning (PaymentProcessor.applyRuntimeConcurrency, applied on init + per job)
- [x] `queue_dlq_retry` (on) → dead-letter retry policy (PaymentProcessor.onFailed bounded auto-retry, delayed re-add via injected payments Queue with `{ jobId, delay }`, exponential base→2×→4×); max passes + base delay are runtime-tunable numeric flags (`queue_dlq_retry_max_passes` default 3, `queue_dlq_retry_base_delay_ms` default 30000, flag > per-job retryDelay > default)
- [x] **DLQ flags in admin UI** — global feature-flags page (`/feature-flags/global`): full stack (admin `FeatureFlagsModule` GET/PUT/DELETE with roles+audit, gateway `/v1/admin/feature-flags[/:key]` routes, client page with numeric inputs + service-context chips for queue-service); `getAllFlagsWithDefaults` now merges numeric `defaultValues` so `queue_dlq_retry_max_passes` / `queue_dlq_retry_base_delay_ms` (and `queue_concurrency_payments`) list before first write
- [x] **DLQ retry in NotificationProcessor** — same numeric-flag pattern as payments: `onFailed` dead-letter gate on the same `queue_dlq_retry` / `queue_dlq_retry_max_passes` / `queue_dlq_retry_base_delay_ms` flags (one queue-service DLQ policy), `@InjectQueue('notifications')` re-add with `{ jobId, delay }`, `dlqRetryCount` in job data, exponential base→2×→4× capped at 1h, fallback in-place `retry` when the delayed re-add fails; spec mirrors the payment DLQ suite (9 tests)
- [x] **DLQ retry metric** — new queue-service `MetricsModule` (prom-client, `GET /metrics` @Public like other services); both processors emit `queue_dlq_retry_scheduled_total{queue, pass, base_delay_ms}` once per DLQ pass actually scheduled (after the delayed re-add succeeds), feeding retry-latency dashboards (rate × delay) and showing runtime flag-tuning changes
- [ ] Tests: processor pause/resume behavior
### 3.4 notification-service
- [x] `notification_push_ios` / `notification_push_android` (on) → per-platform push (channel gate in `sendPushNotification`)
- [x] `notification_email_enabled` (on) → email channel
- [x] `notification_sms_enabled` (on) → SMS channel
- [ ] `notification_digest` (off) → daily digest
- [ ] `notification_preferences_v2` (off) → new preference model
- [ ] Tests
### 3.5 user-service
- [ ] `user_profile_v2` (off) → `/me` PATCH new validation (registered; v2 validation TBD)
- [x] `user_universe_affinity` (off) → affinity endpoints
- [x] `user_continue_watching` (on) → history/resume tracking
- [x] `user_deletion_soft` (on) → `user-deletion.controller.ts`
- [x] `user_follow_system` (off) → `/:id/follow`
- [x] `user_privacy_settings_v2` (off) → privacy endpoints
- [ ] Tests

### 3.6 media-service
- [ ] `media_upload_chunked` (off) → chunked/resumable upload (registered; endpoint not implemented)
- [x] `media_presigned_urls` (on) → signed-URL flow
- [x] `media_transcode_av1` (off) → AV1 transcoding (controller + `scheduleTranscoding` gated)
- [ ] `media_virus_scan` (off) → upload scanning hook (registered; scanner not implemented)
- [x] `media_cdn_edge_cache` (on) → CDN edge cache headers varied by content type (UploadService.getCacheControl(mimetype): images immutable 1y, videos 1d, audio/documents 7d, unknown 1h when on; private/no-store when off) on all 7 upload endpoints + CDN purge endpoint (`POST /admin/cdn/purge` → CdnPurgeService/CloudFront invalidation for keys or prefix, so flipping the flag off actually evicts cached uploads); **per-type TTLs now env-configurable** — `MEDIA_CACHE_TTL_IMAGE/VIDEO/AUDIO/DOCUMENT/DEFAULT` (seconds, read in the constructor with parse+positive validation, fallback to the previous defaults) replace the hard-coded constants; documented in `services/core/media-service/.env.example`; **typed `cachePolicy` enum on `UploadResponse`** (`no-store | immutable | long-lived | medium-lived | short-lived`) — bands track the resolved max-age (≥7d/≥1d/<1d) so env tuning re-bands automatically; mirrored as `UploadCachePolicy` on mobile `MediaUploadResponse`; **`media_upload` analytics event** per upload (`eventName: 'media_upload'`, added to analytics-service `ALLOWED_EVENT_NAMES`) carrying `contentType`, `uploadType`, applied `cacheControl`, `cachePolicy`, `sizeBytes`, `key` + `userId` from the request — fire-and-forget POST to `/analytics/track`, never fails the upload; **automated off-flip purge** — `CdnFlagPurgeQueueService` (UploadModule) polls `media_cdn_edge_cache` every `MEDIA_CDN_FLAG_POLL_MS` (default 30s, matching the flag cache TTL), and on an on→off transition queues a deduped, single-flight in-process purge job that runs `CdnPurgeService.purgePrefix('uploads')` (`/uploads/*` invalidation), so ops no longer has to call `POST /admin/cdn/purge` manually; first poll only seeds state (boot with flag off never purges); poll failures retry next tick; interval unref'd + cleared on destroy; **one-click Purge CDN button** on the `media_cdn_edge_cache` card in the admin Global Flags page (confirm → `POST /api/v1/media/admin/cdn/purge` `{ prefix: 'uploads' }` via the gateway's media proxy block + new `purgeCdn` client API method, in-flight/success/error feedback)
- [ ] Tests

---

## Phase 4 — Universe & Engagement Flags

### 4.1 content-service (extend existing usage)
- [ ] Keep `content_moderation_enabled` — add defaults + audit
- [ ] `content_transcoding_new` (off) → `startTranscoding` pipeline choice
- [ ] `content_ai_tags` (off) → ingestion AI tagging
- [ ] `content_clip_ingestion` (off) → `ingestClipContent`
- [ ] `content_comments_v2` (off) → threaded comments
- [ ] `content_windowing_enabled` (on) → `checkContentAvailability`
- [ ] `content_premium_gate` (off) → access-check gating
- [ ] `content_recommended_rail` (off) → recommendation rail in feed
- [ ] Bridge per-universe flags (`universe.{name}.{feature}`) into feed/discovery
- [ ] Tests

### 4.2 search-service
- [x] `search_faceted` (off) → `searchWithFacets`
- [x] `search_typo_tolerance` (off) → fuzzy matching in `search()` (Levenshtein scoring via `fuzzy.ts`; candidate retrieval in Postgres via `pg_trgm` migration — GIN trigram indexes + `similarity()`/ILIKE in the WHERE (`$queryRaw`), so the pool is SQL-computed and index-backed instead of a bounded in-process heuristic; retrieval SELECTs per-column `similarity()` values; **blended relevance**: precision filter on `fuzzyScore` (0.5), ranking + reported score via `blendScore(fuzzy, trigram)` — decisive matches (≥0.85) keep their score, corrections blend 60/40 so strong n-gram overlap lifts near-misses; per-item `score` (0–1) surfaced on fuzzy results for rank badges / did-you-mean; exact uncapped `pagination.total` via parallel `count(*)` over the same trigram predicate; **pg_trgm startup guard** — `onModuleInit` probes `pg_extension` for the extension and, if missing (or the probe is inconclusive), `search()` warns (throttled) and falls back to the exact path instead of 400ing; state re-probed lazily on a 60s interval so a missing extension that gets created later (or a DB down at boot) self-heals without restart; runtime `similarity`/`pg_trgm` errors in the fuzzy path also degrade to the exact path; **ops visibility** — `GET /health` returns `search` status (`enabled`, `pgTrgm: available|missing|unknown`, `indexes: present|missing|unknown`, `degraded`, `warning?`, `mode`, `lastProbeAt`) via `SearchService.getFuzzyStatus()`, reporting degradation without flipping health to 503; **startup migration check** — the probe counts the six GIN trigram indexes in `pg_indexes`, warning (throttled) when the extension exists without them and surfacing `indexes: 'missing'` + `warning` on /health; **score components** — fuzzy results expose `fuzzyScore`/`trigramScore` alongside `score` on content/creators/universes for 'matched because' breakdowns (exact path omits them); **runtime-tunable blend** — numeric flag `search_fuzzy_trigram_weight` (default 0.4, registered in `defaultValues`) sets the trigram weight per search via `getValue`, clamped to [0,1], anchored decisive matches untouched; **exact creator/universe totals** — fuzzy creators/universes (already pg_trgm SQL retrieval) now run parallel `count(*)` queries over the same trigram predicate, so the response `total` is exact across all three surfaces instead of pool-capped; **`suggestedQuery` 'did you mean' hint** — when the best-scoring content match (over the full ranked pool, not just the page) scores below the decisive anchor (0.85), the top-level `data.suggestedQuery` carries that title for a one-click re-search; **web UI rank badges** — search page merges fuzzy scores from `/v1/search` onto content results by id and renders a "N% match" badge on typo-tolerant results (flag-gated; `contentType`/`universe` also exposed on universal search results); **one comparable scale across types** — all three result types share a single `scoreFuzzyCandidate` pipeline (Levenshtein admission on the fuzzy component for every type, 60/40 blended score), so identical match shapes score identically whether they're content, creators, or universes; **'did you mean' banner in the web UI** — the search page renders `suggestedQuery` as a one-click banner that re-runs the search with the corrected title; **full switch to the universal endpoint** — migration `20260810000002_content_thumbnail_duration` adds `thumbnail`/`duration` to the search index's `content_items` (+ demo all-in-one table), search results expose them, and `apps/web/src/app/search/page.tsx` now queries only `/v1/search` (thumbnails, duration, type, universe, score all from the universal response; type/duration filters now functional; sort pushed to the API); **correction analytics** — `content_search_correction_shown` (once per suggestion) + `content_search_correction_accepted` (click) events fired from the search page, carrying the original query + suggested title for acceptance-rate measurement)
- [ ] `search_suggestions_ai` (off) → `getSuggestions` ranking (registered; AI ranking TBD)
- [x] `search_trending_cached` (on) → Redis-backed trending
- [x] `search_log_queries` (on) → `logSearch` toggle
- [ ] Tests

### 4.3 reality-service
- [ ] `reality_voting_enabled` (on) → voting endpoints
- [ ] `reality_predictions_enabled` (on) → prediction endpoints
- [ ] `reality_live_voting` (off) → live voting
- [ ] `reality_auto_elimination` (off) → automated elimination
- [ ] Tests

### 4.4 movie-service
- [ ] `movie_rentals_enabled` (on) → `/rent`
- [ ] `movie_premieres_enabled` (on) → premieres
- [ ] `movie_cinema_pass` (off) → CinemaPass product
- [ ] `movie_watchlist_sync` (off) → cross-device sync
- [ ] Tests

### 4.5 comedy-service
- [ ] `comedy_challenges_enabled` (off) → challenge endpoints
- [ ] `comedy_specials_gate` (off) → premium specials gating
- [ ] Tests

### 4.6 games-service
- [ ] `games_tournaments_enabled` (off) → tournament engine
- [ ] `games_trivia_ai` (off) → AI questions
- [ ] `games_leaderboards_seasonal` (off) → seasonal resets
- [ ] Tests

### 4.7 lifestyle-service (14 modules — per-module kill-switches)
- [ ] `lifestyle_events_ticketing` (off) → events module
- [ ] `lifestyle_stories_enabled` (on) → stories module
- [ ] `lifestyle_city_guide` (off) → city-guide module
- [ ] `lifestyle_influencer_verification` (off) → influencer module
- [ ] `lifestyle_nightlife_booking` (off) → nightlife module
- [ ] `lifestyle_polls_enabled` (on) → polls module
- [ ] `lifestyle_quizzes_enabled` (on) → quizzes module
- [ ] `lifestyle_celebrity_feed` (on) → celebrity module
- [ ] `lifestyle_music_enabled` (on) → music module
- [ ] `lifestyle_social_enabled` (on) → social module
- [ ] Tests

### 4.8 vertical-service
- [ ] `vertical_crossovers_enabled` (off) → crossovers module
- [ ] `vertical_timeline_enabled` (on) → timeline module
- [ ] `vertical_lore_ai` (off) → lore generation
- [ ] `vertical_storyworlds_create` (off) → community storyworlds
- [ ] Tests

### 4.9 sports-service
- [ ] `sports_prediction_markets` (on) → prediction endpoints
- [ ] `sports_fan_contests` (off) → fan contests
- [ ] `sports_live_scores` (on) → live scores
- [ ] `sports_odds_feeds` (off) → third-party odds ingestion
- [ ] Tests

### 4.10 engagement / messaging / referral / reward
- [ ] `engagement_leaderboards` (on) · `engagement_rankings` (on) · `engagement_predictions` (off) · `engagement_event_ingest` (on)
- [ ] `messaging_dm_enabled` (on) · `messaging_read_receipts` (off) · `messaging_typing_indicator` (off) · `messaging_media_sharing` (off)
- [ ] `referral_program_enabled` (on) · `referral_reward_boost` (off) · `referral_auto_complete` (off)
- [ ] `reward_points_enabled` (on) · `reward_streaks` (off) · `reward_badges` (off) · `reward_missions` (off) · `reward_double_points` (off)
- [ ] Tests per service

### 4.11 support & moderation (operations)
- [ ] `support_ai_chatbot` (off) · `support_self_service_refunds` (off) · `support_escalation_ai` (off) · `support_takedowns_auto` (off)
- [ ] `moderation_ai_scans` (off) · `moderation_auto_approve` (off) · `moderation_auto_suspend` (off) · `moderation_trust_scores` (off)
- [ ] Tests per service

---

## Phase 5 — Frontend Flag Delivery

### 5.1 Bootstrap endpoint
- [x] Add `GET /feature-flags/bootstrap` to api-gateway (evaluates per-user + rollout hash, returns only `isPublic` flags)
- [x] Add `GET /feature-flags/bootstrap` handler in `FeatureFlagService` (batch + public-filter)
- [x] Consume bootstrap in the web app (`apps/web/src/lib/flags.ts` + `FlagsContext`) → expose `isFlagEnabled(key)` / `universeEnabled(name)` — note: implemented directly in web rather than `packages/api-client`; move there when mobile also needs it
- [x] Cache bootstrap response client-side (localStorage TTL); refresh on auth change

### 5.2 Web (`apps/web`)
- [x] `web_maintenance_mode` → render existing `/maintenance` route (via `MaintenanceGate` in root layout)
- [ ] `web_new_home` (off) → new home rails
- [ ] `web_dark_mode` (on) → theme toggle
- [ ] `web_autoplay` (on) → wire existing `shouldAutoPlay()` to server flag
- [ ] `web_low_data_default` (off) → default low-data mode
- [ ] `web_recommendations_rail` (off) → recommendation rail
- [ ] `web_announcement_banner` (off) → ops banner
- [ ] `web_premium_upsell` (off) → upsell placements
- [x] Per-universe nav gating from `universe.{name}.enabled` (AppHeader filters `ALL_UNIVERSE_OPTIONS`)
- [x] Tests (bootstrap fetch mocks + helper units in `flags.test.ts`; AppHeader test updated with `useFlags` mock)

### 5.3 Mobile (`apps/mobile`, Expo)
- [ ] `mobile_new_home` (off) · `mobile_dark_mode` (on) · `mobile_autoplay` (on)
- [ ] `mobile_low_data_default` (off) · `mobile_push_enabled` (on) · `mobile_biometric_auth` (off)
- [ ] Universe switcher gating from bootstrap flags
- [ ] Tests

### 5.4 Admin (`apps/admin`)
- [ ] `admin_new_dashboard` (off) → new dashboard layout
- [ ] `admin_feature_flag_editor_v2` (off) → rich flag editor (rollout %, user lists, expiry)
- [ ] `admin_report_builder` (off) → gate report builder route
- [ ] `admin_bulk_actions` (off) → bulk content ops
- [ ] Tests

### 5.5 Creator (`apps/creator`)
- [ ] `creator_new_analytics` (off) · `creator_upload_v2` (off) · `creator_payouts_ui` (off) · `creator_onboarding_wizard` (off)
- [ ] Tests

---

## Phase 6 — Intelligence Flags

### 6.1 recommendation-service
- [ ] `recommendation_collaborative` (off) / `recommendation_content_based` (off) / `recommendation_hybrid` (on) — algorithm A/B
- [ ] `recommendation_cross_universe` (off) · `recommendation_churn_model` (off) · `recommendation_fraud_model` (off)
- [ ] `recommendation_creator_score` (off) · `recommendation_personalized_feed` (off)
- [ ] `recommendation_caching` (on) — kill-switch for cached recs
- [ ] Tests: A/B bucketing consistency

### 6.2 analytics-service
- [ ] `analytics_sampling_rate` (numeric) → event sampling
- [ ] `analytics_batch_ingest` (off) → batch vs per-event writes
- [ ] `analytics_report_builder_v2` (off) → report builder UI/API
- [ ] `analytics_client_sampling` (off) → client-side sampling via analytics-sdk
- [ ] Tests

### 6.3 shared packages
- [ ] `packages/analytics-sdk`: read bootstrap flags for event sampling
- [ ] `packages/shared-queue`: central per-processor toggle consumption
- [ ] `packages/event-bus`: `events_consume_{eventType}` per-event consumer pause (align with event catalog)
- [ ] `packages/security`: `security_rate_limit_strict`, `security_helmet_strict` progressive tightening
- [ ] `packages/shared-services`: export global `FeatureFlagModule.forRoot()`

---

## Phase 7 — Rollout, Governance & Cleanup

### 7.1 Service-by-service flag registry wiring (checklist)
> Each service: add `flags.ts` typed registry, register `FeatureFlagModule.forRoot()`, add defaults.
- [ ] auth-service · [ ] user-service · [ ] wallet-service · [ ] payment-service · [ ] content-service · [ ] search-service · [ ] media-service
- [ ] reality-service · [ ] movie-service · [ ] comedy-service · [ ] games-service · [ ] lifestyle-service · [ ] vertical-service · [ ] sports-service · [ ] creator-service · [ ] live-event-service
- [ ] notification-service · [ ] reward-service · [ ] referral-service · [ ] messaging-service · [ ] engagement-service · [ ] subscription-service
- [ ] moderation-service · [ ] queue-service · [ ] support-service
- [ ] analytics-service · [ ] recommendation-service
- [ ] api-gateway

### 7.2 Governance & observability
- [ ] Audit-log every flag create/update/toggle (who, when, old→new) via `AuditModule`
- [ ] Dashboard for flag metrics (`flag_evaluation`, `flag_toggled`) in Grafana/MONITORING docs
- [ ] Admin "stale flags" report (past `staleAfter`)
- [ ] Rollout policy doc: 0% → 10% → 50% → 100% with monitoring gates (add to `docs/` or CLAUDE.md conventions)
- [ ] Flag naming + default-value conventions lint rule (or CI check scanning `flags.ts`)

### 7.3 Testing & CI
- [ ] Unit tests for `packages/feature-flags` (see §1.1)
- [ ] Integration tests: admin toggle → Redis → service behavior end-to-end
- [ ] Contract tests: bootstrap endpoint shape (add to `packages/contract-tests`)
- [ ] CI job: typecheck all flag registries (`pnpm typecheck`)
- [ ] E2E: maintenance-mode 503 path, kill-switch simulation (withdrawals off), provider failover
- [ ] Load test: flag evaluation with caching (assert Redis call reduction)

### 7.4 Documentation
- [ ] Update `ARCHITECTURE.md` Feature Management section to match unified system
- [ ] Update `packages/feature-flags/README.md` (new APIs, conventions, lifecycle)
- [ ] Update `.env.example` with `FEATURE_FLAG_REDIS_URL` + `FEATURE_FLAG_DEFAULT_*` docs
- [ ] Seed dev flags in `scripts/local-dev.sh setup` / `db seed`
- [ ] Deployment checklist entry: verify flag store reachable + defaults loaded

### 7.5 Flag cleanup lifecycle
- [ ] Track "remove by" dates; remove flags 2 sprints after full rollout
- [ ] Sweep task: search for leftover `isEnabled` calls after flag removal
- [ ] Archive removed flags in audit log (never hard-delete history)

---

## Suggested Execution Order

1. **Phase 1** foundation (package hardening → unification → admin write-through → typed registries)
2. **Phase 2** financial kill-switches (wallet → payment → creator → subscription → live-event)
3. **Phase 3** platform toggles (gateway → auth → queue → notification → user → media)
4. **Phase 4** universe & engagement flags
5. **Phase 5** frontend delivery (bootstrap → web → mobile → admin → creator)
6. **Phase 6** intelligence flags
7. **Phase 7** governance, CI, docs, cleanup — run continuously alongside 2–6

## Definition of Done (per flag)

- [ ] Typed registry entry with default + owner + description
- [ ] Evaluation point wired in code (kill-switch or feature branch)
- [ ] Unit test covering on/off/rollout/user-targeted paths
- [ ] Admin UI can toggle it; toggle writes audit + metric
- [ ] Documented in service README or flag reference
