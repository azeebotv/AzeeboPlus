# Azeebo+ Production Readiness Tasks

This checklist is ordered chronologically: finish each phase before relying on the next one. The project currently has promising structure, but it is not production-ready yet. The biggest blockers are broken workspace verification, inconsistent API contracts, duplicated/inconsistent database schemas, committed generated artifacts, weak security boundaries, and incomplete operational readiness.

## Phase 0 - Repository Baseline And Hygiene

1. Convert this folder back into a real Git repository or move it into the intended repository checkout.
   - Current check: `git status --short` fails with `fatal: not a git repository`.
   - Production work needs reviewable diffs, CI, release tagging, and rollback history.

2. Remove committed/generated artifacts from source control and enforce ignore rules.
   - Remove checked-in `node_modules`, `dist`, `.next`, `*.tsbuildinfo`, generated Prisma clients under `src/prisma/client`, and generated app Prisma clients under `src/generated/prisma`.
   - Keep generation as a build step, not committed source.
   - Confirm `.gitignore` covers all generated paths; it currently has good intent but generated folders are still present in the workspace.

3. Normalize workspace package ownership.
   - Decide whether `modules/*` are deployable services, shared feature packages, or legacy duplicates.
   - Remove or merge duplicates such as `services/vertical-service` vs `modules/vertical-service` and `services/lifestyle-service` vs `modules/lifestyle-service`.
   - Ensure every workspace package has a clear owner, README, scripts, and release/deploy status.

4. Add a root `README.md` focused on real local development.
   - `guide.md` is broad and includes deployment examples, but the repo still needs a concise bootstrap path: install, env, db, generate Prisma, migrate, build, test, run.
   - Document the canonical API base URL and gateway route format.

5. Add a canonical `.env.example` contract and validate it against service-specific `.env.example` files.
   - `services/analytics-service` is missing `.env.example`.
   - Avoid committing real `.env` files. Existing `.env`, `apps/web/.env`, and `services/content-service/.env` must be rotated if they contain secrets.

## Phase 1 - Make The Workspace Build, Lint, And Test

6. Fix the admin build failures first.
   - `pnpm -r build` currently fails in `apps/admin`.
   - Add missing `helmet` dependency or remove the import.
   - Fix bad imports of `Prisma` from `../../database/prisma.service`.
   - Reconcile `apps/admin/src/modules/user-management/user-management.service.ts` with the Prisma schema; it updates a `status` field that does not exist on `User`.

7. Replace invalid Jest scripts across services and modules.
   - `pnpm -r test` currently fails immediately because packages use `jest --run`, which is not a Jest option.
   - Use `jest`, `jest --runInBand`, or a consistent Vitest migration if that was intended.

8. Fix root lint execution.
   - `pnpm -r lint` currently fails in `apps/web`.
   - Remove unused state such as `error` in `apps/web/src/app/page.tsx` or render it properly.
   - Replace browser/client `console.*` usage with the project logger or guarded development-only logging.
   - Apply Prettier formatting to `apps/web/src/context/AuthContext.tsx` and `apps/web/src/lib/api.ts`.

9. Add missing lint/test/build scripts to incomplete workspace packages.
   - `services/search-service/package.json` has no scripts.
   - `services/shared/queue/package.json` is empty.
   - `services/media-service` has no test script.
   - Every workspace package should support the root `build`, `lint`, and `test` contract or be explicitly excluded.

10. Add CI that runs the same gates as local development.
   - Install, Prisma generate, typecheck/build, lint, unit tests, selected integration tests, web build, mobile static checks, Docker build smoke test.
   - Fail on generated artifacts, real `.env` files, and unchecked package drift.

## Phase 2 - Fix API Contract Drift

11. Define one canonical API route map.
   - The web client calls routes like `/auth/register`, `/auth/refresh`, `/user/profile`, and `/content/featured`.
   - The auth service exposes `POST /v1/auth/auth/signup`, `POST /v1/auth/auth/login`, `POST /v1/auth/auth/refresh-token`, `DELETE /v1/auth/auth/logout`, and `GET /v1/auth/auth/me` because of combined global prefix and controller path.
   - The API gateway exposes `/api/:service/*` and `/api/:version/:service/*`.
   - Pick one public contract, update the gateway, clients, docs, and tests to match it.

