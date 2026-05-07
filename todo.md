# Azeebo+ Spec Alignment TODO

Generated from a fresh audit against:

- `AZEEBO MODULAR APP.docx`
- `AZEEBO CLAUDE BUILD.docx`

Audit date: 2026-05-07

## Current Alignment Snapshot

- [ ] Treat the repo as partially aligned, not complete. The project now has a stronger modular service shape, `CLAUDE.md`, API route docs, migrations, more mobile shell screens, support workflows, and expanded universe services, but the workspace does not currently pass build/test/lint gates.
- [ ] Preserve recent work carefully. The worktree contains many user changes, deleted legacy `modules/*` files, and many untracked new services/docs/screens. Do not revert or clean generated-looking files blindly without confirming ownership.

## Verified Gate Failures

- [ ] Fix workspace build. `pnpm -r build` currently fails in `apps/creator-portal`.
  - `apps/creator-portal/src/creator/creator.service.ts` calls `this.prisma.contentItem`, `creatorProfile`, `wallet`, and `payoutRequest`, but the generated Prisma client/type being used by TypeScript does not expose those models.
  - The same file references `Prisma.ContentItemWhereInput`, but TypeScript reports that the exported Prisma namespace only has unrelated models such as `ContentTakedownWhereInput`.
  - Regenerate the correct Prisma client for `apps/creator-portal`, verify import paths, and ensure `apps/creator-portal/src/database/prisma.service.ts` uses the app-local schema client rather than the wrong root/global client.
- [ ] Fix workspace tests. `pnpm -r test` fails immediately in `apps/admin` because Jest finds no tests. Add at least smoke/unit tests or configure `--passWithNoTests` only if no-test packages are intentionally allowed.
- [ ] Fix workspace lint. `pnpm -r lint` fails in `services/support-service`.
  - Remove unused `Prisma` import in `services/support-service/src/modules/takedown/takedown.controller.ts`.
  - Replace the many `any` request/response/evidence types in support controllers and services with typed request interfaces, DTOs, and shared response wrappers.
- [ ] Re-run all gates after fixes: `pnpm -r build`, `pnpm -r lint`, `pnpm -r test`, and mobile Expo export.

## P0 - API Contract And Gateway Alignment

- [ ] Make one canonical public route map. `docs/API_ROUTE_MAP.md`, `CLAUDE.md`, service controllers, gateway route metadata, README, mobile clients, and web clients still disagree on several endpoint names.
- [ ] Update `docs/API_ROUTE_MAP.md` to match the master documents and current service code. Example mismatches:
  - Docs use `/auth/register`; auth service still exposes signup-style semantics in places.
  - Docs use `/payments/initiate`; service code commonly uses initialize/verify naming.
  - Docs use `/creators/profile`; service code and Claude build doc expect `/v1/creators/me`.
  - Docs use `/recommendation/*`, while earlier specs use recommendation framework/cross-universe routes and services may be pluralized elsewhere.
- [ ] Fix gateway route coverage. `SERVICE_ROUTES` lacks several current services/routes required by the docs, including reality, games, comedy, sports, movie, media, support, and possibly creator-service as distinct from creator-portal.
- [ ] Verify gateway path forwarding with tests. `forwardRequest()` currently strips the service segment and forwards only the wildcard path. Confirm `/api/v1/auth/login` reaches `/v1/auth/login` or the service’s actual route, not `/login` on the upstream by accident.
- [ ] Decide public URL style: `/api/v1/{service}/...` through gateway versus direct `/{service}/...`. Then update all clients and docs.
- [ ] Fix gateway cache keys. `buildCacheKey()` includes `requestId` for non-user GET responses, which prevents useful shared caching because every request gets a new key.
- [ ] Avoid unsafe JWT parsing in the gateway. `extractUserIdFromAuth()` base64-decodes JWT payload without verification; use only for cache partitioning if acceptable, or move identity extraction behind verified auth middleware.
- [ ] Add contract tests for all documented core routes: auth, users, wallet, payments, content, media, search, notifications, rewards, analytics, recommendations, admin, support, and all eight universes.

## P0 - Build, Prisma, And Schema Ownership

