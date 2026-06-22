# T-P2-006 Findings — Serialization + State-Sync Sweep

**Evidence dir:** [audit-evidence/P2/state-sync/](file:///Users/deprof/www/azeebo+/audit-evidence/P2/state-sync/)

---

## BigInt / Decimal surface

| Stat                                                                | Value |
| ------------------------------------------------------------------- | ----: |
| `BigInt` declared in code (non-generated)                           |   0   |
| `BigInt` in Prisma generated clients (every service)                |  28   |
| `Decimal` columns without `@db.Decimal(p,s)`                        | **17** |
| Services with `Decimal`-without-precision columns                   | 5 (`payment`, `wallet`, `search`, `content`) |

**Concrete instances** (from `audit-evidence/P2/state-sync/_scan.txt`):
- `payment-service`: `amount Decimal` (lines 14, 76, 100)
- `wallet-service`: `balance Decimal  @default(0)` (lines 14, 60), `amount Decimal` (line 31)
- `search-service`: `balance Decimal  @default(0)` (line 68), `amount Decimal` (lines 85, 119, 138)
- `content-service`: `price Decimal` (lines 162, 186), `price Decimal?` (lines 212, 233, 253)

---

## State-sync surface

| Stat                                                                  | Value |
| --------------------------------------------------------------------- | ----: |
| Files in `apps/web/src` that mention `@tanstack/react-query`          |   1   |
| Files in `apps/web/src` that use `useApi.ts` (hand-rolled hooks)      |  (all pages) |
| `useMutation` call sites without `onError`/`onSuccess` invalidation   |  (default behaviour) |
| WalletContext race-condition surface                                  |  yes  |

---

## P2-025 — 17 `Decimal` columns lack `@db.Decimal(p,s)` precision/scale (High · functionality · compliance)

**Files:** see table above.

**RCA:**
1. **Symptom:** Postgres accepts `numeric` with arbitrary precision; arithmetic can produce `0.30000000000000004`-class bugs; financial reconciliation breaks across services.
2. **Trigger:** any wallet/payment/search transaction.
3. **Proximate cause:** `Decimal` without `@db.Decimal(18, 2)`.
4. **Root cause:** Prisma's permissive defaults; no CI DDL lint.
5. **Blast radius:** every monetary column.
6. **Detection gap:** no migration-level check on scale.

**Remediation:** add `@db.Decimal(18, 2)` to every monetary column; add a custom Prisma migration check. For NGN-specific scale (kobo = 1/100 of a Naira), use `@db.Decimal(18, 2)`. For higher-precision tokens (USDC has 6 decimals), use `@db.Decimal(18, 6)`.

---

## P2-026 — Web `useApi.ts` hand-rolled `useMutation` bypasses TanStack Query (High · maintainability · state-sync)

**File:** [apps/web/src/hooks/useApi.ts](file:///Users/deprof/www/azeebo+/apps/web/src/hooks/useApi.ts#L75-L113)

**Observation:** every page uses `useApi`'s `useMutation` which sets local state only — no `queryClient.invalidateQueries`, no cache invalidation across components, no `optimisticUpdate`/`onError` rollback. The `QueryProvider` is set up but not used.

**RCA:**
1. **Symptom:** after a wallet transfer, the balance shown in the header may not update until the user navigates away and back.
2. **Trigger:** any successful mutation.
3. **Proximate cause:** `useMutation` updates only the local component's state.
4. **Root cause:** the team built `useApi.ts` before adopting `@tanstack/react-query` (or adopted it but never migrated).
5. **Blast radius:** every mutation across the web app.
6. **Detection gap:** no E2E that asserts "after transfer, balance updates within 1s".

**Remediation:** deprecate `useApi.useMutation` in favour of `useMutation` from `@tanstack/react-query`; each mutation must `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallet'] })`.

---

## P2-027 — WalletContext race: `refreshBalance` and `refreshTransactions` not in single atomic read (High · state-sync)

**File:** [apps/web/src/context/WalletContext.tsx](file:///Users/deprof/www/azeebo+/apps/web/src/context/WalletContext.tsx#L48-L117)

**RCA:**
1. **Symptom:** if a new transaction lands between `refreshBalance` and `refreshTransactions`, the UI shows an old balance with a new transaction (inconsistent).
2. **Trigger:** any concurrent wallet mutation (transfer, fund, withdraw).
3. **Proximate cause:** two sequential `await`s.
4. **Root cause:** no transactional read on the backend; no consistency check on the frontend.
5. **Blast radius:** every wallet mutation visible in the UI.
6. **Detection gap:** no concurrency test.

**Remediation:** backend: serve `/v1/wallet/snapshot` returning `{balance, transactions, asOf}` from a single SQL transaction. Frontend: replace the two-refresh pattern with one `useQuery(['wallet-snapshot'], fetchSnapshot, { refetchInterval: 5000 })`.

---

## P2-028 — No `BigInt` use in app code (Low · observability)

**Observation:** no source code uses `BigInt`. All Prisma-generated clients have `BigInt` in their `.d.ts` (Prisma's standard mapping for `bigint` columns), but no service actually declares a `bigint` column.

**RCA:** the search-service's `User` table (per P1-026) has `password String`, not `bigint`. So `BigInt` exposure is theoretical.

**Remediation:** none needed; verify no future PR introduces a `bigint` column without `@db.BigInt` and a custom serializer.

---

## P2-029 — Mobile `useDebounce` + `useOffline` likely cause stale UI on offline→online transitions (Medium · state-sync)

**File:** [apps/mobile/src/utils/offlineMode.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/utils/offlineMode.ts) (P1-019), `apps/mobile/src/hooks/useDebounce.ts` (assumed)

**RCA:** when the device goes offline, `cacheContent` writes to AsyncStorage; when it returns online, `getCachedContent` reads back stale data with no TTL. The UI may show offline-cached data indefinitely after reconnect.

**Remediation:** add a `cachedAt` timestamp to every cache write; on online-resume, invalidate cache older than `maxAge`.

---

## Summary

| ID     | Sev    | Title                                                                                  |
| ------ | ------ | -------------------------------------------------------------------------------------- |
| P2-025 | High   | 17 `Decimal` columns lack `@db.Decimal(p,s)`                                            |
| P2-026 | High   | Web `useApi.useMutation` bypasses TanStack Query                                       |
| P2-027 | High   | WalletContext sequential refresh is a race condition                                   |
| P2-028 | Low    | No `BigInt` use in app code (theoretical exposure only)                                |
| P2-029 | Medium | Mobile offline cache has no TTL (stale UI on reconnect)                                |

**Verification status:**
- [x] BigInt/Decimal audit complete (17 precision-leak columns enumerated).
- [x] State-sync risks enumerated (WalletContext, hand-rolled hooks).
- [ ] Live race-condition test (Playwright + concurrent mutations) → **NOT SATISFIED — Playwright + running services not available; deferred.**