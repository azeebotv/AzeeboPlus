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
- Cache evaluated results for 30–60s in-process (or a small `Map` with TTL) with invalidation on `setFlag`/`enableFlag`/`disableFlag`/`deleteFlag`. Saves a Redis call per evaluation on hot paths.
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
- Metrics: emit `flag_evaluation{key,result}` and `flag_toggled{key}` (prom-client is already used for `MetricsModule`).
- Conventions: `*_enabled` flags **default true** (they are kill-switches); new-experiment flags default **false**. Rollout ramp policy: 0% → 10% → 50% → 100% with a monitoring gate.
- **Cleanup process:** flags should carry a "remove after 2 sprints" convention; the admin UI should list stale flags.

### 2.7 Tests
- Unit-test rollout hash determinism, user targeting, anonymous-bucket stability (currently `process.env.ANONYMOUS_ID` is a *process-global*, so anonymous bucketing is wrong in multi-request/worker contexts — thread a per-request anonymous id through instead).

---

## 3. Per-Service Flag Recommendations

Naming: `snake_case`, `{domain}_{feature}_enabled` for kill-switches. Defaults: `default on` = kill-switch, `default off` = new feature.

### 3.1 Gateway (`services/gateway/api-gateway`)

| Flag | Default | Where | Why |
|---|---|---|---|
| `gateway_maintenance_mode` | off | Proxy controller top-level | Global 503 kill-switch (the web app already has a `/maintenance` page — wire it to this flag) |
| `gateway_new_routes` | off | `SERVICE_CONFIGS` registration | Ship new service routes (e.g., `/live-events`, `/vertical`) as code, enable per env without redeploy |
| `gateway_circuit_breaker` | on | `CircuitBreakerProxyService` | Disable circuit-breaking during incidents to fall back to direct routing |
| `gateway_response_cache` | on | Proxy caching (`CACHE_TTL_MS`) | Toggle per-route-family caching (content/search) to drain stale cache safely |
| `gateway_strict_rate_limits` | off | `ThrottlerModule` | Increase global limit (1000/min) for flagged cohorts/partners |
| `gateway_csrf_enforce` | on | `CsrfMiddleware` | Emergency disable if a CSRF regression appears |
| `gateway_legacy_redirect` | on | `LegacyRedirectMiddleware` | Disable redirects once legacy clients are drained |
| `gateway_api_v2` | off | `ApiVersioningConfig` | Expose v2 version header + route version negotiation incrementally |

### 3.2 Core services

**auth-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `auth_social_google` / `auth_social_apple` | on | `social/` controllers | Per-provider kill switch (provider outages, compliance) |
| `auth_mfa_totp` | off | `mfa/` module | Roll out TOTP MFA to cohorts, then require for admins (`auth_mfa_required_for_admins` off→on) |
| `auth_otp_email` / `auth_otp_sms` | on | `otp/` controller | Channel routing: switch SMS→Email at scale; kill an abusive channel |
| `auth_passwordless_magic_link` | off | `auth/` | New login method, 5% rollout |
| `auth_device_limits` | off | `DeviceLimitService` | Enforce subscription-tier device caps (Free=1…Enterprise=10) |
| `auth_refresh_rotation` | on | token service | Kill-switch for refresh-token rotation |
| `auth_email_verification_required` | off | signup flow | Require verified email before login. **Implemented**: `register()` branches — no tokens issued, verification email sent via `sendVerificationEmail()` (shared with `resendVerification`), response carries `requiresEmailVerification`; `login()` rejects unverified users with 403 `email_not_verified` (audit-logged + analytics) until `verifyEmail()` marks them verified. The verification link is a **first-class template**: `email-verification` registered in `EmailService.registerTemplates()` (env override `EMAIL_TEMPLATE_EMAIL_VERIFICATION_HTML`), delivered via notification-service's new `POST /v1/notifications/email` (`sendTemplatedEmail` — template→subject map, email kill-switch, unknown template = 400). Tokens expire after **1h** (`VERIFICATION_TOKEN_TTL_SECONDS`, was 24h) and are hardened with a **per-token attempt budget** (5 tries, then the token is burned with 429; counter TTL matches the token) plus a **per-user resend throttle** (3 emails/hour, 429). **Post-verification auto-login**: `verifyEmail()` ends by calling `generateTokens()` — the user gets fresh `access_token`/`refresh_token` (plus `user`/`expiresAt`) in the response, so no second sign-in is needed; works with the flag on or off (verification is always proof of identity) |
| `auth_role_select` | on | `/select-role` | Gate the role-selection flow |