- [ ] Fix Prisma client ownership per app/service. The creator portal build failure proves at least one package is compiling against the wrong Prisma schema/client.
- [ ] Decide whether duplicated schemas are intentional service-owned schemas or accidental copies. Many services still define overlapping `User`, `Wallet`, `PaymentIntent`, `ContentItem`, `Universe`, and creator/reward models.
- [ ] If service-owned schemas are intentional, document exact ownership boundaries and remove models each service should not own.
- [ ] If one canonical shared schema is intended, consolidate schemas and generate clients consistently.
- [ ] Validate all newly added migrations. Many services now have a single `20240101000000_init` migration; verify these migrations match the current Prisma schemas and were not copied mechanically with drift.
- [ ] Ensure all generated Prisma clients are reproducible from `pnpm install`/`pnpm prisma generate` and are not required as committed source.

## P0 - Auth, Security, And Session Handling

- [ ] Confirm refresh-token rotation end to end. `AuthService` now signs JWT refresh tokens and stores hashed tokens, but tests and clients must prove login, refresh, replay rejection, logout, expiry, and concurrent refresh behavior.
- [ ] Update auth integration tests that still mock or expect old refresh-token behavior.
- [ ] Remove client-side token anti-patterns. `packages/api-client/src/index.ts` still uses `localStorage` for `auth_token`; web and mobile storage strategy should be explicit and hardened.
- [ ] Remove sensitive production logs. Mobile notification code still logs push tokens; analytics/performance code logs to console; `support-service/src/main.ts` uses `console.log`.
- [ ] Replace “AuthGuard placeholder” comments in support controllers with real auth and role guards.
- [ ] Add authorization tests for admin, support, moderation, creator payout, wallet audit, content publishing, payment refunds, and support decisions.
- [ ] Ensure all production Swagger/docs endpoints are disabled, protected, or separately deployed.

## P0 - Money, Wallet, And Monetization Integrity

- [ ] Finish decimal/money correctness. Several schemas have moved to `Decimal`, but service code still treats amounts as `number` in wallet, creator, support, and universe flows. Normalize conversions and avoid JS floating-point arithmetic for money.
- [ ] Use minor units or Prisma Decimal consistently across all money-moving paths, per `CLAUDE.md` payment safety rules.
- [ ] Fix wallet idempotency return semantics. `redeemReward()`, `addBonusCredit()`, and `addPromoCredit()` return the existing transaction amount as the new balance on idempotency hits, which is not the actual balance.
- [ ] Add idempotency and transaction boundaries to every monetized universe action: votes, supervotes, prediction fees, game entries, movie rentals/passes, creator tips/subscriptions, sponsor products, refunds, and reward redemptions.
- [ ] Fix Reality vote monetization. `submitVote()` still creates free single votes without wallet/payment rails even though the docs require vote-led monetization and quantity/pricing transparency.
- [ ] Fix Reality supervote atomicity. `submitSupervote()` debits via HTTP to wallet service, then creates a supervote locally. If the local insert fails after debit, the user is charged without the supervote.
- [ ] Do not use random idempotency keys for user actions. `submitSupervote()` generates a new UUID each attempt, which does not protect against retries/double-clicks.
- [ ] Fix creator tips/subscriptions. Ensure `CreatorsService` debits sender wallet, credits creator earnings, persists ledger entries, and supports idempotency rather than writing tip/earning rows directly.
- [ ] Verify payment webhook mapping against real Paystack/Flutterwave payloads, provider references, event IDs, replay handling, and wallet crediting.

## P0 - Repository Hygiene

- [ ] Remove generated artifacts and local dependency folders from source control/workspace ownership once safe: `dist`, `.next`, `.expo`, per-package `node_modules`, generated Prisma clients, and stray build maps.
- [ ] Remove remaining accidental generated source maps such as `services/analytics-service/src/**/*.js.map`.
- [ ] Finish the `modules/*` to `services/*` migration. Git shows deleted legacy modules and untracked replacement services; commit or document the move so the monorepo has one canonical universe location.
- [ ] Recreate `Tasks.md`/`fix.md` only if intentionally removed; otherwise update README/docs to point at `todo.md` as the active backlog.
- [ ] Keep `.env` files out of commits and rotate any secrets that may have been committed historically.

## P1 - Product Experience Missing Or Partial