12. Standardize auth response shapes.
   - `AuthService.register/login` returns `{ token }`, but `apps/web/src/context/AuthContext.tsx` expects `access_token` and `refresh_token`.
   - `refreshToken` responses use `token`/`refreshToken`, while clients expect `access_token`/`refresh_token`.
   - Choose camelCase or snake_case and enforce it through shared types.

13. Fix refresh-token generation and persistence.
   - `AuthService.generateTokens()` creates a UUID refresh token but verifies refresh tokens as JWTs.
   - It calls `authRepository.createSession(...)` without `await`, so session persistence can race or fail silently.
   - Either issue signed refresh JWTs and store hashed token IDs, or treat refresh tokens as opaque random secrets and verify by hashed lookup only.

14. Align frontend registration DTOs.
   - Auth service expects `displayName`.
   - Web client sends `name`.
   - Mobile register screen also needs to be checked against the same DTO.

15. Fix gateway service port and path mapping.
   - `docker-compose.yml` and `ProxyController` disagree on several defaults, including wallet/content/notification/search/analytics/moderation/recommendation ports.
   - Gateway route forwarding currently assumes the captured wildcard path maps directly to upstream paths, but upstream services also use prefixes.
   - Add contract tests that prove `/api/v1/auth/login`, `/api/v1/content/trending`, `/api/v1/wallet/balance`, and admin routes reach the intended handlers.

16. Harden gateway proxy behavior.
   - Preserve upstream status codes and non-JSON responses.
   - Do not cache authenticated GET responses unless cache keys include user identity and authorization context.
   - Forward request IDs, auth headers, content type, and trace headers safely.
   - Add upstream timeouts, retries only for safe/idempotent requests, circuit breakers, and structured error responses.

## Phase 3 - Data Model And Persistence

17. Decide between one database schema or true service-owned schemas.
   - Many services define overlapping `User`, `Wallet`, `ContentItem`, `PaymentIntent`, and `WatchHistory` models with divergent fields.
   - A microservice system should either own separate schemas/databases per service or use one canonical shared schema with clearly owned modules.

18. Replace money `Float` fields with decimal-safe types.
   - Wallet and payment amounts use `Float`, which is unsafe for money.
   - Use Prisma `Decimal`/Postgres `numeric`, centralize currency handling, and add rounding rules.

19. Add idempotency and uniqueness for money-moving operations.
   - Wallet funding, payment verification, webhook handling, refunds, credits, debits, promo credits, and reward redemption need idempotency keys and unique provider references.
   - Duplicate webhooks must not double-credit wallets.

20. Make wallet operations fully transactional.
   - `addBonusCredit` and `addPromoCredit` create a transaction and update the wallet outside a database transaction.
   - Return actual new balances, not the transaction amount.
   - Add row-level locking or optimistic concurrency consistently across debit and credit paths.

21. Add migration discipline.
   - Replace ad hoc `prisma db push` usage with versioned migrations.
   - Add migration checks in CI.
   - Add seed scripts that are idempotent and environment-safe.

22. Remove hard-coded seed credentials.
   - `prisma/seed/admin.sql` documents `admin123`.
   - Production admin bootstrap should generate a temporary secret, force rotation, and avoid committing password hashes tied to known passwords.

## Phase 4 - Security And Compliance

23. Centralize environment validation at service startup.
   - Validate required variables with a schema in every service.
   - Fail fast for missing secrets, invalid URLs, weak JWT secrets, and production localhost defaults.

24. Lock down CORS and Swagger by environment.
   - Several services default to `http://localhost:3000`.
   - Production should require explicit `ALLOWED_ORIGINS`.
   - Swagger docs should be disabled, protected, or separately deployed in production.

