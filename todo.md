# Azeebo+ Todo List

This file tracks all engineering tasks and issues to address in the codebase. Follow Azeebo+ Engineering Rules for priorities and quality standards.

## Critical Security & Quality Issues

| # | File | Issue | Line / Context | Severity | Suggested Fix |
|---|------|-------|----------------|----------|---------------|
| 1 | `packages/error-handling/types/ReducingInput.ts` | Uses `any` type for input | `type ReducingInput = any;` | HIGH | Replace with explicit generic types (e.g., `type ReducingInput<T> = (input: T) => T;`) |
| 2 | `packages/opentelemetry/dataInterfaces.ts` | Hard‑coded price values | `price: 99.99;` (search for any literal price) | HIGH | Move all pricing constants to a centralized config file (`config/pricing.ts`) and reference via env variables |
| 3 | Various services (e.g., `services/core/auth-service/src/modules/auth/auth.service.ts`) | console.log or debug statements left in production code | `console.log('Debug info:', ...);` | HIGH | Replace with `logger.debug()` from shared logger and ensure logger is configured for production filtering |
| 4 | Many modules (`services/core/*/health.controller.ts`) | Missing public health check endpoint (`GET /health`) or incomplete implementation | No `health` route exported or missing DB connection check | HIGH | Add a standardized health controller that returns 200 OK and performs a simple DB ping (`await prisma.$queryRaw('SELECT 1');`) |
| 5 | `services/core/payment-service/src/modules/payment/payment.service.ts` | Missing idempotency key validation on refund/payment endpoints | No check for `Idempotency-Key` header or stored token | HIGH | Implement idempotency logic using Redis with 5‑second TTL and strict key mapping |
| 6 | `services/core/wallet-service/src/modules/wallet/wallet.service.ts` | No audit trail for wallet transactions | No ledger entry on charge/debit | HIGH | Add entries to `wallet_ledger` table with `operation_type`, `amount`, `timestamp`, and `user_id` |
| 7 | Multiple services (e.g., `services/universes/*`) | Re‑implementation of similar utility functions (e.g., validation, response formatting) | Duplicate `toSuccessResponse` helpers | MEDIUM | Extract shared utilities into `packages/shared-utils/` and import across services |
| 8 | Several services (e.g., `services/engagement/*`) | Inconsistent analytics event naming (snake_case vs camelCase) | `event_name: 'reality_vote_created'` vs `'RealityVoteCreated'` | MEDIUM | Enforce a naming convention in a shared `AnalyticsEvent` enum and lint rule |
| 9 | `services/intelligence/*` | Missing unit/integration test coverage for new features | No test files under `*.test.ts` for recent modules | MEDIUM | Add test scaffolding using Jest + ts-jest; target 80% coverage |
|10 | `services/core/search-service/src/services/search/search.service.ts` | Potential N+1 query issue in search index refresh | Loop over results and query DB per item | MEDIUM | Use batch fetching or `SELECT ... WHERE id IN (...)` to reduce round trips |
|11 | `packages/auth/auth.strategy.ts` | Duplicate JWT strategy definitions across modules | Two separate `JwtStrategy` classes with identical logic | LOW | Consolidate into a single shared strategy and inject via NestJS provider |
|12 | `packages/shared/types/BaseEntity.ts` | Multiple definitions of base entity interface causing conflicts | Duplicate interface names across packages | LOW | Merge into a single canonical definition and export from `packages/shared-types` |

## Redundant Code & Code Smells

- Duplicate JWT strategy implementations (see #11).  
- Repeated base entity definitions (see #12).  
- Hard‑coded strings for regex patterns; extract to constants.  
- Unused imports and dead code in several modules (`src/modules/*/unused-imports.ts`).  

## Testing Gaps

- No unit tests for `packages/logger/logger.middleware.ts`.  
- No integration tests for `services/operations/queue-service/src/workers/queue.worker.ts`.  
- Missing e2e tests for payment success/failure flow (`payment.e2e-spec.ts` only covers success path).  

## Analytics & Event Coverage

- Missing conversion events on checkout success pages (`web/src/pages/CheckoutSuccess.tsx`).  
- Inconsistent event payload shapes across services; adopt a shared `EventPayload` interface.

## Wallet & Payment Refactoring

1. Create a shared `WalletService` interface in `packages/shared-services/` and have `core/wallet-service` implement it.  
2. Move all idempotency handling to a utility library (`packages/shared-utils/idempotency.ts`).  
3. Centralize all price constants (`PRICE_CONFIG`) to avoid hard‑coding.  

## Documentation & Standards

- Update `ARCHITECTURE.md` to reflect new health‑check contract and wallet‑payment flow diagrams.  
- Add a lint rule to enforce `no-console-log` in production builds.  
- Ensure all services adopt the same `Swagger`/OpenAPI spec version; run `swagger-cli validate` as part of CI.  

## Task Management

Create tasks for each row in the table above using `TaskCreate`. Example:

```
/task/create subject="Implement health check for auth-service" description="Add GET /health endpoint with DB ping" priority="high"
```

Then assign owners, set due dates, and mark progress as `in_progress` when work begins.

--- 

This `todo.md` now serves as the master backlog. Use the listed tasks to drive incremental improvements while adhering to Azeebo+ Engineering Rules.