- [ ] Complete the mobile-first shared shell from the master pack: Home, Watch, Create, Rewards, Profile with top utilities for search, notifications, wallet, profile shortcut, and optional live indicator.
- [ ] Ensure the Watch universe switcher includes all eight universes and has real route targets/data, not placeholder sections.
- [ ] Complete the 30-screen Figma/product blueprint. Current mobile adds onboarding, create, rewards, watch, reality show, gameplay, and movie detail, but many screens are still missing or placeholder:
  - Reality vote screen with contestant cards, quantity selector, wallet balance, price breakdown, confirmation.
  - Prediction screen.
  - Creator signup/onboarding and dashboard.
  - Lifestyle home and city/event guide.
  - Vertical title detail and character/lore pages.
  - Comedy home and comedy clip player.
  - Sports prediction page.
  - Notifications screen.
  - Search/discovery with universe tabs.
- [ ] Expand web beyond generic streaming/admin routes. Web still lacks most universe-specific product screens described in the handoff.
- [ ] Replace placeholder images such as `https://via.placeholder.com/...` in mobile movie detail/gameplay screens with real media assets or generated/provided placeholders from the design system.
- [ ] Add loading, empty, error, success, no-internet, payment-failure, locked-premium, content-unavailable, and moderation-removed states across all major screens.
- [ ] Make the UI feel like the specified premium African entertainment OS, not a generic streaming dashboard. Audit typography, imagery, reward cues, monetization cues, universe identity, and mobile ergonomics.

## P1 - Universe Module Gaps

- [ ] Reality Universe: make all vote/supervote/prediction flows monetized, auditable, idempotent, and analytics-instrumented; add admin show/contestant management and vote analytics.
- [ ] Creator Universe: complete verification persistence, upload lifecycle with media-service callbacks, subscriptions, tips, creator analytics, payout readiness, challenge participation, and dashboard accuracy.
- [ ] Lifestyle Universe: verify feed, city guide, music, nightlife, celebrity, influencer, events, RSVP, save/share, and daily freshness endpoints are complete and match the route map.
- [ ] Vertical Universe: complete `/home`, titles, title detail, characters, lore, timeline, crossovers, recaps, universe map, and fandom/theory-building flows.
- [ ] Movie Universe: complete premieres, rentals, passes/cinema passes, viewing windows, watchlist, library, filmmaker support, trailer/detail, and server-side access checks.
- [ ] Games Universe: complete game catalog, daily challenge, gameplay sessions, answer submission, scoring, tournaments, entry fees, rewards, and leaderboard correctness.
- [ ] Comedy Universe: complete comedy feed, clip detail/player, comedian profiles, series/specials, challenges, shares, trend logic, and premium specials.
- [ ] Sports Universe: complete fixtures, highlights, prediction markets, prediction entries, fan contests, fan boards, leaderboards, rewards, and anti-fraud/idempotency.

## P1 - Analytics And Intelligence Layer

- [ ] Enforce the analytics schema from `AZEEBO MODULAR APP.docx` and `docs/ANALYTICS_GOVERNANCE.md` across web, mobile, and services.
- [ ] Replace client-only `localStorage` analytics identity with a privacy-safe cross-platform identity/session strategy.
- [ ] Remove dev-only analytics console logging or guard it behind explicit development flags.
- [ ] Instrument all major flows: onboarding, screen views, content impressions/clicks, play start/complete, votes, supervotes, payments, refunds, rewards, creator follow/tip/subscription, predictions, games, shares, notifications, support tickets, moderation.
- [ ] Validate event envelopes at ingestion time and reject malformed event names/properties.
- [ ] Build real analytics dashboards/funnels/cohorts/universe KPIs, not only static or simple aggregate placeholders.
- [ ] Complete the intelligence layer: personalization, audience segmentation, creator scoring, monetization optimization, churn/retention, fraud detection, and cross-universe recommendations.

## P1 - Content, Media, Moderation, And Trust

- [ ] Ensure content playback/access checks happen server-side for premium items, rentals, passes, screenings, and locked extras.
- [ ] Complete media processing: MIME sniffing, extension validation, size/duration limits, object storage, CDN URLs, signed URLs, transcoding, thumbnails, failed-job recovery, and cleanup.
- [ ] Replace mocked/random safety scanning. `moderation-service/src/modules/moderation/safety-scanning.service.ts` still uses random mock risk values.
- [ ] Persist moderation scans, moderation cases, reviewer assignment, safety actions, appeals, trust-score history, and audit events.
- [ ] Add malware/safety scan gates before publication.
- [ ] Verify support service takedown/refund/appeal/chargeback flows connect to actual content, payment, user, and audit records.

## P1 - Admin, Support, And Operations