25. Fix webhook signature verification.
   - Paystack and Flutterwave signatures should be calculated from the raw request body, not `JSON.stringify(request.body)`.
   - Use constant-time comparison.
   - Add replay protection where providers support event IDs/timestamps.

26. Secure token storage on web and mobile.
   - Web currently stores user data in `localStorage` and keeps tokens in memory only, which breaks refresh after reload and is not a complete session strategy.
   - Decide between HTTP-only secure cookies or a hardened token storage strategy.
   - Mobile should use secure storage for tokens, not plain state or async storage.

27. Finish rate limiting and abuse protection.
   - Confirm `RateLimitGuard` uses a distributed Redis store and real client IP extraction behind proxies.
   - Add limits for login, signup, OTP, password reset, webhooks, uploads, comments, search, and payment initialization.

28. Remove sensitive logging.
   - `services/auth-service/src/modules/auth/otp/otp.service.ts` logs OTP values.
   - Mobile notification code logs push tokens.
   - Replace all production `console.*` with structured logs that redact secrets and PII.

29. Add authorization tests for every privileged route.
   - Admin moderation, user management, content publishing, wallet audit, payout, creator tools, and moderation actions need role checks and negative tests.

30. Add content security and upload controls.
   - Enforce file type, extension, MIME sniffing, size, duration, malware scanning, and moderation status before publication.
   - Store uploads outside the app container and serve via signed CDN URLs.

## Phase 5 - Service Completeness

31. Replace placeholder provider implementations.
   - Payment providers contain comments that webhook processing is a placeholder.
   - Implement real Paystack/Flutterwave event mapping, verification, retry, refund, transfer, and reconciliation flows.

32. Finish media processing.
   - `TranscodingService`, thumbnails, signed URLs, CDN paths, lifecycle cleanup, and failed job recovery need production behavior.
   - Add queue-backed transcoding with status updates and user-visible processing states.

33. Make moderation real and auditable.
   - `moderation.service.ts` contains mock safety action data.
   - Add case lifecycle, reviewer assignment, audit log, appeal flow, policy categories, and automated/manual decision tracking.

34. Complete search and recommendation contracts.
   - Search service has no package scripts and needs indexing, pagination, filters, ranking, and reindex jobs.
   - Recommendation service needs a defined fallback strategy, feature inputs, freshness rules, and explainability fields.

35. Clarify vertical/module services.
   - Comedy, reality, sports, games, movie, lifestyle, vertical, and creator services need product-level contracts, ownership, data dependencies, and tests.
   - Remove duplicate service copies where they do not represent real deployable boundaries.

36. Add notification delivery reliability.
   - Email, SMS, push, templates, user preferences, retry schedules, suppression lists, bounce handling, and provider failover need to be productionized.

## Phase 6 - Frontend And Mobile Readiness

37. Align web app routes with backend contracts.
   - Pages currently assume content endpoints like featured, related, creator content, signed media URLs, auth refresh, and profile routes that are not proven against services.
   - Add typed API integration tests or mocked contract tests.

38. Implement real authenticated route handling.
   - Add server/client guards for admin, library, creators, wallet, profile, and watch pages.
   - Handle expired sessions, refresh failure, logout everywhere, and unauthorized redirects consistently.

39. Improve web app error, empty, and loading states.
   - Current home page records an error but does not render it.
   - Add empty states for no content, no wallet, no transactions, failed video load, failed payment, and maintenance mode.

40. Complete mobile API integration and secure session persistence.
   - `apps/mobile/src/api/client.ts` defaults to `http://localhost:3000`, which fails on devices.
   - Configure environment-specific API URLs, secure token storage, refresh flow, offline handling, and push token registration lifecycle.

41. Add accessibility and UX checks.
   - Validate keyboard navigation, focus states, contrast, reduced-motion behavior, form labels, error messages, and screen reader semantics.

42. Add real media playback testing.
   - Verify protected video playback, signed URL expiry, resume progress, watch history, comments, and device/browser compatibility.

## Phase 7 - Observability And Operations

43. Standardize structured logging.
   - Use one logger package across services.
   - Include request ID, user ID when safe, service name, route, latency, status, and trace IDs.

