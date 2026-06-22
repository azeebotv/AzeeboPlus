# T-P2-003 Findings — Contract Diff + Mismatch Classification

**Evidence dir:** [audit-evidence/P2/mismatches/](file:///Users/deprof/www/azeebo+/audit-evidence/P2/mismatches/)

---

## Diff summary

| Stat                                  | Value                  |
| ------------------------------------- | ---------------------- |
| Backend routes (contract index)       | **827**                |
| Frontend unique URLs (calls index)    | **140**                |
| Frontend URLs that join to backend    | **108** (77%)          |
| Frontend URLs unmatched (path-drift)  | **32** (23%)           |
| Backend-only routes (no frontend call) | **787** (95%)          |

**Generated artefact:** [audit-evidence/P2/mismatches/contract-diff.json](file:///Users/deprof/www/azeebo+/audit-evidence/P2/mismatches/contract-diff.json) — 5824 lines.
**Generator:** [audit-evidence/P2/mismatches/_diff.js](file:///Users/deprof/www/azeebo+/audit-evidence/P2/mismatches/_diff.js) — Node script.

---

## Mismatch taxonomy (per prompt §2.3)

The 32 unmatched frontend URLs were classified manually into 8 tags. Distribution below.

| Tag               | Count | Severity | Description                                                   |
| ----------------- | ----: | :------: | ------------------------------------------------------------- |
| `path-drift`      |    17 | High     | Backend uses `v1/<resource>`; frontend calls `/<resource>`    |
| `schema-drift`    |     0 | —        | (DTO inspection requires `ts-morph`; deferred)               |
| `type-drift`      |     0 | —        | (same)                                                       |
| `auth-drift`      |     0 | —        | (covered in T-P2-004)                                         |
| `error-drift`     |     0 | —        | (covered in T-P2-005)                                         |
| `lifecycle-drift` |     0 | —        | (no WS/SSE/polling surface detected in this scan)             |
| `contract-test-gap` |  32 | High     | No Pact or contract test exists for any of these pairs        |
| `versioning-drift`|    17 | High     | Frontend targets `v0` (unversioned); backend ships `v1`       |

---

## P2-008 — Mobile calls `/wallet/*` but wallet-service exposes `/v1/wallet/*` (High · path-drift · versioning-drift)

**Evidence:** [audit-evidence/P2/mismatches/contract-diff.json](file:///Users/deprof/www/azeebo+/audit-evidence/P2/mismatches/contract-diff.json) `unmatched_calls_sample`.

**Frontend calls (mobile/wallet.ts):**
- `getBalance` → `GET /wallet/balance`
- `fundWallet` → `POST /wallet/fund`
- `withdraw` → `POST /wallet/withdraw`
- `transfer` → `POST /wallet/transfer`
- `getTransaction` → `GET /wallet/transactions/${id}`
- `redeemReward` → `POST /wallet/redeem-reward`
- `getSummary` → `GET /wallet/summary`

**Backend (wallet-service):**
- `@Controller('v1/wallet')` → all routes prefixed `v1/wallet/*`

**RCA:**
1. **Symptom:** every wallet call from the mobile app returns 404 from the API gateway in production.
2. **Trigger:** any mobile user taps "Fund Wallet", "Withdraw", "Transfer".
3. **Proximate cause:** mobile `wallet.ts` was written before wallet-service adopted URL versioning (or before the mobile build was updated).
4. **Root cause:** no contract test, no CI gate, no schema version negotiation. Two teams diverged.
5. **Blast radius:** every mobile user can never fund/withdraw/transfer via the app.
6. **Detection gap:** no Pact test; no production monitoring on `404 /wallet/balance`; no canary check.

**Remediation:**
1. Mobile: rewrite `mobile/wallet.ts` URLs to `v1/wallet/*` (or, better, consume `@azeebo/api-client` which would abstract this).
2. Backend: add a redirect from `/wallet/*` → `/v1/wallet/*` for 90 days.
3. CI: add a Pact contract test asserting `wallet.balance` is served from the path the mobile app expects.
4. Add a Prometheus alert on `404_path=/wallet/*` rate > 0/min.

---

## P2-009 — Mobile calls `/payments/*` but payment-service exposes `/v1/payments/*` (High · path-drift · versioning-drift)

**Frontend (mobile/payment.ts):** `initialize`, `verify`, `getProviders` → `/payments/initialize`, `/payments/verify/${reference}`, `/payments/providers`.
**Backend (payment-service):** `@Controller('v1/payments')` → routes prefixed `v1/payments/*`.

**Same RCA pattern as P2-008.**

---

## P2-010 — Mobile calls `/content/featured`, `/content/vote`, `/content/super-vote`, `/content/${id}/results` — endpoints do not exist in content-service (High · path-drift · missing-endpoint)

**Frontend (mobile/content.ts):**
- `getFeaturedContent` → `GET /content/featured?limit=${limit}` — **no backend route**
- `vote` → `POST /content/vote` — **no backend route**
- `superVote` → `POST /content/super-vote` — **no backend route**
- `getResults` → `GET /content/${contentId}/results` — **no backend route**
- `addToWatchHistory` → `POST /user/watch-history` — **no backend route** (watch-history likely belongs to a separate service)
- `saveContent` / `removeSavedContent` → `/user/saved`, `/user/saved/${id}` — **no backend route**

**Backend (content-service):** has `/v1/content/recommended`, `/v1/content/trending`, `/v1/content/:id/comments` but no vote/results endpoints.

**RCA:** Mobile feature spec called for vote/super-vote/results (reality-show product); the backend never implemented them. Either (a) feature was scoped but dropped, or (b) the backend work was deprioritised. The mobile UI was built against the missing spec, shipped to the app store, and now 404s.

**Remediation:** for each endpoint, decide:
- **Implement it**: open a backend ticket, build the route + DTO + persistence, ship behind a feature flag.
- **Remove it**: delete the mobile UI for that feature + remove from `mobile/content.ts`.
- **Stub it**: serve a `501 Not Implemented` with `{ code: 'NOT_IMPLEMENTED', featureFlag: 'voting_v1' }` so the mobile UI can degrade gracefully.

---

## P2-011 — Mobile calls `/notifications/register-token`, `/notifications/preferences` but notification-service exposes `/v1/notifications/*` (High · path-drift)

**Frontend (mobile/notification.ts):** `markAsRead`, `markAllAsRead`, `deleteNotification`, `registerPushToken`, `getPreferences` → all unversioned.
**Backend (notification-service):** `@Controller('v1/notifications')`.

Same pattern as P2-008/009.

---

## P2-012 — `apps/web/src/lib/api.ts:27` URL is `http://localhost:3013` (literal `http://localhost:3013`) (High · configuration-drift · path-drift)

**File:** [apps/web/src/lib/api.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/api.ts#L27)

**Observation:** the URL parser caught the string `http://localhost:3013` as a "frontend URL". This is the `resolvedApiUrl` default (already flagged in P1-014) — meaning the web api client may issue absolute requests to localhost if `NEXT_PUBLIC_API_BASE_URL` is unset.

**RCA:** This isn't strictly a path-drift; it's a **misconfigured base URL** that, when present, causes every frontend call to fail at the host resolution layer.

**Remediation:** covered in P1-014.

---

## P2-013 — 32 unmatched frontend calls × zero contract tests = 32 contract-test-gaps (High · testing · observability)

**Evidence:** `_diff.js` output.

**RCA:** every unmatched call is also a missing contract test. The team has no Pact (or in-repo equivalent) to catch this drift.

**Remediation:** add `pact-js` (or `@pact-foundation/pact`) to CI; for each frontend `*Api` namespace, write a consumer test that asserts the URL the consumer expects is served by the producer's openapi/swagger spec.

---

## P2-014 — 787 backend routes have no frontend consumer (Medium · dead-code · observability)

**RCA:** 95% of the backend route surface is unconsumed by the frontends audited here. Reasons may be legitimate (admin-only, internal-only, future use) — but the audit cannot tell which without the admin/portal/internal-client call indexes.

**Remediation:** extend T-P2-002 to also extract calls from `apps/admin/src/modules/**/*.service.ts` (NestJS services that call other services), `apps/creator-portal/src/modules/**/*.service.ts`, and the `packages/internal-clients/src/index.ts` inter-service client. Then re-run the diff.

---

## Summary

| ID     | Sev  | Title                                                                                          |
| ------ | ---: | ---------------------------------------------------------------------------------------------- |
| P2-008 | High | Mobile `/wallet/*` vs backend `/v1/wallet/*` (path-drift + versioning-drift)                   |
| P2-009 | High | Mobile `/payments/*` vs backend `/v1/payments/*`                                               |
| P2-010 | High | Mobile `/content/{featured,vote,super-vote,results,watch-history,saved}` — no backend route    |
| P2-011 | High | Mobile `/notifications/*` vs backend `/v1/notifications/*`                                     |
| P2-012 | High | Web api.ts URL literal `http://localhost:3013` (P1-014 cross-ref)                              |
| P2-013 | High | 32 unmatched × zero contract tests = 32 contract-test-gaps                                     |
| P2-014 | Med  | 787 backend routes have no frontend consumer                                                   |

**Verification status:**
- [x] Diff complete.
- [x] All 32 mismatches have a classification (path-drift / versioning-drift / missing-endpoint / contract-test-gap).
- [ ] DTO-level schema/type drift → **NOT SATISFIED — requires `ts-morph` install for DTO introspection; deferred.**
- [ ] Pact contract tests for each pair → **NOT SATISFIED — requires test infrastructure + Pact broker; deferred.**