**user-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `user_profile_v2` | off | `/me` PATCH | New profile schema/validation |
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
| `wallet_distributed_lock` | on | debit/credit service | Toggle Redis lock + `FOR UPDATE` path during lock debugging |
| `wallet_ledger_v2` | off | transaction service | New immutable ledger writer behind a flag |
| `wallet_fraud_checks` | off | transaction path | Enable fraud heuristics (velocity, pattern) |

**payment-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `payment_provider_paystack` / `payment_provider_flutterwave` | on | `providers/` | Per-gateway routing + outage kill-switch; route % traffic per provider for A/B |
| `payment_new_checkout_flow` | off | `payments.controller` | New checkout vs legacy |
| `payment_webhooks_enabled` | on | `webhook.controller` | Pause webhook processing during provider incidents |
| `payment_intents_api` | off | `/intent` | New intents API rollout |
| `payment_self_service_refund` | off | `/refund-request` | Allow users to request refunds |
| `payment_kyc_required` | off | initialize | Require KYC above deposit threshold |
| `payment_scheduled_tasks` | on | `ScheduledTasksModule` | Disable dunning/retry cron jobs in one toggle |

**content-service** (already has `content_moderation_enabled` — keep)
| Flag | Default | Where | Why |
|---|---|---|---|
| `content_moderation_enabled` | on | `publishContent` (existing) | Kill-switch for safety scans on publish |
| `content_transcoding_new` | off | `startTranscoding` | New transcoding pipeline/format set |
| `content_ai_tags` | off | ingestion service | AI-generated categories/tags |
| `content_clip_ingestion` | off | `ingestClipContent` | Clip extraction feature |
| `content_comments_v2` | off | comment endpoints | Threaded/rich comments |
| `content_windowing_enabled` | on | `checkContentAvailability` | Enforce release windows (premieres/exclusives) |
| `content_premium_gate` | off | access-check | Gate premium/exclusive content by entitlement |
| `content_recommended_rail` | off | `getRecommended` | Surface recommendation rail in feed |
| `universe.{name}.{feature}` | on | per-universe | Bridge from `UniverseFeatureFlag` DB rows (see §2.1) |