44. Add metrics and tracing.
   - Expose Prometheus metrics for HTTP latency, errors, queue depth, payment events, wallet ledger failures, media processing, search latency, and database health.
   - Add OpenTelemetry tracing through gateway, services, queues, and external providers.

45. Strengthen health checks.
   - Separate liveness and readiness.
   - Readiness should verify database, Redis, queue, external provider configuration, and required migrations where appropriate.

46. Add audit logs for sensitive actions.
   - Auth changes, admin changes, wallet movements, payment callbacks, refunds, content publication, moderation decisions, and user role changes need tamper-resistant audit records.

47. Add backup, restore, and disaster recovery runbooks.
   - Kubernetes includes a backup cronjob, but the project needs tested restore steps, RPO/RTO targets, encryption, and retention policy.

## Phase 8 - Infrastructure And Deployment

48. Fix Docker Compose correctness.
   - Compose references many services and apps; verify every build context exists and every healthcheck hits the actual internal port.
   - `queue-service` healthcheck points to `http://localhost:3015` inside the container while most services listen on `3000`.
   - Web `NEXT_PUBLIC_API_BASE_URL` points at `http://localhost:3001`, bypassing the gateway.

49. Add Dockerfiles or deployment decisions for all deployable packages.
   - Modules and mobile currently lack Dockerfiles, which may be fine only if they are not deployables.
   - Document and enforce that distinction.

50. Fix Kubernetes manifests.
   - Secret key casing is inconsistent (`DATABASE_URL` vs `database-url`, `JWT_SECRET` vs `jwt-secret`).
   - Add resource requests/limits, probes, pod disruption budgets, network policies, TLS, ingress routing, and environment overlays.

51. Add production image hardening.
   - Multi-stage builds, non-root users, minimal runtime images, deterministic installs, Prisma generation in build, and vulnerability scanning.

52. Add release environments.
   - Define local, test, staging, and production env files/secrets.
   - Add promotion flow, smoke tests, rollback strategy, and database migration approval.

## Phase 9 - Testing Strategy

53. Expand unit tests around high-risk domains.
   - Auth token rotation, rate limits, OTP, password reset, wallet ledger, payment verification, webhook idempotency, content publish flow, moderation, and gateway proxying.

54. Add real integration tests with test databases.
   - Current “integration” tests mostly mock Prisma.
   - Use isolated Postgres/Redis test containers and run migrations before tests.

55. Add contract tests between clients, gateway, and services.
   - Generate or validate OpenAPI specs.
   - Ensure frontend/mobile clients cannot drift from service routes and response shapes.

56. Add E2E tests for critical user journeys.
   - Signup, login, browse, watch, save, fund wallet, payment callback, creator upload, admin moderation, search, logout.

57. Add load and resilience tests.
   - Extend `infra/load-testing/load-test.js` for authenticated flows, media URLs, payment-safe dry runs, search, and gateway fanout.
   - Add failure injection for Redis, database latency, provider timeout, and queue retry storms.

## Phase 10 - Product And Compliance Finishing

58. Define production privacy and legal requirements.
   - Terms, privacy policy, cookie consent where applicable, data retention, account deletion/export, age gating if required, creator payout terms, and content rights records.

59. Add support and admin operations workflows.
   - User suspension, refund handling, chargeback handling, content takedown, creator verification, payout review, incident notes, and manual ledger adjustments.

60. Add analytics governance.
   - Ensure analytics events have a schema, consent handling, PII redaction, retention policy, and dashboard ownership.

61. Complete documentation for operators.
   - Runbooks for deploys, migrations, incident response, provider outages, failed payments, queue backlog, media processing failures, and database restore.

62. Run the final production gate.
   - `pnpm install --frozen-lockfile`
   - `pnpm -r build`
   - `pnpm -r lint`
   - `pnpm -r test`
   - Prisma migration check
   - Docker Compose smoke test
   - Kubernetes dry-run validation
   - Web E2E suite
   - Mobile build/export check
   - Dependency/license/security audit
   - Load test against staging