- [ ] Complete admin/backoffice APIs from the docs: user management, content publish/unpublish, reality show/contestant management, creator verification, payout review, moderation queue, reward rules, admin analytics, audit logs.
- [ ] Ensure admin user suspension is persisted with reason, duration, end date, actor ID, audit log, and notification.
- [ ] Complete support service auth/roles. Current support controllers have placeholder guard comments and untyped `req: any`.
- [ ] Add support workflow tests for refunds, chargebacks, takedowns, appeals, disputes, escalation, assignment, and closure.
- [ ] Connect support workflows to payment provider refunds, wallet reversal, content access revocation, evidence storage, and user notifications.
- [ ] Ensure every sensitive admin/support action has a tamper-resistant audit trail.

## P1 - Infrastructure And Deployment

- [ ] Reconcile service ports across `CLAUDE.md`, README, service `main.ts`, docker-compose, Kubernetes, and gateway targets.
- [ ] Add gateway routes/manifests for newly added services such as support-service and all universe services.
- [ ] Validate Dockerfiles/build contexts for all deployable packages, including newly added universe services and support service.
- [ ] Validate Kubernetes base manifests include resource requests/limits, probes, network policies, pod disruption budgets, TLS/ingress, secrets, and staging/production overlays.
- [ ] Make CI run the same gates locally required here: install, generate Prisma, build, lint, test, migrations, web build, mobile export, Docker smoke, generated artifact check, and secret scan.
- [ ] Add backup/restore verification jobs and documented RPO/RTO acceptance tests.

## P2 - Shared Packages And Code Quality

- [ ] Standardize all response envelopes on `@azeebo/shared-types`/`ApiResponseWrapper`. Several modules still return ad hoc `{ success, data }` shapes.
- [ ] Remove `unknown as` casts across service responses and JSON metadata where proper DTOs/shared types can express the shape.
- [ ] Replace broad `any` types in support service, mobile contexts, web hooks, analytics/performance utilities, and shared UI hooks.
- [ ] Replace direct `axios` service-to-service calls with typed API clients, message queues, or gateway/internal service clients with retries, timeouts, idempotency, and trace headers.
- [ ] Ensure request ID propagation and structured logger usage across all services.
- [ ] Add package-level README or ownership notes for each shared package and deployable service.

## P2 - Testing Strategy

- [ ] Add tests where packages currently have none, starting with `apps/admin`.
- [ ] Replace mock-only “integration” tests with test-database integration tests for auth, wallet, payments, webhooks, moderation, content, and universe monetization flows.
- [ ] Add gateway contract/E2E tests that prove public clients cannot drift from service routes.
- [ ] Add Playwright E2E coverage for core web journeys.
- [ ] Add Expo/mobile smoke tests for onboarding, watch, vote, wallet, rewards, creator upload, movie detail, gameplay, profile, and offline/error states.
- [ ] Add payment/webhook idempotency tests for duplicate provider events and retry storms.
- [ ] Add accessibility tests for web and mobile: focus states, labels, contrast, reduced motion, keyboard/screen reader basics.

## P2 - Claude Build Workflow Alignment

- [ ] Keep `CLAUDE.md` current with the actual architecture. It currently says each universe has a dedicated service in `services/`, while the Claude build doc recommends universe modules under `modules/`; document the final decision clearly.
- [ ] Finish the workflow docs implied by the Claude build manual: `/build-screen`, `/review-module`, `/add-analytics`, `/qa-pass`, `/refactor-shared`, `/prepare-pr`.
- [ ] Move or mirror docs into the recommended structure: `docs/product`, `docs/design`, `docs/engineering`, `docs/api`, `docs/qa`.
- [ ] Add review automation/checklists that enforce no duplicate wallet/payment logic, analytics coverage, all UI states, no hardcoded prices, proper mobile-first design, and tests.

## P2 - Documentation Cleanup

- [ ] Update README to reflect the actual current package list, service ports, gateway base URL, mobile setup, Prisma generation, build/test/lint status, and known blockers.
- [ ] Update `guide.md` to remove stale commands and align with the current route map and migration discipline.
- [ ] Make `docs/API_ROUTE_MAP.md` match both the product spec and implemented controllers.
- [ ] Document generated artifact policy and cleanup process.
- [ ] Document rollout order and MVP scope: Foundation, Reality, Creator, Lifestyle, Games, Comedy, Sports, Vertical, Movie.