**search-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `search_faceted` | off | `searchWithFacets` | Roll out faceted search UI/API |
| `search_typo_tolerance` | off | `search()` | Fuzzy matching (expensive, A/B it). **Implemented**: Levenshtein scoring in `src/modules/search/fuzzy.ts` (normalized similarity + token best-pair + substring detection, threshold 0.5). Candidate retrieval is computed in **Postgres** via the `pg_trgm` migration (`20260810000001_pg_trgm_fuzzy_search`): `CREATE EXTENSION pg_trgm` + GIN trigram indexes on `content_items.title/description`, `creator_profiles."displayName"/bio`, `universes.name/"displayName"`; the fuzzy path runs `$queryRaw` with `similarity(...) > 0.3` OR `ILIKE '%…%'` in the WHERE (both index-backed) so the pool is SQL-computed and scales with the catalog instead of a bounded in-process heuristic. The retrieval queries also `SELECT similarity(...)` per column (`titleSim`/`descSim`, `displayNameSim`/`bioSim`, `nameSim`/`displayNameSim`), so each row carries its explainable pg_trgm signal. **Blended relevance**: the precision filter stays on the Levenshtein `fuzzyScore` (threshold 0.5), but ranking and the reported score use `blendScore(fuzzy, trigram)` (`src/modules/search/fuzzy.ts`) — decisive matches (fuzzyScore ≥ 0.85: exact/substring/near-exact) keep their score unchanged, while typo-corrections blend 60% fuzzy + 40% trigram, so strong n-gram overlap (e.g. 'avngers' vs 'Avengers') genuinely lifts a near-miss. Exact substring matches still rank above near-misses. **Per-item `score` (0–1) is surfaced on every fuzzy result** (content/creators/universes) so clients can render rank badges or 'did you mean' hints — scores ≥ ~0.85 are decisive matches; scores below that are the blended correction signal, with the trigram component making the ranking explainable. Universal search results also carry `contentType` and `universe` (direct columns) for client-side chips/filters without joins. **One comparable scale across types**: content, creators, and universes all score through the same `scoreFuzzyCandidate()` pipeline (`fuzzy.ts`) — admission on the Levenshtein component (`FUZZY_MATCH_THRESHOLD`) for every type (previously creators/universes filtered on the *blended* score, a real asymmetry), then the same 60/40 blend — so identical match shapes produce identical scores regardless of result type, and clients can compare a 0.7 creator match against a 0.7 content match directly. **Web UI runs entirely on the universal endpoint**: `apps/web/src/app/search/page.tsx` queries `/v1/search` only — the migration `20260810000002_content_thumbnail_duration` added `thumbnail`/`duration` to the search index's `content_items` (plus `duration` in the demo all-in-one table), and the search results now carry `thumbnail`, `duration` (seconds), `contentType`, and `universe` so the page needs no second lookup. Type and duration filters are now functional (mapped from `contentType`/`duration`); sort maps to the API (`newest`/`rating`/`popular`). **Rank badges**: results from the typo-tolerant path render a green "N% match" badge next to the title (tooltip explains the blended signal); exact-path results carry no score, so no badge. **'Did you mean' banner**: `data.suggestedQuery` (when present and different from the active query) renders as a one-click banner that re-runs the search via the same `handleSearch` path. **Correction analytics**: the web app fires `content_search_correction_shown` (once per suggestion, guarded by a ref) when the banner appears and `content_search_correction_accepted` when the user clicks it — both carry the original query and the suggested title, so the search team can compute the correction acceptance rate (accepted / shown). The flag stays off by default, so badges and the banner only appear once `search_typo_tolerance` is enabled (A/B). **Startup guard**: `SearchService.onModuleInit` probes `pg_extension` for `pg_trgm`; if it's missing (migration not run / role lacks the `CREATE EXTENSION` grant) or the probe is inconclusive (DB down at boot), `search()` logs a throttled warning and falls back to the **exact path** instead of 400ing every fuzzy request. The state is re-probed lazily on a 60s interval, so creating the extension later (or a DB that recovers) self-heals without a restart, and a runtime `similarity()`/`pg_trgm` error in the fuzzy path also degrades to the exact path for that request. The effective mode (flag AND extension) drives the cache key, so degraded responses never poison the fuzzy cache. **Ops visibility**: `GET /health` now returns a `search` object from `SearchService.getFuzzyStatus()` — `{ enabled, pgTrgm: 'available'|'missing'|'unknown', indexes: 'present'|'missing'|'unknown', degraded, warning?, mode, lastProbeAt }` — so dashboards can see whether fuzzy search is degraded and why (flag on + extension missing, or extension present but the migration's GIN trigram indexes absent). Degradation is reported but does NOT flip health to 503, since the exact path keeps serving. **Startup migration check**: the probe also counts the six GIN trigram indexes from the pg_trgm migration in `pg_indexes`; the extension existing without them logs a throttled warning (fuzzy still works, just unindexed) and surfaces as `indexes: 'missing'` + a `warning` in the health status. **Score components**: fuzzy results now also expose `fuzzyScore` and `trigramScore` (the two explainable components of the blended `score`) on content/creators/universes, so clients can render a 'matched because' breakdown; exact-path results omit all three. **Runtime-tunable blend**: the numeric flag `search_fuzzy_trigram_weight` (default `0.4` via `FeatureFlagModule.register({ defaultValues })`) sets the trigram weight in the blend — `score = fuzzy*(1-w) + trigram*w` — read once per search via `getValue`, clamped to [0,1], falling back to `DEFAULT_TRIGRAM_WEIGHT` when unset. The decisive-match anchor (≥0.85) still keeps its score untouched, so retuning only reshapes the typo-correction band; changes land within the flag cache TTL (no deploy). **'Did you mean' hint**: when the best-scoring content match — computed over the full ranked pool, not the current page — scores below the decisive anchor (`DECISIVE_MATCH_SCORE` = 0.85, exported from `fuzzy.ts`), the response's top-level `data.suggestedQuery` carries that title so clients can render a one-click re-search link; it's absent when the top match is decisive or there are no matches. **Exact totals**: `pagination.total` comes from a `count(*)` over the same trigram WHERE (run in parallel with the pool query), so it is uncapped and reflects every matching row — an upper bound on the score-filtered page, since the 0.5 in-process threshold is a precision pass on top. Creators and universes use the **same path**: their retrieval is already index-backed pg_trgm `$queryRaw` (pool + `similarity()`/ILIKE in the WHERE), and they now also get exact `count(*)` queries over the identical predicate — so the response's top-level `total` (`content + creators + universes`) is exact rather than capped at the 200-row pools or the 20/10 response limits. Filters (status/universe/date range) apply in SQL; the pool `LIMIT 1000` remains a safety cap on rows fetched for scoring, not on the total. Fuzzy and exact results use separate cache keys so toggling never serves stale results. |
| `search_suggestions_ai` | off | `getSuggestions` | AI-ranked suggestions vs `resultCount` ranking |
| `search_trending_cached` | on | `getTrending` | Serve trending from Redis cache vs DB |
| `search_log_queries` | on | `logSearch` | Toggle search logging (privacy/compliance) |

**media-service**
| Flag | Default | Where | Why |
|---|---|---|---|
| `media_upload_chunked` | off | upload controller | Chunked/resumable uploads |
| `media_presigned_urls` | on | upload/`getMediaUrl` | Signed-URL flow vs proxy streaming |
| `media_transcode_av1` | off | transcoding | New codec (cost/bandwidth trade-off) |
| `media_virus_scan` | off | upload pipeline | Malware scanning hook (latency cost) |
| `media_cdn_edge_cache` | on | URL signing | Toggle CDN edge cache headers. **Implemented**: `UploadService.getCacheControl(mimetype)` returns per-type directives when on (images `public, max-age=31536000, immutable`; videos `public, max-age=86400`; audio/documents `public, max-age=604800`; unknown types `public, max-age=3600`), and `private, no-store` when off; every upload endpoint (`/media/upload/{image,video,audio,document,thumbnail,avatar,banner}`) sets the `Cache-Control` response header from it (controller uses `@Res({ passthrough: true })`), and the value is also echoed in the `UploadResponse.cacheControl` field. **Per-type TTLs are env-configurable** (no longer hard-coded): `MEDIA_CACHE_TTL_IMAGE` (default 31536000, keeps `, immutable`), `MEDIA_CACHE_TTL_VIDEO` (86400), `MEDIA_CACHE_TTL_AUDIO` (604800), `MEDIA_CACHE_TTL_DOCUMENT` (604800), `MEDIA_CACHE_TTL_DEFAULT` (3600) — seconds, read once at construction via a parse+positive-integer validation (invalid/unset falls back to the default), documented in `services/core/media-service/.env.example`; tune per environment without a code change. **Typed policy**: `UploadResponse` now carries `cachePolicy: 'no-store' | 'immutable' | 'long-lived' | 'medium-lived' | 'short-lived'` alongside the raw `cacheControl` string, so clients switch on caching behavior without parsing the header — `no-store` when the flag is off, `immutable` for images (regardless of tuned TTL, the directive keeps `, immutable`), and the other bands track the **resolved** max-age (≥7d / ≥1d / <1d), so tuning `MEDIA_CACHE_TTL_*` re-bands the policy automatically. Mirrored as `UploadCachePolicy` on the mobile client's `MediaUploadResponse`. **CDN purge**: flipping the flag does not evict already-cached objects — `POST /admin/cdn/purge` (`{ keys?: string[], prefix?: string }`, AdminGuard) invalidates them via `CdnPurgeService` (CloudFront `CreateInvalidation`, paths `/{key}` or `/{prefix}/*`; logs a no-op when `CLOUDFRONT_DISTRIBUTION_ID` is unset, i.e. dev). **The flip is now automated**: `CdnFlagPurgeQueueService` (UploadModule) polls `media_cdn_edge_cache` every `MEDIA_CDN_FLAG_POLL_MS` (default 30s, aligned with the feature-flags cache TTL) and on an on→off transition enqueues a deduped, single-flight in-process purge job that runs `CdnPurgeService.purgePrefix('uploads')` — the full `/uploads/*` invalidation — so ops no longer calls the endpoint manually; the first poll only seeds last-known state (booting with the flag already off never purges), poll failures retry on the next tick, and the interval is unref'd/cleared on destroy. **Manual one-click purge**: the admin app's Global Flags page renders a **Purge CDN** button on the `media_cdn_edge_cache` card (confirm dialog → `POST /api/v1/media/admin/cdn/purge` with `{ prefix: 'uploads' }`, proxied through the gateway's media block — route added to the registry), with in-flight + success/error feedback; the existing `POST /admin/cdn/purge` endpoint remains for keys/prefixes. **Upload analytics**: every completed upload emits a `media_upload` event (added to analytics-service `ALLOWED_EVENT_NAMES`) via a fire-and-forget POST to `{ANALYTICS_SERVICE_URL}/analytics/track` — metadata `{ contentType, uploadType, cacheControl, cachePolicy, sizeBytes, filename, key }` + the requesting `userId` — the raw material for CDN cache-budget planning (per-type volumes × TTLs → expected cache residency); a failed analytics POST is swallowed so it can never fail an upload. |

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

