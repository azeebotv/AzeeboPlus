# TV Sign-In Rollout Plan — `auth_device_link`

Operational plan for staging the device-link TV sign-in flow
(`POST /auth/device/link[/info|/poll|/confirm|/deny]`, the TV `signin` screen, and the
web `/link` activation page) behind the `auth_device_link` flag.

Follows the general [feature flag rollout policy](./feature-flag-rollout-policy.md);
this document is the flag-specific application of it.

---

## What the flag gates

| Surface | Auth | Behavior when flag is OFF |
|---|---|---|
| `POST /auth/device/link` (initiate) | public | 403 — FeatureFlagGuard denies |
| `POST /auth/device/link/poll` | public | 403 — polls stop with backoff |
| `POST /auth/device/link/info` | JWT (phone/web) | 403 — `/link` page shows a retryable error |
| `POST /auth/device/link/confirm` / `deny` | JWT (phone/web) | 403 — `/link` page shows a retryable error |
| TV `signin` screen | — | Shows "TV code sign-in is not available yet on this device — check back soon." (distinguishes flag-off 403 from network errors) |
| TV home | — | Redirects unauthenticated TVs to `signin`; the screen above renders the flag-off message |

The flag is registered in **both** services that touch it:

- `auth-service` `app.module.ts` — `defaultFlags: { [authFlags.deviceLink]: false }`
  (runtime default; endpoints fail closed while the flag has never been written).
- `apps/admin` `app.module.ts` — same default (visibility: puts the flag in the
  admin **Global Flags** page so ops can stage it *before* the first Redis write
  exists; see the queue-service DLQ knobs precedent in the same module).

The key itself is compile-time typed in `packages/feature-flags/src/registries.ts`
(`authFlags.deviceLink = 'auth_device_link'`) — the admin "Known flags reference"
and its `auth-service` context badge derive from that registry automatically.

## Pre-flight (before Stage 1)

1. **Deploy the code** with the flag defaulting to off everywhere (it does).
2. **Migration**: `device_link_codes` table must exist
   (`services/core/auth-service/prisma/migrations/20260914000000_device_link_codes`).
3. **Env**: optional `DEVICE_LINK_HASH_SECRET` (falls back to a digest derived
   from `JWT_ACCESS_SECRET`) and `DEVICE_LINK_POLL_INTERVAL` (default 5s) —
   see `services/core/auth-service/.env.example`. If the hash secret is ever
   rotated, every pending in-flight code dies; that is acceptable (TVs show the
   "get a new code" path) but choose a quiet window.
4. **Web**: confirm `app.azeeboplus.com/link` resolves to the web `/link`
   activation page in production (the TV screen displays this URL verbatim).
5. **Smoke**: with the flag still off, a TV dev build should show the
   "not available yet" message — proving the fail-closed path, not just the
   happy path.

## Staging ladder (per policy)

| Stage | Rollout % | User targeting | Gate to advance |
|---|---|---|---|
| 0 — Dark launch | 0% (flag off) | — | Code deployed, migration applied, smoke passed |
| 1 — Dogfood | flag ON + `userIds` = internal test accounts | targeted users only | Staff TVs confirm end-to-end: code scan → confirm at /link → tokens arrive → session persists across TV restart |
| 2 — Controlled | 100% (see "Rollout mechanics" — percentage bucketing is coarse here) | — | 24–48h: no auth-service error spike, no `device_link_*` audit anomalies, support tickets flat |
| 3 — Full | 100% | — | 7d at Stage 2 clean |
| 4 — Remove | — | — | 2 sprints at 100%, set `staleAfter`, then delete the flag and sweep `@FeatureFlag(authFlags.deviceLink)` |

### Rollout mechanics caveat (important)

The initiate/poll endpoints are **unauthenticated** — there is no `userId` to
hash. The flag service buckets anonymous requests by
`anonymousId || key`: without a request-scoped anonymous id, **all** anonymous
callers share one bucket, so `rolloutPercentage: 50` is effectively a
global on/off switch, not a 50% traffic split. Percentages are therefore only
meaningful for the JWT-protected `/info` + `/confirm` + `/deny` endpoints.

- Use `userIds` targeting (Stage 1) — exact control.
- For Stage 2, flip to 100% directly (or accept "all TVs" as the atomic step);
  do not treat an intermediate percentage as a partial TV rollout.
- If per-device fractional rollout is ever wanted, populate
  `request.anonymousId` at the gateway (a stable per-install id from the TV
  client) — the flag service already consumes it.

## Monitoring gates

Standard policy gates apply, plus flag-specific signals:

- `feature_flag_evaluation` metrics for `auth_device_link` (evaluation volume =
  TV poll traffic; a sudden drop usually means TVs gave up).
- Audit trail: `device_link_confirmed` / `device_link_denied` entries in the
  auth-service audit log; a burst of `denied` may indicate phishing-style
  pressure and is a reason to flip the flag off while investigating.
- Rate-limit rejections on `POST /auth/device/link` (10/min/IP), `/poll`
  (30/min/IP), and `/info` (20/min/IP) — sustained 429s from few IPs are
  enumeration attempts; the HMAC storage makes the codes unguessable, but log
  and (optionally) block.
- Redis latency/availability — flag evaluation fails closed; a Redis outage
  reads as "flag off", which is the safe direction for this surface.

## Kill-switch

One admin toggle (Global Flags → `auth_device_link` → off, no deploy):

- In-flight TV screens get 403 on their next poll and stop with the
  "turned off" message — no dangling polling loops.
- Confirmed-but-unclaimed codes stop yielding tokens (poll denied before
  token issuance).
- Already-issued sessions are **JWT sessions like any other**: to force sign-out
  of linked TVs, revoke sessions through the normal session/device management
  flows — the flag gates *new* links only.

Flip-offs are audit-logged (`feature_flag.updated`) per policy.

## Cleanup

After 2 sprints at 100%: set `staleAfter`, let the stale sweep list it, delete
the flag from the registries, both services' `defaultFlags`, and this doc.
Sweep leftover `@FeatureFlag(authFlags.deviceLink)` usages — there should be
exactly the four device-link endpoints.