**live-event-service** (`live_event_` prefix)
- `live_event_ppv` (on) — pay-per-view gate
- `live_event_streaming` (on) — streaming backend kill-switch
- `live_event_tickets` (off) — ticket sales
- `live_event_chat` (off) — live chat moderation toggle

**creator-service** (`creator_` prefix)
- `creator_onboarding_v2` (off), `creator_tips_enabled` (off), `creator_subscriptions_enabled` (off)
- `creator_payouts_enabled` (on) — **payout kill-switch** (money movement)
- `creator_monetization_insights` (off) — new analytics product
- `creator_verification_manual` (on) — manual vs automated verification

### 3.4 Engagement services

**notification-service**
- `notification_push_ios` / `notification_push_android` (on) — per-platform push kill-switches
- `notification_email_enabled` (on), `notification_sms_enabled` (on)
- `notification_digest` (off) — daily digest emails
- `notification_preferences_v2` (off) — new preference model

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
- `subscription_bundles` (off), `subscription_free_trial` (off), `subscription_promo_discounts` (off)
- `subscription_device_limits` (off) — enforce `maxDevices`/`maxStreams` (mirror of auth flag)
- `subscription_dunning` (on) — retry/payment recovery jobs

### 3.5 Operations services

**queue-service** — per-queue processor switches (the `QUEUE_CONFIG` map is the natural home)
- `queue_process_notifications` / `queue_process_payments` / `queue_process_emails` / `queue_process_analytics` / `queue_process_content` (all on) — pause individual queues during provider outages or migrations
- `queue_concurrency_payments` (numeric variant) — tune worker concurrency at runtime. **Implemented**: `PaymentProcessor.applyRuntimeConcurrency()` reads `getValue(queue_concurrency_payments)` and assigns it to the live BullMQ `worker.concurrency` (settable in bullmq ≥5.7) — applied in `onModuleInit` and re-applied on every job, so ops changes take effect within the flag cache TTL without a restart. Registered as a numeric `defaultValues` entry (default 5).
- `queue_dlq_retry` (on) — dead-letter retry policy toggle. **Implemented**: `PaymentProcessor.onFailed` detects final failures (`attemptsMade >= opts.attempts`) and, when the flag is on, re-queues the job **with a real delay**: the payments `Queue` is injected via `@InjectQueue('payments')` and the job is removed then re-added with the same `jobId` and `{ delay, attempts, backoff }` (BullMQ cannot delay-retry an existing failed job — `moveToDelayed` requires the active set and re-adding the same jobId is a silent no-op). Delays double per pass (base → 2×base → 4×base, capped at 1h); passes are bounded, tracked in `job.data.dlqRetryCount` (persisted via `updateData` before the re-add). Both knobs are **runtime-tunable numeric flags**: `queue_dlq_retry_max_passes` (default 3) and `queue_dlq_retry_base_delay_ms` (default 30000) — read fresh per final failure via `getValue`, so ops changes apply within the flag cache TTL. Precedence for the base delay: flag value → enqueuer's per-job `retryDelay` → 30s default. If the delayed re-add fails, the processor falls back to `job.retry('failed', { resetAttemptsMade: true })` so the job is never lost. When off (or budget exhausted) the job stays in the failed set for the manual retry endpoints. **Admin UI**: both knobs (plus `queue_concurrency_payments`) are tunable from the admin app's **Global Flags** page (`/feature-flags/global`) — numeric inputs with save/reset, grouped under the **queue-service** context chip.
- `queue_dlq_retry` **also drives `NotificationProcessor`** — **Implemented**: the same numeric-flag pattern is wired into the notification processor's dead-letter behavior, consuming the *same* `queue_dlq_retry` / `queue_dlq_retry_max_passes` / `queue_dlq_retry_base_delay_ms` flags so ops tunes one queue-service DLQ policy for both payment and notification jobs. `NotificationProcessor.onFailed` gates on the final attempt (`job.opts.attempts`, default 3 for the notifications queue), then removes the job and re-adds it to the injected `@InjectQueue('notifications')` queue with the same `jobId` and `{ delay, attempts, backoff }`, pass counter persisted in `job.data.dlqRetryCount`, delays doubling per pass (base → 2×base → 4×base, capped at 1h), flag base → per-job `retryDelay` → 30s constant, and the same fallback `job.retry('failed', { resetAttemptsMade: true })` if the delayed re-add fails. Per-job `maxRetries`/`retryDelay` fields on `NotificationJobData` remain available to producers as the pre-flag fallback.
- **DLQ retry metric** — **Implemented**: queue-service gained a prom-client `MetricsModule` (`GET /metrics`, `@Public`, default labels `service=queue-service` + environment, mirroring payment/auth/wallet/analytics). Both processors emit a job-level counter, `queue_dlq_retry_scheduled_total{queue, pass, base_delay_ms}`, exactly once per DLQ pass *actually scheduled* (incremented after the delayed re-add succeeds, so failed re-adds that fall back to in-place retry don't count). `base_delay_ms` carries the effective base delay at scheduling time (flag value → per-job `retryDelay` → default), so retry-latency dashboards can compute `rate × delay` backpressure per queue and see runtime flag-tuning changes reflected as new label values.

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
- **Backend**: new `FeatureFlagsModule` in `apps/admin` (`FeatureFlagsController` at `admin/feature-flags`, guarded by `JwtAuthGuard` + `RolesGuard` for admin/superadmin, with `AuditLogService` entries on update/delete). `GET` lists stored flags merged with registered defaults via `getAllFlagsWithDefaults()` — now including numeric `defaultValues` (previously only boolean `defaultFlags` merged, so numeric knobs like the DLQ settings never listed). `PUT /:key` sets enabled/value/description/owner (audited as `feature_flag.updated`); `DELETE /:key` resets to default (audited `feature_flag.deleted`). `FeatureFlagModule.register({ global: true, defaultValues })` registers the queue DLQ defaults (max passes 3, base delay 30000ms) so they're visible before first write.
- **Gateway**: `GET/PUT/DELETE /v1/admin/feature-flags[/:key]` added to the admin proxy block (route registry + forwarding to `admin-service`).
- **Client**: `GlobalFeatureFlag` type + `listGlobalFeatureFlags` / `updateGlobalFeatureFlag` / `resetGlobalFeatureFlag` API methods; the page renders one card per flag with a service-context chip derived from the typed registries' key prefixes (queue-service, search-service, media, auth, payment, …), numeric flags get a **number input + Save + Reset to default** (save disabled until the draft differs), boolean flags get an on/off toggle; context filter chips and search filter the list.
- **Verification**: feature-flags package spec 25/25, admin backend jest 15/15 (5 suites), admin client `tsc --noEmit` + `vite build` clean, gateway proxy controller spec 17/17. (Jest suites run under Node 22 — jest 29.7 aborts on the local Node 26; a Node 22 binary lives in `.freebuff/node22/` for CI-equivalent runs. The admin client's only spec is a Playwright e2e that vitest shouldn't collect.)

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
